/**
 * 토스 Open API → vr_* 적재 공용 로직. scripts/refresh-toss-prices.ts 와
 * app/api/cron/refresh-prices 가 함께 사용.
 *
 * - 항상: 현재가·1D 등락률·거래량·시총(상장주식수×현재가) → vr_price_snapshots
 *   + ticker.source seed→toss 전환.
 * - fundamentals=true: 52주(≈252거래일) 최고/최저 → vr_metrics_snapshots.
 *   (P/E 등은 토스 Open API 미제공 → 적재하지 않음)
 */
import { db, schema } from "../db";
import { inArray } from "drizzle-orm";
import { getPrices, getStocks, getDailyCandles, get52WeekRange } from "./openapi";
import { ingestVrPrices } from "../sns/ingest";
import type { VrPriceIngest } from "../sns/types";

export interface RefreshResult {
  symbols: number;
  filled: string[];
  priced: number;
  fundamentals: number;
  skipped: string[];
  warnings: string[];
}

export async function refreshTossPrices(opts: { fundamentals?: boolean } = {}): Promise<RefreshResult> {
  const warnings: string[] = [];
  const tickers = await db
    .select({ symbol: schema.vrTickers.symbol })
    .from(schema.vrTickers)
    .where(inArray(schema.vrTickers.active, [true]));
  const symbols = tickers.map((t) => t.symbol);
  if (symbols.length === 0) {
    return { symbols: 0, filled: [], priced: 0, fundamentals: 0, skipped: [], warnings: ["추적 종목 없음"] };
  }

  const [prices, stocks] = await Promise.all([getPrices(symbols), getStocks(symbols)]);
  const priceBy = new Map(prices.map((p) => [p.symbol, p]));
  const stockBy = new Map(stocks.map((s) => [s.symbol, s]));

  const items: VrPriceIngest[] = [];
  const filled: string[] = [];
  const skipped: string[] = [];
  const tickerIdBySymbol = new Map<string, number>();

  for (const symbol of symbols) {
    const p = priceBy.get(symbol);
    if (!p || p.lastPrice == null) {
      skipped.push(symbol);
      continue;
    }
    const price = Number(p.lastPrice);

    let changePct: number | null = null;
    let volume: number | null = null;
    try {
      const candles = await getDailyCandles(symbol, 2);
      if (candles[0]?.volume != null) volume = Number(candles[0].volume);
      const prevClose = candles[1]?.closePrice != null ? Number(candles[1].closePrice) : null;
      if (prevClose && prevClose > 0) changePct = ((price - prevClose) / prevClose) * 100;
    } catch (e) {
      warnings.push(`${symbol} 캔들 실패(등락률 생략): ${e instanceof Error ? e.message : e}`);
    }

    const s = stockBy.get(symbol);
    const shares = s?.sharesOutstanding != null ? Number(s.sharesOutstanding) : null;
    const marketCapNative = shares && shares > 0 ? shares * price : null;

    items.push({
      symbol,
      price,
      changePct,
      volume,
      marketCapNative,
      rawCurrency: p.currency ?? s?.currency ?? null,
    });
    filled.push(symbol);
  }

  if (items.length === 0) {
    return { symbols: symbols.length, filled: [], priced: 0, fundamentals: 0, skipped, warnings };
  }

  await ingestVrPrices(items);

  await db
    .update(schema.vrTickers)
    .set({ source: "toss" })
    .where(inArray(schema.vrTickers.symbol, filled));

  // 펀더멘털(52주 고저) — 옵션
  let fundamentals = 0;
  if (opts.fundamentals) {
    const rows = await db
      .select({ id: schema.vrTickers.id, symbol: schema.vrTickers.symbol })
      .from(schema.vrTickers)
      .where(inArray(schema.vrTickers.symbol, filled));
    for (const r of rows) tickerIdBySymbol.set(r.symbol, r.id);
    const today = new Date().toISOString().slice(0, 10);

    for (const symbol of filled) {
      const tickerId = tickerIdBySymbol.get(symbol);
      if (!tickerId) continue;
      try {
        const range = await get52WeekRange(symbol);
        if (!range) continue;
        await db
          .insert(schema.vrMetricsSnapshots)
          .values({
            tickerId,
            capturedAt: today,
            fiftyTwoWeekHigh: String(range.high),
            fiftyTwoWeekLow: String(range.low),
          })
          .onConflictDoUpdate({
            target: [schema.vrMetricsSnapshots.tickerId, schema.vrMetricsSnapshots.capturedAt],
            set: { fiftyTwoWeekHigh: String(range.high), fiftyTwoWeekLow: String(range.low) },
          });
        fundamentals++;
      } catch (e) {
        warnings.push(`${symbol} 52주 실패: ${e instanceof Error ? e.message : e}`);
      }
    }
  }

  return { symbols: symbols.length, filled, priced: items.length, fundamentals, skipped, warnings };
}

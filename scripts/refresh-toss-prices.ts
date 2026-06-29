/**
 * 토스증권 Open API → vr_price_snapshots 실시세 적재.
 *
 * 추적 중(active)인 vr_tickers 전부에 대해 토스에서 현재가·일봉(등락률·거래량)·
 * 상장주식수(시총)를 받아 새 스냅샷을 넣고, ticker.source 를 'toss' 로 올려
 * "SAMPLE DATA" 배지를 해제한다. 멱등(ingest 는 upsert).
 *
 *   npm run refresh:toss
 *
 * 자격증명: TOSS_API_KEY / TOSS_SECRET_KEY (env 또는 ~/.zshrc 폴백).
 * DB: DATABASE_URL (.env.local) — em-research 와 공유 Neon, vr_* 만 건드림.
 */
import { db, schema } from "../lib/db";
import { inArray } from "drizzle-orm";
import { getPrices, getStocks, getDailyCandles, regionForMarket } from "../lib/toss/openapi";
import { ingestVrPrices } from "../lib/sns/ingest";
import type { VrPriceIngest } from "../lib/sns/types";

async function main() {
  const tickers = await db
    .select({ symbol: schema.vrTickers.symbol })
    .from(schema.vrTickers)
    .where(inArray(schema.vrTickers.active, [true]));

  const symbols = tickers.map((t) => t.symbol);
  if (symbols.length === 0) {
    console.log("추적 종목 없음. scripts/seed-vr.ts 로 ticker 부터 넣으세요.");
    return;
  }
  console.log(`토스 시세 갱신: ${symbols.length}종목 [${symbols.join(", ")}]`);

  const [prices, stocks] = await Promise.all([getPrices(symbols), getStocks(symbols)]);
  const priceBy = new Map(prices.map((p) => [p.symbol, p]));
  const stockBy = new Map(stocks.map((s) => [s.symbol, s]));

  const items: VrPriceIngest[] = [];
  const filled: string[] = [];

  for (const symbol of symbols) {
    const p = priceBy.get(symbol);
    if (!p || p.lastPrice == null) {
      console.warn(`  - ${symbol}: 현재가 없음 → 스킵`);
      continue;
    }
    const price = Number(p.lastPrice);

    // 등락률·거래량: 일봉 2개(오늘/전일)
    let changePct: number | null = null;
    let volume: number | null = null;
    try {
      await new Promise((r) => setTimeout(r, 200)); // 캔들 레이트리밋(429) 완화
      const candles = await getDailyCandles(symbol, 2);
      if (candles[0]?.volume != null) volume = Number(candles[0].volume);
      const prevClose = candles[1]?.closePrice != null ? Number(candles[1].closePrice) : null;
      if (prevClose && prevClose > 0) changePct = ((price - prevClose) / prevClose) * 100;
    } catch (e) {
      console.warn(`  - ${symbol}: 캔들 조회 실패 (등락률 생략) — ${e instanceof Error ? e.message : e}`);
    }

    // 시총(네이티브) = 상장주식수 × 현재가
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
    console.log(
      `  ✓ ${symbol.padEnd(7)} ${price} ${p.currency}` +
        (changePct != null ? `  ${changePct >= 0 ? "+" : ""}${changePct.toFixed(2)}%` : "  (등락률 N/A)"),
    );
  }

  if (items.length === 0) {
    console.log("적재할 시세 없음.");
    return;
  }

  const res = await ingestVrPrices(items);
  console.log(`적재: affected=${res.affected}, skipped=${res.skipped}`);

  // source 를 toss 로 올려 SAMPLE DATA 배지 해제
  const up = await db
    .update(schema.vrTickers)
    .set({ source: "toss" })
    .where(inArray(schema.vrTickers.symbol, filled))
    .returning({ symbol: schema.vrTickers.symbol });
  console.log(`source→toss: ${up.length}종목`);

  console.log("✅ 토스 실시세 갱신 완료.");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

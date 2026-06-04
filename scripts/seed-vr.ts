/**
 * PLACEHOLDER SEED — 실제 VR 데이터 API 연결 전까지 페이지가 렌더되도록 샘플 적재.
 * 모든 행은 source='seed' 로 마킹되어 UI 에서 "SAMPLE DATA" 배지로 구분됨.
 * 멱등: onConflictDoNothing. 재실행 안전.
 *
 *   npm run seed:vr
 */
import { db, schema } from "../lib/db";
import { eq } from "drizzle-orm";

interface SeedTicker {
  symbol: string;
  exchange: string;
  sourceUrl: string;
  companyName: string;
  category: string;
  region: string;
  price: number;
  changePct: number;
  volume: number;
  marketCapNative: number;
  rawCurrency: string;
  peTtm: number;
}

const TICKERS: SeedTicker[] = [
  { symbol: "SOXL", exchange: "NYSEARCA", sourceUrl: "https://finance.yahoo.com/quote/SOXL", companyName: "Direxion Daily Semiconductor Bull 3X", category: "etf", region: "US", price: 280.54, changePct: 3.21, volume: 75_000_000, marketCapNative: 12_000_000_000, rawCurrency: "USD", peTtm: 0 },
  { symbol: "TQQQ", exchange: "NASDAQ", sourceUrl: "https://finance.yahoo.com/quote/TQQQ", companyName: "ProShares UltraPro QQQ", category: "etf", region: "US", price: 92.4, changePct: -1.85, volume: 60_000_000, marketCapNative: 26_000_000_000, rawCurrency: "USD", peTtm: 0 },
  { symbol: "NVDA", exchange: "NASDAQ", sourceUrl: "https://finance.yahoo.com/quote/NVDA", companyName: "NVIDIA Corporation", category: "semis", region: "US", price: 178.3, changePct: 2.04, volume: 210_000_000, marketCapNative: 4_350_000_000_000, rawCurrency: "USD", peTtm: 58.2 },
  { symbol: "AAPL", exchange: "NASDAQ", sourceUrl: "https://finance.yahoo.com/quote/AAPL", companyName: "Apple Inc.", category: "bigtech", region: "US", price: 310.26, changePct: -0.42, volume: 48_000_000, marketCapNative: 4_600_000_000_000, rawCurrency: "USD", peTtm: 36.1 },
  { symbol: "005930", exchange: "KOSPI", sourceUrl: "https://www.tossinvest.com/stocks/A005930", companyName: "삼성전자", category: "semis", region: "KR", price: 71200, changePct: 1.13, volume: 12_000_000, marketCapNative: 425_000_000_000_000, rawCurrency: "KRW", peTtm: 14.8 },
  { symbol: "000660", exchange: "KOSPI", sourceUrl: "https://www.tossinvest.com/stocks/A000660", companyName: "SK하이닉스", category: "semis", region: "KR", price: 248500, changePct: -2.31, volume: 4_500_000, marketCapNative: 181_000_000_000_000, rawCurrency: "KRW", peTtm: 11.2 },
];

// 14일 hourly-ish mention 버킷을 줄 종목 (버즈 페이지 데모용)
const MENTION_SYMBOLS = ["SOXL", "NVDA", "005930"];

function sampleUrlsFor(symbol: string, n: number): string[] {
  const urls = [
    `https://news.google.com/search?q=${symbol}`,
    `https://www.reddit.com/r/stocks/search/?q=${symbol}`,
    `https://www.tossinvest.com/stocks/${symbol}`,
  ];
  return urls.slice(0, n);
}

async function main() {
  console.log("Seeding vr_* placeholder data…");
  const now = new Date();

  for (const t of TICKERS) {
    await db
      .insert(schema.vrTickers)
      .values({
        symbol: t.symbol,
        exchange: t.exchange,
        source: "seed",
        sourceUrl: t.sourceUrl,
        companyName: t.companyName,
        category: t.category,
        region: t.region,
        active: true,
      })
      .onConflictDoNothing({ target: schema.vrTickers.symbol });

    const [row] = await db
      .select({ id: schema.vrTickers.id })
      .from(schema.vrTickers)
      .where(eq(schema.vrTickers.symbol, t.symbol));
    if (!row) continue;

    await db
      .insert(schema.vrPriceSnapshots)
      .values({
        tickerId: row.id,
        capturedAt: now,
        price: String(t.price),
        changePct: String(t.changePct),
        volume: t.volume,
        marketCapNative: String(t.marketCapNative),
        rawCurrency: t.rawCurrency,
      })
      .onConflictDoNothing({ target: [schema.vrPriceSnapshots.tickerId, schema.vrPriceSnapshots.capturedAt] });

    const today = now.toISOString().slice(0, 10);
    await db
      .insert(schema.vrMetricsSnapshots)
      .values({
        tickerId: row.id,
        capturedAt: today,
        peTtm: t.peTtm > 0 ? String(t.peTtm) : null,
      })
      .onConflictDoNothing({ target: [schema.vrMetricsSnapshots.tickerId, schema.vrMetricsSnapshots.capturedAt] });
  }

  // mention 버킷: 14일 × 하루 4버킷, 사인파 비슷한 count
  for (const symbol of MENTION_SYMBOLS) {
    for (let d = 13; d >= 0; d--) {
      for (let h = 0; h < 24; h += 6) {
        const bucket = new Date(now);
        bucket.setUTCDate(bucket.getUTCDate() - d);
        bucket.setUTCHours(h, 0, 0, 0);
        const wave = Math.round(8 + 6 * Math.sin((d * 24 + h) / 9) + ((d + h) % 5));
        await db
          .insert(schema.vrNewsMentionCounts)
          .values({
            symbol,
            hourBucket: bucket,
            source: "google_news",
            count: Math.max(1, wave),
            sampleUrls: sampleUrlsFor(symbol, (h % 18 === 0 ? 3 : 1)),
          })
          .onConflictDoNothing({
            target: [
              schema.vrNewsMentionCounts.symbol,
              schema.vrNewsMentionCounts.hourBucket,
              schema.vrNewsMentionCounts.source,
            ],
          });
      }
    }
  }

  console.log("✅ seed done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

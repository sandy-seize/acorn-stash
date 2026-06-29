/**
 * /stocks 대시보드용 — 종목별 최신 가격·지표 1행씩 (vr_* 테이블).
 */
import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set.");
}
const sql = neon(process.env.DATABASE_URL);

export interface VrTickerRow {
  id: number;
  symbol: string;
  exchange: string;
  source: string;
  source_url: string;
  company_name: string;
  category: string;
  region: string;
  active: boolean;
  price: number | null;
  change_pct: number | null;
  volume: number | null;
  market_cap_native: number | null;
  raw_currency: string | null;
  captured_at: string | null;
  pe_ttm: number | null;
  fifty_two_week_high: number | null;
  fifty_two_week_low: number | null;
}

export async function fetchVrLatestSnapshots(): Promise<VrTickerRow[]> {
  const rows = await sql`
    SELECT
      t.id, t.symbol, t.exchange, t.source, t.source_url,
      t.company_name, t.category, t.region, t.active,
      p.price::float8 AS price,
      p.change_pct::float8 AS change_pct,
      p.volume,
      p.market_cap_native::float8 AS market_cap_native,
      p.raw_currency,
      p.captured_at,
      m.pe_ttm::float8 AS pe_ttm,
      m.fifty_two_week_high::float8 AS fifty_two_week_high,
      m.fifty_two_week_low::float8 AS fifty_two_week_low
    FROM vr_tickers t
    LEFT JOIN LATERAL (
      SELECT * FROM vr_price_snapshots WHERE ticker_id = t.id
      ORDER BY captured_at DESC LIMIT 1
    ) p ON TRUE
    LEFT JOIN LATERAL (
      SELECT * FROM vr_metrics_snapshots WHERE ticker_id = t.id
      ORDER BY captured_at DESC LIMIT 1
    ) m ON TRUE
    WHERE t.active = TRUE
    ORDER BY
      CASE t.region WHEN 'KR' THEN 1 WHEN 'US' THEN 2 WHEN 'HK' THEN 3 WHEN 'CN' THEN 4 ELSE 9 END,
      t.symbol
  `;
  return rows as unknown as VrTickerRow[];
}

/**
 * 종목 버즈 상세 페이지용 read query (vr_* 테이블).
 */
import { db, schema } from "../db";
import { eq, and, gte, desc } from "drizzle-orm";

export interface VrTickerDetail {
  symbol: string;
  name: string | null;
  region: string | null;
  latestChangePct: number | null;
  latestCapturedAt: Date | null;
  sourceUrl: string | null;
}

/** 상세 페이지 헤더 — vr_tickers + 최신 price snapshot. */
export async function getVrTickerDetail(symbol: string): Promise<VrTickerDetail | null> {
  const trows = await db
    .select({
      symbol: schema.vrTickers.symbol,
      name: schema.vrTickers.companyName,
      region: schema.vrTickers.region,
      sourceUrl: schema.vrTickers.sourceUrl,
      id: schema.vrTickers.id,
    })
    .from(schema.vrTickers)
    .where(eq(schema.vrTickers.symbol, symbol))
    .limit(1);
  if (trows.length === 0) return null;
  const t = trows[0];

  const prows = await db
    .select({
      changePct: schema.vrPriceSnapshots.changePct,
      capturedAt: schema.vrPriceSnapshots.capturedAt,
    })
    .from(schema.vrPriceSnapshots)
    .where(eq(schema.vrPriceSnapshots.tickerId, t.id))
    .orderBy(desc(schema.vrPriceSnapshots.capturedAt))
    .limit(1);
  const p = prows[0];

  return {
    symbol: t.symbol,
    name: t.name,
    region: t.region,
    latestChangePct: p?.changePct != null ? Number(p.changePct) : null,
    latestCapturedAt: p?.capturedAt ?? null,
    sourceUrl: t.sourceUrl,
  };
}

export interface MentionPoint {
  hourBucket: Date;
  count: number;
}

export async function getVrMentionTimeSeries(symbol: string, days = 14): Promise<MentionPoint[]> {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - days);
  const rows = await db
    .select({
      hourBucket: schema.vrNewsMentionCounts.hourBucket,
      count: schema.vrNewsMentionCounts.count,
    })
    .from(schema.vrNewsMentionCounts)
    .where(
      and(
        eq(schema.vrNewsMentionCounts.symbol, symbol),
        gte(schema.vrNewsMentionCounts.hourBucket, since),
      ),
    )
    .orderBy(schema.vrNewsMentionCounts.hourBucket);
  return rows;
}

export interface MentionUrlRow {
  source: string;
  hourBucket: Date;
  url: string;
  count: number;
}

export async function getVrRecentMentionUrls(symbol: string, limit = 300): Promise<MentionUrlRow[]> {
  const bucketLimit = Math.max(limit, 200);
  const rows = await db
    .select({
      source: schema.vrNewsMentionCounts.source,
      hourBucket: schema.vrNewsMentionCounts.hourBucket,
      sampleUrls: schema.vrNewsMentionCounts.sampleUrls,
      count: schema.vrNewsMentionCounts.count,
    })
    .from(schema.vrNewsMentionCounts)
    .where(eq(schema.vrNewsMentionCounts.symbol, symbol))
    .orderBy(desc(schema.vrNewsMentionCounts.hourBucket))
    .limit(bucketLimit);

  const seen = new Set<string>();
  const out: MentionUrlRow[] = [];
  for (const r of rows) {
    const urls = Array.isArray(r.sampleUrls) ? (r.sampleUrls as unknown[]) : [];
    for (const u of urls) {
      if (typeof u !== "string" || !u || seen.has(u)) continue;
      seen.add(u);
      out.push({ source: r.source, hourBucket: r.hourBucket, url: u, count: r.count });
      if (out.length >= limit) return out;
    }
  }
  return out;
}

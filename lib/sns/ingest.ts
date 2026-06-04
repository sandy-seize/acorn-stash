/**
 * 미래 데이터 API 가 보내는 페이로드를 vr_* 테이블에 적재하는 writer.
 * 모두 upsert(멱등). em-research 테이블은 절대 건드리지 않음.
 */
import { db, schema } from "../db";
import { eq } from "drizzle-orm";
import type { VrTickerIngest, VrPriceIngest, VrMentionIngest } from "./types";

export async function ingestVrTickers(items: VrTickerIngest[]): Promise<{ affected: number }> {
  let affected = 0;
  for (const it of items) {
    if (!it.symbol) continue;
    await db
      .insert(schema.vrTickers)
      .values({
        symbol: it.symbol.toUpperCase(),
        exchange: it.exchange ?? "",
        source: it.source ?? "api",
        sourceUrl: it.sourceUrl ?? "",
        companyName: it.companyName ?? it.symbol,
        category: it.category ?? "",
        region: it.region ?? "",
        active: it.active ?? true,
      })
      .onConflictDoUpdate({
        target: schema.vrTickers.symbol,
        set: {
          exchange: it.exchange ?? "",
          sourceUrl: it.sourceUrl ?? "",
          companyName: it.companyName ?? it.symbol,
          category: it.category ?? "",
          region: it.region ?? "",
          active: it.active ?? true,
        },
      });
    affected++;
  }
  return { affected };
}

async function tickerIdBySymbol(symbol: string): Promise<number | null> {
  const rows = await db
    .select({ id: schema.vrTickers.id })
    .from(schema.vrTickers)
    .where(eq(schema.vrTickers.symbol, symbol.toUpperCase()))
    .limit(1);
  return rows[0]?.id ?? null;
}

export async function ingestVrPrices(items: VrPriceIngest[]): Promise<{ affected: number; skipped: number }> {
  let affected = 0;
  let skipped = 0;
  for (const it of items) {
    const tickerId = await tickerIdBySymbol(it.symbol);
    if (!tickerId) {
      skipped++;
      continue;
    }
    const capturedAt = it.capturedAt ? new Date(it.capturedAt) : new Date();
    await db
      .insert(schema.vrPriceSnapshots)
      .values({
        tickerId,
        capturedAt,
        price: it.price != null ? String(it.price) : null,
        changePct: it.changePct != null ? String(it.changePct) : null,
        volume: it.volume ?? null,
        marketCapNative: it.marketCapNative != null ? String(it.marketCapNative) : null,
        rawCurrency: it.rawCurrency ?? null,
      })
      .onConflictDoUpdate({
        target: [schema.vrPriceSnapshots.tickerId, schema.vrPriceSnapshots.capturedAt],
        set: {
          price: it.price != null ? String(it.price) : null,
          changePct: it.changePct != null ? String(it.changePct) : null,
          volume: it.volume ?? null,
          marketCapNative: it.marketCapNative != null ? String(it.marketCapNative) : null,
          rawCurrency: it.rawCurrency ?? null,
        },
      });

    if (it.peTtm != null) {
      const day = capturedAt.toISOString().slice(0, 10);
      await db
        .insert(schema.vrMetricsSnapshots)
        .values({ tickerId, capturedAt: day, peTtm: String(it.peTtm) })
        .onConflictDoUpdate({
          target: [schema.vrMetricsSnapshots.tickerId, schema.vrMetricsSnapshots.capturedAt],
          set: { peTtm: String(it.peTtm) },
        });
    }
    affected++;
  }
  return { affected, skipped };
}

export async function ingestVrMentions(items: VrMentionIngest[]): Promise<{ affected: number }> {
  let affected = 0;
  for (const it of items) {
    if (!it.symbol || !it.hourBucket) continue;
    await db
      .insert(schema.vrNewsMentionCounts)
      .values({
        symbol: it.symbol.toUpperCase(),
        hourBucket: new Date(it.hourBucket),
        source: it.source ?? "google_news",
        count: it.count ?? 0,
        sampleUrls: it.sampleUrls ?? null,
      })
      .onConflictDoUpdate({
        target: [
          schema.vrNewsMentionCounts.symbol,
          schema.vrNewsMentionCounts.hourBucket,
          schema.vrNewsMentionCounts.source,
        ],
        set: {
          count: it.count ?? 0,
          sampleUrls: it.sampleUrls ?? null,
          fetchedAt: new Date(),
        },
      });
    affected++;
  }
  return { affected };
}

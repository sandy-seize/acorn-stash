/**
 * acorn-stash VR 종목 모니터 스키마.
 * 모든 테이블은 `vr_` 접두 — em-research 와 같은 Neon 인스턴스를 공유하지만
 * 기존 테이블(tickers, price_snapshots, …)을 절대 건드리지 않는다.
 */
import {
  pgTable,
  serial,
  bigserial,
  integer,
  text,
  numeric,
  bigint,
  timestamp,
  date,
  boolean,
  jsonb,
  unique,
  index,
} from "drizzle-orm/pg-core";

export const vrTickers = pgTable("vr_tickers", {
  id: serial("id").primaryKey(),
  symbol: text("symbol").notNull().unique(),
  exchange: text("exchange").notNull(),
  source: text("source").notNull(),
  sourceUrl: text("source_url").notNull(),
  companyName: text("company_name").notNull(),
  category: text("category").notNull(),
  region: text("region").notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const vrPriceSnapshots = pgTable(
  "vr_price_snapshots",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    tickerId: integer("ticker_id")
      .references(() => vrTickers.id)
      .notNull(),
    capturedAt: timestamp("captured_at", { withTimezone: true }).notNull(),
    price: numeric("price"),
    changePct: numeric("change_pct"),
    volume: bigint("volume", { mode: "number" }),
    marketCap: numeric("market_cap"),
    marketCapNative: numeric("market_cap_native"),
    rawCurrency: text("raw_currency"),
    fxRate: numeric("fx_rate"),
  },
  (t) => ({
    uniqueTickerCaptured: unique().on(t.tickerId, t.capturedAt),
  }),
);

export const vrMetricsSnapshots = pgTable(
  "vr_metrics_snapshots",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    tickerId: integer("ticker_id")
      .references(() => vrTickers.id)
      .notNull(),
    capturedAt: date("captured_at").notNull(),
    peTtm: numeric("pe_ttm"),
    pb: numeric("pb"),
    ps: numeric("ps"),
    evEbitda: numeric("ev_ebitda"),
    roe: numeric("roe"),
    grossMargin: numeric("gross_margin"),
    revGrowthYoy: numeric("rev_growth_yoy"),
    fiftyTwoWeekHigh: numeric("fifty_two_week_high"),
    fiftyTwoWeekLow: numeric("fifty_two_week_low"),
  },
  (t) => ({
    uniqueTickerDate: unique().on(t.tickerId, t.capturedAt),
  }),
);

export const vrNewsMentionCounts = pgTable(
  "vr_news_mention_counts",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    symbol: text("symbol").notNull(),
    hourBucket: timestamp("hour_bucket", { withTimezone: true }).notNull(),
    source: text("source").notNull().default("google_news"),
    count: integer("count").notNull(),
    fetchedAt: timestamp("fetched_at", { withTimezone: true }).defaultNow().notNull(),
    sampleUrls: jsonb("sample_urls"),
  },
  (t) => ({
    uniqueSymbolHourSource: unique().on(t.symbol, t.hourBucket, t.source),
    symbolBucketIdx: index("vr_news_mention_counts_symbol_bucket_idx").on(t.symbol, t.hourBucket),
  }),
);

export const vrLinkPreviews = pgTable("vr_link_previews", {
  url: text("url").primaryKey(),
  finalUrl: text("final_url"),
  title: text("title"),
  description: text("description"),
  siteName: text("site_name"),
  ogImage: text("og_image"),
  keywords: text("keywords"),
  status: text("status").notNull().default("ok"),
  errorMessage: text("error_message"),
  fetchedAt: timestamp("fetched_at", { withTimezone: true }).defaultNow().notNull(),
});

/* ================================================================== */
/* 자동매매 토대 (Toss OpenAPI 연동 — dry-run 우선)                     */
/* ================================================================== */

/** 설정된 전략 인스턴스 (VR / 무한매수 / DCA). */
export const vrStrategies = pgTable("vr_strategies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  kind: text("kind").notNull(), // 'vr' | 'infinite' | 'dca'
  symbol: text("symbol").notNull(),
  market: text("market").notNull().default("US"), // 'KR' | 'US'
  seed: numeric("seed").notNull(), // 총 원금(풀)
  params: jsonb("params"), // {T, band, mode, g, target, ...} 전략별 파라미터
  active: boolean("active").default(true).notNull(),
  dryRun: boolean("dry_run").default(true).notNull(), // 안전: 기본 모의
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/** 전략 실행 예약 (스크롤 피커 선택 → 주기/일시). */
export const vrSchedules = pgTable("vr_schedules", {
  id: serial("id").primaryKey(),
  strategyId: integer("strategy_id")
    .references(() => vrStrategies.id, { onDelete: "cascade" })
    .notNull(),
  kind: text("kind").notNull(), // 'weekly' | 'daily' | 'once'
  spec: jsonb("spec"), // {weekday, hour, minute} | {datetimeIso}
  nextRunAt: timestamp("next_run_at", { withTimezone: true }),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/** 주문 의도 + 체결 결과 audit. clientOrderId 로 멱등. */
export const vrOrders = pgTable(
  "vr_orders",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    strategyId: integer("strategy_id").references(() => vrStrategies.id),
    clientOrderId: text("client_order_id").notNull().unique(),
    symbol: text("symbol").notNull(),
    side: text("side").notNull(), // 'BUY' | 'SELL'
    orderType: text("order_type").notNull().default("MARKET"), // 'MARKET' | 'LIMIT'
    quantity: numeric("quantity"),
    price: numeric("price"),
    amount: numeric("amount"),
    // planned | dry_run | blocked | skipped | submitted | filled | failed
    status: text("status").notNull(),
    dryRun: boolean("dry_run").notNull().default(true),
    reason: text("reason"),
    raw: jsonb("raw"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    strategyIdx: index("vr_orders_strategy_idx").on(t.strategyId),
  }),
);

/** 계좌 보유 종목 스냅샷 (Toss 계좌조회 결과 — 연결 후 적재). */
export const vrHoldings = pgTable(
  "vr_holdings",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    accountSeq: text("account_seq").notNull(),
    symbol: text("symbol").notNull(),
    name: text("name"),
    quantity: numeric("quantity"),
    avgPrice: numeric("avg_price"),
    plRate: numeric("pl_rate"),
    rawCurrency: text("raw_currency"),
    capturedAt: timestamp("captured_at", { withTimezone: true }).notNull(),
  },
  (t) => ({
    uniqueAcctSymCaptured: unique().on(t.accountSeq, t.symbol, t.capturedAt),
  }),
);

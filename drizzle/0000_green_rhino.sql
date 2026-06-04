CREATE TABLE "vr_link_previews" (
	"url" text PRIMARY KEY NOT NULL,
	"final_url" text,
	"title" text,
	"description" text,
	"site_name" text,
	"og_image" text,
	"keywords" text,
	"status" text DEFAULT 'ok' NOT NULL,
	"error_message" text,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vr_metrics_snapshots" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"ticker_id" integer NOT NULL,
	"captured_at" date NOT NULL,
	"pe_ttm" numeric,
	"pb" numeric,
	"ps" numeric,
	"ev_ebitda" numeric,
	"roe" numeric,
	"gross_margin" numeric,
	"rev_growth_yoy" numeric,
	"fifty_two_week_high" numeric,
	"fifty_two_week_low" numeric,
	CONSTRAINT "vr_metrics_snapshots_ticker_id_captured_at_unique" UNIQUE("ticker_id","captured_at")
);
--> statement-breakpoint
CREATE TABLE "vr_news_mention_counts" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"symbol" text NOT NULL,
	"hour_bucket" timestamp with time zone NOT NULL,
	"source" text DEFAULT 'google_news' NOT NULL,
	"count" integer NOT NULL,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sample_urls" jsonb,
	CONSTRAINT "vr_news_mention_counts_symbol_hour_bucket_source_unique" UNIQUE("symbol","hour_bucket","source")
);
--> statement-breakpoint
CREATE TABLE "vr_price_snapshots" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"ticker_id" integer NOT NULL,
	"captured_at" timestamp with time zone NOT NULL,
	"price" numeric,
	"change_pct" numeric,
	"volume" bigint,
	"market_cap" numeric,
	"market_cap_native" numeric,
	"raw_currency" text,
	"fx_rate" numeric,
	CONSTRAINT "vr_price_snapshots_ticker_id_captured_at_unique" UNIQUE("ticker_id","captured_at")
);
--> statement-breakpoint
CREATE TABLE "vr_tickers" (
	"id" serial PRIMARY KEY NOT NULL,
	"symbol" text NOT NULL,
	"exchange" text NOT NULL,
	"source" text NOT NULL,
	"source_url" text NOT NULL,
	"company_name" text NOT NULL,
	"category" text NOT NULL,
	"region" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vr_tickers_symbol_unique" UNIQUE("symbol")
);
--> statement-breakpoint
ALTER TABLE "vr_metrics_snapshots" ADD CONSTRAINT "vr_metrics_snapshots_ticker_id_vr_tickers_id_fk" FOREIGN KEY ("ticker_id") REFERENCES "public"."vr_tickers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vr_price_snapshots" ADD CONSTRAINT "vr_price_snapshots_ticker_id_vr_tickers_id_fk" FOREIGN KEY ("ticker_id") REFERENCES "public"."vr_tickers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "vr_news_mention_counts_symbol_bucket_idx" ON "vr_news_mention_counts" USING btree ("symbol","hour_bucket");
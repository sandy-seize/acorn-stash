CREATE TABLE "vr_holdings" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"account_seq" text NOT NULL,
	"symbol" text NOT NULL,
	"name" text,
	"quantity" numeric,
	"avg_price" numeric,
	"pl_rate" numeric,
	"raw_currency" text,
	"captured_at" timestamp with time zone NOT NULL,
	CONSTRAINT "vr_holdings_account_seq_symbol_captured_at_unique" UNIQUE("account_seq","symbol","captured_at")
);
--> statement-breakpoint
CREATE TABLE "vr_orders" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"strategy_id" integer,
	"client_order_id" text NOT NULL,
	"symbol" text NOT NULL,
	"side" text NOT NULL,
	"order_type" text DEFAULT 'MARKET' NOT NULL,
	"quantity" numeric,
	"price" numeric,
	"amount" numeric,
	"status" text NOT NULL,
	"dry_run" boolean DEFAULT true NOT NULL,
	"reason" text,
	"raw" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vr_orders_client_order_id_unique" UNIQUE("client_order_id")
);
--> statement-breakpoint
CREATE TABLE "vr_schedules" (
	"id" serial PRIMARY KEY NOT NULL,
	"strategy_id" integer NOT NULL,
	"kind" text NOT NULL,
	"spec" jsonb,
	"next_run_at" timestamp with time zone,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vr_strategies" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"kind" text NOT NULL,
	"symbol" text NOT NULL,
	"market" text DEFAULT 'US' NOT NULL,
	"seed" numeric NOT NULL,
	"params" jsonb,
	"active" boolean DEFAULT true NOT NULL,
	"dry_run" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "vr_orders" ADD CONSTRAINT "vr_orders_strategy_id_vr_strategies_id_fk" FOREIGN KEY ("strategy_id") REFERENCES "public"."vr_strategies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vr_schedules" ADD CONSTRAINT "vr_schedules_strategy_id_vr_strategies_id_fk" FOREIGN KEY ("strategy_id") REFERENCES "public"."vr_strategies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "vr_orders_strategy_idx" ON "vr_orders" USING btree ("strategy_id");
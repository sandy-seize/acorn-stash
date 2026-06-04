CREATE TABLE "vr_paper_accounts" (
	"strategy_id" integer PRIMARY KEY NOT NULL,
	"shares" numeric DEFAULT '0' NOT NULL,
	"avg_cost" numeric DEFAULT '0' NOT NULL,
	"cash" numeric DEFAULT '0' NOT NULL,
	"as_of" timestamp with time zone DEFAULT now() NOT NULL,
	"source" text DEFAULT 'manual' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "vr_paper_accounts" ADD CONSTRAINT "vr_paper_accounts_strategy_id_vr_strategies_id_fk" FOREIGN KEY ("strategy_id") REFERENCES "public"."vr_strategies"("id") ON DELETE cascade ON UPDATE no action;
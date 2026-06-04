CREATE TABLE "vr_push_subscriptions" (
	"endpoint" text PRIMARY KEY NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"ua" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

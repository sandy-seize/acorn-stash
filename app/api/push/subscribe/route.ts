import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";

// POST /api/push/subscribe  { subscription }  → 구독 저장
// NOTE: UI 무인증(개인 도구). 공개·라이브 전 인증 추가 권장.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: { subscription?: { endpoint?: string; keys?: { p256dh?: string; auth?: string } } };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const sub = body.subscription;
  if (!sub?.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) {
    return NextResponse.json({ error: "invalid_subscription" }, { status: 400 });
  }
  await db
    .insert(schema.vrPushSubscriptions)
    .values({
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
      ua: request.headers.get("user-agent") ?? null,
    })
    .onConflictDoUpdate({
      target: schema.vrPushSubscriptions.endpoint,
      set: { p256dh: sub.keys.p256dh, auth: sub.keys.auth },
    });
  return NextResponse.json({ ok: true });
}

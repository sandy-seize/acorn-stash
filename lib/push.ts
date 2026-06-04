/**
 * 웹 푸시 발송 (web-push + VAPID). 서버 전용.
 */
import webpush from "web-push";
import { db, schema } from "./db";
import { eq } from "drizzle-orm";

let configured = false;
function ensure(): boolean {
  if (configured) return true;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return false;
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:noreply@acorn-stash.vercel.app", pub, priv);
  configured = true;
  return true;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

export async function sendPushToAll(payload: PushPayload): Promise<{ sent: number; failed: number; reason?: string }> {
  if (!ensure()) return { sent: 0, failed: 0, reason: "VAPID 키 미설정" };
  const subs = await db.select().from(schema.vrPushSubscriptions);
  let sent = 0;
  let failed = 0;
  for (const s of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        JSON.stringify(payload),
      );
      sent++;
    } catch (e: unknown) {
      failed++;
      const code = (e as { statusCode?: number }).statusCode;
      if (code === 404 || code === 410) {
        // 만료된 구독 정리
        await db.delete(schema.vrPushSubscriptions).where(eq(schema.vrPushSubscriptions.endpoint, s.endpoint));
      }
    }
  }
  return { sent, failed };
}

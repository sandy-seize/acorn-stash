import { NextResponse } from "next/server";
import { sendPushToAll } from "@/lib/push";

// POST /api/push/test → 구독된 모든 기기에 테스트 알림
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  const r = await sendPushToAll({
    title: "🌰 도토리 알림 테스트",
    body: "푸시가 정상 작동합니다. 자동매매 실행 시 이렇게 알려드려요.",
    url: "/auto",
    tag: "test",
  });
  return NextResponse.json({ ok: true, ...r });
}

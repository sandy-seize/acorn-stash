import { NextResponse } from "next/server";
import { refreshTossPrices } from "@/lib/toss/refresh";

// GET /api/cron/refresh-prices[?fundamentals=1] — 토스 Open API 실시세 적재.
// 인증: CRON_SECRET 설정 시 Bearer 검증(GitHub Actions/Vercel cron). 미설정 시 통과(로컬).
// 자격증명: Vercel env TOSS_API_KEY / TOSS_SECRET_KEY 필요(없으면 토큰 발급 실패).
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

function authed(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!authed(request)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const fundamentals = new URL(request.url).searchParams.get("fundamentals") === "1";
  try {
    const r = await refreshTossPrices({ fundamentals });
    return NextResponse.json({ ok: true, ranAt: new Date().toISOString(), withFundamentals: fundamentals, ...r });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: String(e instanceof Error ? e.message : e) },
      { status: 500 },
    );
  }
}

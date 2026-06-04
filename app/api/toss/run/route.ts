import { NextResponse } from "next/server";
import { verifyIngestAuth } from "@/lib/sns/auth";
import { runStrategyOnce } from "@/lib/toss/runner";

// POST /api/toss/run  { strategyId }  → 전략 1회 실행 (dry-run 기본)
// 스케줄러/cron/수동 트리거 공용. 안전 플래그는 runner/safety/client 에서 강제.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: Request) {
  const auth = verifyIngestAuth(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 });

  let body: { strategyId?: number };
  try {
    body = (await request.json()) as { strategyId?: number };
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (typeof body.strategyId !== "number") {
    return NextResponse.json({ error: "strategyId required" }, { status: 400 });
  }

  try {
    const result = await runStrategyOnce(body.strategyId);
    return NextResponse.json({ ok: true, result });
  } catch (e) {
    return NextResponse.json({ error: String(e instanceof Error ? e.message : e) }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { and, eq, lte } from "drizzle-orm";
import { runStrategyOnce } from "@/lib/toss/runner";
import { computeNextRunAt, type ScheduleKind, type ScheduleSpec } from "@/lib/schedule";

// GET /api/cron/run-due — Vercel cron 이 호출. nextRunAt<=now 인 활성 예약 실행(dry-run 기본).
// 인증: CRON_SECRET 설정 시 Bearer 검증(Vercel cron 자동 첨부). 미설정 시 통과(로컬).
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

  const now = new Date();
  const due = await db
    .select()
    .from(schema.vrSchedules)
    .where(and(eq(schema.vrSchedules.active, true), lte(schema.vrSchedules.nextRunAt, now)));

  const results = [];
  for (const s of due) {
    try {
      const r = await runStrategyOnce(s.strategyId, now);
      results.push({ scheduleId: s.id, strategyId: s.strategyId, action: r.action, status: r.status, amount: r.amount });
    } catch (e) {
      results.push({ scheduleId: s.id, strategyId: s.strategyId, error: String(e instanceof Error ? e.message : e) });
    }
    // 다음 실행시각 갱신 (once 는 비활성화)
    if (s.kind === "once") {
      await db.update(schema.vrSchedules).set({ active: false }).where(eq(schema.vrSchedules.id, s.id));
    } else {
      const next = computeNextRunAt(s.kind as ScheduleKind, (s.spec ?? {}) as ScheduleSpec, now);
      await db.update(schema.vrSchedules).set({ nextRunAt: next }).where(eq(schema.vrSchedules.id, s.id));
    }
  }

  return NextResponse.json({ ok: true, ranAt: now.toISOString(), due: due.length, results });
}

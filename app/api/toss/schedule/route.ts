import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { computeNextRunAt, type ScheduleKind, type ScheduleSpec } from "@/lib/schedule";

// POST /api/toss/schedule   { strategyId, kind, spec }  → 예약 생성
// DELETE /api/toss/schedule?id=123                      → 예약 삭제
// NOTE: UI 무인증(paper/dry-run 설정만). 공개·라이브 전 인증 추가 필요.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: { strategyId?: number; kind?: ScheduleKind; spec?: ScheduleSpec };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const { strategyId, kind, spec } = body;
  if (typeof strategyId !== "number" || !kind || !spec) {
    return NextResponse.json({ error: "strategyId, kind, spec required" }, { status: 400 });
  }
  const nextRunAt = computeNextRunAt(kind, spec);
  const [row] = await db
    .insert(schema.vrSchedules)
    .values({ strategyId, kind, spec, nextRunAt, active: true })
    .returning();
  return NextResponse.json({ ok: true, schedule: row });
}

export async function DELETE(request: Request) {
  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await db.delete(schema.vrSchedules).where(eq(schema.vrSchedules.id, id));
  return NextResponse.json({ ok: true });
}

/**
 * cron 자동 실행 검증 — due 예약을 만들어 cron 로직(due 조회 → 러너 → nextRunAt 갱신)을 직접 돈다.
 *   npm run test:cron
 */
import { db, schema } from "../lib/db";
import { and, eq, lte } from "drizzle-orm";
import { runStrategyOnce } from "../lib/toss/runner";
import { computeNextRunAt, type ScheduleKind, type ScheduleSpec } from "../lib/schedule";

async function main() {
  const [strat] = await db.select().from(schema.vrStrategies).limit(1);
  if (!strat) throw new Error("전략 없음 — 먼저 npm run demo:dryrun");

  // due 예약 1개 보장 (과거 nextRunAt)
  await db.delete(schema.vrSchedules).where(eq(schema.vrSchedules.strategyId, strat.id));
  await db.insert(schema.vrSchedules).values({
    strategyId: strat.id,
    kind: "daily",
    spec: { hour: 9, minute: 30 },
    nextRunAt: new Date("2020-01-01T00:00:00Z"),
    active: true,
  });

  // --- cron 로직 재현 ---
  const now = new Date();
  const due = await db
    .select()
    .from(schema.vrSchedules)
    .where(and(eq(schema.vrSchedules.active, true), lte(schema.vrSchedules.nextRunAt, now)));
  console.log(`due 예약: ${due.length}건`);
  for (const s of due) {
    const r = await runStrategyOnce(s.strategyId, now);
    console.log(`→ 실행: 전략#${s.strategyId} step${r.step} ${r.action}[${r.status}] ${r.amount ? Math.round(r.amount).toLocaleString() + "원" : ""} · ${r.reason}`);
    const next = computeNextRunAt(s.kind as ScheduleKind, (s.spec ?? {}) as ScheduleSpec, now);
    await db.update(schema.vrSchedules).set({ nextRunAt: next }).where(eq(schema.vrSchedules.id, s.id));
    console.log(`   nextRunAt 갱신 → ${next?.toISOString()}`);
  }
  console.log("✅ cron 자동 실행 검증 완료 (dry-run)");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

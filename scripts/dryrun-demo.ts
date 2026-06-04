/**
 * dry-run 자동매매 검증 — 키 없이 전략→주문의도→안전→로그 루프를 N스텝 돌려본다.
 *   npm run demo:dryrun
 * 데모 전략(DEMO-VR-SOXL)의 기존 주문을 비우고 6스텝 실행 → 시퀀스 출력.
 */
import { db, schema } from "../lib/db";
import { eq } from "drizzle-orm";
import { runStrategyOnce } from "../lib/toss/runner";

const NAME = "DEMO-VR-SOXL";

async function main() {
  // find-or-create
  let [strat] = await db.select().from(schema.vrStrategies).where(eq(schema.vrStrategies.name, NAME)).limit(1);
  if (!strat) {
    [strat] = await db
      .insert(schema.vrStrategies)
      .values({
        name: NAME,
        kind: "vr",
        symbol: "SOXL",
        market: "US",
        seed: "10000000",
        params: { T: 40, band: 0, mode: "linear" },
        active: true,
        dryRun: true,
      })
      .returning();
    console.log(`created strategy #${strat.id} ${NAME}`);
  }
  // 깨끗한 재실행을 위해 기존 주문 삭제
  await db.delete(schema.vrOrders).where(eq(schema.vrOrders.strategyId, strat.id));

  console.log(`\n=== ${NAME} (#${strat.id}) dry-run 6 steps ===`);
  for (let i = 0; i < 6; i++) {
    const r = await runStrategyOnce(strat.id);
    const amt = r.amount > 0 ? `${Math.round(r.amount).toLocaleString()}원 (${(Math.round(r.shares * 10000) / 10000)}주)` : "—";
    console.log(
      `step ${r.step}: price $${r.price}  →  ${r.action.padEnd(4)} [${r.status}]  ${amt}  · ${r.reason}`,
    );
  }

  // 최종 로그 + 시뮬 포지션 요약
  const rows = await db.select().from(schema.vrOrders).where(eq(schema.vrOrders.strategyId, strat.id)).orderBy(schema.vrOrders.id);
  const buys = rows.filter((r) => r.side === "BUY" && ["dry_run", "submitted", "filled"].includes(r.status));
  const invested = buys.reduce((s, r) => s + Number(r.amount ?? 0), 0);
  console.log(`\n주문로그 ${rows.length}행 · 시뮬 매수체결 ${buys.length}건 · 누적투입 ${Math.round(invested).toLocaleString()}원`);
  console.log("dryRun 플래그:", rows[0]?.dryRun, "(true=모의, 네트워크/실주문 없음)");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

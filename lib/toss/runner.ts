/**
 * 전략 1회 실행 러너. cron/스케줄/수동이 모두 이걸 호출.
 * dry-run 기준: 포지션은 vr_orders 로그(시뮬 체결)로부터 재구성 → 키 없이도 누적 진행.
 */
import { db, schema } from "../db";
import { eq, and, inArray, sql } from "drizzle-orm";
import { decideOrder, type StrategyKind, type StrategyParams } from "../strategy/engine";
import { getQuote, placeOrder } from "./client";
import { checkOrder, clientOrderId, loadSafetyConfig } from "./safety";

const EXECUTED = ["dry_run", "submitted", "filled"];

export interface RunResult {
  strategyId: number;
  symbol: string;
  step: number;
  price: number;
  action: string;
  status: string;
  amount: number;
  shares: number;
  reason: string;
  clientOrderId: string;
  dryRun: boolean;
}

function dateStrKST(now: Date): string {
  // KST(UTC+9) 기준 YYYYMMDD
  const k = new Date(now.getTime() + 9 * 3600 * 1000);
  return k.toISOString().slice(0, 10).replace(/-/g, "");
}

export async function runStrategyOnce(strategyId: number, now: Date = new Date()): Promise<RunResult> {
  const [strat] = await db.select().from(schema.vrStrategies).where(eq(schema.vrStrategies.id, strategyId)).limit(1);
  if (!strat) throw new Error(`strategy ${strategyId} not found`);

  const seed = Number(strat.seed);
  const params = (strat.params ?? {}) as StrategyParams;

  // 과거 주문 로그 → 포지션·스텝 재구성
  const prior = await db
    .select()
    .from(schema.vrOrders)
    .where(eq(schema.vrOrders.strategyId, strategyId))
    .orderBy(schema.vrOrders.id);

  // 모의계좌 baseline(수동 입력/동기화)이 있으면 그 시점을 기준점으로,
  // 이후 발생한 주문만 누적. 없으면 seed 현금 + 전체 로그.
  const [paper] = await db
    .select()
    .from(schema.vrPaperAccounts)
    .where(eq(schema.vrPaperAccounts.strategyId, strategyId))
    .limit(1);

  let shares = paper ? Number(paper.shares) : 0;
  let cost = paper ? Number(paper.avgCost) : 0;
  let cash = paper ? Number(paper.cash) : seed;
  const baseTime = paper ? paper.asOf.getTime() : 0;

  for (const o of prior) {
    if (!EXECUTED.includes(o.status)) continue;
    if (paper && o.createdAt.getTime() <= baseTime) continue; // baseline 이전 주문은 이미 반영됨
    const qty = Number(o.quantity ?? 0);
    const amt = Number(o.amount ?? 0);
    if (o.side === "BUY") {
      shares += qty;
      cost += amt;
      cash -= amt;
    } else if (o.side === "SELL") {
      const avg = shares > 0 ? cost / shares : 0;
      cost -= qty * avg;
      shares -= qty;
      if (shares < 1e-9) {
        shares = 0;
        cost = 0;
      }
      cash += amt;
    }
  }
  const step = prior.length + 1;

  const quote = await getQuote(strat.symbol, strat.market);
  const intent = decideOrder(strat.kind as StrategyKind, seed, params, {
    price: quote.price,
    shares,
    cost,
    cash,
    stepIndex: step,
  });

  const dateStr = dateStrKST(now);
  const coid = clientOrderId(strategyId, strat.symbol, dateStr, step);

  // 멱등: 같은 clientOrderId 이미 있으면 재실행 차단
  const [dup] = await db.select({ id: schema.vrOrders.id }).from(schema.vrOrders).where(eq(schema.vrOrders.clientOrderId, coid)).limit(1);
  if (dup) {
    return { strategyId, symbol: strat.symbol, step, price: quote.price, action: "DUP", status: "skipped", amount: 0, shares: 0, reason: "이미 실행된 스텝(멱등)", clientOrderId: coid, dryRun: strat.dryRun };
  }

  // 오늘 실제 주문 건수 (안전 한도용)
  const todayRows = prior.filter((o) => EXECUTED.includes(o.status) && o.clientOrderId.includes(`-${dateStr}-`));
  const cfg = loadSafetyConfig();

  let status: string;
  let reason = intent.reason;

  if (intent.action === "HOLD") {
    status = "skipped";
  } else {
    const verdict = checkOrder(intent, { symbol: strat.symbol, todayOrderCount: todayRows.length }, cfg);
    if (!verdict.ok) {
      status = "blocked";
      reason = verdict.reason ?? "차단";
    } else {
      const dryRun = strat.dryRun || cfg.dryRun;
      const result = await placeOrder({
        clientOrderId: coid,
        symbol: strat.symbol,
        side: intent.action,
        orderType: "MARKET",
        quantity: intent.shares,
        price: quote.price,
      });
      status = result.status; // dry_run | submitted | failed
    }
  }

  await db.insert(schema.vrOrders).values({
    strategyId,
    clientOrderId: coid,
    symbol: strat.symbol,
    side: intent.action === "HOLD" ? "BUY" : intent.action, // HOLD 행도 기록(side는 형식상)
    orderType: "MARKET",
    quantity: intent.shares > 0 ? String(intent.shares) : null,
    price: quote.price > 0 ? String(quote.price) : null,
    amount: intent.amount > 0 ? String(intent.amount) : null,
    status,
    dryRun: strat.dryRun || cfg.dryRun,
    reason,
    raw: { step, intent: intent.detail, quoteSource: quote.source },
  });

  return {
    strategyId,
    symbol: strat.symbol,
    step,
    price: quote.price,
    action: intent.action,
    status,
    amount: intent.amount,
    shares: intent.shares,
    reason,
    clientOrderId: coid,
    dryRun: strat.dryRun || cfg.dryRun,
  };
}

void and;
void inArray;
void sql;

import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";

// POST /api/toss/position  { strategyId, shares, avgPrice, cash }
// 전략의 모의계좌 baseline 을 수동 설정/동기화. 러너가 이 시점 이후 주문만 누적.
// NOTE: UI(브라우저)에서 호출 → 무인증. paper/dry-run 설정만 변경(거래 미발생).
//       공개 배포·라이브 전환 전 반드시 사용자 인증(PIN/세션) 추가 필요.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: { strategyId?: number; shares?: number; avgPrice?: number; cash?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const { strategyId, shares = 0, avgPrice = 0, cash = 0 } = body;
  if (typeof strategyId !== "number") {
    return NextResponse.json({ error: "strategyId required" }, { status: 400 });
  }
  const avgCost = Number(shares) * Number(avgPrice);
  const now = new Date();
  await db
    .insert(schema.vrPaperAccounts)
    .values({
      strategyId,
      shares: String(shares),
      avgCost: String(avgCost),
      cash: String(cash),
      asOf: now,
      source: "manual",
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: schema.vrPaperAccounts.strategyId,
      set: { shares: String(shares), avgCost: String(avgCost), cash: String(cash), asOf: now, source: "manual", updatedAt: now },
    });
  return NextResponse.json({ ok: true, strategyId, shares, avgCost, cash, asOf: now.toISOString() });
}

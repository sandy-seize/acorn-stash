/**
 * 전략 → 주문 의도(OrderIntent) 엔진. 순수 함수 — 외부 의존 없음, 키 없이 테스트 가능.
 * VR(밸류 리밸런싱) 수식은 /vr 앱과 동일(백테스트 검증된 로직).
 */

export type StrategyKind = "vr" | "infinite" | "dca";
export type Side = "BUY" | "SELL";

export interface StrategyParams {
  /** 분할 수 (VR·infinite·dca 공통 1회 단위 = seed/T) */
  T?: number;
  /** VR 밴드 (±%, 0~) */
  band?: number;
  /** VR V값 증가 방식 */
  mode?: "linear" | "rate";
  /** VR 정률 주간 증가율 (%) */
  g?: number;
  /** 무한매수 익절률 (%, 예: 10) */
  target?: number;
  /** dca 1회 고정 매수금액(있으면 seed/T 대신 사용) */
  fixedAmount?: number;
}

export interface PositionContext {
  /** 현재가 (네이티브 통화) */
  price: number;
  /** 보유 수량 */
  shares: number;
  /** 보유분 총 취득원가 (평단 = cost/shares) */
  cost: number;
  /** 현금 잔액(이 전략에 배정된 풀 기준) */
  cash: number;
  /** 진행 스텝(주차/일차). VR=주차, infinite=일차. 1부터. */
  stepIndex: number;
}

export interface OrderIntent {
  action: Side | "HOLD";
  /** 매매 금액(통화) */
  amount: number;
  /** 환산 수량 (소수 — 주문층에서 시장별 반올림) */
  shares: number;
  /** 사람이 읽는 근거 */
  reason: string;
  /** 디버그/감사용 계산 스냅샷 */
  detail: Record<string, number>;
}

const HOLD = (reason: string, detail: Record<string, number> = {}): OrderIntent => ({
  action: "HOLD",
  amount: 0,
  shares: 0,
  reason,
  detail,
});

function unitOf(seed: number, p: StrategyParams): number {
  const T = p.T && p.T > 0 ? p.T : 40;
  return seed / T;
}

/** VR(밸류 리밸런싱): 목표 평가액 V 에 평가액을 맞춤. */
function vrIntent(seed: number, p: StrategyParams, ctx: PositionContext): OrderIntent {
  const T = p.T && p.T > 0 ? p.T : 40;
  const unit = seed / T;
  const band = (p.band ?? 0) / 100;
  const week = Math.max(1, ctx.stepIndex);
  const Vt =
    p.mode === "rate"
      ? Math.min(unit * Math.pow(1 + (p.g ?? 0) / 100, week - 1), seed)
      : Math.min(unit * week, seed);
  const val = ctx.shares * ctx.price;
  const lo = Vt * (1 - band);
  const hi = Vt * (1 + band);
  const detail = { Vt, val, week, unit };

  if (val < lo) {
    const need = Vt - val;
    const amount = Math.max(0, Math.min(need, ctx.cash));
    if (amount <= 0) return HOLD("현금 부족 — 매수 불가", detail);
    return { action: "BUY", amount, shares: amount / ctx.price, reason: `목표 V값(${Math.round(Vt)})까지 매수`, detail };
  }
  if (val > hi) {
    const amount = val - Vt;
    return { action: "SELL", amount, shares: amount / ctx.price, reason: `V값 초과분 매도`, detail };
  }
  return HOLD("평가액이 V값 밴드 내 — 관망", detail);
}

/** 무한매수법: 매 스텝 1단위 매수, 평단 +target% 도달 시 전량 익절. */
function infiniteIntent(seed: number, p: StrategyParams, ctx: PositionContext): OrderIntent {
  const unit = unitOf(seed, p);
  const target = (p.target ?? 10) / 100;
  const avg = ctx.shares > 0 ? ctx.cost / ctx.shares : 0;
  const detail = { unit, avg, target };

  if (ctx.shares > 0 && ctx.price >= avg * (1 + target)) {
    const amount = ctx.shares * ctx.price;
    return { action: "SELL", amount, shares: ctx.shares, reason: `평단 +${(target * 100).toFixed(0)}% 익절(전량)`, detail };
  }
  const amount = Math.max(0, Math.min(unit, ctx.cash));
  if (amount <= 0) return HOLD("현금 소진 — 사이클 종료 대기", detail);
  return { action: "BUY", amount, shares: amount / ctx.price, reason: `1단위(${Math.round(unit)}) 분할 매수`, detail };
}

/** DCA(정액 분할): 매 스텝 고정 금액 매수. */
function dcaIntent(seed: number, p: StrategyParams, ctx: PositionContext): OrderIntent {
  const amountTarget = p.fixedAmount && p.fixedAmount > 0 ? p.fixedAmount : unitOf(seed, p);
  const amount = Math.max(0, Math.min(amountTarget, ctx.cash));
  const detail = { amountTarget };
  if (amount <= 0) return HOLD("현금 소진 — 매수 불가", detail);
  return { action: "BUY", amount, shares: amount / ctx.price, reason: `정액 분할 매수(${Math.round(amountTarget)})`, detail };
}

export function decideOrder(
  kind: StrategyKind,
  seed: number,
  params: StrategyParams,
  ctx: PositionContext,
): OrderIntent {
  if (!(ctx.price > 0)) return HOLD("유효 가격 없음");
  switch (kind) {
    case "vr":
      return vrIntent(seed, params, ctx);
    case "infinite":
      return infiniteIntent(seed, params, ctx);
    case "dca":
      return dcaIntent(seed, params, ctx);
    default:
      return HOLD(`알 수 없는 전략: ${kind}`);
  }
}

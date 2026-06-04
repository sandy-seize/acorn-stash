/**
 * 자동매매 안전 하네스. 3단계(무인 자동)라 필수.
 * 모든 값은 env 로 제어. 기본은 가장 안전한 쪽(dry-run ON, 보수적 한도).
 */
import type { OrderIntent } from "../strategy/engine";

export interface SafetyConfig {
  /** 모의 모드 — true 면 절대 실주문 안 함 (기본 true). */
  dryRun: boolean;
  /** 전역 정지 — true 면 모든 주문 차단. */
  killSwitch: boolean;
  /** 1회 최대 주문 금액(통화). 0=무제한 비권장. */
  maxOrderAmount: number;
  /** 일일 최대 주문 건수. */
  dailyOrderCap: number;
  /** 허용 심볼(비면 전체 허용). */
  symbolAllowlist: string[];
}

function num(v: string | undefined, dflt: number): number {
  const n = v != null ? Number(v) : NaN;
  return Number.isFinite(n) ? n : dflt;
}

export function loadSafetyConfig(): SafetyConfig {
  // 라이브 전환은 명시적으로 TOSS_DRY_RUN=false + 자격증명 둘 다 있어야 가능(client 에서 재확인).
  const dryRun = process.env.TOSS_DRY_RUN !== "false";
  return {
    dryRun,
    killSwitch: process.env.TOSS_KILL_SWITCH === "true",
    maxOrderAmount: num(process.env.TOSS_MAX_ORDER_AMOUNT, 1_000_000), // 기본 100만
    dailyOrderCap: num(process.env.TOSS_DAILY_ORDER_CAP, 10),
    symbolAllowlist: (process.env.TOSS_SYMBOL_ALLOWLIST || "")
      .split(",")
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean),
  };
}

export interface SafetyVerdict {
  ok: boolean;
  /** 차단 시 사유. */
  reason?: string;
}

export function checkOrder(
  intent: OrderIntent,
  ctx: { symbol: string; todayOrderCount: number },
  cfg: SafetyConfig = loadSafetyConfig(),
): SafetyVerdict {
  if (intent.action === "HOLD") return { ok: true };
  if (cfg.killSwitch) return { ok: false, reason: "kill-switch 활성 — 전체 주문 차단" };
  if (cfg.symbolAllowlist.length > 0 && !cfg.symbolAllowlist.includes(ctx.symbol.toUpperCase())) {
    return { ok: false, reason: `허용 목록 밖 심볼: ${ctx.symbol}` };
  }
  if (ctx.todayOrderCount >= cfg.dailyOrderCap) {
    return { ok: false, reason: `일일 주문 한도 초과 (${ctx.todayOrderCount}/${cfg.dailyOrderCap})` };
  }
  if (cfg.maxOrderAmount > 0 && intent.amount > cfg.maxOrderAmount) {
    return { ok: false, reason: `1회 최대 금액 초과 (${Math.round(intent.amount)} > ${cfg.maxOrderAmount})` };
  }
  return { ok: true };
}

/** 멱등 키 — 같은 전략·심볼·날짜·스텝이면 동일. 재실행 시 중복 주문 방지. */
export function clientOrderId(strategyId: number, symbol: string, dateStr: string, stepIndex: number): string {
  return `s${strategyId}-${symbol}-${dateStr}-step${stepIndex}`;
}

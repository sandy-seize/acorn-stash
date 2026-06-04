/**
 * Toss OpenAPI 클라이언트 — 인터페이스 + dry-run 시뮬레이터.
 *
 * ⚠️ 라이브 HTTP 는 (1) 자격증명(TOSS_CLIENT_ID/SECRET) 존재 AND (2) TOSS_DRY_RUN=false
 *    일 때만 동작. 둘 중 하나라도 없으면 절대 네트워크/실주문 안 함(시뮬레이션).
 * ⚠️ 실제 요청/응답 형태는 토스 공식 문서 수령 후 확정 — 아래 라이브 경로는
 *    제공된 스니펫 기준 잠정 구현이며 키 도착 시 검증·수정 필요. (TODO: verify)
 *
 * BASE 후보가 스니펫마다 달랐음(`/v1` vs `/api/v1`) — env 로 오버라이드 가능하게 둠.
 */
import { loadSafetyConfig } from "./safety";
import type { Side } from "../strategy/engine";

const BASE = process.env.TOSS_API_BASE || "https://openapi.tossinvest.com";

export function hasCredentials(): boolean {
  return !!(process.env.TOSS_CLIENT_ID && process.env.TOSS_CLIENT_SECRET);
}

/** 실제 네트워크/실주문 가능 여부. 안전 기본값: 불가. */
export function isLive(): boolean {
  return hasCredentials() && loadSafetyConfig().dryRun === false;
}

export interface Quote {
  symbol: string;
  price: number;
  currency: string;
  source: "toss" | "yahoo" | "sim";
}

export interface Holding {
  symbol: string;
  name: string | null;
  quantity: number;
  avgPrice: number | null;
  plRate: number | null;
}

export interface OrderRequest {
  clientOrderId: string;
  symbol: string;
  side: Side;
  orderType: "MARKET" | "LIMIT";
  quantity: number;
  price?: number;
}

export interface OrderResult {
  ok: boolean;
  status: "dry_run" | "submitted" | "failed";
  simulated: boolean;
  raw?: unknown;
  error?: string;
}

/* ---------------- 시세 (읽기 — 공개 데이터, 키 불필요) ---------------- */
// dry-run·라이브 공통으로 실제 공개가를 사용(현실적 모의). 국내=Toss, 미국=Yahoo.
export async function getQuote(symbol: string, market: string): Promise<Quote> {
  const c = symbol.toUpperCase();
  const isKR = market === "KR" || /^A?\d{6}$/.test(c);
  try {
    if (isKR) {
      const code = c.startsWith("A") ? c : "A" + c;
      const j = await fetch(`https://wts-info-api.tossinvest.com/api/v2/stock-prices?codes=${code}`, {
        headers: { "User-Agent": "Mozilla/5.0", Referer: "https://www.tossinvest.com/" },
      }).then((r) => r.json());
      const p = j?.result?.prices?.[0];
      if (p?.close != null) return { symbol: c, price: Number(p.close), currency: p.currency || "KRW", source: "toss" };
    } else {
      const j = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(c)}?interval=1d&range=1d`,
        { headers: { "User-Agent": "Mozilla/5.0" } },
      ).then((r) => r.json());
      const m = j?.chart?.result?.[0]?.meta;
      if (m?.regularMarketPrice != null) return { symbol: c, price: Number(m.regularMarketPrice), currency: m.currency || "USD", source: "yahoo" };
    }
  } catch {
    /* fallthrough to sim */
  }
  return { symbol: c, price: 0, currency: isKR ? "KRW" : "USD", source: "sim" };
}

/* ---------------- 토큰/계좌/보유 (라이브는 키 필요) ---------------- */
async function getToken(): Promise<string | null> {
  if (!isLive()) return null;
  // TODO(verify): 공식 문서로 grant/scope 확정
  const res = await fetch(`${BASE}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: process.env.TOSS_CLIENT_ID!,
      client_secret: process.env.TOSS_CLIENT_SECRET!,
    }),
  });
  const j = await res.json();
  return j?.access_token ?? null;
}

export async function getHoldings(): Promise<Holding[]> {
  if (!isLive()) return []; // dry-run: 계좌 미연결 → 빈 보유(포지션은 주문로그로 시뮬)
  const token = await getToken();
  if (!token) return [];
  // TODO(verify): accounts → accountSeq → holdings 경로/필드 확정
  const auth = { Authorization: `Bearer ${token}` };
  const accounts = await fetch(`${BASE}/api/v1/accounts`, { headers: auth }).then((r) => r.json());
  const accountSeq = accounts?.result?.[0]?.accountSeq;
  if (accountSeq == null) return [];
  const h = await fetch(`${BASE}/api/v1/holdings`, {
    headers: { ...auth, "X-Tossinvest-Account": String(accountSeq) },
  }).then((r) => r.json());
  const items = h?.items ?? h?.result?.items ?? [];
  return items.map((it: Record<string, unknown>) => ({
    symbol: String(it.symbol ?? ""),
    name: (it.name as string) ?? null,
    quantity: Number(it.quantity ?? 0),
    avgPrice: it.avgPrice != null ? Number(it.avgPrice) : null,
    plRate: (it as { profitLoss?: { rate?: number } }).profitLoss?.rate ?? null,
  }));
}

/* ---------------- 주문 ---------------- */
export async function placeOrder(order: OrderRequest): Promise<OrderResult> {
  // 안전 게이트: 라이브 아니면 무조건 시뮬.
  if (!isLive()) {
    return { ok: true, status: "dry_run", simulated: true, raw: { note: "dry-run: 네트워크 미발생", order } };
  }
  // ===== 여기부터 실주문 (키 + TOSS_DRY_RUN=false 일 때만 도달) =====
  try {
    const token = await getToken();
    if (!token) return { ok: false, status: "failed", simulated: false, error: "token 발급 실패" };
    const accounts = await fetch(`${BASE}/api/v1/accounts`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json());
    const accountSeq = accounts?.result?.[0]?.accountSeq;
    // TODO(verify): orders 바디 필드(quantity 문자열? price 조건?) 공식 문서로 확정
    const res = await fetch(`${BASE}/api/v1/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Tossinvest-Account": String(accountSeq),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        clientOrderId: order.clientOrderId,
        symbol: order.symbol,
        side: order.side,
        orderType: order.orderType,
        quantity: String(order.quantity),
        ...(order.orderType === "LIMIT" && order.price != null ? { price: String(order.price) } : {}),
      }),
    });
    const raw = await res.json();
    return { ok: res.ok, status: res.ok ? "submitted" : "failed", simulated: false, raw, error: res.ok ? undefined : "주문 실패" };
  } catch (e) {
    return { ok: false, status: "failed", simulated: false, error: String(e instanceof Error ? e.message : e) };
  }
}

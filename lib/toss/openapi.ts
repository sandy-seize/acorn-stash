/**
 * 토스증권 Open API — 마켓데이터 읽기 클라이언트 (현재가·종목정보·일봉).
 *
 * lib/toss/client.ts(주문/계좌·dry-run 게이트)와 별개로, 시세 적재(ingest) 전용.
 * 인증: OAuth2 client_credentials (TOSS_API_KEY / TOSS_SECRET_KEY).
 * 자격증명은 process.env 우선, 없으면 ~/.zshrc·~/.zprofile·~/.profile 의
 * `export NAME=...` 폴백으로 읽는다(토스 공식 CLI와 동일 동작). Vercel 등
 * 서버 환경에선 env 가 채워져 있으므로 폴백은 사용되지 않는다.
 */
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const BASE = process.env.TOSS_API_BASE || "https://openapi.tossinvest.com";

function fromShellFiles(name: string): string | undefined {
  for (const f of [".zshrc", ".zprofile", ".profile"]) {
    try {
      const txt = readFileSync(join(homedir(), f), "utf8");
      const m = txt.match(new RegExp(`^\\s*export\\s+${name}=["']?([^"'\\n]+)`, "m"));
      if (m) return m[1].trim();
    } catch {
      /* 파일 없음 → 다음 */
    }
  }
  return undefined;
}

function cred(...names: string[]): string | undefined {
  for (const n of names) if (process.env[n]) return process.env[n];
  for (const n of names) {
    const v = fromShellFiles(n);
    if (v) return v;
  }
  return undefined;
}

export function loadTossCreds(): { clientId?: string; clientSecret?: string } {
  return {
    clientId: cred("TOSS_API_KEY", "TOSSINVEST_CLIENT_ID", "TOSS_CLIENT_ID"),
    clientSecret: cred("TOSS_SECRET_KEY", "TOSSINVEST_CLIENT_SECRET", "TOSS_CLIENT_SECRET"),
  };
}

let cachedToken: { value: string; expiresAt: number } | null = null;
let inflight: Promise<string> | null = null;

export async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) return cachedToken.value;
  // 동시 호출이 토큰을 중복 발급하지 않도록 in-flight 공유
  // (토스는 client_credentials 재발급 시 직전 토큰을 무효화 → 레이스로 401)
  if (inflight) return inflight;
  inflight = issueToken().finally(() => {
    inflight = null;
  });
  return inflight;
}

async function issueToken(): Promise<string> {
  const { clientId, clientSecret } = loadTossCreds();
  if (!clientId || !clientSecret) {
    throw new Error("토스 자격증명 없음: TOSS_API_KEY / TOSS_SECRET_KEY 를 설정하세요.");
  }
  const res = await fetch(`${BASE}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });
  const j = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!res.ok || !j.access_token) throw new Error(`토큰 발급 실패 (HTTP ${res.status})`);
  cachedToken = {
    value: j.access_token,
    expiresAt: Date.now() + (j.expires_in ?? 600) * 1000,
  };
  return j.access_token;
}

async function apiGet<T>(path: string, query: Record<string, string>): Promise<T> {
  const token = await getAccessToken();
  const qs = new URLSearchParams(query).toString();
  const res = await fetch(`${BASE}${path}?${qs}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });
  const j = await res.json();
  if (!res.ok) throw new Error(`${path} 실패 (HTTP ${res.status})`);
  return j as T;
}

export interface TossPrice {
  symbol: string;
  timestamp: string | null;
  lastPrice: string;
  currency: string;
}
export interface TossStock {
  symbol: string;
  name: string;
  market: string;
  currency: string;
  sharesOutstanding: string | null;
}
export interface TossCandle {
  timestamp: string;
  closePrice: string;
  volume: string;
  currency: string;
}

/** 현재가 (쉼표구분 다종목). */
export async function getPrices(symbols: string[]): Promise<TossPrice[]> {
  const j = await apiGet<{ result: TossPrice[] }>("/api/v1/prices", { symbols: symbols.join(",") });
  return j.result ?? [];
}

/** 종목 기본정보 (상장주식수·통화·시장). */
export async function getStocks(symbols: string[]): Promise<TossStock[]> {
  const j = await apiGet<{ result: TossStock[] }>("/api/v1/stocks", { symbols: symbols.join(",") });
  return j.result ?? [];
}

/** 일봉 (최신 우선). count=2 면 [오늘, 전일]. */
export async function getDailyCandles(symbol: string, count = 2): Promise<TossCandle[]> {
  const j = await apiGet<{ result: { candles: TossCandle[] } }>("/api/v1/candles", {
    symbol,
    interval: "1d",
    count: String(count),
  });
  return j.result?.candles ?? [];
}

/** KOSPI/KOSDAQ → KR, 그 외 → US. */
export function regionForMarket(market: string): string {
  return /KOSPI|KOSDAQ|KONEX/i.test(market) ? "KR" : "US";
}

/**
 * 표시용 포매터 — 통화/시총/거래량/상대시간.
 */

const CURRENCY_SYMBOL: Record<string, string> = {
  KRW: "₩",
  USD: "$",
  HKD: "HK$",
  CNY: "CN¥",
};

export function formatPrice(price: number | null, currency: string): string {
  if (price === null || price === undefined) return "—";
  const sym = CURRENCY_SYMBOL[currency] ?? "";
  if (currency === "KRW") {
    return `${sym}${Math.round(price).toLocaleString("en-US")}`;
  }
  return `${sym}${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatChangePct(pct: number | null): string {
  if (pct === null || pct === undefined) return "—";
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(2)}%`;
}

export function formatMarketCapNative(value: number | null, currency: string): string {
  if (value === null || value === undefined || value <= 0) return "—";
  const sym = CURRENCY_SYMBOL[currency] ?? "";
  if (currency === "KRW") {
    if (value >= 1e16) return `${sym}${(value / 1e16).toFixed(2)}경`;
    if (value >= 1e12) return `${sym}${(value / 1e12).toFixed(2)}조`;
    if (value >= 1e8) return `${sym}${(value / 1e8).toLocaleString("en-US", { maximumFractionDigits: 0 })}억`;
    return `${sym}${value.toLocaleString()}`;
  }
  if (value >= 1e12) return `${sym}${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `${sym}${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `${sym}${(value / 1e6).toFixed(2)}M`;
  return `${sym}${value.toLocaleString()}`;
}

export function formatVolume(volume: number | null): string {
  if (volume === null || volume === undefined) return "—";
  if (volume >= 1e9) return `${(volume / 1e9).toFixed(2)}B`;
  if (volume >= 1e6) return `${(volume / 1e6).toFixed(2)}M`;
  if (volume >= 1e3) return `${(volume / 1e3).toFixed(1)}K`;
  return volume.toLocaleString();
}

export function formatMetric(n: number | null, fractionDigits = 2): string {
  if (n === null || n === undefined) return "—";
  return n.toLocaleString("en-US", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

export function formatRelativeTime(date: Date | string | null): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return `${Math.floor(diff)}초 전`;
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  return `${Math.floor(diff / 86400)}일 전`;
}

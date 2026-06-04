import { NextResponse } from "next/server";

// GET /api/price?code=...&market=KR|US
//  · 국내(A코드/6자리) → Toss   · 미국(티커) → Yahoo
// 브라우저 CORS 회피용 서버사이드 프록시. /vr 앱이 이 응답 형태에 의존.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = (searchParams.get("code") || "").trim();
  const market = (searchParams.get("market") || "").trim().toUpperCase();
  if (!raw) return NextResponse.json({ error: "code required" }, { status: 400 });

  const c = raw.toUpperCase();
  const isKR = market === "KR" || (market !== "US" && /^A?\d{6}$/.test(c));

  const headers = {
    "Cache-Control": "s-maxage=30, stale-while-revalidate=120",
  };

  try {
    if (isKR) {
      const tossCode = c.startsWith("A") ? c : "A" + c;
      const base = "https://wts-info-api.tossinvest.com/api/v2";
      const h = { "User-Agent": "Mozilla/5.0", Referer: "https://www.tossinvest.com/" };
      const [pr, info] = await Promise.all([
        fetch(`${base}/stock-prices?codes=${tossCode}`, { headers: h }).then((r) => r.json()).catch(() => null),
        fetch(`${base}/stock-infos/${tossCode}`, { headers: h }).then((r) => r.json()).catch(() => null),
      ]);
      const p = pr?.result?.prices?.[0];
      if (!p) return NextResponse.json({ error: "not found", code: tossCode }, { status: 404 });
      const name = info?.result ? info.result.name || info.result.detailName : undefined;
      return NextResponse.json(
        { source: "toss", code: tossCode, name, price: p.close, currency: p.currency || "KRW", changeType: p.changeType, asOf: p.tradingEnd },
        { headers },
      );
    }

    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(c)}?interval=1d&range=1d`;
    const j = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } }).then((r) => r.json());
    const m = j?.chart?.result?.[0]?.meta;
    if (!m || m.regularMarketPrice == null) {
      return NextResponse.json({ error: "not found", code: c }, { status: 404 });
    }
    const prev = m.chartPreviousClose ?? m.previousClose;
    const changeType =
      prev == null ? null : m.regularMarketPrice > prev ? "UP" : m.regularMarketPrice < prev ? "DOWN" : "FLAT";
    return NextResponse.json(
      {
        source: "yahoo",
        code: m.symbol || c,
        name: m.longName || m.shortName || m.symbol || c,
        price: m.regularMarketPrice,
        currency: m.currency || "USD",
        changeType,
        asOf: m.regularMarketTime ? new Date(m.regularMarketTime * 1000).toISOString() : undefined,
      },
      { headers },
    );
  } catch (e) {
    return NextResponse.json({ error: "fetch failed", detail: String(e instanceof Error ? e.message : e) }, { status: 502 });
  }
}

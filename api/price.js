// /api/price — 가격 프록시 (브라우저 CORS 회피용 서버사이드 fetch)
//  · 한국 주식: A코드/6자리 숫자  →  Toss (wts-info-api)
//  · 미국 주식: 티커(SOXL 등)     →  Yahoo Finance
// 응답 형태 통일: { source, code, name, price, currency, changeType, asOf }
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=120');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  const q = req.query || {};
  const raw = String(q.code || '').trim();
  const market = String(q.market || '').trim().toUpperCase(); // 'KR' | 'US' | ''
  if (!raw) return res.status(400).json({ error: 'code required' });

  const c = raw.toUpperCase();
  const isKR = market === 'KR' || (market !== 'US' && /^A?\d{6}$/.test(c));

  try {
    if (isKR) {
      const tossCode = c.startsWith('A') ? c : 'A' + c;
      const base = 'https://wts-info-api.tossinvest.com/api/v2';
      const headers = { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://www.tossinvest.com/' };
      // 가격 + 종목명 병렬 조회
      const [pr, info] = await Promise.all([
        fetch(`${base}/stock-prices?codes=${tossCode}`, { headers }).then(r => r.json()).catch(() => null),
        fetch(`${base}/stock-infos/${tossCode}`, { headers }).then(r => r.json()).catch(() => null),
      ]);
      const p = pr && pr.result && pr.result.prices && pr.result.prices[0];
      if (!p) return res.status(404).json({ error: 'not found', code: tossCode });
      const name = info && info.result ? (info.result.name || info.result.detailName) : undefined;
      return res.status(200).json({
        source: 'toss',
        code: tossCode,
        name,
        price: p.close,
        currency: p.currency || 'KRW',
        changeType: p.changeType,
        asOf: p.tradingEnd,
      });
    }

    // 미국 주식 → Yahoo
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(c)}?interval=1d&range=1d`;
    const j = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }).then(r => r.json());
    const r0 = j && j.chart && j.chart.result && j.chart.result[0];
    const m = r0 && r0.meta;
    if (!m || m.regularMarketPrice == null) {
      return res.status(404).json({ error: 'not found', code: c });
    }
    const prev = m.chartPreviousClose ?? m.previousClose;
    const changeType = prev == null ? null : (m.regularMarketPrice > prev ? 'UP' : m.regularMarketPrice < prev ? 'DOWN' : 'FLAT');
    return res.status(200).json({
      source: 'yahoo',
      code: m.symbol || c,
      name: m.longName || m.shortName || m.symbol || c,
      price: m.regularMarketPrice,
      currency: m.currency || 'USD',
      changeType,
      asOf: m.regularMarketTime ? new Date(m.regularMarketTime * 1000).toISOString() : undefined,
    });
  } catch (e) {
    return res.status(502).json({ error: 'fetch failed', detail: String(e && e.message || e) });
  }
};

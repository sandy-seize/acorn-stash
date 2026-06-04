/**
 * 미래 데이터 API → acorn-stash ingest 계약(contract).
 * 외부 API 팀은 아래 바디 형태로 각 엔드포인트에 POST 한다.
 *
 *   POST /api/ingest/vr-tickers   { items: VrTickerIngest[] }
 *   POST /api/ingest/vr-prices    { items: VrPriceIngest[] }
 *   POST /api/ingest/vr-mentions  { items: VrMentionIngest[] }
 *
 * 인증: Authorization: Bearer <VR_INGEST_SECRET>
 */

/** 종목 메타 (vr_tickers upsert, symbol 기준). */
export interface VrTickerIngest {
  symbol: string;
  exchange: string;
  sourceUrl: string;
  companyName: string;
  category: string;
  region: string; // 'KR' | 'US' | 'HK' | 'CN'
  source?: string; // 데이터 출처 라벨(기본 'api')
  active?: boolean;
}

/** 가격 스냅샷 (vr_price_snapshots, symbol→ticker 매핑). */
export interface VrPriceIngest {
  symbol: string;
  /** ISO8601. 생략 시 서버 now. */
  capturedAt?: string;
  price?: number | null;
  changePct?: number | null;
  volume?: number | null;
  marketCapNative?: number | null;
  rawCurrency?: string | null;
  /** 펀더멘털(있으면 vr_metrics_snapshots 에도 적재). */
  peTtm?: number | null;
}

/** 언급량 버킷 (vr_news_mention_counts). */
export interface VrMentionIngest {
  symbol: string;
  /** ISO8601, 시간 단위 truncated 권장. */
  hourBucket: string;
  source?: string; // 기본 'google_news'
  count: number;
  sampleUrls?: string[];
}

/**
 * Sector Research 대분류 — 중분류(섹터) 목록 + 섹터별 리서치 콘텐츠.
 * 홈(app/page.tsx)과 상세(app/sector/[slug]/page.tsx)가 공유.
 *
 * href 가 있으면 그 경로로 이동(기존 리포트 재사용), 없으면 /sector/[slug].
 * content 가 있으면 상세 페이지가 밸류체인·종목·포인트를 렌더, 없으면 "준비 중".
 */
export interface SectorSource {
  label: string;
  url: string;
}

export interface SectorMetric {
  label: string;
  value: string;
}

export interface SectorStock {
  symbol: string;
  name: string; // 예: "마이크론 (Micron, MU)"
  exchange?: string;
  /** 한 줄 투자 논지. */
  thesis: string;
  metrics?: SectorMetric[];
  /** 분석 포인트(출처 기반). */
  points: string[];
  /** 주의/리스크. */
  risks?: string[];
  sources?: SectorSource[];
  /** 기준 시점 표기. */
  asOf?: string;
}

export interface SectorContent {
  valueChain?: string[];
  stocks?: SectorStock[];
}

export interface Sector {
  slug: string;
  label: string;
  emoji: string;
  summary: string;
  /** 외부/기존 경로 오버라이드. 없으면 /sector/[slug] 스캐폴드. */
  href?: string;
  content?: SectorContent;
}

const SEMICONDUCTOR: SectorContent = {
  valueChain: [
    "설계(팹리스)",
    "파운드리",
    "메모리 (DRAM·NAND·HBM)",
    "소부장 (소재·부품·장비)",
    "후공정 (패키징·HBM TSV)",
    "세트·데이터센터",
  ],
  stocks: [
    {
      symbol: "MU",
      name: "마이크론 (Micron Technology, MU)",
      exchange: "NASDAQ",
      thesis: "AI 메모리(HBM) 슈퍼사이클의 직접 수혜 — 이익 구조가 구조적으로 레벨업",
      asOf: "2026년 6월 기준",
      metrics: [
        { label: "현재가", value: "$1,132.33 (-6.69%)" },
        { label: "시가총액", value: "$1.28T" },
        { label: "52주", value: "$103.38 – $1,255.00" },
        { label: "PER", value: "25.55배" },
        { label: "EPS", value: "$44.86" },
        { label: "ROE", value: "66.6%" },
        { label: "평균 목표주가", value: "$1,420.63 (+25.5%)" },
      ],
      points: [
        "FY26 3분기 어닝 서프라이즈 — 매출 $41.46B(예상 $35.91B 상회), 조정 EPS $25.11, 매출총이익률 84.9%. 4분기 가이던스 매출 약 $50B·EPS 약 $31. (investing.com)",
        "DRAM $31.3B(전년 대비 3배↑)·NAND $9.9B(약 4배↑) — AI 데이터센터 수요가 메모리 전 라인을 견인. (investing.com)",
        "HBM4가 전세대 2배 속도로 램프, 고객 주문은 2028년 이후까지 예약. HBM 시장(TAM)은 2027년 $1,000억 돌파 전망. (investing.com)",
        "전략적 고객계약(SCA) 16건 — 5년 만기 take-or-pay·가격 하한선 → 다운사이클에도 수익성 방어(구조적 변화). (investing.com)",
        "목표주가 상향 러시 — 서스케하나 $1,750→$2,000, 번스타인 $510→$1,300(HBM 가격 2~2.5배 인상 모델링). (investing.com)",
        "마이크론 서프라이즈가 삼성전자(100조대)·SK하이닉스(70조대) 실적 전망까지 견인 — 업종 센티먼트 촉매. (news1)",
      ],
      risks: [
        "전일 주가 -6.69% 급락 — 차익실현 + 캐펙스 증액 우려(번스타인: 최대 30% 설비투자 증액 가능성 경고).",
        "PER 25배대는 사이클 고점 논쟁 — HBM 가격·가동률 둔화 시 멀티플 부담.",
      ],
      sources: [
        { label: "investing.com — 마이크론 실적·목표가 기사", url: "https://kr.investing.com/news/stock-market-news/article-1998114" },
        { label: "news1 — 한국 메모리 실적 전망", url: "https://www.news1.kr/industry/general-industry/6209945" },
        { label: "investing.com — MU 종목 지표", url: "https://kr.investing.com/equities/micron-tech" },
      ],
    },
  ],
};

export const SECTORS: Sector[] = [
  { slug: "semiconductor", label: "반도체", emoji: "🔬", summary: "파운드리·메모리·소부장 밸류체인 동향", content: SEMICONDUCTOR },
  { slug: "battery", label: "이차전지", emoji: "🔋", summary: "셀·소재·전고체 차세대 배터리" },
  { slug: "bio", label: "바이오", emoji: "🧬", summary: "신약·CDMO·플랫폼 바이오" },
  { slug: "robotics", label: "로보틱스", emoji: "🦾", summary: "휴머노이드·협동로봇·자동화" },
  { slug: "copper", label: "구리", emoji: "⛏️", summary: "전기동 수급·FCX peer 6사 비교", href: "/fcx" },
];

export function sectorHref(s: Sector): string {
  return s.href ?? `/sector/${s.slug}`;
}

export function getSector(slug: string): Sector | undefined {
  return SECTORS.find((s) => s.slug === slug);
}

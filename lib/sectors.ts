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
    {
      symbol: "NVDA",
      name: "엔비디아 (NVIDIA, NVDA)",
      exchange: "NASDAQ",
      thesis: "AI 가속기 사실상 표준 — 메모리·파운드리 수요를 끌어올리는 수요측 엔진",
      asOf: "2026년 6월 기준",
      metrics: [
        { label: "현재가", value: "$192.53 (-1.64%)" },
        { label: "시가총액", value: "$4.66T" },
        { label: "52주", value: "$151.49 – $236.54" },
        { label: "PER", value: "29.76배" },
        { label: "EPS", value: "$6.53" },
        { label: "평균 목표주가", value: "$300.59 (+56%)" },
      ],
      points: [
        "데이터센터 AI 가속기 사실상 독점 — 매출 $253.49B, 매출총이익률 74.1%로 AI 반도체 지배력 확인. (investing.com)",
        "애널리스트 61명 중 58명 매수·평균 목표가 +56% 여력 — 강한 컨센서스. 차기 실적 2026-08-26. (investing.com)",
        "HBM 최대 수요처 — 가속기 1장당 HBM 탑재량 증가가 마이크론·SK하이닉스·삼성 메모리 슈퍼사이클의 근원 수요. (밸류체인 연계)",
      ],
      risks: [
        "기술적 지표 단기 약세 + 밸류 부담(시총 $4.66T) — AI 캐펙스 둔화·관세/수출규제 노출.",
      ],
      sources: [
        { label: "investing.com — NVDA 종목 지표", url: "https://kr.investing.com/equities/nvidia-corp" },
      ],
    },
    {
      symbol: "TSM",
      name: "TSMC (대만 반도체, TSM)",
      exchange: "NYSE (ADR)",
      thesis: "AI 칩 위탁생산 사실상 독점 — 첨단공정 캐파가 AI 공급의 병목이자 해법",
      asOf: "2026년 6월 기준",
      metrics: [
        { label: "현재가", value: "$432.35" },
        { label: "시가총액", value: "$2.24T" },
        { label: "52주", value: "$221.18 – $476.79" },
        { label: "PER", value: "27.4배 (fwd)" },
        { label: "평균 목표주가", value: "$478.95 (최고 $700)" },
      ],
      points: [
        "글로벌 파운드리 독점적 지위 — 엔비디아·애플 등 AI·모바일 첨단칩 위탁생산의 핵심. (stockanalysis)",
        "목표주가 상향 러시 — BofA $490→$590, 서스케하나 $500→$575. 3/2nm 캐파 증설이 AI 공급 병목 해소 키. (investing.com)",
      ],
      risks: [
        "지정학(양안) 리스크·고객 집중도. 첨단공정 캐펙스 부담과 환율 변수.",
      ],
      sources: [
        { label: "investing.com — TSM 종목", url: "https://www.investing.com/equities/taiwan-semicond.manufacturing-co" },
        { label: "stockanalysis — TSM 지표", url: "https://stockanalysis.com/stocks/tsm/" },
      ],
    },
    {
      symbol: "000660",
      name: "SK하이닉스 (000660)",
      exchange: "KOSPI",
      thesis: "HBM 선두주자 — '영업이익률의 SK하이닉스', 엔비디아 주력 공급사",
      asOf: "2026년 6월 기준",
      metrics: [
        { label: "현재가", value: "약 ₩2,542,000" },
        { label: "52주", value: "₩245,000 – ₩2,987,000" },
        { label: "목표주가", value: "₩3,800,000 (Buy)" },
      ],
      points: [
        "HBM 시장 선두 — 엔비디아 가속기 주력 공급. 1분기 매출 50조원 돌파·사상 최대 영업이익 경신 중. (KB)",
        "2027년 HBM 가격 전년比 100%+ 상승 전망(범용 DRAM 대비 마진 격차 축소). (KB)",
        "한국 메모리 2강 중 '수익성 우위' 포지션 — 마이크론 서프라이즈가 업종 센티먼트 견인. (news1)",
      ],
      sources: [
        { label: "KBthink — SK하이닉스 목표주가 리포트", url: "https://kbthink.com/securities-view.html?docId=20260623190056390K" },
        { label: "investing.com — SK하이닉스(000660)", url: "https://www.investing.com/equities/sk-hynix-inc" },
        { label: "토스증권 — 000660 실시간", url: "https://www.tossinvest.com/stocks/A000660" },
      ],
    },
    {
      symbol: "005930",
      name: "삼성전자 (005930)",
      exchange: "KOSPI",
      thesis: "'규모의 삼성' — HBM4·SOCAMM2 첫 양산으로 메모리 슈퍼사이클 본격 합류",
      asOf: "2026년 6월 기준",
      metrics: [
        { label: "현재가", value: "약 ₩317,250" },
        { label: "목표주가", value: "₩330,000 (상향, Buy)" },
        { label: "2026 매출(E)", value: "약 478조원" },
        { label: "2026 영업익(E)", value: "약 148조원" },
      ],
      points: [
        "HBM4·SOCAMM2 첫 양산 출하로 DS부문 실적 개선 — 2026년 HBM 매출 전년比 3배+ 전망. (키움)",
        "절대 규모 우위('규모의 삼성') — 파운드리·메모리·세트 종합 포트폴리오. 목표주가 26만→33만원 상향. (키움)",
      ],
      risks: [
        "HBM 경쟁력에서 SK하이닉스 추격 중 — 고객 검증·수율이 관건. 파운드리 적자 부담.",
      ],
      sources: [
        { label: "키움증권 — 삼성전자 목표주가 상향 리포트", url: "https://bbn.kiwoom.com/rfCR12086" },
        { label: "유진투자증권 — 삼성전자 리포트", url: "https://www.eugenefn.com/common/files/amail//20260130_005930_sophie.yim_114.pdf" },
        { label: "토스증권 — 005930 실시간", url: "https://www.tossinvest.com/stocks/A005930" },
      ],
    },
  ],
};

const AEROSPACE: SectorContent = {
  valueChain: [
    "발사체 (로켓)",
    "위성 제조",
    "위성통신 서비스",
    "지상장비·단말",
    "우주탐사·인프라",
  ],
  stocks: [
    {
      symbol: "SPCX",
      name: "스페이스X (SpaceX, SPCX)",
      exchange: "NASDAQ",
      thesis: "발사 시장 독점적 cadence + 스타링크 현금창출 — 2026.6 美 역사상 최대 IPO로 상장",
      asOf: "2026년 6월 기준",
      metrics: [
        { label: "현재가", value: "$153.23 (+0.15%)" },
        { label: "시가총액", value: "$2.02T" },
        { label: "52주", value: "$135.00 – $225.64" },
        { label: "매출(연)", value: "약 $19.3B" },
        { label: "PER", value: "적자 (-51.66)" },
        { label: "평균 목표주가", value: "$187.80 (+22.6%)" },
        { label: "상장일", value: "2026-06-12 (공모가 $135)" },
      ],
      points: [
        "2026-06-12 나스닥 상장 — 약 $85.7B 조달(미 역사상 최대 IPO), 시초가 $150. 상장 직후 시가총액 약 $2조. (investing.com, Via Satellite)",
        "스타링크가 매출 엔진 — 2025년 $11.4B(+48%), 전체 매출의 60~70% 차지. 2026.2 가입자 1,000만+ 돌파(160개국), 2026.5 요금 인상(+$10/월)로 수익화 국면 전환. (Sacra, 글로벌이코노믹)",
        "스타십 V3 첫 비행 성공(2026-05-22) — LEO 150톤 탑재, NASA 아르테미스·화성 겨냥. 발사 단가의 구조적 하락 동력. (검색 종합)",
        "2025년 팰컨 165회·스타십 5회 발사 — 글로벌 발사 시장을 사실상 독점하는 발사 빈도. (검색 종합)",
        "아직 순손실(PER 음수) — 성장 재투자 단계. 밸류에이션은 스타링크 가입자·발사량 성장 기대를 선반영. (investing.com)",
      ],
      risks: [
        "상장 직후 변동성 큼(밴드 $135–$225). 적자 지속·대규모 캐펙스 부담.",
        "머스크 키맨 리스크 + 규제(주파수 배분·발사 인허가)·위성 과밀 경쟁.",
      ],
      sources: [
        { label: "investing.com — SPCX 종목 지표", url: "https://kr.investing.com/equities/spacex" },
        { label: "Via Satellite — SpaceX 재무·IPO 분석", url: "https://www.satellitetoday.com/finance/2026/06/03/assessing-spacex-finances-addressable-market-and-the-ai-pitch-ahead-of-ipo/" },
        { label: "Sacra — SpaceX revenue·valuation", url: "https://sacra.com/c/spacex/" },
        { label: "글로벌이코노믹 — 스타링크 매출 비중", url: "https://www.g-enews.com/article/Global-Biz/2026/05/2026052305105457612bd56fbc3c_1" },
      ],
    },
  ],
};

export const SECTORS: Sector[] = [
  { slug: "semiconductor", label: "반도체", emoji: "🔬", summary: "파운드리·메모리·소부장 밸류체인 동향", content: SEMICONDUCTOR },
  { slug: "battery", label: "이차전지", emoji: "🔋", summary: "셀·소재·전고체 차세대 배터리" },
  { slug: "bio", label: "바이오", emoji: "🧬", summary: "신약·CDMO·플랫폼 바이오" },
  { slug: "robotics", label: "로보틱스", emoji: "🦾", summary: "휴머노이드·협동로봇·자동화" },
  { slug: "aerospace", label: "우주·항공", emoji: "🚀", summary: "발사체·위성통신·우주 인프라", content: AEROSPACE },
  { slug: "copper", label: "구리", emoji: "⛏️", summary: "전기동 수급·FCX peer 6사 비교", href: "/fcx" },
];

export function sectorHref(s: Sector): string {
  return s.href ?? `/sector/${s.slug}`;
}

export function getSector(slug: string): Sector | undefined {
  return SECTORS.find((s) => s.slug === slug);
}

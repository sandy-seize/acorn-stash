/**
 * Sector Research 대분류 — 중분류(섹터) 목록.
 * 홈(app/page.tsx)과 상세(app/sector/[slug]/page.tsx)가 공유.
 *
 * href 가 있으면 그 경로로 이동(기존 리포트 재사용), 없으면 /sector/[slug].
 */
export interface Sector {
  slug: string;
  label: string;
  emoji: string;
  summary: string;
  /** 외부/기존 경로 오버라이드. 없으면 /sector/[slug] 스캐폴드. */
  href?: string;
}

export const SECTORS: Sector[] = [
  { slug: "semiconductor", label: "반도체", emoji: "🔬", summary: "파운드리·메모리·소부장 밸류체인 동향" },
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

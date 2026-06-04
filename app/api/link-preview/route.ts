import { NextResponse } from "next/server";

// POST /api/link-preview  { urls: string[] } → { previews: {} }
// v1 stub: 미리보기 메타 수집 없이 빈 결과 반환(테이블은 raw URL 로 폴백).
// 추후 OG 태그 fetch + vr_link_previews 캐시로 확장 가능.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  return NextResponse.json({ previews: {} });
}

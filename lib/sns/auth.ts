/**
 * 외부 데이터 API → 서버 ingest 인증.
 * Bearer secret 단일 검증. env 미설정 시 로컬 개발 편의로 통과(프로덕션은 반드시 설정).
 */
export function verifyIngestAuth(request: Request): { ok: boolean; error?: string } {
  const expected = process.env.VR_INGEST_SECRET;
  if (!expected) return { ok: true };
  const authz = request.headers.get("authorization") ?? "";
  if (authz !== `Bearer ${expected}`) {
    return { ok: false, error: "unauthorized" };
  }
  return { ok: true };
}

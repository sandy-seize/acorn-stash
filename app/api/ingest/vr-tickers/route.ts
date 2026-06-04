import { NextResponse } from "next/server";
import { verifyIngestAuth } from "@/lib/sns/auth";
import { ingestVrTickers } from "@/lib/sns/ingest";
import type { VrTickerIngest } from "@/lib/sns/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: Request) {
  const auth = verifyIngestAuth(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 });

  let body: { items?: VrTickerIngest[] };
  try {
    body = (await request.json()) as { items?: VrTickerIngest[] };
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (!Array.isArray(body.items)) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const result = await ingestVrTickers(body.items);
  return NextResponse.json({ ok: true, ...result });
}

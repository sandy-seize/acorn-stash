import { NextResponse } from "next/server";
import { verifyIngestAuth } from "@/lib/sns/auth";
import { ingestVrPrices } from "@/lib/sns/ingest";
import type { VrPriceIngest } from "@/lib/sns/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: Request) {
  const auth = verifyIngestAuth(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 });

  let body: { items?: VrPriceIngest[] };
  try {
    body = (await request.json()) as { items?: VrPriceIngest[] };
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (!Array.isArray(body.items)) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const result = await ingestVrPrices(body.items);
  return NextResponse.json({ ok: true, ...result });
}

// `POST /ask` — the server route that runs the child-safe concierge pipeline.
//
// Default deps are the deterministic STUBS (offline, hermetic → `next build` + LOOP_QA stay
// network-free). Only when `CONCIERGE_LIVE === "1"` does it dynamically import the opt-in real
// adapters (`app/live-deps.ts` → `@gt100k/concierge-live`, TFY + web); the import is behind the flag
// so the default bundle never evaluates it and no test ever touches it. Any failure fails SAFE
// (a `refused` response), never a leak — mirroring the pipeline's own fail-safe contract.
import { NextResponse } from "next/server";
import type { AgeTier, ConciergeDeps, ConciergeResponse } from "@gt100k/concierge";
import { buildStubDeps } from "../deps.js";
import { handleAsk } from "../ask-handler.js";

// Never statically prerender — this route runs the pipeline per request.
export const dynamic = "force-dynamic";

const LIVE = process.env.CONCIERGE_LIVE === "1";

async function resolveDeps(): Promise<ConciergeDeps> {
  if (!LIVE) return buildStubDeps();
  // Dynamic + flag-guarded: the live adapter is loaded only when explicitly opted in.
  const { buildLiveDeps } = await import("../live-deps.js");
  return buildLiveDeps();
}

export async function POST(request: Request): Promise<NextResponse> {
  let response: ConciergeResponse;
  try {
    const body = (await request.json()) as { message?: unknown; ageTier?: unknown };
    const message = typeof body.message === "string" ? body.message : "";
    const ageTier =
      body.ageTier === "6-8" || body.ageTier === "9-11" || body.ageTier === "12-14"
        ? (body.ageTier as AgeTier)
        : undefined;
    response = await handleAsk({ message, ageTier }, await resolveDeps());
  } catch {
    // Fail safe — never leak an internal error to the child-facing surface.
    response = { kind: "refused", reason: "internal" };
  }
  return NextResponse.json(response);
}

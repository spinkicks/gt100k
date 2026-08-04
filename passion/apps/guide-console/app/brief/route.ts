/**
 * `POST /brief` — write a real project brief for one specialization.
 *
 * WHY ON DEMAND AND NOT AT RENDER. Deriving the plan is pure and synchronous, and every panel in
 * the console depends on that. Making it async to fit a model call would push a network round trip
 * into a screen a guide opens constantly, for a brief that is collapsed by default whenever a
 * mastery map already supplies the rung.
 *
 * WHICH DOMAINS THIS IS FOR. Not chess. A hand-authored map beats a generated brief wherever the
 * ladder to the top is already well established, and the console prefers the map rung when one
 * exists. This serves the long tail: the domains with no map, where a stub template is the only
 * other option.
 *
 * The generated brief carries `source: "llm"`, which the panel shows. A guide should always be able
 * to see which of these a machine wrote.
 */
import { NextResponse } from "next/server";

import type { BriefContext } from "@gt100k/specialization-planner";

export const dynamic = "force-dynamic";

const LIVE = process.env.PLANNER_LIVE === "1";

export async function POST(request: Request): Promise<NextResponse> {
  if (!LIVE) {
    return NextResponse.json(
      { refused: "Live briefs are off. Set PLANNER_LIVE=1." },
      { status: 503 },
    );
  }
  try {
    const ctx = (await request.json()) as BriefContext;
    const { TfyBriefGenerator, tfyConfigFromEnv } = await import("@gt100k/planner-live");
    const brief = await new TfyBriefGenerator(tfyConfigFromEnv()).generate(ctx);
    return NextResponse.json({ brief });
  } catch {
    // Named rather than swallowed. A guide who pressed a button deserves to know it did not work,
    // and the templated brief is still on screen underneath.
    return NextResponse.json({ refused: "Could not write a brief just now." }, { status: 502 });
  }
}

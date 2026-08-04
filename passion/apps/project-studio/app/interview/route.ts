/**
 * `POST /interview` — one question about an artefact that arrived with little behind it.
 *
 * WHY A ROUTE AND NOT A CLIENT CALL. The key. `TFY_API_KEY` cannot reach a browser, so the model
 * call has to happen server-side, and this is the same flag-guarded dynamic-import shape
 * `POST /ask` already uses: the live adapter is never even evaluated unless someone opts in.
 *
 * FAILING SAFE HERE MEANS ASKING ANYWAY. The concierge fails safe by refusing, because a wrong
 * answer to a child is worse than no answer. This route inverts that: the offline question is a
 * real question, and the child is mid-build with something to say, so a model outage should cost
 * them specificity rather than the whole exchange. Every error path returns a usable question.
 */
import { NextResponse } from "next/server";

import type { Facet } from "@gt100k/socratic-defense";
import { FALLBACK, type InterviewAsk } from "../interview.js";

export const dynamic = "force-dynamic";

const LIVE = process.env.INTERVIEW_LIVE === "1";

export async function POST(request: Request): Promise<NextResponse> {
  let facet: Facet = "challenge";
  try {
    const body = (await request.json()) as Partial<InterviewAsk>;
    if (typeof body.facet === "string") facet = body.facet as Facet;

    if (LIVE && body.title !== undefined) {
      const live = await askLive(body as InterviewAsk);
      if (live !== null) return NextResponse.json({ question: live, live: true });
    }
  } catch {
    /* fall through to the offline question: the child still gets asked */
  }
  return NextResponse.json({ question: FALLBACK[facet], live: false });
}

/** Returns null on any failure, so the caller falls back rather than surfacing an error. */
async function askLive(ask: InterviewAsk): Promise<string | null> {
  try {
    const { TfyTutor, tfyConfigFromEnv } = await import("@gt100k/tutor-tfy");
    const q = await new TfyTutor(tfyConfigFromEnv()).nextQuestion({
      profile: {
        id: ask.projectId,
        studentId: ask.kidId,
        title: ask.title,
        domain: ask.drivingQuestion,
        // The adapter's prompt sends title and summary only, so the recent journey rides in the
        // summary. Without it the model asks a generic question about the project; with it, it can
        // ask about the thing the child was actually doing an hour ago, which is the whole point of
        // asking mid-build rather than at the end.
        summary: [ask.method, ...ask.recent].join(" "),
        artifactRefs: ask.artifacts,
      },
      transcript: [],
      targetFacet: ask.facet,
      isFollowUp: false,
      readinessLevel: "emerging",
    });
    const trimmed = q.trim();
    // The adapter has its own fallback ("Tell me more about the ... of your project"), which is
    // vaguer than ours. Reject anything that shape so a parse failure upstream does not quietly
    // downgrade the question we would otherwise have asked.
    if (trimmed.length < 12 || /^tell me more about the \w+ of your project/i.test(trimmed)) {
      return null;
    }
    return trimmed;
  } catch {
    return null;
  }
}

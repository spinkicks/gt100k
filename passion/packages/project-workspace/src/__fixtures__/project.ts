// A deterministic synthetic fixture project exercising ALL 10 WorkEvent kinds and the §4.2
// perseverance chain (attempt → outcome{stuck} → revision → artifact). Built through the real
// `startProject`/`logEvent` so every event carries a genuine derived id — the golden `toEvidence`
// test folds THIS project onto the closed EvidenceGraph taxonomy. SYNTHETIC data only; no network.
import type { Project, ProjectBrief } from "../model.js";
import { logEvent, startProject } from "../project.js";

/** A D1-brief-shaped seed (reusing the planner's `ProjectBrief` type) for the fixture child. */
export const FIXTURE_BRIEF: ProjectBrief = {
  title: "The strongest paper bridge",
  drivingQuestion: "How can I build a paper bridge that holds the most books?",
  authenticMethod: "Structural engineering — build, load-test, and iterate on truss designs.",
  audience: "MENTOR_PEERS",
  childOwnsChoice: true,
  craftScaffold: "Try triangles; test to failure; measure how much weight each version holds.",
  successLooksLike: "A bridge that holds ten books without collapsing, and notes on why it works.",
  source: "stub",
};

/** Returns the id of the most recently logged event (throws if the journey is empty). */
function lastEventId(project: Project): string {
  const event = project.events[project.events.length - 1];
  if (event === undefined) {
    throw new Error("FIXTURE: no events logged yet");
  }
  return event.id;
}

/**
 * Build the fixture fresh each call (so determinism can be asserted across two independent builds).
 * The `now` seeds and per-event `at` timestamps are fixed literals — no clock, no randomness.
 */
export function makeFixtureProject(): Project {
  let project = startProject(
    { brief: FIXTURE_BRIEF, kidId: "kid-ada", ageBand: "9-11" },
    "2026-01-01T08:00:00.000Z",
  );

  project = logEvent(
    project,
    { kind: "session", at: "2026-01-01T09:00:00.000Z", text: "Opened my bridge project and got out the paper." },
    "",
  );

  project = logEvent(
    project,
    { kind: "decision", at: "2026-01-01T09:10:00.000Z", text: "I decided to use a triangle truss shape." },
    "",
  );

  project = logEvent(
    project,
    { kind: "attempt", at: "2026-01-01T09:30:00.000Z", text: "I folded paper into 20 little beams and taped a flat deck." },
    "",
  );
  const attemptId = lastEventId(project);

  project = logEvent(
    project,
    {
      kind: "outcome",
      at: "2026-01-01T09:45:00.000Z",
      text: "It sagged and collapsed under just one book. I got stuck.",
      stuck: true,
      refs: [attemptId],
    },
    "",
  );
  const stuckOutcomeId = lastEventId(project);

  project = logEvent(
    project,
    {
      kind: "ai_help",
      at: "2026-01-01T10:00:00.000Z",
      text: "A robot helped me learn that triangles are stronger than squares.",
      aiTool: { name: "studybot", version: "1.0.0" },
      refs: [stuckOutcomeId],
    },
    "",
  );

  project = logEvent(
    project,
    {
      kind: "revision",
      at: "2026-01-01T10:20:00.000Z",
      text: "I rebuilt the deck with triangle bracing under every beam.",
      refs: [stuckOutcomeId],
    },
    "",
  );
  const revisionId = lastEventId(project);

  project = logEvent(
    project,
    {
      kind: "artifact",
      at: "2026-01-01T10:50:00.000Z",
      text: "Here is my braced bridge, version 2.",
      refs: [revisionId],
      artifact: { title: "Braced paper bridge v2", kind: "photo", ref: "local://bridge-v2.jpg" },
    },
    "",
  );
  const artifactId = lastEventId(project);

  project = logEvent(
    project,
    { kind: "reflection", at: "2026-01-01T11:00:00.000Z", text: "Triangles spread the weight — that is why it holds now." },
    "",
  );

  project = logEvent(
    project,
    {
      kind: "milestone",
      at: "2026-01-01T11:15:00.000Z",
      text: "My bridge held ten books without collapsing!",
      refs: [artifactId],
    },
    "",
  );

  project = logEvent(
    project,
    {
      kind: "showcase",
      at: "2026-01-01T11:30:00.000Z",
      text: "I showed my bridge to the whole class.",
      refs: [artifactId],
    },
    "",
  );

  return project;
}

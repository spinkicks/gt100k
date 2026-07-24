// Deterministic seed for the Project Studio (SYNTHETIC / local only). One demo child; a few projects
// started from D1-brief-shaped `ProjectBrief` fixtures (reusing the planner type, so a real planner
// brief drops in unchanged later) + a self-authored one. The first project carries a pre-logged
// journey that includes the perseverance chain (stuck, revision, artifact). No clock/random here;
// refs are captured from the real derived event ids as the journey is built.
import {
  logEvent,
  startProject,
  type ProjectBrief,
  type Project,
  type WorkEvent,
} from "@gt100k/project-workspace";

export const STUDIO_NOW = "2026-04-01T00:00:00.000Z";
export const DEMO_KID = "kid-demo";
export const DEMO_AGE_BAND = "9-11" as const;

const BRIEFS: readonly ProjectBrief[] = [
  {
    title: "Build a Mini Arcade Game",
    drivingQuestion: "What tiny game would make a friend say 'one more try!'?",
    authenticMethod:
      "Design a loop, build it, and watch a real player try it, then fix what trips them up.",
    audience: "MENTOR_PEERS",
    childOwnsChoice: true,
    craftScaffold: "Start with one screen and one rule. Get it playable before it's pretty.",
    successLooksLike: "A friend plays it twice without you explaining it.",
    source: "stub",
  },
  {
    title: "Make a Beat",
    drivingQuestion: "Can I make a 20-second loop that makes someone nod their head?",
    authenticMethod: "Layer a drum, a bass, and a melody; test it on someone; tweak the timing.",
    audience: "SELF",
    childOwnsChoice: true,
    craftScaffold: "Four beats, then build up. Keep the part you like; cut the rest.",
    successLooksLike: "You catch yourself humming your own loop.",
    source: "stub",
  },
];

/** Log an entry and return [nextProject, newEventId] so later entries can `refs` real ids. */
function log(project: Project, event: Omit<WorkEvent, "id">): [Project, string] {
  const next = logEvent(project, event, event.at);
  const last = next.events[next.events.length - 1]!;
  return [next, last.id];
}

/** Build the demo child's projects fresh (deterministic). Two planner briefs + one self-authored. */
export function seedProjects(): readonly Project[] {
  // Arcade: a full honest journey: work, try, STUCK, robot help, fix, made it, reflect.
  let arcade = startProject({ brief: BRIEFS[0]!, kidId: DEMO_KID, ageBand: DEMO_AGE_BAND }, STUDIO_NOW);
  [arcade] = log(arcade, {
    kind: "session",
    at: "2026-04-02T15:00:00.000Z",
    text: "Sketched the game on paper for 20 minutes.",
  });
  let attemptId: string;
  [arcade, attemptId] = log(arcade, {
    kind: "attempt",
    at: "2026-04-03T15:00:00.000Z",
    text: "Made the player jump when I press space.",
  });
  let stuckId: string;
  [arcade, stuckId] = log(arcade, {
    kind: "outcome",
    at: "2026-04-03T15:20:00.000Z",
    text: "The player jumped forever and floated off the screen. Broken!",
    stuck: true,
    refs: [attemptId],
  });
  [arcade] = log(arcade, {
    kind: "ai_help",
    at: "2026-04-04T15:00:00.000Z",
    text: "Asked how to make jumping stop at the ground.",
    aiTool: { name: "studybot", version: "1" },
  });
  // Iteration PAST the failure: the revision refs the stuck outcome → hasPerseverance === true.
  [arcade] = log(arcade, {
    kind: "revision",
    at: "2026-04-05T15:00:00.000Z",
    text: "Added gravity so the player falls back down. Way better.",
    refs: [stuckId],
  });
  [arcade] = log(arcade, {
    kind: "artifact",
    at: "2026-04-06T15:00:00.000Z",
    text: "First playable version! You can jump over one block.",
    refs: [stuckId],
    artifact: { title: "arcade-v1", kind: "game build" },
  });
  [arcade] = log(arcade, {
    kind: "reflection",
    at: "2026-04-06T15:30:00.000Z",
    text: "Getting stuck taught me what gravity is for.",
  });

  let beat = startProject({ brief: BRIEFS[1]!, kidId: DEMO_KID, ageBand: DEMO_AGE_BAND }, STUDIO_NOW);
  [beat] = log(beat, {
    kind: "session",
    at: "2026-04-02T16:00:00.000Z",
    text: "Found a drum sound I like.",
  });

  const own = startProject(
    {
      selfAuthored: {
        kidId: DEMO_KID,
        ageBand: DEMO_AGE_BAND,
        title: "My Robot Buddy",
        drivingQuestion: "Can I draw a robot that looks friendly, not scary?",
        authenticMethod: "Draw a few, ask people which feels friendliest, keep going.",
        audience: "SELF",
      },
    },
    STUDIO_NOW,
  );

  return [arcade, beat, own];
}

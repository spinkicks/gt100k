// Pure helpers shared by the studio UI + the headless CI test. The kid-facing vocabulary sits on top
// of the engine's 10 `WorkEventKind`s; `buildQaState` is the small `window.__qa.state()` payload the
// LOOP_QA gate reads. No score/grade anywhere.
import { hasPerseverance, type Project, type WorkEventKind } from "@gt100k/project-workspace";

/** Kid-facing quest entry: friendly label + composer prompt for each of the 10 engine kinds. */
export interface EntryKind {
  readonly kind: WorkEventKind;
  readonly label: string;
  readonly prompt: string;
}

export const ENTRY_KINDS: readonly EntryKind[] = [
  { kind: "attempt", label: "I tried something", prompt: "What did you try?" },
  { kind: "outcome", label: "Here's what happened", prompt: "What happened when you tried it?" },
  { kind: "revision", label: "I fixed or changed it", prompt: "What did you change?" },
  { kind: "artifact", label: "I made this", prompt: "What did you make?" },
  { kind: "ai_help", label: "A robot helped me", prompt: "What did the robot help with?" },
  { kind: "decision", label: "I decided", prompt: "What did you decide?" },
  { kind: "reflection", label: "I learned", prompt: "What did you figure out?" },
  { kind: "session", label: "I worked on it", prompt: "What did you work on?" },
  { kind: "milestone", label: "Checkpoint", prompt: "What did you reach?" },
  { kind: "showcase", label: "Showtime", prompt: "Who did you share it with?" },
];

const ENTRY_BY_KIND: Readonly<Record<WorkEventKind, EntryKind>> = Object.fromEntries(
  ENTRY_KINDS.map((e) => [e.kind, e]),
) as Record<WorkEventKind, EntryKind>;

export function entryFor(kind: WorkEventKind): EntryKind {
  return ENTRY_BY_KIND[kind];
}

const AUDIENCE_LABEL: Record<string, string> = {
  SELF: "Just for me",
  MENTOR_PEERS: "My mentor & friends",
  REAL_COMMUNITY: "A real community",
  FIELD: "The whole field",
};
export function audienceLabel(audience: string): string {
  return AUDIENCE_LABEL[audience] ?? audience;
}

/** The `window.__qa.state()` payload (spec §6). No score/grade. */
export interface QaState {
  readonly projectId: string | null;
  readonly eventCount: number;
  readonly kinds: readonly string[];
  readonly hasPerseverance: boolean;
}

export function buildQaState(project: Project | undefined): QaState {
  if (!project) {
    return { projectId: null, eventCount: 0, kinds: [], hasPerseverance: false };
  }
  return {
    projectId: project.id,
    eventCount: project.events.length,
    kinds: project.events.map((e) => e.kind),
    hasPerseverance: hasPerseverance(project),
  };
}

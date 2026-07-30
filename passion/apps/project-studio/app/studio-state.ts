// Pure helpers shared by the studio UI + the headless CI test. The kid-facing vocabulary sits on top
// of the engine's 10 `WorkEventKind`s; `buildQaState` is the small `window.__qa.state()` payload the
// LOOP_QA gate reads. No score/grade anywhere.
import { hasPerseverance, type Project, type WorkEventKind } from "@gt100k/project-workspace";

/**
 * Which of the three clusters a kind belongs to in the composer.
 *
 * The ten engine kinds cannot be reduced — each one is a `WorkEventKind` the EvidenceGraph
 * records — but ten identical pills in a row is a ten-way choice, and Patall's useful range for a
 * choice moment is three to five. Grouping does not remove anything; it turns one ten-way decision
 * into a glance at three labelled clusters, which is the same information at a third of the load.
 *
 * The clusters are the child's own sequence, not the engine's taxonomy: you do a thing, you make a
 * thing, you think about the thing.
 */
export type EntryGroup = "doing" | "making" | "thinking";

/** Kid-facing quest entry: friendly label + composer prompt for each of the 10 engine kinds. */
export interface EntryKind {
  readonly kind: WorkEventKind;
  readonly label: string;
  readonly prompt: string;
  readonly group: EntryGroup;
}

export const ENTRY_GROUPS: readonly { readonly id: EntryGroup; readonly label: string }[] = [
  { id: "doing", label: "While you work" },
  { id: "making", label: "When something exists" },
  { id: "thinking", label: "What you noticed" },
];

export const ENTRY_KINDS: readonly EntryKind[] = [
  { kind: "attempt", label: "I tried something", prompt: "What did you try?", group: "doing" },
  {
    kind: "outcome",
    label: "Here's what happened",
    prompt: "What happened when you tried it?",
    group: "doing",
  },
  {
    kind: "revision",
    label: "I fixed or changed it",
    prompt: "What did you change?",
    group: "doing",
  },
  { kind: "session", label: "I worked on it", prompt: "What did you work on?", group: "doing" },
  { kind: "artifact", label: "I made this", prompt: "What did you make?", group: "making" },
  { kind: "milestone", label: "Checkpoint", prompt: "What did you reach?", group: "making" },
  { kind: "showcase", label: "Showtime", prompt: "Who did you share it with?", group: "making" },
  { kind: "decision", label: "I decided", prompt: "What did you decide?", group: "thinking" },
  { kind: "reflection", label: "I learned", prompt: "What did you figure out?", group: "thinking" },
  {
    kind: "ai_help",
    label: "A robot helped me",
    prompt: "What did the robot help with?",
    group: "thinking",
  },
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

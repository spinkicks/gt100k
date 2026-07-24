// startProject + logEvent + hasPerseverance (spec §4.1–4.2). PURE + DETERMINISTIC + append-only.
//
// A `Project` is seeded from a D1 `ProjectBrief` (an offer, `source:"planner"`) OR self-authored
// (`source:"self"`); its `events` are an immutable journey grown one `logEvent` at a time. Ids are
// derived from content (+ a per-append sequence for uniqueness) with NO clock/random, so identical
// inputs yield identical ids — the determinism SC-4/LOOP_QA relies on. GRADE THE PROCESS: nothing
// here scores, and `hasPerseverance` only SURFACES the "iterated past a failure" chain (§4.2).
import type { AgeBand, Project, ProjectBrief, WorkEvent, WorkEventKind } from "./model.js";
import { WORK_EVENT_KINDS } from "./model.js";

import type { AudienceLevel } from "@gt100k/specialization-planner";

const WORK_EVENT_KIND_SET: ReadonlySet<string> = new Set(WORK_EVENT_KINDS);

/** Deterministic 32-bit FNV-1a over a string → 8-hex-char digest. No clock, no randomness. */
function fnv1aHex(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    // FNV prime 16777619, kept in 32-bit unsigned space via Math.imul + >>> 0.
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

/** Seed a self-authored project (the child owns problem/method/pace — no craftScaffold). */
export interface SelfAuthoredInput {
  readonly kidId: string;
  readonly ageBand: AgeBand;
  readonly title: string;
  readonly drivingQuestion: string;
  readonly authenticMethod: string;
  readonly audience: AudienceLevel;
}

/** Seed from a D1 planner brief (an OFFER) or from the child's own idea ([D5]). */
export type StartProjectInput =
  | { readonly brief: ProjectBrief; readonly kidId: string; readonly ageBand: AgeBand }
  | { readonly selfAuthored: SelfAuthoredInput };

/** Start a Project from a brief (source:"planner") or self-authored (source:"self"). Blank journey. */
export function startProject(input: StartProjectInput, now: string): Project {
  if ("brief" in input) {
    const { brief, kidId, ageBand } = input;
    const id = `proj_${fnv1aHex([kidId, "planner", brief.title, now].join("|"))}`;
    return {
      id,
      kidId,
      title: brief.title,
      drivingQuestion: brief.drivingQuestion,
      authenticMethod: brief.authenticMethod,
      audience: brief.audience,
      craftScaffold: brief.craftScaffold,
      source: "planner",
      ageBand,
      createdAt: now,
      events: [],
    };
  }

  const { selfAuthored } = input;
  const id = `proj_${fnv1aHex([selfAuthored.kidId, "self", selfAuthored.title, now].join("|"))}`;
  return {
    id,
    kidId: selfAuthored.kidId,
    title: selfAuthored.title,
    drivingQuestion: selfAuthored.drivingQuestion,
    authenticMethod: selfAuthored.authenticMethod,
    audience: selfAuthored.audience,
    // no craftScaffold: it comes from a D1 brief, and this project has none.
    source: "self",
    ageBand: selfAuthored.ageBand,
    createdAt: now,
    events: [],
  };
}

function isWorkEventKind(kind: string): kind is WorkEventKind {
  return WORK_EVENT_KIND_SET.has(kind);
}

/**
 * Append an immutable `WorkEvent` and return a NEW Project snapshot (the input is never mutated).
 * The id is derived from the event content plus the append sequence, so two identical entries still
 * get distinct, stable ids. Throws if `kind` is not one of the ten `WORK_EVENT_KINDS`.
 */
export function logEvent(project: Project, event: Omit<WorkEvent, "id">, now: string): Project {
  if (!isWorkEventKind(event.kind)) {
    throw new Error(`INVALID_WORK_EVENT_KIND: ${String(event.kind)}`);
  }

  const seq = project.events.length;
  const id = `evt_${seq}_${fnv1aHex([project.id, seq, event.kind, event.at, event.text].join("|"))}`;
  const appended: WorkEvent = { ...event, at: event.at || now, id };

  return {
    ...project,
    events: [...project.events, appended],
  };
}

const ITERATION_KINDS: ReadonlySet<WorkEventKind> = new Set<WorkEventKind>([
  "revision",
  "attempt",
  "artifact",
]);

/**
 * The graduation-gate perseverance signal (§4.2): a stuck outcome (`outcome{stuck:true}`) FOLLOWED
 * BY a later `revision`/`attempt`/`artifact` that `refs` it = "iteration past a failure." Ordering
 * matters — only iteration recorded after the stuck outcome counts.
 */
export function hasPerseverance(project: Project): boolean {
  const { events } = project;
  return events.some((event, index) => {
    if (event.kind !== "outcome" || event.stuck !== true) {
      return false;
    }
    return events
      .slice(index + 1)
      .some(
        (later) => ITERATION_KINDS.has(later.kind) && (later.refs ?? []).includes(event.id),
      );
  });
}

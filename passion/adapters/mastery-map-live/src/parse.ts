// src/parse.ts: coerce a raw TFY (OpenAI-compatible) JSON response string into a valid
// `MasteryMap`, falling back to the deterministic in-package stub on anything malformed and on
// anything the validator rejects. Pure + hermetic: NO network, no clock, no env, no side effects,
// and it never throws. (This is the only module the parse test imports, never `./index.js`.)
//
// WHY THE VERIFIED SET IS AN ARGUMENT. The whole design of this adapter rests on citations being
// real: a `syllabus` basis is the strongest support a map can offer, and a model that invents a
// plausible DOI is worse than one that cites nothing, because a fabrication looks checkable. So the
// citations are checked, not trusted. The checking is a network job and lives in `index.ts`; the
// DECISION about a map whose citation did not resolve is pure, lives here, and is therefore
// testable with no sockets at all.
//
// The honest outcome of a failed check is a DOWNGRADE, not a rejection: the milestone keeps its
// reason and says `basis: "model"`, which is "the model's own reasoning", which is exactly what it
// then is. Rule E4 (a model basis must carry no sources) is why dropping the sources at the same
// time keeps the map valid.
import {
  attachable,
  buildStubMap,
  validateMap,
  type Justification,
  type MapContext,
  type MasteryMap,
  type Milestone,
  type OpportunityHint,
  type OrderingBasis,
  type PracticeForm,
  type ValidationRecord,
} from "@gt100k/mastery-map";
import type { Source } from "@gt100k/research";
import { STAGES, type Stage } from "@gt100k/specialization-planner";
import { WORK_MODES, serializePath, type WorkMode } from "@gt100k/two-axis-tagging";

/**
 * Everything the pure coercion cannot find out for itself: the clock, the adapter's own config, and
 * the result of the network check. Passing them in is what keeps this module hermetic.
 */
export interface LiveInputs {
  readonly model: string;
  readonly promptVersion: string;
  readonly generatedAt: string;
  /** The cited urls that actually resolved. Everything else is downgraded; see the header. */
  readonly verifiedUrls: ReadonlySet<string>;
}

// ── Small total readers ──────────────────────────────────────────────────────────────────────────
// Each returns `null` for "not that", never a default and never a throw. A default here would be
// the adapter quietly authoring a piece of the map, which is the one thing it must not do.

function asObject(v: unknown): Record<string, unknown> | null {
  if (typeof v !== "object" || v === null || Array.isArray(v)) return null;
  return v as Record<string, unknown>;
}

function asText(v: unknown): string | null {
  return typeof v === "string" && v.trim().length > 0 ? v : null;
}

function asArray(v: unknown): readonly unknown[] | null {
  return Array.isArray(v) ? v : null;
}

/** Map over an array, failing the whole array if any element fails. */
function mapAll<T>(v: unknown, read: (item: unknown) => T | null): readonly T[] | null {
  const items = asArray(v);
  if (!items) return null;
  const out: T[] = [];
  for (const item of items) {
    const parsed = read(item);
    if (parsed === null) return null;
    out.push(parsed);
  }
  return out;
}

/** Exhaustive by construction: adding a member to either union stops this file compiling. */
const ORDERING_BASES: Readonly<Record<OrderingBasis, true>> = {
  syllabus: true,
  research: true,
  community: true,
  model: true,
};

const OPPORTUNITY_KINDS: Readonly<Record<OpportunityHint["kind"], true>> = {
  competition: true,
  showcase: true,
  community: true,
  mentorship: true,
};

const oneOf =
  <T extends string>(table: Readonly<Record<T, true>>) =>
  (v: unknown): T | null =>
    typeof v === "string" && Object.hasOwn(table, v) ? (v as T) : null;

const asBasis = oneOf(ORDERING_BASES);
const asOpportunityKind = oneOf(OPPORTUNITY_KINDS);

const asStage = (v: unknown): Stage | null =>
  typeof v === "string" && (STAGES as readonly string[]).includes(v) ? (v as Stage) : null;

const asMode = (v: unknown): WorkMode | null =>
  typeof v === "string" && (WORK_MODES as readonly string[]).includes(v) ? (v as WorkMode) : null;

// ── The citation check that needs no network ─────────────────────────────────────────────────────

/**
 * Whether a source is worth spending a request on. A citation with no authors, no plausible year or
 * a url nothing can fetch is unverifiable BY DEFINITION, so it never reaches the network and never
 * survives the downgrade.
 *
 * Deliberately structural and nothing more. "Is 2019 plausible?" is as far as a module with no
 * clock can go: a future year is a good fabrication tell and this cannot see one, because it does
 * not know what year it is. Substance is settled by fetching, which is `index.ts`'s job.
 */
export function isCheckableSource(source: Source): boolean {
  if (source.authors.trim().length === 0) return false;
  if (!Number.isInteger(source.year) || source.year < 1000 || source.year > 9999) return false;
  const url = source.url.trim().toLowerCase();
  return url.startsWith("https://") || url.startsWith("doi:");
}

/**
 * A source's SHAPE, not its worth: blank authors and a two-digit year parse fine here and are
 * rejected by {@link isCheckableSource} instead. Keeping the two apart is what lets one bad citation
 * cost its own milestone its basis rather than costing the map its whole existence.
 */
function asSource(v: unknown): Source | null {
  const o = asObject(v);
  if (!o) return null;
  if (typeof o.authors !== "string") return null;
  if (typeof o.year !== "number") return null;
  if (typeof o.url !== "string") return null;
  return { authors: o.authors, year: o.year, url: o.url };
}

/**
 * The urls the impure half should HEAD, in the order they appear and each one once. Total: an
 * unreadable response yields no work rather than an error, because the coercion is about to fall
 * back to the stub anyway.
 */
export function checkableUrls(raw: string): readonly string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const milestone of readMilestoneObjects(raw)) {
    const sources = mapAll(asObject(milestone.ordering)?.sources, asSource) ?? [];
    for (const source of sources) {
      if (isCheckableSource(source) && !seen.has(source.url)) {
        seen.add(source.url);
        out.push(source.url);
      }
    }
  }
  return out;
}

/** The `milestones` field of a response body, or `undefined` when the body is not readable JSON. */
function readMilestonesField(raw: string): unknown {
  try {
    return asObject(JSON.parse(raw))?.milestones;
  } catch {
    return undefined;
  }
}

/** The same field as loose objects, for the work list, which reads a response it has not vetted. */
function readMilestoneObjects(raw: string): readonly Record<string, unknown>[] {
  const items = asArray(readMilestonesField(raw)) ?? [];
  return items.map(asObject).filter((o): o is Record<string, unknown> => o !== null);
}

// ── The milestone parser ─────────────────────────────────────────────────────────────────────────

function parseJustification(v: unknown): Justification | null {
  const o = asObject(v);
  if (!o) return null;
  const reason = asText(o.reason);
  const basis = asBasis(o.basis);
  const sources = mapAll(o.sources, asSource);
  if (reason === null || basis === null || sources === null) return null;
  if (o.limit === undefined) return { reason, basis, sources };
  const limit = asText(o.limit);
  return limit === null ? null : { reason, basis, sources, limit };
}

function parsePractice(v: unknown): PracticeForm | null {
  const o = asObject(v);
  if (!o) return null;
  const title = asText(o.title);
  const description = asText(o.description);
  if (title === null || description === null || typeof o.solitary !== "boolean") return null;
  return { title, description, solitary: o.solitary };
}

function parseOpportunity(v: unknown): OpportunityHint | null {
  const o = asObject(v);
  if (!o) return null;
  const kind = asOpportunityKind(o.kind);
  const description = asText(o.description);
  const readinessNote = asText(o.readinessNote);
  const stageFloor = asStage(o.stageFloor);
  if (kind === null || description === null || readinessNote === null || stageFloor === null) {
    return null;
  }
  return { kind, description, readinessNote, stageFloor };
}

/**
 * One milestone, minus the two fields the model never gets to write. `resources` come from the
 * concierge's human-vetted library and are attached below; `authorship` is `"model"` because that
 * is what it is, and a model that could set it could claim a person wrote its map.
 *
 * EVERY KEY IS REQUIRED, including the empty arrays. Defaulting an absent `requires` to `[]` would
 * quietly promote a milestone to a root of the DAG, and the DAG is the one thing this adapter is
 * for; the same argument is weaker for `practice` and `opportunities`, and they are strict anyway
 * so there is one rule here rather than a list of exceptions.
 */
function parseAuthoredMilestone(v: unknown): Omit<Milestone, "resources" | "authorship"> | null {
  const o = asObject(v);
  if (!o) return null;
  const id = asText(o.id);
  const title = asText(o.title);
  const capability = asText(o.capability);
  const requires = mapAll(o.requires, asText);
  const modes = mapAll(o.modes, asMode);
  const stageFloor = asStage(o.stageFloor);
  const ordering = parseJustification(o.ordering);
  const practice = mapAll(o.practice, parsePractice);
  const demonstration = asText(o.demonstration);
  const opportunities = mapAll(o.opportunities, parseOpportunity);
  if (
    id === null ||
    title === null ||
    capability === null ||
    requires === null ||
    modes === null ||
    stageFloor === null ||
    ordering === null ||
    practice === null ||
    demonstration === null ||
    opportunities === null
  ) {
    return null;
  }
  return {
    id,
    title,
    capability,
    requires,
    modes,
    stageFloor,
    ordering,
    demonstration,
    practice,
    opportunities,
  };
}

/**
 * The model-authored milestones of a response, with the adapter-owned fields filled in, or `null`
 * if ANY of it is malformed, missing or wrong-typed. One bad milestone fails the whole response, as
 * `coerceBriefOrStub` fails a whole brief: dropping the bad one instead would hand back a DAG the
 * model did not author and nobody reviewed, with every edge that pointed at the dropped milestone
 * now dangling. A map missing a milestone is a different map, not a repaired one.
 */
export function parseMilestones(raw: string, ctx: MapContext): readonly Milestone[] | null {
  const authored = mapAll(readMilestonesField(raw), parseAuthoredMilestone);
  if (authored === null || authored.length === 0) return null;

  // Everything attachable lands on the entry milestone, exactly as the stub does it and for the
  // same reason: nothing here knows which resource belongs at which step, and spreading them by
  // some invented rule would dress a guess up as a judgement nobody made. A response with no entry
  // point at all attaches nothing and is about to lose the whole map to E1_CYCLE regardless.
  const resources = attachable(ctx.resources, ctx.ageBands);
  const entry = authored.findIndex((m) => m.requires.length === 0);
  return authored.map((m, i) => ({
    ...m,
    resources: i === entry ? resources : [],
    authorship: "model" as const,
  }));
}

// ── Verification, and the downgrade that follows from it ─────────────────────────────────────────

/**
 * Strip every ordering claim the verified set does not back, and re-validate.
 *
 * A milestone keeps a non-`model` basis only when it names at least one source AND every source it
 * names is structurally checkable AND every one of those urls resolved. Anything else becomes
 * `basis: "model"` with no sources: the reason survives untouched, so the map still says WHY the
 * milestone sits where it does, and it stops saying that something published agrees.
 *
 * Two cases are worth naming. A citation-shaped url that is not there is the fabrication this whole
 * mechanism exists for, and it is indistinguishable from a real one until something fetches it. A
 * `syllabus` basis carrying no source at all is the same claim with the pretence dropped, and it is
 * downgraded rather than left to fail rule E4, because a valid map that says "the model's own
 * reasoning" is worth more to a guide than no map.
 *
 * Re-validating is part of the job: `validation` describes the map it sits on, and a downgrade
 * moves the warnings a guide reads (`W1_MODEL_HEAVY`, `W2_NO_SYLLABUS`). It cannot introduce an
 * ERROR, since the only shape it produces is the one rule E4 asks of a `model` basis.
 *
 * No clock reaches `validateMap`, so warning W5 never fires here. That is the right answer and not
 * a gap: staleness is measured against `revalidatedAt`, and a map cannot be stale at the instant it
 * was generated.
 */
export function downgradeUnverifiedCitations(
  map: MasteryMap,
  verifiedUrls: ReadonlySet<string>,
): MasteryMap {
  const supported = (ordering: Justification): boolean =>
    ordering.sources.length > 0 &&
    ordering.sources.every((s) => isCheckableSource(s) && verifiedUrls.has(s.url));

  const milestones = map.milestones.map((m) =>
    m.ordering.basis === "model" || supported(m.ordering)
      ? m
      : { ...m, ordering: { ...m.ordering, basis: "model" as const, sources: [] } },
  );
  const candidate: MasteryMap = { ...map, milestones };
  return { ...candidate, validation: validateMap(candidate) };
}

/** A placeholder so the map is a complete `MasteryMap` before it is validated, as the stub does. */
const UNVALIDATED: ValidationRecord = {
  validatedAt: "",
  validatorVersion: "unvalidated",
  errors: [],
  warnings: [],
};

/**
 * Coerce a raw TFY response into a `MasteryMap` for `ctx`: parse, attach the curated resources,
 * downgrade every citation the verified set does not back, validate, and hand back the
 * deterministic in-package stub if ANY of that produced a validation error.
 *
 * So the return is always a map the validator accepts, and never a half-repaired one. A model that
 * inverted a stage floor, pointed an edge at a milestone it did not write or forecast when a child
 * would arrive loses its whole map to the stub, which is the [D11] fail-safe direction: the stub is
 * a poorer map than a good model would write and a better one than an invalid map, which is not a
 * map at all.
 */
export function coerceMapOrStub(raw: string, ctx: MapContext, inputs: LiveInputs): MasteryMap {
  const milestones = parseMilestones(raw, ctx);
  if (milestones === null) return buildStubMap(ctx);

  const candidate: MasteryMap = {
    // The same stable id the stub mints, because a re-generation of a domain replaces the map at
    // that id rather than standing up a rival to it (spec §10).
    id: `map:${serializePath(ctx.domainPath)}`,
    version: 1,
    domainPath: ctx.domainPath,
    modes: ctx.modes,
    ageBands: ctx.ageBands,
    milestones,
    provenance: {
      model: inputs.model,
      promptVersion: inputs.promptVersion,
      generatedAt: inputs.generatedAt,
      edits: [],
    },
    validation: UNVALIDATED,
    // A generated map is a draft. Whether to USE it is a separate decision from whether it is
    // valid, and it is not a generator's to make. Nobody has reviewed this, so it says so.
    status: "draft",
    vettedBy: null,
    vettedAt: null,
    revalidatedAt: inputs.generatedAt,
  };

  const verified = downgradeUnverifiedCitations(candidate, inputs.verifiedUrls);
  return verified.validation.errors.length > 0 ? buildStubMap(ctx) : verified;
}

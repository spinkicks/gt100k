/**
 * The deterministic `stubMapGenerator` (spec §4). This is the generator CI runs, so the suite stays
 * hermetic and a live adapter can be swapped in later without any test depending on a model.
 *
 * Pure function of its `MapContext`: same input, same output, always. No clock, no randomness, no
 * I/O. Every timestamp it writes is {@link STUB_GENERATED_AT}, because a stub that stamped
 * `Date.now()` would stop being reproducible and would take the whole CI gate with it.
 *
 * Its map passes the validator with zero errors, which is the point of it: CI always has a
 * generator whose output the gate accepts. Four of the ten error rules it passes by construction
 * rather than by getting anything right (see the header of `test/stub.test.ts`), so the golden
 * fixtures and not this file are the evidence that the rules are satisfiable by real content.
 *
 * It does NOT pass with zero warnings, and deliberately so. See ORDERING below.
 */
import type { CuratedResource } from "@gt100k/concierge";
import type { Stage } from "@gt100k/specialization-planner";
import { type DomainPath, type WorkMode, serializePath } from "@gt100k/two-axis-tagging";

import type { Justification, MasteryMap, Milestone, ValidationRecord } from "./model.js";
import type { MapContext, MapGenerator } from "./ports.js";
import { validateMap } from "./validate.js";

/** The single fixed instant the stub writes everywhere. A stub cannot read a clock and stay a
    stub, so it does not pretend to: this is visibly a constant rather than a plausible-looking
    time, and a live adapter is where a real one belongs. */
export const STUB_GENERATED_AT = "2026-01-01T00:00:00.000Z";

export const STUB_PROMPT_VERSION = "stub-v1";

/** Humanize a domain leaf: "audio-systems" becomes "Audio Systems". Same rule the planner's stub
    uses, so the two read alike where they describe the same domain. */
function humanizeLeaf(domainPath: DomainPath): string {
  const leaf = domainPath.length === 2 ? domainPath[1] : domainPath[0];
  return leaf
    .split("-")
    .filter((w) => w.length > 0)
    .map((w) => `${w.charAt(0).toUpperCase()}${w.slice(1)}`)
    .join(" ");
}

/**
 * ORDERING. The stub has no syllabus, no research and no named community behind anything it puts
 * in order, so it says `model` and carries no sources. That is the honest shape, and it costs the
 * map two warnings: `W1_MODEL_HEAVY` and `W2_NO_SYLLABUS`. Attaching a citation to quieten them
 * would be inventing external support that does not exist, which is the exact failure the whole
 * ordering rule was written to expose. The warnings are correct output.
 */
function ordering(domain: string): Justification {
  return {
    reason: [
      `This stub orders ${domain} by what makes the next thing possible: nothing can be`,
      "repeated before it has been made once, and nothing can be shown before it is finished.",
    ].join(" "),
    basis: "model",
    sources: [],
  };
}

interface TrunkTemplate {
  readonly slug: string;
  readonly title: (domain: string) => string;
  readonly capability: (domain: string) => string;
  readonly demonstration: (domain: string) => string;
  readonly stageFloor: Stage;
}

/**
 * The trunk, in order, and every floor is at or below S2_FOUNDATIONS. Nothing above that is
 * reachable by any child today (`deriveStage` needs `stretchSeeking`, which needs
 * `chosen_challenge`, which nothing emits), so a stub whose only complete path ran through a branch
 * would generate a map nobody can enter.
 *
 * Each `capability` shares a content word with its own `demonstration`, which is error rule 3: a
 * milestone you could finish by consuming something is one whose capability names nothing you made.
 */
const TRUNK: readonly TrunkTemplate[] = [
  {
    slug: "first-work",
    title: (d) => `Make a first piece of ${d} work`,
    capability: (d) => `Make a small piece of ${d} work and keep a record of what you made`,
    demonstration: (d) => `A kept record of one small piece of ${d} work`,
    stageFloor: "S1_IGNITION",
  },
  {
    slug: "repeat-it",
    title: (d) => `Get the same ${d} result twice`,
    capability: (d) => `Repeat one ${d} technique until you can show the same result twice`,
    demonstration: (d) => `Two records of the same ${d} result, made on separate sittings`,
    stageFloor: "S2_FOUNDATIONS",
  },
  {
    slug: "finish-and-show",
    title: (d) => `Finish a piece of ${d} work and show it`,
    capability: (d) => `Publish one finished piece of ${d} work with a note on what to change`,
    demonstration: (d) => `A published piece of ${d} work with a written note on what to change`,
    stageFloor: "S2_FOUNDATIONS",
  },
];

/** Branches sit at expert entry, where the design expects divergence. Warning rule 3 flags a branch
    below it, and putting the stub's branches at the floor keeps the stub's own output free of a
    warning it would only be earning by carelessness. */
const BRANCH_STAGE_FLOOR: Stage = "S3_AUTHORSHIP";

/** A resource a generator can attach without making its map invalid: rule 5 wants a provenance and
    at least one age tier the map claims. The generator drops the rest rather than emitting a map it
    already knows the validator will reject. It never edits a resource to make it fit.

    Exported because the live adapter attaches from the same curated library against the same rule,
    and a second copy of the filter is a second thing to keep in step with rule 5. */
export function attachable(
  resources: readonly CuratedResource[],
  ageBands: MapContext["ageBands"],
): readonly CuratedResource[] {
  return resources.filter(
    (r) => r.provenance.trim() !== "" && r.ageTiers.some((t) => ageBands.includes(t)),
  );
}

function trunkMilestone(
  t: TrunkTemplate,
  index: number,
  ctx: MapContext,
  domain: string,
  resources: readonly CuratedResource[],
): Milestone {
  const previous = TRUNK[index - 1];
  return {
    id: `${idPrefix(ctx.domainPath)}-${t.slug}`,
    title: t.title(domain),
    capability: t.capability(domain),
    requires: previous === undefined ? [] : [`${idPrefix(ctx.domainPath)}-${previous.slug}`],
    modes: [],
    stageFloor: t.stageFloor,
    ordering: ordering(domain),
    // Everything attachable lands on the entry milestone. The stub does not know which resource
    // belongs at which step, and spreading them by some invented rule would dress a guess up as a
    // judgement it has not made.
    resources: index === 0 ? resources : [],
    practice: [
      {
        title: `Short ${domain} reps, alone`,
        description: [
          `Do one small piece of ${domain} work on its own, with nothing else running.`,
          "Stop when it stops being interesting.",
        ].join(" "),
        solitary: true,
      },
    ],
    demonstration: t.demonstration(domain),
    opportunities: [],
    authorship: "model",
  };
}

function branchMilestone(mode: WorkMode, ctx: MapContext, domain: string): Milestone {
  const prefix = idPrefix(ctx.domainPath);
  const last = TRUNK[TRUNK.length - 1];
  return {
    id: `${prefix}-branch-${mode}`,
    title: `Take ${domain} further in ${mode} work`,
    capability: `Take a ${domain} project into ${mode} work and publish what it produced`,
    requires: last === undefined ? [] : [`${prefix}-${last.slug}`],
    modes: [mode],
    stageFloor: BRANCH_STAGE_FLOOR,
    ordering: ordering(domain),
    resources: [],
    practice: [
      {
        title: `${mode} reps on one ${domain} project`,
        description: [
          `Work the same ${domain} project in ${mode} mode more than once, and keep each pass`,
          "so the difference between them is visible.",
        ].join(" "),
        solitary: false,
      },
    ],
    demonstration: `A published ${domain} project with the ${mode} work it produced`,
    opportunities: [
      {
        kind: "community",
        description: `Other people do ${mode} work in ${domain}, and some of them publish it.`,
        readinessNote: "Worth a look once there is finished work to show. This is not a deadline.",
        stageFloor: BRANCH_STAGE_FLOOR,
      },
    ],
    authorship: "model",
  };
}

function idPrefix(domainPath: DomainPath): string {
  return serializePath(domainPath).replace("/", "-");
}

/** A placeholder so the map is a complete `MasteryMap` before it is validated. It is replaced by
    the real record below and never escapes this module. */
const UNVALIDATED: ValidationRecord = {
  validatedAt: STUB_GENERATED_AT,
  validatorVersion: "unvalidated",
  errors: [],
  warnings: [],
};

/** Build the stub map for a context. Pure; no network, no clock, no randomness. */
export function buildStubMap(ctx: MapContext): MasteryMap {
  const domain = humanizeLeaf(ctx.domainPath);
  const resources = attachable(ctx.resources, ctx.ageBands);
  const milestones: readonly Milestone[] = [
    ...TRUNK.map((t, i) => trunkMilestone(t, i, ctx, domain, resources)),
    ...ctx.modes.map((mode) => branchMilestone(mode, ctx, domain)),
  ];

  const candidate: MasteryMap = {
    id: `map:${serializePath(ctx.domainPath)}`,
    version: 1,
    domainPath: ctx.domainPath,
    modes: ctx.modes,
    ageBands: ctx.ageBands,
    milestones,
    provenance: {
      model: "stub",
      promptVersion: STUB_PROMPT_VERSION,
      generatedAt: STUB_GENERATED_AT,
      edits: [],
    },
    validation: UNVALIDATED,
    // A generated map is a draft. Whether to USE it is a separate decision from whether it is
    // valid, and it is not the generator's to make.
    status: "draft",
    vettedBy: null,
    vettedAt: null,
    revalidatedAt: STUB_GENERATED_AT,
  };

  // Nothing in the validator reads `validation`, so the record the map earns is the same before and
  // after it is embedded.
  return { ...candidate, validation: validateMap(candidate) };
}

/** The deterministic in-package generator, and the default port. */
export const stubMapGenerator: MapGenerator = {
  generate(ctx: MapContext): Promise<MasteryMap> {
    return Promise.resolve(buildStubMap(ctx));
  },
};

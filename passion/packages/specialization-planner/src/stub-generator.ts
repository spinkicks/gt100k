// The deterministic `stubBriefGenerator` (spec §3.4) — powers the CI gate + LOOP_QA + the panel's
// default render. It builds a valid Renzulli Type III `ProjectBrief` (all four criteria) by template
// from domainPath (humanized leaf) × mode × stage × audience × craftFloorHint, with a `craftScaffold`
// that CITES the passed curated `resources` (title + url of the vetted A6 material) when present and
// a generic scaffold otherwise. `childOwnsChoice` is always `true` (the brief is an OFFER, never an
// assignment) and there is no score/reward field. NO network; fully synchronous work wrapped in a
// resolved Promise so the engine can `await` it and the panel stays deterministic.
import type {
  BriefContext,
  ProjectBrief,
  ProjectBriefGenerator,
  Stage,
} from "./model.js";
import type { CuratedResource } from "@gt100k/concierge";
import type { DomainPath } from "@gt100k/two-axis-tagging";

/** Humanize a domain leaf slug: "audio-systems" → "Audio Systems". */
function humanizeLeaf(domainPath: DomainPath): string {
  const leaf = domainPath.length === 2 ? domainPath[1] : domainPath[0];
  return leaf
    .split("-")
    .filter((w) => w.length > 0)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

interface StageTemplate {
  readonly title: (domain: string) => string;
  readonly drivingQuestion: (domain: string) => string;
  readonly authenticMethod: (domain: string, mode: string) => string;
  readonly successLooksLike: string;
  readonly defaultCraft: (domain: string) => string;
}

// Stable per-stage templates. The `title`/`drivingQuestion` are asserted verbatim by the tests
// (spec §6), so their prose must not drift without updating the golden.
const TEMPLATES: Record<Stage, StageTemplate> = {
  S1_IGNITION: {
    title: (d) => `Play with ${d}`,
    drivingQuestion: (d) => `What about ${d} makes you want to come back and try more?`,
    authenticMethod: (d, mode) =>
      `Run lots of short, playful ${mode} experiments in ${d} — follow whatever is fun, no wrong answers.`,
    successLooksLike:
      "You kept choosing to come back, and you can point to something you made and enjoyed.",
    defaultCraft: (d) =>
      `Mess around freely with ${d}; the only skill floor is noticing what you enjoy and coming back.`,
  },
  S2_FOUNDATIONS: {
    title: (d) => `A ${d} project that gets precise`,
    drivingQuestion: (d) => `How could you make your ${d} work noticeably better this term?`,
    authenticMethod: (d, mode) =>
      `Use the real techniques of ${d}: plan the project, do a little focused ${mode} practice, then revise against a standard.`,
    successLooksLike:
      "You set a goal, practiced with intent, and can honestly say what got better.",
    defaultCraft: (d) =>
      `Pair the project with a small, bounded practice on one ${d} technique you chose.`,
  },
  S3_AUTHORSHIP: {
    title: (d) => `A ${d} project for a real community`,
    drivingQuestion: (d) =>
      `What could you make in ${d} that a real community would actually use or respond to?`,
    authenticMethod: (d, mode) =>
      `Work like a practitioner: scope a real ${mode} project in ${d}, ship it to a real audience, and take their feedback seriously.`,
    successLooksLike:
      "You put real work in front of a real audience and used their response to make it better.",
    defaultCraft: (d) =>
      `Anchor the project with a chosen, capped practice on the ${d} craft the audience will notice.`,
  },
  S4_SIGNATURE: {
    title: (d) => `Your signature ${d} work`,
    drivingQuestion: (d) =>
      `What is the ${d} work only you would make — the piece that shows your voice?`,
    authenticMethod: (d, mode) =>
      `Lead a flagship ${mode} project in ${d} and build a coherent body of work around it, apprentice-style with a master.`,
    successLooksLike:
      "You shaped a body of work with a recognizable voice and can defend the choices behind it.",
    defaultCraft: (d) =>
      `Sustain a chosen, still-capped practice on the ${d} craft that makes your voice sharper.`,
  },
};

/** Cite the vetted curated resources (title + url) in the craft scaffold when present. */
function citeResources(resources: readonly CuratedResource[]): string {
  return resources.map((r) => `${r.title} (${r.url})`).join("; ");
}

function buildScaffold(
  domain: string,
  stage: Stage,
  craftFloorHint: string,
  resources: readonly CuratedResource[],
): string {
  const hint = craftFloorHint.trim().length > 0 ? craftFloorHint.trim() : TEMPLATES[stage].defaultCraft(domain);
  if (resources.length > 0) {
    return `${hint} Ground the craft floor in these vetted resources: ${citeResources(resources)}.`;
  }
  return hint;
}

/** Build the deterministic Type III brief for a context. Pure; no network. */
export function buildStubBrief(ctx: BriefContext): ProjectBrief {
  const domain = humanizeLeaf(ctx.domainPath);
  const t = TEMPLATES[ctx.stage];
  return {
    title: t.title(domain),
    drivingQuestion: t.drivingQuestion(domain),
    authenticMethod: t.authenticMethod(domain, ctx.mode),
    audience: ctx.audience,
    childOwnsChoice: true,
    craftScaffold: buildScaffold(domain, ctx.stage, ctx.craftFloorHint, ctx.resources),
    successLooksLike: t.successLooksLike,
    source: "stub",
  };
}

/** The deterministic in-package generator (the default port). */
export const stubBriefGenerator: ProjectBriefGenerator = {
  generate(ctx: BriefContext): Promise<ProjectBrief> {
    return Promise.resolve(buildStubBrief(ctx));
  },
};

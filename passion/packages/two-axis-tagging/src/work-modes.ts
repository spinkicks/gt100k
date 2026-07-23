// The work-mode (style) axis: a fixed set of 9 verbs. Definitions are DATA (not code) so the
// validity harness can stress-test them and authoring can sharpen/merge/split boundary rules (§3.2, §7).
export const WORK_MODES = [
  "build", "investigate", "compose", "perform",
  "debug", "explain", "persuade", "collaborate", "care",
] as const;

export type WorkMode = (typeof WORK_MODES)[number];

export interface WorkModeDef {
  readonly id: WorkMode;
  readonly gloss: string;
  readonly produces: "artifact" | "understanding" | "performance" | "none";
  readonly examples: readonly string[];
  readonly boundaryRules: readonly string[];
}

export const WORK_MODE_DEFS: Record<WorkMode, WorkModeDef> = {
  build: {
    id: "build", gloss: "Produces a new artifact or structure.", produces: "artifact",
    examples: ["assemble a subwoofer box", "wire a circuit"],
    boundaryRules: ["Must yield a made thing; probing alone is investigate."],
  },
  investigate: {
    id: "investigate", gloss: "Probes how something works; need not produce an artifact.", produces: "understanding",
    examples: ["measure a speaker's response", "trace a bug's cause"],
    boundaryRules: ["If it yields a made thing, it is build; if it fixes a defect, it is debug."],
  },
  compose: {
    id: "compose", gloss: "Creates an expressive work (music, art, writing).", produces: "artifact",
    examples: ["write a melody", "draw a scene"],
    boundaryRules: ["Expressive creation; functional creation is build."],
  },
  perform: {
    id: "perform", gloss: "Executes/plays a skill live.", produces: "performance",
    examples: ["play the piano piece", "run the chess game"],
    boundaryRules: ["Live execution; creating the score is compose."],
  },
  debug: {
    id: "debug", gloss: "Diagnoses and fixes a defect.", produces: "artifact",
    examples: ["fix the failing test", "repair the mixer"],
    boundaryRules: ["Requires a defect to fix; open-ended probing is investigate."],
  },
  explain: {
    id: "explain", gloss: "Articulates understanding to others.", produces: "understanding",
    examples: ["teach how a filter works", "write a how-to"],
    boundaryRules: ["Conveys understanding; persuading toward action is persuade."],
  },
  persuade: {
    id: "persuade", gloss: "Moves an audience toward a view or action.", produces: "understanding",
    examples: ["pitch a project", "market a demo"],
    boundaryRules: ["Aims to move; neutral conveyance is explain."],
  },
  collaborate: {
    id: "collaborate", gloss: "Works jointly with others toward a shared goal.", produces: "none",
    examples: ["co-build with a peer", "run a group jam"],
    boundaryRules: ["Requires ≥2 actors on one goal."],
  },
  care: {
    id: "care", gloss: "Tends, maintains, or nurtures something over time.", produces: "none",
    examples: ["tend a garden", "maintain a habitat"],
    boundaryRules: ["Ongoing tending; a one-off fix is debug."],
  },
};

const WORK_MODE_SET = new Set<string>(WORK_MODES);
export function isWorkMode(x: unknown): x is WorkMode {
  return typeof x === "string" && WORK_MODE_SET.has(x);
}

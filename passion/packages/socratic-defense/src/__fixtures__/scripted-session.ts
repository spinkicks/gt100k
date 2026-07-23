import type { ProjectProfile, Judgment } from "../model.js";

export const PROFILE: ProjectProfile = {
  id: "proj-01",
  studentId: "stu-01",
  title: "DIY Subwoofer",
  domain: "making-engineering",
  summary: "A ported subwoofer box tuned with Thiele-Small params.",
  artifactRefs: ["a1"],
};

export const READINESS = "developing" as const;

// Turn-indexed script. Order of facets probed: what, why, why(follow-up), how, challenge, next, audience.
export const QUESTIONS: readonly string[] = [
  "What is your project?",
  "Why does this project matter to you?",
  "Say more about why it matters to you personally.",
  "How does it actually work?",
  "What was the hardest part?",
  "What's next for it?",
  "Who is it for?",
];

export const ANSWERS: readonly string[] = [
  "A subwoofer box I designed and built.",
  "I like it.",
  "My dad was a DJ and I wanted to build one that hits like his, so it's personal.",
  "The port length tunes the resonant frequency to match the driver's Fs.",
  "Getting the port math right without it chuffing.",
  "Add a second driver and measure the response.",
  "For my room, and to show my dad.",
];

export const JUDGMENTS: readonly Judgment[] = [
  { facet: "what", coverage: 0.7, rationale: "clear", thin: false },
  { facet: "why", coverage: 0.3, rationale: "vague", thin: true },
  { facet: "why", coverage: 0.7, rationale: "personal + specific", thin: false },
  { facet: "how", coverage: 0.7, rationale: "mechanism", thin: false },
  { facet: "challenge", coverage: 0.7, rationale: "specific obstacle", thin: false },
  { facet: "next", coverage: 0.7, rationale: "concrete plan", thin: false },
  { facet: "audience", coverage: 0.7, rationale: "named audience", thin: false },
];

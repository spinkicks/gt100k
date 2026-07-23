// Plain-language vocabulary for the console. The engine speaks in signal keys (voluntary_return, …),
// lifecycle enums (EMERGING, …) and action verbs (promote, …). Guides never decode those: everything
// they see is a human label plus a one-line description, surfaced as tooltips and in the Key. Unknown
// keys fall back to a de-underscored Title Case label (never the raw name). No em dashes in any copy.

export interface Term {
  readonly label: string;
  readonly desc: string;
}

const prettify = (k: string): string =>
  k
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

// Behavioural evidence signals (both supporting and disconfirming).
export const SIGNALS: Record<string, Term> = {
  voluntary_return: {
    label: "Voluntary Return",
    desc: "Came back to this on their own, with no prompt. The strongest sign of genuine interest.",
  },
  prompted_return: {
    label: "Prompted Return",
    desc: "Came back, but only after a nudge. Counts for less than a voluntary return.",
  },
  depth_climb: {
    label: "Depth Climb",
    desc: "Went deeper or took on something harder over time, instead of just repeating the easy part.",
  },
  gap_survived: {
    label: "Survived a Break",
    desc: "Returned to it after a long gap. The interest held up on its own.",
  },
  perseverance: {
    label: "Perseverance",
    desc: "Pushed through a difficulty or setback rather than giving up.",
  },
  skip: {
    label: "Skipped",
    desc: "Was offered this and chose something else instead.",
  },
  devaluation: {
    label: "Cooling Off",
    desc: "Started downplaying or dismissing it. Interest may be fading.",
  },
};

export function signal(key: string): Term {
  return SIGNALS[key] ?? { label: prettify(key), desc: "" };
}

// Lifecycle states of an interest hypothesis.
export const STATES: Record<string, Term> = {
  EXPLORING: {
    label: "Exploring",
    desc: "Just sampling. Not enough signal yet to say anything.",
  },
  EMERGING: {
    label: "Emerging",
    desc: "A real pattern is forming. Worth watching and giving more chances to.",
  },
  CANDIDATE: {
    label: "Candidate",
    desc: "Strong, durable signal. Ready to consider specializing.",
  },
  ACTIVE: {
    label: "Active",
    desc: "An owned specialization the child is actively building.",
  },
  PARKED: {
    label: "Parked",
    desc: "Set aside for now. Fully reversible; can be reopened anytime.",
  },
  CONTESTED: {
    label: "Contested",
    desc: "Flagged as doubtful; the evidence needs a second look.",
  },
  REOPENED: {
    label: "Reopened",
    desc: "Brought back after being parked; returns to Emerging.",
  },
};

export function stateTerm(key: string): Term {
  return STATES[key] ?? { label: prettify(key), desc: "" };
}

// Human actions a guide can take on a hypothesis.
export const ACTIONS: Record<string, Term> = {
  promote: {
    label: "Promote",
    desc: "Move this up a stage. Needs a passed gate and your autonomy sign-off.",
  },
  park: {
    label: "Park",
    desc: "Set it aside for now. Nothing is deleted, so you can reopen it later.",
  },
  contest: {
    label: "Contest",
    desc: "Flag it as doubtful when the evidence looks off or misleading.",
  },
  reopen: {
    label: "Reopen",
    desc: "Bring a parked interest back into play (returns to Emerging).",
  },
};

export function actionTerm(key: string): Term {
  return ACTIONS[key] ?? { label: prettify(key), desc: "" };
}

// Display names for domain segments and work-modes. The engine keys are lowercase + hyphenated
// (games-logic, audio-systems); guides see proper names (Games & Logic, Audio Systems). Unknown
// segments fall back to Title Case with hyphens turned into spaces (never the raw key).
const titleCaseHyphen = (k: string): string =>
  k
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

export const DOMAINS: Record<string, string> = {
  "games-logic": "Games & Logic",
  "music-sound": "Music & Sound",
  "movement-body": "Movement & Body",
  "visual-art": "Visual Art",
  "writing-word": "Writing & Words",
  "science-nature": "Science & Nature",
  "sports-body": "Sports & Body",
  computers: "Computers",
  "audio-systems": "Audio Systems",
  chess: "Chess",
  go: "Go",
  software: "Software",
  dance: "Dance",
  drawing: "Drawing",
  story: "Story",
  biology: "Biology",
  production: "Production",
  climbing: "Climbing",
};

export function domainLabel(seg: string): string {
  return DOMAINS[seg] ?? titleCaseHyphen(seg);
}

// Work-modes: the *way* a child engages a topic (the second axis of the two-axis tag).
export const MODES: Record<string, Term> = {
  build: {
    label: "Build",
    desc: "Making or constructing things: prototypes, rigs, projects, systems.",
  },
  make: { label: "Make", desc: "Producing tangible creations or artifacts by hand." },
  compete: {
    label: "Compete",
    desc: "Playing to win: matches, tournaments, ranked or timed play.",
  },
  perform: {
    label: "Perform",
    desc: "Presenting for an audience: playing, showing, staging, demoing.",
  },
  create: {
    label: "Create",
    desc: "Original creative expression: art, writing, composition, design.",
  },
  investigate: {
    label: "Investigate",
    desc: "Digging into how or why things work: research, analysis, experiments.",
  },
  study: { label: "Study", desc: "Learning and mastering material: reading, drilling, practice." },
};

export function modeTerm(m: string): Term {
  return MODES[m] ?? { label: m ? m.charAt(0).toUpperCase() + m.slice(1) : m, desc: "" };
}

export function modeLabel(m: string): string {
  return modeTerm(m).label;
}

// Attribution: whether the interest looks driven by the topic, the work-style, or both. This is what
// the "style" / "topic" tag in the evidence line means.
export const ATTRIBUTIONS: Record<string, Term> = {
  domain: {
    label: "Topic",
    desc: "Driven by the subject itself (e.g. music), across different ways of working.",
  },
  style: {
    label: "Work-style",
    desc: "Driven by the way of working (e.g. building), across different topics, more than any one subject.",
  },
  mixed: {
    label: "Topic + Work-style",
    desc: "Both the subject and the way of working seem to matter.",
  },
};

export function attributionTerm(a: string): Term {
  return ATTRIBUTIONS[a] ?? { label: a, desc: "" };
}

export function specPath(domainPath: readonly string[]): string {
  return domainPath.map(domainLabel).join(" › ");
}

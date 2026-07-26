// src/__fixtures__/tfy-responses.ts
// Recorded TrueFoundry Chat Completions response CONTENT (the JSON the model is asked to return via
// `response_format: { type: "json_object" }`). Stored as `.ts` and NOT `.json`, because the repo
// tsconfig does not set `resolveJsonModule`. SYNTHETIC in the sense that no child appears anywhere.
// Used ONLY by the hermetic parse test.
//
// NO FABRICATED CITATION APPEARS IN THIS FILE, and that is a rule and not an accident. A made-up
// DOI sitting in a fixture is the exact artefact this adapter exists to catch, and a reader who
// later mistook one for a real reference would have been misled by our own test data. So there are
// only two kinds of citation below:
//
//   - REAL ones, reused from the package's golden maps (`mastery-map/src/__fixtures__/maps.ts`),
//     where they are already relied on as checkable published documents.
//   - KNOWABLY UNRESOLVABLE ones, built on `example.invalid`. RFC 2606 reserves `.invalid` so that
//     it can never resolve, so such a url is citation-SHAPED and provably not a citation. That is
//     what a fabrication looks like from the outside: plausible, and not there.

/** ABRSM's piano syllabus page. Real, and already cited by the package's piano golden map. */
export const ABRSM_PRACTICAL = {
  authors: "ABRSM, Piano Practical Grades syllabus",
  year: 2025,
  url: "https://www.abrsm.org/en-gb/instruments/piano",
};

/** ABRSM's Performance Grades specification. Real, and likewise already cited by the goldens. */
export const ABRSM_PERFORMANCE = {
  authors: "ABRSM, Music Performance Grades qualification specification",
  year: 2023,
  url: "https://www.abrsm.org/sites/default/files/2023-10/00-performance-grades-qual-spec-generic-parts-230728.pdf",
};

/**
 * The shape of a fabrication: well-formed authors, a plausible year, an https url that looks like a
 * DOI landing page, and nothing at the other end. Structurally it passes every check that can be
 * made without leaving the process, which is the whole problem: only fetching it settles it.
 */
export const UNRESOLVABLE_SOURCE = {
  authors: "Piano Pedagogy Working Group",
  year: 2019,
  url: "https://example.invalid/10.0000/no-such-record",
};

/**
 * Unverifiable without any network at all: no authors, a year that is not a year, and a url that is
 * neither https nor a doi. Nothing here is worth spending a request on.
 */
export const MALFORMED_SOURCE = {
  authors: "   ",
  year: 12,
  url: "http://someone-said-so.example.com/page",
};

const PLAY_A_WHOLE_PIECE = {
  id: "pf-one-whole-piece",
  title: "Play one whole short piece",
  capability: "Play a short piece from start to finish and keep the recorded take",
  requires: [],
  modes: [],
  stageFloor: "S1_IGNITION",
  ordering: {
    reason:
      "ABRSM's Initial Grade is assessed on three complete pieces, so a whole short piece played " +
      "end to end is the first thing the syllabus asks for, before any technical work is examined " +
      "on its own.",
    basis: "syllabus",
    sources: [ABRSM_PRACTICAL],
  },
  practice: [
    {
      title: "Play it through without stopping",
      description:
        "Play the piece end to end and let the mistakes stand. Stopping to fix things is a " +
        "different exercise and belongs in a different sitting.",
      solitary: true,
    },
  ],
  demonstration: "A recorded take of one short piece played from start to finish",
  opportunities: [],
};

const HOLD_A_PULSE = {
  id: "pf-steady-pulse",
  title: "Hold a steady pulse",
  capability: "Play a scale and a short piece at one steady pulse, and keep both takes",
  requires: ["pf-one-whole-piece"],
  modes: [],
  stageFloor: "S1_IGNITION",
  ordering: {
    reason:
      "Scales and arpeggios are marked as their own component from Initial Grade upwards, and " +
      "they exist to make an even pulse automatic before the repertoire needs it.",
    basis: "syllabus",
    sources: [ABRSM_PRACTICAL],
    limit: "The syllabus orders the components; it does not claim this is how anyone learns.",
  },
  practice: [
    {
      title: "One scale, one pulse",
      description:
        "Set a slow pulse you can hold and play one scale at it. Slow enough to be even.",
      solitary: true,
    },
  ],
  demonstration: "Two takes at a steady pulse, one of a scale and one of a short piece",
  opportunities: [],
};

/** The honest answer the prompt asks for where nothing external backs the placement. */
const SIGHT_READ = {
  id: "pf-sight-read",
  title: "Play something you have never seen",
  capability: "Sight-read a short unseen line and keep a log of what broke",
  requires: ["pf-steady-pulse"],
  modes: [],
  stageFloor: "S2_FOUNDATIONS",
  ordering: {
    reason:
      "Reading something new only works once a pulse is steady enough to hold while your eyes " +
      "are ahead of your hands. No published source places this step here.",
    basis: "model",
    sources: [],
  },
  practice: [
    {
      title: "Half a minute of looking",
      description: "Look at an unseen line, then play it once. Do not practise it first.",
      solitary: true,
    },
  ],
  demonstration: "A log of one sight-read attempt, with the bars that broke marked",
  opportunities: [],
};

const PERFORM_FOR_PEOPLE = {
  id: "pf-perform-a-set",
  title: "Perform a short set for people",
  capability: "Perform a short set for a live audience and keep the recording",
  requires: ["pf-sight-read"],
  modes: ["perform"],
  stageFloor: "S3_AUTHORSHIP",
  ordering: {
    reason:
      "Performance Grades are assessed on a programme played straight through to an audience, " +
      "which is a different demand from playing the same pieces to an examiner one at a time.",
    basis: "syllabus",
    sources: [ABRSM_PERFORMANCE],
  },
  practice: [
    {
      title: "Run the whole set once, out loud",
      description:
        "Play the programme in order with no restarts, in a room where someone can hear you.",
      solitary: false,
    },
  ],
  demonstration: "A recording of one short set performed for a live audience",
  opportunities: [
    {
      kind: "showcase",
      description: "Local music schools and community halls run informal platforms.",
      readinessNote: "Worth a look once there is a set worth hearing. This is not a deadline.",
      stageFloor: "S3_AUTHORSHIP",
    },
  ],
};

/** A well-formed DAG whose every citation is real. Validates with zero errors. */
export const MAP_VALID = {
  milestones: [PLAY_A_WHOLE_PIECE, HOLD_A_PULSE, SIGHT_READ, PERFORM_FOR_PEOPLE],
};

/** Identical, except the entry milestone rests on a citation that is not there. */
export const MAP_UNRESOLVABLE_CITATION = {
  milestones: [
    {
      ...PLAY_A_WHOLE_PIECE,
      ordering: { ...PLAY_A_WHOLE_PIECE.ordering, sources: [UNRESOLVABLE_SOURCE] },
    },
    HOLD_A_PULSE,
    SIGHT_READ,
    PERFORM_FOR_PEOPLE,
  ],
};

/** A citation nothing needs to fetch to reject. */
export const MAP_MALFORMED_SOURCE = {
  milestones: [
    {
      ...PLAY_A_WHOLE_PIECE,
      ordering: { ...PLAY_A_WHOLE_PIECE.ordering, sources: [MALFORMED_SOURCE] },
    },
    HOLD_A_PULSE,
    SIGHT_READ,
    PERFORM_FOR_PEOPLE,
  ],
};

/** A DAG edge pointing at nothing: coerces cleanly, then fails E1_DANGLING. */
export const MAP_DANGLING_REQUIRE = {
  milestones: [
    PLAY_A_WHOLE_PIECE,
    { ...HOLD_A_PULSE, requires: ["pf-a-milestone-that-was-never-written"] },
    SIGHT_READ,
    PERFORM_FOR_PEOPLE,
  ],
};

/**
 * A capability that names nothing from its demonstration: coerces cleanly, then fails E3, which is
 * the rule against a milestone you could finish by consuming something.
 */
export const MAP_CONSUMABLE_MILESTONE = {
  milestones: [
    {
      ...PLAY_A_WHOLE_PIECE,
      capability: "Get familiar with how the instrument works",
      demonstration: "A recorded take of one short piece played from start to finish",
    },
    HOLD_A_PULSE,
    SIGHT_READ,
    PERFORM_FOR_PEOPLE,
  ],
};

/** `demonstration` missing entirely ⇒ the parse fails ⇒ the caller uses the stub. */
export const MAP_MISSING_FIELD = {
  milestones: [
    PLAY_A_WHOLE_PIECE,
    { ...HOLD_A_PULSE, demonstration: undefined },
    SIGHT_READ,
    PERFORM_FOR_PEOPLE,
  ],
};

/** A stage that is not one of ours ⇒ the parse fails rather than guessing which stage was meant. */
export const MAP_BAD_STAGE_FLOOR = {
  milestones: [{ ...PLAY_A_WHOLE_PIECE, stageFloor: "S9_MASTERY" }],
};

/** A basis outside the four ⇒ the parse fails. Silently reading it as `model` would invent a claim. */
export const MAP_BAD_BASIS = {
  milestones: [
    { ...PLAY_A_WHOLE_PIECE, ordering: { ...PLAY_A_WHOLE_PIECE.ordering, basis: "widely known" } },
  ],
};

/** A model that returned the envelope and no map. */
export const MAP_NO_MILESTONES = { milestones: [] };

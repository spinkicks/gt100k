/**
 * The two golden maps (spec §8). One domain with a real external syllabus, one with none, so both
 * anchor classes are exercised end to end.
 *
 * These are hand-built INPUTS to the validator. The expected `ValidationRecord` for each is derived
 * by hand in `test/golden.test.ts` and computed there; the `validation` field below is a
 * placeholder that says so, because a fixture carrying a pre-baked record would be asserting on
 * itself.
 *
 * REACHABILITY, which is why both maps are shaped the way they are. Nothing above `S2_FOUNDATIONS`
 * is reachable by any child today: `deriveStage` needs `stretchSeeking` for both higher stages,
 * `stretchSeeking` derives solely from `chosen_challenge`, and nothing in production emits that
 * event (escalated in PR #163). So each map holds a COMPLETE path made only of trunk milestones at
 * or below `S2_FOUNDATIONS`. Every branch here is real and correct and none of it is reachable yet,
 * which is deliberate: the map is authored independently of who can currently walk it, and the
 * branches switch on the day the signal arrives. A fixture whose only complete path ran through a
 * branch would be asserting on structure no child can enter.
 *
 * SYNTHETIC in the sense that no child appears anywhere. The domain content is not synthetic: the
 * syllabus claims below are checkable against the cited documents, which is the entire point of
 * `basis: "syllabus"`.
 */
import type { CuratedResource } from "@gt100k/concierge";
import type { Source } from "@gt100k/research";

import type { MasteryMap, Milestone, ValidationRecord } from "../model.js";

/** Not a result. The golden test computes the real record. */
const UNVALIDATED: ValidationRecord = {
  validatedAt: "",
  validatorVersion: "unvalidated",
  errors: [],
  warnings: [],
};

// ── Fixture 1: piano ─────────────────────────────────────────────────────────────────────────────
// Anchored to two syllabuses that genuinely exist and can be read by anyone who wants to check:
// ABRSM's Piano Practical Grades (Initial Grade to Grade 8: three pieces, scales and arpeggios,
// sight-reading, aural tests) and Trinity College London's piano grades (two supporting tests
// chosen from sight reading, aural, improvisation and musical knowledge at Initial to Grade 5).
// Both are real published curricula with external standing, which is exactly what the "syllabus"
// basis is for.

const ABRSM_PRACTICAL: Source = {
  authors: "ABRSM, Piano Practical Grades syllabus",
  year: 2025,
  url: "https://www.abrsm.org/en-gb/instruments/piano",
};

const ABRSM_PERFORMANCE: Source = {
  authors: "ABRSM, Music Performance Grades qualification specification",
  year: 2023,
  url: "https://www.abrsm.org/sites/default/files/2023-10/00-performance-grades-qual-spec-generic-parts-230728.pdf",
};

const TRINITY_SUPPORTING: Source = {
  authors: "Trinity College London, supporting tests for graded music exams",
  year: 2023,
  url: "https://www.trinitycollege.com/qualifications/music/grade-exams/about/supporting-tests",
};

const ERICSSON_1993: Source = {
  authors: "Ericsson, Krampe & Tesch-Romer",
  year: 1993,
  url: "https://doi.org/10.1037/0033-295X.100.3.363",
};

const MACNAMARA_2014: Source = {
  authors: "Macnamara, Hambrick & Oswald",
  year: 2014,
  url: "https://doi.org/10.1177/0956797614535810",
};

const WOOD_1976: Source = {
  authors: "Wood, Bruner & Ross",
  year: 1976,
  url: "https://doi.org/10.1111/j.1469-7610.1976.tb00381.x",
};

const ABRSM_PIANO_PAGE: CuratedResource = {
  id: "cr-abrsm-piano",
  title: "ABRSM: piano exam requirements and syllabus downloads",
  url: "https://www.abrsm.org/en-gb/instruments/piano",
  domainPath: ["music-sound", "instruments"],
  affordedModes: ["perform"],
  reputation: 0.95,
  ageTiers: ["6-8", "9-11", "12-14"],
  provenance: "curated-library:human-vetted",
};

const TRINITY_PAGE: CuratedResource = {
  id: "cr-trinity-supporting-tests",
  title: "Trinity College London: supporting tests, including sight reading",
  url: "https://www.trinitycollege.com/qualifications/music/grade-exams/about/supporting-tests",
  domainPath: ["music-sound", "instruments"],
  affordedModes: ["perform"],
  reputation: 0.93,
  ageTiers: ["9-11", "12-14"],
  provenance: "curated-library:human-vetted",
};

const IMSLP: CuratedResource = {
  id: "cr-imslp",
  title: "IMSLP, the Petrucci Music Library: public-domain scores",
  url: "https://imslp.org/",
  domainPath: ["music-sound", "instruments"],
  affordedModes: ["perform", "compose"],
  reputation: 0.88,
  ageTiers: ["9-11", "12-14"],
  provenance: "curated-library:human-vetted",
};

const PIANO_MILESTONES: readonly Milestone[] = [
  {
    id: "pf-one-whole-piece",
    title: "Play one whole short piece",
    capability: "Play a short piece from start to finish and keep the recorded take",
    requires: [],
    modes: [],
    stageFloor: "S1_IGNITION",
    ordering: {
      reason:
        "ABRSM's Initial Grade is assessed on three complete pieces, so a whole short piece " +
        "played end to end is the first thing the syllabus asks for, before any technical work " +
        "is examined on its own.",
      basis: "syllabus",
      sources: [ABRSM_PRACTICAL],
    },
    resources: [ABRSM_PIANO_PAGE],
    practice: [
      {
        title: "Play it through without stopping",
        description:
          "Play the piece end to end and let the mistakes stand. Stopping to fix things is a " +
          "different exercise and belongs in a different session.",
        solitary: true,
      },
    ],
    demonstration: "A recorded take of one short piece played from start to finish",
    opportunities: [],
    authorship: "human-authored",
  },
  {
    id: "pf-steady-pulse",
    title: "Hold a steady pulse",
    capability: "Play a scale and a short piece at one steady pulse, and keep both takes",
    requires: ["pf-one-whole-piece"],
    modes: [],
    stageFloor: "S1_IGNITION",
    ordering: {
      reason:
        "Scales and arpeggios are marked as their own component from Initial Grade upwards, and " +
        "they exist to make an even pulse and even tone automatic before the repertoire needs " +
        "them.",
      basis: "syllabus",
      sources: [ABRSM_PRACTICAL],
    },
    resources: [ABRSM_PIANO_PAGE],
    practice: [
      {
        title: "One scale, one pulse",
        description:
          "Set a slow pulse you can hold and play one scale at it. Slow enough to be even beats " +
          "fast enough to be impressive.",
        solitary: true,
      },
    ],
    demonstration: "Two takes at a steady pulse, one of a scale and one of a short piece",
    opportunities: [],
    authorship: "human-authored",
  },
  {
    id: "pf-sight-read",
    title: "Play something you have never seen",
    capability:
      "Sight-read a short unseen line after half a minute of looking, and keep the log of what " +
      "broke",
    requires: ["pf-steady-pulse"],
    modes: [],
    stageFloor: "S2_FOUNDATIONS",
    ordering: {
      reason:
        "Both syllabuses set sight reading as a marked component with about half a minute to " +
        "study the test, which puts reading ahead of repertoire size: the point is to get " +
        "through unfamiliar music, not to have met it before.",
      basis: "syllabus",
      sources: [ABRSM_PRACTICAL, TRINITY_SUPPORTING],
      limit:
        "Both documents are written for exam candidates, and Trinity sets the test about two " +
        "grades below the exam being taken. Neither claims this is the order every learner must " +
        "take.",
    },
    resources: [ABRSM_PIANO_PAGE, TRINITY_PAGE],
    practice: [
      {
        title: "Cold reads, no second go",
        description:
          "Take a line you have not met, look at it for the time the syllabus allows, play it " +
          "once, and write down the bar where it fell apart.",
        solitary: true,
      },
    ],
    demonstration: "A short log of one sight-read attempt, naming the bar where it broke",
    opportunities: [],
    authorship: "human-authored",
  },
  {
    id: "pf-listen-back",
    title: "Hear what you actually played",
    capability: "Review a recording of your own playing and publish a written note of what to fix",
    requires: ["pf-sight-read"],
    modes: [],
    stageFloor: "S2_FOUNDATIONS",
    ordering: {
      reason:
        "Ericsson's Berlin conservatoire study found that what separated the strongest students " +
        "was solitary practice with a specific goal and immediate feedback rather than time at " +
        "the instrument, so hearing yourself back comes before adding more repertoire.",
      basis: "research",
      sources: [ERICSSON_1993, MACNAMARA_2014],
      limit:
        "The study is retrospective and about conservatoire students rather than children, and " +
        "its strong form did not survive meta-analysis: practice explains a modest share of the " +
        "difference between people, not most of it.",
    },
    resources: [],
    practice: [
      {
        title: "Record, listen, one note",
        description:
          "Record a short passage, listen to it once, and write a single sentence about the one " +
          "thing to change. More than one thing is a list nobody acts on.",
        solitary: true,
      },
    ],
    demonstration: "A written note on one recording, naming what to fix next",
    opportunities: [],
    authorship: "human-authored",
  },
  {
    id: "pf-own-practice",
    title: "Run your own practice",
    capability: "Write a practice plan for the week and mark on the plan what actually changed",
    requires: ["pf-listen-back"],
    modes: [],
    stageFloor: "S2_FOUNDATIONS",
    ordering: {
      reason:
        "Wood, Bruner and Ross describe support that is deliberately taken away as the learner " +
        "takes it over, so an adult shapes the practice first and the child shapes it once they " +
        "can hear for themselves what needs work.",
      basis: "research",
      sources: [WOOD_1976],
      limit:
        "The original study is about a tutor and a small child at a block-building task, so the " +
        "shape transfers here and the specifics do not.",
    },
    resources: [],
    practice: [
      {
        title: "Plan on paper, mark it after",
        description:
          "Write what you will work on before you sit down, then mark the plan afterwards with " +
          "what actually moved. The gap between the two is the useful part.",
        solitary: true,
      },
    ],
    demonstration: "A practice plan with the week's marks on it, showing what changed",
    opportunities: [],
    authorship: "human-edited",
  },
  {
    id: "pf-perform-a-programme",
    title: "Give a whole programme",
    capability: "Perform a prepared programme in one sitting and publish the recording of it",
    requires: ["pf-own-practice"],
    modes: ["perform"],
    stageFloor: "S3_AUTHORSHIP",
    ordering: {
      reason:
        "ABRSM's Performance Grades are assessed entirely from a video of four pieces given as " +
        "one continuous programme, which is a different skill from playing any one of them well " +
        "and sits after them.",
      basis: "syllabus",
      sources: [ABRSM_PERFORMANCE],
    },
    resources: [ABRSM_PIANO_PAGE, IMSLP],
    practice: [
      {
        title: "Run the whole set, once, standing by the mistakes",
        description:
          "Play the programme in order without restarting. Recovering from a slip in front of a " +
          "microphone is the thing being practised.",
        solitary: false,
      },
    ],
    demonstration: "A published recording of a prepared programme performed in one sitting",
    opportunities: [
      {
        kind: "showcase",
        description:
          "Local music services, festivals and teacher-run concerts take entries from players " +
          "at this level.",
        readinessNote:
          "Worth entering once a whole programme holds together in one sitting. There is no " +
          "schedule attached to this and nothing is missed by waiting.",
        stageFloor: "S3_AUTHORSHIP",
      },
    ],
    authorship: "human-authored",
  },
  {
    id: "pf-write-your-own",
    title: "Write a piece of your own",
    capability: "Write a short piece of your own and publish the score with a recording of it",
    requires: ["pf-own-practice"],
    modes: ["compose"],
    stageFloor: "S3_AUTHORSHIP",
    ordering: {
      reason:
        "The graded syllabuses will accept a candidate's own composition as the own-choice " +
        "piece, but none of them orders composing against performing, so where this sits is our " +
        "own call and rests on nothing published.",
      basis: "model",
      // Empty because the basis is `model`. Naming the syllabuses in the sentence above is
      // description, not support: they permit an own composition, they do not order this.
      sources: [],
    },
    resources: [IMSLP],
    practice: [
      {
        title: "Eight bars, finished",
        description:
          "Write something short enough to finish and then finish it. An unfinished piece " +
          "teaches nothing that a finished short one does not.",
        solitary: true,
      },
    ],
    // "score" is ordinary domain language here. Rule 8 bans a FIELD named `score` and never scans
    // a value, which is the distinction the rule exists to make.
    demonstration: "A published score of one original short piece, with a recording",
    opportunities: [],
    authorship: "human-authored",
  },
];

export const PIANO_MAP: MasteryMap = {
  id: "map-piano",
  version: 1,
  domainPath: ["music-sound", "instruments"],
  modes: ["perform", "compose"],
  ageBands: ["6-8", "9-11", "12-14"],
  milestones: PIANO_MILESTONES,
  provenance: {
    model: "hand-authored",
    promptVersion: "none",
    generatedAt: "2026-06-01T00:00:00.000Z",
    edits: [],
  },
  validation: UNVALIDATED,
  status: "draft",
  // A human has looked at this one. It is not a precondition for use, and the second fixture
  // deliberately leaves it null to prove that.
  vettedBy: { id: "guide-104", role: "GUIDE" },
  vettedAt: "2026-06-02T00:00:00.000Z",
  revalidatedAt: "2026-06-01T00:00:00.000Z",
};

// ── Fixture 2: making games ──────────────────────────────────────────────────────────────────────
// No syllabus, and that is the honest answer rather than a gap. There is no recognised published
// curriculum for children making games the way ABRSM is one for piano, so this map rests on
// research, on named community consensus, and in two places on nothing but our own reasoning, and
// it says which is which. It takes `W2_NO_SYLLABUS` for it, correctly.

const GODOT_FIRST_2D: Source = {
  authors: "Godot Engine documentation, Your first 2D game",
  year: 2024,
  url: "https://docs.godotengine.org/en/stable/getting_started/first_2d_game/index.html",
};

const PRO_GIT: Source = {
  authors: "Chacon & Straub, Pro Git",
  year: 2014,
  url: "https://git-scm.com/book/en/v2",
};

const GAME_PROGRAMMING_PATTERNS: Source = {
  authors: "Nystrom, Game Programming Patterns",
  year: 2014,
  url: "https://gameprogrammingpatterns.com/",
};

const GLOBAL_GAME_JAM: Source = {
  authors: "Global Game Jam",
  year: 2025,
  url: "https://globalgamejam.org/",
};

const WILSON_2019: Source = {
  authors: "Wilson, Shenhav, Straccia & Cohen",
  year: 2019,
  url: "https://doi.org/10.1038/s41467-019-12552-4",
};

const GODOT_TUTORIAL: CuratedResource = {
  id: "cr-godot-first-2d",
  title: "Godot Engine docs: Your first 2D game",
  url: "https://docs.godotengine.org/en/stable/getting_started/first_2d_game/index.html",
  domainPath: ["code-computers", "game-dev"],
  affordedModes: ["build"],
  reputation: 0.9,
  ageTiers: ["9-11", "12-14"],
  provenance: "curated-library:human-vetted",
};

const PRO_GIT_BOOK: CuratedResource = {
  id: "cr-pro-git",
  title: "Pro Git, free online edition",
  url: "https://git-scm.com/book/en/v2",
  domainPath: ["code-computers", "game-dev"],
  affordedModes: ["build", "collaborate"],
  reputation: 0.92,
  ageTiers: ["12-14"],
  provenance: "curated-library:human-vetted",
};

const PATTERNS_BOOK: CuratedResource = {
  id: "cr-game-programming-patterns",
  title: "Game Programming Patterns, free online edition",
  url: "https://gameprogrammingpatterns.com/",
  domainPath: ["code-computers", "game-dev"],
  affordedModes: ["build", "debug"],
  reputation: 0.89,
  ageTiers: ["12-14"],
  provenance: "curated-library:human-vetted",
};

const GAME_DEV_MILESTONES: readonly Milestone[] = [
  {
    id: "gd-one-screen-game",
    title: "Ship a game someone else can finish",
    capability: "Build a one-screen game and publish the build so another person can finish it",
    requires: [],
    modes: [],
    stageFloor: "S1_IGNITION",
    ordering: {
      reason:
        "Godot's own first tutorial builds one complete small game before it explains any engine " +
        "subsystem, and the people who write engine documentation have largely settled on that " +
        "order.",
      basis: "community",
      sources: [GODOT_FIRST_2D],
      limit:
        "A widely used guide written by an engine's contributors, not a standard any body " +
        "certifies, and it assumes some programming already.",
    },
    resources: [GODOT_TUTORIAL],
    practice: [
      {
        title: "Small enough to finish tonight",
        description:
          "Cut the idea down until it fits one screen and one rule, then build that. Scope is " +
          "the skill being practised here, not the engine.",
        solitary: true,
      },
    ],
    demonstration: "A published one-screen build that another person finished without help",
    opportunities: [],
    authorship: "human-authored",
  },
  {
    id: "gd-reproduce-a-bug",
    title: "Make a bug happen on purpose",
    capability:
      "Reproduce a bug in your own game on demand and publish the fix with a note on the cause",
    requires: ["gd-one-screen-game"],
    modes: [],
    stageFloor: "S1_IGNITION",
    ordering: {
      reason:
        "Somebody who cannot make a fault happen twice cannot tell a fix from a coincidence, so " +
        "this sits before anything larger is built on top of it. We found no published " +
        "curriculum that orders debugging against feature work at this age, so the placement is " +
        "ours.",
      basis: "model",
      sources: [],
    },
    resources: [],
    practice: [
      {
        title: "Write the steps before the fix",
        description:
          "Write down the exact steps that make it break, then fix it, then follow the steps " +
          "again. If it still breaks, the fix was a guess.",
        solitary: true,
      },
    ],
    demonstration:
      "A published fix with a short note naming the cause and the steps that reproduce it",
    opportunities: [],
    authorship: "human-authored",
  },
  {
    id: "gd-playtest",
    title: "Watch someone else play it",
    capability: "Run a playtest with one other person and publish the change list it produced",
    requires: ["gd-reproduce-a-bug"],
    modes: [],
    stageFloor: "S2_FOUNDATIONS",
    ordering: {
      reason:
        "Wilson and colleagues found learning is fastest when the learner gets it right about " +
        "85% of the time, so difficulty is set by watching a real player struggle rather than " +
        "by the maker's own guess, and that means a playtest comes before more content.",
      basis: "research",
      sources: [WILSON_2019],
      limit:
        "The finding is about simple training tasks in a laboratory. Reading it across onto " +
        "game difficulty is our step and not theirs.",
    },
    resources: [],
    practice: [
      {
        title: "Sit on your hands",
        description:
          "Watch someone play without explaining anything. Every sentence you have to say out " +
          "loud is a thing the game should have said itself.",
        solitary: false,
      },
    ],
    demonstration: "A published change list from one playtest, naming where the player got stuck",
    opportunities: [],
    authorship: "human-authored",
  },
  {
    id: "gd-version-control",
    title: "Stop losing your work",
    capability: "Put the game under version control and publish a history with two named commits",
    requires: ["gd-playtest"],
    modes: [],
    stageFloor: "S2_FOUNDATIONS",
    ordering: {
      reason:
        "Every working team in the field keeps its history in version control, and Pro Git is " +
        "the guide most of them hand to newcomers. It comes after there is something worth not " +
        "losing.",
      basis: "community",
      sources: [PRO_GIT],
      limit: "Settled practice rather than anything a standards body certifies.",
    },
    resources: [PRO_GIT_BOOK],
    practice: [
      {
        title: "Commit with a sentence",
        description:
          "Save your work with a message that says what changed and why. Reading your own " +
          "history back later is the whole return on this.",
        solitary: true,
      },
    ],
    demonstration: "A published repository history holding at least two named commits",
    opportunities: [],
    authorship: "human-authored",
  },
  {
    id: "gd-tool-for-makers",
    title: "Make something other makers use",
    capability: "Build a tool another maker uses and publish the tool with its instructions",
    requires: ["gd-version-control"],
    modes: ["build"],
    stageFloor: "S3_AUTHORSHIP",
    ordering: {
      reason:
        "Making something other people build with asks for a different kind of care than making " +
        "something that only has to work once, so it sits after the trunk rather than inside " +
        "it. Nothing published orders it and this is our own reading.",
      basis: "model",
      sources: [],
    },
    resources: [],
    practice: [
      {
        title: "Give it to someone with no instructions, then write them",
        description:
          "Hand the tool over and watch where it is confusing. What you had to explain out loud " +
          "is what the instructions have to say.",
        solitary: false,
      },
    ],
    demonstration: "A published tool with instructions, used by a maker who is not you",
    opportunities: [
      {
        kind: "community",
        description:
          "Engine and framework communities take small tools and plugins from outside " +
          "contributors.",
        readinessNote:
          "Worth offering once someone other than you has used it and it survived. Nobody is " +
          "waiting on it, so there is nothing to be late for.",
        stageFloor: "S3_AUTHORSHIP",
      },
    ],
    authorship: "human-authored",
  },
  {
    id: "gd-jam-entry",
    title: "Make a game with other people, fast",
    capability: "Make a game with a team in one sitting and publish the jam entry",
    requires: ["gd-version-control"],
    modes: ["collaborate"],
    stageFloor: "S3_AUTHORSHIP",
    ordering: {
      reason:
        "Global Game Jam has run the same shape since it started: a fixed short window, a team, " +
        "a theme announced at the start, and a published entry at the end. Working to someone " +
        "else's clock with other people is its own thing and comes after working alone.",
      basis: "community",
      sources: [GLOBAL_GAME_JAM],
      limit:
        "A widely observed convention with no formal standing, and jams reward finishing " +
        "quickly, which is not the only thing worth rewarding.",
    },
    resources: [PRO_GIT_BOOK],
    practice: [
      {
        title: "Decide who owns what before anyone starts",
        description:
          "Split the work out loud at the beginning. Most of what goes wrong in a team is two " +
          "people building the same thing and nobody building a third.",
        solitary: false,
      },
    ],
    demonstration: "A published jam entry built by a team in one sitting",
    opportunities: [
      {
        kind: "competition",
        description:
          "Global Game Jam and the smaller online jams run regularly and accept entries from " +
          "anyone, including teams that do not finish.",
        readinessNote:
          "Worth it once a team can finish something small together. Entering and not " +
          "finishing is a normal outcome and costs nothing.",
        stageFloor: "S3_AUTHORSHIP",
      },
    ],
    authorship: "human-edited",
  },
  {
    id: "gd-profile-a-scene",
    title: "Find out why it is slow",
    capability: "Profile a slow scene and publish the frame times before and after the change",
    requires: ["gd-version-control"],
    modes: ["debug"],
    stageFloor: "S3_AUTHORSHIP",
    ordering: {
      reason:
        "Nystrom puts optimisation after everything else and says to measure before changing " +
        "anything, which is the order the field has settled on: a guess at what is slow is " +
        "usually wrong and always expensive.",
      basis: "community",
      sources: [GAME_PROGRAMMING_PATTERNS],
      limit: "A widely read book by one practitioner, not a standard anyone certifies.",
    },
    resources: [PATTERNS_BOOK],
    practice: [
      {
        title: "Measure, change one thing, measure again",
        description:
          "Take a reading, change exactly one thing, take another reading. Two changes at once " +
          "and you have learned nothing about either.",
        solitary: true,
      },
    ],
    demonstration: "A published note with the frame times for one scene before and after a change",
    opportunities: [],
    authorship: "human-authored",
  },
];

export const GAME_DEV_MAP: MasteryMap = {
  id: "map-game-dev",
  version: 1,
  domainPath: ["code-computers", "game-dev"],
  modes: ["build", "debug", "collaborate"],
  ageBands: ["9-11", "12-14"],
  milestones: GAME_DEV_MILESTONES,
  provenance: {
    model: "hand-authored",
    promptVersion: "none",
    generatedAt: "2026-06-15T00:00:00.000Z",
    edits: [],
  },
  validation: UNVALIDATED,
  status: "draft",
  // Nobody has reviewed this one, and it is just as usable for it. Human review is optional by
  // design: what a map must have is a passing validation record.
  vettedBy: null,
  vettedAt: null,
  revalidatedAt: "2026-06-15T00:00:00.000Z",
};

export const GOLDEN_MAPS: readonly MasteryMap[] = [PIANO_MAP, GAME_DEV_MAP];

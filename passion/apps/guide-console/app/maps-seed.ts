// The console's own mastery-map demo data, seeded here the way every other panel seeds itself
// (console-data.ts holds the roster, family.ts the synthetic guide observations, access.ts the
// opportunity catalog). It used to reach across the package boundary into the engine's
// `src/__fixtures__`, which put test fixtures into the production bundle and coupled what the
// console shows to what the engine's golden test happens to assert on.
//
// SYNTHETIC in the sense that no child appears anywhere. The domain content is not synthetic: the
// syllabus and community claims below name documents anyone can go and read, which is the entire
// point of `basis: "syllabus"`. The `validation` field on each map is a placeholder and says so;
// the panel runs `validateMap` against the pinned review clock and uses what it earns.
//
// THE THIRD MAP IS DELIBERATELY OUT OF DATE. Both of the other two were re-checked well inside
// STALE_AFTER_DAYS of the review clock, so with only those two the freshness path in spec §7 could
// never run and the staleness a guide is supposed to see was unreachable by construction.
//
// THE NAMES CARRY A "CONSOLE_" PREFIX because the engine's own `src/__fixtures__/maps.ts` holds a
// piano map and a game-dev map too, and they are DIFFERENT GRAPHS: different milestones, different
// edges, different orderings. Two exports with one name across a package boundary invite the
// assumption that an ordering pinned in the engine's tests is the ordering the console renders, and
// it is not. The maths map has no namesake and takes the prefix for consistency.
//
// TWO OF THE THREE ARE IN USE. A per-child standing is only read against a map that is published
// and fit to be (see `standingRefusalFor` in maps.ts), so a queue of three drafts would have shown
// a guide no reading at all. The maths map stays a draft AND out of date, which is now two things
// at once a guide can see: no reading against a child, and a refusal to put it into use until the
// resources have been looked at again.
import type { MasteryMap, Milestone, ValidationRecord } from "@gt100k/mastery-map";
import type { Source } from "@gt100k/research";

import {
  CHESSCOM_LESSONS,
  FIDE_LAWS_RES,
  FIDE_RATING_TITLES,
  FIDE_TOURNAMENT_FINDER,
  LICHESS_ENDGAMES,
  LICHESS_STUDIES_MATES,
  LICHESS_TRAINING,
  NOTATION_GUIDE,
  STEP1_WORKBOOK,
  STEP2_WORKBOOK,
  STEP3_WORKBOOK,
  STEP4_WORKBOOK,
  STEP5_WORKBOOK,
  STEP6_WORKBOOK,
} from "./maps-seed-chess-resources.js";

/** The concierge's `CuratedResource`, reached through the engine's own type. The console never
    calls the concierge, so it does not take a dependency on it just to name a shape. */
type CuratedResource = Milestone["resources"][number];

/** Not a result. The panel validates each map itself against the review clock. */
const UNVALIDATED: ValidationRecord = {
  validatedAt: "",
  validatorVersion: "unvalidated",
  errors: [],
  warnings: [],
};

// ── Piano: a domain with a real external syllabus ────────────────────────────────────────────────

const ABRSM_PRACTICAL: Source = {
  authors: "ABRSM, Piano Practical Grades syllabus",
  year: 2025,
  url: "https://www.abrsm.org/en-gb/instruments/piano",
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

const ABRSM_PIANO_PAGE: CuratedResource = {
  id: "cr-abrsm-piano",
  title: "ABRSM: piano exam requirements and syllabus downloads",
  url: "https://www.abrsm.org/en-gb/instruments/piano",
  domainPath: ["music-sound", "instruments"],
  pursuits: ["piano"],
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
  pursuits: ["piano"],
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
  pursuits: ["piano"],
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
        "ABRSM's Initial Grade is assessed on three whole pieces, so a short piece played end to " +
        "end is the first thing the syllabus asks for, before any technical work is examined on " +
        "its own.",
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
        "they exist to make an even pulse and even tone automatic before the repertoire needs them.",
      basis: "syllabus",
      sources: [ABRSM_PRACTICAL, TRINITY_SUPPORTING],
      limit:
        "Both documents are written for exam candidates. Neither claims this is the order every " +
        "learner must take.",
    },
    resources: [ABRSM_PIANO_PAGE, TRINITY_PAGE],
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
    id: "pf-listen-back",
    title: "Hear what you actually played",
    capability: "Review a recording of your own playing and publish a written note of what to fix",
    requires: ["pf-steady-pulse"],
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
    id: "pf-write-your-own",
    title: "Write a piece of your own",
    capability: "Write a short piece of your own and publish the score with a recording of it",
    requires: ["pf-listen-back"],
    modes: ["compose"],
    stageFloor: "S3_AUTHORSHIP",
    ordering: {
      reason:
        "The graded syllabuses will accept a candidate's own composition as the own-choice piece, " +
        "but none of them orders composing against performing, so where this sits is our own call " +
        "and rests on nothing published.",
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
          "Write something short enough to finish and then finish it. An unfinished piece teaches " +
          "nothing that a finished short one does not.",
        solitary: true,
      },
    ],
    // "score" is ordinary domain language here. Error rule 8 bans a FIELD named `score` and never
    // scans a value, which is the distinction the rule exists to make.
    demonstration: "A published score of one original short piece, with a recording",
    opportunities: [
      {
        kind: "showcase",
        description:
          "Local music services, festivals and teacher-run concerts take entries from players at " +
          "this level.",
        readinessNote:
          "Worth entering once a piece holds together in one sitting. There is no schedule " +
          "attached to this and nothing is missed by waiting.",
        stageFloor: "S3_AUTHORSHIP",
      },
    ],
    authorship: "human-authored",
  },
];

export const CONSOLE_PIANO_MAP: MasteryMap = {
  id: "map-piano-console",
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
  // In use, which is what puts a child's reading on the screen underneath it.
  status: "published",
  // A human has looked at this one. It is not a precondition for use, and the second map
  // deliberately leaves it null to prove that.
  vettedBy: { id: "guide-104", role: "GUIDE" },
  vettedAt: "2026-06-02T00:00:00.000Z",
  revalidatedAt: "2026-06-01T00:00:00.000Z",
};

// ── Making games: a domain with no syllabus at all ───────────────────────────────────────────────
// There is no recognised published curriculum for children making games the way ABRSM is one for
// piano, so this map rests on research, on named community consensus, and in one place on nothing
// but our own reasoning, and it says which is which. It takes the no-syllabus warning for it.

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
  pursuits: ["game-jam"],
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
  pursuits: ["game-jam"],
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
  pursuits: ["game-jam"],
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
        "Godot's own first tutorial builds one small game end to end before it explains any " +
        "engine subsystem, and the people who write engine documentation have largely settled on " +
        "that order.",
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
          "Cut the idea down until it fits one screen and one rule, then build that. Scope is the " +
          "skill being practised here, not the engine.",
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
        "this sits before anything larger is built on top of it. We found no published curriculum " +
        "that orders debugging against feature work at this age, so the placement is ours.",
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
        "Wilson and colleagues put the fastest learning at a success rate near eighty-five in " +
        "every hundred attempts, so difficulty is set by watching a real player struggle rather " +
        "than by the maker's own guess, and a playtest therefore comes before more content.",
      basis: "research",
      sources: [WILSON_2019],
      limit:
        "The finding is about simple training tasks in a laboratory. Reading it across onto game " +
        "difficulty is our step and not theirs.",
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
        "Every working team in the field keeps its history in version control, and Pro Git is the " +
        "guide most of them hand to newcomers. It comes after there is something worth not losing.",
      basis: "community",
      sources: [PRO_GIT],
      limit: "Settled practice rather than anything a standards body certifies.",
    },
    resources: [PRO_GIT_BOOK],
    practice: [
      {
        title: "Commit with a sentence",
        description:
          "Save your work with a message that says what changed and why. Reading your own history " +
          "back later is the whole return on this.",
        solitary: true,
      },
    ],
    demonstration: "A published repository history holding at least two named commits",
    opportunities: [],
    authorship: "human-authored",
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
        "anything, which is the order the field has settled on: a guess at what is slow is usually " +
        "wrong and always expensive.",
      basis: "community",
      sources: [GAME_PROGRAMMING_PATTERNS],
      limit: "A widely read book by one practitioner, not a standard anyone certifies.",
    },
    resources: [PATTERNS_BOOK],
    practice: [
      {
        title: "Measure, change one thing, measure again",
        description:
          "Take a reading, change exactly one thing, take another reading. Two changes at once and " +
          "you have learned nothing about either.",
        solitary: true,
      },
    ],
    demonstration: "A published note with the frame times for one scene before and after a change",
    opportunities: [
      {
        kind: "community",
        description:
          "Engine and framework communities take small tools and fixes from outside contributors.",
        readinessNote:
          "Worth offering once someone other than you has used it and it survived. Nobody is " +
          "waiting on it, so there is nothing to be late for.",
        stageFloor: "S3_AUTHORSHIP",
      },
    ],
    authorship: "human-edited",
  },
];

export const CONSOLE_GAME_DEV_MAP: MasteryMap = {
  id: "map-game-dev-console",
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
  // In use with nobody's signature on it, which is the pair of facts this map exists to hold
  // together: human review is optional by design and its absence blocks nothing.
  status: "published",
  // Nobody has reviewed this one, and it is just as usable for it. Human review is optional by
  // design: what a map must have is a passing validation record.
  vettedBy: null,
  vettedAt: null,
  revalidatedAt: "2026-06-15T00:00:00.000Z",
};

// ── Competition maths: a map whose resources are overdue a re-check ──────────────────────────────
// Everything about this map is fine and it is still not fit to put into use, which is the whole
// point of it being here. Resources rot, spec §7 says a map more than STALE_AFTER_DAYS past its
// last re-check is flagged in the review screen, and with only the two maps above that path could
// never run: both of them sit comfortably inside the window.

const MAA_AMC: Source = {
  authors: "Mathematical Association of America, AMC competition information",
  year: 2025,
  url: "https://maa.org/student-programs/amc/",
};

const AOPS: Source = {
  authors: "Art of Problem Solving, introductory subject curriculum",
  year: 2025,
  url: "https://artofproblemsolving.com/store",
};

const AMC_PAPERS: CuratedResource = {
  id: "cr-amc-papers",
  title: "MAA: past AMC papers and answer keys",
  url: "https://maa.org/student-programs/amc/",
  domainPath: ["math-puzzles", "competition-math"],
  pursuits: ["competition-maths"],
  affordedModes: ["investigate"],
  reputation: 0.94,
  ageTiers: ["9-11", "12-14"],
  provenance: "curated-library:human-vetted",
};

const AOPS_LIBRARY: CuratedResource = {
  id: "cr-aops-library",
  title: "Art of Problem Solving: introductory subject books",
  url: "https://artofproblemsolving.com/store",
  domainPath: ["math-puzzles", "competition-math"],
  pursuits: ["competition-maths"],
  affordedModes: ["investigate", "explain"],
  reputation: 0.9,
  ageTiers: ["9-11", "12-14"],
  provenance: "curated-library:human-vetted",
};

const COMPETITION_MATH_MILESTONES: readonly Milestone[] = [
  {
    id: "cm-first-whole-paper",
    title: "Sit one paper end to end",
    capability: "Sit one past paper end to end and keep the marked script",
    requires: [],
    modes: [],
    stageFloor: "S1_IGNITION",
    ordering: {
      reason:
        "The AMC ladder is built around a fixed paper sat under a fixed time, so sitting one whole " +
        "paper is the first thing it asks for, before any single topic is drilled on its own.",
      basis: "syllabus",
      sources: [MAA_AMC],
    },
    resources: [AMC_PAPERS],
    practice: [
      {
        title: "One paper, one sitting",
        description:
          "Sit the paper in one go with a clock running and mark it yourself afterwards. Stopping " +
          "halfway turns it into a different exercise.",
        solitary: true,
      },
    ],
    demonstration: "A marked script from one past paper sat end to end",
    opportunities: [],
    authorship: "human-authored",
  },
  {
    id: "cm-write-one-solution",
    title: "Write a solution someone else can follow",
    capability: "Write up one solution another student can follow, and publish the write-up",
    requires: ["cm-first-whole-paper"],
    modes: [],
    stageFloor: "S1_IGNITION",
    ordering: {
      reason:
        "Art of Problem Solving's curriculum has students write solutions out rather than only " +
        "reach answers, and that habit is what the community treats as the difference between " +
        "getting a question right and knowing why it is right.",
      basis: "community",
      sources: [AOPS],
      limit: "A widely used curriculum sold by a company, not a standard any body certifies.",
    },
    resources: [AOPS_LIBRARY],
    practice: [
      {
        title: "Hand it to someone and say nothing",
        description:
          "Give the write-up to another student and watch where they stop. Every place you have to " +
          "explain out loud is a line the write-up owes them.",
        solitary: false,
      },
    ],
    demonstration: "A published write-up of one solution another student followed",
    opportunities: [],
    authorship: "human-authored",
  },
  {
    id: "cm-retry-what-broke",
    title: "Go back to what broke",
    capability: "Re-sit the questions you got wrong and publish a list of what changed",
    requires: ["cm-write-one-solution"],
    modes: [],
    stageFloor: "S2_FOUNDATIONS",
    ordering: {
      reason:
        "Going back to the questions that broke, rather than on to new material, is our own call " +
        "about where this sits: we found nothing published that orders re-work against new topics " +
        "at this age.",
      basis: "model",
      sources: [],
    },
    resources: [],
    practice: [
      {
        title: "Second attempt, cold",
        description:
          "Come back to the questions that broke on a later day without looking at the working " +
          "first. A question you can only do with your notes open is one you cannot do yet.",
        solitary: true,
      },
    ],
    demonstration: "A published list of re-sat questions and what changed on the second attempt",
    opportunities: [],
    authorship: "human-authored",
  },
  {
    id: "cm-next-rung",
    title: "Take the next paper up",
    capability: "Sit the next paper up the ladder and keep the marked script beside the first",
    requires: ["cm-retry-what-broke"],
    modes: [],
    stageFloor: "S2_FOUNDATIONS",
    ordering: {
      reason:
        "The AMC ladder is published as a sequence and each rung assumes the one below it, so the " +
        "next paper up the ladder comes after the one below has been sat and marked.",
      basis: "syllabus",
      sources: [MAA_AMC],
      limit:
        "A competition ladder is an ordering of tests, not of everything a young mathematician " +
        "should meet, and plenty of good mathematics sits off it entirely.",
    },
    resources: [AMC_PAPERS],
    practice: [
      {
        title: "Same conditions, harder paper",
        description:
          "Keep the clock and the room the same so the only thing that changed is the paper. Two " +
          "things changing at once tells you nothing about either.",
        solitary: true,
      },
    ],
    demonstration: "A marked script from the next paper up the ladder, kept beside the first",
    opportunities: [],
    authorship: "human-authored",
  },
];

export const CONSOLE_COMPETITION_MATH_MAP: MasteryMap = {
  id: "map-competition-math",
  version: 1,
  domainPath: ["math-puzzles", "competition-math"],
  modes: ["investigate", "explain"],
  ageBands: ["9-11", "12-14"],
  milestones: COMPETITION_MATH_MILESTONES,
  provenance: {
    model: "hand-authored",
    promptVersion: "none",
    generatedAt: "2026-01-10T00:00:00.000Z",
    edits: [],
  },
  validation: UNVALIDATED,
  status: "draft",
  vettedBy: null,
  vettedAt: null,
  // Well past the 90-day mark at the review clock, which is the only reason this map is here.
  revalidatedAt: "2026-01-10T00:00:00.000Z",
};

// ── Chess ────────────────────────────────────────────────────────────────────────────────────────
//
// THE FIRST MAP AUTHORED UNDER `docs/decisions/2026-07-30-mastery-scaffold.md`, and the one the
// method was derived from. Chess is the most favourable domain that exists for this: a federation, a
// numeric rating, and a published curriculum in institutional use. That is why it goes first, and
// also why a second map in a domain with none of those has to follow before we claim the structure
// generalises.
//
// THE SPINE IS THE STEPS METHOD (Stappenmethode), Brunia and van Wijgerden, 1987, six manuals and
// twenty-six workbooks, in use in a dozen countries. Ten of the twelve milestones below can name a
// numbered lesson in a purchasable curriculum, which is as strong as `syllabus` basis gets. The
// ordering is the publisher's, not ours, including the counter-intuitive parts: mate is deliberately
// postponed inside Step 1, endgames do not appear until Step 3, and "thinking ahead" is introduced
// only at Step 3 after two full steps of pattern loading.
//
// WHAT WE DO NOT CLAIM. The publisher's rating bands are its own, with no stated validation method
// and no note of whether they mean over-the-board or online. And the whole six-step course tops out
// at a claimed 2100 — below the lowest FIDE title. The people who wrote the world's leading
// children's chess curriculum say of Step 5 that "the percentage of students who reach step 5 level
// is not high". Any copy implying grandmaster is a normal destination would be a lie told to a
// child; see the last milestone's `limit`.

const STEPS_METHOD: Source = {
  authors: "Brunia & van Wijgerden, the Steps Method (Stappenmethode), manuals 1-6",
  year: 2025,
  url: "https://www.stappenmethode.nl/en/",
};

const FIDE_HANDBOOK: Source = {
  authors: "FIDE Handbook B.01, title regulations",
  year: 2024,
  url: "https://handbook.fide.com/chapter/B012024",
};

const FIDE_LAWS: Source = {
  authors: "FIDE Laws of Chess, Article 8 and Appendix C",
  year: 2023,
  url: "https://handbook.fide.com/chapter/E012023",
};

const US_CHESS_RATINGS: Source = {
  authors: "US Chess, rating classes and the National Master title",
  year: 2026,
  url: "https://new.uschess.org/",
};

const CHASE_SIMON: Source = {
  authors: "Chase & Simon, 'Perception in chess', Cognitive Psychology 4(1)",
  year: 1973,
  url: "https://doi.org/10.1016/0010-0285(73)90004-2",
};

// Learning-by-teaching: the basis for the explain branch's one milestone. Both sources were
// resolved live through their DOI on 2026-08-01 (Fiorella & Mayer to ScienceDirect pii
// S0361476X13000209; Chase et al. to Springer's article page), so these are not guessed citations.
const FIORELLA_MAYER: Source = {
  authors:
    "Fiorella & Mayer, 'The relative benefits of learning by teaching and teaching " +
    "expectancy', Contemporary Educational Psychology 38(4)",
  year: 2013,
  url: "https://doi.org/10.1016/j.cedpsych.2013.06.001",
};

const PROTEGE_EFFECT: Source = {
  authors:
    "Chase, Chin, Oppezzo & Schwartz, 'Teachable agents and the protégé effect: " +
    "increasing the effort towards learning', Journal of Science Education and Technology 18(4)",
  year: 2009,
  url: "https://doi.org/10.1007/s10956-009-9180-4",
};

const CHESS_MILESTONES: readonly Milestone[] = [
  {
    id: "ch-whole-game",
    title: "You can play a whole game",
    capability: "Play a legal game start to finish, including castling, en passant and a draw",
    requires: [],
    modes: [],
    stageFloor: "S1_IGNITION",
    ordering: {
      reason:
        "Step 1 puts every rule of play in one place and in one order, and nothing else in the " +
        "curriculum begins until a child can get to the end of a game without an adult correcting " +
        "the board.",
      basis: "syllabus",
      sources: [STEPS_METHOD],
      limit: "The publisher recommends Step 1 from age 8; younger children use Stepping Stones.",
    },
    resources: [STEP1_WORKBOOK, FIDE_LAWS_RES],
    practice: [
      {
        title: "Finish every game you start",
        description:
          "Play to the end, including the boring ones. Resigning early is the habit that stops a " +
          "child ever learning what a won position turns into.",
        solitary: false,
      },
    ],
    demonstration: "A finished game with no illegal moves and an agreed result",
    opportunities: [],
    authorship: "human-authored",
  },
  {
    id: "ch-opening-principles",
    title: "You open with principles, not a memorized line",
    capability:
      "Develop every piece toward the center in the opening, without relying on a memorized line",
    requires: ["ch-whole-game"],
    modes: [],
    stageFloor: "S1_IGNITION",
    ordering: {
      reason:
        "Step 3's own manual gives the opening two dedicated lessons, 'Completing the opening' and " +
        "'The opening', after Step 2's plus workbook gives it a first, lighter touch. Across all six " +
        "steps the curriculum never assigns a lesson to a single named opening; whatever repertoire " +
        "a child eventually wants is exactly the kind of material Step 6 hands the independent " +
        "learner to go and choose for themselves.",
      basis: "syllabus",
      sources: [STEPS_METHOD],
      limit:
        "The Steps Method teaches opening PRINCIPLES at Steps 2 and 3 and never assigns a lesson to " +
        "a named opening or repertoire at any step. 'Principles before repertoire' describes what " +
        "the six-step ladder actually contains rather than a sequencing the publisher states " +
        "outright.",
    },
    resources: [STEP2_WORKBOOK, STEP3_WORKBOOK, CHESSCOM_LESSONS],
    practice: [
      {
        title: "Same principles, different replies",
        description:
          "Open toward the center and get every piece developed against whatever your opponent " +
          "plays, rather than freezing when the position doesn't match a line you memorized.",
        solitary: false,
      },
    ],
    demonstration:
      "A handful of your own opening sequences, each explained by the principle behind it rather " +
      "than by a named opening",
    opportunities: [],
    authorship: "human-authored",
  },
  {
    id: "ch-finish-a-won-game",
    title: "You can finish a won game",
    capability: "Force mate with a queen or a rook, and win material with a fork or an exchange",
    requires: ["ch-whole-game"],
    modes: [],
    stageFloor: "S1_IGNITION",
    ordering: {
      reason:
        "Mate comes near the END of Step 1, not the start, and mating with the rook waits until " +
        "Step 2. The publisher says outright that 'learning how to mate is postponed as long as " +
        "possible' and that this 'sounds astonishing and even incredible' but works.",
      basis: "syllabus",
      sources: [STEPS_METHOD],
    },
    resources: [STEP1_WORKBOOK, STEP2_WORKBOOK, LICHESS_STUDIES_MATES],
    practice: [
      {
        title: "Mate against a bare king, on a clock",
        description:
          "Set up a queen or a rook against a lone king and force mate. Repeat it until it stops " +
          "being a puzzle and becomes something your hands already know.",
        solitary: true,
      },
    ],
    demonstration: "A page of solved positions, forcing mate with a queen and with a rook",
    opportunities: [],
    authorship: "human-authored",
  },
  {
    id: "ch-write-it-down",
    title: "You can write your game down",
    capability: "Record both sides' moves in algebraic notation, legibly, for a whole game",
    requires: ["ch-whole-game"],
    modes: [],
    stageFloor: "S1_IGNITION",
    ordering: {
      reason:
        "The last lesson of Step 1, and the gateway to everything after it: a game nobody wrote " +
        "down cannot be reviewed, annotated or entered anywhere. FIDE requires it of every player " +
        "in every rated game.",
      basis: "syllabus",
      sources: [STEPS_METHOD, FIDE_LAWS],
    },
    resources: [STEP1_WORKBOOK, NOTATION_GUIDE],
    practice: [
      {
        title: "Notate while you play",
        description:
          "Write each move as you make it, not afterwards from memory. The point is that the " +
          "record survives the game, and a reconstruction is not a record.",
        solitary: false,
      },
    ],
    demonstration: "A legible scoresheet for a whole game, both sides recorded",
    opportunities: [],
    authorship: "human-authored",
  },
  {
    id: "ch-see-the-tactic",
    title: "You see the tactic",
    capability: "Find and play forks, pins, discovered attacks and mate in two",
    requires: ["ch-finish-a-won-game", "ch-write-it-down"],
    modes: [],
    stageFloor: "S1_IGNITION",
    ordering: {
      reason:
        "Step 2 is where the curriculum concentrates almost everything, on the publisher's own " +
        "stated grounds that 'at this level all games are decided by tactics'. It claims a ceiling " +
        "around 1400, which is most of the distance an ordinary club player ever travels.",
      basis: "syllabus",
      sources: [STEPS_METHOD],
    },
    resources: [STEP2_WORKBOOK, LICHESS_TRAINING, CHESSCOM_LESSONS],
    practice: [
      {
        title: "Tactics you get wrong, again",
        description:
          "Work a themed set, then go back only to the ones you missed. Repeating the ones you " +
          "already solve is the comfortable version of this and it teaches nothing.",
        solitary: true,
      },
    ],
    demonstration: "A worked page of forks and pins, solutions written out rather than answers",
    opportunities: [
      {
        kind: "competition",
        description:
          "A free online arena on Lichess or Chess.com — no rating floor, opponents matched " +
          "automatically",
        readinessNote:
          "Ready as soon as forks and pins get spotted without a hint. Losing on time in an " +
          "arena is part of the format, not a signal to stop.",
        stageFloor: "S1_IGNITION",
      },
    ],
    authorship: "human-authored",
  },
  {
    id: "ch-king-safety",
    title: "You keep your king safe",
    capability:
      "Castle at the right moment, and recognize when a king is already too exposed to castle " +
      "into safety",
    requires: ["ch-opening-principles"],
    modes: [],
    stageFloor: "S2_FOUNDATIONS",
    ordering: {
      reason:
        "Castling itself is Step 1's lesson 9, taught as a rule everyone needs to finish a legal " +
        "game. Weighing king safety as a JUDGMENT — when to castle, and when a king is already too " +
        "exposed for castling to fix it — is opening-principle territory the curriculum places at " +
        "Steps 2 and 3, so this follows opening principles rather than the rules milestone directly. " +
        "FIDE's laws set the legality a castling move has to meet, which this milestone tests " +
        "directly.",
      basis: "syllabus",
      sources: [STEPS_METHOD, FIDE_LAWS],
    },
    resources: [STEP1_WORKBOOK, FIDE_LAWS_RES, CHESSCOM_LESSONS],
    practice: [
      {
        title: "Castle early, or say why not",
        description:
          "Play games where you decide whether and when to castle, and if you skip it, say out " +
          "loud what king-safety problem you accepted instead.",
        solitary: false,
      },
    ],
    demonstration:
      "A few games with the castling decision, when or a stated reason not to, marked and explained",
    opportunities: [],
    authorship: "human-authored",
  },
  {
    id: "ch-real-tournament-game",
    title: "You can play a real tournament game",
    capability: "Play under a clock with touch-move and a scoresheet, and sit through a long game",
    requires: ["ch-write-it-down", "ch-see-the-tactic"],
    modes: ["perform"],
    stageFloor: "S2_FOUNDATIONS",
    ordering: {
      reason:
        "The playing rules sit in Step 2's extension work and competitive formats are a Step 3 " +
        "article, so the curriculum places real competition after tactics rather than before.",
      basis: "syllabus",
      sources: [STEPS_METHOD, FIDE_LAWS],
      limit:
        "The content here is FIDE's rulebook rather than a progression syllabus; only the " +
        "PLACEMENT comes from the Steps Method. It is a weaker claim than the milestones around it.",
    },
    resources: [STEP2_WORKBOOK, STEP3_WORKBOOK, FIDE_LAWS_RES],
    practice: [
      {
        title: "Long games, not blitz",
        description:
          "A slow game with a scoresheet is a different skill from fast online play, and it is " +
          "the one every rated event is made of.",
        solitary: false,
      },
    ],
    demonstration: "A scoresheet from a played tournament game, win or lose",
    opportunities: [
      {
        kind: "competition",
        description: "A local rated tournament or a club's internal ladder",
        readinessNote:
          "Ready when a whole game can be played to the end under a clock without help. A first " +
          "rating is usually low and that is what a first rating is for.",
        stageFloor: "S2_FOUNDATIONS",
      },
      {
        kind: "community",
        description: "A scholastic (school-team or grade-level) tournament",
        readinessNote:
          "Ready under the same bar as a club tournament: a finished game under a clock, " +
          "scoresheet included. Scholastic sections are usually the gentlest entry, not a harder " +
          "one.",
        stageFloor: "S2_FOUNDATIONS",
      },
    ],
    authorship: "human-authored",
  },
  {
    id: "ch-visualize",
    title: "You can see the board without moving anything",
    capability:
      "Picture which squares a piece already attacks and hold a short sequence in your head with " +
      "the board covered",
    requires: ["ch-see-the-tactic"],
    modes: [],
    stageFloor: "S2_FOUNDATIONS",
    ordering: {
      reason:
        "Step 1's plus workbook names 'Board vision' as its own numbered lesson, taught through " +
        "route-planner exercises (giving check, going to the right square, trapping, capturing all " +
        "pieces) that drill exactly this: tracking what a piece already attacks without moving it. " +
        "That lesson sits inside Step 1, well before Step 3 introduces 'thinking ahead' as a " +
        "distinct calculation skill, which is what makes this rung checkable against the syllabus " +
        "and puts it ahead of ch-see-ahead, for the reason that milestone's own limit already " +
        "gives: a search needs something already retrievable to search with.",
      basis: "syllabus",
      sources: [STEPS_METHOD],
      limit:
        "Step 1's Board vision lesson is real syllabus content, but the Steps Method's own stated " +
        "view is that gameplay, not this isolated drill, does most of the work of building it: " +
        "'The best method for the improvement of children's board vision is to let them play " +
        "games,' with one child needing perhaps 300 games and another 1000. Treat this rung as the " +
        "syllabus's named checkpoint for the skill, not its primary teaching vehicle.",
    },
    resources: [STEP1_WORKBOOK, STEP3_WORKBOOK, LICHESS_TRAINING],
    practice: [
      {
        title: "Call it before you look",
        description:
          "Look at a position, then look away, and say what a piece attacks or where a short " +
          "sequence lands before checking the board. Getting it wrong here is safe; getting it " +
          "wrong mid-game is not.",
        solitary: true,
      },
    ],
    demonstration:
      "A written log of squares or landing positions called before the board was checked, right " +
      "and wrong both kept",
    opportunities: [],
    authorship: "human-authored",
  },
  {
    id: "ch-see-ahead",
    title: "You can see ahead without touching the pieces",
    capability: "Calculate a short forced line in your head and picture the position it reaches",
    requires: ["ch-see-the-tactic", "ch-visualize"],
    modes: [],
    stageFloor: "S2_FOUNDATIONS",
    ordering: {
      reason:
        "Step 3 introduces 'thinking ahead' as a named skill only after two full steps of pattern " +
        "work, arguing that themes have to be retrievable from memory before working memory is " +
        "free to search.",
      basis: "syllabus",
      sources: [STEPS_METHOD],
      limit:
        "The placement is the curriculum's. That pattern knowledge must therefore PRECEDE " +
        "calculation is our reading of Chase & Simon alongside it, and neither source says it: " +
        "their finding is that masters lose nearly all their recall advantage on random positions, " +
        "which is about what expertise is made of rather than about what to teach first.",
    },
    resources: [STEP3_WORKBOOK, LICHESS_TRAINING],
    practice: [
      {
        title: "Solve without moving anything",
        description:
          "Work the position in your head and only then play it out. Sliding the pieces first " +
          "turns calculation into trial and error.",
        solitary: true,
      },
    ],
    demonstration: "A thinking-ahead set with each line written down before the pieces moved",
    opportunities: [],
    authorship: "human-authored",
  },
  {
    id: "ch-first-endgames",
    title: "You know your first endgames",
    capability:
      "Use the square of the pawn, key squares and opposition, and know a won pawn ending",
    requires: ["ch-see-ahead"],
    modes: [],
    stageFloor: "S2_FOUNDATIONS",
    ordering: {
      reason:
        "The first real endgame theory arrives at Step 3, not Step 1. This contradicts the most " +
        "repeated piece of chess advice there is, and the contradiction is deliberate: 'endgames " +
        "first' traces to a Capablanca lecture from 1932 and no study supports it, while the " +
        "leading curriculum places tactics first and endgames third.",
      basis: "syllabus",
      sources: [STEPS_METHOD],
    },
    resources: [STEP3_WORKBOOK, LICHESS_ENDGAMES],
    practice: [
      {
        title: "Play the ending out against someone",
        description:
          "Set up the position and play it from both sides. Knowing the rule and converting it " +
          "under resistance are different things.",
        solitary: false,
      },
    ],
    demonstration: "A worked set of pawn endings with the winning method written out",
    opportunities: [
      {
        kind: "community",
        description: "A weekly chess club meeting — regular opponents rather than a one-off event",
        readinessNote:
          "Ready once a won pawn ending gets converted under a clock against a person, not just " +
          "on a diagram.",
        stageFloor: "S2_FOUNDATIONS",
      },
    ],
    authorship: "human-authored",
  },
  {
    id: "ch-prepare-a-tactic",
    title: "You can prepare a tactic",
    capability: "Play the quiet move that makes a combination work: luring, blocking, clearing",
    requires: ["ch-first-endgames"],
    modes: [],
    stageFloor: "S3_AUTHORSHIP",
    ordering: {
      reason:
        "Step 4 is defined by the preparatory move, and the publisher notes solutions get about " +
        "half a move deeper here. It follows Step 3 because you cannot prepare a pattern you " +
        "cannot yet see.",
      basis: "syllabus",
      sources: [STEPS_METHOD],
    },
    resources: [STEP4_WORKBOOK, LICHESS_TRAINING],
    practice: [
      {
        title: "Find the move before the move",
        description:
          "Work sets where the combination does not work yet. The answer is what has to happen " +
          "first, which is a different search from spotting a fork.",
        solitary: true,
      },
    ],
    demonstration: "Solved Step 4 positions with the preparatory move identified and explained",
    opportunities: [],
    authorship: "human-authored",
  },
  {
    id: "ch-play-without-a-target",
    title: "You can play without a target",
    capability:
      "Improve a position when nothing is hanging: weak pawns, open files, a strong square",
    requires: ["ch-prepare-a-tactic"],
    modes: ["investigate"],
    stageFloor: "S3_AUTHORSHIP",
    ordering: {
      reason:
        "Positional lessons are seeded through Step 4 and become the backbone of Step 5, after " +
        "tactics are secure. Step 5 is the last step the publisher teaches in groups.",
      basis: "syllabus",
      sources: [STEPS_METHOD],
    },
    resources: [STEP4_WORKBOOK, STEP5_WORKBOOK, CHESSCOM_LESSONS],
    practice: [
      {
        title: "Say what the position needs",
        description:
          "Before choosing a move, write one sentence about what is wrong with your position. " +
          "The sentence is the skill; the move follows from it.",
        solitary: true,
      },
    ],
    demonstration:
      "An annotated game naming what the position needed before the moves that answered it",
    opportunities: [
      {
        kind: "showcase",
        description: "A club demo night or a public annotated-game post, sharing your own analysis",
        readinessNote:
          "Ready once the one-sentence diagnosis of a position is your own words, not a " +
          "memorized template. A showcase is for the reasoning, not just the result.",
        stageFloor: "S3_AUTHORSHIP",
      },
    ],
    authorship: "human-authored",
  },
  {
    id: "ch-convert",
    title: "You can convert",
    capability: "Win a won endgame and defend a bad one: rook endings, pawn races, breakthrough",
    requires: ["ch-play-without-a-target"],
    modes: ["investigate"],
    stageFloor: "S3_AUTHORSHIP",
    ordering: {
      reason:
        "Steps 5 and 6 shift their weight to endgame technique, and Step 6 says endgame study is " +
        "particularly important for playing strength at this level.",
      basis: "syllabus",
      sources: [STEPS_METHOD],
    },
    resources: [STEP5_WORKBOOK, STEP6_WORKBOOK, LICHESS_ENDGAMES],
    practice: [
      {
        title: "The ending you lost, replayed",
        description:
          "Take an endgame you failed to convert and play it against someone until you can. Your " +
          "own losses are a better set than any book's, because you already care about them.",
        solitary: false,
      },
    ],
    demonstration: "A converted endgame with the critical decision annotated by you",
    opportunities: [],
    authorship: "human-authored",
  },
  {
    id: "ch-study-your-games",
    title: "You review your own games for what actually lost them",
    capability:
      "Find the one move that actually lost a game of yours, working it out on your own " +
      "before running an engine",
    requires: ["ch-real-tournament-game"],
    modes: ["investigate"],
    stageFloor: "S3_AUTHORSHIP",
    ordering: {
      reason:
        "The Step 6 manual lists this among what 'a good trainer has been insisting on' " +
        "throughout all six steps: 'discussion / analysis of the games you played'. Step 6 states " +
        "it as an instruction to the learner directly: 'Get used to analysing all " +
        "your games. With a good trainer, with a stronger player or on your own.' Doing so needs a " +
        "played game to look at, so it follows real tournament play rather than any earlier step.",
      basis: "syllabus",
      sources: [STEPS_METHOD],
      limit:
        "This habit runs through all six steps under a trainer; Step 6 is where the manual hands " +
        "it to the learner to do 'on your own'. The manual does not gate it behind tournament play " +
        "specifically; requiring ch-real-tournament-game first is our own sequencing, since a game " +
        "worth reviewing has to exist. It sits well before ch-teach-yourself (S4): reviewing a game " +
        "you already played needs no chosen study material, which is the separate thing that " +
        "milestone covers.",
    },
    resources: [STEP6_WORKBOOK, CHESSCOM_LESSONS],
    practice: [
      {
        title: "Your own view, before the engine's",
        description:
          "Go through a game you lost on a real board, deciding on your own where it turned, " +
          "before you touch an engine or a book. Checking your view against a tool teaches " +
          "something; skipping straight to the tool teaches nothing.",
        solitary: true,
      },
    ],
    demonstration:
      "A game you lost, annotated in your own words at the move you now think it turned, written " +
      "before you ran an engine",
    opportunities: [],
    authorship: "human-authored",
  },
  {
    id: "ch-teach-yourself",
    title: "You can teach yourself",
    capability: "Choose your own material and improve without a coach in the room",
    requires: ["ch-convert"],
    modes: [],
    stageFloor: "S4_SIGNATURE",
    ordering: {
      reason:
        "Step 6 is the point where the curriculum itself hands over: the publisher describes it " +
        "not as a trainer's manual but as 'a self-study manual... for the independent learner'.",
      basis: "syllabus",
      sources: [STEPS_METHOD],
      limit:
        "A tempting second leg is Charness et al. (2005), who found solitary study the strongest " +
        "predictor of rating. We do not lean on it: Howard (2011) followed 533 players over seven " +
        "years and found the opposite, with games played dominating and study 'a weak factor at " +
        "best'. The syllabus leg stands on its own; the research is contested and is not settled.",
    },
    resources: [STEP6_WORKBOOK, CHESSCOM_LESSONS],
    practice: [
      {
        title: "Your own review, on your own schedule",
        description:
          "Go through your games alone and decide what to work on next. Nobody hands a strong " +
          "player their plan, and the deciding is most of the skill.",
        solitary: true,
      },
    ],
    demonstration: "Your own study plan naming the material you chose, and the games behind it",
    opportunities: [
      {
        kind: "mentorship",
        description:
          "Periodic review with a stronger player or coach — a second set of eyes on material " +
          "you chose yourself, not daily instruction",
        readinessNote:
          "Ready once you already have a study plan to bring to the session. A mentor here is " +
          "reviewing your judgment, not replacing it.",
        stageFloor: "S4_SIGNATURE",
      },
    ],
    authorship: "human-authored",
  },
  {
    id: "ch-rating-that-means-something",
    title: "You have a rating that means something",
    capability: "Hold a published federation rating that places you in a named class",
    requires: ["ch-real-tournament-game", "ch-teach-yourself"],
    modes: ["perform"],
    stageFloor: "S4_SIGNATURE",
    ordering: {
      reason:
        "The one rung nobody has to take your word for. Rating classes and title floors are " +
        "defined and published by federations, and a stranger can look yours up.",
      basis: "syllabus",
      sources: [US_CHESS_RATINGS, FIDE_HANDBOOK],
      limit:
        "READ THIS BEFORE SAYING ANYTHING TO A FAMILY ABOUT TITLES. Working all six Steps end to " +
        "end claims a ceiling of about 2100 — below Candidate Master at 2200 and below US Chess " +
        "National Master, and the publisher says of Step 5 that 'the percentage of students who " +
        "reach step 5 level is not high'. US Chess reports under 1% of its rated players hold " +
        "National Master. Grandmaster needs 2500 plus three norms: the youngest ever, at 12 years " +
        "4 months, got there on years of daily private coaching and norm tournaments abroad, with " +
        "family spending over $200,000. Class A to Expert is an excellent and uncommon outcome for " +
        "a child who starts at eight and works hard. Titles are a different undertaking.",
    },
    resources: [FIDE_RATING_TITLES, FIDE_TOURNAMENT_FINDER, LICHESS_TRAINING],
    practice: [
      {
        title: "Rated games, regularly",
        description:
          "A rating only means something if it is fed. Play rated games often enough that the " +
          "number is about how you play now rather than how you played a year ago.",
        solitary: false,
      },
    ],
    demonstration: "A published federation rating and the games behind it",
    opportunities: [
      {
        kind: "competition",
        description: "Federation-rated open events, and age-group national championships",
        readinessNote:
          "Ready when losing a rated game is information rather than a catastrophe. Entering " +
          "before that is how a child learns to dread the thing they liked.",
        // stageFloor is intentionally below the milestone's: you enter rated events (S3) to EARN
        // the rating, before it "means something" (S4).
        stageFloor: "S3_AUTHORSHIP",
      },
      {
        kind: "competition",
        description:
          "Each published rating-class threshold itself — Class C, B, A, Expert, Candidate " +
          "Master — a checkpoint a stranger can verify without taking your word for it",
        readinessNote:
          "Ready the moment a federation rating exists at all; each class is a milestone within " +
          "the milestone, not a separate bar to clear first.",
        stageFloor: "S4_SIGNATURE",
      },
    ],
    authorship: "human-authored",
  },
  {
    id: "ch-teach-a-beginner",
    title: "You can teach a beginner",
    capability:
      "Teach a beginner one tactic in a short lesson, so they can then find it themselves",
    requires: ["ch-see-the-tactic"],
    modes: ["explain"],
    stageFloor: "S3_AUTHORSHIP",
    ordering: {
      reason:
        "Fiorella & Mayer found that students who actually taught material (rather than just " +
        "expecting to teach it) learned it more durably, with the gain still showing up a week " +
        "later. Chase et al.'s 'protégé effect' is the reason it works for a child specifically: " +
        "students try harder for a learner they are responsible for than they do for themselves, " +
        "an effect that showed up most for lower-achieving students. Both studies are about " +
        "explaining what you already hold, so this sits after ch-see-the-tactic rather than " +
        "alongside it: a child needs a tactic worth teaching before teaching it can do anything.",
      basis: "research",
      sources: [FIORELLA_MAYER, PROTEGE_EFFECT],
      limit:
        "Neither study is about chess. Fiorella & Mayer taught undergraduates a text passage, and " +
        "Chase et al.'s protégé effect ran on 5th-graders teaching a virtual agent about " +
        "ecosystems. That a tactic taught to a real beginner produces the same durable gain is our " +
        "extension of their finding to this domain, not a claim either paper makes.",
    },
    resources: [STEP2_WORKBOOK, CHESSCOM_LESSONS, LICHESS_STUDIES_MATES],
    practice: [
      {
        title: "Teach it before you explain it to yourself",
        description:
          "Find a genuine beginner — a younger sibling, a new club member, anyone who does not yet " +
          "see the pattern — and walk them through one tactic until they can find it on their own. " +
          "Rehearsing the explanation alone is teaching expectancy; a real learner in front of you " +
          "is the part the research says actually moves the needle.",
        solitary: false,
      },
    ],
    demonstration: "A short lesson you gave, and what the learner could do after",
    opportunities: [],
    authorship: "human-authored",
  },
];

export const CONSOLE_CHESS_MAP: MasteryMap = {
  id: "map-chess-console",
  version: 1,
  domainPath: ["games-strategy", "chess"],
  modes: ["perform", "investigate", "explain"],
  ageBands: ["6-8", "9-11", "12-14"],
  milestones: CHESS_MILESTONES,
  provenance: {
    model: "hand-authored",
    promptVersion: "none",
    generatedAt: "2026-07-31T00:00:00.000Z",
    edits: [],
  },
  validation: UNVALIDATED,
  status: "published",
  vettedBy: null,
  vettedAt: null,
  revalidatedAt: "2026-07-31T00:00:00.000Z",
};

/** The review queue the Maps tab shows. */
export const REVIEW_MAPS: readonly MasteryMap[] = [
  CONSOLE_PIANO_MAP,
  CONSOLE_GAME_DEV_MAP,
  CONSOLE_COMPETITION_MATH_MAP,
  CONSOLE_CHESS_MAP,
];

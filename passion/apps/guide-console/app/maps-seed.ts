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

/** The review queue the Maps tab shows. */
export const REVIEW_MAPS: readonly MasteryMap[] = [
  CONSOLE_PIANO_MAP,
  CONSOLE_GAME_DEV_MAP,
  CONSOLE_COMPETITION_MATH_MAP,
];

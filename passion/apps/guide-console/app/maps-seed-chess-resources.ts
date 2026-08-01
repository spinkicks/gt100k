/**
 * The vetted chess resource library: real, hand-checked links the chess mastery map's milestones
 * point at (wiring lands in a later task). Every URL here was fetched and read before it was
 * written in — see the task-1 report alongside this file's originating brief for the verification
 * record. Nothing here is invented, and nothing points at a domain that does not match its title.
 *
 * TWO NAMES DEVIATE FROM THE ORIGINAL BRIEF. The brief asked for `USCHESS_RATINGS_CLASSES` and
 * `USCHESS_TOURNAMENT_FINDER`. Every `uschess.org` and `new.uschess.org` URL tried (ratings pages,
 * the tournament/TLA search, even the bare homepage) returned HTTP 403 from Cloudflare's bot
 * challenge, consistently, across both the fetch tool and a plain `curl` from this sandbox — not a
 * 404, not a mismatch, a wall this environment cannot get past. Rather than write in a URL nobody
 * verified, or fabricate one, the same two roles are filled by FIDE pages that verified live and
 * cover the same ground: `FIDE_RATING_TITLES` (title/rating thresholds, B.01) stands in for the
 * ratings-class page, and `FIDE_TOURNAMENT_FINDER` (the FIDE events calendar) stands in for the
 * tournament finder. Whoever wires Task 2 should re-attempt the US Chess URLs from a network that
 * can clear the challenge; if US Chess pages become reachable, they are the better fit for a
 * US-specific milestone and these two FIDE entries can stay as the international alternative.
 *
 * `LICHESS_STUDIES_MATES` also does not point at a `lichess.org/study` URL: the generic studies
 * index is a list of user-submitted studies with nothing dedicated to mating patterns, so this
 * points at Lichess's own official Practice module for checkmate patterns instead — same domain,
 * same subject, a more specific and more official page than the one first proposed.
 */
import type { Milestone } from "@gt100k/mastery-map";

/** The concierge's `CuratedResource`, reached through the engine's own type — see maps-seed.ts's
    header for why this file does not import `@gt100k/concierge` just to name a shape. */
type CuratedResource = Milestone["resources"][number];

const PROVENANCE = "curated-library:human-vetted" as const;

// ── The Steps Method: the syllabus itself, step by step ──────────────────────────────────────────
// stappenmethode.nl/en/ is the publisher's own site (Rob Brunia & Cor van Wijgerden). Step 1 is
// recommended from age 8-9 by the publisher but is also the entry point for the whole ladder, so it
// is tagged for every tier; Steps 5 and 6 are explicitly the ones "not high" percentages of students
// reach and Step 6 is a self-study manual rather than a trainer's manual, so both are tagged for the
// two older tiers only.

export const STEP1_WORKBOOK: CuratedResource = {
  id: "cr-chess-step1-workbook",
  title: "The Steps Method, Step 1: manual and workbooks (rules, board vision, delayed mate)",
  url: "https://www.stappenmethode.nl/en/step1.php",
  domainPath: ["games-strategy", "chess"],
  pursuits: ["chess"],
  affordedModes: ["investigate", "perform"],
  reputation: 0.95,
  ageTiers: ["6-8", "9-11", "12-14"],
  provenance: PROVENANCE,
};

export const STEP2_WORKBOOK: CuratedResource = {
  id: "cr-chess-step2-workbook",
  title: "The Steps Method, Step 2: manual and workbooks (first tactics and positional play)",
  url: "https://www.stappenmethode.nl/en/step2.php",
  domainPath: ["games-strategy", "chess"],
  pursuits: ["chess"],
  affordedModes: ["investigate", "perform"],
  reputation: 0.95,
  ageTiers: ["6-8", "9-11", "12-14"],
  provenance: PROVENANCE,
};

export const STEP3_WORKBOOK: CuratedResource = {
  id: "cr-chess-step3-workbook",
  title: "The Steps Method, Step 3: manual and workbooks (trapping, pawn endgames, thinking ahead)",
  url: "https://www.stappenmethode.nl/en/step3.php",
  domainPath: ["games-strategy", "chess"],
  pursuits: ["chess"],
  affordedModes: ["investigate", "perform"],
  reputation: 0.95,
  ageTiers: ["6-8", "9-11", "12-14"],
  provenance: PROVENANCE,
};

export const STEP4_WORKBOOK: CuratedResource = {
  id: "cr-chess-step4-workbook",
  title: "The Steps Method, Step 4: manual and workbooks (preparatory tactics, deeper endgames)",
  url: "https://www.stappenmethode.nl/en/step4.php",
  domainPath: ["games-strategy", "chess"],
  pursuits: ["chess"],
  affordedModes: ["investigate", "perform"],
  reputation: 0.95,
  ageTiers: ["6-8", "9-11", "12-14"],
  provenance: PROVENANCE,
};

export const STEP5_WORKBOOK: CuratedResource = {
  id: "cr-chess-step5-workbook",
  title: "The Steps Method, Step 5: manual and workbooks (strategy over tactics, planning)",
  url: "https://www.stappenmethode.nl/en/step5.php",
  domainPath: ["games-strategy", "chess"],
  pursuits: ["chess"],
  affordedModes: ["investigate", "perform"],
  reputation: 0.95,
  ageTiers: ["9-11", "12-14"],
  provenance: PROVENANCE,
};

export const STEP6_WORKBOOK: CuratedResource = {
  id: "cr-chess-step6-workbook",
  title: "The Steps Method, Step 6: self-study manual and workbooks (strategy, endgames)",
  url: "https://www.stappenmethode.nl/en/step6.php",
  domainPath: ["games-strategy", "chess"],
  pursuits: ["chess"],
  affordedModes: ["investigate", "perform"],
  reputation: 0.95,
  ageTiers: ["9-11", "12-14"],
  provenance: PROVENANCE,
};

// ── Lichess: free, official, in institutional use ─────────────────────────────────────────────────

export const LICHESS_TRAINING: CuratedResource = {
  id: "cr-chess-lichess-training",
  title: "Lichess: puzzle training, themes and puzzle streak/storm/racer",
  url: "https://lichess.org/training",
  domainPath: ["games-strategy", "chess"],
  pursuits: ["chess"],
  affordedModes: ["perform", "investigate"],
  reputation: 0.9,
  ageTiers: ["6-8", "9-11", "12-14"],
  provenance: PROVENANCE,
};

export const LICHESS_ENDGAMES: CuratedResource = {
  id: "cr-chess-lichess-endgames",
  title: "Lichess Practice: pawn and rook endgame drills (Lucena, Philidor, key squares)",
  url: "https://lichess.org/practice",
  domainPath: ["games-strategy", "chess"],
  pursuits: ["chess"],
  affordedModes: ["perform", "investigate"],
  reputation: 0.9,
  ageTiers: ["9-11", "12-14"],
  provenance: PROVENANCE,
};

export const LICHESS_STUDIES_MATES: CuratedResource = {
  id: "cr-chess-lichess-mates",
  title: "Lichess Practice: checkmate pattern drills (Checkmate Patterns I)",
  url: "https://lichess.org/practice/checkmates/checkmate-patterns-i/fE4k21MW/9rd7XwOw",
  domainPath: ["games-strategy", "chess"],
  pursuits: ["chess"],
  affordedModes: ["perform", "investigate"],
  reputation: 0.9,
  ageTiers: ["6-8", "9-11", "12-14"],
  provenance: PROVENANCE,
};

// ── Chess.com: the other major free platform ─────────────────────────────────────────────────────

export const CHESSCOM_LESSONS: CuratedResource = {
  id: "cr-chess-chesscom-lessons",
  title: "Chess.com Lessons: openings, tactics, endgames, strategy and master-game courses",
  url: "https://www.chess.com/lessons",
  domainPath: ["games-strategy", "chess"],
  pursuits: ["chess"],
  affordedModes: ["investigate", "perform"],
  reputation: 0.85,
  ageTiers: ["6-8", "9-11", "12-14"],
  provenance: PROVENANCE,
};

export const NOTATION_GUIDE: CuratedResource = {
  id: "cr-chess-notation-guide",
  title: "Chess.com: how to read and write algebraic chess notation",
  url: "https://www.chess.com/terms/chess-notation",
  domainPath: ["games-strategy", "chess"],
  pursuits: ["chess"],
  affordedModes: ["investigate"],
  reputation: 0.8,
  ageTiers: ["6-8", "9-11", "12-14"],
  provenance: PROVENANCE,
};

// ── The federations: rules, titles and where a rating actually comes from ──────────────────────────
// See the file header for why the two US Chess-named roles are filled by FIDE pages: every
// uschess.org / new.uschess.org URL tried came back 403 (Cloudflare bot challenge) from this
// sandbox, on every attempt, so nothing on that domain could be verified live.

export const FIDE_LAWS_RES: CuratedResource = {
  id: "cr-chess-fide-laws",
  title: "FIDE Laws of Chess, effective 1 January 2023 (basic and competitive rules, notation)",
  url: "https://handbook.fide.com/chapter/E012023",
  domainPath: ["games-strategy", "chess"],
  pursuits: ["chess"],
  affordedModes: ["investigate", "perform"],
  reputation: 0.9,
  ageTiers: ["6-8", "9-11", "12-14"],
  provenance: PROVENANCE,
};

/** Stands in for a US Chess rating-class page — see the file header. Covers the same ground: the
    rating thresholds a title actually requires (e.g. FM 2300, CM 2200 by rating; GM/IM by norms). */
export const FIDE_RATING_TITLES: CuratedResource = {
  id: "cr-chess-fide-title-regs",
  title: "FIDE Title Regulations, effective 1 January 2024 (rating thresholds for CM, FM, IM, GM)",
  url: "https://handbook.fide.com/chapter/B012024",
  domainPath: ["games-strategy", "chess"],
  pursuits: ["chess"],
  affordedModes: ["perform"],
  reputation: 0.9,
  ageTiers: ["9-11", "12-14"],
  provenance: PROVENANCE,
};

/** Stands in for a US Chess tournament finder — see the file header. FIDE's own searchable calendar
    of international, rated events. */
export const FIDE_TOURNAMENT_FINDER: CuratedResource = {
  id: "cr-chess-fide-calendar",
  title: "FIDE Main Events Calendar: search rated international tournaments by date and country",
  url: "https://calendar.fide.com/",
  domainPath: ["games-strategy", "chess"],
  pursuits: ["chess"],
  affordedModes: ["perform"],
  reputation: 0.9,
  ageTiers: ["9-11", "12-14"],
  provenance: PROVENANCE,
};

/** Every singleton above, in one array — what `maps-seed.ts` and its tests draw on. */
export const CHESS_RESOURCES: readonly CuratedResource[] = [
  STEP1_WORKBOOK,
  STEP2_WORKBOOK,
  STEP3_WORKBOOK,
  STEP4_WORKBOOK,
  STEP5_WORKBOOK,
  STEP6_WORKBOOK,
  LICHESS_TRAINING,
  LICHESS_ENDGAMES,
  LICHESS_STUDIES_MATES,
  CHESSCOM_LESSONS,
  NOTATION_GUIDE,
  FIDE_LAWS_RES,
  FIDE_RATING_TITLES,
  FIDE_TOURNAMENT_FINDER,
];

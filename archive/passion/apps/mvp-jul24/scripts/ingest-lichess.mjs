#!/usr/bin/env node
/**
 * ingest-lichess.mjs — the documented SCALE PATH for the Chess Tactics bank.
 *
 * `src/puzzles/Chess/bank.ts` ships with ~32 hand-composed, chess.js-verified
 * tactics. That's the curated starter set. This script is how you'd grow it
 * into thousands of tactics using the real, CC0-licensed Lichess puzzle
 * database — without ever committing that database (or its ~250MB
 * compressed / ~2GB+ uncompressed CSV) to this public repo.
 *
 * THIS SCRIPT IS NOT RUN IN THIS ENVIRONMENT. It's provided so a future
 * session (with disk budget for a ~250MB download) can run it. It has no
 * side effects until invoked directly, and it isn't imported by any app code.
 *
 * ---------------------------------------------------------------------------
 * 1. Get the data (one-time, outside this repo's git history)
 * ---------------------------------------------------------------------------
 *   curl -O https://database.lichess.org/lichess_db_puzzle.csv.zst
 *
 * That file is CC0 (public domain) — see https://database.lichess.org/#puzzles.
 * Do NOT commit it; keep it outside the repo or in a gitignored scratch dir.
 *
 * ---------------------------------------------------------------------------
 * 2. Stream-decompress it (no new npm dependency needed)
 * ---------------------------------------------------------------------------
 * The file is Zstandard-compressed. Rather than adding a zstd npm package as
 * a project dependency just for a one-off ingestion script, this shells out
 * to the system `zstd` CLI (`brew install zstd` on macOS, `apt install
 * zstd` on Debian/Ubuntu) and reads its stdout as a stream — the ~2GB+
 * decompressed CSV is never fully buffered in memory or written to disk.
 *
 * ---------------------------------------------------------------------------
 * 3. The CSV shape (see database.lichess.org/#puzzles for the authoritative
 *    schema) — one row per puzzle:
 * ---------------------------------------------------------------------------
 *   PuzzleId,FEN,Moves,Rating,RatingDeviation,Popularity,NbPlays,Themes,GameUrl,OpeningTags
 *
 * IMPORTANT gotcha: `FEN` is the position *before* the setup move, and the
 * first move in `Moves` is that setup move (played by the side who is NOT
 * the solver — it's what got them into the puzzle position). The actual
 * puzzle-start position is `FEN` with `Moves[0]` applied; the solver's
 * solution is `Moves.slice(1)`. Getting this off-by-one wrong is the most
 * common Lichess-puzzle-ingestion bug — this script applies it via chess.js
 * itself (see `toStartFenAndSolution` below) rather than hand-rolling FEN
 * mutation, so it can't drift from real chess rules.
 *
 * `Themes` is a space-separated tag list (e.g. "mateIn1 middlegame short" or
 * "fork advantage middlegame"). We use it both to label the tactic and to
 * sample evenly across categories instead of taking the first N rows (which
 * skews toward whatever's most common in the raw dump).
 *
 * ---------------------------------------------------------------------------
 * 4. Usage (once you have the .zst file)
 * ---------------------------------------------------------------------------
 *   node scripts/ingest-lichess.mjs /path/to/lichess_db_puzzle.csv.zst \
 *     --per-bucket 25 \
 *     --out src/puzzles/Chess/bank.generated.json
 *
 * This samples up to `--per-bucket` puzzles from each (rating band × theme)
 * bucket below, verifies every single one with chess.js (same rule as
 * `bank.test.ts`: legal FEN, legal solution moves, checkmate where claimed),
 * and writes the *verified* survivors as `TacticSpec[]` JSON.
 *
 * The output is NOT auto-wired into the app. Review it, then hand-merge the
 * entries you like into `TACTIC_SPECS` in `bank.ts` (or add a small loader
 * that reads the generated JSON at build time) and re-run
 * `pnpm --filter @gt100k/mvp-jul24 test src/puzzles/Chess` — `bank.test.ts`
 * iterates the *entire* bank, so any bad merge fails the suite immediately.
 *
 * ---------------------------------------------------------------------------
 * Rating bands + themes sampled — tune these to change the mix.
 * ---------------------------------------------------------------------------
 */

import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";
import { createInterface } from "node:readline";
import { Chess } from "chess.js";

const RATING_BANDS = [
  { label: "beginner", min: 0, max: 1200 },
  { label: "intermediate", min: 1200, max: 1800 },
  { label: "advanced", min: 1800, max: 2400 },
  { label: "expert", min: 2400, max: Number.POSITIVE_INFINITY },
];

// Lichess theme tag -> { our label, our theme bucket }. Extend freely; any
// puzzle whose Themes don't match one of these is skipped (kid-friendly,
// clearly-nameable tactics only — not every Lichess theme is one).
const THEME_MAP = {
  mateIn1: { label: "Checkmate in 1", theme: "mate" },
  mateIn2: { label: "Checkmate in 2", theme: "mate" },
  backRankMate: { label: "Back-rank mate", theme: "mate" },
  smotheredMate: { label: "Smothered mate", theme: "mate" },
  fork: { label: "Fork", theme: "material" },
  pin: { label: "Pin", theme: "material" },
  skewer: { label: "Skewer", theme: "material" },
  discoveredAttack: { label: "Discovered attack", theme: "material" },
  hangingPiece: { label: "Win a hanging piece", theme: "material" },
  trappedPiece: { label: "Trap a piece", theme: "material" },
};

function parseArgs(argv) {
  const [zstPath, ...rest] = argv;
  if (!zstPath) {
    console.error(
      "Usage: node scripts/ingest-lichess.mjs <lichess_db_puzzle.csv.zst> [--per-bucket N] [--out path]",
    );
    process.exit(1);
  }
  let perBucket = 25;
  let out = "src/puzzles/Chess/bank.generated.json";
  for (let i = 0; i < rest.length; i++) {
    if (rest[i] === "--per-bucket") perBucket = Number(rest[++i]);
    if (rest[i] === "--out") out = rest[++i];
  }
  return { zstPath, perBucket, out };
}

/** Split a Lichess puzzle CSV line. The dataset's fields never contain
 * embedded commas (FEN uses '/'+space, Moves/Themes/OpeningTags use space),
 * so a plain split is safe here — swap in a real CSV parser if that ever
 * changes upstream. */
function parseRow(line) {
  const [PuzzleId, FEN, Moves, Rating, , , , Themes] = line.split(",");
  return { PuzzleId, FEN, Moves, Rating: Number(Rating), Themes: (Themes ?? "").split(" ") };
}

/** Apply the CSV's leading "setup" move to FEN, per the Lichess format note
 * above. Returns the real puzzle-start FEN + the solver's solution moves
 * (still in UCI, exactly the shape `TacticSpec.solution` wants). Returns
 * null if the row is malformed / the setup move is illegal (skip it). */
function toStartFenAndSolution(fen, movesField) {
  const moves = movesField.split(" ");
  if (moves.length < 2) return null; // need at least the setup move + 1 solution move
  try {
    const chess = new Chess(fen);
    const setup = moves[0];
    chess.move({ from: setup.slice(0, 2), to: setup.slice(2, 4), promotion: setup[4] ?? "q" });
    return { startFen: chess.fen(), solution: moves.slice(1) };
  } catch {
    return null;
  }
}

/** The same verification `bank.test.ts` runs on the curated bank — nothing
 * here is trusted just because it came from Lichess. */
function verify(spec) {
  try {
    const chess = new Chess(spec.fen);
    for (const uci of spec.solution) {
      const from = uci.slice(0, 2);
      const to = uci.slice(2, 4);
      const legal = chess.moves({ square: from, verbose: true });
      if (!legal.some((m) => m.to === to)) return false;
      chess.move({ from, to, promotion: uci[4] ?? "q" });
    }
    if (spec.theme === "mate" && !chess.isCheckmate()) return false;
    // No promotions: our shared board/engine has no promotion picker, so
    // reject any solution that promotes a pawn along the way.
    if (spec.solution.some((m) => m.length > 4)) return false;
    return true;
  } catch {
    return false;
  }
}

function bucketKey(ratingBand, themeKey) {
  return `${ratingBand}:${themeKey}`;
}

async function main() {
  const { zstPath, perBucket, out } = parseArgs(process.argv.slice(2));

  // Stream-decompress via the system `zstd` CLI — see step 2 above for why
  // this avoids adding a new npm dependency for a script that isn't run as
  // part of the normal build/test.
  const zstd = spawn("zstd", ["-d", "--stdout", zstPath]);
  const rl = createInterface({ input: zstd.stdout });

  const counts = new Map(); // bucketKey -> count so far
  const results = [];
  let headerSkipped = false;

  for await (const line of rl) {
    if (!headerSkipped) {
      headerSkipped = true;
      continue; // CSV header row
    }
    const row = parseRow(line);
    const ratingBand = RATING_BANDS.find((b) => row.Rating >= b.min && row.Rating < b.max);
    if (!ratingBand) continue;

    const themeKey = row.Themes.find((t) => t in THEME_MAP);
    if (!themeKey) continue; // only ingest tactics we can label cleanly

    const key = bucketKey(ratingBand.label, themeKey);
    const have = counts.get(key) ?? 0;
    if (have >= perBucket) continue; // bucket full — keep sampling for others

    const converted = toStartFenAndSolution(row.FEN, row.Moves);
    if (!converted) continue;

    const meta = THEME_MAP[themeKey];
    const spec = {
      id: `lichess-${row.PuzzleId}`,
      fen: converted.startFen,
      solution: converted.solution,
      label: meta.label,
      theme: meta.theme,
      // Provenance, kept for review — not part of the TacticSpec shape bank.ts
      // consumes, so strip these two keys before merging into bank.ts.
      sourceRating: row.Rating,
      sourceThemes: row.Themes,
    };

    if (!verify(spec)) continue; // never ship an unverified tactic

    results.push(spec);
    counts.set(key, have + 1);
  }

  writeFileSync(out, JSON.stringify(results, null, 2));
  console.log(`Wrote ${results.length} verified tactics to ${out}`);
  console.log("Bucket coverage:", Object.fromEntries(counts));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

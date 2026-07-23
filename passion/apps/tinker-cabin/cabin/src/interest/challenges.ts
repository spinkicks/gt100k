/**
 * Code challenges — the coding-shack game. Each cabin gadget is controlled by a tiny PROGRAM the
 * player edits and runs; running it drives the REAL 3D gadget (via the shared gadget store) and
 * matching the target "brings the gadget online". Everything here is code-themed (this is the Code
 * cabin): each challenge teaches/probes a distinct concept (sequencing, loops, conditionals, …) so
 * the discovery loop sees WHICH kinds of code a learner leans into — never a score.
 *
 * Block-editing model (not free-text eval): the player cycles typed op tokens on each line, like the
 * signal-lamp taste puzzle. Low floor for young learners, safe (no eval), and deterministic. Each
 * line renders as monospace `<pre><OP-token><post>` so a line can read as `on = FLIP` or
 * `repeat 4 times { turn() }` depending on the challenge.
 */

/** One editable line of the program: monospace text around a cycling op token. */
export interface CodeLine {
  /** text before the op token (e.g. "tick 1:  on = ") */
  pre: string;
  /** index of the currently-selected op */
  op: number;
  /** text after the op token (e.g. " times { turn() }") */
  post?: string;
}

export interface ChallengeSpec {
  gadgetId: string;
  title: string;
  /** one-line framing shown under the title */
  prompt: string;
  /** the coding concept this probes (kept for the interest signal's sub-flavor) */
  concept: string;
  /** selectable op tokens; clicking a line cycles through these */
  ops: string[];
  /** context code shown (monospace, non-editable) above the editable lines */
  header: string;
  /** context code shown below the editable lines */
  footer: string;
  /** the starting (deliberately-broken) program the player fixes */
  lines: CodeLine[];
  /** pure reducer → the per-cell state trace (0/1 values) the program produces */
  run: (lines: CodeLine[]) => number[];
  /** the trace the player must reproduce */
  target: number[];
  /** map (trace, solved) → the gadget's store mode, applied LIVE to the 3D world on every Run */
  worldMode: (trace: number[], solved: boolean) => number;
  /** shown when solved (gadget-flavoured, e.g. "Lit! The lamp is online.") */
  solvedMsg: string;
}

/**
 * LAMP — sequencing. The lamp boots OFF; each tick the driver FLIPs or HOLDs the power. Fix the ops
 * so the lamp blinks the target pattern; running it toggles the real cabin lamp live, and a match
 * locks it BRIGHT. (Solution: FLIP, HOLD, FLIP, FLIP → 1,1,0,1.)
 */
export const LAMP_CHALLENGE: ChallengeSpec = {
  gadgetId: "lamp",
  title: "Program the lamp driver",
  prompt:
    "The lamp boots off. Each tick your code FLIPs or HOLDs the power. Fix the ops so it blinks the target — then it locks on.",
  concept: "sequencing",
  ops: ["FLIP", "HOLD"],
  header: "let on = false",
  footer: "return on   // 💡 off · on",
  lines: [
    { pre: "tick 1:  on = ", op: 1 },
    { pre: "tick 2:  on = ", op: 0 },
    { pre: "tick 3:  on = ", op: 1 },
    { pre: "tick 4:  on = ", op: 1 },
  ],
  run: (lines) => {
    let on = false;
    return lines.map((l) => {
      if (l.op === 0) on = !on; // FLIP
      return on ? 1 : 0;
    });
  },
  target: [1, 1, 0, 1],
  // OFF(0) · WARM(1) · COOL(2) · BRIGHT(3): live-preview the final tick while editing; lock BRIGHT on solve
  worldMode: (trace, solved) => (solved ? 3 : trace[trace.length - 1] ? 1 : 0),
  solvedMsg: "Lit! The lamp is online.",
};

/**
 * GEAR GIZMO — loops. The crank needs exactly the right number of turns to build torque and engage.
 * The player sets the loop count; running it fills that many turn-cells, and matching the required
 * count (4) engages the real gears. (Solution: repeat 4.)
 */
export const GIZMO_CHALLENGE: ChallengeSpec = {
  gadgetId: "gizmo",
  title: "Crank the gear driver",
  prompt:
    "The gears need the right number of turns to engage. Set the loop count so exactly the target cells fill — then the crank catches.",
  concept: "loops",
  ops: ["1", "2", "3", "4", "5", "6"],
  header: "let turns = 0",
  footer: "return turns   // ⚙ engages at 4",
  lines: [{ pre: "repeat ", op: 1, post: " times { turns += 1 }" }],
  run: (lines) => {
    const n = (lines[0]?.op ?? 0) + 1; // ops[0] = "1"
    return Array.from({ length: 6 }, (_, i) => (i < n ? 1 : 0));
  },
  target: [1, 1, 1, 1, 0, 0], // exactly 4 turns
  worldMode: (_trace, solved) => (solved ? 1 : 0), // gizmo: 0 off · 1 spinning
  solvedMsg: "Engaged! The gears are turning.",
};

/** Challenges keyed by gadget id. Gadgets without an entry fall back to a plain discovery for now. */
export const CHALLENGES: Record<string, ChallengeSpec> = {
  lamp: LAMP_CHALLENGE,
  gizmo: GIZMO_CHALLENGE,
};

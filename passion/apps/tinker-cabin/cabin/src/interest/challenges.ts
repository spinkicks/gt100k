/**
 * Code challenges — the coding-shack game. Each cabin gadget is controlled by a tiny PROGRAM the
 * player edits and runs; running it drives the REAL 3D gadget (via the shared gadget store) and
 * matching the target "brings the gadget online". Everything here is code-themed (this is the Code
 * cabin): each challenge teaches/probes a distinct concept (sequencing, loops, conditionals, …) so
 * the discovery loop sees WHICH kinds of code a learner leans into — never a score.
 *
 * Block-editing model (not free-text eval): the player cycles typed op tokens on each line, like the
 * signal-lamp taste puzzle. Low floor for young learners, safe (no eval), and deterministic.
 */

/** One editable line of the program: fixed left label + the index of its currently-selected op. */
export interface CodeLine {
  label: string;
  op: number;
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
  /** pure reducer → the per-tick state trace (0/1 values) the program produces */
  run: (lines: CodeLine[]) => number[];
  /** the trace the player must reproduce */
  target: number[];
  /** map (trace, solved) → the gadget's store mode, applied LIVE to the 3D world on every Run */
  worldMode: (trace: number[], solved: boolean) => number;
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
    { label: "tick 1", op: 1 },
    { label: "tick 2", op: 0 },
    { label: "tick 3", op: 1 },
    { label: "tick 4", op: 1 },
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
};

/** Challenges keyed by gadget id. Gadgets without an entry fall back to a plain discovery for now. */
export const CHALLENGES: Record<string, ChallengeSpec> = {
  lamp: LAMP_CHALLENGE,
};

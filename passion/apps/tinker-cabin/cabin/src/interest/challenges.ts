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
  /** if set, Run exits the menu and the gadget plays the trace back slowly (watch it execute in the
   *  world), instead of instantly setting a mode + keeping the panel open */
  playback?: boolean;
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
  playback: true, // Run exits the menu and the lamp blinks the pattern slowly so you watch it
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
  // mode = turn count → the gears spin the moment you Run (any count) and faster with more turns
  worldMode: (trace) => trace.filter(Boolean).length,
  solvedMsg: "Engaged! The gears are turning.",
};

/**
 * CHIME KEYS — arrays / sequencing. The chimes play a rhythm from a beat array; each slot is PLAY or
 * REST. Match the target rhythm and the real chimes ring. (Target: PLAY REST PLAY PLAY REST.)
 */
export const CHIMES_CHALLENGE: ChallengeSpec = {
  gadgetId: "chimes",
  title: "Compose the chime loop",
  prompt:
    "Fill the beat array — each slot PLAYs a note or RESTs. Match the target rhythm and the chimes ring.",
  concept: "arrays",
  ops: ["PLAY", "REST"],
  header: "const beats = [",
  footer: "]   // ♪ play the pattern",
  lines: [
    { pre: "beat 0 = ", op: 1, post: "," },
    { pre: "beat 1 = ", op: 1, post: "," },
    { pre: "beat 2 = ", op: 1, post: "," },
    { pre: "beat 3 = ", op: 1, post: "," },
    { pre: "beat 4 = ", op: 0, post: "," },
  ],
  run: (lines) => lines.map((l) => (l.op === 0 ? 1 : 0)), // PLAY(op0) → note
  target: [1, 0, 1, 1, 0],
  worldMode: (trace) => (trace.some((v) => v === 1) ? 1 : 0), // rings the moment any beat PLAYs
  solvedMsg: "Ringing! The chimes play your loop.",
};

/**
 * CONTROL PANEL — conditionals. Sensor readings pass through one comparison against a threshold;
 * pick the operator that lights the target pass/fail pattern. (readings [2,5,4,6] > 4 → 0,1,0,1.)
 */
export const PANEL_CHALLENGE: ChallengeSpec = {
  gadgetId: "panel",
  title: "Wire the panel logic",
  prompt:
    "Each sensor reading is checked against the threshold. Pick the operator so the lamps match the target.",
  concept: "conditionals",
  ops: [">", "<", ">=", "=="],
  header: "readings = [2, 5, 4, 6];  threshold = 4",
  footer: "// 🟢 pass · ⚫ fail",
  lines: [{ pre: "light = readings.map(r => r ", op: 1, post: " threshold)" }],
  run: (lines) => {
    const readings = [2, 5, 4, 6];
    const th = 4;
    const op = lines[0]?.op ?? 0;
    return readings.map((r) => {
      const pass = op === 0 ? r > th : op === 1 ? r < th : op === 2 ? r >= th : r === th;
      return pass ? 1 : 0;
    });
  },
  target: [0, 1, 0, 1], // r > 4
  worldMode: (trace) => (trace.some((v) => v === 1) ? 1 : 0), // lights as soon as any check passes
  solvedMsg: "Online! The panel logic checks out.",
};

/**
 * EASEL — functions / arguments. Paint the scene by calling paint() with the right colour argument
 * on each layer, in order. All three correct → the finished canvas shows. (SKY, PEAK, SUN.)
 */
export const EASEL_CHALLENGE: ChallengeSpec = {
  gadgetId: "easel",
  title: "Paint by function calls",
  prompt:
    "Each layer calls paint() with a colour argument. Pass the right colour to each call to render the scene.",
  concept: "functions",
  ops: ["SKY", "PEAK", "SUN", "SNOW"],
  header: "canvas.clear()",
  footer: "return canvas   // 🎨",
  lines: [
    { pre: "paint(", op: 3, post: ")   // background" },
    { pre: "paint(", op: 0, post: ")   // ridge" },
    { pre: "paint(", op: 1, post: ")   // highlight" },
  ],
  // correct argument per layer: SKY(0), PEAK(1), SUN(2)
  run: (lines) => {
    const correct = [0, 1, 2];
    return lines.map((l, i) => (l.op === correct[i] ? 1 : 0));
  },
  target: [1, 1, 1],
  // reveals progressively: each correct layer paints more of the canvas (0 blank → 2 finished)
  worldMode: (trace, solved) => (solved ? 2 : trace.some((v) => v === 1) ? 1 : 0),
  solvedMsg: "Painted! The canvas is complete.",
};

/** Challenges keyed by gadget id — the coding-shack game (all code-themed, each a distinct concept). */
export const CHALLENGES: Record<string, ChallengeSpec> = {
  lamp: LAMP_CHALLENGE, // sequencing
  gizmo: GIZMO_CHALLENGE, // loops
  chimes: CHIMES_CHALLENGE, // arrays
  panel: PANEL_CHALLENGE, // conditionals
  easel: EASEL_CHALLENGE, // functions
};

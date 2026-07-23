// Multi-rater fixtures for the validity harness (SYNTHETIC — spec §9 golden reliability fixture).
// Each unit = one item's category as rated by each rater (undefined = not rated by that rater).
//
// DISAGREE_UNITS: 2 raters × 4 units over {build, perform}. Hand-verified nominal α = 0.5333.
//   Derivation: coincidences o_bb=4, o_pp=2, o_bp=o_pb=1; n_b=5, n_p=3, n=8; Σo_cc=6, Σn_c²=34;
//   α = 1 − (n−1)(n − Σo_cc)/(n² − Σn_c²) = 1 − 7·2/30 = 0.5333.  0.5333 < ALPHA_BAR → PROVISIONAL.
export const DISAGREE_UNITS: ReadonlyArray<ReadonlyArray<string | undefined>> = [
  ["build", "build"],
  ["build", "build"],
  ["perform", "perform"],
  ["build", "perform"],
];

// PERFECT_UNITS: full agreement over 3 distinct categories → α = 1.0 → TRUSTED.
export const PERFECT_UNITS: ReadonlyArray<ReadonlyArray<string | undefined>> = [
  ["build", "build"],
  ["perform", "perform"],
  ["investigate", "investigate"],
];

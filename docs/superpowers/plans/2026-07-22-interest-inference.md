# Interest Inference Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `011-interest-inference` feature per `specs/011-interest-inference/spec.md` — a pure, deterministic Beta-Bernoulli engine that turns per-`(domain × work-mode)` behavioral events into calibrated beliefs, ranked 1–3 candidate spikes, and a topic-vs-style attribution, honestly reporting "not sure yet".

**Architecture:** One pure domain package (`@gt100k/interest-inference`), no adapters, no I/O, no network, no LLM. Closed-form conjugate math → exact golden values.

**Tech Stack:** TypeScript (ES2022, `strict`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`, `composite`), vitest, pnpm monorepo. **No dependencies.**

## Global Constraints
- **SYNTHETIC ONLY**; no PII in fixtures.
- **Gate:** `pnpm exec tsc -b` + `pnpm test`.
- **Loop:** headless, **no served app (`LOOP_QA` N/A)**, no network, no LLM, no external dependency. Float assertions use `toBeCloseTo(x, 3)`. This package has no cross-`@gt100k` name imports (tests use relative imports; root references it by path), so `tsc -b`/`vitest` need no `pnpm install` — but adding the workspace member still updates `pnpm-lock.yaml`, so the loop must not run `pnpm install --frozen-lockfile`.
- **`verbatimModuleSyntax`** → `import type` for types. **`noUncheckedIndexedAccess`** → handle `T | undefined`.
- **Own input contract** (`CellEvent`) — do not import `@gt100k/two-axis-tagging`.
- **Never output a scalar "passion score" or a fixed label** — per-cell beliefs + reasons + ranked candidates only.
- Constants are golden (see spec §3.2); copy them verbatim.
- Commit after each task (Conventional Commits).

---

### Task 0: Scaffold the package

**Files:** Create `passion/packages/interest-inference/{package.json,tsconfig.json,src/index.ts,test/smoke.test.ts}`; modify root `tsconfig.json`.

- [ ] **Step 1: Failing smoke test**
```ts
// test/smoke.test.ts
import { describe, it, expect } from "vitest";
import * as pkg from "../src/index.js";
describe("package", () => { it("imports", () => { expect(pkg).toBeTypeOf("object"); }); });
```
- [ ] **Step 2: package.json**
```json
{
  "name": "@gt100k/interest-inference", "version": "0.1.0", "private": true, "type": "module",
  "main": "./src/index.ts", "types": "./src/index.ts", "exports": { ".": "./src/index.ts" },
  "scripts": { "test": "vitest run --root ../.. packages/interest-inference/test", "demo": "tsx src/demo-run.ts" }
}
```
- [ ] **Step 3: tsconfig.json**
```json
{ "extends": "../../../tsconfig.base.json", "compilerOptions": { "rootDir": ".", "outDir": "dist" }, "include": ["src/**/*.ts", "test/**/*.ts"] }
```
- [ ] **Step 4: Entrypoint** → `// src/index.ts` → `export {};`
- [ ] **Step 5: Root reference** — **append** `{ "path": "passion/packages/interest-inference" }` to root `tsconfig.json` `references` (keep EVERY existing entry, e.g. `passion/packages/evidence-explorer-view`; the resulting array must contain both). Do not replace the array.
- [ ] **Step 6: Gate** → `pnpm exec tsc -b && pnpm test` → PASS.
- [ ] **Step 7: Commit** → `git add passion/packages/interest-inference tsconfig.json && git commit -m "feat(inference): scaffold @gt100k/interest-inference package"`

---

### Task 1: Types, constants, keys, recency (P0)

**Files:** Create `src/model.ts`, `test/model.test.ts`.

**Interfaces:** Produces all types (`CellEvent`, `DomainPrior`, `CellBelief`, `Candidate`, `InterestRead`, `EventKind`, `DomainPath`), constants, `DEPTH_FAMILIES`, `isDepthFamily`, `serializeCellKey`, `recencyWeight`.

- [ ] **Step 1: Failing test**
```ts
// test/model.test.ts
import { describe, it, expect } from "vitest";
import { serializeCellKey, recencyWeight, HALFLIFE_DAYS, isDepthFamily } from "../src/model.js";

describe("model", () => {
  it("serializes cell keys", () => {
    expect(serializeCellKey(["music-sound", "audio-systems"], "build")).toBe("music-sound/audio-systems::build");
    expect(serializeCellKey(["math-puzzles"], "investigate")).toBe("math-puzzles::investigate");
  });
  it("recency weight halves every HALFLIFE_DAYS and is 1 at age 0", () => {
    const now = Date.parse("2026-01-15T00:00:00.000Z");
    expect(recencyWeight(now, "2026-01-15T00:00:00.000Z")).toBeCloseTo(1, 6);
    const halfLifeAgo = new Date(now - HALFLIFE_DAYS * 86400000).toISOString();
    expect(recencyWeight(now, halfLifeAgo)).toBeCloseTo(0.5, 6);
  });
  it("depth-family guard", () => {
    expect(isDepthFamily("artifact_competence")).toBe(true);
    expect(isDepthFamily("voluntary_return")).toBe(false);
  });
});
```
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement model.ts**
```ts
// src/model.ts
export const ALPHA0 = 1;
export const BETA0 = 1;
export const W_ENV = 0.5;
export const W_APT = 0.5;
export const W_XP = 0.5;
export const A_RETURN = 1.0;
export const A_DEPTH = 0.5;
export const B_SKIP = 0.5;
export const HALFLIFE_DAYS = 14;
export const MIN_EVIDENCE_MASS = 3;
export const MAX_CI_WIDTH = 0.35;
export const K_LCB = 1.0;
export const SPIKE_THRESHOLD = 0.6;
export const MAX_CANDIDATES = 3;
export const ATTR_MARGIN = 0.1;

export const DEPTH_FAMILIES = [
  "unrequired_revision", "chosen_challenge", "failure_recovery", "self_authored_scope", "artifact_competence",
] as const;
export type DepthFamily = (typeof DEPTH_FAMILIES)[number];
export type EventKind = "voluntary_return" | "prompted_return" | DepthFamily | "skip";

export type DomainPath = readonly [string] | readonly [string, string];
export type Attribution = "domain" | "style" | "mixed";

export interface DomainPrior {
  readonly domain: string;
  readonly inEnvironment: boolean;
  readonly aptitudeTilt: number;      // [0,1]
  readonly discretionaryTilt: number; // [0,1]
}

export interface CellEvent {
  readonly domainPath: DomainPath;
  readonly mode: string;
  readonly kind: EventKind;
  readonly magnitude: number; // [0,1]
  readonly novelty: boolean;
  readonly timestamp: string; // ISO-8601
}

export interface CellBelief {
  readonly cellKey: string;
  readonly domainPath: DomainPath;
  readonly mode: string;
  readonly alpha: number;
  readonly beta: number;
  readonly mean: number;
  readonly sd: number;
  readonly lowerBound: number;
  readonly evidenceMass: number;
  readonly confident: boolean;
  readonly attribution: Attribution | null;
  readonly supporting: readonly string[];
  readonly disconfirming: readonly string[];
}

export interface Candidate {
  readonly cellKey: string;
  readonly domainPath: DomainPath;
  readonly mode: string;
  readonly lowerBound: number;
  readonly attribution: Attribution;
}

export interface InterestRead {
  readonly cells: readonly CellBelief[];
  readonly candidates: readonly Candidate[];
}

const DEPTH_SET = new Set<string>(DEPTH_FAMILIES);
export function isDepthFamily(kind: string): kind is DepthFamily { return DEPTH_SET.has(kind); }

export function serializeCellKey(domainPath: DomainPath, mode: string): string {
  const d = domainPath.length === 2 ? `${domainPath[0]}/${domainPath[1]}` : domainPath[0];
  return `${d}::${mode}`;
}

export function recencyWeight(now: number, timestamp: string): number {
  const parsed = Date.parse(timestamp);
  if (Number.isNaN(parsed)) return 1; // unparseable timestamp → no decay (never NaN-poison alpha)
  const ageMs = Math.max(0, now - parsed);
  return Math.pow(0.5, ageMs / 86400000 / HALFLIFE_DAYS);
}

// Clamp a documented [0,1] input; NaN → 0. Guards magnitude / tilt inputs against out-of-range poisoning.
export function clamp01(x: number): number {
  if (Number.isNaN(x)) return 0;
  return x < 0 ? 0 : x > 1 ? 1 : x;
}
```
- [ ] **Step 4: Run** → PASS. **Step 5: Commit** → `feat(inference): types, constants, cell keys, recency`.

---

### Task 2: Prior + evidence folding (P1 — core)

**Files:** Create `src/fold.ts`, `test/fold.test.ts`.

**Interfaces:** Produces `buildPrior(prior?)`, `CellAccum`, `foldEvents(events, priors, now): Map<string, CellAccum>`.

- [ ] **Step 1: Failing test**
```ts
// test/fold.test.ts
import { describe, it, expect } from "vitest";
import { buildPrior, foldEvents } from "../src/fold.js";
import type { CellEvent, DomainPrior } from "../src/model.js";

const NOW = Date.parse("2026-01-01T00:00:00.000Z");
const TS = "2026-01-01T00:00:00.000Z"; // age 0 → recency 1

describe("buildPrior", () => {
  it("adds env + tilt bonuses", () => {
    const p: DomainPrior = { domain: "music-sound", inEnvironment: true, aptitudeTilt: 0, discretionaryTilt: 0 };
    expect(buildPrior(p)).toEqual({ alphaPrior: 1.5, betaPrior: 1 });
    expect(buildPrior(undefined)).toEqual({ alphaPrior: 1, betaPrior: 1 });
    expect(buildPrior({ domain: "x", inEnvironment: false, aptitudeTilt: 1, discretionaryTilt: 1 })).toEqual({ alphaPrior: 2, betaPrior: 1 });
  });
});

describe("foldEvents", () => {
  it("excludes novelty + prompted; adds returns/depth to alpha; skips to beta", () => {
    const priors: DomainPrior[] = [{ domain: "music-sound", inEnvironment: true, aptitudeTilt: 0, discretionaryTilt: 0 }];
    const evts: CellEvent[] = [
      { domainPath: ["music-sound", "audio-systems"], mode: "build", kind: "voluntary_return", magnitude: 1, novelty: false, timestamp: TS },
      { domainPath: ["music-sound", "audio-systems"], mode: "build", kind: "voluntary_return", magnitude: 1, novelty: false, timestamp: TS },
      { domainPath: ["music-sound", "audio-systems"], mode: "build", kind: "voluntary_return", magnitude: 1, novelty: false, timestamp: TS },
      { domainPath: ["music-sound", "audio-systems"], mode: "build", kind: "unrequired_revision", magnitude: 1, novelty: false, timestamp: TS },
      { domainPath: ["music-sound", "audio-systems"], mode: "build", kind: "artifact_competence", magnitude: 1, novelty: false, timestamp: TS },
      { domainPath: ["music-sound", "audio-systems"], mode: "build", kind: "skip", magnitude: 1, novelty: false, timestamp: TS },
      { domainPath: ["music-sound", "audio-systems"], mode: "build", kind: "voluntary_return", magnitude: 1, novelty: true, timestamp: TS },
      { domainPath: ["music-sound", "audio-systems"], mode: "build", kind: "prompted_return", magnitude: 1, novelty: false, timestamp: TS },
    ];
    const cell = foldEvents(evts, priors, NOW).get("music-sound/audio-systems::build")!;
    expect(cell.alpha).toBeCloseTo(5.5, 6);
    expect(cell.beta).toBeCloseTo(1.5, 6);
    expect(cell.skips).toBe(1);
    expect(cell.prompted).toBe(1);
  });
});
```
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement fold.ts**
```ts
// src/fold.ts
import type { CellEvent, DomainPath, DomainPrior } from "./model.js";
import { A_RETURN, A_DEPTH, B_SKIP, ALPHA0, BETA0, W_ENV, W_APT, W_XP, clamp01, isDepthFamily, recencyWeight, serializeCellKey } from "./model.js";

export function buildPrior(prior?: DomainPrior): { alphaPrior: number; betaPrior: number } {
  const alphaPrior = ALPHA0
    + (prior?.inEnvironment ? W_ENV : 0)
    + W_APT * clamp01(prior?.aptitudeTilt ?? 0)
    + W_XP * clamp01(prior?.discretionaryTilt ?? 0);
  return { alphaPrior, betaPrior: BETA0 };
}

export interface CellAccum {
  cellKey: string; domainPath: DomainPath; mode: string;
  alphaPrior: number; betaPrior: number; alpha: number; beta: number;
  positiveByKind: Record<string, number>; skips: number; prompted: number;
}

export function foldEvents(events: readonly CellEvent[], priors: readonly DomainPrior[], now: number): Map<string, CellAccum> {
  const priorByDomain = new Map<string, DomainPrior>();
  for (const p of priors) priorByDomain.set(p.domain, p);

  const cells = new Map<string, CellAccum>();
  for (const e of events) {
    const cellKey = serializeCellKey(e.domainPath, e.mode);
    let cell = cells.get(cellKey);
    if (!cell) {
      const { alphaPrior, betaPrior } = buildPrior(priorByDomain.get(e.domainPath[0]));
      cell = { cellKey, domainPath: e.domainPath, mode: e.mode, alphaPrior, betaPrior, alpha: alphaPrior, beta: betaPrior, positiveByKind: {}, skips: 0, prompted: 0 };
      cells.set(cellKey, cell);
    }
    if (e.novelty) continue;                       // triggered situational interest → excluded
    if (e.kind === "prompted_return") { cell.prompted += 1; continue; }
    const w = recencyWeight(now, e.timestamp);
    const mag = clamp01(e.magnitude);
    if (e.kind === "voluntary_return") {
      const add = A_RETURN * mag * w;
      cell.alpha += add;
      cell.positiveByKind[e.kind] = (cell.positiveByKind[e.kind] ?? 0) + add;
    } else if (isDepthFamily(e.kind)) {
      const add = A_DEPTH * mag * w;
      cell.alpha += add;
      cell.positiveByKind[e.kind] = (cell.positiveByKind[e.kind] ?? 0) + add;
    } else if (e.kind === "skip") {
      cell.beta += B_SKIP * w;
      cell.skips += 1;
    }
  }
  return cells;
}
```
- [ ] **Step 4: Run** → PASS. **Step 5: Commit** → `feat(inference): prior construction + evidence folding`.

---

### Task 3: Posterior stats + reasons (P2)

**Files:** Create `src/posterior.ts`, `test/posterior.test.ts`.

**Interfaces:** Consumes `CellAccum`. Produces `toBelief(cell): CellBelief`.

- [ ] **Step 1: Failing golden test**
```ts
// test/posterior.test.ts
import { describe, it, expect } from "vitest";
import { toBelief } from "../src/posterior.js";
import type { CellAccum } from "../src/fold.js";

const goldenAccum: CellAccum = {
  cellKey: "music-sound/audio-systems::build", domainPath: ["music-sound", "audio-systems"], mode: "build",
  alphaPrior: 1.5, betaPrior: 1, alpha: 5.5, beta: 1.5,
  positiveByKind: { voluntary_return: 3, unrequired_revision: 0.5, artifact_competence: 0.5 },
  skips: 1, prompted: 1,
};

describe("toBelief (golden)", () => {
  it("computes the hand-verified posterior", () => {
    const b = toBelief(goldenAccum);
    expect(b.mean).toBeCloseTo(0.785714, 4);
    expect(b.sd).toBeCloseTo(0.145072, 4);
    expect(b.lowerBound).toBeCloseTo(0.640642, 4);
    expect(b.evidenceMass).toBeCloseTo(4.5, 6);
    expect(b.confident).toBe(true);
    expect(b.supporting[0]).toBe("voluntary_return");
    expect(b.disconfirming).toEqual(["skip:1", "prompted_return:1"]);
    expect(b.attribution).toBeNull();
  });
  it("marks a thin cell not-confident", () => {
    const thin = { ...goldenAccum, alpha: 2, beta: 1, positiveByKind: { voluntary_return: 0.5 }, skips: 0, prompted: 0 };
    expect(toBelief(thin).confident).toBe(false); // evidenceMass 0.5 < 3
  });
});
```
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement posterior.ts**
```ts
// src/posterior.ts
import type { CellAccum } from "./fold.js";
import type { CellBelief } from "./model.js";
import { K_LCB, MIN_EVIDENCE_MASS, MAX_CI_WIDTH } from "./model.js";

export function toBelief(cell: CellAccum): CellBelief {
  const { alpha, beta, alphaPrior, betaPrior } = cell;
  const n = alpha + beta;
  const mean = alpha / n;
  const variance = (alpha * beta) / (n * n * (n + 1));
  const sd = Math.sqrt(variance);
  const lowerBound = Math.max(0, mean - K_LCB * sd);
  const evidenceMass = (alpha - alphaPrior) + (beta - betaPrior);
  const confident = evidenceMass >= MIN_EVIDENCE_MASS && 2 * sd <= MAX_CI_WIDTH;

  const supporting = Object.entries(cell.positiveByKind)
    .filter(([, v]) => v > 0)
    .sort((a, b) => (b[1] - a[1]) || a[0].localeCompare(b[0]))
    .map(([k]) => k);
  const disconfirming: string[] = [];
  if (cell.skips > 0) disconfirming.push(`skip:${cell.skips}`);
  if (cell.prompted > 0) disconfirming.push(`prompted_return:${cell.prompted}`);

  return {
    cellKey: cell.cellKey, domainPath: cell.domainPath, mode: cell.mode,
    alpha, beta, mean, sd, lowerBound, evidenceMass, confident,
    attribution: null, supporting, disconfirming,
  };
}
```
- [ ] **Step 4: Run** → PASS. **Step 5: Commit** → `feat(inference): posterior stats + supporting/disconfirming reasons`.

---

### Task 4: Ranking + topic-vs-style attribution (P3)

**Files:** Create `src/aggregate.ts`, `test/aggregate.test.ts`.

**Interfaces:** Consumes `CellBelief`. Produces `rankCandidates(beliefs): CellBelief[]`, `attributionFor(target, all): Attribution`.

- [ ] **Step 1: Failing test** (uses preset means to test attribution in isolation)
```ts
// test/aggregate.test.ts
import { describe, it, expect } from "vitest";
import { rankCandidates, attributionFor } from "../src/aggregate.js";
import type { CellBelief, DomainPath } from "../src/model.js";

function belief(domain: string, mode: string, mean: number, confident = true, lowerBound = mean): CellBelief {
  const domainPath: DomainPath = [domain];
  return { cellKey: `${domain}::${mode}`, domainPath, mode, alpha: 1, beta: 1, mean, sd: 0.1, lowerBound, evidenceMass: 5, confident, attribution: null, supporting: [], disconfirming: [] };
}

describe("rankCandidates", () => {
  it("keeps confident cells with lowerBound >= 0.6, sorted desc, capped at 3", () => {
    const bs = [
      belief("a", "build", 0.9, true, 0.9),
      belief("b", "build", 0.7, true, 0.7),
      belief("c", "build", 0.65, true, 0.65),
      belief("d", "build", 0.8, true, 0.8),
      belief("e", "build", 0.5, true, 0.5),   // below threshold
      belief("f", "build", 0.95, false, 0.95), // not confident
    ];
    expect(rankCandidates(bs).map((b) => b.cellKey)).toEqual(["a::build", "d::build", "b::build"]);
  });
});

describe("attributionFor", () => {
  const maker = [belief("audio", "build", 0.8), belief("gamedev", "build", 0.8), belief("audio", "perform", 0.4), belief("gamedev", "perform", 0.35)];
  const loyalist = [belief("audio", "build", 0.8), belief("audio", "perform", 0.8), belief("gamedev", "build", 0.4), belief("gamedev", "perform", 0.35)];
  it("maker → style", () => { expect(attributionFor(maker[0]!, maker)).toBe("style"); });
  it("loyalist → domain", () => { expect(attributionFor(loyalist[0]!, loyalist)).toBe("domain"); });

  it("groups sub-topics under one cabin (per-cabin marginal, locks M2)", () => {
    // Helper that builds cells sharing a CABIN but with different sub-topics + a mode.
    function bsub(cabin: string, sub: string, mode: string, m: number): CellBelief {
      const domainPath: DomainPath = [cabin, sub];
      return { cellKey: `${cabin}/${sub}::${mode}`, domainPath, mode, alpha: 1, beta: 1, mean: m, sd: 0.1, lowerBound: m, evidenceMass: 5, confident: true, attribution: null, supporting: [], disconfirming: [] };
    }
    const cells = [
      bsub("music-sound", "audio-systems", "build", 0.8),
      bsub("music-sound", "synthesis", "build", 0.8),   // second sub-topic, same cabin + mode
      bsub("code-computers", "game-dev", "build", 0.4),
    ];
    // domainMarginal(music-sound) = mean(0.8, 0.8) = 0.8; modeMarginal(build) = mean(0.8, 0.8, 0.4) = 0.6667
    // 0.8 − 0.6667 = 0.1333 > ATTR_MARGIN(0.1) → "domain" (cabin-loyal across sub-topics)
    expect(attributionFor(cells[0]!, cells)).toBe("domain");
  });
});
```
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement aggregate.ts**
```ts
// src/aggregate.ts
import type { Attribution, CellBelief } from "./model.js";
import { SPIKE_THRESHOLD, MAX_CANDIDATES, ATTR_MARGIN } from "./model.js";

export function rankCandidates(beliefs: readonly CellBelief[]): CellBelief[] {
  return beliefs
    .filter((b) => b.confident && b.lowerBound >= SPIKE_THRESHOLD)
    .slice()
    .sort((a, b) => (b.lowerBound - a.lowerBound) || a.cellKey.localeCompare(b.cellKey))
    .slice(0, MAX_CANDIDATES);
}

function mean(xs: readonly number[]): number {
  if (xs.length === 0) return 0;
  let s = 0;
  for (const x of xs) s += x;
  return s / xs.length;
}

export function attributionFor(target: CellBelief, all: readonly CellBelief[]): Attribution {
  const dom = target.domainPath[0];
  const domainMarginal = mean(all.filter((b) => b.domainPath[0] === dom).map((b) => b.mean));
  const modeMarginal = mean(all.filter((b) => b.mode === target.mode).map((b) => b.mean));
  if (domainMarginal - modeMarginal > ATTR_MARGIN) return "domain";
  if (modeMarginal - domainMarginal > ATTR_MARGIN) return "style";
  return "mixed";
}
```
- [ ] **Step 4: Run** → PASS. **Step 5: Commit** → `feat(inference): candidate ranking + topic-vs-style attribution`.

---

### Task 5: Orchestrator + public API + demo + README (P4)

**Files:** Create `src/inference.ts`, `src/__fixtures__/interest.fixtures.ts`, `test/golden-e2e.test.ts`, `src/demo.ts`, `src/demo-run.ts`, `test/inference.test.ts`, `test/demo.test.ts`, `README.md`; modify `src/index.ts`.

**Interfaces:** Produces `runInference(events, priors, now): InterestRead`; `runDemo()`.

- [ ] **Step 1: Failing orchestrator test**
```ts
// test/inference.test.ts
import { describe, it, expect } from "vitest";
import { runInference } from "../src/inference.js";
import type { CellEvent, DomainPrior } from "../src/model.js";

const NOW = Date.parse("2026-01-01T00:00:00.000Z");
const TS = "2026-01-01T00:00:00.000Z";
function ret(domain: string, sub: string, mode: string): CellEvent {
  return { domainPath: [domain, sub], mode, kind: "voluntary_return", magnitude: 1, novelty: false, timestamp: TS };
}

describe("runInference", () => {
  it("returns a well-formed InterestRead (no scalar; candidates ⊆ cells; attribution only on candidates)", () => {
    const priors: DomainPrior[] = [];
    // 4 strong returns each on two cells → both should be confident candidates
    const evts: CellEvent[] = [
      ...Array.from({ length: 4 }, () => ret("music-sound", "audio-systems", "build")),
      ...Array.from({ length: 4 }, () => ret("code-computers", "game-dev", "build")),
    ];
    const read = runInference(evts, priors, NOW);
    expect(Array.isArray(read.cells)).toBe(true);
    expect(read.candidates.length).toBeGreaterThan(0);
    const cellKeys = new Set(read.cells.map((c) => c.cellKey));
    for (const cand of read.candidates) expect(cellKeys.has(cand.cellKey)).toBe(true);
    for (const cell of read.cells) {
      if (read.candidates.some((c) => c.cellKey === cell.cellKey)) expect(cell.attribution).not.toBeNull();
      else expect(cell.attribution).toBeNull();
    }
    expect((read as unknown as { score?: number }).score).toBeUndefined(); // never a scalar
  });
});
```
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement inference.ts**
```ts
// src/inference.ts
import type { CellBelief, CellEvent, Candidate, DomainPrior, InterestRead } from "./model.js";
import { foldEvents } from "./fold.js";
import { toBelief } from "./posterior.js";
import { rankCandidates, attributionFor } from "./aggregate.js";

export function runInference(events: readonly CellEvent[], priors: readonly DomainPrior[], now: number): InterestRead {
  const beliefs: CellBelief[] = [...foldEvents(events, priors, now).values()].map(toBelief);
  const ranked = rankCandidates(beliefs);

  const attrByKey = new Map<string, Candidate>();
  for (const b of ranked) {
    const attribution = attributionFor(b, beliefs);
    attrByKey.set(b.cellKey, { cellKey: b.cellKey, domainPath: b.domainPath, mode: b.mode, lowerBound: b.lowerBound, attribution });
  }

  const cells: CellBelief[] = beliefs.map((b) => {
    const c = attrByKey.get(b.cellKey);
    return c ? { ...b, attribution: c.attribution } : b;
  });

  return { cells, candidates: [...attrByKey.values()] };
}
```
- [ ] **Step 3b: Create the named `src/__fixtures__/` file (spec §6 deliverable) + an end-to-end golden test.**

```ts
// src/__fixtures__/interest.fixtures.ts
import type { CellEvent, DomainPrior } from "../model.js";

export const GOLDEN_NOW = Date.parse("2026-01-01T00:00:00.000Z");
const TS = "2026-01-01T00:00:00.000Z";

export const GOLDEN_PRIORS: DomainPrior[] = [
  { domain: "music-sound", inEnvironment: true, aptitudeTilt: 0, discretionaryTilt: 0 },
];

export const GOLDEN_CELL_KEY = "music-sound/audio-systems::build";

// The golden cell → α=5.5, β=1.5 (spec §6): 3 voluntary + 2 depth + 1 skip; 1 novelty + 1 prompted excluded.
export const GOLDEN_EVENTS: CellEvent[] = [
  { domainPath: ["music-sound", "audio-systems"], mode: "build", kind: "voluntary_return", magnitude: 1, novelty: false, timestamp: TS },
  { domainPath: ["music-sound", "audio-systems"], mode: "build", kind: "voluntary_return", magnitude: 1, novelty: false, timestamp: TS },
  { domainPath: ["music-sound", "audio-systems"], mode: "build", kind: "voluntary_return", magnitude: 1, novelty: false, timestamp: TS },
  { domainPath: ["music-sound", "audio-systems"], mode: "build", kind: "unrequired_revision", magnitude: 1, novelty: false, timestamp: TS },
  { domainPath: ["music-sound", "audio-systems"], mode: "build", kind: "artifact_competence", magnitude: 1, novelty: false, timestamp: TS },
  { domainPath: ["music-sound", "audio-systems"], mode: "build", kind: "skip", magnitude: 1, novelty: false, timestamp: TS },
  { domainPath: ["music-sound", "audio-systems"], mode: "build", kind: "voluntary_return", magnitude: 1, novelty: true, timestamp: TS },
  { domainPath: ["music-sound", "audio-systems"], mode: "build", kind: "prompted_return", magnitude: 1, novelty: false, timestamp: TS },
];
```

```ts
// test/golden-e2e.test.ts — runs the golden EVENT LIST through the full pipeline and locks the posterior
import { describe, it, expect } from "vitest";
import { runInference } from "../src/inference.js";
import { GOLDEN_EVENTS, GOLDEN_PRIORS, GOLDEN_NOW, GOLDEN_CELL_KEY } from "../src/__fixtures__/interest.fixtures.js";

describe("golden end-to-end", () => {
  it("the golden event list yields the hand-verified posterior via runInference", () => {
    const read = runInference(GOLDEN_EVENTS, GOLDEN_PRIORS, GOLDEN_NOW);
    const cell = read.cells.find((c) => c.cellKey === GOLDEN_CELL_KEY)!;
    expect(cell.alpha).toBeCloseTo(5.5, 6);
    expect(cell.beta).toBeCloseTo(1.5, 6);
    expect(cell.mean).toBeCloseTo(0.785714, 4);
    expect(cell.sd).toBeCloseTo(0.145072, 4);
    expect(cell.lowerBound).toBeCloseTo(0.640642, 4);
    expect(cell.evidenceMass).toBeCloseTo(4.5, 6);
    expect(cell.confident).toBe(true);
  });
});
```

> Closes the reviewer's gap (SC-4 was previously split across `fold.test` + a hand-built `CellAccum` in `posterior.test`). `fold.test.ts` may import `GOLDEN_EVENTS`/`GOLDEN_PRIORS`/`GOLDEN_NOW` from this file instead of inlining.

- [ ] **Step 4: Public index.ts** → `export * from "./model.js"; export * from "./fold.js"; export * from "./posterior.js"; export * from "./aggregate.js"; export * from "./inference.js";`
- [ ] **Step 5: demo.ts + demo.test.ts**
```ts
// src/demo.ts
import type { CellEvent, DomainPrior, InterestRead } from "./model.js";
import { runInference } from "./inference.js";

export function runDemo(): InterestRead {
  const now = Date.parse("2026-01-01T00:00:00.000Z");
  const ts = "2026-01-01T00:00:00.000Z";
  const priors: DomainPrior[] = [{ domain: "music-sound", inEnvironment: true, aptitudeTilt: 0, discretionaryTilt: 0 }];
  const events: CellEvent[] = [
    { domainPath: ["music-sound", "audio-systems"], mode: "build", kind: "voluntary_return", magnitude: 1, novelty: false, timestamp: ts },
    { domainPath: ["music-sound", "audio-systems"], mode: "build", kind: "voluntary_return", magnitude: 1, novelty: false, timestamp: ts },
    { domainPath: ["music-sound", "audio-systems"], mode: "build", kind: "voluntary_return", magnitude: 1, novelty: false, timestamp: ts },
    { domainPath: ["music-sound", "audio-systems"], mode: "build", kind: "artifact_competence", magnitude: 1, novelty: false, timestamp: ts },
  ];
  return runInference(events, priors, now);
}
```
```ts
// test/demo.test.ts
import { describe, it, expect } from "vitest";
import { runDemo } from "../src/demo.js";
describe("demo", () => {
  it("produces at least one confident belief", () => {
    const read = runDemo();
    expect(read.cells.some((c) => c.confident)).toBe(true);
  });
});
```

Also add a print-only runner (keeps `runDemo` side-effect-free so importing it never prints; satisfies the spec §2 "printed InterestRead"):

```ts
// src/demo-run.ts
import { runDemo } from "./demo.js";
console.log(JSON.stringify(runDemo(), null, 2));
```
- [ ] **Step 6: README** — mirror `evidence-graph/README.md`: what it is (events → beliefs → candidates), the Beta-Bernoulli model + constants table, the `InterestRead` shape, "no scalar/label" guardrail, `pnpm --filter @gt100k/interest-inference test`.
- [ ] **Step 7: Gate** → `pnpm exec tsc -b && pnpm test` → PASS.
- [ ] **Step 8: Commit** → `feat(inference): orchestrator, public API, demo, README`.

---

## Self-Review
**0. Review fixes applied (from the adversarial review):** M1 — the spec-named `src/__fixtures__/interest.fixtures.ts` is now a real deliverable (Task 5 Step 3b). M2 — attribution marginals reconciled to "per-cell mean grouped by cabin" in spec §3.3 + a multi-sub-topic locking test added (Task 4). L1 — root tsconfig reference is APPEND (Task 0 Step 5). L2 — `demo-run.ts` prints + a `demo` script. L3 — end-to-end golden test runs the golden EVENT LIST through `runInference` (Task 5 Step 3b). L4 — `clamp01` on magnitude + tilts and a NaN-timestamp guard in `recencyWeight`.
**1. Spec coverage:** SC-1→Task1; SC-2→Task2; SC-3→Task2; SC-4→Task3 golden **+ end-to-end (Task5 Step 3b)**; SC-5→Task3; SC-6→Task4; SC-7→Task4 (+ multi-sub-topic lock); SC-8→Task5; SC-9→every gate. ✓
**2. Placeholder scan:** all golden numbers are hand-verified literals (mean 0.785714, sd 0.145072, lb 0.640642); no TODOs; no deferred values (no LLM/env at all).
**3. Type consistency:** `CellEvent`/`DomainPrior`/`CellBelief`/`Candidate`/`InterestRead`/`Attribution` are defined once in `model.ts` and used consistently. `foldEvents → toBelief → rankCandidates/attributionFor → runInference` signatures chain correctly.
**4. Dependencies:** none (no adapters, no network, no LLM). Only edits root `tsconfig.json` (one line) — parallel-safe with 009/010.
**5. Loop-readiness:** deterministic golden values, gate green from Task 0, `LOOP_QA` N/A, no env, `toBeCloseTo(_,3)` for floats. `noUncheckedIndexedAccess` handled (test index access uses `!` after known-length arrays; production code avoids raw index access except guarded).

---

## Execution Handoff
**Plan complete and saved to `docs/superpowers/plans/2026-07-22-interest-inference.md`. Two execution options:**
**1. Subagent-Driven (recommended)** — fresh subagent per task, review between tasks.
**2. Inline Execution** — execute in this session with checkpoints.
**Which approach?**

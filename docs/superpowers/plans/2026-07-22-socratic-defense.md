# Socratic Project Defense/Tutor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `010-socratic-defense` feature per `specs/010-socratic-defense/spec.md` — an LLM-conducted project interview governed by a deterministic, unit-tested scaffold that emits a tamper-evident evidence record.

**Architecture:** A pure domain package (`@gt100k/socratic-defense`) owns the session scaffold (facet selection, follow-up/stop, coverage math, gap detection, readiness) and evidence-record assembly (reusing `@gt100k/evidence-graph` `canonicalize` + the `Hasher` port). Two ports — `Interviewer` and `AnswerJudge` — have a deterministic `tutor-stub` (CI) and a TrueFoundry `tutor-tfy` (opt-in, native `fetch`). CI is fully offline + deterministic.

**Tech Stack:** TypeScript (ES2022, `strict`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`, `composite`), vitest, pnpm monorepo. Reuses in-repo `@gt100k/evidence-graph` + `@gt100k/evidence-hash-node`. No external deps.

## Global Constraints
- **SYNTHETIC ONLY** — no real child data; no PII in fixtures.
- **Gate:** `pnpm exec tsc -b` + `pnpm test`.
- **Loop:** headless — **no served app, `LOOP_QA` N/A**; no network in tests; no new external dependency (native `fetch`; reuse in-repo evidence packages). In-lane new files + one added line in root `tsconfig.json` references.
- **`verbatimModuleSyntax`** → `import type` for types. **`noUncheckedIndexedAccess`** → handle `T | undefined` on index access.
- **No dependency cycles:** the domain imports `@gt100k/evidence-graph` (kept, read-only); adapters import the domain; the domain never imports an adapter (demo/tests inject a stub).
- **Invariants:** the evidence record has **no grade field**; coverage updates are **monotonic max**; `engaged…` N/A here.
- Constants (golden): `THIN = 0.45`, `COVERED = 0.6`, `MAX_TURNS = 12`, `MAX_FOLLOWUP = { emerging: 2, developing: 1, fluent: 1 }`, facet order `[what, why, how, challenge, next, audience]`.
- Commit after each task (Conventional Commits).

---

### Task 0: Scaffold the package

**Files:**
- Create: `passion/packages/socratic-defense/package.json`
- Create: `passion/packages/socratic-defense/tsconfig.json`
- Create: `passion/packages/socratic-defense/src/index.ts`
- Create: `passion/packages/socratic-defense/test/smoke.test.ts`
- Modify: root `tsconfig.json` (add reference)

- [ ] **Step 1: Failing smoke test**

```ts
// test/smoke.test.ts
import { describe, it, expect } from "vitest";
import * as pkg from "../src/index.js";
describe("package", () => { it("imports", () => { expect(pkg).toBeTypeOf("object"); }); });
```

- [ ] **Step 2: package.json** (depends on evidence-graph for canonicalize + Hasher type)

```json
{
  "name": "@gt100k/socratic-defense",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": { ".": "./src/index.ts" },
  "dependencies": { "@gt100k/evidence-graph": "workspace:*" },
  "scripts": { "test": "vitest run --root ../.. packages/socratic-defense/test" }
}
```

- [ ] **Step 3: tsconfig.json**

```json
{
  "extends": "../../../tsconfig.base.json",
  "compilerOptions": { "rootDir": ".", "outDir": "dist" },
  "references": [{ "path": "../evidence-graph" }],
  "include": ["src/**/*.ts", "test/**/*.ts"]
}
```

- [ ] **Step 4: Empty entrypoint** — `// src/index.ts` → `export {};`
- [ ] **Step 5: Root reference** — **append** `{ "path": "passion/packages/socratic-defense" }` to root `tsconfig.json` `references` (keep every existing entry, e.g. `passion/packages/evidence-explorer-view`). Do not replace the array.
- [ ] **Step 6: Gate** → `pnpm exec tsc -b && pnpm test` → PASS.
- [ ] **Step 7: Commit** → `git add passion/packages/socratic-defense tsconfig.json && git commit -m "feat(defense): scaffold @gt100k/socratic-defense package"`

---

### Task 1: Facets, readiness, records, constants (P0)

**Files:**
- Create: `passion/packages/socratic-defense/src/model.ts`
- Create: `passion/packages/socratic-defense/test/model.test.ts`

**Interfaces:**
- Produces: `Facet`, `FACET_ORDER`, `isFacet`, `ReadinessLevel`, `MAX_FOLLOWUP`, `maxFollowup(level)`, `THIN`, `COVERED`, `MAX_TURNS`, `ProjectProfile`, `Judgment`, `Turn`, `Session`, `EvidenceRecord`.

- [ ] **Step 1: Failing test**

```ts
// test/model.test.ts
import { describe, it, expect } from "vitest";
import { FACET_ORDER, isFacet, maxFollowup, THIN, COVERED, MAX_TURNS } from "../src/model.js";

describe("model", () => {
  it("golden facet order", () => {
    expect(FACET_ORDER).toEqual(["what", "why", "how", "challenge", "next", "audience"]);
  });
  it("readiness → follow-up cap", () => {
    expect(maxFollowup("emerging")).toBe(2);
    expect(maxFollowup("developing")).toBe(1);
    expect(maxFollowup("fluent")).toBe(1);
  });
  it("constants", () => { expect(THIN).toBe(0.45); expect(COVERED).toBe(0.6); expect(MAX_TURNS).toBe(12); });
  it("isFacet guards", () => { expect(isFacet("what")).toBe(true); expect(isFacet("nope")).toBe(false); });
});
```

- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement model.ts**

```ts
// src/model.ts
export const FACET_ORDER = ["what", "why", "how", "challenge", "next", "audience"] as const;
export type Facet = (typeof FACET_ORDER)[number];
const FACET_SET = new Set<string>(FACET_ORDER);
export function isFacet(x: unknown): x is Facet { return typeof x === "string" && FACET_SET.has(x); }

export type ReadinessLevel = "emerging" | "developing" | "fluent";
export const MAX_FOLLOWUP: Record<ReadinessLevel, number> = { emerging: 2, developing: 1, fluent: 1 };
export function maxFollowup(level: ReadinessLevel): number { return MAX_FOLLOWUP[level]; }

export const THIN = 0.45;
export const COVERED = 0.6;
export const MAX_TURNS = 12;

export interface ProjectProfile {
  readonly id: string;
  readonly studentId: string;
  readonly title: string;
  readonly domain: string;
  readonly summary: string;
  readonly artifactRefs: readonly string[];
}

export interface Judgment {
  readonly facet: Facet;
  readonly coverage: number; // [0,1]
  readonly rationale: string;
  readonly thin: boolean;
}

export interface Turn {
  readonly index: number;
  readonly facet: Facet;
  readonly question: string;
  readonly isFollowUp: boolean;
  readonly answer: string;
  readonly coverage: number;
}

export type CoverageByFacet = Record<Facet, number>;

export interface Session {
  readonly profile: ProjectProfile;
  readonly readinessLevel: ReadinessLevel;
  readonly turns: readonly Turn[];
  readonly coverageByFacet: CoverageByFacet;
  readonly gaps: readonly Facet[];
  readonly status: "active" | "complete";
}

export interface EvidenceRecord {
  readonly studentId: string;
  readonly projectId: string;
  readonly title: string;
  readonly domain: string;
  readonly readinessLevel: ReadinessLevel;
  readonly turns: readonly Turn[];
  readonly coverageByFacet: CoverageByFacet;
  readonly gaps: readonly Facet[];
  readonly createdAt: string;
  readonly contentHash: string;
  // NOTE: intentionally no `grade` field — the tutor emits evidence, never a grade.
}

/**
 * Synchronous content hasher. Declared locally (a one-method structural interface) because
 * `@gt100k/evidence-graph` does NOT re-export its `Hasher` port from its package index, and this
 * feature's scope fence forbids editing evidence-graph. `canonicalize` IS exported and is imported normally.
 */
export interface Hasher { hash(input: Uint8Array): string; }
```

- [ ] **Step 4: Run** → PASS. **Step 5: Commit** → `feat(defense): facets, readiness, records, constants`.

---

### Task 2: The deterministic scaffold (P1 — the crux)

**Files:**
- Create: `passion/packages/socratic-defense/src/scaffold.ts`
- Create: `passion/packages/socratic-defense/test/scaffold.test.ts`

**Interfaces:**
- Produces: `initialCoverage()`, `updateCoverage(cov, facet, judged)`, `selectNextFacet(cov)`, `isComplete(cov, turnCount)`, `computeGaps(cov)`.

- [ ] **Step 1: Failing test**

```ts
// test/scaffold.test.ts
import { describe, it, expect } from "vitest";
import { initialCoverage, updateCoverage, selectNextFacet, isComplete, computeGaps } from "../src/scaffold.js";

describe("scaffold", () => {
  it("coverage starts at 0 for every facet", () => {
    const c = initialCoverage();
    expect(Object.values(c).every((v) => v === 0)).toBe(true);
  });
  it("update is monotonic max", () => {
    let c = initialCoverage();
    c = updateCoverage(c, "why", 0.3);
    c = updateCoverage(c, "why", 0.7);
    c = updateCoverage(c, "why", 0.5);
    expect(c.why).toBe(0.7);
  });
  it("selectNextFacet returns least-covered, fixed-order tie-break", () => {
    const c = initialCoverage();
    expect(selectNextFacet(c)).toBe("what"); // all 0 → first
    const c2 = updateCoverage(c, "what", 0.9);
    expect(selectNextFacet(c2)).toBe("why"); // what covered → next lowest, tie→order
  });
  it("isComplete on all-covered or MAX_TURNS", () => {
    const all = { what: 0.6, why: 0.6, how: 0.6, challenge: 0.6, next: 0.6, audience: 0.6 };
    expect(isComplete(all, 3)).toBe(true);
    const low = { ...all, why: 0.2 };
    expect(isComplete(low, 3)).toBe(false);
    expect(isComplete(low, 12)).toBe(true); // MAX_TURNS
  });
  it("computeGaps = facets below COVERED", () => {
    const c = { what: 0.7, why: 0.5, how: 0.7, challenge: 0.4, next: 0.7, audience: 0.7 };
    expect(computeGaps(c)).toEqual(["why", "challenge"]);
  });
});
```

- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement scaffold.ts**

```ts
// src/scaffold.ts
import type { CoverageByFacet, Facet } from "./model.js";
import { FACET_ORDER, COVERED, MAX_TURNS } from "./model.js";

export function initialCoverage(): CoverageByFacet {
  return { what: 0, why: 0, how: 0, challenge: 0, next: 0, audience: 0 };
}

export function updateCoverage(cov: CoverageByFacet, facet: Facet, judged: number): CoverageByFacet {
  return { ...cov, [facet]: Math.max(cov[facet], judged) };
}

export function selectNextFacet(cov: CoverageByFacet): Facet {
  let best: Facet = FACET_ORDER[0];
  let bestVal = cov[best];
  for (const f of FACET_ORDER) {
    if (cov[f] < bestVal) { best = f; bestVal = cov[f]; }
  }
  return best; // FACET_ORDER iteration → ties resolve to the earliest facet
}

export function isComplete(cov: CoverageByFacet, turnCount: number): boolean {
  if (turnCount >= MAX_TURNS) return true;
  return FACET_ORDER.every((f) => cov[f] >= COVERED);
}

export function computeGaps(cov: CoverageByFacet): Facet[] {
  return FACET_ORDER.filter((f) => cov[f] < COVERED);
}
```

- [ ] **Step 4: Run** → PASS. **Step 5: Commit** → `feat(defense): deterministic session scaffold`.

---

### Task 3: Ports + runSession + scripted stub (P2)

**Files:**
- Create: `passion/packages/socratic-defense/src/ports.ts`
- Create: `passion/packages/socratic-defense/src/session.ts`
- Create: `passion/packages/socratic-defense/src/__fixtures__/scripted-session.ts`
- Create: `passion/adapters/tutor-stub/package.json`
- Create: `passion/adapters/tutor-stub/tsconfig.json`
- Create: `passion/adapters/tutor-stub/src/index.ts`
- Create: `passion/packages/socratic-defense/test/session.test.ts`
- Modify: root `tsconfig.json` (add `tutor-stub` reference)

**Interfaces:**
- Produces (domain): `Interviewer`, `AnswerJudge`, `TutorPorts`, `runSession(input): Promise<Session>`.
- Produces (adapter): `ScriptedTutor` implementing both ports from a `{ questions[], judgments[] }` script.

- [ ] **Step 1: Ports**

```ts
// src/ports.ts
import type { Facet, Judgment, ProjectProfile, ReadinessLevel, Turn } from "./model.js";

export interface Interviewer {
  nextQuestion(ctx: {
    profile: ProjectProfile; transcript: readonly Turn[];
    targetFacet: Facet; isFollowUp: boolean; readinessLevel: ReadinessLevel;
  }): Promise<string>;
}

export interface AnswerJudge {
  judge(ctx: {
    profile: ProjectProfile; facet: Facet; question: string; answer: string; readinessLevel: ReadinessLevel;
  }): Promise<Judgment>;
}

export interface TutorPorts { interviewer: Interviewer; judge: AnswerJudge; }
```

- [ ] **Step 2: runSession**

```ts
// src/session.ts
import type { ProjectProfile, ReadinessLevel, Session, Turn, Facet } from "./model.js";
import { maxFollowup } from "./model.js";
import type { TutorPorts } from "./ports.js";
import { initialCoverage, updateCoverage, selectNextFacet, isComplete, computeGaps } from "./scaffold.js";

// Supplies the child's answer each turn. In production this comes from the live UI; in CI it
// replays a recorded array. This is the spec §5 `answerSource` (NOT a pre-known answers[]), so the
// same engine drives a live LLM interview and a deterministic replay.
export type AnswerSource = (ctx: {
  profile: ProjectProfile; facet: Facet; question: string; isFollowUp: boolean; index: number; readinessLevel: ReadinessLevel;
}) => Promise<string>;

export interface RunSessionInput {
  profile: ProjectProfile;
  readinessLevel: ReadinessLevel;
  ports: TutorPorts;
  answerSource: AnswerSource;
}

export async function runSession(input: RunSessionInput): Promise<Session> {
  const { profile, readinessLevel, ports, answerSource } = input;
  const cap = maxFollowup(readinessLevel);

  let cov = initialCoverage();
  const turns: Turn[] = [];
  const followups: Record<string, number> = {};
  let targetFacet: Facet = selectNextFacet(cov);
  let isFollowUp = false;

  // isComplete bounds the loop via MAX_TURNS, so there is no unbounded interview.
  while (!isComplete(cov, turns.length)) {
    const idx = turns.length;
    const question = await ports.interviewer.nextQuestion({ profile, transcript: turns, targetFacet, isFollowUp, readinessLevel });
    const answer = await answerSource({ profile, facet: targetFacet, question, isFollowUp, index: idx, readinessLevel });
    const judgment = await ports.judge.judge({ profile, facet: targetFacet, question, answer, readinessLevel });

    cov = updateCoverage(cov, targetFacet, judgment.coverage);
    turns.push({ index: idx, facet: targetFacet, question, isFollowUp, answer, coverage: cov[targetFacet] });

    if (isComplete(cov, turns.length)) break;

    const used = followups[targetFacet] ?? 0;
    if (judgment.thin && used < cap) {
      followups[targetFacet] = used + 1;
      isFollowUp = true; // re-probe same facet
    } else {
      isFollowUp = false;
      targetFacet = selectNextFacet(cov);
    }
  }

  return { profile, readinessLevel, turns, coverageByFacet: cov, gaps: computeGaps(cov), status: "complete" };
}
```

- [ ] **Step 3: Scripted-session fixture** (drives the golden test; questions/answers/judgments per turn)

```ts
// src/__fixtures__/scripted-session.ts
import type { ProjectProfile, Judgment } from "../model.js";

export const PROFILE: ProjectProfile = {
  id: "proj-01", studentId: "stu-01", title: "DIY Subwoofer", domain: "making-engineering",
  summary: "A ported subwoofer box tuned with Thiele-Small params.", artifactRefs: ["a1"],
};

export const READINESS = "developing" as const;

// Turn-indexed script. Order of facets probed: what, why, why(follow-up), how, challenge, next, audience.
export const QUESTIONS: readonly string[] = [
  "What is your project?",
  "Why does this project matter to you?",
  "Say more about why it matters to you personally.",
  "How does it actually work?",
  "What was the hardest part?",
  "What's next for it?",
  "Who is it for?",
];

export const ANSWERS: readonly string[] = [
  "A subwoofer box I designed and built.",
  "I like it.",
  "My dad was a DJ and I wanted to build one that hits like his, so it's personal.",
  "The port length tunes the resonant frequency to match the driver's Fs.",
  "Getting the port math right without it chuffing.",
  "Add a second driver and measure the response.",
  "For my room, and to show my dad.",
];

export const JUDGMENTS: readonly Judgment[] = [
  { facet: "what", coverage: 0.7, rationale: "clear", thin: false },
  { facet: "why", coverage: 0.3, rationale: "vague", thin: true },
  { facet: "why", coverage: 0.7, rationale: "personal + specific", thin: false },
  { facet: "how", coverage: 0.7, rationale: "mechanism", thin: false },
  { facet: "challenge", coverage: 0.7, rationale: "specific obstacle", thin: false },
  { facet: "next", coverage: 0.7, rationale: "concrete plan", thin: false },
  { facet: "audience", coverage: 0.7, rationale: "named audience", thin: false },
];
```

- [ ] **Step 4: tutor-stub adapter** (package.json + tsconfig like 009's stub, referencing the domain)

```ts
// passion/adapters/tutor-stub/src/index.ts
import type { Interviewer, AnswerJudge } from "@gt100k/socratic-defense";
import type { Judgment } from "@gt100k/socratic-defense";

export class ScriptedTutor implements Interviewer, AnswerJudge {
  private i = 0;
  constructor(private readonly script: { questions: readonly string[]; judgments: readonly Judgment[] }) {}
  async nextQuestion(): Promise<string> {
    return this.script.questions[this.i] ?? "Tell me more about your project.";
  }
  async judge(): Promise<Judgment> {
    const j = this.script.judgments[this.i];
    this.i += 1;
    return j ?? { facet: "what", coverage: 0, rationale: "stub-exhausted", thin: true };
  }
}
```

```json
// passion/adapters/tutor-stub/package.json
{
  "name": "@gt100k/tutor-stub", "version": "0.1.0", "private": true, "type": "module",
  "main": "./src/index.ts", "types": "./src/index.ts", "exports": { ".": "./src/index.ts" },
  "dependencies": { "@gt100k/socratic-defense": "workspace:*" },
  "scripts": { "test": "vitest run" }
}
```

```json
// passion/adapters/tutor-stub/tsconfig.json
{
  "extends": "../../../tsconfig.base.json",
  "compilerOptions": { "rootDir": ".", "outDir": "dist" },
  "references": [{ "path": "../../packages/socratic-defense" }],
  "include": ["src/**/*.ts", "test/**/*.ts"]
}
```

```ts
// passion/adapters/tutor-stub/test/stub.test.ts
import { describe, it, expect } from "vitest";
import { ScriptedTutor } from "../src/index.js";

describe("ScriptedTutor", () => {
  it("returns scripted questions and judgments per turn, then falls back", async () => {
    const t = new ScriptedTutor({
      questions: ["q0", "q1"],
      judgments: [{ facet: "what", coverage: 0.7, rationale: "", thin: false }],
    });
    expect(await t.nextQuestion()).toBe("q0");
    expect((await t.judge()).coverage).toBe(0.7); // consumes turn 0
    expect(await t.nextQuestion()).toBe("q1");     // turn 1 question
    expect((await t.judge()).thin).toBe(true);      // exhausted → safe fallback
  });
});
```

> `tutor-stub` is the reusable scripted adapter for real consumers; the domain's own golden tests inline a tutor to keep the domain package free of any adapter reference (no project-reference cycle). Both `tutor-stub` and `tutor-tfy` depend on the domain, never the reverse.

- [ ] **Step 5: Golden session test** — inline the scripted tutor (do NOT import `@gt100k/tutor-stub`; the domain must not reference an adapter, or `tsc -b` gets a cyclic project reference)

```ts
// test/session.test.ts
import { describe, it, expect } from "vitest";
import { runSession } from "../src/session.js";
import type { Interviewer, AnswerJudge } from "../src/ports.js";
import type { Judgment } from "../src/model.js";
import { PROFILE, READINESS, QUESTIONS, ANSWERS, JUDGMENTS } from "../src/__fixtures__/scripted-session.js";

class InlineTutor implements Interviewer, AnswerJudge {
  private i = 0;
  async nextQuestion(): Promise<string> { return QUESTIONS[this.i] ?? "Tell me more."; }
  async judge(): Promise<Judgment> { const j = JUDGMENTS[this.i]; this.i += 1; return j ?? { facet: "what", coverage: 0, rationale: "", thin: true }; }
}

describe("runSession (golden)", () => {
  it("produces the exact transcript, coverage, and gaps", async () => {
    const tutor = new InlineTutor();
    const s = await runSession({ profile: PROFILE, readinessLevel: READINESS, ports: { interviewer: tutor, judge: tutor }, answerSource: async ({ index }) => ANSWERS[index] ?? "" });

    expect(s.turns.map((t) => t.facet)).toEqual(["what", "why", "why", "how", "challenge", "next", "audience"]);
    expect(s.turns.map((t) => t.isFollowUp)).toEqual([false, false, true, false, false, false, false]);
    expect(s.turns.map((t) => t.coverage)).toEqual([0.7, 0.3, 0.7, 0.7, 0.7, 0.7, 0.7]);
    expect(s.coverageByFacet).toEqual({ what: 0.7, why: 0.7, how: 0.7, challenge: 0.7, next: 0.7, audience: 0.7 });
    expect(s.gaps).toEqual([]);
    expect(s.status).toBe("complete");
  });
});
```

- [ ] **Step 6: Write the domain index barrel** so the adapters can resolve `model` symbols (`Judgment`, `Facet`, `THIN`, etc.) and `ports`/`session`. `evidence.js` is added in Task 4.

```ts
// src/index.ts (as of Task 3 — Task 4 appends "./evidence.js")
export * from "./model.js";
export * from "./ports.js";
export * from "./scaffold.js";
export * from "./session.js";
```

- [ ] **Step 7: Add root `tutor-stub` reference** — append `{ "path": "passion/adapters/tutor-stub" }` to root `tsconfig.json` `references` (keep every existing entry). **Run the gate** → PASS.
- [ ] **Step 8: Commit** → `feat(defense): ports, runSession, scripted stub + golden session`.

---

### Task 4: Evidence record + hash + mapper + guardrail (P3)

**Files:**
- Create: `passion/packages/socratic-defense/src/evidence.ts`
- Create: `passion/packages/socratic-defense/test/evidence.test.ts`

**Interfaces:**
- Consumes: `Session`, `EvidenceRecord`, and the local `Hasher` type (Task 1, `model.ts`); `canonicalize` (value) from `@gt100k/evidence-graph`. Tests/demo inject an inline `node:crypto` hasher (no `@gt100k/evidence-hash-node` dependency).
- Produces: `assembleEvidenceRecord(session, createdAt, hasher): EvidenceRecord`, `toEvidenceNode(record)`.

- [ ] **Step 1: Failing test**

```ts
// test/evidence.test.ts
import { describe, it, expect } from "vitest";
import { createHash } from "node:crypto";
import { runSession } from "../src/session.js";
import { assembleEvidenceRecord, toEvidenceNode } from "../src/evidence.js";
import type { Interviewer, AnswerJudge } from "../src/ports.js";
import type { Judgment, Hasher } from "../src/model.js";
import { PROFILE, READINESS, QUESTIONS, ANSWERS, JUDGMENTS } from "../src/__fixtures__/scripted-session.js";

const CREATED_AT = "2026-01-01T00:00:00.000Z";
// Inline hasher (node:crypto builtin) — avoids importing the evidence-hash-node adapter into the domain.
const hasher: Hasher = { hash: (b) => createHash("sha256").update(b).digest("hex") };

class InlineTutor implements Interviewer, AnswerJudge {
  private i = 0;
  async nextQuestion(): Promise<string> { return QUESTIONS[this.i] ?? "Tell me more."; }
  async judge(): Promise<Judgment> { const j = JUDGMENTS[this.i]; this.i += 1; return j ?? { facet: "what", coverage: 0, rationale: "", thin: true }; }
}

async function build() {
  const tutor = new InlineTutor();
  const s = await runSession({ profile: PROFILE, readinessLevel: READINESS, ports: { interviewer: tutor, judge: tutor }, answerSource: async ({ index }) => ANSWERS[index] ?? "" });
  return assembleEvidenceRecord(s, CREATED_AT, hasher);
}

describe("evidence record", () => {
  it("has no grade field and a 64-hex content hash", async () => {
    const r = await build();
    expect("grade" in r).toBe(false);
    expect(r.contentHash).toMatch(/^[0-9a-f]{64}$/);
  });
  it("hash is deterministic across two assemblies", async () => {
    const r1 = await build();
    const r2 = await build();
    expect(r1.contentHash).toBe(r2.contentHash);
  });
  it("maps to an Artifact-shaped evidence node carrying the hash", async () => {
    const r = await build();
    const node = toEvidenceNode(r);
    expect(node.type).toBe("Artifact");
    expect(node.actor.ref).toBe("stu-01");
    expect((node.payload as { recordHash: string }).recordHash).toBe(r.contentHash);
  });
});
```

- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement evidence.ts**

```ts
// src/evidence.ts
import type { EvidenceRecord, Session, Hasher } from "./model.js";
import { canonicalize } from "@gt100k/evidence-graph";

export function assembleEvidenceRecord(session: Session, createdAt: string, hasher: Hasher): EvidenceRecord {
  const base = {
    studentId: session.profile.studentId,
    projectId: session.profile.id,
    title: session.profile.title,
    domain: session.profile.domain,
    readinessLevel: session.readinessLevel,
    turns: session.turns,
    coverageByFacet: session.coverageByFacet,
    gaps: session.gaps,
    createdAt,
  };
  const contentHash = hasher.hash(new TextEncoder().encode(canonicalize(base)));
  return { ...base, contentHash };
}

export interface EvidenceNodeLike {
  readonly type: "Artifact";
  readonly actor: { readonly kind: "human"; readonly ref: string };
  readonly tool: { readonly name: string; readonly version: string };
  readonly inputs: readonly string[];
  readonly timestamp: string;
  readonly consentScope: { readonly scope: string };
  readonly payload: Readonly<Record<string, unknown>>;
}

export function toEvidenceNode(record: EvidenceRecord): EvidenceNodeLike {
  return {
    type: "Artifact",
    actor: { kind: "human", ref: record.studentId },
    tool: { name: "socratic-defense", version: "0.1.0" },
    inputs: [],
    timestamp: record.createdAt,
    consentScope: { scope: "synthetic" },
    payload: { recordHash: record.contentHash, gaps: record.gaps, coverageByFacet: record.coverageByFacet },
  };
}
```

- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Lock the golden hash** — add a test asserting the exact literal:

```ts
// append to test/evidence.test.ts (fill LITERAL from the first green run's r.contentHash)
it("matches the locked golden content hash", async () => {
  const r = await build();
  expect(r.contentHash).toBe("<PASTE-64-HEX-FROM-FIRST-GREEN-RUN>");
});
```

Run once, copy the printed/asserted hash into the literal, re-run → PASS. (This is how `evidence-graph` locks its golden hashes.)

- [ ] **Step 6: Commit** → `feat(defense): evidence record + content hash + node mapper`.

---

### Task 5: TrueFoundry adapter (P4 — native fetch, opt-in)

**Files:**
- Create: `passion/adapters/tutor-tfy/package.json`, `tsconfig.json`, `src/parse.ts`, `src/index.ts`, `src/__fixtures__/judge-response.ts`, `test/parse.test.ts`, `scripts/tutor-live.ts`, `.env.local.example`
- Modify: root `tsconfig.json` (add reference)

**Interfaces:**
- Produces: `TfyTutor implements Interviewer, AnswerJudge`, `parseJudgment(raw, facet): Judgment | null`, `tfyConfigFromEnv(env?)`.

- [ ] **Step 1: Recorded judge fixture** (a `.ts` file — NOT `.json`; the repo tsconfig does not set `resolveJsonModule`, so JSON imports would fail `tsc -b`)

```ts
// src/__fixtures__/judge-response.ts
export const JUDGE_RESPONSE = { coverage: 0.72, rationale: "Specific mechanism described with a personal reason.", thin: false };
```

- [ ] **Step 2: Failing parse test**

```ts
// test/parse.test.ts
import { describe, it, expect } from "vitest";
import { parseJudgment } from "../src/parse.js";
import { JUDGE_RESPONSE as fixture } from "../src/__fixtures__/judge-response.js";

describe("parseJudgment", () => {
  it("parses a valid judgment", () => {
    const j = parseJudgment(JSON.stringify(fixture), "how");
    expect(j).not.toBeNull();
    expect(j?.facet).toBe("how");
    expect(j?.coverage).toBeCloseTo(0.72, 2);
    expect(j?.thin).toBe(false);
  });
  it("null on malformed JSON", () => { expect(parseJudgment("nope", "how")).toBeNull(); });
  it("null on out-of-range coverage", () => {
    expect(parseJudgment(JSON.stringify({ coverage: 2, rationale: "", thin: false }), "how")).toBeNull();
  });
});
```

- [ ] **Step 3: package.json / tsconfig** (no external deps; references the domain)

```json
{
  "name": "@gt100k/tutor-tfy", "version": "0.1.0", "private": true, "type": "module",
  "main": "./src/index.ts", "types": "./src/index.ts", "exports": { ".": "./src/index.ts" },
  "dependencies": { "@gt100k/socratic-defense": "workspace:*" },
  "scripts": { "test": "vitest run", "tutor:live": "tsx scripts/tutor-live.ts" }
}
```

- [ ] **Step 4: parse.ts**

```ts
// src/parse.ts
import type { Facet, Judgment } from "@gt100k/socratic-defense";
import { THIN } from "@gt100k/socratic-defense";

export function parseJudgment(raw: string, facet: Facet): Judgment | null {
  let obj: unknown;
  try { obj = JSON.parse(raw); } catch { return null; }
  if (typeof obj !== "object" || obj === null) return null;
  const o = obj as Record<string, unknown>;
  const coverage = o["coverage"];
  if (typeof coverage !== "number" || coverage < 0 || coverage > 1) return null;
  const rationale = typeof o["rationale"] === "string" ? o["rationale"] : "";
  const thin = typeof o["thin"] === "boolean" ? o["thin"] : coverage < THIN;
  return { facet, coverage, rationale, thin };
}

export function parseQuestion(raw: string): string | null {
  try {
    const o = JSON.parse(raw) as Record<string, unknown>;
    return typeof o["question"] === "string" ? o["question"] : null;
  } catch { return null; }
}
```

- [ ] **Step 5: index.ts (native fetch)**

```ts
// src/index.ts
import type { Interviewer, AnswerJudge, Judgment } from "@gt100k/socratic-defense";
import { parseJudgment, parseQuestion } from "./parse.js";

export interface TfyConfig { apiKey: string; baseURL: string; model: string; }
const DEFAULT_BASE_URL = "https://tfy.promptlens.trilogy.com/openai/v1";
const DEFAULT_MODEL = "gpt-5.4-mini";

export function tfyConfigFromEnv(env: NodeJS.ProcessEnv = process.env): TfyConfig {
  const apiKey = env["TFY_API_KEY"];
  if (!apiKey) throw new Error("TFY_API_KEY is required for the live tutor");
  return { apiKey, baseURL: env["TFY_BASE_URL"] ?? DEFAULT_BASE_URL, model: env["TFY_TUTOR_MODEL"] ?? DEFAULT_MODEL };
}

async function chat(cfg: TfyConfig, system: string, user: string): Promise<string> {
  const res = await fetch(`${cfg.baseURL}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${cfg.apiKey}` },
    body: JSON.stringify({ model: cfg.model, temperature: 0, response_format: { type: "json_object" },
      messages: [{ role: "system", content: system }, { role: "user", content: user }] }),
  });
  if (!res.ok) return "";
  const body = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return body?.choices?.[0]?.message?.content ?? "";
}

export class TfyTutor implements Interviewer, AnswerJudge {
  constructor(private readonly cfg: TfyConfig) {}

  async nextQuestion(ctx: Parameters<Interviewer["nextQuestion"]>[0]): Promise<string> {
    const sys = `You interview a child about their own project to help them articulate it. Ask ONE short, warm question about the "${ctx.targetFacet}" facet${ctx.isFollowUp ? " (a gentle follow-up going deeper)" : ""}. Return JSON only: {"question":"..."}.`;
    const user = `Project: ${ctx.profile.title} — ${ctx.profile.summary}.`;
    return parseQuestion(await chat(this.cfg, sys, user)) ?? `Tell me more about the ${ctx.targetFacet} of your project.`;
  }

  async judge(ctx: Parameters<AnswerJudge["judge"]>[0]): Promise<Judgment> {
    const sys = `Judge how well the child's answer articulates the "${ctx.facet}" facet of THEIR project. Score articulation depth 0..1 (not correctness). Return JSON only: {"coverage":0..1,"rationale":"...","thin":bool}.`;
    const user = `Q: ${ctx.question}\nA: ${ctx.answer}`;
    return parseJudgment(await chat(this.cfg, sys, user), ctx.facet)
      ?? { facet: ctx.facet, coverage: 0, rationale: "judge-parse-failed", thin: true };
  }
}
```

- [ ] **Step 6: tutor-live.ts** (opt-in)

```ts
// scripts/tutor-live.ts
import { TfyTutor, tfyConfigFromEnv } from "../src/index.js";
async function main() {
  const t = new TfyTutor(tfyConfigFromEnv());
  const q = await t.nextQuestion({ profile: { title: "DIY Subwoofer", summary: "A ported box tuned with Thiele-Small params." }, targetFacet: "how", isFollowUp: false });
  const j = await t.judge({ facet: "how", question: q, answer: "The port length tunes the resonant frequency to the driver's Fs." });
  console.log(JSON.stringify({ q, j }, null, 2));
}
main().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 7: `.env.local.example`**

```bash
TFY_API_KEY=your-truefoundry-token
TFY_BASE_URL=https://tfy.promptlens.trilogy.com/openai/v1
TFY_TUTOR_MODEL=gpt-5.4-mini
```

- [ ] **Step 8: Root reference + gate** — **append** `{ "path": "passion/adapters/tutor-tfy" }` to root `tsconfig.json` `references` (keep all existing entries), then run `pnpm exec tsc -b && pnpm test` → PASS (no network in CI).
- [ ] **Step 9: Commit** → `feat(defense): TrueFoundry tutor adapter (native fetch, opt-in)`.

---

### Task 6: Public API + demo + README (P5)

**Files:**
- Modify: `passion/packages/socratic-defense/src/index.ts` (full public surface)
- Create: `passion/packages/socratic-defense/src/demo.ts`
- Create: `passion/packages/socratic-defense/test/demo.test.ts`
- Create: `passion/packages/socratic-defense/README.md`

- [ ] **Step 1: Failing demo test**

```ts
// test/demo.test.ts
import { describe, it, expect } from "vitest";
import { runDemo } from "../src/demo.js";
describe("demo", () => {
  it("runs a scripted session and emits a hashed, gradeless record", async () => {
    const r = await runDemo();
    expect(r.contentHash).toMatch(/^[0-9a-f]{64}$/);
    expect("grade" in r).toBe(false);
    expect(r.turns.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: index.ts** → `export * from "./model.js"; export * from "./ports.js"; export * from "./scaffold.js"; export * from "./session.js"; export * from "./evidence.js";`

- [ ] **Step 3: demo.ts** (inline stub — no adapter import, no cycle)

```ts
// src/demo.ts
import { createHash } from "node:crypto";
import type { Interviewer, AnswerJudge } from "./ports.js";
import { runSession } from "./session.js";
import { assembleEvidenceRecord } from "./evidence.js";
import type { EvidenceRecord, Judgment, Hasher } from "./model.js";
import { PROFILE, READINESS, QUESTIONS, ANSWERS, JUDGMENTS } from "./__fixtures__/scripted-session.js";

// Inline node:crypto Hasher (a Node builtin, not a dependency) — keeps the domain free of an adapter import.
const demoHasher: Hasher = { hash: (b) => createHash("sha256").update(b).digest("hex") };

class InlineTutor implements Interviewer, AnswerJudge {
  private i = 0;
  async nextQuestion(): Promise<string> { return QUESTIONS[this.i] ?? "Tell me more."; }
  async judge(): Promise<Judgment> { const j = JUDGMENTS[this.i]; this.i += 1; return j ?? { facet: "what", coverage: 0, rationale: "", thin: true }; }
}

export async function runDemo(): Promise<EvidenceRecord> {
  const t = new InlineTutor();
  const s = await runSession({ profile: PROFILE, readinessLevel: READINESS, ports: { interviewer: t, judge: t }, answerSource: async ({ index }) => ANSWERS[index] ?? "" });
  return assembleEvidenceRecord(s, "2026-01-01T00:00:00.000Z", demoHasher);
}
```

> The demo uses `node:crypto` directly for its `Hasher` (domain stays framework-free; `node:crypto` is a Node builtin, not a dependency) — no import of `tutor-stub`/`evidence-hash-node`, so no cycle.

- [ ] **Step 4: README** — mirror `evidence-graph/README.md`: what it is (interview → evidence), the LLM-conducts/scaffold-governs split, public API table, ports/adapters, the TFY env note, `pnpm --filter @gt100k/socratic-defense test`.
- [ ] **Step 5: Gate** → PASS. **Step 6: Commit** → `feat(defense): public API, demo, README`.

---

## Self-Review

**1. Spec coverage:** SC-1→Task1; SC-2→Task2; SC-3→Task2 (+ session golden Task3); SC-4→Task2; SC-5→Task2; SC-6→Task3 golden; SC-7→Task4 (no-grade + determinism + locked hash); SC-8→Task5; SC-9→every task's gate; manual live→Task5 `tutor:live`. ✓

**2. Placeholder scan:** the only deferred literal is the golden content hash, explicitly locked on first green run (Task 4 Step 5) — the standard evidence-graph pattern, not a TODO. TFY model/endpoint are the live-verified `gpt-5.4-mini` / `…/openai/v1`.

**3. Type consistency:** `Interviewer.nextQuestion` / `AnswerJudge.judge` signatures match across ports.ts, `runSession` (now `answerSource`-driven), `tutor-stub`, `tutor-tfy` (params typed via `Parameters<Port[method]>[0]`), and the demo. `Facet`, `Judgment`, `Session`, `EvidenceRecord`, `CoverageByFacet`, and the local `Hasher` are defined once in `model.ts`. `canonicalize` (value) is imported from `@gt100k/evidence-graph` (verified `canonicalize(unknown):string`); `Hasher` is local (evidence-graph does not export its port). The evidence hash = `hasher.hash(new TextEncoder().encode(canonicalize(recordWithoutHash)))`.

**4. Dependency direction (checked for cycles):** domain (`socratic-defense`) → `@gt100k/evidence-graph` only. Adapters (`tutor-stub`, `tutor-tfy`) → domain. The domain **never** imports an adapter or `evidence-hash-node`: its golden `session`/`evidence` tests and the demo **inline** a scripted tutor and a `node:crypto` `Hasher`, so there is no domain→adapter project reference and `tsc -b` sees a DAG. (This was a real bug in the first draft — the domain tests originally imported `@gt100k/tutor-stub`, which would have made the composite build cyclic.)

**5. Loop-readiness:** no served app (LOOP_QA off), no network in tests, no new external dependency, golden values fixed (scripted session + locked hash), gate green from Task 0, env only for the opt-in `tutor:live`.

**Ordering note:** Tasks 3/5 import from `@gt100k/socratic-defense`; export the referenced symbols from its index when first referenced if building strictly in order (Task 6 consolidates).

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-07-22-socratic-defense.md`. Two execution options:**

**1. Subagent-Driven (recommended)** — fresh subagent per task, review between tasks.
**2. Inline Execution** — execute in this session with checkpoints.

**Which approach?**

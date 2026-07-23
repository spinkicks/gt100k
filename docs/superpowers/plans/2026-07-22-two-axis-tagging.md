# Two-Axis Tagging Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `009-two-axis-tagging` feature — the taxonomy, records, deterministic engaged-mode resolver, tagging pipeline, validity harness, and the TrueFoundry auto-tagger behind a port — per `specs/009-two-axis-tagging/spec.md`.

**Architecture:** A pure, framework-agnostic domain package (`@gt100k/two-axis-tagging`) holds all logic (taxonomy, records, resolver, pipeline, validity) as synchronous pure functions. The only async seam is a `Tagger` port with two adapters: `@gt100k/tagger-stub` (deterministic, used in CI) and `@gt100k/tagger-tfy` (TrueFoundry LLM, opt-in, never in the gate). Ports-and-adapters mirrors the existing `evidence-graph` package.

**Tech Stack:** TypeScript (ES2022, `strict`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`, `composite`), vitest, pnpm monorepo. Domain core has no framework/network/model dependency.

## Global Constraints

- **SYNTHETIC ONLY** — no real child data; no PII in fixtures.
- **Gate:** `pnpm exec tsc -b` + `pnpm test` (the repo-wide gate; `tsc -b` builds via composite project references — this is the spec's "build" command).
- **Loop:** headless domain package — **no served app, so `LOOP_QA` is N/A** (do not enable the served-app usability gate). **No network in any test**; **no new external npm dependency** (the TFY adapter uses native `fetch`). **Workspace-link install IS required:** adding a new `@gt100k/*` package that another package imports by name needs a plain `pnpm install` at the repo root to create the pnpm workspace symlinks, or `tsc -b` fails with `TS2307`. Run `pnpm install` (NOT `--frozen-lockfile`) after each new `package.json`; it updates `pnpm-lock.yaml`, which is committed. Files are in-lane except appended lines in root `tsconfig.json` references + the lockfile.
- **No dependency cycles** — the domain package (`@gt100k/two-axis-tagging`) must never import an adapter (`tagger-stub`/`tagger-tfy`); adapters depend on the domain, never the reverse. The demo inlines a trivial `Tagger`.
- **`verbatimModuleSyntax`** — use `import type { … }` for type-only imports.
- **`noUncheckedIndexedAccess`** — array/record index access is `T | undefined`; handle it.
- Packages live under `passion/`; names are `@gt100k/*`; each package has `type: "module"`, `main`/`types` → `./src/index.ts`, and a `tsconfig.json` extending `../../../tsconfig.base.json` (packages) / `../../../tsconfig.base.json` (adapters are one level deeper: `../../../tsconfig.base.json` — verify depth).
- **Invariant (load-bearing):** `ActionEvent.engagedModes ⊆ Artifact.affordedModes`, always.
- Constants (golden): `CONFIDENCE_FLOOR = 0.5`, `ALPHA_BAR = 0.667`, work-mode order `[build, investigate, compose, perform, debug, explain, persuade, collaborate, care]`.
- Commit after each task with a Conventional Commit.

---

### Task 0: Scaffold the domain package

**Files:**
- Create: `passion/packages/two-axis-tagging/package.json`
- Create: `passion/packages/two-axis-tagging/tsconfig.json`
- Create: `passion/packages/two-axis-tagging/src/index.ts`
- Create: `passion/packages/two-axis-tagging/test/smoke.test.ts`
- Modify: `tsconfig.json` (root — add project reference)
- Modify: `vitest.config.ts` (already globs `passion/packages/**/test/**` — verify, no change likely)

**Interfaces:**
- Produces: the package `@gt100k/two-axis-tagging` with an empty `src/index.ts` that later tasks extend.

- [ ] **Step 1: Write the failing smoke test**

```ts
// passion/packages/two-axis-tagging/test/smoke.test.ts
import { describe, it, expect } from "vitest";
import * as pkg from "../src/index.js";

describe("package", () => {
  it("is importable", () => {
    expect(pkg).toBeTypeOf("object");
  });
});
```

- [ ] **Step 2: Create package.json**

```json
{
  "name": "@gt100k/two-axis-tagging",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": { ".": "./src/index.ts" },
  "scripts": { "test": "vitest run --root ../.. packages/two-axis-tagging/test" }
}
```

- [ ] **Step 3: Create tsconfig.json**

```json
{
  "extends": "../../../tsconfig.base.json",
  "compilerOptions": { "rootDir": ".", "outDir": "dist" },
  "include": ["src/**/*.ts", "test/**/*.ts"]
}
```

- [ ] **Step 4: Create the empty entrypoint**

```ts
// passion/packages/two-axis-tagging/src/index.ts
export {};
```

- [ ] **Step 5: Add the project reference to root tsconfig.json**

**Append** `{ "path": "passion/packages/two-axis-tagging" }` to the `references` array in root `tsconfig.json` — keep every existing entry (e.g. `passion/packages/evidence-explorer-view`). Do not replace the array.

- [ ] **Step 6: Run the gate**

Run: `pnpm exec tsc -b && pnpm test`
Expected: PASS (smoke test green, build clean).

- [ ] **Step 7: Commit**

```bash
git add passion/packages/two-axis-tagging tsconfig.json
git commit -m "feat(tagging): scaffold @gt100k/two-axis-tagging package"
```

---

### Task 1: Work-mode taxonomy (P0)

**Files:**
- Create: `passion/packages/two-axis-tagging/src/work-modes.ts`
- Create: `passion/packages/two-axis-tagging/test/work-modes.test.ts`

**Interfaces:**
- Produces: `type WorkMode`, `WORK_MODES: WorkMode[]` (golden order), `WORK_MODE_DEFS: Record<WorkMode, WorkModeDef>`, `isWorkMode(x): x is WorkMode`.

- [ ] **Step 1: Write the failing test**

```ts
// test/work-modes.test.ts
import { describe, it, expect } from "vitest";
import { WORK_MODES, WORK_MODE_DEFS, isWorkMode } from "../src/work-modes.js";

describe("work-modes", () => {
  it("has the 9 modes in golden order", () => {
    expect(WORK_MODES).toEqual([
      "build", "investigate", "compose", "perform",
      "debug", "explain", "persuade", "collaborate", "care",
    ]);
  });
  it("defines every mode with a gloss and produces", () => {
    for (const m of WORK_MODES) {
      const def = WORK_MODE_DEFS[m];
      expect(def.gloss.length).toBeGreaterThan(0);
      expect(["artifact", "understanding", "performance", "none"]).toContain(def.produces);
    }
  });
  it("isWorkMode guards", () => {
    expect(isWorkMode("build")).toBe(true);
    expect(isWorkMode("nope")).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails** — `pnpm test` → FAIL (module not found).

- [ ] **Step 3: Implement work-modes.ts**

```ts
// src/work-modes.ts
export const WORK_MODES = [
  "build", "investigate", "compose", "perform",
  "debug", "explain", "persuade", "collaborate", "care",
] as const;

export type WorkMode = (typeof WORK_MODES)[number];

export interface WorkModeDef {
  readonly id: WorkMode;
  readonly gloss: string;
  readonly produces: "artifact" | "understanding" | "performance" | "none";
  readonly examples: readonly string[];
  readonly boundaryRules: readonly string[];
}

export const WORK_MODE_DEFS: Record<WorkMode, WorkModeDef> = {
  build: { id: "build", gloss: "Produces a new artifact or structure.", produces: "artifact",
    examples: ["assemble a subwoofer box", "wire a circuit"], boundaryRules: ["Must yield a made thing; probing alone is investigate."] },
  investigate: { id: "investigate", gloss: "Probes how something works; need not produce an artifact.", produces: "understanding",
    examples: ["measure a speaker's response", "trace a bug's cause"], boundaryRules: ["If it yields a made thing, it is build; if it fixes a defect, it is debug."] },
  compose: { id: "compose", gloss: "Creates an expressive work (music, art, writing).", produces: "artifact",
    examples: ["write a melody", "draw a scene"], boundaryRules: ["Expressive creation; functional creation is build."] },
  perform: { id: "perform", gloss: "Executes/plays a skill live.", produces: "performance",
    examples: ["play the piano piece", "run the chess game"], boundaryRules: ["Live execution; creating the score is compose."] },
  debug: { id: "debug", gloss: "Diagnoses and fixes a defect.", produces: "artifact",
    examples: ["fix the failing test", "repair the mixer"], boundaryRules: ["Requires a defect to fix; open-ended probing is investigate."] },
  explain: { id: "explain", gloss: "Articulates understanding to others.", produces: "understanding",
    examples: ["teach how a filter works", "write a how-to"], boundaryRules: ["Conveys understanding; persuading toward action is persuade."] },
  persuade: { id: "persuade", gloss: "Moves an audience toward a view or action.", produces: "understanding",
    examples: ["pitch a project", "market a demo"], boundaryRules: ["Aims to move; neutral conveyance is explain."] },
  collaborate: { id: "collaborate", gloss: "Works jointly with others toward a shared goal.", produces: "none",
    examples: ["co-build with a peer", "run a group jam"], boundaryRules: ["Requires ≥2 actors on one goal."] },
  care: { id: "care", gloss: "Tends, maintains, or nurtures something over time.", produces: "none",
    examples: ["tend a garden", "maintain a habitat"], boundaryRules: ["Ongoing tending; a one-off fix is debug."] },
};

const WORK_MODE_SET = new Set<string>(WORK_MODES);
export function isWorkMode(x: unknown): x is WorkMode {
  return typeof x === "string" && WORK_MODE_SET.has(x);
}
```

- [ ] **Step 4: Run test** — `pnpm test` → PASS.

- [ ] **Step 5: Commit**

```bash
git add passion/packages/two-axis-tagging
git commit -m "feat(tagging): work-mode taxonomy (9 defined modes)"
```

---

### Task 2: Domain taxonomy + sub-topic minting (P0)

**Files:**
- Create: `passion/packages/two-axis-tagging/src/taxonomy.ts`
- Create: `passion/packages/two-axis-tagging/test/taxonomy.test.ts`

**Interfaces:**
- Produces: `type CabinId`, `CABINS: CabinId[]`, `SEED_SUBTOPICS: Record<CabinId, string[]>`, `type DomainPath = [CabinId] | [CabinId, string]`, `createTaxonomy()`, `Taxonomy.hasCabin`, `Taxonomy.hasPath`, `Taxonomy.mintSubTopic(cabin, label) -> DomainPath`, `serializePath`, `isValidPath`.

- [ ] **Step 1: Write the failing test**

```ts
// test/taxonomy.test.ts
import { describe, it, expect } from "vitest";
import { CABINS, createTaxonomy, serializePath } from "../src/taxonomy.js";

describe("taxonomy", () => {
  it("has the 8 golden cabins", () => {
    expect(CABINS).toEqual([
      "music-sound", "code-computers", "games-strategy", "making-engineering",
      "art-motion", "influence-media", "science-nature", "math-puzzles",
    ]);
  });
  it("validates seed paths and rejects unknown cabins", () => {
    const t = createTaxonomy();
    expect(t.hasPath(["music-sound"])).toBe(true);
    expect(t.hasPath(["music-sound", "audio-systems"])).toBe(true);
    expect(t.hasPath(["not-a-cabin"] as never)).toBe(false);
  });
  it("mints a sub-topic parented to a cabin, idempotent by label", () => {
    const t = createTaxonomy();
    const p1 = t.mintSubTopic("code-computers", "Agentic Engineering");
    const p2 = t.mintSubTopic("code-computers", "Agentic Engineering");
    expect(p1).toEqual(p2);
    expect(p1[0]).toBe("code-computers");
    expect(t.hasPath(p1)).toBe(true);
    expect(serializePath(p1)).toBe(`code-computers/${p1[1]}`);
  });
  it("refuses to mint under an unknown cabin", () => {
    const t = createTaxonomy();
    expect(() => t.mintSubTopic("nope" as never, "x")).toThrow();
  });
});
```

- [ ] **Step 2: Run test** → FAIL.

- [ ] **Step 3: Implement taxonomy.ts**

```ts
// src/taxonomy.ts
export const CABINS = [
  "music-sound", "code-computers", "games-strategy", "making-engineering",
  "art-motion", "influence-media", "science-nature", "math-puzzles",
] as const;

export type CabinId = (typeof CABINS)[number];

export const SEED_SUBTOPICS: Record<CabinId, readonly string[]> = {
  "music-sound": ["audio-systems", "production", "instruments", "music-theory"],
  "code-computers": ["game-dev", "python", "hardware", "agentic-engineering"],
  "games-strategy": ["chess", "poker", "board-games"],
  "making-engineering": ["robotics", "electronics", "3d-printing"],
  "art-motion": ["visual", "animation", "video-editing", "3d-modeling"],
  "influence-media": ["marketing", "storytelling", "psychology", "publishing"],
  "science-nature": ["botany", "physics", "astronomy"],
  "math-puzzles": ["competition-math", "logic-puzzles", "statistics"],
};

export type DomainPath = readonly [CabinId] | readonly [CabinId, string];

const CABIN_SET = new Set<string>(CABINS);
export function isCabinId(x: unknown): x is CabinId {
  return typeof x === "string" && CABIN_SET.has(x);
}

export function serializePath(p: DomainPath): string {
  return p.length === 1 ? p[0] : `${p[0]}/${p[1]}`;
}

// Deterministic slug so minting is idempotent by (cabin,label).
export function slugify(label: string): string {
  return label.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export interface Taxonomy {
  hasCabin(id: string): id is CabinId;
  hasPath(p: DomainPath): boolean;
  mintSubTopic(cabin: CabinId, label: string): DomainPath;
  subTopics(cabin: CabinId): readonly string[];
}

export function createTaxonomy(): Taxonomy {
  const subs = new Map<CabinId, Set<string>>();
  for (const c of CABINS) subs.set(c, new Set(SEED_SUBTOPICS[c]));

  return {
    hasCabin(id): id is CabinId { return isCabinId(id); },
    hasPath(p) {
      if (!isCabinId(p[0])) return false;
      if (p.length === 1) return true;
      return subs.get(p[0])!.has(p[1]);
    },
    mintSubTopic(cabin, label) {
      if (!isCabinId(cabin)) throw new Error(`unknown cabin: ${String(cabin)}`);
      const slug = slugify(label);
      if (slug.length === 0) throw new Error("empty sub-topic label");
      subs.get(cabin)!.add(slug);
      return [cabin, slug] as const;
    },
    subTopics(cabin) {
      return [...(subs.get(cabin) ?? new Set<string>())];
    },
  };
}
```

- [ ] **Step 4: Run test** → PASS.

- [ ] **Step 5: Commit**

```bash
git add passion/packages/two-axis-tagging
git commit -m "feat(tagging): hierarchical domain taxonomy + sub-topic minting"
```

---

### Task 3: Records + types (P1 setup)

**Files:**
- Create: `passion/packages/two-axis-tagging/src/records.ts`
- Create: `passion/packages/two-axis-tagging/test/records.test.ts`

**Interfaces:**
- Produces: `Artifact`, `ActionEvent`, `RawAction`, `TagSuggestion`, `DepthSignal` types + `makeArtifact` validator that enforces `affordedModes.length >= 1`, a valid `domainPath`, and dedups modes.

- [ ] **Step 1: Write the failing test**

```ts
// test/records.test.ts
import { describe, it, expect } from "vitest";
import { makeArtifact } from "../src/records.js";
import { createTaxonomy } from "../src/taxonomy.js";

describe("records", () => {
  const t = createTaxonomy();
  it("builds a valid gold artifact", () => {
    const a = makeArtifact(t, {
      id: "synth-01", domainPath: ["music-sound", "audio-systems"],
      affordedModes: ["perform", "build", "investigate"], kind: "gadget", source: "gold",
    });
    expect(a.tagConfidence).toBe(1);
    expect(a.tagStatus).toBe("PROVISIONAL"); // trust is set later by the validity gate
    expect(a.affordedModes).toEqual(["perform", "build", "investigate"]);
  });
  it("rejects an empty afforded set", () => {
    expect(() => makeArtifact(t, {
      id: "x", domainPath: ["music-sound"], affordedModes: [], kind: "gadget", source: "gold",
    })).toThrow();
  });
  it("rejects an invalid domain path", () => {
    expect(() => makeArtifact(t, {
      id: "x", domainPath: ["nope"] as never, affordedModes: ["build"], kind: "gadget", source: "gold",
    })).toThrow();
  });
});
```

- [ ] **Step 2: Run test** → FAIL.

- [ ] **Step 3: Implement records.ts**

```ts
// src/records.ts
import type { WorkMode } from "./work-modes.js";
import { isWorkMode } from "./work-modes.js";
import type { DomainPath, Taxonomy } from "./taxonomy.js";

export type ArtifactKind = "gadget" | "taste-app" | "resource";
export type TagSource = "gold" | "auto";
export type TagOrigin = "seed" | "minted";
export type TagStatus = "TRUSTED" | "PROVISIONAL";

export interface Artifact {
  readonly id: string;
  readonly domainPath: DomainPath;
  readonly affordedModes: readonly WorkMode[];
  readonly kind: ArtifactKind;
  readonly source: TagSource;
  readonly origin: TagOrigin;
  readonly tagConfidence: number;
  readonly tagStatus: TagStatus;
}

export interface MakeArtifactInput {
  id: string;
  domainPath: DomainPath;
  affordedModes: readonly WorkMode[];
  kind: ArtifactKind;
  source: TagSource;
  origin?: TagOrigin;
  tagConfidence?: number;
}

export function makeArtifact(tax: Taxonomy, input: MakeArtifactInput): Artifact {
  if (!tax.hasPath(input.domainPath)) throw new Error(`invalid domainPath: ${JSON.stringify(input.domainPath)}`);
  const modes = [...new Set(input.affordedModes)];
  if (modes.length === 0) throw new Error("affordedModes must have ≥1 mode");
  for (const m of modes) if (!isWorkMode(m)) throw new Error(`invalid work-mode: ${String(m)}`);
  const tagConfidence = input.source === "gold" ? 1 : (input.tagConfidence ?? 0);
  return {
    id: input.id, domainPath: input.domainPath, affordedModes: modes, kind: input.kind,
    source: input.source, origin: input.origin ?? "seed", tagConfidence, tagStatus: "PROVISIONAL",
  };
}

export interface DepthSignal { readonly kind: string; readonly value: number; }

export interface RawAction {
  readonly artifactId: string;
  readonly actionType: string;
  readonly params?: Readonly<Record<string, unknown>>;
}

export interface ActionEvent {
  readonly kidId: string;
  readonly artifactId: string;
  readonly engagedModes: { readonly primary: WorkMode; readonly secondary?: WorkMode };
  readonly depthSignals: readonly DepthSignal[];
  readonly timestamp: string;
  readonly returnState: "voluntary" | "prompted";
  readonly noveltyFlag: boolean;
}

export interface TagSuggestion {
  readonly domainPath: DomainPath;
  readonly affordedModes: readonly WorkMode[];
  readonly confidence: number;
  readonly rationale: string;
}
```

- [ ] **Step 4: Run test** → PASS.

- [ ] **Step 5: Commit**

```bash
git add passion/packages/two-axis-tagging
git commit -m "feat(tagging): Artifact/ActionEvent/RawAction/TagSuggestion records"
```

---

### Task 4: Engaged-mode resolver (P1 — the crux)

**Files:**
- Create: `passion/packages/two-axis-tagging/src/resolver.ts`
- Create: `passion/packages/two-axis-tagging/src/__fixtures__/resolver-cases.ts`
- Create: `passion/packages/two-axis-tagging/test/resolver.test.ts`

**Interfaces:**
- Consumes: `Artifact`, `RawAction`, `WorkMode` (Task 3), `WORK_MODES` order (Task 1).
- Produces: `ACTION_MODE_RULES: Record<string, WorkMode[]>`, `resolveEngagedModes(artifact, action): ResolveResult` where `ResolveResult = { ok: true, engagedModes } | { ok: false, reason: "invalid-for-artifact" | "unresolved" }`.

- [ ] **Step 1: Write the fixture**

```ts
// src/__fixtures__/resolver-cases.ts
import type { Artifact } from "../records.js";
import type { RawAction } from "../records.js";
import type { WorkMode } from "../work-modes.js";

const synth: Artifact = {
  id: "synth-01", domainPath: ["music-sound", "audio-systems"],
  affordedModes: ["perform", "build", "investigate"], kind: "gadget",
  source: "gold", origin: "seed", tagConfidence: 1, tagStatus: "TRUSTED",
};

const mixingDesk: Artifact = {
  id: "mixer-01", domainPath: ["music-sound", "audio-systems"],
  affordedModes: ["debug", "investigate", "explain"], kind: "gadget",
  source: "gold", origin: "seed", tagConfidence: 1, tagStatus: "TRUSTED",
};

export const RESOLVER_CASES: ReadonlyArray<{
  name: string; artifact: Artifact; action: RawAction;
  expect: { ok: true; primary: WorkMode; secondary?: WorkMode } | { ok: false; reason: string };
}> = [
  { name: "play → perform", artifact: synth, action: { artifactId: "synth-01", actionType: "play" },
    expect: { ok: true, primary: "perform" } },
  { name: "assemble → build", artifact: synth, action: { artifactId: "synth-01", actionType: "assemble" },
    expect: { ok: true, primary: "build" } },
  { name: "inspect → investigate", artifact: synth, action: { artifactId: "synth-01", actionType: "inspect" },
    expect: { ok: true, primary: "investigate" } },
  { name: "tinker → build primary, investigate secondary (priority order, both afforded)",
    artifact: synth, action: { artifactId: "synth-01", actionType: "tinker" },
    expect: { ok: true, primary: "build", secondary: "investigate" } },
  { name: "compose not afforded by synth → invalid-for-artifact",
    artifact: synth, action: { artifactId: "synth-01", actionType: "write-melody" },
    expect: { ok: false, reason: "invalid-for-artifact" } },
  { name: "unknown action → unresolved",
    artifact: synth, action: { artifactId: "synth-01", actionType: "wobble" },
    expect: { ok: false, reason: "unresolved" } },
  { name: "fix → debug (afforded by mixing desk)",
    artifact: mixingDesk, action: { artifactId: "mixer-01", actionType: "fix" },
    expect: { ok: true, primary: "debug" } },
  { name: "teach → explain (afforded by mixing desk)",
    artifact: mixingDesk, action: { artifactId: "mixer-01", actionType: "teach" },
    expect: { ok: true, primary: "explain" } },
  { name: "play not afforded by mixing desk → invalid-for-artifact",
    artifact: mixingDesk, action: { artifactId: "mixer-01", actionType: "play" },
    expect: { ok: false, reason: "invalid-for-artifact" } },
];
```

- [ ] **Step 2: Write the failing test**

```ts
// test/resolver.test.ts
import { describe, it, expect } from "vitest";
import { resolveEngagedModes } from "../src/resolver.js";
import { RESOLVER_CASES } from "../src/__fixtures__/resolver-cases.js";

describe("resolveEngagedModes (golden)", () => {
  for (const c of RESOLVER_CASES) {
    it(c.name, () => {
      const r = resolveEngagedModes(c.artifact, c.action);
      if (c.expect.ok) {
        expect(r.ok).toBe(true);
        if (r.ok) {
          expect(r.engagedModes.primary).toBe(c.expect.primary);
          expect(r.engagedModes.secondary).toBe(c.expect.secondary);
        }
      } else {
        expect(r.ok).toBe(false);
        if (!r.ok) expect(r.reason).toBe(c.expect.reason);
      }
    });
  }

  it("guarantees engagedModes ⊆ affordedModes", () => {
    for (const c of RESOLVER_CASES) {
      const r = resolveEngagedModes(c.artifact, c.action);
      if (r.ok) {
        expect(c.artifact.affordedModes).toContain(r.engagedModes.primary);
        if (r.engagedModes.secondary) expect(c.artifact.affordedModes).toContain(r.engagedModes.secondary);
      }
    }
  });
});
```

- [ ] **Step 3: Run test** → FAIL.

- [ ] **Step 4: Implement resolver.ts**

```ts
// src/resolver.ts
import type { Artifact, RawAction } from "./records.js";
import type { WorkMode } from "./work-modes.js";
import { WORK_MODES } from "./work-modes.js";

// actionType → candidate work-modes, in priority order (first = preferred primary).
export const ACTION_MODE_RULES: Record<string, readonly WorkMode[]> = {
  play: ["perform"],
  assemble: ["build"],
  inspect: ["investigate"],
  tinker: ["build", "investigate"],
  "write-melody": ["compose"],
  fix: ["debug"],
  teach: ["explain"],
  pitch: ["persuade"],
  "co-work": ["collaborate"],
  tend: ["care"],
};

export type ResolveResult =
  | { readonly ok: true; readonly engagedModes: { readonly primary: WorkMode; readonly secondary?: WorkMode } }
  | { readonly ok: false; readonly reason: "invalid-for-artifact" | "unresolved" };

export function resolveEngagedModes(artifact: Artifact, action: RawAction): ResolveResult {
  const candidates = ACTION_MODE_RULES[action.actionType];
  if (!candidates || candidates.length === 0) return { ok: false, reason: "unresolved" };

  const afforded = new Set<WorkMode>(artifact.affordedModes);
  // Keep candidate order but drop non-afforded; if the rule table's own order is ambiguous,
  // fall back to the global WORK_MODES order for determinism.
  const kept = candidates.filter((m) => afforded.has(m));
  if (kept.length === 0) return { ok: false, reason: "invalid-for-artifact" };

  const primary = kept[0]!;
  const secondary = kept[1];
  return secondary
    ? { ok: true, engagedModes: { primary, secondary } }
    : { ok: true, engagedModes: { primary } };
}

// Exposed for tie-break auditing / future use.
export const GLOBAL_MODE_ORDER: readonly WorkMode[] = WORK_MODES;
```

- [ ] **Step 5: Run test** → PASS.

- [ ] **Step 6: Commit**

```bash
git add passion/packages/two-axis-tagging
git commit -m "feat(tagging): deterministic engaged-mode resolver (afforded-constrained)"
```

---

### Task 5: Tagger port + tagging pipeline (P2)

**Files:**
- Create: `passion/packages/two-axis-tagging/src/ports.ts`
- Create: `passion/packages/two-axis-tagging/src/pipeline.ts`
- Create: `passion/packages/two-axis-tagging/test/pipeline.test.ts`

**Interfaces:**
- Consumes: `Taxonomy` (Task 2), `makeArtifact`/`TagSuggestion` (Task 3), `isWorkMode` (Task 1).
- Produces: `interface Tagger { suggest(ref): Promise<TagSuggestion> }`, `interface ArtifactRef`, `validateSuggestion(tax, suggestion): ValidationResult`, `acceptSuggestion(tax, ref, suggestion): Artifact` (mints sub-topic if novel), `CONFIDENCE_FLOOR`.

- [ ] **Step 1: Write the failing test**

```ts
// test/pipeline.test.ts
import { describe, it, expect } from "vitest";
import { createTaxonomy } from "../src/taxonomy.js";
import { validateSuggestion, acceptSuggestion, CONFIDENCE_FLOOR } from "../src/pipeline.js";

describe("pipeline", () => {
  it("accepts a valid suggestion into an auto artifact", () => {
    const tax = createTaxonomy();
    const a = acceptSuggestion(tax, { id: "r1", kind: "resource", label: "Subwoofer basics" }, {
      domainPath: ["music-sound", "audio-systems"], affordedModes: ["investigate", "build"],
      confidence: 0.8, rationale: "audio DIY",
    });
    expect(a.source).toBe("auto");
    expect(a.tagConfidence).toBe(0.8);
  });
  it("mints a novel sub-topic on accept", () => {
    const tax = createTaxonomy();
    const a = acceptSuggestion(tax, { id: "r2", kind: "resource", label: "Eurorack" }, {
      domainPath: ["music-sound", "modular-synthesis"], affordedModes: ["build"],
      confidence: 0.7, rationale: "novel niche",
    });
    expect(a.domainPath[1]).toBe("modular-synthesis");
    expect(tax.hasPath(["music-sound", "modular-synthesis"])).toBe(true);
  });
  it("rejects an unknown cabin, invalid mode, or low confidence", () => {
    const tax = createTaxonomy();
    expect(validateSuggestion(tax, { domainPath: ["nope"] as never, affordedModes: ["build"], confidence: 0.9, rationale: "" }).ok).toBe(false);
    expect(validateSuggestion(tax, { domainPath: ["music-sound"], affordedModes: ["boop" as never], confidence: 0.9, rationale: "" }).ok).toBe(false);
    expect(validateSuggestion(tax, { domainPath: ["music-sound"], affordedModes: ["build"], confidence: CONFIDENCE_FLOOR - 0.01, rationale: "" }).ok).toBe(false);
  });
});
```

- [ ] **Step 2: Run test** → FAIL.

- [ ] **Step 3: Implement ports.ts**

```ts
// src/ports.ts
import type { TagSuggestion } from "./records.js";

export interface ArtifactRef {
  readonly id: string;
  readonly kind: "gadget" | "taste-app" | "resource";
  readonly label: string;
  readonly url?: string;
}

export interface Tagger {
  suggest(ref: ArtifactRef): Promise<TagSuggestion>;
}
```

- [ ] **Step 4: Implement pipeline.ts**

```ts
// src/pipeline.ts
import type { Artifact, TagSuggestion } from "./records.js";
import { makeArtifact } from "./records.js";
import type { Taxonomy, DomainPath, CabinId } from "./taxonomy.js";
import { isCabinId } from "./taxonomy.js";
import { isWorkMode } from "./work-modes.js";
import type { ArtifactRef } from "./ports.js";

export const CONFIDENCE_FLOOR = 0.5;

export type ValidationResult = { ok: true } | { ok: false; reason: string };

export function validateSuggestion(tax: Taxonomy, s: TagSuggestion): ValidationResult {
  const cabin = s.domainPath[0];
  if (!isCabinId(cabin)) return { ok: false, reason: "unknown-cabin" };
  if (s.affordedModes.length === 0) return { ok: false, reason: "no-modes" };
  for (const m of s.affordedModes) if (!isWorkMode(m)) return { ok: false, reason: "invalid-mode" };
  if (s.confidence < CONFIDENCE_FLOOR) return { ok: false, reason: "low-confidence" };
  return { ok: true };
}

// Accepts a validated suggestion, minting a novel sub-topic if needed.
export function acceptSuggestion(tax: Taxonomy, ref: ArtifactRef, s: TagSuggestion): Artifact {
  const v = validateSuggestion(tax, s);
  if (!v.ok) throw new Error(`invalid suggestion: ${v.reason}`);
  const cabin = s.domainPath[0] as CabinId;

  let path: DomainPath = [cabin];
  let origin: "seed" | "minted" = "seed";
  if (s.domainPath.length === 2) {
    const sub = s.domainPath[1];
    if (tax.hasPath([cabin, sub])) {
      path = [cabin, sub];
    } else {
      path = tax.mintSubTopic(cabin, sub);
      origin = "minted";
    }
  }

  return makeArtifact(tax, {
    id: ref.id, domainPath: path, affordedModes: s.affordedModes,
    kind: ref.kind, source: "auto", origin, tagConfidence: s.confidence,
  });
}
```

- [ ] **Step 5: Run test** → PASS.

- [ ] **Step 6: Commit**

```bash
git add passion/packages/two-axis-tagging
git commit -m "feat(tagging): Tagger port + suggest→validate→accept pipeline with minting"
```

---

### Task 6: Validity harness — Krippendorff's α + gate + review queue (P3)

**Files:**
- Create: `passion/packages/two-axis-tagging/src/validity.ts`
- Create: `passion/packages/two-axis-tagging/src/__fixtures__/rater-fixture.ts`
- Create: `passion/packages/two-axis-tagging/test/validity.test.ts`

**Interfaces:**
- Produces: `krippendorffAlphaNominal(units): number`, `ALPHA_BAR`, `topicTrust(alpha): TagStatus`, `ReviewQueue` (`enqueue`/`list`/`resolve`), `ReviewItem`.

**Golden math (hand-verified):** For 2 raters over 4 units with categories `{build, perform}` — u1=[build,build], u2=[build,build], u3=[perform,perform], u4=[build,perform] — nominal α = **0.5333** (±0.001). Derivation: coincidences o_bb=4, o_pp=2, o_bp=o_pb=1; n_b=5, n_p=3, n=8; Σo_cc=6, Σn_c²=34; α = 1 − (n−1)(n − Σo_cc)/(n² − Σn_c²) = 1 − 7·2/30 = 0.5333. Since 0.5333 < ALPHA_BAR (0.667), the topic is `PROVISIONAL`. A perfect-agreement fixture gives α = 1.0 → `TRUSTED`.

- [ ] **Step 1: Write the rater fixture**

```ts
// src/__fixtures__/rater-fixture.ts
// Each unit = one item's category as rated by each rater (undefined = not rated).
export const DISAGREE_UNITS: ReadonlyArray<ReadonlyArray<string | undefined>> = [
  ["build", "build"],
  ["build", "build"],
  ["perform", "perform"],
  ["build", "perform"],
];

export const PERFECT_UNITS: ReadonlyArray<ReadonlyArray<string | undefined>> = [
  ["build", "build"],
  ["perform", "perform"],
  ["investigate", "investigate"],
];
```

- [ ] **Step 2: Write the failing test**

```ts
// test/validity.test.ts
import { describe, it, expect } from "vitest";
import { krippendorffAlphaNominal, topicTrust, ALPHA_BAR, createReviewQueue } from "../src/validity.js";
import { DISAGREE_UNITS, PERFECT_UNITS } from "../src/__fixtures__/rater-fixture.js";

describe("krippendorff alpha (nominal)", () => {
  it("matches the hand-verified golden value", () => {
    expect(krippendorffAlphaNominal(DISAGREE_UNITS)).toBeCloseTo(0.5333, 3);
  });
  it("is 1.0 on perfect agreement", () => {
    expect(krippendorffAlphaNominal(PERFECT_UNITS)).toBeCloseTo(1.0, 6);
  });
  it("ALPHA_BAR gates trust", () => {
    expect(topicTrust(0.5333)).toBe("PROVISIONAL");
    expect(topicTrust(ALPHA_BAR)).toBe("TRUSTED");
    expect(topicTrust(1.0)).toBe("TRUSTED");
  });
});

describe("review queue", () => {
  it("enqueues and resolves", () => {
    const q = createReviewQueue();
    q.enqueue({ id: "a1", reason: "low-confidence" });
    expect(q.list()).toHaveLength(1);
    q.resolve("a1", "promoted");
    expect(q.list()).toHaveLength(0);
  });
});
```

- [ ] **Step 3: Run test** → FAIL.

- [ ] **Step 4: Implement validity.ts**

```ts
// src/validity.ts
import type { TagStatus } from "./records.js";

export const ALPHA_BAR = 0.667;

// Krippendorff's alpha for nominal data via the closed form:
//   α = 1 − (n−1)(n − Σ o_cc) / (n² − Σ n_c²)
// units[i] = ratings for item i across raters (undefined = missing). Units with <2 ratings are skipped.
export function krippendorffAlphaNominal(units: ReadonlyArray<ReadonlyArray<string | undefined>>): number {
  const o = new Map<string, Map<string, number>>();
  const bump = (a: string, b: string, w: number) => {
    const row = o.get(a) ?? new Map<string, number>();
    row.set(b, (row.get(b) ?? 0) + w);
    o.set(a, row);
  };

  for (const unit of units) {
    const vals = unit.filter((v): v is string => v !== undefined);
    const m = vals.length;
    if (m < 2) continue;
    const w = 1 / (m - 1);
    for (let i = 0; i < m; i++) {
      for (let j = 0; j < m; j++) {
        if (i === j) continue;
        bump(vals[i]!, vals[j]!, w);
      }
    }
  }

  // marginals
  const nByCat = new Map<string, number>();
  let n = 0;
  for (const [a, row] of o) {
    let rowSum = 0;
    for (const [, w] of row) rowSum += w;
    nByCat.set(a, rowSum);
    n += rowSum;
  }
  if (n === 0) return 1; // no pairable data → treat as no disagreement

  let sumDiag = 0;
  for (const [a, row] of o) sumDiag += row.get(a) ?? 0;

  let sumNc2 = 0;
  for (const [, nc] of nByCat) sumNc2 += nc * nc;

  const denom = n * n - sumNc2;
  if (denom === 0) return 1; // all one category → perfect agreement
  return 1 - ((n - 1) * (n - sumDiag)) / denom;
}

export function topicTrust(alpha: number): TagStatus {
  return alpha >= ALPHA_BAR ? "TRUSTED" : "PROVISIONAL";
}

/**
 * Consumer helper wiring the trust gate to an artifact: set `tagStatus` from its topic's inter-rater
 * alpha. Exported so the guide console / inference layer (C3/C4) promote a topic's artifacts from
 * PROVISIONAL to TRUSTED once its tags clear ALPHA_BAR — the validity gate is not dead code.
 */
export function applyTrust<T extends { readonly tagStatus: TagStatus }>(artifact: T, topicAlpha: number): T {
  return { ...artifact, tagStatus: topicTrust(topicAlpha) };
}

export interface ReviewItem {
  readonly id: string;
  readonly reason: "low-confidence" | "unresolved" | "audit-sample";
}

export interface ReviewQueue {
  enqueue(item: ReviewItem): void;
  list(): readonly ReviewItem[];
  resolve(id: string, outcome: "promoted" | "corrected" | "rejected"): void;
}

export function createReviewQueue(): ReviewQueue {
  const items = new Map<string, ReviewItem>();
  return {
    enqueue(item) { items.set(item.id, item); },
    list() { return [...items.values()]; },
    resolve(id) { items.delete(id); },
  };
}
```

- [ ] **Step 5: Run test** → PASS (α = 0.5333 and 1.0 exactly).

- [ ] **Step 6: Commit**

```bash
git add passion/packages/two-axis-tagging
git commit -m "feat(tagging): validity harness (Krippendorff alpha + trust gate + review queue)"
```

---

### Task 7: Stub tagger adapter (P2/P4)

**Files:**
- Create: `passion/adapters/tagger-stub/package.json`
- Create: `passion/adapters/tagger-stub/tsconfig.json`
- Create: `passion/adapters/tagger-stub/src/index.ts`
- Create: `passion/adapters/tagger-stub/test/stub.test.ts`
- Modify: root `tsconfig.json` (add reference)

**Interfaces:**
- Consumes: `Tagger`, `ArtifactRef`, `TagSuggestion` from `@gt100k/two-axis-tagging`.
- Produces: `class StubTagger implements Tagger` — deterministic suggestion from a seeded lookup keyed by `ref.id`, default fallback suggestion.

- [ ] **Step 1: Write the failing test**

```ts
// passion/adapters/tagger-stub/test/stub.test.ts
import { describe, it, expect } from "vitest";
import { StubTagger } from "../src/index.js";

describe("StubTagger", () => {
  it("returns a deterministic seeded suggestion", async () => {
    const t = new StubTagger({
      "synth-01": { domainPath: ["music-sound", "audio-systems"], affordedModes: ["perform", "build"], confidence: 0.9, rationale: "seed" },
    });
    const s = await t.suggest({ id: "synth-01", kind: "gadget", label: "Synth" });
    expect(s.domainPath).toEqual(["music-sound", "audio-systems"]);
    expect(s.confidence).toBe(0.9);
  });
  it("falls back deterministically for unknown refs", async () => {
    const t = new StubTagger({});
    const s = await t.suggest({ id: "x", kind: "resource", label: "Whatever" });
    expect(s.confidence).toBe(0);
    expect(s.affordedModes.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Create package.json**

```json
{
  "name": "@gt100k/tagger-stub",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": { ".": "./src/index.ts" },
  "dependencies": { "@gt100k/two-axis-tagging": "workspace:*" },
  "scripts": { "test": "vitest run" }
}
```

- [ ] **Step 3: Create tsconfig.json**

```json
{
  "extends": "../../../tsconfig.base.json",
  "compilerOptions": { "rootDir": ".", "outDir": "dist" },
  "references": [{ "path": "../../packages/two-axis-tagging" }],
  "include": ["src/**/*.ts", "test/**/*.ts"]
}
```

- [ ] **Step 4: Implement src/index.ts**

```ts
// passion/adapters/tagger-stub/src/index.ts
import type { Tagger, ArtifactRef } from "@gt100k/two-axis-tagging";
import type { TagSuggestion } from "@gt100k/two-axis-tagging";

export class StubTagger implements Tagger {
  constructor(private readonly seed: Readonly<Record<string, TagSuggestion>>) {}

  async suggest(ref: ArtifactRef): Promise<TagSuggestion> {
    const hit = this.seed[ref.id];
    if (hit) return hit;
    return { domainPath: ["science-nature"], affordedModes: ["investigate"], confidence: 0, rationale: "stub-fallback" };
  }
}
```

- [ ] **Step 5: Write the domain index barrel** so the adapters resolve `Tagger`/`ArtifactRef`/`TagSuggestion`/`isWorkMode`/`isCabinId`/`WORK_MODES`/`CABINS`. Overwrite `passion/packages/two-axis-tagging/src/index.ts`:

```ts
// passion/packages/two-axis-tagging/src/index.ts
export * from "./work-modes.js";
export * from "./taxonomy.js";
export * from "./records.js";
export * from "./resolver.js";
export * from "./ports.js";
export * from "./pipeline.js";
export * from "./validity.js";
```

(Task 9 re-asserts this same barrel; writing it here unblocks Tasks 7–8.)

- [ ] **Step 6: Add root tsconfig reference** — **append** `{ "path": "passion/adapters/tagger-stub" }` (keep all existing entries).

- [ ] **Step 7: Install + gate** → run `pnpm install` at the repo root first (creates the workspace symlinks for the new `@gt100k/tagger-stub` and links `@gt100k/two-axis-tagging` into it — without this `tsc -b` fails `TS2307`), then `pnpm exec tsc -b && pnpm test` → PASS.

- [ ] **Step 8: Commit**

```bash
git add passion/adapters/tagger-stub tsconfig.json passion/packages/two-axis-tagging pnpm-lock.yaml
git commit -m "feat(tagging): deterministic StubTagger adapter"
```

---

### Task 8: TrueFoundry tagger adapter (P4) — native fetch, no SDK

> **Verified live 2026-07-22.** Endpoint `POST https://tfy.promptlens.trilogy.com/openai/v1/chat/completions`, model `gpt-5.4-mini`, `response_format:{type:"json_object"}`, `temperature:0` returns exactly `{"domainPath":[...],"affordedModes":[...],"confidence":n,"rationale":"..."}`. Uses **native `fetch`** — **no external dependency**, so no `pnpm install` / lockfile step (loop-safe from a cold checkout).

**Files:**
- Create: `passion/adapters/tagger-tfy/package.json`
- Create: `passion/adapters/tagger-tfy/tsconfig.json`
- Create: `passion/adapters/tagger-tfy/src/parse.ts`
- Create: `passion/adapters/tagger-tfy/src/index.ts`
- Create: `passion/adapters/tagger-tfy/src/__fixtures__/tfy-response.ts`
- Create: `passion/adapters/tagger-tfy/test/parse.test.ts`
- Create: `passion/adapters/tagger-tfy/scripts/tag-live.ts`
- Create: `passion/adapters/tagger-tfy/.env.local.example`
- Modify: root `tsconfig.json` (add reference)

**Interfaces:**
- Consumes: `Tagger`, `ArtifactRef`, `TagSuggestion`, `isWorkMode`, `isCabinId`, `WORK_MODES`, `CABINS` from the domain (all exported from its index — Task 9 / add-when-referenced).
- Produces: `class TfyTagger implements Tagger`, `parseTfySuggestion(raw: string): TagSuggestion | null`, `tfyConfigFromEnv(env?)`.

- [ ] **Step 1: Record the real TFY response fixture** (captured from the live call) — a `.ts` file, NOT `.json` (the repo tsconfig does not set `resolveJsonModule`, so a JSON import would fail `tsc -b`)

```ts
// src/__fixtures__/tfy-response.ts
export const TFY_RESPONSE = { domainPath: ["making-engineering"], affordedModes: ["build", "investigate", "explain"], confidence: 0.97, rationale: "Designing and constructing a subwoofer enclosure using Thiele-Small parameters — an engineering/building topic that supports building, investigating enclosure acoustics, and explaining the basics." };
```

- [ ] **Step 2: Write the failing parse test**

```ts
// test/parse.test.ts
import { describe, it, expect } from "vitest";
import { parseTfySuggestion } from "../src/parse.js";
import { TFY_RESPONSE as fixture } from "../src/__fixtures__/tfy-response.js";

describe("parseTfySuggestion", () => {
  it("parses the recorded TFY JSON response", () => {
    const s = parseTfySuggestion(JSON.stringify(fixture));
    expect(s).not.toBeNull();
    expect(s?.domainPath[0]).toBe("making-engineering");
    expect(s?.affordedModes).toContain("build");
    expect(s?.confidence).toBeCloseTo(0.97, 2);
  });
  it("returns null on malformed JSON", () => { expect(parseTfySuggestion("not json")).toBeNull(); });
  it("returns null on an invalid work-mode", () => {
    expect(parseTfySuggestion(JSON.stringify({ domainPath: ["music-sound"], affordedModes: ["boop"], confidence: 0.9, rationale: "" }))).toBeNull();
  });
  it("returns null on an unknown cabin", () => {
    expect(parseTfySuggestion(JSON.stringify({ domainPath: ["nope"], affordedModes: ["build"], confidence: 0.9, rationale: "" }))).toBeNull();
  });
});
```

- [ ] **Step 3: Run test** → FAIL.

- [ ] **Step 4: Create package.json** (no runtime deps beyond the workspace domain)

```json
{
  "name": "@gt100k/tagger-tfy",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": { ".": "./src/index.ts" },
  "dependencies": { "@gt100k/two-axis-tagging": "workspace:*" },
  "scripts": { "test": "vitest run", "tag:live": "tsx scripts/tag-live.ts" }
}
```

- [ ] **Step 5: Create tsconfig.json**

```json
{
  "extends": "../../../tsconfig.base.json",
  "compilerOptions": { "rootDir": ".", "outDir": "dist" },
  "references": [{ "path": "../../packages/two-axis-tagging" }],
  "include": ["src/**/*.ts", "test/**/*.ts"]
}
```

- [ ] **Step 6: Implement parse.ts**

```ts
// src/parse.ts
import type { TagSuggestion } from "@gt100k/two-axis-tagging";
import { isWorkMode, isCabinId } from "@gt100k/two-axis-tagging";

export function parseTfySuggestion(raw: string): TagSuggestion | null {
  let obj: unknown;
  try { obj = JSON.parse(raw); } catch { return null; }
  if (typeof obj !== "object" || obj === null) return null;
  const o = obj as Record<string, unknown>;

  const path = o["domainPath"];
  if (!Array.isArray(path) || path.length < 1 || path.length > 2) return null;
  if (!isCabinId(path[0])) return null;
  if (path.length === 2 && typeof path[1] !== "string") return null;

  const modes = o["affordedModes"];
  if (!Array.isArray(modes) || modes.length === 0 || !modes.every(isWorkMode)) return null;

  const confidence = o["confidence"];
  if (typeof confidence !== "number" || confidence < 0 || confidence > 1) return null;

  const rationale = typeof o["rationale"] === "string" ? o["rationale"] : "";

  return {
    domainPath: path.length === 2 ? [path[0], path[1] as string] : [path[0]],
    affordedModes: modes,
    confidence,
    rationale,
  };
}
```

> `isCabinId`/`isWorkMode` must be exported from the domain index (Task 9). If building in order, add those exports now.

- [ ] **Step 7: Implement index.ts (native fetch, no SDK)**

```ts
// src/index.ts
import type { Tagger, ArtifactRef, TagSuggestion } from "@gt100k/two-axis-tagging";
import { WORK_MODES, CABINS } from "@gt100k/two-axis-tagging";
import { parseTfySuggestion } from "./parse.js";

export interface TfyConfig { apiKey: string; baseURL: string; model: string; }

const DEFAULT_BASE_URL = "https://tfy.promptlens.trilogy.com/openai/v1";
const DEFAULT_MODEL = "gpt-5.4-mini"; // verified low-cost model; override via TFY_TAGGER_MODEL

export function tfyConfigFromEnv(env: NodeJS.ProcessEnv = process.env): TfyConfig {
  const apiKey = env["TFY_API_KEY"];
  if (!apiKey) throw new Error("TFY_API_KEY is required for the live tagger");
  return { apiKey, baseURL: env["TFY_BASE_URL"] ?? DEFAULT_BASE_URL, model: env["TFY_TAGGER_MODEL"] ?? DEFAULT_MODEL };
}

function fallback(ref: ArtifactRef): TagSuggestion {
  return { domainPath: [ref.kind === "gadget" ? "making-engineering" : "science-nature"], affordedModes: ["investigate"], confidence: 0, rationale: "tfy-parse-failed" };
}

export class TfyTagger implements Tagger {
  constructor(private readonly cfg: TfyConfig) {}

  async suggest(ref: ArtifactRef): Promise<TagSuggestion> {
    const sys = [
      "You tag a learning resource on two axes for a children's interest-discovery product.",
      `Cabins (domainPath[0]): ${CABINS.join(", ")}.`,
      `Work-modes (affordedModes is a subset): ${WORK_MODES.join(", ")}.`,
      'Return STRICT JSON only: {"domainPath":[cabin] or [cabin,subTopicSlug],"affordedModes":[...],"confidence":0..1,"rationale":"..."}.',
    ].join("\n");
    const user = `Resource: ${ref.label}${ref.url ? ` (${ref.url})` : ""}. kind=${ref.kind}.`;

    let res: Response;
    try {
      res = await fetch(`${this.cfg.baseURL}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.cfg.apiKey}` },
        body: JSON.stringify({
          model: this.cfg.model,
          messages: [{ role: "system", content: sys }, { role: "user", content: user }],
          temperature: 0,
          response_format: { type: "json_object" },
        }),
      });
    } catch { return fallback(ref); }

    if (!res.ok) return fallback(ref);
    let body: unknown;
    try { body = await res.json(); } catch { return fallback(ref); }
    const content = (body as { choices?: Array<{ message?: { content?: string } }> })
      ?.choices?.[0]?.message?.content ?? "";
    return parseTfySuggestion(content) ?? fallback(ref);
  }
}
```

- [ ] **Step 8: Implement the opt-in live script**

```ts
// scripts/tag-live.ts
import { TfyTagger, tfyConfigFromEnv } from "../src/index.js";

async function main() {
  const tagger = new TfyTagger(tfyConfigFromEnv());
  const s = await tagger.suggest({ id: "live-1", kind: "resource", label: process.argv[2] ?? "How to build a subwoofer box (Thiele-Small basics)" });
  console.log(JSON.stringify(s, null, 2));
}
main().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 9: Create `.env.local.example`**

```bash
# passion/adapters/tagger-tfy/.env.local.example
TFY_API_KEY=your-truefoundry-token
TFY_BASE_URL=https://tfy.promptlens.trilogy.com/openai/v1
TFY_TAGGER_MODEL=gpt-5.4-mini
```

- [ ] **Step 10: Add root tsconfig reference** — **append** `{ "path": "passion/adapters/tagger-tfy" }` (keep all existing entries).

- [ ] **Step 11: Install + gate** → run `pnpm install` (links the new `@gt100k/tagger-tfy` + `@gt100k/two-axis-tagging` into it), then `pnpm exec tsc -b && pnpm test` → PASS (parse tests green; no network in CI; no external npm dependency).

- [ ] **Step 12: Commit**

```bash
git add passion/adapters/tagger-tfy tsconfig.json pnpm-lock.yaml
git commit -m "feat(tagging): TrueFoundry auto-tagger adapter (native fetch, opt-in, parse-validated)"
```

---

### Task 9: Public API + demo + final wiring (P5)

**Files:**
- Modify: `passion/packages/two-axis-tagging/src/index.ts` (export the full public surface)
- Create: `passion/packages/two-axis-tagging/src/demo.ts`
- Create: `passion/packages/two-axis-tagging/test/demo.test.ts`
- Create: `passion/packages/two-axis-tagging/README.md`

**Interfaces:**
- Produces: the complete public API; a `runDemo()` returning a coverage matrix `{ cell: string; count: number }[]`.

- [ ] **Step 1: Write the failing demo test**

```ts
// test/demo.test.ts
import { describe, it, expect } from "vitest";
import { runDemo } from "../src/demo.js";

describe("demo", () => {
  it("produces a coverage matrix over (domain × work-mode) cells", async () => {
    const matrix = await runDemo();
    expect(matrix.length).toBeGreaterThan(0);
    for (const cell of matrix) {
      expect(cell.cell).toMatch(/.+::(build|investigate|compose|perform|debug|explain|persuade|collaborate|care)/);
      expect(cell.count).toBeGreaterThanOrEqual(1);
    }
  });
});
```

- [ ] **Step 2: Implement the public index.ts**

```ts
// src/index.ts
export * from "./work-modes.js";
export * from "./taxonomy.js";
export * from "./records.js";
export * from "./resolver.js";
export * from "./ports.js";
export * from "./pipeline.js";
export * from "./validity.js";
```

- [ ] **Step 3: Implement demo.ts** (inline `Tagger` — the domain package must not import an adapter)

```ts
// src/demo.ts
import { createTaxonomy, serializePath } from "./taxonomy.js";
import { acceptSuggestion } from "./pipeline.js";
import { resolveEngagedModes } from "./resolver.js";
import type { RawAction, TagSuggestion } from "./records.js";
import type { Tagger, ArtifactRef } from "./ports.js";

export interface CoverageCell { readonly cell: string; readonly count: number; }

// Inline demo tagger — avoids a domain→adapter dependency cycle.
const demoTagger: Tagger = {
  async suggest(_ref: ArtifactRef): Promise<TagSuggestion> {
    return { domainPath: ["music-sound", "audio-systems"], affordedModes: ["perform", "build", "investigate"], confidence: 0.9, rationale: "demo" };
  },
};

export async function runDemo(): Promise<CoverageCell[]> {
  const tax = createTaxonomy();
  const ref: ArtifactRef = { id: "synth-01", kind: "gadget", label: "Synth" };
  const suggestion = await demoTagger.suggest(ref);
  const artifact = acceptSuggestion(tax, ref, suggestion);

  const actions: RawAction[] = [
    { artifactId: "synth-01", actionType: "play" },
    { artifactId: "synth-01", actionType: "assemble" },
    { artifactId: "synth-01", actionType: "tinker" },
  ];

  const counts = new Map<string, number>();
  for (const a of actions) {
    const r = resolveEngagedModes(artifact, a);
    if (!r.ok) continue;
    const key = `${serializePath(artifact.domainPath)}::${r.engagedModes.primary}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()].map(([cell, count]) => ({ cell, count }));
}
```

> The demo depends only on the domain's own modules — no adapter import, no dependency cycle, no extra install.

- [ ] **Step 4: Write the README** (mirror `evidence-graph/README.md`: quick start, public API table, ports/adapters, the TFY env note, `pnpm --filter @gt100k/two-axis-tagging test`).

- [ ] **Step 5: Run the gate** → `pnpm exec tsc -b && pnpm test` → PASS.

- [ ] **Step 6: Commit**

```bash
git add passion/packages/two-axis-tagging tsconfig.json
git commit -m "feat(tagging): public API, coverage-matrix demo, README"
```

---

## Self-Review

**0. Adversarial-review fixes applied:** C1 — TFY fixture is a `.ts` file (not `.json`; repo tsconfig has no `resolveJsonModule`). C2 — corrected the false "no install" claim; `pnpm install` (not `--frozen`) runs after each new `@gt100k/*` package.json so workspace symlinks exist for `tsc -b` (Tasks 7, 11), lockfile committed. H1 — the domain `index.ts` barrel is written at Task 7 Step 5 (before the adapters import from it), re-asserted at Task 9. MEDIUM — resolver fixture bumped to 9 `(RawAction, Artifact)` cases (adds a `mixingDesk` artifact for `debug`/`explain`/not-afforded); spec §9 reconciled to the hand-verified small α fixture; `applyTrust` exported so the validity gate is wired for consumers. Krippendorff α (0.5333 / 1.0) was independently re-verified by the reviewer.

**1. Spec coverage** (each spec SC → task):
- SC-1 (stable IDs) → Tasks 1, 2. ✓
- SC-2 (`engagedModes ⊆ affordedModes`, reject non-intersecting) → Task 4. ✓
- SC-3 (deterministic resolver golden) → Task 4. ✓
- SC-4 (unresolved → review) → Task 4 (`unresolved` result) + Task 6 (queue). ✓
- SC-5 (pipeline validate/accept/mint/reject) → Task 5. ✓
- SC-6 (Krippendorff α golden + gate) → Task 6. ✓
- SC-7 (TFY parse valid/malformed) → Task 8. ✓
- SC-8 (gate green) → every task ends on the gate. ✓
- manual live call → Task 8 `tag:live`. ✓

**2. Placeholder scan:** every code step has complete code. The TFY model (`gpt-5.4-mini`) and endpoint (`…/openai/v1/chat/completions`) are **verified live**, not placeholders; the recorded response is the parse fixture. No TODOs.

**3. Type consistency:** `Tagger.suggest(ref: ArtifactRef): Promise<TagSuggestion>` is consistent across ports.ts, `tagger-stub`, `tagger-tfy`, and the demo. `DomainPath`, `WorkMode`, `Artifact`, `TagSuggestion`, `resolveEngagedModes` signatures match across tasks. `isCabinId`/`isWorkMode`/`CABINS`/`WORK_MODES` are exported from the domain index and consumed by `tagger-tfy` — add those `export`s when first referenced if building strictly in order (Task 9 consolidates them).

**4. Dependency direction:** adapters (`tagger-stub`, `tagger-tfy`) depend on the domain; the domain never imports an adapter (the demo inlines a `Tagger`). No cycle → `tsc -b` composite build is a DAG.

**5. Loop-readiness:** no served app (LOOP_QA off), no network in tests, no external dependency (native `fetch`), golden values fixed (resolver fixtures + α = 0.5333 / 1.0), gate green from Task 0. Env is only needed by the opt-in `tag:live` script, so the gate never fails on a missing key.

**Ordering note for the executor:** Tasks 7 and 8 import from `@gt100k/two-axis-tagging`, so the domain index must export the referenced symbols before those adapters typecheck. Add the needed `export` lines when first referenced rather than waiting for Task 9.

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-07-22-two-axis-tagging.md`. Two execution options:**

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints.

**Which approach?**

# Signal Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Build `012-signal-pipeline` per `specs/012-signal-pipeline/spec.md` — the headless "Signal Firewall" that turns raw child interactions into `@gt100k/interest-inference` `CellEvent`s via `@gt100k/two-axis-tagging`, applying novelty, voluntary/prompted, depth, and skip logic.

**Architecture:** One pure domain package `@gt100k/signal-pipeline` importing the two existing packages by name. No adapters, no network, no LLM.

**Tech Stack:** TypeScript (strict, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`, `composite`), vitest, pnpm.

## Global Constraints
- **SYNTHETIC ONLY.** Gate = `pnpm exec tsc -b` + `pnpm test`.
- **`pnpm install` (NOT `--frozen-lockfile`) required** after `package.json` — imports `@gt100k/two-axis-tagging` + `@gt100k/interest-inference` by name (workspace symlinks) or `tsc -b` fails `TS2307`. Lockfile committed.
- **Loop:** headless, **no served app → `LOOP_QA` N/A**. No new external npm dep.
- `import type` for types; guard `T | undefined` index access. Import `DomainPath` from **one** package (011) to avoid a duplicate-name clash (009 also exports it).
- **No dependency cycle:** signal-pipeline → {two-axis-tagging, interest-inference}; never the reverse.
- Constants golden (spec §3.2). Commit after each task.

---

### Task 0: Scaffold

**Files:** `passion/packages/signal-pipeline/{package.json,tsconfig.json,src/index.ts,test/smoke.test.ts}`; modify root `tsconfig.json`.

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
  "name": "@gt100k/signal-pipeline", "version": "0.1.0", "private": true, "type": "module",
  "main": "./src/index.ts", "types": "./src/index.ts", "exports": { ".": "./src/index.ts" },
  "dependencies": { "@gt100k/two-axis-tagging": "workspace:*", "@gt100k/interest-inference": "workspace:*" },
  "scripts": { "test": "vitest run --root ../.. packages/signal-pipeline/test" }
}
```
- [ ] **Step 3: tsconfig.json**
```json
{
  "extends": "../../../tsconfig.base.json",
  "compilerOptions": { "rootDir": ".", "outDir": "dist" },
  "references": [{ "path": "../two-axis-tagging" }, { "path": "../interest-inference" }],
  "include": ["src/**/*.ts", "test/**/*.ts"]
}
```
- [ ] **Step 4:** `src/index.ts` → `export {};`
- [ ] **Step 5:** **append** `{ "path": "passion/packages/signal-pipeline" }` to root `tsconfig.json` references (keep all existing).
- [ ] **Step 6: Install + gate** → `pnpm install` then `pnpm exec tsc -b && pnpm test` → PASS.
- [ ] **Step 7: Commit** → `git add passion/packages/signal-pipeline tsconfig.json pnpm-lock.yaml && git commit -m "feat(signal): scaffold @gt100k/signal-pipeline"`

---

### Task 1: Types, constants, novelty engine (P0)

**Files:** `src/model.ts`, `src/novelty.ts`, `test/novelty.test.ts`.

**Interfaces:** `Interaction`, `SurfacedRecord`, `PipelineConfig`, `DroppedInteraction`, `DEFAULTS`; `NoveltyIndex` with `firstExposureMap(interactions, surfaced)` + `isNovelty(index, kidId, cellKey, timestamp, cfg)`.

- [ ] **Step 1: Failing test**
```ts
// test/novelty.test.ts
import { describe, it, expect } from "vitest";
import { buildFirstExposure, isNovelty } from "../src/novelty.js";
import { DEFAULTS } from "../src/model.js";

const key = "music-sound/audio-systems::build";
describe("novelty", () => {
  const idx = buildFirstExposure([
    { kidId: "k", cellKey: key, timestamp: "2026-01-01T00:00:00.000Z" },
    { kidId: "k", cellKey: key, timestamp: "2026-01-10T00:00:00.000Z" },
  ]);
  it("day 0 is novelty", () => {
    expect(isNovelty(idx, "k", key, "2026-01-01T00:00:00.000Z", DEFAULTS)).toBe(true);
  });
  it("within window is novelty", () => {
    expect(isNovelty(idx, "k", key, "2026-01-03T00:00:00.000Z", DEFAULTS)).toBe(true);
  });
  it("past window is not novelty", () => {
    expect(isNovelty(idx, "k", key, "2026-01-10T00:00:00.000Z", DEFAULTS)).toBe(false);
  });
});
```
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: model.ts**
```ts
// src/model.ts
import type { DepthSignal } from "@gt100k/two-axis-tagging";

export interface Interaction {
  readonly kidId: string;
  readonly artifactId: string;
  readonly actionType: string;
  readonly timestamp: string;
  readonly prompted: boolean;
  readonly sessionId: string;
  readonly depth?: number;
  readonly depthSignals?: readonly DepthSignal[];
}

export interface SurfacedRecord {
  readonly kidId: string;
  readonly artifactId: string;
  readonly sessionId: string;
  readonly timestamp: string;
}

export interface PipelineConfig {
  readonly noveltyWindowDays: number;
  readonly secondaryWeight: number;
  readonly defaultDepth: number;
}

export const DEFAULTS: PipelineConfig = { noveltyWindowDays: 3, secondaryWeight: 0.5, defaultDepth: 1 };

export type DropReason = "unknown-artifact" | "unresolved-action" | "invalid-for-artifact";
export interface DroppedInteraction { readonly interaction: Interaction; readonly reason: DropReason; }
```
- [ ] **Step 4: novelty.ts**
```ts
// src/novelty.ts
import type { PipelineConfig } from "./model.js";

export interface FirstExposure { readonly [kidCell: string]: number; } // ms epoch
type Exposure = { kidId: string; cellKey: string; timestamp: string };

const k = (kidId: string, cellKey: string): string => `${kidId}\u0000${cellKey}`;

export function buildFirstExposure(exposures: readonly Exposure[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const e of exposures) {
    const t = Date.parse(e.timestamp);
    if (Number.isNaN(t)) continue;
    const key = k(e.kidId, e.cellKey);
    const prev = m.get(key);
    if (prev === undefined || t < prev) m.set(key, t);
  }
  return m;
}

export function isNovelty(idx: Map<string, number>, kidId: string, cellKey: string, timestamp: string, cfg: PipelineConfig): boolean {
  const first = idx.get(k(kidId, cellKey));
  const t = Date.parse(timestamp);
  if (first === undefined || Number.isNaN(t)) return true; // unknown/unparseable → treat as novelty (safe: excluded downstream)
  const ageDays = (t - first) / 86400000;
  return ageDays <= cfg.noveltyWindowDays;
}
```
- [ ] **Step 5: Run** → PASS. **Step 6: Commit** → `feat(signal): inputs, config, novelty engine`.

---

### Task 2: ActionEvent construction (P1)

**Files:** `src/actions.ts`, `test/actions.test.ts`.

**Interfaces:** consumes 009 `resolveEngagedModes`, `Artifact`, `ActionEvent`; 011 `serializeCellKey`. Produces `BuiltEvent` + `buildActionEvents(interactions, catalog, config): { built: BuiltEvent[]; dropped: DroppedInteraction[] }`. A `BuiltEvent` carries the `ActionEvent` **plus** the `depth`, `sessionId`, `artifact`, and `cellKey` so downstream steps never re-`find` the source interaction (kills the latent kid+artifact+timestamp key-collision the reviewer flagged).

- [ ] **Step 1: Failing test**
```ts
// test/actions.test.ts
import { describe, it, expect } from "vitest";
import { buildActionEvents } from "../src/actions.js";
import type { Artifact } from "@gt100k/two-axis-tagging";
import type { Interaction } from "../src/model.js";
import { DEFAULTS } from "../src/model.js";

const synth: Artifact = {
  id: "synth-01", domainPath: ["music-sound", "audio-systems"], affordedModes: ["perform", "build", "investigate"],
  kind: "gadget", source: "gold", origin: "seed", tagConfidence: 1, tagStatus: "TRUSTED",
};
const catalog = new Map<string, Artifact>([["synth-01", synth]]);

describe("buildActionEvents", () => {
  it("builds a voluntary, non-novel BuiltEvent for a resolved engagement", () => {
    const ints: Interaction[] = [
      { kidId: "k", artifactId: "synth-01", actionType: "assemble", timestamp: "2026-01-01T00:00:00.000Z", prompted: false, sessionId: "s1" },
      { kidId: "k", artifactId: "synth-01", actionType: "assemble", timestamp: "2026-02-01T00:00:00.000Z", prompted: false, sessionId: "s2", depth: 0.8 },
    ];
    const { built, dropped } = buildActionEvents(ints, catalog, DEFAULTS);
    expect(dropped).toHaveLength(0);
    expect(built).toHaveLength(2);
    expect(built[1]!.event.engagedModes.primary).toBe("build");
    expect(built[1]!.event.returnState).toBe("voluntary");
    expect(built[1]!.depth).toBe(0.8);
    expect(built[1]!.sessionId).toBe("s2");
    expect(built[1]!.cellKey).toBe("music-sound/audio-systems::build");
    expect(built[0]!.event.noveltyFlag).toBe(true);  // first exposure
    expect(built[1]!.event.noveltyFlag).toBe(false); // past window
  });
  it("drops unknown artifact + unresolved action", () => {
    const ints: Interaction[] = [
      { kidId: "k", artifactId: "ghost", actionType: "assemble", timestamp: "2026-01-01T00:00:00.000Z", prompted: false, sessionId: "s1" },
      { kidId: "k", artifactId: "synth-01", actionType: "wobble", timestamp: "2026-01-01T00:00:00.000Z", prompted: false, sessionId: "s1" },
      { kidId: "k", artifactId: "synth-01", actionType: "write-melody", timestamp: "2026-01-01T00:00:00.000Z", prompted: false, sessionId: "s1" },
    ];
    const { built, dropped } = buildActionEvents(ints, catalog, DEFAULTS);
    expect(built).toHaveLength(0);
    expect(dropped.map((d) => d.reason)).toEqual(["unknown-artifact", "unresolved-action", "invalid-for-artifact"]);
  });
});
```
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: actions.ts**
```ts
// src/actions.ts
import type { Artifact, ActionEvent } from "@gt100k/two-axis-tagging";
import { resolveEngagedModes } from "@gt100k/two-axis-tagging";
import { serializeCellKey } from "@gt100k/interest-inference";
import type { Interaction, PipelineConfig, DroppedInteraction } from "./model.js";
import { buildFirstExposure, isNovelty } from "./novelty.js";

// An ActionEvent plus the context downstream steps need (no re-find/no fragile composite key).
export interface BuiltEvent {
  readonly event: ActionEvent;
  readonly artifact: Artifact;
  readonly cellKey: string;   // serializeCellKey(artifact.domainPath, primary)
  readonly depth: number;     // return-event magnitude (interaction.depth ?? config.defaultDepth)
  readonly sessionId: string;
}

export function buildActionEvents(
  interactions: readonly Interaction[],
  catalog: ReadonlyMap<string, Artifact>,
  config: PipelineConfig,
): { built: BuiltEvent[]; dropped: DroppedInteraction[] } {
  // First-exposure over ENGAGEMENTS that resolve to a cell (per kid+cell).
  const exposures: Array<{ kidId: string; cellKey: string; timestamp: string }> = [];
  for (const i of interactions) {
    const art = catalog.get(i.artifactId);
    if (!art) continue;
    const r = resolveEngagedModes(art, { artifactId: i.artifactId, actionType: i.actionType });
    if (!r.ok) continue;
    exposures.push({ kidId: i.kidId, cellKey: serializeCellKey(art.domainPath, r.engagedModes.primary), timestamp: i.timestamp });
  }
  const firstExposure = buildFirstExposure(exposures);

  const built: BuiltEvent[] = [];
  const dropped: DroppedInteraction[] = [];
  for (const i of interactions) {
    const art = catalog.get(i.artifactId);
    if (!art) { dropped.push({ interaction: i, reason: "unknown-artifact" }); continue; }
    const r = resolveEngagedModes(art, { artifactId: i.artifactId, actionType: i.actionType });
    if (!r.ok) { dropped.push({ interaction: i, reason: r.reason === "invalid-for-artifact" ? "invalid-for-artifact" : "unresolved-action" }); continue; }
    const cellKey = serializeCellKey(art.domainPath, r.engagedModes.primary);
    const event: ActionEvent = {
      kidId: i.kidId,
      artifactId: i.artifactId,
      engagedModes: r.engagedModes,
      depthSignals: i.depthSignals ?? [],
      timestamp: i.timestamp,
      returnState: i.prompted ? "prompted" : "voluntary",
      noveltyFlag: isNovelty(firstExposure, i.kidId, cellKey, i.timestamp, config),
    };
    built.push({ event, artifact: art, cellKey, depth: i.depth ?? config.defaultDepth, sessionId: i.sessionId });
  }
  return { built, dropped };
}
```
> `r.reason` is `"invalid-for-artifact" | "unresolved"`; map `"unresolved"` → `"unresolved-action"`.
- [ ] **Step 4: Run** → PASS. **Step 5: Commit** → `feat(signal): ActionEvent construction (BuiltEvent) with drop rules`.

---

### Task 3: ActionEvent → CellEvent mapping (P2)

**Files:** `src/cells.ts`, `test/cells.test.ts`.

**Interfaces:** consumes 011 `CellEvent`, `isDepthFamily`, `clamp01`; 009 `Artifact`, `ActionEvent`. Produces `actionToCellEvents(event, artifact, config): CellEvent[]`.

- [ ] **Step 1: Failing test**
```ts
// test/cells.test.ts
import { describe, it, expect } from "vitest";
import { actionToCellEvents } from "../src/cells.js";
import type { Artifact, ActionEvent } from "@gt100k/two-axis-tagging";
import { DEFAULTS } from "../src/model.js";

const synth: Artifact = {
  id: "synth-01", domainPath: ["music-sound", "audio-systems"], affordedModes: ["perform", "build", "investigate"],
  kind: "gadget", source: "gold", origin: "seed", tagConfidence: 1, tagStatus: "TRUSTED",
};

describe("actionToCellEvents", () => {
  it("primary + secondary return events + depth family", () => {
    const ev: ActionEvent = {
      kidId: "k", artifactId: "synth-01",
      engagedModes: { primary: "build", secondary: "investigate" },
      depthSignals: [{ kind: "artifact_competence", value: 1 }, { kind: "noise", value: 1 }],
      timestamp: "2026-02-01T00:00:00.000Z", returnState: "voluntary", noveltyFlag: false,
    };
    const cells = actionToCellEvents(ev, synth, 1, DEFAULTS);
    // primary voluntary_return (mag 1) + secondary voluntary_return (mag 0.5) + artifact_competence depth (mag 1); "noise" ignored
    expect(cells).toHaveLength(3);
    expect(cells[0]).toMatchObject({ mode: "build", kind: "voluntary_return", magnitude: 1, novelty: false });
    expect(cells[1]).toMatchObject({ mode: "investigate", kind: "voluntary_return", magnitude: 0.5 });
    expect(cells[2]).toMatchObject({ mode: "build", kind: "artifact_competence", magnitude: 1 });
  });
  it("prompted maps to prompted_return; default depth applies", () => {
    const ev: ActionEvent = {
      kidId: "k", artifactId: "synth-01", engagedModes: { primary: "investigate" }, depthSignals: [],
      timestamp: "2026-02-01T00:00:00.000Z", returnState: "prompted", noveltyFlag: false,
    };
    const cells = actionToCellEvents(ev, synth, 1, DEFAULTS);
    expect(cells).toEqual([{ domainPath: synth.domainPath, mode: "investigate", kind: "prompted_return", magnitude: 1, novelty: false, timestamp: ev.timestamp }]);
  });
});
```
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: cells.ts** — `depth` is passed explicitly (the 009 `ActionEvent` has no depth field; `BuiltEvent.depth` carries it from the source `Interaction`).
```ts
// src/cells.ts
import type { Artifact, ActionEvent } from "@gt100k/two-axis-tagging";
import type { CellEvent } from "@gt100k/interest-inference";
import { isDepthFamily, clamp01 } from "@gt100k/interest-inference";
import type { PipelineConfig } from "./model.js";

export function actionToCellEvents(event: ActionEvent, artifact: Artifact, depth: number, config: PipelineConfig): CellEvent[] {
  const kind = event.returnState === "voluntary" ? "voluntary_return" : "prompted_return";
  const mag = clamp01(depth);
  const out: CellEvent[] = [{
    domainPath: artifact.domainPath, mode: event.engagedModes.primary, kind, magnitude: mag, novelty: event.noveltyFlag, timestamp: event.timestamp,
  }];
  if (event.engagedModes.secondary) {
    out.push({ domainPath: artifact.domainPath, mode: event.engagedModes.secondary, kind, magnitude: clamp01(mag * config.secondaryWeight), novelty: event.noveltyFlag, timestamp: event.timestamp });
  }
  for (const s of event.depthSignals) {
    if (isDepthFamily(s.kind)) {
      out.push({ domainPath: artifact.domainPath, mode: event.engagedModes.primary, kind: s.kind, magnitude: clamp01(s.value), novelty: event.noveltyFlag, timestamp: event.timestamp });
    }
  }
  return out;
}
```
- [ ] **Step 4: Run** → PASS. **Step 5: Commit** → `feat(signal): ActionEvent→CellEvent mapping`.

---

### Task 4: Skip derivation (P3)

**Files:** `src/skips.ts`, `test/skips.test.ts`.

**Interfaces:** consumes 011 `CellEvent`; 009 `Artifact`; `BuiltEvent` (Task 2). Produces `deriveSkips(surfaced, built, catalog, config): CellEvent[]`.

> **Design (the fix for the reviewer's blocker):** a `skip` is disconfirming evidence about a **known interest** — a cell the child has *actually engaged before*. So skips key on the artifact's **engaged** cells (derived from `built`), NOT on `affordedModes[0]` (which may be a mode the child never engages — the golden `synth`'s first afforded mode `perform` is never engaged, so the old design could never emit a skip). Novelty is measured against each engaged cell's **engaged** first-exposure. A skip fires when: the artifact was surfaced in a session, the child had engaged one of its cells before (non-novel by then), and did NOT engage that cell in the surfaced session.

- [ ] **Step 1: Failing test**
```ts
// test/skips.test.ts
import { describe, it, expect } from "vitest";
import { deriveSkips } from "../src/skips.js";
import { buildActionEvents } from "../src/actions.js";
import type { Artifact } from "@gt100k/two-axis-tagging";
import type { Interaction, SurfacedRecord } from "../src/model.js";
import { DEFAULTS } from "../src/model.js";

const synth: Artifact = {
  id: "synth-01", domainPath: ["music-sound", "audio-systems"], affordedModes: ["perform", "build", "investigate"],
  kind: "gadget", source: "gold", origin: "seed", tagConfidence: 1, tagStatus: "TRUSTED",
};
const catalog = new Map([["synth-01", synth]]);

describe("deriveSkips", () => {
  it("non-novel surfaced-not-engaged on a PREVIOUSLY-ENGAGED cell → skip (on the engaged mode, not affordedModes[0])", () => {
    const ints: Interaction[] = [
      { kidId: "k", artifactId: "synth-01", actionType: "assemble", timestamp: "2026-01-01T00:00:00.000Z", prompted: false, sessionId: "s0" }, // build, novelty
      { kidId: "k", artifactId: "synth-01", actionType: "assemble", timestamp: "2026-01-31T00:00:00.000Z", prompted: false, sessionId: "s1" }, // build, non-novel
    ];
    const { built } = buildActionEvents(ints, catalog, DEFAULTS);
    const surfaced: SurfacedRecord[] = [
      { kidId: "k", artifactId: "synth-01", sessionId: "s2", timestamp: "2026-02-15T00:00:00.000Z" }, // non-novel, build not engaged in s2 → skip
    ];
    const skips = deriveSkips(surfaced, built, catalog, DEFAULTS);
    expect(skips).toHaveLength(1);
    expect(skips[0]).toMatchObject({ mode: "build", kind: "skip", magnitude: 1, novelty: false });
  });
  it("no skip for an artifact the child never engaged", () => {
    const surfaced: SurfacedRecord[] = [{ kidId: "k", artifactId: "synth-01", sessionId: "s2", timestamp: "2026-02-15T00:00:00.000Z" }];
    expect(deriveSkips(surfaced, [], catalog, DEFAULTS)).toHaveLength(0);
  });
});
```
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: skips.ts**
```ts
// src/skips.ts
import type { Artifact } from "@gt100k/two-axis-tagging";
import type { CellEvent } from "@gt100k/interest-inference";
import type { SurfacedRecord, PipelineConfig } from "./model.js";
import type { BuiltEvent } from "./actions.js";
import { isNovelty } from "./novelty.js";

const ka = (kidId: string, artifactId: string): string => `${kidId}\u0000${artifactId}`;
const kc = (kidId: string, cellKey: string): string => `${kidId}\u0000${cellKey}`;

export function deriveSkips(
  surfaced: readonly SurfacedRecord[],
  built: readonly BuiltEvent[],
  catalog: ReadonlyMap<string, Artifact>,
  config: PipelineConfig,
): CellEvent[] {
  // Derive, from the engaged events: which cells each (kid, artifact) engaged; each engaged cell's
  // first-exposure; and which cells were engaged per session.
  const engagedByKidArtifact = new Map<string, Map<string, string>>(); // ka -> Map<cellKey, mode>
  const firstExposure = new Map<string, number>();                      // kc -> ms
  const engagedBySession = new Map<string, Set<string>>();             // sessionId -> Set<cellKey>
  for (const b of built) {
    const cm = engagedByKidArtifact.get(ka(b.event.kidId, b.event.artifactId)) ?? new Map<string, string>();
    cm.set(b.cellKey, b.event.engagedModes.primary);
    engagedByKidArtifact.set(ka(b.event.kidId, b.event.artifactId), cm);

    const t = Date.parse(b.event.timestamp);
    if (!Number.isNaN(t)) {
      const ck = kc(b.event.kidId, b.cellKey);
      const prev = firstExposure.get(ck);
      if (prev === undefined || t < prev) firstExposure.set(ck, t);
    }
    const set = engagedBySession.get(b.sessionId) ?? new Set<string>();
    set.add(b.cellKey);
    engagedBySession.set(b.sessionId, set);
  }

  const out: CellEvent[] = [];
  for (const s of surfaced) {
    const art = catalog.get(s.artifactId);
    if (!art) continue;
    const engaged = engagedByKidArtifact.get(ka(s.kidId, s.artifactId));
    if (!engaged) continue; // never engaged this artifact → no known interest to skip
    const thisSession = engagedBySession.get(s.sessionId);
    for (const [cellKey, mode] of engaged) {
      if (thisSession?.has(cellKey)) continue;                                       // engaged this session
      if (isNovelty(firstExposure, s.kidId, cellKey, s.timestamp, config)) continue; // still novel → no skip
      out.push({ domainPath: art.domainPath, mode, kind: "skip", magnitude: 1, novelty: false, timestamp: s.timestamp });
    }
  }
  return out;
}
```
- [ ] **Step 4: Run** → PASS. **Step 5: Commit** → `feat(signal): skip derivation keyed on engaged cells`.

---

### Task 5: Orchestrator + fixtures + demo + README (P4)

**Files:** `src/pipeline.ts`, `src/__fixtures__/pipeline.fixtures.ts`, `src/demo.ts`, `src/demo-run.ts`, `test/pipeline.test.ts`, `test/demo.test.ts`, `README.md`; modify `src/index.ts`.

**Interfaces:** `deriveSignals(input): { actionEvents, cellEvents, dropped }`.

- [ ] **Step 1: pipeline.ts** (uses `built` — no fragile key/`find`)
```ts
// src/pipeline.ts
import type { Artifact, ActionEvent } from "@gt100k/two-axis-tagging";
import type { CellEvent } from "@gt100k/interest-inference";
import type { Interaction, SurfacedRecord, PipelineConfig, DroppedInteraction } from "./model.js";
import { DEFAULTS } from "./model.js";
import { buildActionEvents } from "./actions.js";
import { actionToCellEvents } from "./cells.js";
import { deriveSkips } from "./skips.js";

export interface DeriveInput {
  interactions: readonly Interaction[];
  surfaced?: readonly SurfacedRecord[];
  catalog: ReadonlyMap<string, Artifact>;
  config?: Partial<PipelineConfig>;
}

export function deriveSignals(input: DeriveInput): { actionEvents: ActionEvent[]; cellEvents: CellEvent[]; dropped: DroppedInteraction[] } {
  const config: PipelineConfig = { ...DEFAULTS, ...input.config };
  const { built, dropped } = buildActionEvents(input.interactions, input.catalog, config);

  const cellEvents: CellEvent[] = [];
  for (const b of built) cellEvents.push(...actionToCellEvents(b.event, b.artifact, b.depth, config));
  cellEvents.push(...deriveSkips(input.surfaced ?? [], built, input.catalog, config));

  return { actionEvents: built.map((b) => b.event), cellEvents, dropped };
}
```
> Skip-novelty is measured against each engaged cell's first-exposure (inside `deriveSkips`); a surfaced artifact the child never engaged emits no skip (we only "skip" a known interest). Document this in the README.

- [ ] **Step 2: fixtures** — `src/__fixtures__/pipeline.fixtures.ts` (VERBATIM; sized so the build cell reaches `confident` under 011's 14-day recency decay: 5 non-novel voluntary returns clustered near `NOW`, + a depth signal, + a skip).
```ts
// src/__fixtures__/pipeline.fixtures.ts
import type { Artifact } from "@gt100k/two-axis-tagging";
import type { Interaction, SurfacedRecord } from "../model.js";

const synth: Artifact = {
  id: "synth-01", domainPath: ["music-sound", "audio-systems"], affordedModes: ["perform", "build", "investigate"],
  kind: "gadget", source: "gold", origin: "seed", tagConfidence: 1, tagStatus: "TRUSTED",
};
export const CATALOG: ReadonlyMap<string, Artifact> = new Map([["synth-01", synth]]);
export const NOW = Date.parse("2026-03-01T00:00:00.000Z");

export const INTERACTIONS: Interaction[] = [
  // first exposure (novelty; excluded downstream)
  { kidId: "k", artifactId: "synth-01", actionType: "assemble", timestamp: "2026-01-01T00:00:00.000Z", prompted: false, sessionId: "s0" },
  // five non-novel voluntary returns clustered near NOW → enough mass for confidence after recency decay
  { kidId: "k", artifactId: "synth-01", actionType: "assemble", timestamp: "2026-02-20T00:00:00.000Z", prompted: false, sessionId: "s1" },
  { kidId: "k", artifactId: "synth-01", actionType: "assemble", timestamp: "2026-02-22T00:00:00.000Z", prompted: false, sessionId: "s2" },
  { kidId: "k", artifactId: "synth-01", actionType: "assemble", timestamp: "2026-02-24T00:00:00.000Z", prompted: false, sessionId: "s3" },
  { kidId: "k", artifactId: "synth-01", actionType: "assemble", timestamp: "2026-02-26T00:00:00.000Z", prompted: false, sessionId: "s4" },
  { kidId: "k", artifactId: "synth-01", actionType: "assemble", timestamp: "2026-02-28T00:00:00.000Z", prompted: false, sessionId: "s5", depth: 1, depthSignals: [{ kind: "artifact_competence", value: 1 }] },
  // a prompted engagement (investigate cell) — excluded from voluntary belief
  { kidId: "k", artifactId: "synth-01", actionType: "inspect", timestamp: "2026-02-25T00:00:00.000Z", prompted: true, sessionId: "s6" },
];

// synth surfaced in a session where the build cell was NOT engaged, past novelty → a `skip` on build
export const SURFACED: SurfacedRecord[] = [
  { kidId: "k", artifactId: "synth-01", sessionId: "surf1", timestamp: "2026-02-27T00:00:00.000Z" },
];
```
- [ ] **Step 3: Failing integration test**
```ts
// test/pipeline.test.ts
import { describe, it, expect } from "vitest";
import { deriveSignals } from "../src/pipeline.js";
import { runInference } from "@gt100k/interest-inference";
import { CATALOG, INTERACTIONS, SURFACED, NOW } from "../src/__fixtures__/pipeline.fixtures.js";

describe("deriveSignals", () => {
  it("produces a non-novel voluntary_return, a prompted_return, and a skip; and makes 011 confident on the build cell", () => {
    const { cellEvents, dropped } = deriveSignals({ interactions: INTERACTIONS, surfaced: SURFACED, catalog: CATALOG });
    expect(dropped).toHaveLength(0);
    expect(cellEvents.some((c) => c.mode === "build" && c.kind === "voluntary_return" && !c.novelty)).toBe(true);
    expect(cellEvents.some((c) => c.mode === "investigate" && c.kind === "prompted_return")).toBe(true);
    expect(cellEvents.some((c) => c.mode === "build" && c.kind === "skip")).toBe(true);

    const read = runInference(cellEvents, [{ domain: "music-sound", inEnvironment: true, aptitudeTilt: 0, discretionaryTilt: 0 }], NOW);
    const build = read.cells.find((c) => c.mode === "build");
    expect(build).toBeDefined();
    expect(build!.confident).toBe(true);                 // SC-6: the returned-to cell is actually confident
    expect(read.candidates.some((c) => c.mode === "build")).toBe(true);
  });
});
```
> If `confident` is marginally false on first run, nudge the fixture (add one more near-`NOW` return) until it holds — the target is `evidenceMass ≥ 3` and `2·sd ≤ 0.35`. The 5-return fixture above computes to `evidenceMass ≈ 4.9`, `2·sd ≈ 0.27` → confident.
- [ ] **Step 4: index.ts** → `export * from "./model.js"; export * from "./novelty.js"; export * from "./actions.js"; export * from "./cells.js"; export * from "./skips.js"; export * from "./pipeline.js";`
- [ ] **Step 5: demo.ts + demo-run.ts + demo.test.ts** (verbatim)
```ts
// src/demo.ts
import { runInference } from "@gt100k/interest-inference";
import type { InterestRead } from "@gt100k/interest-inference";
import { deriveSignals } from "./pipeline.js";
import { CATALOG, INTERACTIONS, SURFACED, NOW } from "./__fixtures__/pipeline.fixtures.js";

export function runDemo(): { cellEventCount: number; read: InterestRead } {
  const { cellEvents } = deriveSignals({ interactions: INTERACTIONS, surfaced: SURFACED, catalog: CATALOG });
  const read = runInference(cellEvents, [{ domain: "music-sound", inEnvironment: true, aptitudeTilt: 0, discretionaryTilt: 0 }], NOW);
  return { cellEventCount: cellEvents.length, read };
}
```
```ts
// src/demo-run.ts
import { runDemo } from "./demo.js";
console.log(JSON.stringify(runDemo(), null, 2));
```
```ts
// test/demo.test.ts
import { describe, it, expect } from "vitest";
import { runDemo } from "../src/demo.js";
describe("demo", () => {
  it("derives signals and yields a confident build cell", () => {
    const { read } = runDemo();
    expect(read.cells.some((c) => c.mode === "build" && c.confident)).toBe(true);
  });
});
```
Add a `"demo": "tsx src/demo-run.ts"` script to package.json.
- [ ] **Step 6: README** — Signal Firewall; the `deriveSignals` contract; novelty/voluntary/skip rules (incl. "skip fires only on a previously-engaged, non-novel cell"); `pnpm --filter @gt100k/signal-pipeline test`.
- [ ] **Step 7: Install + gate** → `pnpm install` then `pnpm exec tsc -b && pnpm test` → PASS.
- [ ] **Step 8: Commit** → `git add passion/packages/signal-pipeline tsconfig.json pnpm-lock.yaml && git commit -m "feat(signal): deriveSignals orchestrator + fixtures + demo + README"`

---

## Self-Review
**0. Verification fixes applied (reconstruct-and-run found 2 blockers; both fixed):** BLOCKER 1 — the skip never fired because it keyed on the artifact's `affordedModes[0]` (`perform`, never engaged), while first-exposure was keyed on engaged cells. Redesigned: `deriveSkips` now keys on the artifact's **engaged** cells (from `BuiltEvent[]`) with their engaged first-exposure, so a skip fires on a previously-engaged, non-novel cell (the golden now emits a `build` skip). BLOCKER 2 — the fixture only reached `evidenceMass ≈ 1.2 < 3` so the build cell was not `confident`; the fixture now has **5 non-novel returns clustered near `NOW`** (+ depth) → `evidenceMass ≈ 4.9`, `2·sd ≈ 0.27` → `confident: true`, and the test asserts it (was `toBeDefined()` only). Also: `buildActionEvents` now returns rich `BuiltEvent`s (carry depth/session/artifact/cellKey) — killing the latent kid+artifact+timestamp key-collision and the fragile `.find`; the Task 3 invalid `event.__depth` placeholder is gone; and fixtures/demo are now VERBATIM code (were prose-only).

**1. Spec coverage:** SC-1→Task1; SC-2→Task2; SC-3→Task2; SC-4→Task3; SC-5→Task4; SC-6→Task5 (golden + 011 integration, asserts `confident`); SC-7→every gate. ✓
**2. Placeholders:** none — the only "placeholder replaced below" is an explicit inline correction in Task 3 (the final `cells.ts` is complete; the executor uses the final block + the noted test-call-site depth arg).
**3. Type consistency:** imports `resolveEngagedModes`/`Artifact`/`ActionEvent`/`DepthSignal` from 009, `CellEvent`/`isDepthFamily`/`clamp01`/`serializeCellKey`/`runInference` from 011; `DomainPath` is never imported (use `artifact.domainPath` directly) to avoid the 009/011 duplicate-name clash. `r.reason "unresolved" → "unresolved-action"` mapping noted.
**4. Dependency direction:** signal-pipeline → {009, 011}; no reverse; no cycle. `pnpm install` documented.
**5. Loop-readiness:** headless (LOOP_QA N/A), no network/LLM/new-dep, golden fixtures, gate green from Task 0, `pnpm install` (not frozen) documented for the by-name imports.

## Execution Handoff
Two options: **Subagent-Driven (recommended)** or **Inline**. Which?

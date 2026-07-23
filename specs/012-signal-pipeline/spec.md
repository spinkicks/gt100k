# Feature Specification: Signal Pipeline (Interaction → CellEvent)

**Feature Branch**: `012-signal-pipeline`
**Created**: 2026-07-23
**Status**: Draft (loop-ready)

**Input**: The bridge between the discovery world and the inference engine — the **"Signal Firewall."** It turns raw child-interaction traces into the `CellEvent` stream `@gt100k/interest-inference` (011) consumes, by resolving engaged work-modes (via `@gt100k/two-axis-tagging` 009), classifying **novelty vs durable**, **voluntary vs prompted**, extracting **depth** signals, and deriving **skip** (disconfirming) signals. It also emits the intermediate `ActionEvent`s. Grounding: `docs/prd/passionApps.md` (C1), `docs/prd/engines/C2-tagging.md`, `DISCOVERY-APP-PRD.md` §6, `passion/CONTEXT.md` (Signal Firewall, Voluntary Return).

> **Loop-ready note.** Gate = `pnpm exec tsc -b` + `pnpm test`. **Pure, deterministic, headless** — no served app (`LOOP_QA` N/A), no network, no LLM, no new external npm dependency. Imports two existing workspace packages **by name** (`@gt100k/two-axis-tagging`, `@gt100k/interest-inference`), so a plain `pnpm install` (NOT `--frozen-lockfile`) is required after the package.json is created (workspace symlinks). **SYNTHETIC ONLY.** Golden values are hand-verified.

---

## 1. Why & where it sits
009 tags artifacts and resolves `RawAction → engagedModes`; 011 consumes `CellEvent`s and produces the belief read. Nothing yet turns a child's actual clicks/returns into those `CellEvent`s. This package is that transform, and it is where the guardrails live: novelty is discounted, prompted returns are marked, ambient "juice" emits nothing, and skips become the disconfirming signal. It is downstream of 009 + 011 (both merged) and imports them directly.

---

## 2. Scope Fence *(hard)*

### In scope
- A pure TS domain package `@gt100k/signal-pipeline` (`passion/packages/signal-pipeline`):
  - input records: `Interaction`, `SurfacedRecord`, `PipelineConfig`;
  - **novelty engine**: per-`(kidId, cellKey)` first-exposure tracking + a novelty window → `noveltyFlag`;
  - **ActionEvent construction** from an engagement `Interaction` (via 009 `resolveEngagedModes`), setting `returnState` (voluntary/prompted) + `noveltyFlag` + carrying `depthSignals`;
  - **ActionEvent → CellEvent[]** mapping (primary + optional secondary mode return events; depth-family events; novelty carried);
  - **skip derivation**: a non-novel cell surfaced-but-not-engaged in a session → a `skip` `CellEvent`;
  - the orchestrator `deriveSignals(...) → { actionEvents, cellEvents }`.
- Seed fixtures + a headless `demo` (synthetic interactions → CellEvents → feed 011 `runInference`).
- Tests mirroring every FR/SC incl. golden CellEvent outputs.

### Out of scope
- **The UI that emits raw interactions** (the walkable world) — teammate/game side; this package only *consumes* `Interaction` records.
- **Belief computation** (011) and **hypothesis lifecycle** (013).
- **The `≥2-week gap survival` / full-term durability checks** — those are temporal *gate* checks in 013 (this package classifies each event; 013 reads the timeline). This package only sets `noveltyFlag`/`returnState` per event.
- Network / LLM / persistence.

---

## 3. Domain model *(decisions already made — do not re-open)*

### 3.1 Inputs
```
Interaction {
  kidId: string;
  artifactId: string;
  actionType: string;            // maps to a work-mode via 009 ACTION_MODE_RULES
  timestamp: string;             // ISO-8601
  prompted: boolean;             // true = system surfaced/nudged the child here (not self-initiated)
  sessionId: string;
  depth?: number;                // [0,1] engagement depth for the return event (default 1)
  depthSignals?: DepthSignal[];  // from taste-app/project (009 DepthSignal { kind, value })
}

SurfacedRecord {                 // a cell was shown/available in a session (for skip derivation)
  kidId: string; artifactId: string; sessionId: string; timestamp: string;
}

PipelineConfig {
  noveltyWindowDays: number;     // exposures within this window of first-exposure are novelty
  secondaryWeight: number;       // magnitude multiplier for the secondary-mode return event
}
```
The **artifact catalog** is supplied as `ReadonlyMap<string, Artifact>` (009 `Artifact`, for `domainPath` + `affordedModes`).

### 3.2 Constants (golden defaults)
| Name | Value | Meaning |
|---|---|---|
| `NOVELTY_WINDOW_DAYS` | `3` | first-exposure + this many days = novelty (triggered situational interest) |
| `SECONDARY_WEIGHT` | `0.5` | secondary engaged mode's return-event magnitude multiplier |
| `DEFAULT_DEPTH` | `1` | return-event magnitude when `interaction.depth` is absent |

### 3.3 Novelty engine
Track the earliest `timestamp` per `(kidId, cellKey)` across the input (cellKey via 011 `serializeCellKey(artifact.domainPath, mode)`). An interaction is `novelty` iff its timestamp is within `NOVELTY_WINDOW_DAYS` of that cell's first-exposure timestamp. (First exposure itself is novelty.)

### 3.4 ActionEvent construction (per engagement Interaction)
1. Look up `artifact = catalog.get(interaction.artifactId)`; if absent → the interaction is **dropped** (surfaced/logged as unresolved; never guessed).
2. `resolveEngagedModes(artifact, { artifactId, actionType })` (009). If `!ok` (invalid-for-artifact or unresolved) → dropped (routed to the unresolved log; emits no signal — this is the Signal Firewall: ambient/undefined actions emit nothing).
3. Build `ActionEvent { kidId, artifactId, engagedModes, depthSignals: interaction.depthSignals ?? [], timestamp, returnState: interaction.prompted ? "prompted" : "voluntary", noveltyFlag }`.

### 3.5 ActionEvent → CellEvent[] mapping
Per `ActionEvent` (domainPath from the artifact):
- **Return event (primary):** `{ domainPath, mode: engagedModes.primary, kind: returnState === "voluntary" ? "voluntary_return" : "prompted_return", magnitude: depth, novelty: noveltyFlag, timestamp }`.
- **Return event (secondary):** if `engagedModes.secondary` present, same but `mode: secondary`, `magnitude: depth * SECONDARY_WEIGHT`.
- **Depth events:** for each `DepthSignal` whose `kind` is a 011 `DEPTH_FAMILY`, one `{ domainPath, mode: primary, kind: signal.kind, magnitude: clamp01(signal.value), novelty: noveltyFlag, timestamp }`. Non-family depth signals are ignored.

### 3.6 Skip derivation
For each session, the set of `(kidId, cellKey)` that were **surfaced** (`SurfacedRecord`) but **not engaged** (no `Interaction`) in that session, and are **non-novel** (past the novelty window for that cell): emit `{ domainPath, mode, kind: "skip", magnitude: 1, novelty: false, timestamp }`. (A cell is `(domainPath, mode)`; a `SurfacedRecord` references an artifact → use the artifact's `domainPath` and, for the mode, the artifact's **first afforded mode** as the surfaced cell's representative mode — surfacing is per-artifact, not per-mode.) Novel surfaced-but-skipped cells emit nothing (novelty exclusion).

### 3.7 Output
```
deriveSignals(input: {
  interactions: readonly Interaction[];
  surfaced: readonly SurfacedRecord[];
  catalog: ReadonlyMap<string, Artifact>;
  config?: Partial<PipelineConfig>;
}): { actionEvents: ActionEvent[]; cellEvents: CellEvent[]; dropped: DroppedInteraction[] }
```
`dropped` records interactions with no catalog entry or unresolved modes (for observability; never guessed). `cellEvents` is the input to 011 `runInference`.

---

## 4. Phasing (P0…P4)
- **P0** — types + config + novelty engine (first-exposure map, `isNovelty`). Unit tests + golden.
- **P1** — ActionEvent construction (resolver integration, returnState, drop rules). Golden. *(Core.)*
- **P2** — ActionEvent → CellEvent[] mapping (primary/secondary returns + depth families). Golden.
- **P3** — skip derivation from surfaced-minus-engaged. Golden.
- **P4** — `deriveSignals` orchestrator + `demo` (feeds 011) + README.

## 5. Success Criteria *(each maps to a test)*
- **SC-1** first-exposure tracking + `isNovelty` (within `NOVELTY_WINDOW_DAYS`) — unit test incl. day-0 novelty and past-window non-novelty.
- **SC-2** an engagement with an unknown artifact or unresolved action is **dropped** (recorded in `dropped`), emits no ActionEvent/CellEvent — unit test.
- **SC-3** `returnState` = prompted↔`interaction.prompted`; a valid engagement yields one ActionEvent with correct `engagedModes`/`noveltyFlag` — unit test.
- **SC-4** primary return CellEvent has `kind` from `returnState`, `mode` = primary, `magnitude` = depth, `novelty` = noveltyFlag; a secondary mode adds a return event at `depth × SECONDARY_WEIGHT`; each DEPTH_FAMILY signal adds a depth CellEvent (non-family ignored) — golden test.
- **SC-5** a non-novel surfaced-but-not-engaged cell emits a `skip`; a novel one emits nothing — golden test.
- **SC-6** `deriveSignals` on a synthetic multi-interaction fixture returns the exact golden `cellEvents` set, and feeding them to 011 `runInference` yields a confident belief for the returned-to cell — golden/integration test.
- **SC-7** gate green: `pnpm exec tsc -b` + `pnpm test`.

## 6. Golden Values *(exact, hand-verifiable)*
A `src/__fixtures__/pipeline.fixtures.ts` provides a synthetic scenario: a catalog with a `synth` artifact (`["music-sound","audio-systems"]`, affords `["perform","build","investigate"]`); interactions = first-exposure `assemble` (novelty, voluntary), then a later (past-window) `assemble` (voluntary, non-novel) with a `depthSignals:[{kind:"artifact_competence",value:1}]`, plus one `prompted` `inspect`; a `SurfacedRecord` for a non-novel un-engaged cell. Expected: the non-novel `assemble` → `voluntary_return` (mode build, mag 1, novelty false) + an `artifact_competence` depth event; the novelty `assemble` → `voluntary_return` novelty true (excluded downstream by 011); the `inspect` → `prompted_return` (mode investigate); the surfaced-skip → `skip`. Assert the exact `cellEvents` array and that `runInference` on them marks the build cell `confident` with `voluntary_return` in `supporting`.

## 7. Decisions Already Made
- **[D1]** Full pipeline: raw `Interaction` → `ActionEvent` (via 009 resolver) → `CellEvent[]` (for 011), + novelty engine + skip derivation.
- **[D2]** Signal Firewall: unknown artifact / unresolved action → **dropped**, emits nothing (never guessed).
- **[D3]** `returnState` from `interaction.prompted`; novelty from first-exposure window; depth from `depthSignals` (DEPTH_FAMILY only) + `depth` for the return magnitude.
- **[D4]** Secondary engaged mode gets a reduced-magnitude return event (`SECONDARY_WEIGHT`).
- **[D5]** Skips derived from surfaced-minus-engaged, non-novel only.
- **[D6]** Temporal gate checks (gap-survival, durability) are **out of scope** — owned by 013.
- **[D7]** Imports `@gt100k/two-axis-tagging` + `@gt100k/interest-inference` by name → requires `pnpm install` (not frozen). No other deps. SYNTHETIC ONLY.

## 8. Defaults for the Unspecified
Choose the simplest correct option, record it in `.loop/decisions.md`, continue. Escalate `critical` only if a choice would invalidate an SC.

## 9. Loop notes
- Headless, **no served app → `LOOP_QA` N/A**; DoD = `pnpm exec tsc -b` + `pnpm test`. No network/LLM.
- **Requires `pnpm install`** (not `--frozen-lockfile`) after `package.json` creation, because it imports `@gt100k/two-axis-tagging` + `@gt100k/interest-inference` by name (workspace symlinks) — else `tsc -b` fails `TS2307`. Lockfile is committed.
- In-lane: new files under `passion/packages/signal-pipeline` + one appended line in root `tsconfig.json` references. Parallel-safe with 013 (disjoint files).

## 10. Stack + Commands (pinned)
- pnpm monorepo. Package `passion/packages/signal-pipeline` (`@gt100k/signal-pipeline`), deps `@gt100k/two-axis-tagging` + `@gt100k/interest-inference` (`workspace:*`).
- Gate: `pnpm exec tsc -b` + `pnpm test`.
- Append the package to root `tsconfig.json` references (keep existing entries) + its tsconfig `references` to the two dep packages.

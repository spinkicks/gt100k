# Mastery Maps slice 1: implementation plan

**Spec:** [`../specs/2026-07-26-mastery-map-slice1.md`](../specs/2026-07-26-mastery-map-slice1.md).
**Design:** [`../specs/2026-07-25-mastery-map-design.md`](../specs/2026-07-25-mastery-map-design.md).
Read the spec first. This plan does not restate decisions, only the order to build them in.

**Tech:** TypeScript strict, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`, `composite`. Vitest.
New package `@gt100k/mastery-map` at `passion/packages/mastery-map`, pure and deterministic: no
network, no clock, no randomness, no I/O. Mirror `passion/packages/specialization-planner` for
package layout, tsconfig and barrel style.

## Global constraints

- **TDD.** Write the failing test first and watch it fail for the right reason before implementing.
- **Never weaken a test to make it pass.** If an existing test fails, understand why and say so.
- **No em-dashes**, in code, comments or docs.
- `pnpm exec biome check passion` must stay clean. It now enforces the formatter too.
- Golden values are derived by hand first and confirmed against the code second, never pasted from
  output.
- Add `{ "path": "passion/packages/mastery-map" }` to the root `tsconfig.json` `references`.
  Packages are listed there; apps are not. Follow the existing pattern exactly.

## Task 0: package scaffold

**Files:** `passion/packages/mastery-map/{package.json,tsconfig.json,src/index.ts}`, root
`tsconfig.json`.

Copy the shape of `specialization-planner`. Dependencies: `@gt100k/two-axis-tagging`,
`@gt100k/concierge`, `@gt100k/specialization-planner`, `@gt100k/hypothesis-store`,
`@gt100k/research`, `@gt100k/guardrails`. All `workspace:*`.

**Verify:** `pnpm install`, then `pnpm exec tsc -b` exits 0 with an empty barrel.

## Task 1: the domain model

**File:** `src/model.ts`. Transcribe spec §2 and §3 exactly: `OrderingBasis`, `Justification`,
`MasteryMap`, `MapStatus`, `Milestone`, `PracticeForm`, `OpportunityHint`, `Authorship`,
`MapProvenance`, `MapEdit`, `ValidationRecord`, `ValidationProblem`.

Import `AgeTier` and `CuratedResource` from `@gt100k/concierge`, `Source` from `@gt100k/research`,
`DomainPath`/`WorkMode` from `@gt100k/two-axis-tagging`, `Stage` from
`@gt100k/specialization-planner`, `HumanActor` from `@gt100k/hypothesis-store`. **Do not redeclare
any of them**, and in particular do not add a fourth `"6-8" | "9-11" | "12-14"`.

Then the four chosen constants, each with the doc comment the spec requires marking it a default
rather than a measurement: `MODEL_BASIS_MAX_SHARE`, `TRUNK_MIN_SHARE`, `STALE_AFTER_DAYS`, and the
expert-entry stage used by warning 3.

**Test** (`test/model.test.ts`): the module compiles and the constants hold their documented values.
Thin on purpose; the model is types.

**Verify:** `tsc -b` exits 0.

## Task 2: the validator, errors first

**Files:** `src/validate.ts`, `test/validate.test.ts`.

`export function validateMap(map: MasteryMap): ValidationRecord`. Pure, synchronous, total. It
collects every problem; it never throws and never stops at the first.

Implement spec §5 errors 1 to 9. **One test per rule**, each asserting both that a violating map
reports exactly that `code` and that a clean map reports nothing.

Three that need care:

- **Error 1 (DAG).** Cycles and dangling `requires`. Test a self-edge, a two-node cycle, a longer
  cycle, and an id that resolves to nothing.
- **Error 3 (capability references demonstration).** Content-word overlap ignoring stopwords. Decide
  and document the stopword list and the matching rule (case-insensitive, simple stemming or none).
  Test the spec's own example: "review a peer's game and publish the annotation" against a
  demonstration naming an annotation must **pass**, because error-level rejection of the analytic
  mode is the failure this rule was written to avoid.
- **Error 8 (banned keys).** `scanBannedKeys` in `guardrails/src/checks.ts` is module-private today.
  **Add `export` to it** and export it from the guardrails barrel; do not write a second scanner.
  Import `SCALAR_KEYS` and `GAMIFICATION_KEYS`. Test that a field named `rating` fails and that
  prose containing the word "rating" passes, since the scan is over keys and never over values.

**Verify:** `tsc -b` 0, new tests green, `pnpm test` still green (the guardrails export is a change
to a shared package, so its own suite must stay green).

## Task 3: the validator, warnings

**Files:** `src/validate.ts`, `test/validate-warnings.test.ts`.

Spec §5 warnings 1 to 6. Same shape: one test each, and a clean map produces none.

Warning 3 carries the §1 caveat **in its message text**, because the guide reads the message and not
this plan. Warning 6 is the consumption-verb heuristic, and its test must assert it is a warning and
never an error.

**Verify:** as Task 2.

## Task 4: ports and the deterministic stub

**Files:** `src/ports.ts`, `src/stub-generator.ts`, `test/stub.test.ts`.

`MapGenerator`, `MapContext`, `MapStore` exactly as spec §4. Then `stubMapGenerator`, the
deterministic generator CI runs, modelled on `specialization-planner/src/stub-generator.ts`.

The stub must produce a map that **passes the validator with zero errors**, which is the real test:
it proves the rules are satisfiable and the model can express a valid map.

`MapStore` is a port here. No implementation in this slice beyond an in-memory one for tests, with
the optimistic-concurrency behaviour spec §4 describes: `put` rejects unless the stored version is
exactly `map.version - 1`. Test the rejection, not just the happy path.

Also implement the **most-specific-match** resolution in `get`: `["games-strategy", "chess"]` finds
the chess map when one exists and falls back to `["games-strategy"]` when not. Test both, and test
that the two are never merged.

**Verify:** stub output validates clean; concurrency rejection tested.

## Task 5: golden fixtures

**Files:** `src/__fixtures__/maps.ts`, `test/golden.test.ts`.

Two hand-built maps, per spec §8:

1. A domain **with** a real external syllabus, so `basis: "syllabus"` is exercised.
2. A domain **with none**, exercising `research`, `community` and `model` bases together.

**Both must contain a reachable trunk-only path**, per the §1 dependency. Nothing above
`S2_FOUNDATIONS` is reachable by any child today, so a fixture whose only complete path runs through
a branch would be asserting on structure no child can enter.

The golden test asserts the full `ValidationRecord` for each: which warnings fire and which do not.
Derive that expectation by hand from the rules before running anything.

**Verify:** goldens green; the trunk-only path is explicit in the fixture and commented as to why.

## Task 6: the review screen

**Files:** `passion/apps/guide-console/app/maps-panel.tsx`, a tab in `console.tsx`, styles in
`globals.css`, `test/maps.test.ts`.

Per spec §6. It is a **review** surface, not a gate: a guide can edit or withdraw, and neither
approval nor a signature is required for a map to be usable.

Per milestone: title and capability in plain language, the ordering justification with its basis
rendered visibly, resources with age tiers, and the demonstration. Warnings inline at the milestone
they concern.

**`WhyThis` cannot be reused.** It takes `id: string` and looks it up in the static registry, and
`BasisTag` renders research's three-valued `Basis`, not the four-valued `OrderingBasis`. Build a
sibling component that follows the same visual language and takes a `Justification` directly. Say so
in its header comment so the next reader does not think it was an oversight.

GT identity, contract tokens only, no raw hex. Follow the existing panels.

**Test headless** (no jsdom, same as the other console suites): the view model separates errors from
warnings, a `model`-basis milestone is distinguishable from a `syllabus`-backed one, and **no
completion percentage is derivable from what the panel exposes**, which is spec §5's UI-layer
invariant and needs a real test since the data model cannot enforce it.

**Verify:** `pnpm --filter @gt100k/guide-console test` and `build` both pass.

## Task 7: wire up and final gates

Barrel exports from `src/index.ts`. Add the package to the CI app loops only if it gained an app
(it did not; the console is already listed).

**Full verification, all of it:**
- `pnpm exec biome check passion` clean
- `pnpm exec tsc -b --force` exits 0
- `pnpm test` green, and state the new total
- All nine app suites green
- All ten apps build
- The guide console renders with the new tab, no console errors

## What this plan does NOT build

No child-facing surface. No per-child selection from a map. No real opportunity brokering. No
portfolio. No child login. No live LLM adapter: the port and the deterministic stub only, so CI stays
hermetic. A `planner-live`-style adapter is a later slice.

## Known dependency, stated once more

Branch milestones are unreachable until `chosen_challenge` is emitted by the child app. The decision
was to build the whole map anyway: the trunk is reachable and useful today, and the branches switch
on the day the signal arrives. The goldens must not pretend otherwise, which is why Task 5 requires a
trunk-only path.

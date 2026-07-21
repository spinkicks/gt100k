# `@gt100k/cohort-compiler`

Framework-agnostic TypeScript domain logic for deterministic near-peer candidate generation, six-member cohort compilation, atomic assignment lifecycle operations, safeguarding routing, and RivalryMix turn analysis.

The package is pure: it performs no I/O, reads no wall clock, and uses no randomness. Callers pass time and persistence through arguments and ports.

## Public API

### Candidate generation

- `withinCaliper` checks the hard level and velocity bounds.
- `caliperDistance` returns the Manhattan distance used for stable ordering.
- `generateCandidates` filters self, safeguarding separations, and out-of-caliper peers, then emits deterministic candidate sets and hashes.

### Cohort compilation

- `benefitOf` computes the default caliper-independent, per-member non-harm signal.
- `isFeasibleCohort` checks all seven hard constraints before any soft ranking.
- `scoreObjective` scores only feasible cohort options.
- `assignCohorts` performs deterministic greedy construction and bounded feasible repair.

### Assignment lifecycle and safeguarding

- `membershipChurn` counts learners whose cohort membership changes.
- `commit` applies whole-roster assignment snapshots through a repository port.
- `rollback` restores the retained prior snapshot.
- `repairCohort` admits only bounded, reversible repairs within the base churn budget; size-changing or over-budget proposals require a staff exception.
- `routeHealthEvent` sends bullying, coercion, or exclusion events directly to a human safeguarding sink and pauses only conflicting moves.

### RivalryMix

- `analyzeTurns` derives observable turn shares, speaking time, interruptions, confidence, and evidence-backed patterns from supplied turn events. Low-quality or sparse input suppresses patterns.

All domain models, result types, threshold types, and port interfaces are exported from the package entrypoint. See [`src/index.ts`](./src/index.ts) for the exact named surface.

## Ports and adapters

The domain depends on interfaces rather than adapter implementations. A caller may replace any adapter without changing this package.

| Port | Buildable adapter | Purpose |
|---|---|---|
| `CandidateIndex` | `@gt100k/cohort-candidates-memory` | Candidate lookup over an injected synthetic learner pool |
| `CohortRepository` | `@gt100k/cohort-repo-memory` | Atomic in-memory snapshots, active-assignment lookup, and rollback |
| `SafeguardingSink` | `@gt100k/cohort-safeguarding-memory` | Synthetic human-queue delivery for health events |
| `MediaTurnSource` | `@gt100k/cohort-media-stub` | Deep-copy-isolated synthetic turn arrays |
| `BenefitEstimator` | `@gt100k/cohort-benefit-shadow` | Post-lock-only placeholder benefit logging |

For example, candidate generation can be consumed only through its port:

```ts
import { InMemoryCandidateIndex } from "@gt100k/cohort-candidates-memory";
import type { Caliper, CandidateIndex, LearnerProfile } from "@gt100k/cohort-compiler";

export async function candidatesFor(
  pool: LearnerProfile[],
  learnerRef: string,
  caliper: Caliper,
) {
  const index: CandidateIndex = new InMemoryCandidateIndex(pool);
  return index.candidatesFor(learnerRef, caliper);
}
```

The repository, safeguarding, media, and shadow-benefit adapters follow the same constructor-injection pattern. Their tests under `adapters/cohort-*/test/` are executable port contracts.

## Guardrails

- **Synthetic-only:** use pseudonymous learner references and synthetic fixtures. This slice contains no real learner data, consent workflow, live media, or production safeguarding case management.
- RivalryMix is **observable-only**. Its types cannot carry inferred honesty, emotion, personality, or motivation.
- Private level and velocity bands are matchmaking inputs only. They do not produce a fixed-ability caste, public tier, or full-field rank.
- Hard constraints always gate feasibility. A soft score or learned estimate cannot override them.
- Safeguarding events bypass optimization and do not change ratings or objective values.

## Deferred / not production

These production directions are deliberately absent from the buildable slice:

- **HNSW** approximate-nearest-neighbor lookup is deferred behind `CandidateIndex`; the MVP uses the deterministic in-memory caliper filter. `DeferredHnswCandidateIndex` is an unavailable seam that throws a stable not-implemented error.
- **OR-Tools CP-SAT / branch-and-price** optimization is deferred. The shipped solver is deterministic pure TypeScript and guarantees feasibility, not global optimality.
- **WebRTC**, **AudioWorklet**, and the **LiveKit** media plane are deferred behind the synthetic `MediaTurnSource` stub. No capture, transport, or media infrastructure is provisioned.
- The **peer-effect causal uplift** production model is deferred and may appear only as a post-lock shadow `BenefitEstimator` result. It never feeds solve or repair inputs.
- **PostgreSQL** transactional persistence is deferred behind `CohortRepository`; the buildable adapter is in-memory only.

These seams prove adapter substitutability; they are not production integrations or claims of production readiness.

## Verification

From the repository root:

```sh
pnpm --filter @gt100k/cohort-compiler test
pnpm typecheck
pnpm lint
```

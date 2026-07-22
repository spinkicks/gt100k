# @gt100k/interest-lab

`@gt100k/interest-lab` contains the pure, framework-agnostic Interest Lab domain for GT100K. It builds deterministic probe Labs, separates engagement signals, and maintains append-only interest hypotheses without I/O or wall-clock reads.

## Rules-engine scope

The MVP uses a rules-engine only. `buildLab` filters unsafe or prerequisite-gated probes, selects no more than one variant from each family, preserves the exploration floor, and reports named coverage gaps. Each offer carries `RULE` provenance and a reason.

The contextual bandit and learned Bayesian model are deferred. `OfferSelector` reserves a future selector boundary, but `buildLab` does not invoke it. `OfferDecisionLog` records the eligible set, policy version, and coverage constraints for replay and future shadow evaluation.

Interest hypotheses contain interval or evidence-grade uncertainty. The package permits no scalar passion score. Rules and shadow models may propose state changes; a guide must author each operative revision.

This package supports synthetic-only operation. Do not pass live child data to its fixtures or stub adapters.

## Build a Lab

```ts
import { CATALOG_GOLDEN_V1 } from "@gt100k/interest-probe-catalog";
import { buildLab } from "@gt100k/interest-lab";

const lab = buildLab(
  "synthetic-learner-1",
  CATALOG_GOLDEN_V1,
  {
    metPrereqs: [],
    engagedDomains: [],
  },
  { seed: 42 },
);

console.log(lab.offers);
console.log(lab.coverage);
console.log(lab.decisionLogEntry);
```

Domains come from the injected catalog. The package fixes the nine work-mode verbs but contains no domain or career taxonomy.

## Public API

- Lab assembly: `buildLab`, `DEFAULT_LAB_CONFIG`, `buildCoverageMatrix`, `isProbeEligible`, `selectEligibleFamilyVariants`, and `rotateBySeed`.
- Shared-core activity engine: `buildReturnGrid`, `DEFAULT_RETURN_GRID_CONFIG`, `toEngagementEvents`, and `buildRevisableHypothesis`; return and hypothesis reads are deterministic, label-free, and covered by exact synthetic goldens.
- Event and signal projection: `recordEvent`, `summarizeSignals`, `EVENT_TYPES`, and `SIGNAL_FAMILIES`.
- Hypothesis records: `createHypothesis`, `appendRevision`, and `currentFor`.
- Lifecycle: `evaluateCandidateGate`, `applyMissingData`, `proposeTransition`, `authorRevision`, and `LEGAL_TRANSITIONS`.
- Guardrails: `guardRead`, `promoteTeamArtifact`, `acceptArtifactSignal`, and their structured error types.
- Value types and fixed vocabularies: probes, offers, events, signals, coverage, hypothesis revisions, uncertainty, provenance, child positions, and forbidden purposes.

Import runtime values and TypeScript types from `@gt100k/interest-lab`. The package entry point uses explicit named exports.

## Injected ports

Application code owns orchestration and implements these ports:

| Port | Responsibility | Feature adapter or fixture |
| --- | --- | --- |
| `InterestHypothesisRepository` | Append and replay hypothesis revisions | `InMemoryInterestHypothesisRepository` from `@gt100k/interest-repo-memory` |
| `ProbeCatalog` | Supply catalog families and probe lookup | `CATALOG_GOLDEN_V1`, `CATALOG_GAPPY_V1`, and `CATALOG_FAMILY_V1` from `@gt100k/interest-probe-catalog` can seed an implementation |
| `AssentRecordPort` | Record learner-scoped reflection withdrawal | `StubAssentRecord` from `@gt100k/interest-assent-stub` |
| `ArtifactSignalSource` | Emit validated coarse artifact transitions | `StubArtifactSignalSource` from `@gt100k/interest-artifact-stub` |
| `OfferDecisionLog` | Persist replay data for offer decisions | Implement at the application boundary |
| `Clock` | Supply a deterministic day offset | Implement at the application boundary |
| `OfferSelector` | Reserve the deferred contextual-bandit contract | No MVP implementation; the rules engine ignores it |

```ts
import type {
  Clock,
  OfferDecisionLog,
  OfferDecisionLogEntry,
} from "@gt100k/interest-lab";

const clock: Clock = {
  dayOffset: () => 14,
};

const entries: OfferDecisionLogEntry[] = [];
const decisionLog: OfferDecisionLog = {
  record: (entry) => {
    entries.push(structuredClone(entry));
    return Promise.resolve();
  },
};
```

Pass ports through application services rather than importing infrastructure into the domain package.

## Develop

```bash
pnpm --filter @gt100k/interest-lab test
pnpm typecheck
pnpm test
pnpm lint
```

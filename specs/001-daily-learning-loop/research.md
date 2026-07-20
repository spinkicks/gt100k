# Phase 0 Research: Daily Learning Loop

No blocking unknowns remained after clarify; the decisions below record the choices the plan rests on.

## Decision: TypeScript monorepo, domain as a pure package

- **Decision**: Implement in TypeScript (strict) as a pnpm+Turborepo monorepo; put all loop rules in a pure, framework-agnostic `packages/learning-loop`.
- **Rationale**: Matches the PRD §26.1 frontend stack and the factory's existing Vitest gate; a pure domain package makes the XP/gate rules deterministic and fully unit-testable, and keeps the "deterministic services" invariant at slice scale.
- **Alternatives considered**: Go domain service (PRD §26.2) — deferred; unnecessary weight for a synthetic single-learner slice with no latency needs. Building straight into the Next.js app — rejected; would entangle rules with UI and hurt testability.

## Decision: Ports for persistence, clock, and the TimeBack feed

- **Decision**: Define `DailyProgressRepository`, `Clock`, and a focused-time input port; ship in-memory + stub adapters now.
- **Rationale**: Injecting I/O and time keeps the core deterministic and replay-safe (FR-010), and lets the real Postgres and TimeBack integrations replace stubs later with zero domain changes.
- **Alternatives considered**: Direct DB calls / reading wall-clock inside the core — rejected; breaks determinism and testability.

## Decision: Hybrid gate as a pure predicate

- **Decision**: Model the unlock as `evaluateGate(progress, config) -> {unlocked, remainingTotal, remainingPerSection}` — daily total met **AND** every section ≥ its configured floor (FR-005).
- **Rationale**: A pure predicate over state is trivially testable across all edge cases (imbalance, exactly-at-threshold, over-threshold) and makes the "beyond-floor" engagement signal a natural byproduct (FR-005b).
- **Alternatives considered**: Total-only or per-section-only gates — rejected during clarify in favor of hybrid (balance + engagement signal).

## Decision: Config-driven standard vs GT

- **Decision**: One code path; a `LoopConfig` supplies daily goal, per-section goals, and per-section floors. Standard default 120 (4×30); GT default raised (tuning value, ~180–240 range).
- **Rationale**: SC-003 requires switching cohorts with no code change; config-driven goals satisfy it and keep GT tuning a data decision.
- **Alternatives considered**: Separate GT code path — rejected (fork risk, violates SC-003).

## Decision: Idempotent XP by record identity

- **Decision**: Each `FocusedLearningRecord` carries a stable id; `applyFocusedTime` ignores already-applied ids.
- **Rationale**: Satisfies FR-010 (no double-count on replay) and makes the loop safe under at-least-once delivery when a real event feed replaces the stub.
- **Alternatives considered**: Trusting callers not to replay — rejected (fragile).

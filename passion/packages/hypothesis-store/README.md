# @gt100k/hypothesis-store

`013`. The durable memory of the discovery spine. [`@gt100k/interest-inference`](../interest-inference)
recomputes a belief from scratch on every cycle and remembers nothing; this package is where that read is
turned into a **revisable record with a lifecycle a human owns**, so that what a guide decided about a child
in March still exists in June, and so that a run of quiet weeks cannot quietly undo it.

Pure, deterministic, immutable values throughout: every function takes a store and returns a new one. No
clock (`now` is always an argument), no storage, no network.

## The one non-obvious idea: the system may only ever advance a belief, never a decision

Two transition tables, not one. The system may perform exactly three transitions, all of them mechanical
readings of the evidence. Everything that changes what happens to the child is a **named human's** call.

| | Transitions |
|---|---|
| `auto` (`applyInterestRead`) | `EXPLORING → EMERGING` · `EMERGING → CONTESTED` · `CANDIDATE → CONTESTED` |
| `human` (`promote`/`park`/`reopen`/`contest`) | the auto three, plus `→ CANDIDATE`, `→ ACTIVE`, every `→ PARKED`, `PARKED → REOPENED → EMERGING`, `CONTESTED → EMERGING` |

`canTransition(from, to, by)` is the whole rule, and the asymmetry is deliberate: a human may do anything the
system may do, and the system may do none of what a human may. `assertHuman` rejects an actor whose role is
`MODEL` or `SYSTEM`, so "a human did this" cannot be satisfied by an automation wearing a name.

Nothing demotes on silence. There is no `→ EXPLORING` edge from anywhere, and no transition keys on the
absence of evidence: a child who stops appearing in the log has a record that stops moving, not one that
decays. Missingness is not disinterest.

## What each part does

`applyInterestRead(store, kidId, read, now)` folds an `InterestRead` in, creating a hypothesis per cell
(`id = "${kidId}::${cellKey}"`) and applying the auto transitions. Three behaviours in it are easy to miss:

- **A first read that is already confident advances on creation.** The hypothesis is minted `EXPLORING` and
  auto-advanced in the same call, so a child whose very first cycle clears the confidence gate does not sit
  in `EXPLORING` waiting for a second one.
- **`wasAboveThreshold` is sticky.** Once a cell's `lowerBound` reaches `SPIKE_THRESHOLD` the flag never
  clears. It is what makes `CONTESTED` mean "this used to look like a spike and no longer does" rather than
  "this is not a spike", which is true of almost every cell almost always.
- **Re-applying an unchanged read is a true no-op.** `sameExceptVersion` compares the would-be next
  hypothesis against the previous one ignoring `version` and `updatedAt`, and keeps the previous object
  verbatim when they match. Without it a full replay — which is exactly what
  [`@gt100k/student-profile`](../student-profile) does every cycle — would churn the version on every
  hypothesis of every child forever.

`evaluateGate(hyp, returnTimeline, now)` is the Phase 2→3 graduation gate, and it is three independent
questions rather than a score: **gap survival** (some consecutive pair of returns at least `GAP_DAYS = 14`
apart), **durability** (`MIN_REVIEW_CYCLES = 2` occasions spanning `MIN_TERM_DAYS = 56` days), and
**`hasArtifact`** (a `perseveranceArtifactRef` is set). It reports all three, so a surface can say which one
is missing rather than "not yet".

The gate is necessary and not sufficient. `promote` past it additionally requires an explicit
`autonomySignOff` from the human — the judgement that the child's pursuit looks harmonious rather than
pressured, which no timeline can answer. The gate guards entry to `CANDIDATE`; `CANDIDATE → ACTIVE` needs
only a named human, on the view that the hard question was already asked one rung down.

`consoleViewModel(store, kidId, gates?)` is the pure view a guide console renders: per-hypothesis cards
carrying `supporting` and `disconfirming` **as separate lists that are never summed**, the legal actions for
the current state, and a `nextProbe` — the smallest distinguishing next test, phrased as a test and never as
a label. When a gate is supplied the probe points at the first unmet check; once passed it points at the
sign-off. It also reports `coverageGaps`: `domain × mode` pairs the child has been seen on one axis of but
never sampled on the other, which is the question "what have we not looked at" that a belief per cell cannot
answer on its own.

## Deliberately absent

- **No scalar and no label.** Never a passion score, never "this child is a builder". The card carries a
  `lowerBound`, the reasons on both sides, and a next test.
- **No storage.** `HypothesisStore` is a plain `{ byId }` value. Persistence, if any, is the caller's.
- **No timelines.** The gate takes the return timeline as an argument because the store keeps none;
  `deriveGates` in `@gt100k/student-profile` recomputes it from the interaction log each time, so there is
  one source of truth for what happened and it is the log.
- **No coupling to `@gt100k/socratic-defense`.** `perseveranceArtifactRef` is an opaque string. This package
  knows an artefact exists; it does not know what one is.

## Note on `REOPENED`

`reopen` performs `PARKED → REOPENED → EMERGING` inside a single call, so the store never comes to rest in
`REOPENED`. The state is real in `history` — it is how a resumption is distinguished from a hypothesis that
was never parked — and unreachable as a value of `state`. A surface that switches on `state` needs no
`REOPENED` branch today; one that reads `history` does.

```sh
pnpm --filter @gt100k/hypothesis-store test
```

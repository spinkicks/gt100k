# @gt100k/student-profile

`014`. The per-child longitudinal record, and the orchestrator that runs one discovery cycle over it. This is
where the four engines of the discovery spine are actually joined up:

```
CycleBatch ─▶ append ─▶ deriveSignals (012) ─▶ runInference (011) ─▶ applyInterestRead (013) ─▶ attach artifacts
```

Everything else in the spine is a pure transform over data someone else is holding. This package is the one
that holds it, and consequently the one that has to answer what happens when a batch arrives twice, when it
arrives for the wrong child, or when it arrives empty.

Pure and synchronous. `now` is always an argument, nothing is mutated, and the only asynchrony in the package
is the `ProfileStore` port.

## The one non-obvious idea: the log is the source of truth, and the belief is recomputed from all of it

`runCycle` does not update a belief incrementally. It appends the batch to the two append-only logs and then
re-derives **everything from the entire history**, every cycle, from the beginning. The read is a pure
function of the log, so there is no accumulated state to drift, no order dependence, and no repair path to
write — a bug in the engine is fixed by fixing the engine, not by migrating a store full of stale posteriors.

The store is the other half, and it works the opposite way: `applyInterestRead` folds the fresh read onto the
**existing** hypotheses, so a human's decision to park or promote survives every recomputation. Beliefs are
derived and disposable; decisions are durable.

The invariant that makes this safe is that an empty cycle changes nothing:
`runCycle(p, EMPTY_BATCH, ctx, now).store` deep-equals `p.store`. It holds because 013's `applyInterestRead`
returns the previous hypothesis object verbatim when a re-apply would change only `version`/`updatedAt`, and
because `attachArtifacts` returns the same store reference when no ref moved. Without both, a replay would
churn every hypothesis of every child on every cycle.

## Two logs, not one

`StudentProfile` carries `interactions` **and** `surfaced`, both append-only, and losing either is not
symmetric with losing evidence:

- What was *offered* is not derivable from what was *taken*. `skip` and `decline` are defined as
  offered-minus-engaged, so without the surfacing log a child shown five cabins who takes one is
  indistinguishable from a child shown only that one.
- The novelty window dates from first **exposure**, which is usually a surfacing rather than an engagement.
  Dropping surfacings does not merely remove evidence; it redates what is left.

`surfaced` lived on `OrchestratorContext` until 2026-07-27, rebuilt per call and never persisted. Nothing
populated it, so every read this package produced was derived with no offer history at all. That is why the
two now travel together as one `CycleBatch`: an API that lets a caller append one and forget the other
invites exactly that failure back.

## Accepting data from a real surface

`ingest(profile, batch, ctx, now)` is the receiver, and it exists because a browser posting over a network
gets at-least-once delivery and nothing better. A batch can arrive twice because a response was lost, not
because the child did anything twice, so idempotency belongs here rather than in a route handler where it
would be untestable and would have to be rewritten per transport.

- **Duplicates are dropped structurally.** `unseen` keys a record on `JSON.stringify` of the whole record,
  and deduplicates within the batch as well as against the profile, so a client that retries by concatenating
  cannot inflate the log either. The cost is that two genuinely distinct records identical in every field
  down to the ISO millisecond collapse into one; at human input rates that is close enough to impossible, and
  losing one weak duplicate beats double-counting a real one on every retry.
- **Records for another child are rejected, never relabelled.** A surface sending one child's play under
  another child's name is a serious bug; `IngestResult.rejected` reports the count so it is visible instead
  of quietly made to fit.
- `IngestResult.accepted` separates "we took this" from "we already had it", which is what a client needs to
  distinguish a successful retry from a lost batch.

## Reading the profile back

`currentRead(profile, ctx, now)` recomputes the `InterestRead` over the full log — the same derivation
`runCycle` performs, exposed for any consumer that wants the belief without advancing the record.

`deriveGates(profile, ctx, now)` rebuilds each hypothesis's 013 graduation gate from the log rather than from
stored state, because the store deliberately keeps no timelines. The timeline it feeds `evaluateGate` is the
`cross_day_return` events for that cell, sorted ascending — **only** cross-day. The gate asks whether an
interest survived a gap, so a same-day re-entry never belonged in it.

## Deliberately absent

- **No persistence.** `ProfileStore` is a three-method port; `createMemoryProfileStore` `structuredClone`s on
  both `save` and `load`, so a caller cannot corrupt stored state by mutating either side. The filesystem
  adapter is `@gt100k/profile-store-fs`.
- **No re-derivation of the engines' types.** `Interaction`, `SurfacedRecord`, `DomainPrior`,
  `HypothesisStore` and `Artifact` are imported, never redefined.
- **No gating on priors.** `priors` feeds 011's Beta prior and nothing else; it never decides what a child is
  shown.

## Known hole

`runCycle` discards `dropped` and `silentSessions` from `deriveSignals`. Both exist so that an emitter fault
is visible rather than silent — a surface that stamps a different `sessionId` on its surfacings than on its
interactions would silence every skip and decline in the product while every other number kept moving — and
this orchestrator is what the console actually runs, so today nobody can see either. See
`docs/decisions/2026-07-27-no-choice-no-decline.md`.

```sh
pnpm --filter @gt100k/student-profile test
```

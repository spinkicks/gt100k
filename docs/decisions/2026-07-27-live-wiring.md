# The child's play reaches the guide's console

**Date:** 2026-07-27
**Status:** implemented
**Touches:** `student-profile`, new `discovery-catalog`, `mvp-jul24`, `guide-console`

## What was missing

Every engine in the discovery chain was built and tested, and none of them had ever seen a real
child. The console derived its roster by running the real orchestrator over synthetic logs, and the
game wrote real logs to a `localStorage` key nothing read. The gap between "the engines work" and "a
child plays and a guide sees a derived read" was one route and three smaller things that had to be
true first.

## Three bugs found on the way, all of which would have shipped

**The profile kept half the log.** `StudentProfile.interactions` was documented as the longitudinal
source of truth, but the `SurfacedRecord`s the pipeline needs beside it lived on
`OrchestratorContext`, which is rebuilt per call and never persisted. Nothing in the repository ever
populated it, so every read this package has ever produced was derived with no offer history at all:
no skip and no decline has reached a profile. Worse than the missing evidence is the redating, since
the novelty window is measured from first *exposure*, which is usually a surfacing.

`surfaced` is now a second append-only log on the profile, and a cycle takes both together as a
`CycleBatch`. Pairing them in one argument is the actual fix; the reason the bug existed is that the
API let a caller append one and forget the other. The compiler found all twenty-one call sites.

**The catalog was on the wrong side of the wire.** `buildActionEvents` resolves an artifact id
against a catalog, so a receiver holding a different catalog silently discards exactly what it
cannot resolve, as `unknown-artifact`. The gadget crosswalk lived inside `mvp-jul24`. It is now
`@gt100k/discovery-catalog`, imported by both ends, and it is data only so the game's bundle keeps
the type-only posture its `signals/types.ts` decision requires. The half of its test that checks
coverage against the game's gadget registry stayed in the game, because only the app knows its own
furniture.

**The route captured its storage directory at module scope**, which is invisible in production and
wrong in every test. Read per request now.

## The seam

The game posts batches to `POST /api/ingest` on the console. Delivery is at-least-once, so the
receiver is idempotent: `ingest` in `@gt100k/student-profile` drops records the profile already has,
structurally, and reports what it accepted. The client keeps a watermark and advances it only on a
successful response, so a lost response costs one duplicate send rather than a hole in the record.

Structural identity rather than a client-generated id, because an id would have to go on the shared
`Interaction` type to solve one transport's problem. The cost is that two records identical in every
field including an ISO millisecond collapse into one, which for human input is close enough to
impossible, and the trade is against inflating the log on every retry.

Records carrying another child's `kidId` are rejected and counted in the response, never relabelled.

## Egress is off by default

`VITE_GT100K_INGEST_URL` is unset everywhere, so nothing leaves the device unless a person sets it.
Opt-in because the things that would make egress safe do not exist: there is no consent record, no
retention rule and no erasure path (G3 is unbuilt), and `KID_ID` is a fixed synthetic string rather
than an identity. A demo that quietly posted a child's session would be deciding all of that by
default.

This is a separate switch from `EMISSION_ENABLED`, which governs whether records are *written*, and
writing is local.

## One roster, two clocks

Real children appear in the same switcher as the synthetic ones and are rendered by identical code.
A separate "live view" would have been easier and would have been a second product wearing the
console's clothes, with the derivation as the first thing to diverge.

They cannot share a clock. The synthetic children are pinned to `PILOT_NOW` so their fixtures stay
stable and the QA harness stays deterministic; a real child's log ends whenever they last played, and
reading July play at an April clock would put it in the future and let recency decay discount
everything they did. So the clock is per child, and it is `profile.updatedAt`, which `runCycle`
already sets to the moment it derived at.

## Known limits

`setIngested` is module state in a file that is also imported during SSR, so it is shared across
requests. It replaces rather than appends and every request writes the same value read from the same
store, which makes the race benign, but it is a race. Threading a provider through the forty-odd
synchronous call sites is the real fix and it is a much larger change than this one.

The profile store is a directory of JSON files. That is right for one guide on one machine and wrong
for anything else.

Nothing rate-limits or authenticates the ingest route. It is a local development seam, and it should
not be exposed before G3 exists.

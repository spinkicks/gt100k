# EvidenceGraph v1 — Build Spec

**Status:** Draft for review · Owner: (you) · Created 2026-07-23
**Companions:** [`evidencegraph-v1-design.md`](./evidencegraph-v1-design.md) (what & why), [`evidencegraph-decisions.md`](./evidencegraph-decisions.md) (decisions).
**Scope:** the executable plan to take today's synthetic MVP to a persistent, interactive v1 — refactor packet→graph, add Postgres+S3 persistence, and build the Explore + manual-add surfaces around a reproducible tiny-game demo.

---

## Goal & definition of done

A single reproducible demo where you open the app, load the seeded **tiny-game** project, **explore** its evidence graph (navigate, inspect nodes, scrub the timeline, run the verify/tamper check), and **manually add** new nodes + edges that persist across restarts (Postgres + S3). No packets, no auth, no crypto/anchoring/review workflow.

**Done when:**
- The domain package is graph-centric (no `EvidencePacket`); all existing invariants hold on the graph; tests green.
- A Postgres + S3 `EvidenceRepository` adapter persists and reloads a project's graph.
- The app renders a loaded project, supports inspect + timeline + verify/tamper, and manual add-node/add-edge that writes through to persistence.
- The tiny-game seed loads deterministically and is replayable.

---

## Phase 1 — Domain refactor (packet → graph)

*Contained change to `passion/packages/evidence-graph`. Keep the package name and public surface where possible; this is the extraction-critical layer.*

**Tasks**
1. **Remove packet concept.** Delete `EvidencePacket`, `EvidencePacketSelection`, `assembleEvidencePacket`, `packet.ts` and their exports/tests.
2. **Graph-level Merkle root.** Change `merkleRoot` to take the whole graph's node set. Change leaf ordering from digest-sort to **(timestamp, digest)**: sort by node timestamp, break ties by digest, so the root stays reproducible.
3. **Graph-level invariant + verify.** `assertHumanAuthority(graph)` and `Verifier.verify(graph, hasher)` operate on the graph, not a packet. Verify = recompute root + re-check bindings.
4. **Repository port.** Replace `savePacket`/`getPacket(milestoneRef)` with `saveGraph`/`getGraph(projectId)` (and a `deleteGraph(projectId)` for erasure).
5. **Attestation.** Keep the unsigned in-toto Statement *shape* as an optional graph-level artifact; not central to v1. (No signing — deferred.)
6. **Update golden tests** to the new graph-level root values; keep the tamper test (mutate a node → verify fails).

**Acceptance:** `pnpm --filter @gt100k/evidence-graph test` green; `assertHumanAuthority` still rejects a `model`-owned grade `Outcome`; recomputed root is stable across reloads.

**Keep (do not touch):** `canonicalize`, node/edge model + the 8/6 taxonomy, `Hasher` (SHA-256), the ports pattern.

## Phase 2 — Persistence (Postgres + S3) + project record

*New adapter package `@gt100k/evidence-repo-postgres` (mirrors the existing `evidence-repo-memory` so the in-memory one stays for tests).*

**Tasks**
1. **Schema.**
   - `projects(id, name, student_id, status, created_at, updated_at)`
   - `nodes(id /* content hash */, project_id, type, actor_ref, timestamp, payload jsonb, blob_ref nullable)`
   - `edges(id, project_id, type, from_id, to_id)`
   - Indexes on `project_id`.
2. **Blob store.** Large binaries (code snapshots, images, audio) → **S3**; `nodes.blob_ref` holds the key. Small metadata stays in `payload` JSONB.
3. **No raw PII in nodes.** `actor_ref` is an opaque `studentId`; enforce at the adapter boundary (reject obvious PII fields — cheap forward-compat guardrail per the design doc).
4. **Adapter methods:** `saveGraph`, `getGraph(projectId)`, `deleteGraph(projectId)` (erasure = delete rows where `project_id = X` + delete the S3 prefix).
5. **Local dev:** docker-compose Postgres + an S3-compatible local (MinIO or LocalStack) so the demo runs offline; wire env via `.env.local` (copied, never committed).

**Acceptance:** round-trip test — build a graph, `saveGraph`, `getGraph`, assert deep-equal + root re-derives; `deleteGraph` removes rows + blobs; e2e test mirrors the existing `evidence-repo-memory` e2e.

## Phase 3 — Explore surface

*Extend `evidence-explorer-view` (view model) + `evidence-explorer` (app). Keep the 3D Observatory aesthetic.*

**Tasks**
1. **Load a real project** from the Postgres adapter (replaces the synthetic-only fixture path; fixture still available for tests).
2. **Node inspector** — click a node → panel showing type, actor, timestamp, what it `derived_from`, and the attached artifact (render code/text/image from the blob).
3. **Edge navigation + type filter** — highlight a node's edges; filter the scene by node type.
4. **Timeline scrub** — replay the graph building over time by node timestamp (the reproducible "student journey" payoff).
5. **Verify seal + tamper demo** — keep as-is, operating on the loaded graph.

**Acceptance:** loading the seeded project renders all nodes; inspector shows correct derivation + artifact; scrub reveals nodes in timestamp order; tamper visibly fails verification. Keep the view-model guardrails (no competition/urgency/accusation).

## Phase 4 — Manual-add surface

*A 2D side panel; the 3D view only renders the result (per decision).*

**Tasks**
1. **Add-node form** — choose type (Artifact/Attempt/Transformation/Claim/Assistance/Contribution/Outcome), attach an artifact (upload → S3) or text, set timestamp.
2. **Add-edge control** — pick from-node, to-node, edge type; reject cycles + dangling refs (domain already enforces).
3. **Self-declared Assistance / Contribution** — the "helped by X" / "cited paper Y" path.
4. **Append-only** — adds grow the graph and persist immediately via `saveGraph`; no destructive history editing. Root recomputes after each add.

**Acceptance:** adding a node + edge in the panel persists, re-renders in 3D, survives a restart, and keeps the graph valid (verify still passes on untampered adds).

## Phase 5 — Demo seed (tiny game)

**Tasks**
1. Hand-author a deterministic fixture: a small **code game** built over N steps — drafts (`Artifact`), a plan (`Transformation`), runs/tests (`Attempt`), a self-declared AI `Assistance`, a reflection `Claim`, a final `Outcome` ("playable build"), wired with the edges.
2. A **seed script** loads it into Postgres+S3 idempotently (re-runnable → same graph, same root).
3. This fixture doubles as the Phase 3/4 test data.

**Acceptance:** `pnpm seed` (or similar) produces the same project + root every run; the app opens straight into it.

---

## Testing strategy
- **Domain:** unit + golden (root, invariants, tamper) — extend the existing suite.
- **Adapter:** round-trip + erasure + e2e against local Postgres/MinIO.
- **View/app:** the existing vitest/jsdom tests + new inspector/timeline/add-node tests; keep the guardrails test.
- Whole suite stays green (`pnpm test`).

## Out of scope (parked — see design §12)
Automatic capture, mediated-AI attestation, review + defense workflow, teams, consent/retention/legal-hold, three-layer crypto-shred + keys, external anchoring, signing, assessment panels, region/residency, Go services, auth/multi-user.

## Extraction-readiness (keep the door open)
- Preserve `@gt100k/evidence-*` names + pnpm layout; no new inbound coupling from outside the namespace.
- The Postgres/S3 config stays behind the `EvidenceRepository` port so a standalone build can swap stores.
- Extraction happens *after* v1 works — not now.

---

## Suggested sequencing
Phase 1 (unblocks everything) → Phase 2 → Phase 5 seed (gives real data) → Phase 3 Explore → Phase 4 Manual-add. Each phase is its own PR under the normal review gate.

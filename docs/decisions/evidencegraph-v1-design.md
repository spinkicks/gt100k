# EvidenceGraph v1 — Standalone Design

**Status:** Draft for discussion · Owner: (you) · Created 2026-07-23
**Companion:** decisions in [`evidencegraph-decisions.md`](./evidencegraph-decisions.md) (this doc folds those in).
**Grounding:** the shipped MVP (`passion/packages/evidence-graph`, adapters, `evidence-explorer` app); PRD §19 (the full vision this is a deliberately-scoped-down slice of).

---

## 1. What v1 is (one paragraph)

A **standalone evidence-graph product**: a student works on a project, and the app builds **one graph per project** — a content-addressed record of the artifacts, attempts, help, and outcomes behind the work, that a human can explore and, eventually, use to verify and defend authorship. v1 proves the *mechanics* end-to-end with **persistent, reproducible** data (a demo "student" journey you can replay), and is deliberately stripped of the crypto/privacy/anchoring/assessment machinery in PRD §19 — those come back once there are real children. v1 also shows how the graph slots into GT / GT-Acceleration / GT100K as a component, without depending on them.

## 2. Core concept: one graph per project

- **A project == one EvidenceGraph.** No matter how big or small. We **do away with `EvidencePacket`** as a separate object.
- **Graph** = a DAG of typed **nodes** + typed **edges** (both content-addressed).
- The functions the old packet performed **move up to the graph level**:
  - **Merkle root** = computed over *all* nodes in the graph, recomputable on demand.
  - **Human-authority invariant** = enforced on the whole graph.
  - The old "ledgers" (assistance / contribution / review / outcome) = just **views/queries** over the graph by node type — not a frozen object.
- **No sealing in v1.** The graph is a live record; its root recomputes on demand; verify + tamper-demo work on the live graph. (A lightweight signed *checkpoint* — `root + timestamp + signature` — is the growth path when external anchoring matters. Not built now.)

## 3. Scope boundary (keep vs. defer)

| Area | v1 | Deferred (post-v1 / pre-live) |
|---|---|---|
| Unit of work | One graph per project | — |
| Node/edge model | All 8 node + 6 edge types available | — |
| Capture | **Manual add** of nodes | **Automatic** instrumentation (hourly drafts, tool calls, test runs) |
| Explore | **Full navigable graph + inspector + timeline** | — |
| Review / defense | Node *types* exist; no workflow | Mentor review workflow, in-person defense/interview hooks |
| Integrity | Graph-level Merkle root, human-authority check, tamper/verify demo | Signed checkpoints |
| AI assistance | **Self-declared** (manual node) | Auto-attested mediated AI |
| Erasure | **Delete the project** (rows + blobs) | Three-layer crypto-shred, per-child keys |
| Anchoring | **Internal only** (recompute root) | External transparency log (Tessera/Rekor) |
| Signing | Unsigned in-toto shape (as MVP) | Sigstore / KMS signing |
| Assessment | Humans only, no panels | ACJ reliability, conformal calibration (shadow-only) |
| Privacy/consent | Parents can view; **no raw PII in nodes** (use a `studentId` ref) | Consent UX, retention policy, legal-hold, KMS |
| Stack | TypeScript, AWS, Postgres + S3 | Go services, region/residency, HSM |

## 4. Node & edge model (v1, code-first)

We keep the existing taxonomy (a W3C PROV extension); code is the first instrumented domain, but the model is domain-agnostic and open-ended is the eventual aim.

**Node types** (from `src/model.ts`):
- `Artifact` — a code file/snapshot, an image, a reflection text, a document.
- `Attempt` — a run/test/build attempt (mostly manual in v1; central once auto-capture lands).
- `Transformation` — a declared plan step ("I'm going to refactor X").
- `Claim` — a student assertion about the work (manual reflection).
- `Assistance` — AI or human help used (self-declared manual node in v1).
- `Contribution` — "helped by person X" / "cited paper Y" (optional manual node; solo projects otherwise).
- `Review` — reviewer evidence (type exists; no v1 workflow).
- `Outcome` — an external result ("deployed", "won contest") (manual).

**Edge types:** `derived_from`, `authored_by`, `used_tool`, `validates`, `contradicts`, `released_as`.

**No raw PII in node content** — actors are referenced by opaque `studentId`, not names/emails. Cheap habit that keeps the deferred crypto path open.

## 5. Capture (v1 = manual)

- The student **adds nodes by hand**: pick a type, attach an artifact (file/image/text), set a timestamp, and draw edges to existing nodes ("this draft `derived_from` that one", "this run `validates` this claim").
- Self-declared **Assistance** and **Contribution** nodes for AI help / external sources / collaborators.
- **Automatic capture is designed-for but not built:** the manual-add path and the eventual auto-emitter produce the *same node shapes*, so wiring connectors later (hourly code drafts, tool calls, test runs) doesn't change the model — it just changes who creates the node.

## 6. Integrity (v1)

- **Merkle root over the whole graph.** Ordering: **by timestamp, with a digest tiebreak** for equal timestamps (keeps the root reproducible).
- **Human-authority invariant** (enforced, unchanged from MVP): any final grade/judgment `Outcome` must have a **named human** actor; a `model` actor may only appear on `Assistance`/`Review`, never as a grade or an authorship accusation.
- **Verify + tamper demo:** recompute the root and re-check bindings on the live graph; mutating one node's bytes visibly fails verification. (This is the trust story even without external anchoring.)
- **Attestation:** keep the current **unsigned in-toto Statement** shape; signing deferred.

## 7. Erasure (v1)

- Erase a project = **delete its rows + its S3 blobs**. That's the whole story in v1, *because nothing is externally anchored or made permanent* — the elaborate crypto-shred architecture only exists to delete from things you deliberately made undeletable.
- The **no-raw-PII-in-nodes** habit (studentId refs) is the one forward-compatibility guardrail we keep.

## 8. Data & stack

- **Language:** TypeScript (reuse the tested domain core + ports/adapters).
- **Persistence (v1 is persistent + reproducible):**
  - **Postgres** — `nodes` and `edges` tables keyed by `project_id` (node id = content hash; payload as JSONB metadata + a blob reference).
  - **S3** — large binaries (code snapshots, images, audio).
  - **Erasure** = delete rows where `project_id = X` + delete the S3 prefix.
- **Cloud:** AWS (region/residency deferred).
- **Architecture:** keep the ports pattern. New **`EvidenceRepository` adapter (Postgres + S3)** alongside the existing in-memory one. The in-memory adapter stays for tests; Postgres+S3 backs the demo.

## 9. Interaction surfaces (v1 = Explore + Manual-add)

The current app is a **viewer**; v1 makes it interactive. **In scope:**

**Explore (the show-off surface)**
- Navigate the 3D constellation; **click a node → inspector**: what it is, its type, what it `derived_from`, the attached artifact (view the code/image/text), actor, timestamp.
- Follow/highlight edges; filter by node type.
- **Timeline scrub** — replay the project building over time (this is what makes a reproducible "student journey" compelling).
- **Verify seal + tamper demo** visible as a trust feature.

**Manual-add**
- Add a node (choose type, attach artifact, timestamp), then draw edges to existing nodes.
- Add self-declared `Assistance` / `Contribution` / `Claim` / `Outcome` nodes.
- Edits append (the graph grows); no destructive editing of history.

**Deferred:** automatic capture (connectors/instrumentation), the mentor **review** workflow, and the in-person **defense/interview** hooks (external to the core product per B3 — we only need a node *type* to attach a reflection/interview later).

## 10. UI direction

- **Keep the 3D Observatory aesthetic** — it looks good and is a differentiator.
- Add a **friendlier surface for kids (target 10–12)** to add nodes and explore without the reviewer-grade complexity — the eventual aim is usable by younger students, with more complex options for older ones.
- Role tiers are a later concern; v1 can be a single interactive app.

## 11. Standalone product + GT integration

- **Standalone:** the graph is its own product — a project → a verifiable, explorable record of how it was built. Demonstrable without any GT dependency.
- **Integration hooks (shown, not deeply wired in v1):** how the same graph plugs into **GT / GT-Acceleration / GT100K** — e.g. interest-lab proposes the project, passion-tutor sessions become `Assistance`/reflection nodes, the graph is the artifact a program reviewer would inspect. v1 keeps these as clean seams, not hard dependencies.

## 12. Parked (deferred, not dropped)

So nothing gets lost: project-start hand-off (A2), cadence (A6), automatic capture (B1-auto), mediated-AI attestation (B2), defense workflow (B3), team workflow (B5), consent/retention/legal-hold UX (B6/D3/D4), three-layer erasure + keys (C1/C2/D1/D2), external anchoring (C5), signing (C6), reviewer pool + assessment panels (E2/E3), region/residency (F2), Go services (F1-B), pre-live gate order (G2), pilot params (G3).

## 13. What's missing / open (let's discuss)

1. **Refactor vs. rebuild** — turning the current packet-centric code into graph-centric (see §14) is a real but contained change. Confirm we refactor the existing package rather than start fresh.
2. **Manual-add UX** — adding nodes + drawing edges in a 3D scene is fiddly. Do we add nodes in a **2D side panel / form** and let the 3D view just *render* them? (I lean yes.)
3. **What's a "project" record** — beyond nodes/edges, does a project need a name, owner (`studentId`), created/updated, status? (Minimal metadata table.)
4. **Demo content** — we need one hand-authored, reproducible "student journey" (a code project built over ~N steps) as the seed. Who/what domain — a small game? a script? (Ties to the interest-lab cabins.)
5. **Does v1 need auth/multi-user at all**, or is it a single demo project loaded from a fixture? (Simplest: seedable fixtures + one editable project.)

## 14. Impact on existing code (for the spec)

Concrete changes from today's MVP:
- **Remove/deprecate** `EvidencePacket`, `EvidencePacketSelection`, `assembleEvidencePacket`, `packet.ts`.
- **`merkleRoot`** → operate over the whole graph's node hashes; change leaf ordering from digest-sort to **(timestamp, digest)**.
- **`assertHumanAuthority(graph)`** and **`Verifier.verify(graph)`** → operate on the graph, not a packet.
- **`EvidenceRepository`** → `saveGraph`/`getGraph(projectId)`; add a **Postgres + S3 adapter**.
- **`evidence-explorer-view` / app** → add the **inspector** and **manual-add** surfaces; keep layout/verify/tamper as-is.
- Keep: `canonicalize`, node/edge model, `Hasher` (SHA-256), the unsigned `Attestation` shape, the view-model guardrails (no competition/urgency/accusation).

---

**Next:** once we align on §13, I write the build spec (v1 workflow + the refactor + the Postgres/S3 adapter + the Explore/manual-add surfaces) and we build behind the normal PR/review gate.

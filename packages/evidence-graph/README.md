# `@gt100k/evidence-graph`

Pure TypeScript domain logic for a content-addressed evidence DAG. The package has no framework, storage,
network, clock, or runtime-crypto dependency. Callers supply those capabilities through ports.

Use synthetic or pseudonymous data with this feature slice. `consentScope` records scope metadata; it does
not implement consent, legal, or admissions workflows.

## Quick start

This example builds and verifies a one-node synthetic packet. The Node.js hasher and deterministic verifier
are workspace adapters, not domain dependencies.

```ts
import {
  addNode,
  assembleEvidencePacket,
  type EvidenceGraph,
  type EvidenceNode,
} from "@gt100k/evidence-graph";
import { NodeCryptoHasher } from "@gt100k/evidence-hash-node";
import { DeterministicStubVerifier } from "@gt100k/evidence-verifier-stub";

const hasher = new NodeCryptoHasher();
const emptyGraph: EvidenceGraph = { nodes: {}, edges: [] };
const artifact = {
  type: "Artifact",
  actor: { kind: "human", ref: "author-synthetic-001" },
  tool: { name: "synthetic-editor", version: "1.0.0" },
  inputs: [],
  timestamp: "2026-01-01T00:00:00.000Z",
  consentScope: { scope: "synthetic" },
  payload: { title: "Synthetic artifact" },
} satisfies Omit<EvidenceNode, "id">;

const { graph, id } = addNode(emptyGraph, artifact, hasher);
const packet = assembleEvidencePacket(
  graph,
  {
    milestoneRef: "milestone-synthetic-001",
    subjectDigest: id,
    nodeIds: [id],
  },
  hasher,
);

const result = await new DeterministicStubVerifier().verify(packet, hasher);
if (!result.ok) throw new Error(result.reasons.join(", "));
```

## Public domain API

| Export | Purpose |
| --- | --- |
| `canonicalize` | Serialize node content with stable JCS key ordering before hashing. |
| `addNode` | Hash node content and return a graph with the node inserted; identical content is a no-op. |
| `addEdge` | Return a graph with one resolved edge while rejecting self-edges and cycles. |
| `assertHumanAuthority` | Enforce human ownership of grades and the no-accusation rule. |
| `merkleRoot` | Compute an RFC-6962 raw-byte Merkle root through an injected hasher. |
| `buildAttestation` | Build the unsigned in-toto Statement used by this slice. |
| `assembleEvidencePacket` | Validate a selected subgraph and derive its packet, ledgers, root, and attestation. |
| `traceEvidence` | Return the connected supporting node ids for a selected node, excluding unrelated islands. |

The entrypoint also exports the domain records, taxonomies, PROV mappings, input types, and verification
result types used by these functions.

## Ports and adapters

Domain functions accept ports by structural TypeScript contracts. Swap an adapter without changing domain
code.

| Port | Adapter in this slice | Status |
| --- | --- | --- |
| `Hasher` | `NodeCryptoHasher` from `@gt100k/evidence-hash-node` | SHA-256 via `node:crypto`. |
| `Verifier` | `DeterministicStubVerifier` from `@gt100k/evidence-verifier-stub` | Re-derives the Merkle root and checks the unsigned attestation bindings. |
| `EvidenceRepository` | `InMemoryEvidenceRepository` from `@gt100k/evidence-repo-memory` | Deep-copy-isolated, process-local storage. |
| `TransparencyLog` | `StubTransparencyLog` from `@gt100k/evidence-deferred` | NON-PRODUCTION deterministic placeholder. |
| `ErasureService` | `StubErasureService` from `@gt100k/evidence-deferred` | NON-PRODUCTION deterministic placeholder. |

`Hasher.hash` is synchronous. The `Verifier`, `EvidenceRepository`, `TransparencyLog`, and
`ErasureService` methods are asynchronous. See [`src/ports.ts`](./src/ports.ts) for the exact contracts.

## Deferred capabilities: NON-PRODUCTION

The following decisions are pre-live gates. Do not treat their current shapes as production security,
reliability, or compliance machinery.

- **D1: Transparency-log anchoring.** `StubTransparencyLog` returns a deterministic `stub: true` inclusion
  proof. It does not contact or anchor into an external log.
- **D2: Crypto-shred erasure.** `StubErasureService` returns a deterministic `stub: true` tombstone. It does
  not manage keys, delete encrypted payloads, or prove erasure.
- **D3: Comparative-judgment reliability.** This slice provides no implementation or interface.
- **D4: Conformal calibration.** This slice provides no implementation or interface.
- **D5: Durable public-export provenance.** This slice provides no implementation or interface.
- **D6: Attestation signing.** `buildAttestation` emits an unsigned in-toto Statement. The verifier checks
  structure and digest bindings, not a signature or trust chain.

Run the package tests with:

```bash
pnpm --filter @gt100k/evidence-graph test
```

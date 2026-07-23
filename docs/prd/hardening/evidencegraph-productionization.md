# Hardening Mini-Spec — EvidenceGraph Productionization & Erasure (Weak Point #6)

**Status:** Draft v1 · 2026-07-22 · Owner: (product)
**Addresses:** Weak point #6 — the EvidenceGraph (the "prove the spike" pillar) is entirely pre-production (D1–D6), and the hardest gate — right-to-erasure on an append-only store for child data — is unsolved.
**Decision:** adopt the three-layer architecture below (clear engineering recommendation; no user-facing fork).
**Grounding:** `docs/research/passion-pipeline/hardening/08-evidencegraph-productionization.md`; EvidenceGraph MVP (`passion/packages/evidence-graph/README.md`).

---

## 1. Core insight

Don't try to *delete from* the append-only graph — arrange things so **nothing personal is ever on it**. Erasure then becomes a data-modeling property, not a delete operation.

## 2. The three layers

- **L0 — Immutable Evidence DAG.** Holds only **content-address digests over ciphertext**, plus pseudonymous references, Merkle roots, attestations, and inclusion proofs. No personal data, ever. This is the tamper-evident layer that stays append-only and still verifies every packet.
- **L1 — Off-graph payload store.** The actual project artifacts/process content, **encrypted under per-child keys**, stored off the DAG.
- **L2 — Identity/index map.** Maps a real child to their pseudonymous refs and keys. Fully deletable.

## 3. How erasure works

Erase a child = **hard-delete L2** (identity + index) **+ crypto-shred that child's key** (destroy every copy of the key-encrypting key). L1 ciphertext becomes permanently unreadable; L0 is untouched but is now **anonymous by construction**, so historical packets still verify while nothing personal remains recoverable. Crypto-shred is treated as a **supplement to real deletion of off-graph identifiers**, not a substitute.

## 4. The one load-bearing invariant (the "digest trap")

**Never content-address plaintext PII.** A hash of a name, a grade, or a face is itself personal data that cannot be erased. Everything hashed onto L0 must be a digest over *ciphertext* or a high-entropy pseudonym. This single rule is what makes the whole scheme work; it must be enforced in the domain layer (extend the MVP's canonicalize/addNode path to reject non-ciphertext personal fields).

## 5. Sequencing (D1–D6)

1. **D2 first — the erasure data model** (three layers + per-child keys + the digest-trap invariant). This must precede external anchoring, or you anchor un-erasable child PII into a third party.
2. **D1 + D6 — external anchoring + signing.** The MVP is already RFC-6962 / in-toto shaped, so this is "add attestation signing + a transparency-log entry" (Sigstore/Rekor-class), not a redesign — done *after* D2 so only anonymous digests are anchored.
3. **D3 + D4 — assessment reliability + calibration**, run as a **parallel, shadow-only track** (comparative-judgment reliability + calibrated confidence), never gating a child's record on its own; **humans own every grade** (`assertHumanAuthority`).
4. **D5 — durable public-export provenance** for the outward evidence packet (the demand-side-pull artifact), built on the signed, anchored, anonymous L0.

## 6. Standards to build against

EDPB Guidelines 02/2025 (keep personal data off the immutable structure — not even encrypted or hashed; technical immutability is no excuse for non-erasure); NIST SP 800-88 Rev.1 §2.6 (Cryptographic Erase — all key copies must be destroyed and encryption in force from first write); C2PA (export/provenance, with the known limit that manifests are strippable and don't attest human authorship — hence the human defense).

## 7. Open items / limits

- **Crypto-shred is not magic:** it only holds if encryption was in force from the first write and *every* key copy (backups, caches) is destroyed — key-management rigor is the whole ballgame.
- **This is a pre-live gate:** no live child data touches the system until D2 is implemented and verified.
- One cited spec critique (Sherman et al. on C2PA) is unverified; the strippable-manifest point is supported instead by the official C2PA spec.

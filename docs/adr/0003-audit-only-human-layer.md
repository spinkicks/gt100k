# Audit-only human layer with two carve-outs

**Context:** The recommended model was risk-based human review across gates and defenses; software-first delivery at 100k scale pushed toward more automation.
**Decision:** Default is fully-automated + sampled audit, with human *ownership* retained only for (a) child wellbeing/safety actions and (b) grades/authorship "of record" that leave the system to external gatekeepers.
**Why:** Scale and minimal human reliance were prioritized, while preserving the two surfaces where full automation would contradict EvidenceGraph SPOV 6 ("a human owns every grade") and create real child-harm risk. See `../prd/hardening/human-scaling.md`.
**Note (2026-07-27):** SPOV 6 is enforced inside the EvidenceGraph, which is now a separate product (`docs/decisions/evidencegraph-v1-design.md` §13a); this decision depends on that invariant across a product boundary rather than owning it.

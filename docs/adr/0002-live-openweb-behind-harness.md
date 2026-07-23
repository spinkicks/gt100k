# Concierge serves live open-web to children behind a defense-in-depth harness

**Status:** accepted (a deliberate higher-risk choice; revisit if incidents occur)

**Context:** The child-safe-RAG research (`hardening/child-safe-rag.md`) recommended curated-first with unknown open-web *cache-and-vet* (never served live) for ages 6–14.
**Decision:** We serve live open-web behind the full staged harness (input guard → curated-first → grounded cite-or-refuse → moderation → age-gate), uniform across ages, with async vet→promote and distress→human escalation.
**Why:** Long-tail coverage and latency were prioritized over the stricter cache-and-vet default; the deviation is deliberate, and the harness + escalation are the mitigations. Recorded because a future reader will reasonably ask why we serve live open-web to a 6-year-old.

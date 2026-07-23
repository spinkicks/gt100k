# Hardening Mini-Spec — Child-Safe Concierge RAG (Weak Point #3)

**Status:** Draft v1 · 2026-07-22 · Owner: (product)
**Addresses:** Weak point #3 — child-safe open-web retrieval for the concierge was under-specified.
**Decision:** **Live open-web behind the full harness, uniform across ages** (unknown domains served live after passing the harness; vetting/caching runs async and does not gate serving). Architecture-focused per direction.
**Grounding:** `docs/research/passion-pipeline/hardening/07-child-safe-rag.md`.

---

## 1. Design stance

The concierge answers live from the open web, but **retrieval is treated as untrusted evidence, not an answer**. Every request passes a staged, defense-in-depth pipeline before anything reaches a child; the model is never the only gate (grounding + moderation + age-gate sit around it). Caching, human vetting, and promotion into the curated library happen **asynchronously** and improve future answers, but do not block the live response.

## 2. The live request pipeline (each stage can refuse/deflect)

1. **Session gate** — server-side age-tier + consent context attached to the request (age tier is a server fact, not client self-attestation).
2. **Input guard** — PII scrub on the child's message; prompt-injection/jailbreak detection; intent + distress/safety classification. **Distress/safety signals exit the RAG lane immediately** and escalate to a human (the concierge never counsels, never impersonates a professional).
3. **Curated-first resolution** — answer from the vetted library (A6) when it covers the need; skip retrieval.
4. **Gap-triggered retrieval** — only on a genuine gap; **allowlist-biased** ranking (reputable sources scored up) over raw results.
5. **Per-document filter** — safety/quality/age-appropriateness classification per retrieved doc; drop failures; **injection "spotlighting"** so retrieved text can't hijack the model.
6. **Grounded generation, cite-or-refuse** — the answer must be grounded in the passed documents with citations; a **faithfulness gate** rejects unsupported/hallucinated output → refuse or fall back to curated.
7. **Output moderation** — child-extended safety taxonomy on the generated answer (independent of the input check).
8. **Age-appropriateness + readability gate** — tone/reading-level shaped to the child's tier.
9. **Serve with citations** — the child gets the answer + where it came from; the concierge frames it as a pointer to learning material, converting the niche into a testable probe (never scored chat).
10. **Async: cache → human-vet → promote** — served open-web results are cached provisionally and queued for human vetting; only vetted resources are **promoted** into the curated library (A6) with signed provenance, so the curated corpus compounds and future answers need less live retrieval.

## 3. Software components

- **Moderation/safety classifier** — an open safety model (e.g., Llama Guard-class) against an **MLCommons-style hazard taxonomy extended for children**; runs on both input (step 2) and output (step 7).
- **Grounding/faithfulness** — cite-or-refuse generation (Self-RAG-style) with an automated faithfulness score (RAGAS-style) as the gate in step 6.
- **Injection defense** — layered controls per OWASP LLM01 (spotlighting/delimiting retrieved content; treat all retrieved text as untrusted); injection "cannot be patched," so defense is architectural, not a single filter.
- **Source reputation/allowlist service** — maintains domain trust scores that bias retrieval ranking (step 4) and feed the vetting queue priority.
- **Age-tier + readability service** — maps the server-side age tier to reading level, tone, and refusal strictness.
- **Vetting/promotion workflow** — the async human-vet queue + signed promotion into A6 (shares the provenance/audit machinery with the EvidenceGraph).
- **Escalation router** — distress/safety → human (shared with the burnout/wellbeing escalation path, F2/F1).

## 4. Standards to build against

COPPA (2025 update), UK Age-Appropriate Design Code, EU AI Act (Art. 5 prohibited practices; Art. 50 transparency), IEEE 2089 (age-appropriate design), NIST AI 600-1 (GenAI risk), OWASP Top-10 for LLM Apps 2025 (LLM01 injection).

## 5. Open items / limits

- **6–8 band is the least-studied, highest-risk** — even served live, keep the strictest refusal thresholds and readability floor for the youngest tier (a parameter, not a separate pipeline).
- **Faithfulness/moderation classifiers are imperfect** — the async human-vet loop is what turns a live corpus into a trusted one over time; prioritize vetting by traffic + reputation gaps.
- Curated coverage is the real lever: the more A6 covers, the less the live open-web path is exercised.

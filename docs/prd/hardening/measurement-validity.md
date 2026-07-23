# Hardening Mini-Spec — Measurement Validity & Cold-Start (Weak Point #1)

**Status:** Draft v1 · 2026-07-22 · Owner: (product)
**Addresses:** Weak point #1 — the interest model has no answer key for years, so we could be silently wrong about many kids and never notice; signal is also thin for external resources and depends on tag quality.
**Decision:** the **leaner** program — behavior + a light kid/family check-in, **no** sampled human cross-check, **no** randomized-exploration slice. We keep the two zero-cost, no-human safeguards: the model can say "not sure yet," and we bank long-term outcome data from day one. Accepted trade-off: early mis-reads are harder to catch, and there is some self-fulfilling-prophecy risk.
**Grounding:** `docs/research/passion-pipeline/hardening/06-measurement-validity-coldstart.md`.

---

## 1. What we're building

A way to keep the interest read honest when we can't yet check it against reality.

## 2. What's in (leaner set)

- **Two evidence sources, lightly cross-referenced:** the behavioral read (primary) + a light kid/family check-in. When they clearly disagree, the system leans toward "not sure yet" rather than committing.
- **"Not sure yet" is a real output.** When evidence is thin or conflicting, the system reports low confidence and the hypothesis **stays `EXPLORING`** instead of hardening — no confident label on weak evidence. (Automated; the calibrated-uncertainty part of the inference engine, C3.)
- **Cold-start from priors, then let behavior take over.** A new kid starts from the environment/aptitude priors *shrunk toward similar-kid patterns* (so we're not guessing wildly from one data point), and the behavioral signal overtakes the prior as it accumulates.
- **Tag-quality gate.** Because the whole read depends on domain × work-mode tags being right, tag reliability is measured (inter-rater agreement on a sample) and the content-based warm-up isn't trusted for a topic until its tags clear a quality bar.
- **Bank the long-term outcome data now.** From day one, record what "this kid actually developed a lasting passion" will look like later, and collect it — so in ~2–4 years we can finally check early reads against reality and sharpen the model. (Near-zero cost now; the only path to real validation later.)

## 3. What's out (dropped by decision) + the accepted risk

- **No sampled blinded human cross-check** — removes the strongest early warning that a read is wrong before the long-term data arrives.
- **No randomized-exploration slice** — every probe is optimized, which is efficient but risks a self-fulfilling loop (we mostly show a kid what we already think they like, they return to it, "confirming" a possibly-wrong guess).
- **Mitigations that partially offset:** the "not sure yet" default and the coverage pass (kids still sample ≥6 domains early) blunt, but do not eliminate, the loop risk; the banked long-term data is the eventual backstop.

## 4. Where it lives

The Calibration/Validation Harness (**G5** in `passionApps.md`) owns the tag-quality checks, the confidence calibration, the cold-start priors, and the long-term outcome bank. It reads from the event capture (C1) and inference engine (C3) and writes calibration back to C3.

## 5. Open items / limits

- If early mis-read rates look high once the first long-term data lands, revisit adding back the human cross-check and/or the random slice (they were dropped for leanness, not because they're wrong).
- The self-fulfilling-loop risk should be watched via coverage-breadth and reopen-rate metrics (G6).
- Methods here are borrowed from fields where an answer eventually arrives; the bet that they transfer to children's latent interest is real and is what the banked long-term data ultimately tests.

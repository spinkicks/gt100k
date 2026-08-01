# Hardening Mini-Spec — Measurement Validity & Cold-Start (Weak Point #1)

**Status:** Draft v1 · 2026-07-22 · Reviewed against the code 2026-07-28 (see §3 and §4) · Owner: (product)
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
- **No randomized-exploration slice** — a probe is chosen rather than drawn, which is efficient but risks a self-fulfilling loop (we mostly show a kid what we already think they like, they return to it, "confirming" a possibly-wrong guess).
  - **Partly answered since, by a deterministic hold-out rather than a random one.** `@gt100k/surfacing` reserves a **falsification probe** on every slate: the believed domain the model rates *lowest*, offered precisely because a read that only ever tests its own favourite cannot be shown to be wrong. It is not randomization and does not carry randomization's unbiasedness, but it does close the specific hole this bullet describes — the engine now bets against itself on the record. The same policy pays **maintenance debts before breadth**: a domain that has been triggered is owed four spaced re-exposures before it may be dropped, because a triggered-then-abandoned domain ends measurably below an untouched one.
- **Mitigations that partially offset:** the "not sure yet" default, the coverage pass (kids still sample ≥6 domains early) and the falsification probe blunt, but do not eliminate, the loop risk; the banked long-term data is the eventual backstop.

## 4. Where it lives

The Calibration/Validation Harness (**G5** in `passionApps.md`) owns the tag-quality checks, the confidence calibration, the cold-start priors, and the long-term outcome bank. It reads from the event capture (C1) and inference engine (C3) and writes calibration back to C3.

G5 itself is unbuilt, and three of its four pieces have landed elsewhere in the meantime, which is worth naming so nobody builds them twice. **Tag quality** is `@gt100k/two-axis-tagging`: Krippendorff's alpha over rater samples against a 0.667 bar, a review queue for spot-audits, and a per-topic gate that leaves an artifact `PROVISIONAL` until its topic clears. **Cold-start priors** are the three weighted tilts on C3's Beta prior, though the partial pooling toward similar kids is not among them. **The loop tripwires** — coverage breadth and reopen rate — are `@gt100k/guardrails`. What has no home yet is the part this spec calls the only path to real validation: **nothing records what "this kid developed a lasting passion" will look like later, and nothing collects it.** The append-only interaction log is the substrate it would be built on, not the bank itself.

## 5. Open items / limits

- If early mis-read rates look high once the first long-term data lands, revisit adding back the human cross-check and/or the random slice (they were dropped for leanness, not because they're wrong).
- The self-fulfilling-loop risk should be watched via coverage-breadth and reopen-rate metrics (G6).
- Methods here are borrowed from fields where an answer eventually arrives; the bet that they transfer to children's latent interest is real and is what the banked long-term data ultimately tests.

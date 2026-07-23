# Hardening Mini-Spec — Human:Student Scaling (Weak Point #4)

**Status:** Draft v1 · 2026-07-22 · Owner: (product)
**Addresses:** Weak point #4 — the "thin human layer" risks either not scaling to 100k students or degrading into rubber-stamping, which would gut the "a human owns every grade" principle.
**Decision source:** design session. **Grounding:** EvidenceGraph SPOV 6 + `assertHumanAuthority`; push/back-off memo guardrail #3; LearnLM RCT (AI can conduct at human level).

---

## 1. Problem

Humans are nominally required at many judgment points (autonomy sign-offs, wellbeing/back-off/rest/quit calls, defense grade ownership, missingness check-ins, family re-coaching). Multiplied by 100,000 students this is either unstaffable or forces humans to "own" thousands of AI-conducted decisions they can't meaningfully engage — rubber-stamping, which is the exact failure `assertHumanAuthority` exists to prevent.

## 2. Decision: audit-only by default, with two human-owned carve-outs

**Default = fully automated + sampled audit** for the large majority of decisions: routine assessment, Specialization-Planner output, resource routing, in-system stage progression, and hypothesis updates. AI conducts and decides; a risk-based **audit** samples for quality. This is the scale move and it is fine here because these decisions are **reversible and internal**.

**Carve-out A — Child wellbeing/safety actions are human-owned.** Any burnout **back-off/rest/quit** action, any **distress or safety** escalation, and any interpretation of a sustained multi-signal decline is proposed by the system but **owned and executed by a human**. Grounding: push/back-off guardrail #3 ("the system proposes, humans dispose; no automated burnout label ever reaches the child"); the burnout signal is lagging and multi-caused, and the cost of a wrong automated call is a harmed child.

**Carve-out B — Grades/authorship "of record" are human-owned.** Any grade, defense verdict, or portfolio judgment that **leaves the system to an external gatekeeper** (admissions, competitions, the public evidence packet) has a **human owner**. Grounding: EvidenceGraph SPOV 6 + `assertHumanAuthority`; human ownership *is* the authorship moat and the safeguard against a machine wrongly judging a child. In-system formative assessment stays audit-only; only the outward, high-stakes "of record" judgment is carved out.

## 3. Routing: escalate by calibrated uncertainty + risk flags

The inference engine (C3) already emits **calibrated uncertainty**, so routing is confidence/risk-based, not blanket:

- **High-confidence, low-risk, internal** → automated + sampled audit.
- **Low-confidence / contested / high-stakes / carve-out A or B** → human owner.
- **Risk flags** that force a human: quiet-devaluation, sustained multi-signal decline, missingness past threshold, safety/distress signals, family-pressure signals, a contested hypothesis, or an of-record grade.

## 4. Anti-rubber-stamp design (for human-owned decisions)

Human ownership must be *real*, so the console (F1) enforces engagement before a sign-off is accepted:

- The human must **interact with specific evidence** (e.g., watch the defense clip, open the strongest disconfirming evidence, view the behavioral trajectory) — not a one-click approve.
- **Dissent is cheap and logged**: overriding the AI recommendation is a first-class, low-friction action; agreement and override are both recorded with a reason.
- **Decision quality is itself audited** (calibration of human owners over time; are sign-offs discriminating or reflexive?).
- **Batch caps**: a hard limit on carve-out decisions per human per day, sized so engagement stays real (the ratio, §6, is set from this).

## 5. Audit sampling (for automated decisions)

- **Risk-stratified sampling**: higher sample rate for lower-confidence and higher-impact automated decisions; a floor random sample everywhere.
- Audits check: guardrail compliance (no scalar-score leakage, no prompted returns counted, novelty discounted), calibration (are automated confidences honest?), and drift.
- Audit findings feed the **Calibration/Validation Harness (G5)**.

## 6. The ratio (a load model, not a guess)

Set the human:student ratio bottom-up from carve-out volume, not by fiat:

```
weekly human-owned decisions per student
  = P(wellbeing/safety escalation) + P(of-record grade this week)
    + P(low-confidence/contested gate) + P(family-pressure flag)
humans needed = (students × weekly decisions/student) / (per-human weekly carve-out cap)
```

Instrument each probability on the first cohorts; the audit sample rate and the per-human cap are the two dials. **Target: keep per-human carve-out load under the cap that preserves genuine engagement** (to be measured, not assumed).

## 7. Open questions / limits

- The right **per-human engagement cap** and the resulting ratio are empirical — measure on cohort 1.
- **Automation bias** in the human owners (deferring to the AI recommendation) is a real risk even with anti-rubber-stamp UX; audit human calibration for it.
- The boundary between "in-system formative" and "of-record" grades must be drawn precisely so carve-out B doesn't quietly expand to swallow everything (re-collapsing scale) or contract to nothing (losing the moat).

# Engine Spec — Two-Axis Tagging System (C2)

**Status:** Draft v1 · 2026-07-22 · Owner: (eng)
**Purpose:** Tag everything a kid can engage with along two axes — **domain** (topic) and **work-mode** (style) — so the inference engine (C3) can read interest per `(domain × work-mode)` cell. The whole signal depends on these tags being valid.
**Grounding:** Discovery App PRD §6.1; measurement-validity hardening spec (tag-validity gate).

---

## 1. The two axes

### Domain (topic) — hierarchical
- **Coarse level:** the ~8 cabins (Music & Sound, Code & Computers, …).
- **Fine level:** sub-topics inside a cabin (audio → subwoofers; code → game-dev). 
- **Extensible tail:** the concierge can **mint a new fine sub-topic on the fly** (always parented to a cabin) when a kid's niche isn't stocked. So the taxonomy grows without a schema change.
- Inference reads at **both levels** — coarse for a robust read, fine for an actionable one.

### Work-mode (style) — a fixed set of verbs
The nine: `build, investigate, compose, perform, debug, explain, persuade, collaborate, care`. Each ships with a **crisp operational definition + examples + boundary rules** (e.g., "build = produces a new artifact/structure; investigate = probes how something works without necessarily producing one"). An action is tagged with a **primary** mode + optional **secondary**.

## 2. Afforded vs. engaged (the crux — decided)

- Each **artifact** (gadget, taste app, resource) carries the work-modes it **affords** — the candidate set of styles it makes possible (a synth: perform / build / investigate).
- The kid's **actions resolve which mode(s) they actually engaged**, constrained to that candidate set. This is what lets us see a kid *built* the synth rather than *performed* it — the distinction the two-axis model exists for.
- **Action → engaged-mode classification:** the interaction is instrumented; the engaged mode is derived from the action against the afforded candidate set (deterministic rules where the action maps cleanly; a light classifier for ambiguous actions).

## 3. Tagging pipeline (who tags, and how we trust it)

- **Bounded core** (cabins, gadgets, taste apps, curated library): **manually curated tags** = the gold standard.
- **Long tail** (open-web resources routed by the concierge; new sub-topics): **auto-tagged** (domain path + afforded modes) by a classifier, then validated against the gold set.
- **Validity controls** (this is the load-bearing part):
  - Measure **inter-tagger agreement** on a sample against a reliability bar; refine or merge/split any work-mode that tags unreliably.
  - **Human spot-audit** of auto-tags; disagreements feed back into the classifier and the definitions.
  - **Tag-validity gates trust:** per the measurement-validity spec, a topic's content-based read is not trusted until its tags clear the reliability bar.

## 4. Data model (sketch)

```
Artifact  { id, domainPath: [cabin, subTopic?], affordedModes: WorkMode[], source, provenance, tagConfidence }
ActionEvent { kidId, artifactId, engagedModes: { primary: WorkMode, secondary?: WorkMode },
              depthSignals, timestamp, returnState: voluntary|prompted, noveltyFlag }
```

`ActionEvent`s are the input to C1 (event capture) → C3 (inference). Domain is carried as a path so inference can aggregate at coarse or fine granularity.

## 5. Open items

- Final work-mode list may shift after reliability testing (some verbs may merge/split).
- Auto-tag **drift** over time → periodic re-validation against the gold set.
- Concierge-minted sub-topics need a light dedup/merge process so the fine taxonomy doesn't fragment.

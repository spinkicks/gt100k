# Architecture / Design Decision Records

System-wide ADRs for GT100K. One decision per file, sequential: `0001-slug.md`, `0002-slug.md`, …
Format: `~/.claude/skills/domain-modeling/ADR-FORMAT.md` (1–3 sentences: context, decision, why).

ADRs are created **lazily** — only when a decision is (a) hard to reverse, (b) surprising without
context, and (c) the result of a real trade-off. Most grilling sessions produce a sharper glossary
(`passion/CONTEXT.md`) and few ADRs.

## Resolved — 2026-07-22 design session

The passion-design agenda below was resolved in a grilling session and captured in the new PRDs
(`docs/prd/`). The hard-to-reverse / surprising / trade-off decisions also have numbered ADRs.

- [x] **Governing philosophy** — `passionBrainlift` (built-not-found, reversible + plural, voluntary
  return) governs where it conflicts with `gtBrainlift` (specialize-early / burn-breadth). → **ADR-0001**;
  `SPECIALIZATION-PIPELINE-PRD.md`.
- [x] **Discretionary-XP** — a weak *prior* that seeds discovery, not a co-equal interest signal;
  academic achievement is the strong *aptitude* tilt. → `DISCOVERY-APP-PRD.md` §6.5.
- [x] **Discovery output + boundary** — a revisable ranked hypothesis of 1–3 spikes; the Phase 2→3 gate =
  return-after-a-gap + full-term durability + a perseverance artifact + a human autonomy sign-off.
  → `DISCOVERY-APP-PRD.md` §8/§10; `SPECIALIZATION-PIPELINE-PRD.md` §3.
- [x] **Discovery vehicle** — 2D walkable overworld + bounded 3D cabin interiors; three-layer interaction.
  → `DISCOVERY-APP-PRD.md` §5.2/§5.4. **Revised 2026-07-25 — there is no locomotion anywhere; both
  layers are point-and-click.** The two halves changed with different status and should not be read as
  one decision: the walkable 3D interior is **withdrawn permanently** (fixed camera, on art economics
  that budget does not change), while the walkable 2D overworld is **deferred, not rejected** and is
  today a click-to-select map of cabin signposts. See PRD §5.2 as revised, and
  `docs/decisions/2026-07-27-discovery-surface.md` §-1, which keeps the game as the child-facing
  surface and rules out a second child-facing app.
- [x] **Scoped cabins + concierge** — bounded-but-porous: curated cabins as triggers + an on-demand
  concierge opening the long tail. → `DISCOVERY-APP-PRD.md` §5.3/§5.5.
- [x] **Gadget→resource** — showroom → best-effort on-platform taste → external curated resource; live
  open-web behind a child-safe harness. → `DISCOVERY-APP-PRD.md` §5.4; **ADR-0002**; `../prd/hardening/child-safe-rag.md`.
- [x] **App architecture** — the 30-artifact catalog + flow + build order. → `passionApps.md`,
  `passion-roadmap.md`.
- [x] **Social influence** — family/peers = a weak additive prior in discovery + a strong amplifier in
  specialization (autonomy-supportive, never gating). → `SPECIALIZATION-PIPELINE-PRD.md` §9.
- [x] **Push / step-back / abandon** — "push the challenge, never the child"; quiet-devaluation is the
  earliest burnout tell. → `SPECIALIZATION-PIPELINE-PRD.md` §8.

### ADRs recorded from this session

- **ADR-0001** — passion product follows `passionBrainlift` where it conflicts with `gtBrainlift`.
- **ADR-0002** — concierge serves live open-web to children behind a defense-in-depth harness.
- **ADR-0003** — audit-only human layer with two carve-outs.
- **ADR-0004** — leaner interest-measurement validity (no sampled human cross-check / no randomized reserve).

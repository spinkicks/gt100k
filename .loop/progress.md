# Loop progress — interest-lab (003) · VISUAL POLISH pass (claude)

## Task
Elevate **apps/interest-lab** ("Curiosity Quest World") to the game-feel bar.
Do NOT rebuild domain/logic; keep tests green. This is a visual pass.
FIRST read ~/code/gt100k-factory/docs/game-feel.md. Use the design skills every turn:
impeccable, apple-design, emil-design-eng, find-animation-opportunities, ui-ux-pro-max, ui-styling.

## Committed art direction (see .loop/decisions.md D-VP1)
"Curiosity Quest World" — a warm, tactile, hand-crafted floating-island atelier at dusk.
Palette (from `@gt100k/interest-lab-view` PALETTE): deep plum night (#181026 / #221A3D / #120B1E),
spark orange (#FF9E5E→#FFC08A), beacon gold (#FFD166), tide cyan (#5EC8D8), sprout green (#7BD88F).
Material language: frosted-glass panels with a thin lit top rail, inset "trench" controls, warm
emissive glow, spring/ease-out motion. Display font Fredoka; reading serif Iowan; body Inter.

## Turn history
- **Turn 1 (this):** Killed the worst remaining AI-demo tell — the stock `<select>` dropdown
  control surface (verbatim auto-fail #2 / violates non-negotiable #7). Rebuilt
  `app/ui/controls/InterestLabControls.tsx` as a game HUD "mission deck": eyebrow + display-font
  title + live telemetry status chip; four **segmented radio controls** (Age / Motion / Surface /
  Render tier) with lucide-weight inline icons, tactile pill segments (spark-gradient active fill,
  hover lift, `scale(0.97)` press, focus rings) sitting in inset trenches; a **toggle switch** for
  Plain mode. Panel gained real depth (frosted glass + lit top rail + layered shadow + corner glow).
  Test-safe: preserved the `name=`/`value=` markup the SSR tests assert (radios keep the group names).
  Gate green: tsc + 73 tests + `next build`. Verified the HUD DOM in the served production HTML.

## What still reads generic (candidates for next turns)
- **No post-processing grade (#4 — ~half of AAA feel, still 100% absent).** The 3D world has
  emissive markers + additive halos already begging for **Bloom**; add `@react-three/postprocessing`
  (Bloom + Vignette + subtle SSAO/grade) — supersedes D056. Needs two packages installed
  (`@react-three/postprocessing`, `postprocessing`); confirm headless install before relying on build.
- **Lighting rig incomplete (#2).** Have key(dir)+hemi+ambient+fog+ACES but **no rim/back light,
  no drei `<Environment>` IBL, no `<ContactShadows>`.** drei 9.122 already exports all three — no new
  deps. A soft "sea" ContactShadows plane under the floating islands + a rim light + Environment
  preset would remove the last of the flat look. Good low-risk next turn.
- Guide console still uses plainer chrome (paper cards); could gain the same HUD material language
  for cohesion once the child surface + 3D grade are done.
- The child board-2d fallback cards are decent but could use more juice (stagger enter, spring hover).

## NEXT
1. Add the post-processing grade to the 3D world (Bloom + Vignette; ACES tone-map already present) —
   highest remaining visual leverage. FIRST verify `pnpm add @react-three/postprocessing postprocessing`
   works headless without breaking the shared lockfile/build; if it can't be installed cleanly,
   fall back to the lighting-rig task below instead.
2. Complete the lighting rig with drei (no new deps): `<Environment>` IBL preset, a rim/back light,
   and soft `<ContactShadows>` grounding the floating islands over a misty sea plane.
Keep the gate green (tsc + test + `next build`); write `.loop/commit-msg`; keep the art direction cohesive.

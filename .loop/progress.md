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
- **Turn 1:** Killed the stock `<select>` dropdown control surface (auto-fail #2 / non-negotiable #7).
  Rebuilt `app/ui/controls/InterestLabControls.tsx` as a game HUD "mission deck": eyebrow +
  display-font title + live telemetry chip; four segmented radio controls with lucide icons, tactile
  pill segments, inset trenches; a toggle switch for Plain mode; frosted-glass panel w/ lit top rail.
  Test-safe (preserved the `name=`/`value=` SSR markup). Gate green.
- **Turn 1.5 (landed in the "green increment" commit, notes were stale):** Completed the **lighting
  rig (#2)** in `World3DCanvas.tsx` — added a cool tide **rim/back light**, a local palette-baked
  **`<Environment>`** IBL (four Lightformers, `frames=1`, no remote HDRI), a faintly emissive **misty
  sea** floor, and soft **`<ContactShadows>`** grounding the islands (full tier). The flat "gray
  primitive" look is gone; key+fill+rim+IBL+shadows are all present.
- **Turn 2 (this):** Killed the worst remaining tell — **no post-processing grade (#4)**. Installed
  `@react-three/postprocessing` v2 + `postprocessing` (pinned to the r3f-v8-compatible line; verified
  headless resolution + clean import in the vitest node env before wiring). Added `WorldPostFX.tsx`:
  **Bloom → warm HueSaturation/BrightnessContrast grade → ACES ToneMapping → Vignette**, mounted
  inside the Canvas and gated on the model's pre-existing `quality.postprocessing`/`bloom` flags
  (full tier only; lite/board keep the direct render for the D057 perf floor). Bloom is driven by the
  model's `bloomPeak`/emissive markers, so the plum night stays matte and only the warm cores glow.
  Because `<EffectComposer>` disables the renderer tone-map while mounted, ACES is re-applied in-chain
  to stay cohesive across tiers. Gate green: tsc + 73 tests + `next build`. See D-VP4.

## Verification note (honest)
The grade only mounts client-side on the WebGL full tier, so it can't be pixel-verified in this
headless / GPU-less env (swiftshader would fall to board-2d and never exercise the composer).
Verified instead: package resolves + imports without side-effect crashes (world-3d.test.ts loads the
real module), tsc + tests + build all green, and the tone-mapping chain is correct **by construction**
— confirmed from the installed dist that EffectComposer sets `NoToneMapping` while mounted, which is
why the ACES ToneMapping effect is present. A GPU screenshot pass is the ideal next confirmation.

## What still reads generic (candidates for next turns)
- **SSAO / ambient occlusion (part of #4)** — deferred this turn (needs a normal pass; riskiest to
  tune blind). A subtle N8AO pass + optional shallow depth-of-field would finish the AAA grade.
- **Camera cinematography (#5)** — confirm the intro/establish move + idle drift + damped orbit in
  `CameraRig.tsx` read as intentional cinematography (framing, eased view transitions), not a static
  fixed cam. Likely the highest-leverage remaining non-3D-material item.
- **Guide console chrome** still uses plainer paper cards; give it the HUD material language for
  cohesion with the child control deck.
- The child board-2d fallback cards could use more juice (stagger enter, spring hover).

## NEXT
1. **Verify the grade on a GPU if any path exists** (playwright + real GPU / a manual screenshot),
   then tune Bloom intensity/threshold and Vignette to taste against `game-feel.md`. If no GPU path,
   move on — the chain is correct by construction.
2. **Camera cinematography (#5):** audit `CameraRig.tsx` for a gentle intro move, subtle idle
   drift/parallax, damped controls, and eased (never snap-cut) view transitions; add whatever's
   missing. Use the motion skills (improve-animations / apple-design springs).
3. Then: SSAO + optional DoF to complete #4, and bring the HUD material language to the guide console.
Keep the gate green (tsc + test + `next build`); write `.loop/commit-msg`; keep the art direction cohesive.

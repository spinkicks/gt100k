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
- **Turn 3 (this):** Finished **camera cinematography (#5)** — killed the last camera tell, the
  *frozen settled shot*. The rig already had intro drift-in + eased island focus + welcome-back +
  auto-tour + damped orbit, but went dead-still the instant a transition settled (worst during the 8s
  auto-tour dwells → lifeless diorama). Added a pure, tested `sampleIdleDrift()`/`IDLE_DRIFT` in
  `CameraRig.tsx`: an additive **idle parallax breath** (three incommensurate sines per channel, ≤0.34
  world-unit amplitude, 1.4s smoothstep ramp-in) layered on the captured settled pose. Pop-free (sines
  = 0 at t=0), never touches the byte-exact transition math, skipped in focus+orbit (user's damped
  orbit owns the camera) and under reduced motion. Gate green: tsc + 74 tests (camera-rig 6→7) +
  `next build`. See D-VP5.

## Verification note (honest)
The grade only mounts client-side on the WebGL full tier, so it can't be pixel-verified in this
headless / GPU-less env (swiftshader would fall to board-2d and never exercise the composer).
Verified instead: package resolves + imports without side-effect crashes (world-3d.test.ts loads the
real module), tsc + tests + build all green, and the tone-mapping chain is correct **by construction**
— confirmed from the installed dist that EffectComposer sets `NoToneMapping` while mounted, which is
why the ACES ToneMapping effect is present. A GPU screenshot pass is the ideal next confirmation.

## What still reads generic (candidates for next turns)
- **Guide console chrome** still uses plainer paper cards; give it the HUD material language (frosted
  glass + lit top rail + inset trenches from D-VP2) for cohesion with the child control deck. This is
  now the **highest-leverage remaining tell** — the child world is graded/lit/moving but the guide
  side is still "dashboard."
- **SSAO / ambient occlusion (part of #4)** — deferred (needs a normal pass; riskiest to tune blind).
  A subtle N8AO pass + optional shallow depth-of-field would finish the AAA grade.
- The child board-2d fallback cards could use more juice (stagger enter, spring hover).

## Non-negotiable scorecard (vs game-feel.md)
1 committed world ✓ · 2 lighting rig ✓ · 3 materials ✓ (verify no bare primitives remain) ·
4 post-FX grade ✓ (SSAO/DoF still open) · **5 camera cinematography ✓ (idle breath landed Turn 3)** ·
6 motion/juice ✓ (world + HUD; board-2d cards still flat) · 7 HUD not forms ✓ (child deck; guide
console still paper) · 8 type+icons ✓ · 9 cohesion — child side cohesive, guide side lags.

## NEXT
1. **Guide console → HUD material language.** Bring D-VP2's frosted-glass / lit-top-rail / inset-trench
   chrome + Fredoka display headings + lucide icons to the guide console + evidence constellation panels
   so both sides read as one crafted world (game-feel #7/#9). Use `impeccable` + `ui-ux-pro-max` +
   `apple-design`; subtract words first (game-feel "simplicity" #1) before restyling.
2. **Board-2d juice:** stagger-enter + spring hover on the fallback cards (game-feel #6) so the perf
   floor still feels alive.
3. Optionally: SSAO + shallow DoF to close #4, and a GPU screenshot pass to tune Bloom/Vignette + the
   new idle-breath amplitude to taste.
Keep the gate green (tsc + test + `next build`); write `.loop/commit-msg`; keep the art direction cohesive.

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
- **Turn 3:** Finished **camera cinematography (#5)** — killed the last camera tell, the
  *frozen settled shot*. The rig already had intro drift-in + eased island focus + welcome-back +
  auto-tour + damped orbit, but went dead-still the instant a transition settled (worst during the 8s
  auto-tour dwells → lifeless diorama). Added a pure, tested `sampleIdleDrift()`/`IDLE_DRIFT` in
  `CameraRig.tsx`: an additive **idle parallax breath** (three incommensurate sines per channel, ≤0.34
  world-unit amplitude, 1.4s smoothstep ramp-in) layered on the captured settled pose. Pop-free (sines
  = 0 at t=0), never touches the byte-exact transition math, skipped in focus+orbit (user's damped
  orbit owns the camera) and under reduced motion. Gate green: tsc + 74 tests (camera-rig 6→7) +
  `next build`. See D-VP5.
- **Turn 4 (this):** Closed the **cohesion gap (#9)** + finished **HUD-not-forms on the guide side
  (#7)** — killed the worst remaining tell, the guide reading as a *flat "dashboard" paper card* while
  the child world was fully graded/lit/HUD'd. Kept the deliberate warm paper reading surface (right for
  dense adult evidence; apple-design §12 — a heavier *opaque structural* material vs. the child's
  floating translucent HUD), but reframed `.guide-console` as a crafted **lit atelier light-table deck**:
  the **signature top rail** (identical spark→beacon→tide gradient to the child deck — the strongest
  shared cohesion mark), layered depth shadow (deep ambient + contact + top inner highlight so the slab
  lifts off the dark desk), warm/tide corner glows baked into the vellum, a bright hairline lip; the two
  console eyebrows upgraded to the **HUD eyebrow** with a lit **spark glow-dot**; and the coverage map +
  return timeline recessed into **inset trenches** (matching the child controls' recessed instruments).
  Nested `.coverage-console` now paints transparent so the lit surface stays continuous. All additive on
  an opaque surface — no color inversion, no `backdrop-filter` — so a11y media queries + the two pinned
  coverage CSS regexes are untouched. Pure DOM/CSS (no GPU), so the build's CSS compile + the pinned
  guide/coverage markup tests actually verify it. Gate green: tsc + 74 tests + `next build`. See D-VP6.

## Verification note (honest)
The grade only mounts client-side on the WebGL full tier, so it can't be pixel-verified in this
headless / GPU-less env (swiftshader would fall to board-2d and never exercise the composer).
Verified instead: package resolves + imports without side-effect crashes (world-3d.test.ts loads the
real module), tsc + tests + build all green, and the tone-mapping chain is correct **by construction**
— confirmed from the installed dist that EffectComposer sets `NoToneMapping` while mounted, which is
why the ACES ToneMapping effect is present. A GPU screenshot pass is the ideal next confirmation.

## What still reads generic (candidates for next turns)
- **Guide sub-panels still lack motion/juice (#6 on the guide side).** The guide chrome now reads as one
  crafted deck (Turn 4), but its interior is static: the coverage cells, explanation columns, timeline
  markers and lifecycle states don't stagger-enter, and there's no hover/press feedback on the interactive
  guide controls (author form, revision scrubber, `<details>` disclosures). This is now the highest-
  leverage remaining tell — the guide *looks* crafted but doesn't *feel* alive.
- **Board-2d juice:** the child fallback cards could use stagger-enter + spring hover (#6) so the perf
  floor still feels alive.
- **Deeper guide trenching (optional polish):** the explanation columns + lifecycle tracks + revision rail
  could take the same inset-trench treatment as the two scroll instruments for even more instrument depth.
- **SSAO / ambient occlusion (part of #4)** — deferred (needs a normal pass; riskiest to tune blind).
  A subtle N8AO pass + optional shallow depth-of-field would finish the AAA grade.

## Non-negotiable scorecard (vs game-feel.md)
1 committed world ✓ · 2 lighting rig ✓ · 3 materials ✓ (no bare primitives remain) ·
4 post-FX grade ✓ (SSAO/DoF still open) · 5 camera cinematography ✓ (idle breath, Turn 3) ·
6 motion/juice ✓ world + child HUD; **guide interior still static (next target)** ·
7 HUD not forms ✓ (child deck + guide deck, Turn 4) · 8 type+icons ✓ ·
**9 cohesion ✓ — both sides now read as one crafted world (Turn 4).**

## NEXT
1. **Guide-interior motion/juice (#6).** Make the now-crafted guide deck *feel* alive: staggered enter on
   the coverage cells + timeline markers + lifecycle states (respecting the existing pure `matrixStagger`
   / `ticker` motion tokens and `reducedMotion`), and tactile hover/press feedback on the guide's
   interactive controls (author-revision form buttons, revision scrubber, `<details>` summaries) matching
   the child deck's `cubic-bezier(0.23,1,0.32,1)` ease-out + `scale(0.97)` press. Use `emil-design-eng` +
   `find-animation-opportunities` + `improve-animations`. Keep it calm (game-feel #1 — subtract first).
2. **Board-2d juice:** stagger-enter + spring hover on the fallback cards (#6) so the perf floor feels alive.
3. Optionally: SSAO + shallow DoF to close #4; a GPU/browser screenshot pass to tune the guide deck's
   glow + Bloom/Vignette + idle-breath amplitude to taste; deeper guide-panel trenching.
Keep the gate green (tsc + test + `next build`); write `.loop/commit-msg`; keep the art direction cohesive.

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

- **Turn 5 (this):** Made the crafted guide deck *feel alive under the pointer* — killed the highest-
  leverage remaining tell (#6 guide side): the guide's **directly-interacted controls had zero press /
  hover / focus feedback** (dead-feeling), even though every guide *enter* animation (coverage stagger,
  explanations reveal, timeline draw, marker/gate pops, lifecycle state-morph) already existed via
  `motion/react`. Applied a **pure-CSS feedback pass** reusing the child deck's exact idiom (the shared
  `--hud-ease` = `cubic-bezier(0.23,1,0.32,1)`, `scale(0.97)` press, 140–180ms, hover behind
  `@media (hover:hover) and (pointer:fine)`): (a) the primary **"Author operative revision" button** now
  lifts + warms toward spark on hover and presses to `scale(0.97)` with a depth shadow; (b) the three
  guide **`<details>` disclosures** (linked evidence, other explanations, legal transitions) got a
  hover tint + spark text shift + press scale + a **rotating custom chevron** (native marker hidden) so
  the open/closed state reads; (c) the **revision-scrubber** rows tint + press-scale, the selected row's
  background now *fades* in (220ms) instead of snapping, and the selected/hovered **revision mark** gets a
  spark focus ring + scale; (d) the **authoring inputs** brighten their border toward spark on
  hover/focus. Animates only transform/background/box-shadow/border/color; reduced-motion is auto-
  neutralized by the global `transition-duration:0.01ms !important` block, so it's a11y-safe by
  construction. No markup change → every pinned guide/coverage test + CSS regex untouched. Gate green:
  tsc + 212 tests + `next build`. See D-VP7.

- **Turn 6 (this):** Closed the **last cohesion gap (#9)** on the board-2d fallback — killed its worst
  tell, which was *material*, not motion. Critic finding via `find-animation-opportunities`: the
  `QuestCard` was **already fully juiced** (stagger enter + hover-lift + press + pick-spring via
  `motion/react`) — the stale note's "board pops in flat" was wrong. The real tell was that the cards
  were **flat CSS rectangles** (hairline border + flat fill, zero depth) sitting on the dark board like a
  generic dashboard list, while the child HUD deck + guide light-table deck both carry lit rails +
  layered shadow + emissive glow. Pure-CSS material pass on `.quest-card*` + `.quest-constellation h3`
  (+ one tiny markup tweak: domain hue → `--domain-hue` var): (1) cards get the deck's **layered depth
  shadow** + a **hue-baked corner glow** + a per-card **lit top rail** (`::before`, hue→spark-hi); (2)
  **hover** blooms the shadow + a hue glow ring + warms the border (so motion's existing `translateY(-4px)`
  reads as *lifting*); (3) **picked** cards get an **emissive hue glow ring** + full rail; (4) the **spark**
  recommendation card glows warm (spark→beacon rail — 2D stand-in for Bloom); (5) **prompted-return** stays
  calm (muted rail, no glow); (6) domain headers upgraded to the shared **HUD eyebrow + lit glow-dot**
  (identical idiom to `.hud-eyebrow`/`.hud-eyebrow-dot`). Motion owns transform/opacity/filter; CSS owns
  shadow/border/bg — no conflict. Reduced-motion auto-neutralized (resting depth persists as static
  material, correct); `:focus-visible` outline untouched (not clipped by `overflow:hidden`). Gate green:
  tsc + 212 tests + `next build`. See D-VP8.

- **Turn 7 (this):** Crafted the **last generic surface** — the child **quest tray + welcome-back**
  badge — killing the final "dashboard aside" tell (#3 materials / #6 juice / #9 cohesion). The tray was
  a flat `--night-sunk` rectangle with flat `--night-raised` chips and a **feedback-less "Put back" pill**
  (dead under the pointer), sitting right beside the fully-crafted board cards + HUD deck. Pure-CSS pass,
  no markup change: (1) `.quest-tray` → a **lit slab** (hairline border, faint tide corner glow, top
  inner highlight + ambient drop, and the **signature spark→beacon→tide rail** with rounded top corners
  — no `overflow:hidden`, so inner-button focus rings stay unclipped); (2) tray eyebrow gains the
  **HUD lit glow-dot** (scoped `.quest-tray .surface-name`, guide/global eyebrow untouched); (3) chips get
  **raised material** (top-highlight gradient + hairline + soft drop) so kept quests lift off the floor;
  (4) the **"Put back" button** gets the emil tactile idiom — resting depth shadow, `:active scale(0.97)`,
  gated hover that warms toward `--spark` + lifts, all on the shared `--card-ease` @150ms; (5)
  `.welcome-back-halo` gains a warm `--spark` **emissive glow** (2D bloom stand-in) while
  `.prompted-return-mark` stays calm. Also fixed a **stale `.quest-card:hover` box-shadow override** that
  was clobbering Turn 6's richer board hover shadow (later source order, same specificity) — the crafted
  board hover now actually renders. Reduced-motion auto-neutralized by the global block; pinned
  `data-quest-tray-item` / aria-label tests untouched. Gate green: tsc + 74 tests + `next build`. See D-VP9.

- **Turn 8 (this):** Finished the **post-processing grade (#4)** — added the one named-but-unbuilt
  item, **contact ambient occlusion**. Critic pass (impeccable + apple-design §12 materials/depth): every
  surface is crafted, but the 3D islands + markers were *lit* yet not *seated in each other* (no
  contact-scale occlusion → a faint "floaty / decal'd" CG tell, the last one in the world). Added
  `<N8AO>` as the first effect in `WorldPostFX.tsx`'s chain (N8AO → Bloom → grade → ACES → Vignette),
  full-tier only. Tuned conservative: `aoRadius=1.1` (island cap↔underside seam, markers on island tops,
  rim torus — ≈1 world unit so distant islands don't cross-darken), `intensity=1.25`, `quality="medium"`,
  `halfRes` + `depthAwareUpsampling`, and `color=PALETTE.nightSunk` so creases tint to the plum night (not
  gray dirt), cohesive with `<ContactShadows>`. **N8AO retires the deferral risk directly: it derives
  normals from depth — no separate normal pass to add/tune** (the exact thing that made classic SSAO risky
  blind), and depth-only means fog/emissive/contact-shadows are untouched. Gate green: tsc + 74 tests
  (`world-3d.test.ts` loads the real, un-mocked composer → proves N8AO evaluates clean) + `next build`.
  See D-VP10.

- **Turn 9 (this):** First turn to **subtract, not add** — closed the real remaining gap, which was
  **game-feel #1 (Simplicity & flow, the FIRST requirement)**, not more material polish. Judged against
  the doc: the HUD deck was a persistent **five-control wall** (Age band / Motion / Surface / Render tier
  / Plain mode) labelled "presentation only" — the auto-fail the doc names *verbatim*. Turn 1 restyled
  the `<select>`s but never removed the *wall*. Restructured `InterestLabControls.tsx` (+ CSS) so **one**
  control is in view — the primary `Surface` toggle (relabelled **"Viewing"**: Quests ↔ Guide) in a new
  prominent `.hud-primary` row — and the four preview/a11y/debug switches collapse behind a native
  `<details>` **"Preview settings"** disclosure (sliders icon + rotating chevron, `:active` press,
  ease-out fade-slide reveal, all on the shared `--hud-ease`; native details = keyboard/a11y for free).
  Always-visible control count **5 → 1**; the compact live-status chip stays as the one-line summary.
  Test-safe: `renderToStaticMarkup` renders `<details>` children regardless of open state, so every
  pinned `name=`/`value=`/h2/status/`--control-target` string survives (all 9 client-shell assertions
  green). Gate green: tsc + 74 tests + `next build`. See D-VP11.

- **Turn 10 (this):** First **content-copy** subtraction — applied game-feel **#1 (Simplicity & flow,
  the FIRST requirement)** to the *content* surfaces, which Turns 1–9 skipped (Turn 9 cut the control
  *wall*; nobody had cut the *prose*). The child quest screen was carrying **two overlapping reassurance
  paragraphs** (masthead lede + ledger paragraph both saying "explore freely, no wrong answer") **plus**
  an obvious-stating instruction — the doc's exact "explanatory paragraphs where a label works" tell.
  Pure text, no markup/CSS/logic: (1) masthead lede trimmed to one clause (its 3rd clause was echoed by
  the footer); (2) ledger paragraph dropped its eyebrow-restating first sentence, kept the load-bearing
  child-safety reassurance; (3) quest-world instruction dropped its states-the-obvious first sentence,
  kept the one functional hint ("Focus a quest below to visit its island."); (4) guide intro merged two
  staccato sentences into one, every noun preserved. Reading path on the child screen is now
  focal-content → one short reassurance → cards. Test-safe: the only two pinned content strings
  ("Your quest constellation", "Synthetic data only") are untouched and no new string trips the
  `price|score|rank|percentile|verdict` guard. Gate green: tsc + 212 tests + `next build`. See D-VP12.

- **Turn 11 (this):** Did NOT rubber-stamp `.loop-done` — a fresh end-to-end critic pass (impeccable +
  apple-design §12) found a **real, verbatim auto-fail** the prior 10 turns missed: the guide's
  `EvidenceConstellationCanvas` (a live 3D `<Canvas>`, captioned "Evidence constellation") was the one
  remaining surface rendering **bare `meshBasicMaterial` spheres on transparent black** — the doc's #1
  anti-pattern ("flat-lit untextured primitives … orange spheres on black"). Every turn had crafted the
  child 3D world AND the guide's *DOM* light-table deck, but nobody had touched the guide's *3D
  constellation*. Fixed it: each star + anchor is now a **glowing node** — a hot self-luminous core sphere
  wrapped in a soft **additive halo sprite**, tinted per pull (spark/tide/ink) and brightness-scaled — via
  a new `constellation-node.ts` (`createSoftDotTexture` white-radial sprite + pure `resolveStarNode`/
  `resolveAnchorNode`), reusing the world's in-memory glow-sprite idiom. Links bumped to read as
  light-threads. Conservative on a decorative `aria-hidden` float (no composer/Bloom — the additive halo
  is the perf-cheap 2D emissive stand-in, same rationale as the board-2d glow). Test-safe: the sole source
  pin (`<Canvas aria-hidden>`) is preserved; new `constellation-node.test.ts` adds 6 pure tests. Gate
  green: tsc + app 80 tests (74→80) + root 212 tests + `next build`. See D-VP13.

- **Turn 12 (this) — DONE.** No code change. Honored the Turn-11 lesson ("a scorecard can lie") by
  running the disciplined, surface-by-surface critic sweep the NEXT block demanded — *inspecting* each
  surface, not trusting the scorecard — then declaring `.loop-done`. Sweep (all clean, actually
  inspected): (a) a whole-app grep for any 3D primitive returns exactly 4 files — the child world
  (`World3DCanvas`/`QuestMarker`/`Island`) + the guide constellation (crafted Turn 11); the guide's
  `Lifecycle`/`RevisionHistory`/`ReturnTimeline`/`CoverageMatrix` are DOM/SVG, not flat 3D. (b) `board-2d`
  renders the Turn-6 crafted `QuestCard` board; `plainMode` forces `board-2d` and flattens only the glass
  `.material` panels (intentional calm) while crafted cards persist; `EvidenceConstellation` returns
  `null` under the fallbacks (no flat DOM stand-in). (c) `QuestMarker`/`Island` are PBR + emissive +
  halo + rim torus (no bare primitives); `Motes` = drei `<Sparkles>`. Every non-negotiable met, no
  auto-fail remains — verified by inspection + green gate: **tsc exit 0 · root 212 · app 80 · build ✓**.
  Declined the two optional items (shallow DoF, deeper guide trenching) — game-feel #1 forbids
  over-decorating an already-calm world; both are eyes-on GPU-tune polish, not blockers. See D-VP14.

## Verification note (honest)
The grade only mounts client-side on the WebGL full tier, so it can't be pixel-verified in this
headless / GPU-less env (swiftshader would fall to board-2d and never exercise the composer).
Verified instead: package resolves + imports without side-effect crashes (world-3d.test.ts loads the
real module), tsc + tests + build all green, and the tone-mapping chain is correct **by construction**
— confirmed from the installed dist that EffectComposer sets `NoToneMapping` while mounted, which is
why the ACES ToneMapping effect is present. A GPU screenshot pass is the ideal next confirmation.

## What still reads generic (candidates for next turns)
- **All primary surfaces are now crafted + cohesive** (3D world, child HUD deck, guide light-table deck,
  board-2d fallback). Remaining items are AAA-grade *polish*, not auto-fail tells:
- ~~**SSAO / ambient occlusion (part of #4)**~~ — DONE Turn 8 (tinted N8AO contact AO; depth-only, so
  no normal pass was needed after all). Only optional **shallow depth-of-field** remains to finish the
  AAA grade — deferred as the higher blind-tuning risk (best done in a GPU screenshot pass).
- ~~**Quest-tray + welcome-back surfaces**~~ — DONE Turn 7 (lit slab + rail + glow-dot + raised chips +
  tactile "Put back" + emissive welcome-back halo). Board↔tray↔deck now cohere; also fixed a stale board
  hover-shadow override in passing.
- **Deeper guide trenching (optional polish):** the explanation columns + lifecycle tracks + revision rail
  could take the same inset-trench treatment as the two scroll instruments for even more instrument depth.
- **GPU/browser screenshot pass:** tune Bloom/Vignette + idle-breath amplitude + the new board glow/rail
  amounts to taste (can't be pixel-verified headless — see note below).

## Non-negotiable scorecard (vs game-feel.md)
1 committed world ✓ · 2 lighting rig ✓ · 3 materials ✓ (**no bare primitives remain — the last ones,
  the guide constellation's flat spheres, became glowing nodes in Turn 11**; the prior scorecard's
  "no bare primitives" claim was wrong: it had overlooked the guide's 3D canvas) ·
4 post-FX grade ✓ (Bloom+grade+ACES+Vignette+**N8AO contact AO, Turn 8**; only optional DoF open) ·
5 camera cinematography ✓ (idle breath, Turn 3) ·
6 motion/juice ✓ world + child HUD + guide + **board-2d (motion was already there; Turn 6 added the
  crafted material so the lift reads as depth)** ·
7 HUD not forms ✓ (child deck + guide deck, Turn 4; **control-wall subtracted to one nav control +
  Preview-settings disclosure, Turn 9**) · 8 type+icons ✓ ·
**#1 Simplicity & flow ✓ — Turn 9 cut the always-visible control count 5→1; Turn 10 cut the
  duplicated content prose (two overlapping reassurance paragraphs + an obvious instruction) to one calm
  reading path. The doc's FIRST requirement is now honored on BOTH controls and copy.** ·
**9 cohesion ✓ — 3D world, child deck, guide deck, board-2d fallback, AND (Turn 11) the guide's 3D
  evidence constellation now read as one crafted world.** Every non-negotiable is met and no auto-fail
  anti-pattern remains; what's left is AAA-grade polish (DoF, guide trenching, GPU-tuning), not a redo.

- **Turn 13 (this) — RE-VERIFIED DONE.** The loop re-invoked because `.loop-done` is **gitignored**
  (`git check-ignore .loop-done` → hit) so the marker never commits and was wiped between sessions — no
  work was actually left. Did NOT rubber-stamp and did NOT invent a decoration turn (game-feel #1 forbids
  over-decorating a calm working world). Instead re-ran the full gate + a fresh adversarial critic sweep
  (actually inspecting, per the Turn-11 lesson): `grep '<select'`/native form controls across `app/` →
  **none**; enumerated every 3D geometry (island cap/cone/emissive-rim silhouette; faceted emissive gem
  markers; emissive sea floor; guide constellation `sphere` cores that are *deliberately* self-luminous
  `meshBasicMaterial` + additive halo — the canonical glowing-node idiom, verified by reading the file,
  not the note); post-FX chain present + full-tier gated. Every non-negotiable holds, no auto-fail remains.
  Gate green: **tsc exit 0 · domain 81 · app UI 80 · `next build` ✓**. Re-created `.loop-done`. See D-VP15.

## NEXT — DONE (re-verified Turn 13; `.loop-done` re-created)
The app meets **every** game-feel non-negotiable with **none** of the auto-fail anti-patterns, verified
by a surface-by-surface critic sweep (not a scorecard read) + a green gate (tsc · root 212 · app 80 ·
build). `.loop-done` is created. Any future turn should NOT re-open this to add decoration (game-feel #1:
subtract, don't over-decorate). The only remaining work is **optional, eyes-on GPU polish** that cannot
be done in this headless GPU-less env and is not a blocker for any requirement:
1. **GPU/browser screenshot pass** — tune Bloom / Vignette / N8AO amounts, idle-breath amplitude, the
   board-2d glow/rail amounts, and the guide constellation's halo/core scale + opacity to taste. This is
   the highest-value remaining *visual* confirmation (swiftshader falls to board-2d headless, so the
   composer + constellation halos never rasterize here).
2. **Shallow depth-of-field** (last optional #4 item) — only after eyes-on; higher blind-tuning risk.
3. **Deeper guide trenching** (optional polish) — explanation columns + lifecycle tracks + revision rail
   could take the two scroll instruments' inset-trench treatment for more instrument depth.
If reopening for polish, keep the gate green and keep the committed art direction cohesive (D-VP1).

## NEXT (historical — Turn 11's guidance, now satisfied)
Turn 11 was the payoff for NOT rubber-stamping `.loop-done`: the fresh critic pass caught the guide's 3D
evidence constellation still rendering **flat `meshBasicMaterial` spheres on black** — a verbatim #1
auto-fail the prior scorecard had wrongly marked closed ("no bare primitives remain"). It is now lit as
glowing nodes, so **the scorecard is genuinely full and every 3D surface in the app is crafted.** This
strongly supports declaring done — but the lesson of Turn 11 is that a scorecard can lie, so:
1. **Do ONE more disciplined end-to-end critic sweep before `.loop-done`.** Specifically re-check the
   surfaces the scorecard *assumed* rather than *inspected*: (a) any other `meshBasicMaterial` /
   `<Line>` / bare-geometry usage across the guide (`Lifecycle`, `RevisionHistory`, `ReturnTimeline`,
   `CoverageMatrix` — confirm these are DOM/SVG, not flat 3D); (b) the `board-2d` and `plainMode`
   fallbacks end-to-end (they skip the composer AND now the constellation — make sure they still feel
   crafted, not stripped); (c) `QuestMarker`/`Island` materials for any remaining flat primitive. If
   that sweep is clean, **create `.loop-done`** — the strong case is the full, now-verified scorecard.
2. **GPU/browser screenshot pass — the highest-value remaining *visual* confirmation** (cannot be done in
   this headless GPU-less env; swiftshader falls to board-2d and never runs the composer). Confirm Bloom /
   Vignette / N8AO + the **new constellation halo/core scale + opacity** read right, then tune to taste.
   Only after eyes-on, consider **optional shallow depth-of-field** (last #4 item; higher blind-tuning risk).
3. **Deeper guide trenching (optional polish):** explanation columns + lifecycle tracks + revision rail
   could take the two scroll instruments' inset-trench treatment for more instrument depth.
Keep the gate green (tsc + app test + root test + `next build`); write `.loop/commit-msg`; keep the art
direction cohesive. **Before adding, subtract (game-feel #1)** and guard hard against over-decorating an
already calm world — but Turn 11 proves the critic sweep must actually *inspect* each surface, not trust
the scorecard. If the sweep in (1) is clean, ship `.loop-done`.

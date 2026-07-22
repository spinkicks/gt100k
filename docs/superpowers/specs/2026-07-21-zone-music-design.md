> # ⚠️ SUPERSEDED — DO NOT BUILD FROM THIS FILE
> This v1 single-surface "Groovebox" design is **superseded** by:
> - **[`2026-07-21-zone-music-design-v2.md`](./2026-07-21-zone-music-design-v2.md)** — the current two-layer (discovery world + content app) design, and
> - **[`2026-07-21-cabin-interior-music.md`](./2026-07-21-cabin-interior-music.md)** — the enriched, buildable **"Sounding Cabin"** interior (the piano hero · the hi-fi listening corner · the production-nook screen doorway).
>
> Kept only for git history. **Canonical binding now:** domain = **`sound_music`** (not the `"audio"` used below). If anything below disagrees with the v2 / cabin specs or [`2026-07-21-interest-lab-reconciliation.md`](./2026-07-21-interest-lab-reconciliation.md), **those win.**

# Interest Lab — Zone: Music Studio (design)

**Date:** 2026-07-21 · **Owner:** David · **Zone:** `passion/packages/interest-zone-music`
**Domain:** `"audio"` · **Lane:** 1 (parallel) · **Builds against:** the frozen `ZonePlugin` interface,
the locked art-direction pack, and the `window.__qa` QA contract from
[`2026-07-21-interest-lab-world-design.md`](./2026-07-21-interest-lab-world-design.md).

**Grounded in:** the world redesign (intrinsic integration, hybrid 2D-map + bounded-3D-room), the
world precedents memo (`docs/research/interest-lab-world-precedents.md` — "the activity must BE the
game"; Chrome Music Lab / Groove Pizza legibility; audio-games-as-lists accessibility), the asset
pipeline (`docs/research/stylizedWorldAssetPipeline.md` — CC0 + one HDRI + palette + fog + <50 draw
calls, Chromebook-safe), and the existing engine types in `@gt100k/interest-lab`
(`WorkMode`, `Domain`, `Probe`, `EngagementEvent`, `SignalFamily`).

---

## 1. The bet (one line)

A child walks into a warm little studio where **a beat is already playing**, taps a glowing pad, and
**hears the music change under their finger** — and because every pad is quantized to the grid and every
sound is drawn from a curated, always-in-tune kit, *whatever they make sounds good*. The making **is**
the probe; there is no quiz, no door, no "compose quest" stub. This is the direct fix for v1.

**Signature activity: "The Groovebox"** — a bounded step-sequencer / pad beat-maker that grows, by
affordance only, into a tiny groovebox (build → perform → refine → arrange). One coherent instrument
exposes four work-modes so the `domain × work-mode` grid can tell a *music kid* from a *maker kid*.

**Why a beat-maker (not a melody/DAW/quiz):** rhythm is the most forgiving, most universally satisfying
first musical act — a beginner cannot make a quantized drum loop sound "wrong," so the reward is
immediate and the failure surface is near zero (Habgood/Ainsworth intrinsic integration; Chrome Music
Lab *Song Maker* and *Groove Pizza* legibility). A melody-first tool needs pitch judgement to sound
good; a DAW needs a manual. A groovebox gives instant "wow" *and* real depth on the same surface.

---

## 2. Moment-to-moment (first 10 seconds → onward), taught by affordance

No tutorial wall. The room teaches like Mario World 1-1: the environment is the instruction.

- **0.0s — you are already inside.** The persistent `<Canvas>` swaps to a cozy dusk-lit studio, **fixed
  camera** framing a low console head-on. No "start" screen. A soft label floats: *"Music Studio."*
- **0.0s — a beat is (about to be) playing.** A gentle 2-track default groove (kick + hat, ~96 BPM) is
  loaded. **Autoplay caveat (Web Audio):** browsers require a user gesture to start audio, so before the
  first tap the transport shows a single breathing **"▶ tap to start the beat"** pad; the first tap both
  unlocks `AudioContext` and starts the loop. From then on it loops forever until stopped.
- **1s — time is made visible.** A luminous **playhead** sweeps left→right across the 8 step-columns in
  perfect time with the sound. Seeing the sweep hit a lit pad exactly when you hear the drum welds
  *sight ↔ sound*: the child now understands "columns = time, rows = sounds" without a word.
- **2s — one empty pad is inviting.** The nearest empty pad **pulses** (emissive breathing). Affordance:
  *tap me.* There is exactly one obvious primary action: **place a beat.**
- **3s — cause and effect.** Tap → the pad lights and **snaps on**; the new hit lands the instant the
  playhead next crosses it (≤1 loop, ≈2s). You changed the music. You did that.
- **4–10s — the loop hooks.** Tapping more pads keeps sounding good (everything is quantized + curated).
  A **"＋ add a sound"** pad glows at the left of an empty row (invites a 3rd track). A **swing** knob
  fades in after ~4 bars. Two low-lit doors at the room's edge — **PERFORM** and **SONG** — sit visible
  but optional. Depth is *disclosed*, never forced.

**Every deeper mode is entered the same way — by walking up to a lit thing, not by reading a menu.**

---

## 3. The fun loop (why you keep doing it)

```
        ┌─────────────────────────────────────────────┐
        │   MAKE ──▶ HEAR ──▶ TWEAK ──▶ KEEP / SHARE   │
        └─────────────────────────────────────────────┘
   place a pad   it loops     swap a sound     save to the Shelf
   add a track   in time,     add swing        perform it for
   pick a kit    always       fix the mix      the little listeners
                 good         extend to a song  send a loop
```

- **MAKE is one tap.** Lowest possible cost to act; the primary verb is always in reach.
- **HEAR is instant and always-good.** The loop never stops, never drifts off the grid, never hits a
  sour note (§4). Instant, guaranteed-pleasant feedback is the core dopamine.
- **TWEAK invites mastery.** Tiny reversible changes (swap a sound, nudge swing, mute a track live) each
  produce an audible "oh, *better*." Safe, un-punishing iteration (no score, no fail state).
- **KEEP/SHARE makes it yours.** The loop becomes a real, persistent artifact on your **Shelf** — and it
  greets you (softly playing) when you come back. Return pull lives in the artifact, not in a streak.

The loop satisfies the four SDT-ish hooks the brainlift cares about: *competence* (it sounds pro
instantly), *autonomy* (you choose every pad, no right answer), *immediate feedback*, and a *made thing*.

---

## 4. The anti-broccoli engine (why it always sounds good)

This is the non-negotiable core — the "make the vegetable itself taste good" requirement.

- **Quantized grid.** Every hit snaps to the step; you cannot play "out of time."
- **Curated kit, synthesized (zero sample-licensing, Chromebook-tiny).** Drums are **synthesized in Web
  Audio** (kick = pitched sine thump; snare/clap = filtered noise burst; hats = short high-passed
  noise) — no audio files to license or download, fully synthetic (children's-data-safe by construction).
- **Melodic layer is pentatonic-locked.** The optional "notes" row is constrained to a pentatonic scale
  in one key, so any combination is consonant — a beginner literally cannot pick a wrong note.
- **Tasteful defaults.** Tempo seeded in the 88–120 BPM pocket; sensible per-track gain; a pleasant
  starter groove pre-loaded so the empty state is never silent-and-scary.
- **Reversible, no fail state.** Nothing is destructive; there is no "wrong," no timer, no losing.

Guardrails are what convert a 6-year-old's random taps into something they're proud of — the mechanism
behind "chose to play it ~7× longer" in the intrinsic-integration study.

---

## 5. The real artifact — the Loop — and where it goes

- **Artifact = a Loop** (`artifactEvidence: "saved-loop"`): a compact JSON pattern —
  `{ id, name, bpm, swing, tracks: [{ sound, gain, steps: boolean[] }], bars, key?, sceneArrangement? }`.
  Serialized, it's a few hundred bytes; it fully reconstructs the audio.
- **Where it goes — the Shelf.** Saved loops sit on a shelf along the studio wall as little glowing
  cassettes/vinyl (one instanced mesh; label = the loop's name). Approaching the Shelf softly plays the
  most recent loop. This is the **persistent, revisitable** thing that makes "voluntary return" real.
- **Performances** (`"recorded-performance"`) and **songs** (`"arranged-song"`) are richer artifact
  kinds produced by the perform and compose modes; they live on the same Shelf.
- **Sharing (audience condition, no accounts).** "Play it for someone" = perform to the in-room
  listeners (§7). Export = a copyable loop-link / downloaded `.json` (or a rendered `.wav` via
  `OfflineAudioContext`) — no social graph, no PII, honoring the out-of-scope "no social/co-presence."
- **Feeds the engine.** Saving a loop that clears the "is-a-loop" threshold emits `ARTIFACT_COMPETENCE`
  — one of the two families required (with a delayed voluntary return) to reach `CANDIDATE_SPINE`.

---

## 6. Four work-modes on one instrument (the disambiguation surface)

One groovebox, four *modes of doing*, each mapped to a canonical `WorkMode`. This is what lets the grid
resolve **topic vs work-mode** (world-design §6 / precedents §2). Friendly child labels → engine verbs:

| Mode (child sees) | `WorkMode` | What the child does | Feels like |
|---|---|---|---|
| **Make a beat** | `build` | place/toggle steps, add tracks, pick a kit | building |
| **Perform** | `perform` | live-trigger pads, ride an "energy" filter, mute/drop fills to listeners | playing live |
| **Fix the groove** | `debug` | reopen a loop; swap a clashing sound, nudge swing/tempo, balance the mix | making it right |
| **Make a song** | `compose` | chain patterns A→B, build intro/drop, add a pentatonic melody line | arranging |

**Why all four must live here:** you cannot detect a child whose real spike is the **perform** or
**compose** *column* (a work-mode that travels across music+code+art) if the music zone only ever offered
"make." Exposing all four is a hard requirement for the row-vs-column read, not a nice-to-have.

---

## 7. Probe signals — the emission table (the heart of the deliverable)

Two things are emitted per action, and they are **orthogonal**:

1. **Which cell** — the *active probe* fixes `{ domain: "audio", workMode }` (the grid cell / coverage).
   `workMode` is a property of the **probe the child is inside**, not of the event type.
2. **Which family** — the *action* may emit an `EngagementEvent` whose `type` is a **signal family**
   (`VOLUNTARY_RETURN`, `UNREQUIRED_REVISION`, `CHOSEN_CHALLENGE`, `FAILURE_RECOVERY`,
   `SELF_AUTHORED_SCOPE`, `ARTIFACT_COMPETENCE`, `ASSISTIVE`, plus the recessed `PROMPTED_RETURN`).

Every event is `{ domain: "audio", probeId, familyId, workMode(via probe), occurredAtDayOffset,
assistive, reliability, withdrawn }` fed to core `recordEvent`.

### 7.1 Action → probe → event map

| # | Child action | Active probe (cell) | `EngagementEvent.type` | Signal family | reliability | assistive | Disambiguation role |
|---|---|---|---|---|---|---|---|
| 1 | First tap places a step (unlocks audio) | `audio × build` | — (marks `build` explored) | — | medium | no | seeds **build** cell; novelty, not return |
| 2 | Build a loop past the "is-a-loop" threshold **and save** | `audio × build` | `ARTIFACT_COMPETENCE` | artifact_competence | high | no | proves a **made thing** in audio |
| 3 | By own choice add a 3rd/4th track or switch 8→16 steps | `audio × build` | `CHOSEN_CHALLENGE` | chosen_challenge | high | no | stretch within **build** |
| 4 | Name the loop / declare an intent ("spooky beat") | `audio × build` | `SELF_AUTHORED_SCOPE` | self_authored_scope | medium | no | child sets own scope |
| 5 | Enter **Perform**, ride energy filter / trigger live ≥1 loop | `audio × perform` | — (marks `perform`) ; if recorded → `ARTIFACT_COMPETENCE` | artifact_competence | medium | no | seeds **perform** column |
| 6 | Perform **to the listeners** (audience on) | `audio × perform` (audience) | `ARTIFACT_COMPETENCE` (recorded-performance) | artifact_competence | medium | no | fills **audience** coverage axis |
| 7 | Reopen a saved loop and change it to sound better, unasked | `audio × debug` | `UNREQUIRED_REVISION` | unrequired_revision | high | no | iterate = **refine** cell |
| 8 | A clashy loop → keep adjusting until it grooves | `audio × debug` | `FAILURE_RECOVERY` | failure_recovery | medium | no | persistence after a flop |
| 9 | Balance mix / nudge swing / retune tempo to fix feel | `audio × debug` | `UNREQUIRED_REVISION` | unrequired_revision | medium | no | seeds **debug** column |
| 10 | Chain patterns A→B into a song **and save** | `audio × compose` | `ARTIFACT_COMPETENCE` (arranged-song) | artifact_competence | high | no | seeds **compose** column |
| 11 | Turn a loop into a full song by own choice (scope grew) | `audio × compose` | `SELF_AUTHORED_SCOPE` | self_authored_scope | high | no | self-authored scope |
| 12 | Pick the harder arrange path (key change, add melody) | `audio × compose` | `CHOSEN_CHALLENGE` | chosen_challenge | medium | no | stretch within **compose** |
| 13 | Use "help me" / auto-fill / suggest-a-sound / magic-tidy | (whatever cell) | `ASSISTIVE` | (assistive) | — | **yes** | help **never lowers** a signal |
| 14 | Re-enter the studio after a reminder/nudge/reward | (studio) | `PROMPTED_RETURN` + `interventionContext` | (prompt-dependence, recessed) | — | no | **excluded** from the return signal |
| 15 | Re-enter the studio **unprompted** after novelty fades (day ≥7/30) and reopen a loop | cell of what they reopen | `VOLUNTARY_RETURN` (`horizon: 7 \| 30`) | voluntary_return | high | no | **THE signal**; the row/column it lands in is the spike |

### 7.2 Novelty gate (must hold)

First-session enthusiastic tapping is **triggered situational interest** (cheap, expected). Row 1's burst
of first-clicks keeps the hypothesis `EMERGING` and *schedules a delayed return check* — it never counts
as return. Only rows 14/15 (later, and only #15 is voluntary) speak to the return construct.

### 7.3 Row vs column, concretely

- Child A: `build` here **+** `build` in Code **+** `build` in Art → lights the **build column** → the
  stable thing is the **work-mode** (a *maker*), not audio.
- Child B: `build → perform → debug → compose` **all in audio** → lights the **audio row** → the stable
  thing is the **domain** (a *music kid*), across modes.
- The "smallest next distinguishing probe" the engine offers to break a tie is e.g. *compose in a new
  domain* — which is only meaningful because this zone proved the child will `compose` at all.

### 7.4 Probe-catalog contribution (`ZonePlugin.probes: Probe[]`)

Families × variants the zone registers into the catalog (fields per the `Probe` interface). Chosen to
push zone-level coverage across `workMode`, `social`, `difficulty`, and `audience` (see `buildCoverageMatrix`):

| familyId | id (variant) | workMode | difficulty | social | audience | autonomy | artifactEvidence |
|---|---|---|---|---|---|---|---|
| `music.beat` | `music.beat.starter` | build | foundational | solo | no_audience | medium | saved-loop |
| `music.beat` | `music.beat.deep` | build | stretch | solo | no_audience | high | saved-loop |
| `music.perform` | `music.perform.play` | perform | foundational | solo | audience | high | recorded-performance |
| `music.perform` | `music.perform.practice` | perform | foundational | solo | no_audience | high | recorded-performance |
| `music.perform` | `music.perform.duet` | perform | stretch | group | audience | high | recorded-performance |
| `music.refine` | `music.refine.groove` | debug | stretch | solo | no_audience | high | saved-loop |
| `music.arrange` | `music.arrange.song` | compose | stretch | solo | no_audience | high | arranged-song |
| `music.arrange` | `music.arrange.showcase` | compose | stretch | group | audience | high | arranged-song |

Shared fields: `domain: "audio"`, `equipment: ["audio-output"]`, `safetyClass: "cleared"`,
`accessibilityVariants: ["keyboard-grid","screen-reader-audio-first","reduced-motion","visual-playhead-caption"]`,
`expectedBurden: 3–8`, `prerequisites: []` (starter) / `["music.beat.starter"]` (deeper variants).

> The `group` variants are an honestly-labeled **synthetic duet** ("the studio plays two bars, you answer
> two bars") — it satisfies the `social: group` coverage axis without real co-presence (out of scope for
> v1). It is never presented as another live child.

---

## 8. States (empty / first-run / mid / completed / return)

| State | What the child sees / hears | What's different |
|---|---|---|
| **Empty** (never entered) | Studio dim; a soft default groove *ready*; Shelf bare; one breathing **"▶ tap to start"** pad | audio not yet unlocked (gesture pending) |
| **First-run** | Default beat playing; playhead sweeping; nearest empty pad pulses; PERFORM/SONG doors dim | no artifacts; only novelty; Save hidden until the loop differs from default |
| **Mid-activity** | Grid partly built, tracks lit, swing knob revealed; **Save** appears when the loop diverges | live editing; every tap audible next pass |
| **Completed** | Gentle, label-free celebration (ceiling per age band); loop lands on the Shelf; offers **"make another / perform it / tweak it"** | first real artifact exists → `ARTIFACT_COMPETENCE` |
| **Return visit** | NEW banners gone, sparkle quieted; **your loops are on the Shelf, softly playing the last one**; one *opt-in* "your half-finished loop is still here" cue — no countdown, no streak | if voluntary + novelty-decayed → `welcome-back` delight (label-free, **no points**); which loop/mode they drift to = the spike |
| **"A week later…"** (synthetic time-lapse) | Narrated, honestly-labeled step: the room visibly quiets, no reminder was sent; it asks nothing | makes "return over days" legible in one session; a *voluntary* reopen here is the gold signal |

**Guilt-free exit (right to disconnect):** any time, a *"that's a good place to stop — the studio will
be here"* endpoint; pause/leave loses nothing; the loop is saved. No loss-framing, ever.

---

## 9. Accessible DOM-mirror — `ActivityDOM` (audio-first is a strength)

The same act of making music, keyboard- and screen-reader-operable, **not a lesser menu**. Because the
**primary output is sound, it is identical for sighted and blind users** — audio-first is the whole point.

- **The grid is real DOM.** `role="grid"`; rows = instruments (`row` with `aria-label="Kick"`),
  columns = steps; each pad is a `<button role="gridcell" aria-pressed="true|false"
  aria-label="Kick, step 3, off">`. **Arrow keys move focus one cell at a time** (never steer a cursor —
  Accessible Games Initiative); **Space/Enter toggles**, announcing `"Kick, step 3, on"`.
- **The playhead is the audio itself.** You *hear* the beat, so no per-step SR spam. An opt-in
  `aria-live="polite"` "bar 2" tick and a reduced-motion visual caption are available but off by default.
- **Full transport as labelled controls:** Play/Pause; Tempo (`slider`, `aria-valuetext="96 BPM"`);
  Swing; per-track Mute; Add sound; **Perform** (a bank of trigger `<button>`s + an "energy" slider you
  arrow up/down *live* while it loops); **Song** (an ordered list of patterns you reorder by keyboard);
  Save; Name; Share/Export.
- **Preserves the act of choosing what to revisit** (Surveyor caution — don't railroad). The Shelf is a
  navigable list ("your loops — 3, newest first, tap to reopen"), and *"what did I leave unfinished?"* /
  *"what's new?"* are query-able — the child still chooses what to return to.
- **Parity by construction.** `ActivityDOM` is generated from the **same headless state** as `Room3D`
  (§10); every 3D pad has a 1:1 DOM control with the same `probeId`/`workMode`/`whyCopy`/`tone`, and
  **emits the identical `EngagementEvent`s** (§7). The existing `plainViewEquals` parity test extends to
  cover it. Reduced-motion → instant framing; WCAG 2.2 AA; color-independent (state carried by
  `aria-pressed` + shape, not hue alone).

---

## 10. Architecture — the `ZonePlugin` mapping (implementable shape)

The zone is one module owning only `passion/packages/interest-zone-music/`; the single shared-root touch
is registering the plugin in the app's zone registry (the one expected merge point).

```ts
// interest-zone-music/src/index.ts — implements the frozen ZonePlugin
export const musicZone: ZonePlugin = {
  id: "music",
  domain: "audio",
  mapBuilding: {          // 2D Curiosity Map building (uses view-layer tokens)
    domain: "audio",
    label: "Music Studio",
    sprite: "building-music",     // CC0 sprite, palette-tinted
    // position resolved by the map layout; hue via resolveDomainHue
  },
  Room3D,                 // bounded 3D skin (mounts into the shared persistent Canvas)
  ActivityDOM,            // §9 — accessible operable truth + a11y floor tier
  probes,                 // §7.4 catalog contribution
};
```

**Shared headless core (the key to parity + testability).** All state and audio live in a
framework-agnostic hook/store the coding agent fully controls (no 3D artistry needed):

```ts
// interest-zone-music/src/useGroovebox.ts
useGroovebox(props: RoomProps) => {
  pattern, tracks, bpm, swing, playhead, mode, shelf, isPlaying,
  toggleStep, addTrack, setSound, setSwing, setBpm, muteTrack,
  enterPerform, ride(energy), enterSong, arrange, save, name, share,
}
// Web Audio: a lookahead scheduler (the "Tale of Two Clocks" pattern) keeps timing tight
// independent of frame rate; AudioContext is created/resumed on first user gesture.
```

- **`Room3D` = a reactive skin over that state.** It renders the studio + a pad grid whose emissive
  intensity reflects `aria-pressed`/step-on, animates the playhead, and forwards pointer/raycast taps to
  the *same* `toggleStep`/actions (so pointer users can hit the pretty pads). **The operable truth is the
  DOM controls** (from the same state), overlaid/composed so keyboard + screen reader always work — so
  the primary interactive surface is **not** an `aria-hidden` canvas with no alternative (the exact v1
  failure). This is the reconciliation of "keep the canvas skin" with "no dead decorative primary."
- **`ActivityDOM` = the same controls, standalone**, and the `room-3d → room-3d-lite → DOM activity`
  accessibility floor. Two renderings of the same verbs, never scenery-over-a-menu.
- **`RoomProps` (proposed, consistent with the codebase):**
  `{ learnerRef, ageBand: AgeBand, reducedMotion, plainMode, quality: QualityTier,
  initialArtifacts: Loop[], isReturnVisit, timeLapse?: "a-week-later",
  onEvent(e: EngagementEvent): void }`. The activity calls `onEvent` per §7; the app routes it through
  core `recordEvent` → the grid/hypothesis.
- **Frameloop discipline.** The Web Audio scheduler is the clock. While playing, a lightweight rAF drives
  *only* the playhead transform (or render the playhead as a cheap DOM/CSS overlay to keep the Canvas on
  `frameloop="demand"`); when stopped, the scene is fully static → zero GPU. Chromebook-safe.

---

## 11. Assets + art + bounded-3D room staging (CC0 pipeline)

Consumes the **one locked art-direction pack** (palette + one HDRI + one shading model + fog + frozen
shadows + ACES/Bloom/Vignette) exactly as the map does — reuse `SCENE3D`/`CAMERA3D`/`QUALITY_TIERS`
tokens from `@gt100k/interest-lab-view` for cohesion.

- **Room shell (few draw calls):** a small interior from **Kenney** interior/furniture kits (walls,
  floor, a desk/console) — `gltf-transform optimize --compress meshopt --texture-compress ktx2` →
  `gltfjsx --transform`. Merge static shell meshes (`<Merged>`); one shared atlas material.
- **The hero is procedural, not modeled.** The **pad grid** is code-generated rounded boxes in a single
  `THREE.InstancedMesh` (all pads = **1 draw call**); "on" = raised `emissiveIntensity` (drives Bloom =
  the glow that reads as *this pad is playing*). No 3D-artist skill required — exactly the pipeline's
  "beauty from lighting + cohesion, not geometry" bet.
- **Playhead:** one emissive plane/column translated in time (cheap; or DOM overlay per §10).
- **Shelf loops:** instanced little cassettes/vinyl (1 instanced mesh); label texture = loop name.
- **Listeners (audience condition):** 1–2 **Quaternius/KayKit** CC0 characters with a looped idle-bob
  (`<Float>` or a baked clip), instanced; present in `perform`-audience mode, hidden in practice.
- **Lighting/atmosphere:** one self-hosted HDRI via `<Environment>`; one `directionalLight` key
  (warm, `SCENE3D.keyHex`); low hemisphere fill; **`<ContactShadows frames={1}>`** (bake-once) or
  `<BakeShadows>`; palette-matched **fog** to tie it together; `<Sparkles>` sparingly for life.
- **Post:** the shared `EffectComposer` (`Bloom mipmapBlur` + `Vignette` + `ToneMapping ACES`), renderer
  `NoToneMapping`; SMAA not MSAA.
- **Camera:** fixed, framing the console head-on (`fov` ~40); no orbit needed inside the room (or a tiny
  clamped drift). The persistent Canvas **swaps room contents**, never mounts/unmounts.
- **Budget (Chromebook):** **< 50 draw calls** (shell-merged + pads-instanced + playhead + shelf +
  listeners ≈ well under), ≤ 1 shadow-caster (frozen), textures 256–512², `dpr ≤ 1.5`, adaptive via
  `PerformanceMonitor`/`AdaptiveDpr`. Dispose geometries/materials on room-swap.
- **Manifest:** every asset → `assets/LICENSES.json` (source, author, license). All synthesized audio +
  CC0/CC-BY-recorded visuals; **no real-child data**; no Synty (avoids its AI/UGC EULA teeth).

---

## 12. Won't-ship-broken — the `window.__qa` contract

The zone must make the v1 failure un-shippable (QA harness P0/P2/P3a/P3b):

```ts
window.__qa = {
  ready: boolean,                 // studio mounted, audio-graph built (pre-gesture ok)
  error: string | null,
  settle(frames?): Promise<void>, // drain playhead + bloom before capture
  stateHash(): string,            // hash of {pattern, bpm, swing, tracks, mode, shelf}
  interactives(): Array<{ id, kind, worldPos?, screenRect? }>,  // every pad + transport
};
```

- **Primary action is provably live.** Toggling any pad changes `stateHash()` **and** the audio graph —
  so the gate's before/after state-diff and canvas raycast round-trip (P3b) both pass; a dead decorative
  pad would fail.
- **No aria-hidden-primary.** The operable controls are real focusable DOM (§9/§10); the 3D canvas is a
  *skin with a keyboard/DOM peer*, so the P3a red-flag ("large `aria-hidden` canvas with no alternative")
  does not trip. Audio-output is asserted (a scheduled-events counter in `stateHash`) so "silent studio"
  is catchable model-free.
- **Determinism:** `?seed=` fixes the starter groove; `?freeze=1`/reduced-motion parks the playhead for
  stable screenshots; `settle()` drains bloom/TAA.

---

## 13. Anti-patterns to avoid (explicit)

1. **Decorative 3D / dead pads.** Every pad and transport control must produce an **audible + visible**
   change (proven by §12). The 3D is a *reactive skin*, never a screensaver over the "real" UI.
2. **Quiz behind a pretty door.** There is no quiz, no "compose quest" stub, no form. The *only* thing
   inside the door is the instrument; **doing = the probe**. (This is the literal v1 fix.)
3. **Chocolate-covered broccoli.** The music-making itself is the reward (musical guardrails, §4) — not a
   drill wrapped in a game skin.
4. **Gamifying the return signal.** No streaks, points, XP, or FOMO on loops or on coming back.
   Celebration is gentle and label-free; `welcome-back` carries **no score**. Return pull is the
   persistent artifact, not a counter (Yu-kai Chou intrinsic-retention paradox; IDC right-to-disconnect).
5. **Collapsing topic vs work-mode.** All four work-modes must be reachable here, or a `perform`/`compose`
   *column* spike is undetectable (§6/§7.3).
6. **A lesser accessible menu.** `ActivityDOM` is the same instrument, audio-first, emitting identical
   events — not a flat to-do list; it preserves choosing what to revisit (§9).
7. **Pitch/mode overload.** Melody is pentatonic-locked; the empty state is never silent; depth is
   disclosed by affordance, never dumped in a menu.
8. **Web Audio pitfalls.** Never autoplay without a gesture (show the "tap to start" pad); use a lookahead
   scheduler (not `setInterval` note-by-note) or timing will drift on a busy Chromebook; don't announce
   every step to screen readers (the audio *is* the playhead).
9. **Mistaking novelty for interest.** First-run tapping is novelty; only later, unprompted return counts
   (§7.2). Prompted returns are recorded as `PROMPTED_RETURN` and excluded from the positive signal.
10. **Perf regressions.** Keep `<50` draw calls (instance the pads), frozen shadows, `frameloop` driven
    only while playing; dispose on room-swap.

---

## 14. Build order (for the zone loop)

1. **Headless core first:** `useGroovebox` state + Web Audio scheduler + synthesized kit + `Loop`
   serialization + the `onEvent` emission map (§7). Unit-test event emission (action → correct
   `{domain:"audio", workMode, type}`) with `@react-three/test-renderer`-free pure tests.
2. **`ActivityDOM`** (the operable truth + a11y floor): grid + transport + Shelf; keyboard + SR;
   `plainViewEquals` parity. This is the accessibility floor and it ships even if 3D is disabled.
3. **`Room3D` skin:** procedural pad `InstancedMesh` + playhead + shelf + listeners, bound to the same
   state; pointer/raycast → same actions; art tokens from the pack.
4. **`window.__qa`** contract (§12) + a regression probe: "toggling a pad changes stateHash and schedules
   audio."
5. **States** (§8) incl. the synthetic "a week later…"; **register** `musicZone` in the app zone registry.
6. **QA gate + operator review** on `localhost` (raycast round-trip, pointer-sweep, VLM rubric:
   clarity / primary-action-obvious / interaction-sense).

**Acceptance:** an 8-year-old taps a glowing pad within ~3s of entering and hears the beat change;
a screen-reader user builds, hears, refines, and saves the *same* loop by keyboard; each of build /
perform / debug / compose emits its `{domain:"audio", workMode, …}` event; a voluntary, novelty-decayed
return lands on the correct grid cell; `< 50` draw calls on a Chromebook; the QA gate cannot pass a dead
pad or an aria-hidden-primary canvas.

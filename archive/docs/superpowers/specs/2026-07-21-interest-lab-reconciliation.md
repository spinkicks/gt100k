# Interest Lab — Reconciliation & Canonical Contract (v1)

Locks the cross-spec seams after the deep (v2) zone/world designs so the parallel build lanes stay
consistent. **Source of truth:** `@gt100k/interest-lab` (`src/probe.ts`) + `2026-07-21-interest-lab-core-spec.md`.
If a zone spec disagrees with this file, this file wins.

## 1. Canonical DOMAIN keys (wire) + child-facing labels
`Domain` is an open `string` (`probe.ts`). v1 zones register — **matching the frozen engine's established set**
(the interest-lab smoke/offer/coverage tests already use `symbols_math` / `sound_music` / `visual_design`), so
**no core-spec golden changes are needed**:

| wire key | child-facing label | zone |
|---|---|---|
| `sound_music` | Music Studio | Music |
| `symbols_math` | Code Lab | Code |
| `visual_design` | Art Studio | Art |

`symbols_math` is the broad quantitative/computational domain (child-facing **"Code Lab"** in v1). Reserved for
future zones: `making` (Build/Engineering), `living_systems` (Life Science), `word_craft` (Writing). *(A future
dedicated **Math** zone, if ever split off, takes a new key like `quant_reasoning` — `symbols_math` currently
backs the Code Lab.)* Child-facing text uses the labels; the wire/grid uses the keys. **Resolved:** the earlier
`computation` divergence is dropped in favor of the frozen `symbols_math`.

## 2. Canonical WORK_MODES (from `probe.ts` — all valid, none invented)
`build · investigate · compose · explain · perform · debug · collaborate · care · persuade`.
v1 uses six. **Shared columns (all three zones): `build · debug · compose`.** Signature column per zone:
Music = `perform`, Code = `investigate`, Art = `explain`. This is exactly what lets the grid separate a
**row** spike (a topic child) from a **column** spike (a work-mode child). ✓ No reconciliation needed here.

## 3. Event contract + the firewall (what emits vs what stays silent)
Every genuine **activity action** — a deep action in a cabin's **content app** — emits the frozen
**`ActivityEvent`** (core spec), carrying `{domain, workMode, probeId, dayOffset, intervention?, assistive?}`.
**Not** the raw `EngagementEvent` (that was a v1 error; Code v2 already corrected it — Music/Art must match).

**The firewall (non-negotiable — aliveness §1.2; every cabin honors it).** A cabin's cozy **micro-interactions
/ live-taste / juice** (tap the piano, wave at Claude, snap a code block, spin the pottery wheel, paint on the
tablet, stoke the stove, pet the cat…) emit **ZERO** `ActivityEvent` — *juice is never signal*. In
**content-deferred v1** the room therefore contributes only the **coarse domain-return** (which cabin a child
enters / revisits, observed as a Curiosity-Map building selection), and each cabin's **doorway is a host-ready
placeholder that emits nothing yet** (it toggles a `peeked` room-state so `window.__qa.stateHash()` proves it
*live*). The fine `{domain, workMode}` `ActivityEvent`s in the zone-v2 emission tables arrive **with the
deferred content app** (§5), opened *through* the doorway. A delight that leaks a signal is an instant fail.

## 4. Imports / the shared seam
Zones import `ZonePlugin` + `<CanvasHost>` + `<CuriosityMap>` from **`@gt100k/interest-zone-kit`** (never from
each other or the app). The only shared-root edit is the app's `ZONES` registry — **one line per zone**.
Content apps connect via `<ContentHost>` + **`@gt100k/interest-signal-client`** (postMessage → `ActivityEvent`),
in a **PII-free embedded mode** (the world is the identity layer).

## 5. Content-app strategy — DEFERRED (post-v1; from the intern repos)
**The learning content is NOT built by the v1 world loops.** It comes from the intern repositories/sites and
slots behind each cabin's doorway in a later phase; for v1 the doorways are **host-ready with a warm placeholder**
(e.g. a "coming soon" hearth-glow / taster). When we do integrate content, **prefer ADAPT over build-fresh
wherever we own or may use the source.** Every content app (owned, adapted, or fresh) must then meet the same
bar: a headless-testable core, WCAG-AA a11y, the `ActivityEvent` signal, world/DOM parity, and the Chromebook budget.
- **Music = adapt Blazing Audio (OWNED — full codebase, free to use).** Fork it into the pipeline: **drop the
  leaderboard** (don't gamify the return signal), add `@gt100k/interest-signal-client`, run it in PII-free
  embedded mode (the world is the identity layer), bring it to a11y + parity.
- **Code / Art (+ future domains) = per the operator's intern-app list.** Most intern apps are expected to be
  codebase-accessible + free to use → **adapt** them the same way; **build fresh** only where no suitable app
  exists. `Chrome Music Lab` (Apache-2.0) remains a parts/reference source.
The iframe + signal-SDK contract (§4) also covers any *open, deployed* app: coarse return-signal is free even
un-instrumented; the rich work-mode signal needs the ~10-line SDK inside the app.

## 6. World art direction
Retire v1's **midnight-cosmos** tokens (`SCENE3D.bg #181026` is now a *banned outcome*). Repalette to a **warm
golden-hour cozy** pack (warm raking key + a cool skylight fill so shadows tint blue-violet, never dead gray).
Keep the `Scene3DView` shape + `HUE_RAMP` (no contract break) — swap values only.

## 7. v1 BUILD SCOPE + lanes — the GAME only; learning content DEFERRED
**The v1 loops build ONLY the explorable game:** the Emberwood world (2D cabin-village map + 3D cabin
interiors), movement, game-flow, cozy visuals + juice, the doorways (host-ready + a warm placeholder), and the
**coarse domain-return signal** (which cabins a child visits and returns to). The **learning content behind the
doorways is DEFERRED** (§5) — it arrives later from the intern repos, and the fine work-mode signal comes with
it. *Everything except the learning material is in scope now — and the world must be a smooth, delightful, real
game on its own.*
- **Lane 0 — core (first):** `@gt100k/interest-zone-kit` + signal engine (domain-level for v1) + Curiosity Map
  + `<CanvasHost>` + `<ContentHost>` (host-ready, no content yet) + `window.__qa` + green smoke. Freezes the interface + keys.
- **Lane W — world visuals:** the Emberwood cozy repalette + the cabin-village map + 3D cabin looks (per the art bible).
- **Lane G — game-flow + movement + world aliveness:** traversal, camera, transitions, controls, ambient life + juice.
- **Lanes 1–3 — cabin rooms (parallel, after the freeze):** Music / Code / Art cozy interiors + their host-ready
  doorway, gated by the upgraded QA. **Content behind the doorway = deferred.**

## 8. Canonical per-cabin doorway · hero · ambient (reflects the enriched cabin interiors)
The `…-cabin-interior-*.md` specs enrich each room; this table **locks the one doorway per cabin** and the named
live-tastes so every spec agrees. **Exactly one `role:"doorway"` per cabin; everything else is `hero` (a live
taste) or `ambient` (a signal-free delight, §3 firewall).**

| Cabin | Domain (wire) | The ONE doorway (primary) | Hero live-taste | Ambient live delights (signal-free) |
|---|---|---|---|---|
| **The Sounding Cabin** (Music) | `sound_music` | the **production-nook console screen** → *"open the studio"* | the **upright piano** (tap → warm chord) | the gramophone/turntable · the wood-stove · Biscuit the cat · the hung instruments |
| **The Tinker Workshop** (Code) | `symbols_math` | **The Coding Desk** — a real monitor glowing colorful code + keyboard w/ amber **RUN** key → *"step up to the desk"* (`coding-desk` → `openDesk()`) | the desk's live code (type a line / press RUN) | **Claude** the AI desk-buddy · **Sprout** the codeable robot · the keyboard · the string-lights · the wood-stove |
| **The Atelier** (Art) | `visual_design` | the **grand easel's periwinkle canvas** → *"step up to the easel"* | the **Storybox** desk toy | the **digital easel** monitor + **drawing tablet** (warm screens — **ambient, NEVER a 2nd doorway**) · the pottery wheel · the mobile · the cat |

**Enrichment locks (so no spec drifts):**
- **Code:** the old **"Build Bench"** grew into **The Coding Desk** (a real computer/keyboard/laptop); the
  wind-up automaton **"Pip"** is recast as **Sprout**; **Claude** is a *new* AI desk-buddy; wire key
  **`symbols_math`** (the earlier `computation` is dropped, §1). Screens glow **warm sage `#5FB98C` + amber**,
  never cold-blue. (`zone-code-design-v2.md` + `cabin-interior-code.md` agree.)
- **Art:** the Atelier shows art in **all** its forms — traditional (oils · pottery · still-life) **and
  digital** (a drawing tablet + a warm **"digital easel"**) **and internet culture** (a kindly **Bob-Ross
  homage** + framed **meme** prints). The digital tools sit on a `digital` **ambient** hotspot, deliberately
  warmer/softer than the periwinkle portal — **one doorway only** (the grand easel). Screens glow **warm**,
  never cold-blue. (`zone-art-design-v2.md` + `cabin-interior-art.md` agree.)
- **Music:** the abstract "pad wall" is realized as the pad-grid on the production-nook **screen** (the doorway)
  + the physical **piano**/MIDI keys (the hero live-taste); the gramophone is an ambient delight.
- **All three:** one doorway · `<50` draw calls · tier `room-3d → room-3d-lite → ActivityDOM` peer · the shared
  warm Emberwood palette + the "warm screens, never cold-blue" rule · the firewall (§3).

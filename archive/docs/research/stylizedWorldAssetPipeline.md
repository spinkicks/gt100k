# The Stylized World Pipeline: Assets + Art Direction for a Coding Agent

**Context:** A beautiful, explorable, stylized 3D world for GT100K's children's education product, built in [three.js](https://threejs.org/) + [react-three-fiber](https://docs.pmnd.rs/) on WebGL2, that must run on school Chromebooks. The builder is a **coding AI agent, not a 3D artist**, so visual beauty has to come from *assembling licensed assets and applying art direction*, not from sculpting custom meshes. Assets must be commercially usable and free of real-child data.

**How to read this doc:** Sections 1–2 are *where assets come from and how they're licensed*. Section 3 is *how to load and optimize them*. Section 4 is *how to make assembled parts look cohesive and lovely*. Section 5 is *how to keep it fast on Chromebooks*. Section 6 is the *end-to-end recipe*. Sections 7–8 are the *opinionated default stack* and the *licensing/compliance summary*.

---

## 0. The core bet

A coding agent cannot model a swaying tree, but it can place 200 CC0 trees, tint them to one palette, light them with one HDRI, add fog and bloom, and instance them into a single draw call. **Cohesion and lighting, not geometry, are where beauty lives** — and both are things code can control precisely. The three hard constraints that shape every decision below:

1. **Chromebook hardware.** School Chromebooks run integrated GPUs (Intel UHD, AMD Vega, or ARM Mali) on a Unified Memory Architecture where the GPU shares system RAM and bandwidth with the CPU, so memory bandwidth and fill-rate are the ceiling, and they thermally throttle after a few minutes of sustained rendering ([RapidMade, iGPU rendering](https://rapidmade.com/webgl-three-js-cad-rendering-optimization/); [Intelligent Graphic & Code, 60fps patterns](https://intelligentgraphicandcode.com/development/threejs-interfaces/performance)). Target **WebGL2** — it has near-universal support while WebGPU coverage is still incomplete in early 2026, though three.js's `WebGPURenderer` gives automatic WebGL2 fallback if you want it later ([Simplified Media, WebGL/three.js](https://simplified.media/guides/webgl-threejs); [Utsubo, 100 three.js tips 2026](https://www.utsubo.com/blog/threejs-best-practices-100-tips)).
2. **Licensing.** Prefer **CC0** (public domain, no attribution, commercial OK) so the agent never has to reason about attribution chains. Use CC-BY and paid EULAs deliberately, with a manifest.
3. **Children's product, synthetic data.** Never ingest real-child imagery. Generated accents (skyboxes/textures) must come from text prompts, and the licensing must survive commercial use.

---

## 1. Asset sources (the library layer)

### 1.1 Quick comparison

| Source | License | Format | Size / perf | Best for | Cost |
|---|---|---|---|---|---|
| [Kenney](https://kenney.nl/) | CC0 | GLB, glTF, OBJ, FBX | Tiny (packs ~1–3 MB) | Cohesive low-poly kits, whole-world backbone | Free (optional paid bundle) |
| [Quaternius](https://quaternius.com/) | CC0 (all tiers) | glTF, FBX, OBJ, BLEND | Small, shared atlases | Rigged/animated characters, nature, vehicles | Free (pay for extras/source) |
| [KayKit](https://kaylousberg.itch.io/) | CC0 | glTF, FBX, OBJ | Tiny, single gradient atlas | Modular dungeons/nature/characters + animations | Free (pay for extras/source) |
| [Poly Pizza](https://poly.pizza/) | Per-model: CC0 **or** CC-BY | glTF, OBJ, FBX | Small low-poly | One-off props, filling gaps | Free |
| [Poly Haven](https://polyhaven.com/) | CC0 | HDRI, EXR, textures, some models | HDRIs large (resize/compress) | IBL lighting, PBR textures | Free |
| [ambientCG](https://ambientcg.com/) | CC0 | Textures, HDRIs | Choose resolution | PBR material textures | Free |
| [Sketchfab](https://sketchfab.com/) / [Fab](https://www.fab.com/) | Mixed (per-model) | glTF, GLB, FBX, OBJ, USDZ | Varies (verify each) | Specific/detailed hero models | Free + paid |
| [Synty Studios](https://syntystore.com/) | Paid EULA (perpetual, per-seat) | FBX (+ Unreal/Unity) | AAA-stylized, heavier | Premium *cohesive* look across a whole world | Paid |

### 1.2 The CC0 backbone (use these first)

- **[Kenney](https://kenney.nl/)** — 60,000+ assets, all under **CC0 1.0** ("use in unlimited commercial projects, no attribution required"), shipped in game-ready formats including GLB/glTF, with an intentionally consistent friendly aesthetic across packs ([Kenney All-in-1](https://kenney.itch.io/kenney-game-assets); [Platformer Kit, CC0](https://kenney-assets.itch.io/platformer-kit); [Cinevva 2026 comparison](https://app.cinevva.com/guides/sketchfab-polyhaven-kenney)). Packs are astonishingly small — the [Building Kit](https://kenney-assets.itch.io/building-kit) is 1.5 MB, [City Kit Suburban](https://kenney-assets.itch.io/city-kit-suburban) is 1.9 MB — which is ideal for Chromebook download budgets. **This is your world backbone.**
- **[Quaternius](https://quaternius.com/)** — thousands of stylized low-poly models (characters, animals, nature, vehicles), rigged and animated, all **CC0** even in the paid tiers (you pay for extra models/source `.blend`, not for the license), authored with shared texture atlases for optimization — e.g. the [Fantasy Props MegaKit](https://quaternius.com/packs/fantasypropsmegakit.html) uses 4 texture sets for 200+ models ([AssetHoard 2026](https://assethoard.com/blog/where-to-find-free-game-assets-2026)). The recognizable "Quaternius style" (clean geometry, bright colors) pairs well with Kenney. **This is your character/nature source.**
- **[KayKit](https://kaylousberg.itch.io/)** (Kay Lousberg) — modular stylized kits (dungeon, forest, city, adventurers) plus 160+ **CC0** humanoid animations. Every model is textured with a **single 1024×1024 gradient atlas that downsamples cleanly to 128×128**, so an entire kit can share one small texture and often one draw call ([KayKit Dungeon Pack](https://kaylousberg.itch.io/kaykit-dungeon-pack); [Character Animations](https://kaylousberg.itch.io/kaykit-character-animations)). The license is CC0 with a courtesy request not to resell the raw files. **This is your modular-architecture + animation source.**
- **[Poly Pizza](https://poly.pizza/)** — 10,600+ low-poly models (it absorbed much of the shuttered Google Poly archive). **License is per-model**: some CC0, many CC-BY, shown right on each model page (e.g. a [CC0 Quaternius pizza](https://poly.pizza/m/XmmG0uImLL) vs a [CC-BY community remix](https://poly.pizza/m/3NU_jjCzvvX)). Great for filling one-off gaps; the agent must read the license per download and record attribution for CC-BY items.

### 1.3 The premium paid option: Synty

[Synty Studios](https://syntystore.com/) POLYGON/SIMPLE packs are the fastest route to a *AAA-cohesive* stylized world because everything is authored to one style. But the license is a paid EULA, not CC0, and it has teeth relevant to this project:

- **One-Time Purchase Licence** is perpetual and includes **5 seats per purchase**; you must own enough seats to cover everyone who touches the assets, and Humble Bundle purchases grant only **1 seat** ([One Time Purchase Licence, 3 Jun 2026](https://syntystore.com/pages/one-time-purchase-licence-3-june-2026); [Synty FAQ](https://syntystore.com/community/faq)). A subscription (SyntyPass) is also per-seat ([Standard Subscription Licence](https://syntystore.com/pages/standard-subscription-licence)).
- **Critical restrictions for an AI-built kids' product:** the EULA forbids using assets *"in datasets utilised by Generative AI Programs; or in the development of Generative AI Programs"* and *"Generation of 3D models utilising Generative AI Programs,"* and forbids use *"for the creation and development of Content Creation Systems"* ([Standard Subscription Licence §1.4–1.6](https://syntystore.com/pages/standard-subscription-licence)). A **coding agent hand-placing Synty models into a fixed scene is fine**; **training any model on them, generating models from them, or letting children generate/publish their own creations with them (UGC) is not** — that requires a Synty custom licence.

**Verdict:** treat Synty as an optional premium layer for a hero area if budget allows and if the product never becomes a user-generated-content sandbox. The CC0 backbone (1.2) is the safer default for an ed product that may add child-authoring later.

### 1.4 Sketchfab / Fab — verify per model

Sketchfab hosts a huge mix of licenses; **check every model**. As of 2026 Epic has moved the commercial marketplace to [Fab](https://www.fab.com/), which supports only **CC-BY** and a **Standard** license — it does **not** offer CC0, CC-BY-NC, CC-BY-SA, or CC-BY-ND, so those license types could not migrate ([Sketchfab→Fab migration blog](https://sketchfab.com/blogs/community/fab-publishing-portal-open-for-sketchfab-migration/); [Fab license Q&A](https://forums.unrealengine.com/t/non-commercial-models/2027604); [Fab migration docs](https://dev.epicgames.com/documentation/en-us/fab/migrating-assets-to-fab)). Free CC content (including museum CC0 scans) remains downloadable on Sketchfab, and Epic has stated it "will not remove the ability to share or download content on Sketchfab until we have a viable alternative" ([80.lv coverage](https://80.lv/articles/historians-are-concerned-about-epic-games-sketchfab-to-fab-migration)). **Practical rule for the agent:** only pull Sketchfab/Fab models that are explicitly **CC0** or **CC-BY** (record attribution for CC-BY), and never assume; the license is per-model.

---

## 2. Generated assets as accents

Generated content shines for the things a low-poly kit can't give you: a gorgeous sky, a distant vista, a unique material. Use them as **backdrops and lighting**, not as the interactive geometry.

### 2.1 Skyboxes + HDRIs

- **[Blockade Labs Skybox AI](https://blockadelabs.com/)** — text-to-360° equirectangular skyboxes with **HDRI lighting export and 3D skybox-mesh export**, up to 8K (16K on Business) ([Skybox AI review 2026](https://www.tooljunction.io/ai-tools/skybox-ai)). **Licensing:** all *paid* plans include *"full commercial licensing with clear IP ownership"* and *"no distribution restrictions ... no additional licensing fees or attribution requirements"*; the **free tier is preview-only with no exports** ([Skybox plans](https://skybox.blockadelabs.com/plans); [Blockade Labs](https://blockadelabs.com/)). Essential is ~$20/mo (100 credits); HDRI lighting + 3D mesh unlock on the Standard tier. Read Blockade's ToS before shipping (their terms also grant Blockade a license to generated content, standard for these tools). Use one generated skybox as both **background and image-based light source** — it's the single biggest "wow per byte" you can buy.
- **[Poly Haven](https://polyhaven.com/hdris)** — CC0 photographic HDRIs, unclipped and ready for IBL, no attribution ever required ([Poly Haven license](https://polyhaven.com/license)). This is the **free** equivalent for realistic-but-stylizable lighting; download at 1–2K, not 8K, for the web.

### 2.2 Textures

- **[Poly Haven](https://polyhaven.com/textures)** and **[ambientCG](https://ambientcg.com/)** are both fully **CC0** PBR texture libraries (wood, stone, fabric, terrain, plus HDRIs), free for any commercial or educational use with no attribution ([Poly Haven license](https://polyhaven.com/license); [Poly Haven vs ambientCG](https://www.saashub.com/compare-poly-haven-vs-ambientcg); [Blended Boris on CC0 textures](https://blendedboris.com/our-blog/tpost/free-texture-resources-blender)). Poly Haven even explicitly permits training AI on its assets ([Poly Haven FAQ](https://docs.polyhaven.com/en/faq)). Grab color/normal/roughness at 512–1K and convert to KTX2 (Section 3).

### 2.3 Gaussian splats (use with caution on Chromebooks)

Splats give a photoreal or painterly *diorama* look and are declaratively supported in r3f via drei `<Splat>`, [`@lumaai/luma-web`](https://www.npmjs.com/package/@lumaai/luma-web), [`@speridlabs/visus`](https://registry.npmjs.org/%40speridlabs%2Fvisus) (Web-Worker sorting, instanced draws), and Mark Kellogg's `GaussianSplats3D` ([Best splat viewers 2026](https://swyvl.io/blog/best-gaussian-splat-viewers/)). But they're **heavy**: keep total Gaussians **under ~3M for mobile/low-end**, disable canvas MSAA (`antialias: false`, since splats self-antialias and MSAA is very expensive at high instance counts), and cap `dpr` ([Luma web performance tips](https://github.com/lumalabs/luma-web-examples/blob/main/README.md); [Luma perf issue #15](https://github.com/lumalabs/luma-web-examples/issues/15)). **Recommendation for Chromebooks:** avoid live splats in the interactive scene; if you want the look, render a splat vista *offline* into a 360° image and ship it as a static skybox instead. **Licensing:** you own captures/generations you make; any downloaded splat carries its own license — verify it.

> **Children's-data rule for all generated assets:** generate from synthetic text prompts only. No real-child photos as inputs, ever. Keep the prompt + tool + license for each generated asset in the manifest (Section 8).

---

## 3. Loading + optimization (the build layer)

This is a code step, which is exactly where a coding agent excels. **Rule: everything ships as an optimized `.glb`.**

### 3.1 The optimization pass with glTF-Transform

[glTF-Transform](https://gltf-transform.dev/) is the standard, scriptable optimizer ([donmccurdy/glTF-Transform](https://github.com/donmccurdy/glTF-Transform/)). A disciplined pass — prune → dedupe → weld/quantize → compress geometry → compress textures — routinely yields **90–95% size reduction** vs an unoptimized export ([Unity export guidelines 2026](https://docs.unity.com/en-us/asset-transformer-sdk/2026.1/manual/sdktips/export-guidelines); [OptimizeGLB 2026](https://optimizeglb.com/blog/how-to-achieve-99-percent-glb-compression)), and real projects have taken Lighthouse from 39→97 by doing it ([Axel Cuevas, optimizing 3D models](https://www.axl-devhub.me/en/blog/optimizing-3d-models)).

```bash
# One-shot optimize (prune, dedupe, quantize, compress geometry + textures)
npx @gltf-transform/cli optimize in.glb out.glb \
  --compress meshopt \
  --texture-compress ktx2

# Or fine-grained, choosing codecs per texture slot:
# Meshopt compresses geometry, morph targets AND keyframe animation
npx @gltf-transform/cli meshopt in.glb step1.glb --level medium
# KTX2: UASTC for normal/ORM (detail), ETC1S for base color (small)
npx @gltf-transform/cli uastc step1.glb step2.glb \
  --slots "{normalTexture,occlusionTexture,metallicRoughnessTexture}" --level 4 --rdo --zstd 18
npx @gltf-transform/cli etc1s step2.glb final.glb --quality 255
```

- **Geometry: Meshopt vs Draco.** Draco gives the smallest *bytes* for static meshes; **Meshopt** compresses geometry *and* animation, decodes faster, and pairs cleanly with KTX2 ([glTF-Transform docs](https://gltf-transform.dev/); [Unity docs](https://docs.unity.com/en-us/asset-transformer-sdk/2026.1/manual/sdktips/export-guidelines)). On weak Chromebook CPUs, **default to Meshopt** for decode speed; switch to Draco only if download size is the hard bottleneck.
- **Textures: KTX2 / Basis Universal.** Textures are usually 80% of a model's weight and the biggest consumer of shared VRAM; a 2048² RGBA texture is 16 MB uncompressed but ~4 MB as GPU-compressed BC7/ASTC, and Basis transcodes at load to whatever the device supports ([Abratabia, optimizing three.js](https://www.abratabia.com/threejs/performance.php)). Use **ETC1S for base color** (tiny) and **UASTC for normal/roughness/occlusion** (detail) ([glTF-Transform](https://gltf-transform.dev/)). Resize to 512–1024 first.

### 3.2 Turning GLBs into r3f components

Use [`gltfjsx`](https://github.com/pmndrs/gltfjsx) with `--transform` to emit a typed React component *and* a compressed GLB in one shot, then load with drei's `useGLTF` (which wires Draco/Meshopt/KTX2 decoders and supports `preload`).

```tsx
// npx gltfjsx model.glb --transform --types
import { useGLTF } from '@react-three/drei'

export function Tree(props) {
  const { nodes, materials } = useGLTF('/models/tree-transformed.glb')
  return <mesh geometry={nodes.Tree.geometry} material={materials.atlas} {...props} />
}
useGLTF.preload('/models/tree-transformed.glb')
```

### 3.3 Draw-call reduction (the perf multiplier)

Draw calls — CPU→GPU command submissions — are the single biggest bottleneck; the GPU is fast, being *told what to do* 50× per frame is slow ([Simplified Media](https://simplified.media/guides/webgl-threejs); [Authon, r3f gallery at 5fps](https://blog.authon.dev/why-your-react-three-fiber-gallery-drops-to-5-fps-and-how-to-fix-it)). Target **under ~50 draw calls** for iGPU/mobile budgets ([Simplified Media](https://simplified.media/guides/webgl-threejs)). Tools, in order of preference:

- **Instancing** — one geometry+material, thousands of transforms, one draw call. Use drei [`<Instances>`/`<Instance>`](https://drei.docs.pmnd.rs/performances/instances) for declarative control (one gallery went 8→60 fps with this single change; [Authon](https://blog.authon.dev/why-your-react-three-fiber-gallery-drops-to-5-fps-and-how-to-fix-it)). **Caveat:** the declarative wrapper adds React/CPU overhead, so for *foliage-scale* counts (tens of thousands) drop to raw [`THREE.InstancedMesh`](https://threejs.org/docs/pages/InstancedMesh.html) and mutate matrices in `useFrame` ([drei Instances note](https://drei.docs.pmnd.rs/performances/instances); [r3f issue #3306](https://github.com/pmndrs/react-three-fiber/issues/3306)).
- **`BatchedMesh`** — different geometries that share one material, batched into few calls ([RapidMade](https://rapidmade.com/webgl-three-js-cad-rendering-optimization/); [Utsubo 2026](https://www.utsubo.com/blog/threejs-best-practices-100-tips)).
- **drei `<Merged>`** — merge static meshes at load.
- **Share materials + atlas textures** so batching is possible at all; every unique mesh/material pair is another draw call ([IGC](https://intelligentgraphicandcode.com/development/threejs-interfaces/performance)).

---

## 4. Art direction (the beauty layer)

Assembled CC0 kits look like a pile of assets until art direction unifies them. These are the highest-leverage techniques, ranked.

### 4.1 A disciplined palette (do this first)

The fastest way to make mixed-library assets look like one world is to **force them onto a limited palette**: pick ~5–7 hues plus one accent, group values (keep most surfaces mid-value, reserve near-white/near-black for focal points), and tint materials in code to hit those targets. Because CC0 kits (Kenney, Quaternius, KayKit) already use flat/atlas colors, the agent can recolor them by swapping the atlas or multiplying a `color` on the material — no re-modeling. Palette discipline is the cheapest cohesion win and costs zero GPU.

### 4.2 Lighting + IBL

- **Light the whole scene with one environment map** via drei [`<Environment>`](https://drei.docs.pmnd.rs/staging/environment): it sets `scene.environment` (and optionally `background`) so every material picks up consistent ambient light and reflections. **Self-host the HDRI** (a 1–2K CC0 file from [Poly Haven](https://polyhaven.com/hdris) or your Blockade skybox) — the built-in `preset` values pull from a CDN and are explicitly "not meant for production" ([drei Environment docs](https://github.com/pmndrs/drei/blob/master/docs/staging/environment.mdx)).
- **Add one key light** (a single `directionalLight`) for shape and shadow direction, plus a low `ambientLight`/hemisphere fill. One shadow-caster max.
- **Art-direct reflections cheaply** with drei [`<Lightformer>`](https://drei.docs.pmnd.rs/staging/lightformer) inside `<Environment>` — flat emissive rects/rings that read as studio lights on glossy surfaces without the cost of real lights.
- **Quick hero setup:** drei `<Stage>` auto-composes environment + key light + ground shadow for a single showcased object.

### 4.3 Shadows: bake, don't ray-trace

Real-time shadow maps are a Chromebook tax. Choose per situation:

- **Static world:** bake lightmaps/AO in Blender into the atlas, or freeze shadow maps with drei [`<BakeShadows>`](https://drei.docs.pmnd.rs/performances/bake-shadows) (sets `shadowMap.autoUpdate = false` after one render).
- **Grounding objects:** drei [`<ContactShadows>`](https://drei.docs.pmnd.rs/staging/contact-shadows) with `frames={1}` renders a soft blurred contact shadow once and stops — cheap and convincing ([drei shadows overview](https://deepwiki.com/pmndrs/drei/4.2-shadows)).
- **Hero static scene:** drei [`<AccumulativeShadows>` + `<RandomizedLight>`](https://drei.docs.pmnd.rs/staging/accumulative-shadows) build gorgeous soft raycast-like shadows over a few frames, then cost *zero* once settled — perfect for a mostly-static world.
- **Avoid** PCSS `<SoftShadows>` and per-frame shadow updates on Chromebooks.

### 4.4 Stylized shading models (cohesion + cheapness together)

Picking **one** shading model across all assets both unifies the look and controls cost:

- **Matcaps** ([`MeshMatcapMaterial`](https://threejs.org/docs/pages/MeshMatcapMaterial.html) via drei `useMatcapTexture`) bake lighting into a single texture — **zero lights, one texture lookup, no shadow math** — the most Chromebook-friendly way to look hand-crafted.
- **Toon/cel** ([`MeshToonMaterial`](https://threejs.org/docs/pages/MeshToonMaterial.html) + a `gradientMap`) gives a storybook banded look; set the gradient texture's `minFilter`/`magFilter` to `NearestFilter` and `generateMipmaps = false` or the bands smear ([three.js MeshToonMaterial](https://threejs.org/docs/pages/MeshToonMaterial.html); [materials overview](https://medium.com/@526482943/one-article-to-understand-the-materials-in-three-js-c75337bc91a3)).
- **Flat PBR** (`MeshStandardMaterial` with baked AO, low metalness) reads clean and modern and is what the CC0 kits ship expecting.

### 4.5 Postprocessing (subtle, budgeted)

Use [`@react-three/postprocessing`](https://github.com/pmndrs/react-postprocessing) — its `EffectComposer` merges effects into a single fullscreen pass (one screen triangle), so several effects cost far less than chained passes ([react-postprocessing README](https://github.com/pmndrs/react-postprocessing/blob/master/README.md); [pmndrs/postprocessing](https://github.com/pmndrs/postprocessing), v6.39.x in 2026). Correct HDR workflow: **set renderer `toneMapping` to `NoToneMapping` and add `<ToneMapping>` (ACES/AgX) as the last effect**, then raise Bloom's `luminanceThreshold` to match ([three.js forum: tone mapping in post](https://discourse.threejs.org/t/r3-drei-difference-in-tonemapping-exposure-environment-intensity-from-9-78-2-to-9-88-3/57223)).

```tsx
// Chromebook-safe stack: keep it to 2–3 cheap effects
<EffectComposer>
  <Bloom mipmapBlur luminanceThreshold={1.0} intensity={0.6} />
  <Vignette offset={0.3} darkness={0.5} />
  <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
</EffectComposer>
```

- **Bloom** with `mipmapBlur` is the cheap, high-impact glow ([effects reference](https://unpkg.com/10x-development-team@3.2.0/plugin/knowledge/libraries/three-postprocessing.md)).
- **Vignette** is nearly free and focuses the eye — always keep it.
- **Anti-aliasing:** prefer **SMAA** (post) over MSAA when using effects, especially AO.
- **Ambient occlusion:** [N8AO](https://github.com/N8python/n8ao) is the efficient AO choice, but AO is the first thing to *drop* on the weakest devices — gate it behind the performance monitor (Section 5).
- **Rule:** each effect is another pass; on Chromebooks stay at Bloom + Vignette + ToneMapping and add more only on capable hardware ([effects reference perf notes](https://unpkg.com/10x-development-team@3.2.0/plugin/knowledge/libraries/three-postprocessing.md)).

### 4.6 Atmosphere + depth (huge cohesion, tiny cost)

- **Fog** (`scene.fog`, color-matched to the palette/sky) is the cheapest cohesion tool there is: it ties disparate assets into one atmosphere, adds depth, and *hides LOD pop-in and the far clip*. Use it liberally.
- **Sky/ambiance:** drei `<Sky>` (procedural), `<Stars>`, `<Cloud>`/`<Clouds>`, and `<Sparkles>` add life at trivial cost.
- **Gentle motion** with drei `<Float>` on hero props, plus instanced foliage sway in a vertex shader, makes a static world feel alive.

### 4.7 Camera + composition

Frame with a slightly long lens (`fov` ~35–45) to reduce distortion, use drei `<Bounds>`/`<Center>` to auto-frame, add slow parallax or `<CameraShake>` sparingly, and reserve depth-of-field for cutscenes (it's a per-frame pass).

---

## 5. Performance discipline for Chromebooks

### 5.1 Canvas defaults

```tsx
<Canvas
  dpr={[1, 1.5]}                    // cap pixel ratio; 2x→3x is 9x the fill for no visible gain
  gl={{ antialias: false, powerPreference: 'high-performance' }} // use SMAA in post instead
  frameloop="demand"                // render only on change where the scene is static
  shadows                           // but bake/freeze them (4.3)
>
```

Capping `dpr` at 1.5 and rendering on demand are two of the biggest wins on shared-memory GPUs ([b-open-io r3f perf reference](https://github.com/b-open-io/prompts/blob/master/skills/threejs-r3f/references/performance.md); [Abratabia](https://www.abratabia.com/threejs/performance.php)).

### 5.2 Adaptive quality

Let the app self-tune with drei [`<PerformanceMonitor>`](https://drei.docs.pmnd.rs/performances/performance-monitor) + [`<AdaptiveDpr>`](https://drei.docs.pmnd.rs/performances/adaptive-dpr) + `<AdaptiveEvents>`: measure average FPS, and on `onDecline` drop `dpr`, disable AO/bloom, or thin foliage; on `onIncline` restore. Use `flipflops` to lock a safe baseline if it oscillates ([r3f scaling-performance docs](https://github.com/pmndrs/react-three-fiber/blob/master/docs/advanced/scaling-performance.mdx)).

```tsx
const [dpr, setDpr] = useState(1.25)
const [fancy, setFancy] = useState(false)
<Canvas dpr={dpr}>
  <PerformanceMonitor
    onIncline={() => { setDpr(1.5); setFancy(true) }}
    onDecline={() => { setDpr(1);   setFancy(false) }}
    flipflops={3}
  />
  <AdaptiveDpr pixelated />
  <AdaptiveEvents />
  {/* render N8AO/extra bloom only when `fancy` */}
</Canvas>
```

### 5.3 Budgets (starting targets)

| Budget | Chromebook target |
|---|---|
| Draw calls / frame | < 50 (hard: < 100) |
| Triangles visible | ≤ ~300–500k |
| Texture size (props) | 256–512²; (hero) ≤ 1024² |
| Postprocessing passes | 2–3 |
| Pixel ratio | ≤ 1.5 |
| Shadow-casting lights | ≤ 1 (baked/frozen) |
| Initial download | keep GLBs KB–low-MB (Kenney-scale) |

Dispose geometries/materials/textures on unmount to avoid the memory creep that eventually forces a Chromebook into software rendering, and **test on a real low-end device under sustained load**, not a quick demo on a dev machine — throttling only shows after minutes ([IGC](https://intelligentgraphicandcode.com/development/threejs-interfaces/performance); [Utsubo](https://www.utsubo.com/blog/threejs-best-practices-100-tips)).

---

## 6. End-to-end recipe (what the coding agent actually does)

1. **Choose a look.** Pick one library family as the hero style (e.g. Kenney + Quaternius + KayKit, all CC0) and lock a palette of ~6 colors + 1 accent (4.1).
2. **Source assets.** Pull environment/props from Kenney, characters/nature from Quaternius, modular structures + animations from KayKit, gap-fillers from Poly Pizza (record per-model license). Grab 1–2K HDRIs/textures from Poly Haven/ambientCG (all CC0). Optionally generate one skybox with Blockade (paid plan for the commercial license) (Sections 1–2).
3. **Optimize.** Convert everything to GLB and run `gltf-transform optimize --compress meshopt --texture-compress ktx2`; resize textures to budget (3.1).
4. **Componentize.** `gltfjsx --transform --types` → typed r3f components; `useGLTF.preload` the hero assets (3.2).
5. **Assemble + instance.** Lay out the world; wrap repeated props (trees, rocks, fences) in `<Instances>` / `InstancedMesh`; share materials; aim < 50 draw calls (3.3).
6. **Light.** One self-hosted HDRI via `<Environment>`, one key `directionalLight`, low fill, Lightformers for glints (4.2).
7. **Shade.** Apply one shading model (matcap / toon / flat PBR) and tint to the palette (4.4).
8. **Shadow.** Bake or freeze: `<ContactShadows frames={1}>` or `<AccumulativeShadows>` for the hero area, `<BakeShadows>` elsewhere (4.3).
9. **Atmosphere.** Add palette-matched fog, a sky, and a little `<Float>`/`<Sparkles>` life (4.6).
10. **Post.** `EffectComposer` with Bloom(`mipmapBlur`) + Vignette + ToneMapping(ACES); renderer `NoToneMapping` (4.5).
11. **Perf-tune.** `dpr={[1,1.5]}`, `antialias:false` + SMAA, `frameloop="demand"`, and wrap in `<PerformanceMonitor>`/`<AdaptiveDpr>` to auto-scale AO/bloom/dpr (Section 5).
12. **Ship with a manifest.** Record every asset's source + license (+ attribution for CC-BY) (Section 8).

---

## 7. Recommended default stack

**If you do nothing else:** build the world from **Kenney + Quaternius + KayKit** (all CC0, GLB, tiny), light it with **one self-hosted Poly Haven HDRI** through drei `<Environment>`, unify everything with **one palette + one shading model + fog**, ground it with **frozen contact shadows**, add **Bloom + Vignette + ACES tone mapping**, and gate quality with **`PerformanceMonitor` + `AdaptiveDpr`**. That alone produces a cohesive, lovely, Chromebook-safe world with zero attribution obligations.

**Packages:** `three`, `@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing`, `postprocessing`; build-time `@gltf-transform/cli` + `gltfjsx`. Optional: `@lumaai/luma-web` or `@speridlabs/visus` only if you truly need a splat (prefer baking it to a skybox).

**Paid upgrades, in order of value:** (1) a [Blockade](https://blockadelabs.com/) subscription for a bespoke hero skybox (commercial license + IP ownership on paid plans); (2) [Synty](https://syntystore.com/) POLYGON for a premium cohesive hero zone *only if* you'll never train AI on them or turn them into a UGC/creation system (§1.4–1.6 of its EULA).

---

## 8. Licensing + compliance summary

| License | Attribution? | Commercial? | Notes for this product |
|---|---|---|---|
| **CC0** (Kenney, Quaternius, KayKit, Poly Haven, ambientCG, some Poly Pizza/Sketchfab) | No | Yes | Safest default. No obligations. ([Poly Haven license](https://polyhaven.com/license)) |
| **CC-BY** (much of Poly Pizza; most free Fab/Sketchfab) | **Yes** | Yes | Keep a credits/NOTICE file; record author + link per asset. ([Fab licenses](https://forums.unrealengine.com/t/non-commercial-models/2027604)) |
| **Fab Standard** | No | Yes | Per-listing terms; verify each. ([Fab migration docs](https://dev.epicgames.com/documentation/en-us/fab/migrating-assets-to-fab)) |
| **Synty EULA** (paid) | No | Yes, per-seat | Perpetual, 5 seats/purchase (1 via Humble); **no AI training/generation, no UGC/Content-Creation-Systems** without custom license. ([Synty EULA §1.4–1.6](https://syntystore.com/pages/standard-subscription-licence)) |
| **Blockade Skybox AI** (paid) | No | Yes + IP ownership | Free tier is preview-only (no export). Read ToS. ([Skybox plans](https://skybox.blockadelabs.com/plans)) |

**Operational rules for the agent:**
- **Prefer CC0**; it removes all licensing reasoning. Fall back to CC-BY with an automated attributions file. Treat everything else (Fab Standard, Synty, per-model Sketchfab) as "read the specific terms."
- **Maintain an asset manifest** (`assets/LICENSES.json`) with, per asset: source URL, author, license, and for generated assets the tool + prompt. This is your commercial-use and audit trail.
- **Children's-data compliance:** all assets are synthetic/authored or text-generated; **no real-child imagery is ever used as input or content.** Generated skyboxes/textures come from prompts, not photos.
- **Synty × AI caveat (important here):** a coding agent *placing* Synty assets in a fixed scene is allowed, but using them in any generative-AI dataset/model, generating 3D from them, or exposing them inside a child-authoring/UGC system is prohibited without a Synty custom license ([Synty EULA §1.4–1.6](https://syntystore.com/pages/standard-subscription-licence)). The CC0 backbone avoids this entirely.

---

## Sources

**Asset libraries:** [Kenney](https://kenney.nl/) ([All-in-1](https://kenney.itch.io/kenney-game-assets), [Platformer Kit CC0](https://kenney-assets.itch.io/platformer-kit), [Building Kit](https://kenney-assets.itch.io/building-kit), [City Kit](https://kenney-assets.itch.io/city-kit-suburban)) · [Quaternius](https://quaternius.com/) ([Fantasy Props MegaKit](https://quaternius.com/packs/fantasypropsmegakit.html)) · [KayKit](https://kaylousberg.itch.io/) ([Dungeon](https://kaylousberg.itch.io/kaykit-dungeon-pack), [Forest](https://kaylousberg.itch.io/kaykit-forest), [Animations](https://kaylousberg.itch.io/kaykit-character-animations)) · [Poly Pizza](https://poly.pizza/) · [Poly Haven](https://polyhaven.com/) + [license](https://polyhaven.com/license) + [FAQ](https://docs.polyhaven.com/en/faq) · [ambientCG](https://ambientcg.com/) · [Sketchfab→Fab migration](https://sketchfab.com/blogs/community/fab-publishing-portal-open-for-sketchfab-migration/) + [Fab licenses](https://forums.unrealengine.com/t/non-commercial-models/2027604) + [Fab docs](https://dev.epicgames.com/documentation/en-us/fab/migrating-assets-to-fab) + [80.lv](https://80.lv/articles/historians-are-concerned-about-epic-games-sketchfab-to-fab-migration) · [Synty EULA](https://syntystore.com/pages/standard-subscription-licence) + [One-Time Licence 2026](https://syntystore.com/pages/one-time-purchase-licence-3-june-2026) + [FAQ](https://syntystore.com/community/faq) · [Cinevva 2026 comparison](https://app.cinevva.com/guides/sketchfab-polyhaven-kenney) · [AssetHoard 2026](https://assethoard.com/blog/where-to-find-free-game-assets-2026)

**Generated assets:** [Blockade Labs](https://blockadelabs.com/) + [plans](https://skybox.blockadelabs.com/plans) + [review 2026](https://www.tooljunction.io/ai-tools/skybox-ai) · splats: [Swyvl viewers 2026](https://swyvl.io/blog/best-gaussian-splat-viewers/), [luma-web](https://github.com/lumalabs/luma-web-examples/blob/main/README.md) + [perf issue](https://github.com/lumalabs/luma-web-examples/issues/15), [@speridlabs/visus](https://registry.npmjs.org/%40speridlabs%2Fvisus)

**Optimization:** [glTF-Transform](https://gltf-transform.dev/) + [GitHub](https://github.com/donmccurdy/glTF-Transform/) · [gltfjsx](https://github.com/pmndrs/gltfjsx) · [Unity export guidelines 2026](https://docs.unity.com/en-us/asset-transformer-sdk/2026.1/manual/sdktips/export-guidelines) · [OptimizeGLB 2026](https://optimizeglb.com/blog/how-to-achieve-99-percent-glb-compression) · [Axel Cuevas](https://www.axl-devhub.me/en/blog/optimizing-3d-models)

**Art direction / r3f:** [drei Environment](https://github.com/pmndrs/drei/blob/master/docs/staging/environment.mdx) · [Lightformer](https://drei.docs.pmnd.rs/staging/lightformer) · [AccumulativeShadows](https://drei.docs.pmnd.rs/staging/accumulative-shadows) · [ContactShadows](https://drei.docs.pmnd.rs/staging/contact-shadows) · [BakeShadows](https://drei.docs.pmnd.rs/performances/bake-shadows) · [drei shadows overview](https://deepwiki.com/pmndrs/drei/4.2-shadows) · [MeshToonMaterial](https://threejs.org/docs/pages/MeshToonMaterial.html) · [react-postprocessing](https://github.com/pmndrs/react-postprocessing/blob/master/README.md) + [postprocessing](https://github.com/pmndrs/postprocessing) · [tone-mapping-in-post](https://discourse.threejs.org/t/r3-drei-difference-in-tonemapping-exposure-environment-intensity-from-9-78-2-to-9-88-3/57223) · [effects reference](https://unpkg.com/10x-development-team@3.2.0/plugin/knowledge/libraries/three-postprocessing.md)

**Performance / instancing:** [drei Instances](https://drei.docs.pmnd.rs/performances/instances) · [InstancedMesh](https://threejs.org/docs/pages/InstancedMesh.html) · [r3f instancing issue](https://github.com/pmndrs/react-three-fiber/issues/3306) · [Authon r3f perf](https://blog.authon.dev/why-your-react-three-fiber-gallery-drops-to-5-fps-and-how-to-fix-it) · [PerformanceMonitor](https://drei.docs.pmnd.rs/performances/performance-monitor) · [AdaptiveDpr](https://drei.docs.pmnd.rs/performances/adaptive-dpr) · [r3f scaling-performance](https://github.com/pmndrs/react-three-fiber/blob/master/docs/advanced/scaling-performance.mdx) · [RapidMade iGPU](https://rapidmade.com/webgl-three-js-cad-rendering-optimization/) · [IGC 60fps](https://intelligentgraphicandcode.com/development/threejs-interfaces/performance) · [Abratabia](https://www.abratabia.com/threejs/performance.php) · [Simplified Media](https://simplified.media/guides/webgl-threejs) · [Utsubo 100 tips 2026](https://www.utsubo.com/blog/threejs-best-practices-100-tips) · [b-open-io r3f reference](https://github.com/b-open-io/prompts/blob/master/skills/threejs-r3f/references/performance.md)

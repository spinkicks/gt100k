"use client";

import { PALETTE, type QualityTier, type Scene3DView } from "@gt100k/interest-lab-view";
import {
  Bloom,
  BrightnessContrast,
  EffectComposer,
  HueSaturation,
  N8AO,
  ToneMapping,
  Vignette,
} from "@react-three/postprocessing";
import { BlendFunction, ToneMappingMode } from "postprocessing";

export interface WorldPostFXProps {
  scene3d: Scene3DView;
  quality: QualityTier;
}

// Cinematic post-processing grade for the "Curiosity Quest World" dusk atelier (see D-VP1 / D-VP4).
// This is game-feel non-negotiable #4 — "~half of AAA feel." It only mounts on the full tier
// (`quality.postprocessing`); the lite/board tiers keep the direct ACES render for their perf budget.
//
// Chain order is deliberate. `<EffectComposer>` forces `gl.toneMapping = NoToneMapping` while mounted
// and renders the scene linearly into an HDR HalfFloat buffer, so we must re-apply the tone curve here:
//   N8AO (linear, seats objects) → Bloom (HDR) → warm palette grade → ACES tone-map → Vignette.
// ACES_FILMIC matches the renderer's tone mapping used on the non-composer tiers, keeping the look
// cohesive across quality steps.
export function WorldPostFX({ scene3d, quality }: WorldPostFXProps) {
  if (!quality.postprocessing) return null;

  return (
    <EffectComposer multisampling={4}>
      {/* Contact ambient occlusion — the last "floaty CG" tell. Seats each quest marker into its
          island top, the island cap into its underside cone, and the rim torus into the deck. N8AO
          derives normals from depth (no separate normal pass), so it's robust to tune. The AO color
          is tinted to the deep plum night (not black) so the creases stay cohesive with the
          `<ContactShadows>` grounding rather than reading as gray dirt. Half-res + medium quality
          keeps the full-tier budget; it auto-drops with the composer on the lite/board tiers. */}
      <N8AO
        aoRadius={1.1}
        distanceFalloff={1}
        intensity={1.25}
        quality="medium"
        color={PALETTE.nightSunk}
        halfRes
        depthAwareUpsampling
      />
      {/* Soft dusk glow — feeds on the emissive quest markers + additive welcome halos. A selective
          luminance threshold keeps the plum night matte and only lets the warm cores bloom. */}
      {quality.bloom ? (
        <Bloom
          intensity={scene3d.bloomPeak * 0.55}
          luminanceThreshold={0.6}
          luminanceSmoothing={0.3}
          radius={0.72}
          mipmapBlur
        />
      ) : (
        <></>
      )}
      {/* Grade toward the committed warm palette: a touch more saturation in the spark/beacon
          highlights, a hair of contrast to deepen the plum shadows. Restraint over a heavy LUT. */}
      <HueSaturation hue={0} saturation={0.08} />
      <BrightnessContrast brightness={-0.015} contrast={0.07} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      {/* Draw the eye to the floating islands and seat the world in its dusk. */}
      <Vignette offset={0.32} darkness={0.55} blendFunction={BlendFunction.NORMAL} />
    </EffectComposer>
  );
}

/**
 * Image-based lighting with graceful fallback. If a CC0 HDRI has been fetched to
 * /assets/env/dusk.hdr (see scripts/fetch-assets.mjs), it drives real reflections + ambient bounce.
 * If it's absent (fresh clone / CI — assets are gitignored) or fails to load, we fall back to a
 * procedural equirect gradient → PMREM, so the scene always lights itself with no binary/network.
 *
 * The HDRI branch is isolated in its own Suspense + error boundary so it never blocks the rest of
 * the scene from becoming `ready` (the harness gate) and a missing file degrades silently.
 */
import { Environment } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { Component, type ReactNode, Suspense, useEffect } from "react";
import * as THREE from "three";
import { useAssetReady } from "../core/useAssetReady";

const HDRI_URL = "/assets/env/dusk.hdr";

function equirectCanvas(): HTMLCanvasElement {
  const w = 128;
  const h = 64;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  const v = ctx.createLinearGradient(0, 0, 0, h);
  v.addColorStop(0, "#0c0e14");
  v.addColorStop(0.5, "#3a2f2a");
  v.addColorStop(1, "#17110c");
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, w, h);
  const warm = ctx.createRadialGradient(w * 0.3, h * 0.62, 2, w * 0.3, h * 0.62, w * 0.28);
  warm.addColorStop(0, "rgba(255,150,70,0.85)");
  warm.addColorStop(1, "rgba(255,150,70,0)");
  ctx.fillStyle = warm;
  ctx.fillRect(0, 0, w, h);
  const cool = ctx.createRadialGradient(w * 0.78, h * 0.4, 2, w * 0.78, h * 0.4, w * 0.24);
  cool.addColorStop(0, "rgba(120,150,210,0.7)");
  cool.addColorStop(1, "rgba(120,150,210,0)");
  ctx.fillStyle = cool;
  ctx.fillRect(0, 0, w, h);
  return c;
}

/** Procedural PMREM environment — the always-available fallback. */
function ProceduralEnv(): null {
  const { gl, scene } = useThree();
  useEffect(() => {
    const tex = new THREE.CanvasTexture(equirectCanvas());
    tex.mapping = THREE.EquirectangularReflectionMapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    const pmrem = new THREE.PMREMGenerator(gl);
    pmrem.compileEquirectangularShader();
    const env = pmrem.fromEquirectangular(tex).texture;
    scene.environment = env;
    tex.dispose();
    pmrem.dispose();
    return () => {
      if (scene.environment === env) scene.environment = null;
      env.dispose();
    };
  }, [gl, scene]);
  return null;
}

/** Renders the procedural fallback if the HDRI branch throws (e.g. the file is absent / 404s). */
class EnvBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }
  render(): ReactNode {
    return this.state.failed ? <ProceduralEnv /> : this.props.children;
  }
}

export function EnvLight(): JSX.Element {
  // Mount the HDRI only once confirmed present (else the dev server's index.html fallback would
  // crash RGBELoader). Procedural env otherwise.
  const hasHdri = useAssetReady(HDRI_URL);
  if (!hasHdri) return <ProceduralEnv />;
  return (
    <EnvBoundary>
      <Suspense fallback={<ProceduralEnv />}>
        <Environment files={HDRI_URL} />
      </Suspense>
    </EnvBoundary>
  );
}

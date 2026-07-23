/**
 * Procedural image-based lighting. Builds a tiny equirectangular dusk-interior gradient, runs it
 * through a PMREM generator, and sets `scene.environment` — so every standard material picks up
 * ambient bounce + soft reflections (the "IBL" realism lever) with no binary HDR asset and no
 * network fetch. Static → deterministic (safe for the freeze/determinism gate).
 */
import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import * as THREE from "three";

function equirectCanvas(): HTMLCanvasElement {
  const w = 128;
  const h = 64;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  // vertical gradient: dark ceiling → warm mid → deep floor
  const v = ctx.createLinearGradient(0, 0, 0, h);
  v.addColorStop(0, "#0c0e14");
  v.addColorStop(0.5, "#3a2f2a");
  v.addColorStop(1, "#17110c");
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, w, h);
  // warm glow lobe (fire side) and cool lobe (window side) so reflections read warm/cool
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

export function EnvLight(): null {
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

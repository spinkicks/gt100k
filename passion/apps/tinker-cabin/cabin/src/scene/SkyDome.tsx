/**
 * The backdrop seen through the window: a real CC0 photographic mountain panorama (Poly Haven
 * `champagne_castle_1`, tonemapped JPG) mapped onto a big inside-out sphere. Falls back to the
 * procedural sky gradient when the panorama isn't fetched (offline/CI). Unlit + fog-exempt.
 */
import { useTexture } from "@react-three/drei";
import { Component, type ReactNode, Suspense, useMemo } from "react";
import * as THREE from "three";
import { skyGradientTexture } from "./textures";

const VISTA_URL = "/assets/env/vista.jpg";
const ROT = Math.PI * 0.72; // aim the dramatic peaks toward the window (+X)

function VistaDome(): JSX.Element {
  const tex = useTexture(VISTA_URL);
  useMemo(() => {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.repeat.x = -1; // un-mirror the equirect image on the inside-facing sphere
    tex.needsUpdate = true;
  }, [tex]);
  return (
    <mesh scale={90} rotation={[0, ROT, 0]}>
      <sphereGeometry args={[1, 48, 24]} />
      <meshBasicMaterial map={tex} side={THREE.BackSide} toneMapped={false} fog={false} />
    </mesh>
  );
}

function CanvasDome(): JSX.Element {
  const sky = useMemo(() => skyGradientTexture(), []);
  return (
    <mesh scale={80}>
      <sphereGeometry args={[1, 32, 16]} />
      <meshBasicMaterial map={sky} side={THREE.BackSide} toneMapped fog={false} />
    </mesh>
  );
}

class DomeBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }
  render(): ReactNode {
    return this.state.failed ? <CanvasDome /> : this.props.children;
  }
}

export function SkyDome(): JSX.Element {
  return (
    <DomeBoundary>
      <Suspense fallback={<CanvasDome />}>
        <VistaDome />
      </Suspense>
    </DomeBoundary>
  );
}

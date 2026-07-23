/**
 * Bridges the live render loop into `window.__cabin.stats` and flips `ready` for the harness.
 *
 * `ready` is gated on ALL async loaders (GLB / HDRI / textures via drei's loading manager) having
 * settled — otherwise a screenshot could be taken mid-load and differ run-to-run (breaks the
 * determinism gate). We wait for the loader manager to go idle for a few frames (or a safety
 * timeout for the all-procedural case where no loader ever runs).
 */
import { useProgress } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import { setReady, updateStats } from "./hook";

interface PerfMemory {
  usedJSHeapSize?: number;
}

export function StatsBridge(): null {
  const { gl } = useThree();
  const { active } = useProgress();
  const fps = useRef(60);
  const ready = useRef(false);
  const idleFrames = useRef(0);
  const totalFrames = useRef(0);

  useFrame((_, dt) => {
    if (dt > 0) fps.current = fps.current * 0.9 + (1 / dt) * 0.1;
    const info = gl.info;
    const mem = (performance as Performance & { memory?: PerfMemory }).memory;
    updateStats({
      fps: Math.round(fps.current),
      drawCalls: info.render.calls,
      triangles: info.render.triangles,
      memMB: mem?.usedJSHeapSize ? Math.round(mem.usedJSHeapSize / 1e6) : 0,
    });

    // gate ready on loaders settling: idle for ≥8 consecutive frames, or a 6s safety net.
    totalFrames.current++;
    idleFrames.current = active ? 0 : idleFrames.current + 1;
    if (!ready.current && (idleFrames.current >= 8 || totalFrames.current > 360)) {
      ready.current = true;
      setReady();
    }
  });

  return null;
}

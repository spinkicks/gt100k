/**
 * Bridges the live render loop into `window.__cabin.stats` and flips `ready` after the first frame.
 * fps is an EMA so the harness reads a stable number; draw calls / triangles come from gl.info.
 * `fireLit` / `catVisible` are set by the Fire / Cat components on mount (semantic gates).
 */
import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import { setReady, updateStats } from "./hook";

interface PerfMemory {
  usedJSHeapSize?: number;
}

export function StatsBridge(): null {
  const { gl } = useThree();
  const fps = useRef(60);
  const started = useRef(false);

  useFrame((_, dt) => {
    if (dt > 0) {
      const inst = 1 / dt;
      fps.current = fps.current * 0.9 + inst * 0.1;
    }
    const info = gl.info;
    const mem = (performance as Performance & { memory?: PerfMemory }).memory;
    updateStats({
      fps: Math.round(fps.current),
      drawCalls: info.render.calls,
      triangles: info.render.triangles,
      memMB: mem?.usedJSHeapSize ? Math.round(mem.usedJSHeapSize / 1e6) : 0,
    });
    if (!started.current) {
      started.current = true;
      // one frame has rendered — the scene is up.
      setReady();
    }
  });

  return null;
}

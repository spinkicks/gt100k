"use client";

import type { InitialArenaView, QualityTier } from "@gt100k/arena-world";
import { Canvas, type RootState, useThree } from "@react-three/fiber";
import { type ReactNode, useEffect } from "react";
import { ACESFilmicToneMapping, ColorManagement, SRGBColorSpace } from "three";
import type { ArenaEventBus } from "./eventBus";

export const CONTEXT_RECOVERY_GRACE_MS = 2_000;

type FrameLoop = "always" | "demand";
type ContextFailureReason = "context-loss" | "context-creation-error";

interface ContextLifecycleControls {
  pause(): void;
  resume(): void;
  fallback(reason: ContextFailureReason): void;
}

export function bindWebGlContextLifecycle(
  target: EventTarget,
  controls: ContextLifecycleControls,
  recoveryGraceMs = CONTEXT_RECOVERY_GRACE_MS,
): () => void {
  let recoveryTimer: ReturnType<typeof setTimeout> | undefined;

  const clearRecoveryTimer = () => {
    if (recoveryTimer === undefined) return;
    clearTimeout(recoveryTimer);
    recoveryTimer = undefined;
  };
  const handleContextLost: EventListener = (event) => {
    event.preventDefault();
    controls.pause();
    clearRecoveryTimer();
    recoveryTimer = setTimeout(() => {
      recoveryTimer = undefined;
      controls.fallback("context-loss");
    }, recoveryGraceMs);
  };
  const handleContextRestored: EventListener = () => {
    clearRecoveryTimer();
    controls.resume();
  };
  const handleContextCreationError: EventListener = (event) => {
    event.preventDefault();
    clearRecoveryTimer();
    controls.pause();
    controls.fallback("context-creation-error");
  };

  target.addEventListener("webglcontextlost", handleContextLost);
  target.addEventListener("webglcontextrestored", handleContextRestored);
  target.addEventListener("webglcontextcreationerror", handleContextCreationError);

  return () => {
    clearRecoveryTimer();
    target.removeEventListener("webglcontextlost", handleContextLost);
    target.removeEventListener("webglcontextrestored", handleContextRestored);
    target.removeEventListener("webglcontextcreationerror", handleContextCreationError);
  };
}

interface ContextLifecycleProps {
  eventBus: ArenaEventBus;
  frameLoop: FrameLoop;
  qualityTier: QualityTier;
  onFallback?: (reason: ContextFailureReason) => void;
}

function ContextLifecycle({ eventBus, frameLoop, qualityTier, onFallback }: ContextLifecycleProps) {
  const gl = useThree((state) => state.gl);
  const invalidate = useThree((state) => state.invalidate);
  const setFrameloop = useThree((state) => state.setFrameloop);

  useEffect(
    () =>
      bindWebGlContextLifecycle(gl.domElement, {
        pause: () => setFrameloop("never"),
        resume: () => {
          setFrameloop(frameLoop);
          invalidate();
        },
        fallback: (reason) => {
          eventBus.emit("tier-degraded", {
            from: qualityTier,
            to: "D",
            reason: "context-loss",
          });
          onFallback?.(reason);
        },
      }),
    [eventBus, frameLoop, gl.domElement, invalidate, onFallback, qualityTier, setFrameloop],
  );

  return null;
}

function configureRenderer({ gl }: RootState): void {
  ColorManagement.enabled = true;
  gl.toneMapping = ACESFilmicToneMapping;
  gl.outputColorSpace = SRGBColorSpace;
}

export interface ArenaCanvasProps {
  view: InitialArenaView;
  eventBus: ArenaEventBus;
  children?: ReactNode;
  onFallback?: (reason: ContextFailureReason) => void;
}

export default function ArenaCanvas({ view, eventBus, children, onFallback }: ArenaCanvasProps) {
  const { qualityBudget, qualityTier } = view.presentation;
  const dprMax = qualityBudget.dprMax;
  const frameLoop: FrameLoop = qualityBudget.ambientMotion ? "always" : "demand";

  if (!qualityBudget.canvas || dprMax === null) return null;

  return (
    <Canvas
      aria-hidden="true"
      dpr={[1, dprMax]}
      frameloop={frameLoop}
      gl={{ alpha: false, antialias: true, powerPreference: "high-performance" }}
      onCreated={configureRenderer}
      shadows={qualityBudget.shadows !== "off"}
      tabIndex={-1}
    >
      <ContextLifecycle
        eventBus={eventBus}
        frameLoop={frameLoop}
        onFallback={onFallback}
        qualityTier={qualityTier}
      />
      {children}
    </Canvas>
  );
}

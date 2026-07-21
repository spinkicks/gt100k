"use client";

import { type InitialArenaView, type QualityTier, nextLowerTier } from "@gt100k/arena-world";
import { Canvas, type RootState, useFrame, useThree } from "@react-three/fiber";
import { type ReactNode, useEffect, useRef } from "react";
import { ACESFilmicToneMapping, ColorManagement, type Group, SRGBColorSpace } from "three";
import Avatar from "./Avatar";
import BaseCamp, { BASE_CAMP_TARGET } from "./BaseCamp";
import CameraRig from "./CameraRig";
import Fx from "./Fx";
import LightingRig from "./LightingRig";
import PostFx from "./PostFx";
import SeaAndSky from "./SeaAndSky";
import WorldRoot from "./WorldRoot";
import type { ArenaEventBus } from "./eventBus";
import type { SequencedArenaFeedback } from "./feedback";
import { buildRendererQualityPlan } from "./rendererQuality";

export const CONTEXT_RECOVERY_GRACE_MS = 2_000;
export const FRAME_BUDGET_THRESHOLD_MS = 18;
export const FRAME_BUDGET_WINDOW_SIZE = 90;

type FrameLoop = "always" | "demand";
type ContextFailureReason = "context-loss" | "context-creation-error";

interface ContextLifecycleControls {
  pause(): void;
  resume(): void;
  fallback(reason: ContextFailureReason): void;
}

export interface FrameBudgetSampler {
  sample(frameTimeMs: number): QualityTier | null;
  reset(tier: QualityTier): void;
}

export function createFrameBudgetMonitor(initialTier: QualityTier): FrameBudgetSampler {
  const samples = new Array<number>(FRAME_BUDGET_WINDOW_SIZE).fill(0);
  let tier = initialTier;
  let count = 0;
  let cursor = 0;
  let totalMs = 0;
  let degraded = false;

  const reset = (nextTier: QualityTier) => {
    samples.fill(0);
    tier = nextTier;
    count = 0;
    cursor = 0;
    totalMs = 0;
    degraded = false;
  };

  return {
    sample(frameTimeMs) {
      if (degraded || !Number.isFinite(frameTimeMs) || frameTimeMs < 0) return null;

      if (count === FRAME_BUDGET_WINDOW_SIZE) {
        totalMs -= samples[cursor] ?? 0;
      } else {
        count += 1;
      }

      samples[cursor] = frameTimeMs;
      totalMs += frameTimeMs;
      cursor = (cursor + 1) % FRAME_BUDGET_WINDOW_SIZE;

      if (count < FRAME_BUDGET_WINDOW_SIZE || totalMs / count <= FRAME_BUDGET_THRESHOLD_MS) {
        return null;
      }

      degraded = true;
      const nextTier = nextLowerTier(tier);
      return nextTier === tier ? null : nextTier;
    },
    reset,
  };
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

interface FrameBudgetMonitorProps {
  eventBus: ArenaEventBus;
  qualityTier: QualityTier;
}

function FrameBudgetMonitor({ eventBus, qualityTier }: FrameBudgetMonitorProps) {
  const monitor = useRef<FrameBudgetSampler | null>(null);
  const monitoredTier = useRef(qualityTier);

  if (monitor.current === null) monitor.current = createFrameBudgetMonitor(qualityTier);
  if (monitoredTier.current !== qualityTier) {
    monitor.current.reset(qualityTier);
    monitoredTier.current = qualityTier;
  }

  useFrame((_, delta) => {
    const to = monitor.current?.sample(delta * 1_000);
    if (!to) return;

    eventBus.emit("tier-degraded", {
      from: qualityTier,
      to,
      reason: "frame-budget",
    });
  });

  return null;
}

function configureRenderer({ gl }: RootState): void {
  configureCanvasAccessibility(gl.domElement);
  ColorManagement.enabled = true;
  gl.toneMapping = ACESFilmicToneMapping;
  gl.outputColorSpace = SRGBColorSpace;
}

export function configureCanvasAccessibility(
  canvas: Pick<HTMLCanvasElement, "setAttribute" | "tabIndex">,
): void {
  canvas.setAttribute("aria-hidden", "true");
  canvas.tabIndex = -1;
}

export interface ArenaCanvasProps {
  view: InitialArenaView;
  eventBus: ArenaEventBus;
  children?: ReactNode;
  feedback?: SequencedArenaFeedback;
  targetNodeId?: string;
  focusedBaseFeature?: string;
  homeFocused?: boolean;
  onFallback?: (reason: ContextFailureReason) => void;
}

export default function ArenaCanvas({
  view,
  eventBus,
  children,
  feedback,
  targetNodeId,
  focusedBaseFeature,
  homeFocused = true,
  onFallback,
}: ArenaCanvasProps) {
  const { qualityBudget, qualityTier } = view.presentation;
  const focusedNode = view.presentation.worldTransform.nodes.find(
    ({ nodeId }) => nodeId === targetNodeId,
  );
  const cameraTarget = homeFocused
    ? { x: BASE_CAMP_TARGET[0], y: BASE_CAMP_TARGET[1], z: BASE_CAMP_TARGET[2] }
    : focusedNode
      ? { x: focusedNode.x, y: focusedNode.y, z: focusedNode.z }
      : { ...view.presentation.camera.restTarget };
  const qualityPlan = buildRendererQualityPlan(view, cameraTarget);
  const worldRootProps = {
    cameraTarget,
    dynamicNodeLightIds: qualityPlan.dynamicNodeLightIds,
    staticMotion: qualityPlan.staticMotion,
  };
  const dprMax = qualityPlan.dpr?.[1];
  const frameLoop: FrameLoop = qualityPlan.frameLoop;
  const avatarRef = useRef<Group>(null);

  if (!qualityPlan.canvas || dprMax === undefined) return null;

  return (
    <Canvas
      aria-hidden="true"
      dpr={[1, dprMax]}
      frameloop={frameLoop}
      gl={{ alpha: false, antialias: true, powerPreference: "high-performance" }}
      onCreated={configureRenderer}
      shadows={qualityPlan.shadows}
      tabIndex={-1}
    >
      <ContextLifecycle
        eventBus={eventBus}
        frameLoop={frameLoop}
        onFallback={onFallback}
        qualityTier={qualityTier}
      />
      <FrameBudgetMonitor eventBus={eventBus} qualityTier={qualityTier} />
      {children ?? (
        <>
          <LightingRig lighting={view.presentation.lighting} qualityBudget={qualityBudget} />
          <SeaAndSky
            palette={view.presentation.palette}
            qualityBudget={qualityBudget}
            reducedMotion={view.flags.reducedMotion}
            water={view.presentation.water}
          />
          <WorldRoot view={view} {...worldRootProps} />
          <BaseCamp
            dynamicCampfireLight={qualityPlan.dynamicCampfireLight}
            focusedFeature={focusedBaseFeature}
            onFocusFeature={(feature) => eventBus.emit("focus-base-feature", { feature })}
            staticMotion={qualityPlan.staticMotion}
            view={view}
          />
          <Avatar
            avatarRef={avatarRef}
            staticMotion={qualityPlan.staticMotion}
            targetNodeId={targetNodeId}
            view={view}
          />
          <CameraRig
            followRef={homeFocused ? undefined : avatarRef}
            homeFocused={homeFocused}
            staticMotion={qualityPlan.staticMotion}
            target={homeFocused ? BASE_CAMP_TARGET : undefined}
            view={view}
          />
          <Fx
            eventBus={eventBus}
            feedback={feedback}
            staticMotion={qualityPlan.staticMotion}
            targetNodeId={targetNodeId}
            view={view}
          />
          <PostFx feedback={feedback} view={view} />
        </>
      )}
    </Canvas>
  );
}

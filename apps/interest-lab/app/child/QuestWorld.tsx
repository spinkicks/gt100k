"use client";

import type { InterestLabView } from "@gt100k/interest-lab-view";
import { PerformanceMonitor } from "@react-three/drei";
import { type ReactElement, useCallback, useEffect, useMemo, useReducer, useState } from "react";
import type { Texture } from "three";
import { QuestLedger, updatePickedProbeIds } from "./QuestLedger";
import { WorldWayfinding } from "./WorldWayfinding";
import { Beacon } from "./world3d/Beacon";
import { CameraRig } from "./world3d/CameraRig";
import { Island } from "./world3d/Island";
import { IslandBanner } from "./world3d/IslandBanner";
import { Motes } from "./world3d/Motes";
import { World3D } from "./world3d/World3D";
import { World3DBoundary } from "./world3d/World3DBoundary";
import { resolveIslandBannerLabel } from "./world3d/beacon";
import { createGlowTexture } from "./world3d/glow-texture";

const EMPTY_PICKED_PROBE_IDS: readonly string[] = [];
export const PERFORMANCE_FPS_FLOOR = 55;

export interface BuildQuestWorldSceneGraphOptions {
  view: InterestLabView;
  focusedProbeId: string | null;
  pickedProbeIds: ReadonlySet<string>;
  haloTexture: Texture;
  onPick?: (probeId: string) => void;
  onPerformanceDecline?: () => void;
}

export function buildQuestWorldSceneGraph({
  view,
  focusedProbeId,
  pickedProbeIds,
  haloTexture,
  onPick,
  onPerformanceDecline,
}: Readonly<BuildQuestWorldSceneGraphOptions>): ReactElement[] {
  const welcomeProbeId = view.scene.islands
    .flatMap(({ markers }) => markers)
    .find(({ returnState }) => returnState === "voluntary-return")?.probeId;
  return [
    <PerformanceMonitor
      key="performance-monitor"
      bounds={(refreshRate) => [PERFORMANCE_FPS_FLOOR, refreshRate]}
      onDecline={onPerformanceDecline}
    />,
    <Motes key="motes" quality={view.scene.quality} />,
    ...view.scene.islands.map((island) => (
      <Island
        key={island.domain}
        island={island}
        quality={view.scene.quality}
        scene3d={view.scene.scene3d}
        haloTexture={haloTexture}
        focusedProbeId={focusedProbeId}
        pickedProbeIds={pickedProbeIds}
        onPick={onPick}
      />
    )),
    <Beacon
      key="beacon"
      scene3d={view.scene.scene3d}
      haloTexture={haloTexture}
      pickedCount={pickedProbeIds.size}
    />,
    <CameraRig
      key="camera"
      scene={view.scene}
      focusedProbeId={focusedProbeId}
      welcomeProbeId={welcomeProbeId ?? null}
      reducedMotion={view.flags.reducedMotion}
      worldCameraMode={view.probePicker.staging.worldCameraMode}
    />,
  ];
}

interface QuestWorldSceneProps {
  view: InterestLabView;
  focusedProbeId: string | null;
  pickedProbeIds: ReadonlySet<string>;
  onPick?: (probeId: string) => void;
  onPerformanceDecline?: () => void;
}

function QuestWorldScene({
  view,
  focusedProbeId,
  pickedProbeIds,
  onPick,
  onPerformanceDecline,
}: QuestWorldSceneProps) {
  const haloTexture = useMemo(() => createGlowTexture(() => document.createElement("canvas")), []);
  useEffect(() => () => haloTexture.dispose(), [haloTexture]);

  return buildQuestWorldSceneGraph({
    view,
    focusedProbeId,
    pickedProbeIds,
    haloTexture,
    onPick,
    onPerformanceDecline,
  });
}

export interface QuestWorldProps {
  view: InterestLabView;
  onContextLost?: () => void;
  onPerformanceDecline?: () => void;
}

export function QuestWorld({ view, onContextLost, onPerformanceDecline }: QuestWorldProps) {
  // Single source of truth for picks + focus, shared by the 3D orbs and the DOM ledger
  // so clicking an island orb toggles the exact same tray as clicking its card ("one truth").
  const [pickedProbeIds, dispatch] = useReducer(
    updatePickedProbeIds,
    EMPTY_PICKED_PROBE_IDS as string[],
  );
  const [focusedProbeId, setFocusedProbeId] = useState<string | null>(null);
  const [worldUnavailable, setWorldUnavailable] = useState(false);
  const pickedProbeIdSet = useMemo<ReadonlySet<string>>(
    () => new Set(pickedProbeIds),
    [pickedProbeIds],
  );

  const retireWorld = useCallback(() => {
    setWorldUnavailable(true);
    onContextLost?.();
  }, [onContextLost]);
  const togglePick = useCallback((probeId: string) => {
    dispatch({ type: "pick", probeId });
  }, []);
  const focus = useCallback((probeId: string) => setFocusedProbeId(probeId), []);
  // The persistent escape hatch: drift back out to the whole archipelago (the CameraRig eases
  // home whenever nothing is focused), so a child who has zoomed into one island always has a
  // way out — Apple's "how do I get back?" answer.
  const returnToArchipelago = useCallback(() => setFocusedProbeId(null), []);
  const returnQuest = useCallback((probeId: string) => {
    dispatch({ type: "return", probeId });
  }, []);
  // A 3D orb click focuses its island AND drops the quest in the tray — a real payoff for
  // reaching out and touching the hero object, wired to the same reducer as the card.
  const pickFromWorld = useCallback((probeId: string) => {
    setFocusedProbeId(probeId);
    dispatch({ type: "pick", probeId });
  }, []);

  const renderTier = worldUnavailable ? "board-2d" : view.scene.renderTier;
  const renders3D = renderTier !== "board-2d";
  // Name the island the child is visiting — arrival gains a legible, announced label (P0.4).
  const bannerLabel = useMemo(
    () => resolveIslandBannerLabel(view.scene.islands, focusedProbeId),
    [view.scene.islands, focusedProbeId],
  );

  return (
    <section
      className={`quest-world${renders3D ? " quest-world--3d" : " quest-world--board"}`}
      data-quest-world-tier={renderTier}
      data-focused-probe={focusedProbeId ?? undefined}
      data-picked-count={pickedProbeIdSet.size}
      aria-label="Curiosity Quest World"
    >
      {renders3D ? (
        <div className="quest-world-stage">
          <World3DBoundary
            onError={retireWorld}
            fallback={<div className="quest-world-fallback" aria-hidden="true" />}
          >
            <World3D scene={view.scene} onContextLost={retireWorld}>
              <QuestWorldScene
                view={view}
                focusedProbeId={focusedProbeId}
                pickedProbeIds={pickedProbeIdSet}
                onPick={pickFromWorld}
                onPerformanceDecline={onPerformanceDecline}
              />
            </World3D>
          </World3DBoundary>
          {bannerLabel ? <IslandBanner label={bannerLabel} /> : null}
          <WorldWayfinding
            islands={view.scene.islands}
            focusedProbeId={focusedProbeId}
            pickedCount={pickedProbeIdSet.size}
            onOverview={returnToArchipelago}
          />
          <p className="quest-world-instruction">
            Tap an island to visit it, or choose a quest below.
          </p>
        </div>
      ) : null}

      <div className="quest-ledger-shell">
        <QuestLedger
          picker={view.probePicker}
          pickedProbeIds={pickedProbeIds}
          focusedProbeId={focusedProbeId}
          onTogglePick={togglePick}
          onReturn={returnQuest}
          onFocus={focus}
        />
      </div>
    </section>
  );
}

"use client";

import type { ChildInterestLabView } from "@gt100k/interest-lab-view";
import { type ReactElement, useCallback, useEffect, useMemo, useState } from "react";
import type { Texture } from "three";
import { QuestLedger } from "./QuestLedger";
import { CameraRig } from "./world3d/CameraRig";
import { Island } from "./world3d/Island";
import { Motes } from "./world3d/Motes";
import { World3D } from "./world3d/World3D";
import { createGlowTexture } from "./world3d/glow-texture";

const EMPTY_PICKED_PROBE_IDS: ReadonlySet<string> = new Set();

export interface BuildQuestWorldSceneGraphOptions {
  view: ChildInterestLabView;
  focusedProbeId: string | null;
  pickedProbeIds: ReadonlySet<string>;
  haloTexture: Texture;
}

export function buildQuestWorldSceneGraph({
  view,
  focusedProbeId,
  pickedProbeIds,
  haloTexture,
}: Readonly<BuildQuestWorldSceneGraphOptions>): ReactElement[] {
  return [
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
      />
    )),
    <CameraRig
      key="camera"
      scene={view.scene}
      focusedProbeId={focusedProbeId}
      reducedMotion={view.flags.reducedMotion}
      worldCameraMode={view.probePicker.staging.worldCameraMode}
    />,
  ];
}

interface QuestWorldSceneProps {
  view: ChildInterestLabView;
  focusedProbeId: string | null;
  pickedProbeIds: ReadonlySet<string>;
}

function QuestWorldScene({ view, focusedProbeId, pickedProbeIds }: QuestWorldSceneProps) {
  const haloTexture = useMemo(() => createGlowTexture(() => document.createElement("canvas")), []);
  useEffect(() => () => haloTexture.dispose(), [haloTexture]);

  return buildQuestWorldSceneGraph({ view, focusedProbeId, pickedProbeIds, haloTexture });
}

export interface QuestWorldProps {
  view: ChildInterestLabView;
  onContextLost?: () => void;
}

export function QuestWorld({ view, onContextLost }: QuestWorldProps) {
  const [focusedProbeId, setFocusedProbeId] = useState<string | null>(null);
  const [pickedProbeIds, setPickedProbeIds] = useState<ReadonlySet<string>>(EMPTY_PICKED_PROBE_IDS);
  const [contextLost, setContextLost] = useState(false);
  const handleContextLost = useCallback(() => {
    setContextLost(true);
    onContextLost?.();
  }, [onContextLost]);
  const renderTier = contextLost ? "board-2d" : view.scene.renderTier;
  const renders3D = renderTier !== "board-2d";

  return (
    <section
      className={`quest-world${renders3D ? " quest-world--3d" : " quest-world--board"}`}
      data-quest-world-tier={renderTier}
      data-focused-probe={focusedProbeId ?? undefined}
      data-picked-count={pickedProbeIds.size}
      aria-label="Curiosity Quest World"
    >
      {renders3D ? (
        <div className="quest-world-stage">
          <World3D scene={view.scene} onContextLost={handleContextLost}>
            <QuestWorldScene
              view={view}
              focusedProbeId={focusedProbeId}
              pickedProbeIds={pickedProbeIds}
            />
          </World3D>
          <p className="quest-world-instruction">
            The quest cards below control this world. Focus a card to visit its island.
          </p>
        </div>
      ) : null}

      <div className="quest-ledger-shell">
        <QuestLedger
          picker={view.probePicker}
          onFocusQuest={setFocusedProbeId}
          onPickedProbeIdsChange={(probeIds) => setPickedProbeIds(new Set(probeIds))}
        />
      </div>
    </section>
  );
}

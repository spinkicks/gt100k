"use client";
/**
 * The render-tier stage (UE023) — owns the shared `ExplorerView` on the client and decides **which
 * tier renders**, keeping calm-2D and 3D as genuinely equal modes (FR-E03).
 *
 * Progressive enhancement: the server + first client paint show the deterministic, accessible,
 * WebGL-free **calm-2D** constellation. On mount we resolve the tier from real device caps
 * (`prefers-reduced-motion` + a WebGL probe + a manual override) via the domain `resolveRenderTier`,
 * and swap in the 3D `Cosmos3D` (loaded `ssr:false`) for `cinematic` / `standard3d`. Reduced-motion /
 * no-WebGL / save-power / gpuTier-0 stay calm-2D. A `PerformanceMonitor` decline steps the tier down
 * one rung (SC-E21); a WebGL init/context-loss error trips the boundary back to calm-2D with no lost
 * state (SC-E22). Tier changes never touch the underlying `ExplorerView` — presentation only.
 */
import {
  type ExplorerView,
  type LedgerView,
  type RenderCaps,
  type RenderTier,
  TIER_LADDER,
  resolveRenderTier,
} from "@gt100k/evidence-explorer-view";
import { AnimatePresence } from "motion/react";
import dynamic from "next/dynamic";
import {
  Component,
  type ErrorInfo,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { JSX } from "react";
import { Inspector } from "./Inspector.js";
import { TimeScrub } from "./TimeScrub.js";
import { VerifyBox } from "./VerifyBox.js";
import { Constellation2D } from "./constellation/Constellation2D.js";
import { useHud } from "./hud-state.js";
import { type SelectionOrigin, panelById } from "./inspector-model.js";
import { effectiveFocusId, revealedNodeIds } from "./scrub.js";
import { useSelection } from "./selection.js";
import type { SyntheticVerification } from "./synthetic-view.js";
import { IDLE_VISUAL, type VerifyVisualState } from "./verify-machine.js";

// 3D is client-only: it must never be server-rendered (no WebGL on the server).
const Cosmos3D = dynamic(() => import("./cosmos/Cosmos3D.js").then((m) => m.Cosmos3D), {
  ssr: false,
});

const TIER_LABEL: Record<RenderTier, string> = {
  cinematic: "Cinematic 3D",
  standard3d: "Standard 3D",
  calm2d: "Calm 2D",
};

/** Probe for a usable WebGL context (guarded — some environments throw on `getContext`). */
function detectWebGL(): boolean {
  try {
    const c = document.createElement("canvas");
    return Boolean(c.getContext("webgl2") ?? c.getContext("webgl"));
  } catch {
    return false;
  }
}

/** The lower (more conservative) of two tiers by ladder position. */
function lowerTier(a: RenderTier, b: RenderTier): RenderTier {
  const ia = TIER_LADDER.indexOf(a);
  const ib = TIER_LADDER.indexOf(b);
  return TIER_LADDER[Math.max(ia, ib)] ?? "calm2d";
}

/** One rung down the ladder (cinematic → standard3d → calm2d), clamped at the bottom. */
function stepDown(tier: RenderTier): RenderTier {
  const i = TIER_LADDER.indexOf(tier);
  return TIER_LADDER[Math.min(i + 1, TIER_LADDER.length - 1)] ?? "calm2d";
}

/** Error boundary: any failure inside the 3D subtree falls back to the calm-2D render. */
class CanvasBoundary extends Component<
  { onError: () => void; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }
  componentDidCatch(_error: Error, _info: ErrorInfo): void {
    this.props.onError();
  }
  render(): ReactNode {
    return this.state.failed ? null : this.props.children;
  }
}

export function ObservatoryStage({
  view,
  verification,
  ledger,
}: {
  view: ExplorerView;
  verification: SyntheticVerification;
  ledger: LedgerView;
}): JSX.Element {
  const [mounted, setMounted] = useState(false);
  const [device, setDevice] = useState<{
    readonly gpuTier: RenderCaps["gpuTier"];
    readonly webglAvailable: boolean;
  } | null>(null);
  const [degradedTo, setDegradedTo] = useState<RenderTier | null>(null);
  const [webglFailed, setWebglFailed] = useState(false);

  // Shared selection (UX4): the selected node drives the Inspector, the camera fly-to, and the beat
  // highlight — one concept, whether it came from the Ledger, a scrub beat, or a pointer-pick.
  const { selectedNodeId, origin, select, clear } = useSelection();

  // HUD presentation state (UX5, UE044–UE045) — filter/trace emphasis + the display toggles
  // (tier / reduced-motion / plain / captions). All presentation-only; the `ExplorerView` never changes.
  const { emphasisFor, tierOverride, setTierOverride, reducedMotion, plainMode, audioCaptions } =
    useHud();

  // Time-scrub state (§U5.4) — presentation-only: it reveals a subset of the one `ExplorerView`,
  // never mutates it. Starts fully grown so the default view matches the calm baseline.
  const [revealedCount, setRevealedCount] = useState(() => view.growthTimeline.count);

  const revealed = useMemo(() => revealedNodeIds(view, revealedCount), [view, revealedCount]);
  // The effective selection: a node hidden by scrubbing back closes the Inspector + drops the fly-to.
  const effFocus = effectiveFocusId(selectedNodeId, revealed);

  // Select a body from an in-stage affordance (canvas pick / 2D click / input link): grow the reveal
  // so the picked node is present, then select it (carrying the screen origin when there is one).
  const selectNode = useCallback(
    (id: string, pickOrigin: SelectionOrigin | null = null) => {
      const node = view.nodes.find((n) => n.id === id);
      if (node) {
        if (node.birthOrder === null) setRevealedCount(view.growthTimeline.count);
        else if (node.birthOrder >= revealedCount) setRevealedCount(node.birthOrder + 1);
      }
      select(id, pickOrigin);
    },
    [view, revealedCount, select],
  );

  const selectedNode = useMemo(
    () => (effFocus ? (view.nodes.find((n) => n.id === effFocus) ?? null) : null),
    [view.nodes, effFocus],
  );
  const selectedPanel = panelById(ledger, effFocus);
  const labelFor = useCallback(
    (id: string) => view.nodes.find((n) => n.id === id)?.label ?? id.slice(0, 12),
    [view.nodes],
  );

  // Verify-sequence visual state (§U8.8) — the light-wave / seal / byte-fracture the tiers render.
  // Presentation-only: it never mutates the `ExplorerView`. Idle by default so the baseline is unchanged.
  const [verifyVisual, setVerifyVisual] = useState<VerifyVisualState>(IDLE_VISUAL);
  const waveOrder = verification.verified.verifyWaveOrder;

  useEffect(() => {
    setDevice({
      // No reliable headless GPU-tier signal — assume capable and let PerformanceMonitor demote.
      gpuTier: 2,
      webglAvailable: detectWebGL(),
    });
    setMounted(true);
  }, []);

  const activeTier: RenderTier = useMemo(() => {
    if (!mounted || device === null || webglFailed) return "calm2d";
    // Reduced-motion (system/on/off) is owned by the HUD tri-state; it feeds the tier decision so
    // "on" forces the calm-2D equal mode just as the OS preference would.
    let tier = resolveRenderTier({
      gpuTier: device.gpuTier,
      webglAvailable: device.webglAvailable,
      prefersReducedMotion: reducedMotion,
      override: tierOverride,
    });
    if (degradedTo) tier = lowerTier(tier, degradedTo);
    return tier;
  }, [mounted, device, reducedMotion, tierOverride, degradedTo, webglFailed]);

  // An explicit tier choice (or reduced-motion change) clears an auto-degrade / WebGL-failure latch so
  // the user can climb back up the ladder.
  // biome-ignore lint/correctness/useExhaustiveDependencies: reset the degrade latch whenever the user changes the tier/reduced-motion intent.
  useEffect(() => {
    setDegradedTo(null);
    setWebglFailed(false);
  }, [tierOverride, reducedMotion]);

  const onDegrade = useCallback(() => {
    setDegradedTo((prev) => stepDown(prev ?? "cinematic"));
  }, []);

  const is3D = activeTier !== "calm2d";

  return (
    <div className="obs-stage">
      <div className="obs-stage-bar">
        <span className="obs-stage-mode" aria-live="polite">
          Rendering: <strong>{TIER_LABEL[activeTier]}</strong>
          {plainMode ? <span className="obs-stage-tag"> · plain</span> : null}
        </span>
        {/* Primary control: a plain 3D ⇄ 2D toggle. "3D" resolves the best 3D tier (auto);
            "2D" forces the calm-2D equal mode. Active choice mirrors the live `activeTier`. */}
        <div className="obs-tier-control" role="radiogroup" aria-label="Render dimension">
          <button
            type="button"
            role="radio"
            aria-checked={is3D}
            className={`obs-tier-btn${is3D ? " is-active" : ""}`}
            onClick={() => setTierOverride("auto")}
          >
            3D
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={!is3D}
            className={`obs-tier-btn${!is3D ? " is-active" : ""}`}
            onClick={() => setTierOverride("calm2d")}
          >
            2D
          </button>
        </div>
      </div>

      <div className="obs-viewport">
        {is3D ? (
          <div className="cosmos-viewport">
            <CanvasBoundary onError={() => setWebglFailed(true)}>
              <Cosmos3D
                view={view}
                tier={activeTier}
                plainMode={plainMode}
                onDegrade={onDegrade}
                revealed={revealed}
                focusNodeId={effFocus}
                waveOrder={waveOrder}
                verify={verifyVisual}
                onPick={selectNode}
              />
            </CanvasBoundary>
          </div>
        ) : (
          <Constellation2D
            view={view}
            revealed={revealed}
            focusNodeId={effFocus}
            waveOrder={waveOrder}
            verify={verifyVisual}
            emphasisFor={emphasisFor}
            plainMode={plainMode}
            onSelect={selectNode}
          />
        )}

        {/* Drill-down inspector — opens over the viewport for the selected body (UX4). */}
        <AnimatePresence>
          {selectedNode && selectedPanel ? (
            <Inspector
              key={selectedNode.id}
              panel={selectedPanel}
              node={selectedNode}
              origin={origin}
              labelFor={labelFor}
              plainMode={plainMode}
              reducedMotion={reducedMotion}
              onSelectInput={selectNode}
              onClose={clear}
            />
          ) : null}
        </AnimatePresence>
      </div>

      <TimeScrub
        view={view}
        revealedCount={revealedCount}
        onScrub={setRevealedCount}
        focusNodeId={effFocus}
        onSelectBeat={select}
      />

      <VerifyBox
        verification={verification}
        audioCaptions={audioCaptions}
        onVisualChange={setVerifyVisual}
      />
    </div>
  );
}

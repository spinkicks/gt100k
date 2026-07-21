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
  type TierOverride,
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
import { VerifyPanel } from "./VerifyPanel.js";
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

const MODES: readonly { readonly value: TierOverride; readonly label: string }[] = [
  { value: "auto", label: "Auto" },
  { value: "cinematic", label: "Cinematic" },
  { value: "standard3d", label: "Standard" },
  { value: "calm2d", label: "Calm 2D" },
];

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
  const [caps, setCaps] = useState<RenderCaps | null>(null);
  const [override, setOverride] = useState<TierOverride>("auto");
  const [degradedTo, setDegradedTo] = useState<RenderTier | null>(null);
  const [webglFailed, setWebglFailed] = useState(false);

  // Shared selection (UX4): the selected node drives the Inspector, the camera fly-to, and the beat
  // highlight — one concept, whether it came from the Ledger, a scrub beat, or a pointer-pick.
  const { selectedNodeId, origin, select, clear } = useSelection();

  // HUD filter/trace emphasis (UX5) — presentation-only per-node dim/highlight, shared with the Ledger.
  const { emphasisFor } = useHud();

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
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const read = (): void => {
      setCaps({
        // No reliable headless GPU-tier signal — assume capable and let PerformanceMonitor demote.
        gpuTier: 2,
        prefersReducedMotion: mq.matches,
        webglAvailable: detectWebGL(),
      });
    };
    read();
    setMounted(true);
    mq.addEventListener?.("change", read);
    return () => mq.removeEventListener?.("change", read);
  }, []);

  const activeTier: RenderTier = useMemo(() => {
    if (!mounted || caps === null || webglFailed) return "calm2d";
    let tier = resolveRenderTier({ ...caps, override });
    if (degradedTo) tier = lowerTier(tier, degradedTo);
    return tier;
  }, [mounted, caps, override, degradedTo, webglFailed]);

  const onDegrade = useCallback(() => {
    setDegradedTo((prev) => stepDown(prev ?? "cinematic"));
  }, []);

  const chooseMode = useCallback((mode: TierOverride) => {
    setOverride(mode);
    setDegradedTo(null); // an explicit choice clears an auto-degrade so the user can climb back up.
    setWebglFailed(false);
  }, []);

  const is3D = activeTier !== "calm2d";

  return (
    <div className="obs-stage">
      <div className="obs-stage-bar">
        <span className="obs-stage-mode" aria-live="polite">
          Rendering: <strong>{TIER_LABEL[activeTier]}</strong>
        </span>
        <fieldset className="obs-tier-control">
          <legend className="sr-only">Render tier</legend>
          {MODES.map((m) => (
            <button
              key={m.value}
              type="button"
              className={`obs-tier-btn${override === m.value ? " is-active" : ""}`}
              aria-pressed={override === m.value}
              onClick={() => chooseMode(m.value)}
            >
              {m.label}
            </button>
          ))}
        </fieldset>
      </div>

      <div className="obs-viewport">
        {is3D ? (
          <div className="cosmos-viewport">
            <CanvasBoundary onError={() => setWebglFailed(true)}>
              <Cosmos3D
                view={view}
                tier={activeTier}
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

      <VerifyPanel
        verification={verification}
        reducedMotion={caps?.prefersReducedMotion ?? false}
        onVisualChange={setVerifyVisual}
      />
    </div>
  );
}

"use client";
import type { ExplorerView } from "@gt100k/evidence-explorer-view";
/**
 * HUD presentation state (UE044, §U5.9 / UX5) — filters, trace, and search. All of it is
 * **presentation-only**: it derives `matchedNodeIds` / `tracedNodeIds` from the one `ExplorerView`
 * and NEVER mutates it (SC-E14 / `plainViewEquals`). Nested inside `SelectionProvider` so the trace
 * can anchor on the selected node when there is one, falling back to the human-owned Outcome grade
 * ("trace from Outcome"). Both the render tiers and the accessible Ledger read `emphasisFor` from
 * here, so the highlighted subset is identical everywhere (parity by construction).
 */
import type { TierOverride } from "@gt100k/evidence-explorer-view";
import { NODE_TYPES, type NodeType } from "@gt100k/evidence-graph";
import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { JSX } from "react";
import { isTraceEmphasized, matchedNodeIds, outcomeAnchorId, tracedNodeIds } from "./filters.js";
import { useSelection } from "./selection.js";

/** How a node reads under the current filters + trace: full, de-emphasised, or trace-highlighted. */
export type NodeEmphasis = "normal" | "dimmed" | "traced";

/** Reduced-motion is a tri-state control (§U5.9): follow the OS, force on, or force off. */
export type ReducedMotionMode = "system" | "on" | "off";

interface HudContextValue {
  readonly activeTypes: ReadonlySet<NodeType>;
  toggleType(t: NodeType): void;
  showAllTypes(): void;
  readonly allTypesActive: boolean;
  readonly traceActive: boolean;
  toggleTrace(): void;
  /** true when trace is on AND an anchor exists (selected node, else the Outcome grade). */
  readonly hasTrace: boolean;
  readonly anchorId: string | null;
  emphasisFor(nodeId: string): NodeEmphasis;

  // ── Display controls (UE045, §U5.9) — all presentation-only, state never changes. ──
  /** Low-spectacle rendering: no starfield / glow / grade + plain-sentence panel copy (§U12). */
  readonly plainMode: boolean;
  togglePlain(): void;
  /** Reduced-motion override: system / on / off, and the effective boolean the tiers consume. */
  readonly reducedMotionMode: ReducedMotionMode;
  setReducedMotionMode(m: ReducedMotionMode): void;
  readonly systemReducedMotion: boolean;
  readonly reducedMotion: boolean;
  /** Render-tier override (auto / cinematic / standard3d / calm2d) — surfaced in the HUD cluster. */
  readonly tierOverride: TierOverride;
  setTierOverride(t: TierOverride): void;
  /** Audio captions (muted default, §U5.10): caption ids only in the verify status live regions. */
  readonly audioCaptions: boolean;
  toggleAudioCaptions(): void;
}

const HudContext = createContext<HudContextValue | null>(null);

export function HudProvider({
  view,
  children,
}: {
  view: ExplorerView;
  children: ReactNode;
}): JSX.Element {
  const { selectedNodeId } = useSelection();
  const [activeTypes, setActiveTypes] = useState<ReadonlySet<NodeType>>(() => new Set(NODE_TYPES));
  const [traceActive, setTraceActive] = useState(false);

  // ── Display state (presentation-only). ──
  const [plainMode, setPlainMode] = useState(false);
  const [reducedMotionMode, setReducedMotionMode] = useState<ReducedMotionMode>("system");
  const [systemReducedMotion, setSystemReducedMotion] = useState(false);
  const [tierOverride, setTierOverride] = useState<TierOverride>("auto");
  const [audioCaptions, setAudioCaptions] = useState(false);

  // Track the OS reduced-motion preference for the "system" tri-state option (SSR-safe: false until
  // mount, so the server render + first paint are the calm baseline).
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const read = (): void => setSystemReducedMotion(mq.matches);
    read();
    mq.addEventListener?.("change", read);
    return () => mq.removeEventListener?.("change", read);
  }, []);

  const reducedMotion =
    reducedMotionMode === "on" ? true : reducedMotionMode === "off" ? false : systemReducedMotion;

  const toggleType = useCallback((t: NodeType) => {
    setActiveTypes((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  }, []);
  const showAllTypes = useCallback(() => setActiveTypes(new Set(NODE_TYPES)), []);
  const toggleTrace = useCallback(() => setTraceActive((v) => !v), []);
  const togglePlain = useCallback(() => setPlainMode((v) => !v), []);
  const toggleAudioCaptions = useCallback(() => setAudioCaptions((v) => !v), []);

  const anchorId = traceActive ? (selectedNodeId ?? outcomeAnchorId(view)) : null;
  const matched = useMemo(() => matchedNodeIds(view, activeTypes), [view, activeTypes]);
  const traced = useMemo(() => tracedNodeIds(view, anchorId), [view, anchorId]);

  const emphasisFor = useCallback(
    (id: string): NodeEmphasis => {
      if (!matched.has(id)) return "dimmed"; // hidden by a type filter → always de-emphasised.
      if (traced === null) return "normal"; // no trace active.
      return isTraceEmphasized(id, traced, anchorId) ? "traced" : "dimmed";
    },
    [matched, traced, anchorId],
  );

  const value = useMemo<HudContextValue>(
    () => ({
      activeTypes,
      toggleType,
      showAllTypes,
      allTypesActive: activeTypes.size === NODE_TYPES.length,
      traceActive,
      toggleTrace,
      hasTrace: traceActive && anchorId !== null,
      anchorId,
      emphasisFor,
      plainMode,
      togglePlain,
      reducedMotionMode,
      setReducedMotionMode,
      systemReducedMotion,
      reducedMotion,
      tierOverride,
      setTierOverride,
      audioCaptions,
      toggleAudioCaptions,
    }),
    [
      activeTypes,
      toggleType,
      showAllTypes,
      traceActive,
      toggleTrace,
      anchorId,
      emphasisFor,
      plainMode,
      togglePlain,
      reducedMotionMode,
      systemReducedMotion,
      reducedMotion,
      tierOverride,
      audioCaptions,
      toggleAudioCaptions,
    ],
  );

  return <HudContext.Provider value={value}>{children}</HudContext.Provider>;
}

export function useHud(): HudContextValue {
  const ctx = useContext(HudContext);
  if (ctx === null) throw new Error("useHud must be used within a HudProvider");
  return ctx;
}

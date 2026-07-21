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
import { NODE_TYPES, type NodeType } from "@gt100k/evidence-graph";
import { type ReactNode, createContext, useCallback, useContext, useMemo, useState } from "react";
import type { JSX } from "react";
import { isTraceEmphasized, matchedNodeIds, outcomeAnchorId, tracedNodeIds } from "./filters.js";
import { useSelection } from "./selection.js";

/** How a node reads under the current filters + trace: full, de-emphasised, or trace-highlighted. */
export type NodeEmphasis = "normal" | "dimmed" | "traced";

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
    }),
    [activeTypes, toggleType, showAllTypes, traceActive, toggleTrace, anchorId, emphasisFor],
  );

  return <HudContext.Provider value={value}>{children}</HudContext.Provider>;
}

export function useHud(): HudContextValue {
  const ctx = useContext(HudContext);
  if (ctx === null) throw new Error("useHud must be used within a HudProvider");
  return ctx;
}

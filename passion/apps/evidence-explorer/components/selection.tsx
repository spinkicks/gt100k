"use client";
/**
 * Shared node-selection state (UX4). Selecting a node — from the accessible Ledger tree, a scrub
 * beat, or a pointer-pick on a 3D body — is a single concept: it opens the drill-down `Inspector`,
 * flies the camera to the body, and highlights the beat. Because the Ledger (a side panel) and the
 * render Stage live in different subtrees, the selection lives in this small client context that
 * wraps both (a `Context.Provider` adds no DOM, so the `.obs-grid` layout is untouched).
 *
 * The pointer-pick carries a screen `origin` so the Inspector can scale in *from the body* (origin-
 * aware); keyboard selections carry no origin and the panel scales from its own centre.
 */
import { type ReactNode, createContext, useCallback, useContext, useMemo, useState } from "react";
import type { JSX } from "react";
import type { SelectionOrigin } from "./inspector-model.js";

interface SelectionState {
  readonly selectedNodeId: string | null;
  readonly origin: SelectionOrigin | null;
  readonly select: (nodeId: string, origin?: SelectionOrigin | null) => void;
  readonly clear: () => void;
}

const SelectionContext = createContext<SelectionState | null>(null);

export function SelectionProvider({ children }: { children: ReactNode }): JSX.Element {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [origin, setOrigin] = useState<SelectionOrigin | null>(null);

  const select = useCallback((nodeId: string, o: SelectionOrigin | null = null) => {
    setSelectedNodeId(nodeId);
    setOrigin(o);
  }, []);
  const clear = useCallback(() => {
    setSelectedNodeId(null);
    setOrigin(null);
  }, []);

  const value = useMemo<SelectionState>(
    () => ({ selectedNodeId, origin, select, clear }),
    [selectedNodeId, origin, select, clear],
  );
  return <SelectionContext.Provider value={value}>{children}</SelectionContext.Provider>;
}

export function useSelection(): SelectionState {
  const ctx = useContext(SelectionContext);
  if (!ctx) throw new Error("useSelection must be used within a SelectionProvider");
  return ctx;
}

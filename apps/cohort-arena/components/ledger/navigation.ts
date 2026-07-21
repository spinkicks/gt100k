export interface LedgerTreeBranch {
  readonly id: string;
  readonly childIds: readonly string[];
}

export type LedgerTreeStructure = readonly LedgerTreeBranch[];

export interface LedgerNavigationState {
  readonly activeId: string | null;
  readonly expandedIds: readonly string[];
}

function orderedExpandedIds(
  structure: LedgerTreeStructure,
  expandedIds: ReadonlySet<string>,
): readonly string[] {
  return structure.filter((branch) => expandedIds.has(branch.id)).map((branch) => branch.id);
}

function setBranchExpanded(
  structure: LedgerTreeStructure,
  state: LedgerNavigationState,
  branchId: string,
  expanded: boolean,
): LedgerNavigationState {
  const expandedIds = new Set(state.expandedIds);
  if (expanded) expandedIds.add(branchId);
  else expandedIds.delete(branchId);

  return {
    activeId: state.activeId,
    expandedIds: orderedExpandedIds(structure, expandedIds),
  };
}

function parentBranch(
  structure: LedgerTreeStructure,
  nodeId: string,
): LedgerTreeBranch | undefined {
  return structure.find((branch) => branch.childIds.includes(nodeId));
}

export function createLedgerNavigationState(structure: LedgerTreeStructure): LedgerNavigationState {
  return {
    activeId: structure[0]?.id ?? null,
    expandedIds: structure.map((branch) => branch.id),
  };
}

export function visibleLedgerNodeIds(
  structure: LedgerTreeStructure,
  state: LedgerNavigationState,
): readonly string[] {
  const expandedIds = new Set(state.expandedIds);
  return structure.flatMap((branch) =>
    expandedIds.has(branch.id) ? [branch.id, ...branch.childIds] : [branch.id],
  );
}

export function nextLedgerNavigationState(
  structure: LedgerTreeStructure,
  state: LedgerNavigationState,
  key: string,
): LedgerNavigationState {
  const visibleIds = visibleLedgerNodeIds(structure, state);
  if (visibleIds.length === 0) return state;

  const activeId = visibleIds.includes(state.activeId ?? "") ? state.activeId! : visibleIds[0]!;
  const activeIndex = visibleIds.indexOf(activeId);
  const branch = structure.find((candidate) => candidate.id === activeId);
  const parent = parentBranch(structure, activeId);

  if (key === "ArrowDown") {
    const nextId = visibleIds[Math.min(activeIndex + 1, visibleIds.length - 1)]!;
    return nextId === activeId ? state : { ...state, activeId: nextId };
  }
  if (key === "ArrowUp") {
    const nextId = visibleIds[Math.max(activeIndex - 1, 0)]!;
    return nextId === activeId ? state : { ...state, activeId: nextId };
  }
  if (key === "Home") {
    return activeId === visibleIds[0] ? state : { ...state, activeId: visibleIds[0]! };
  }
  if (key === "End") {
    const lastId = visibleIds.at(-1)!;
    return activeId === lastId ? state : { ...state, activeId: lastId };
  }
  if (key === "ArrowRight" && branch) {
    if (!state.expandedIds.includes(branch.id)) {
      return setBranchExpanded(structure, state, branch.id, true);
    }
    const firstChildId = branch.childIds[0];
    return firstChildId ? { ...state, activeId: firstChildId } : state;
  }
  if (key === "ArrowLeft") {
    if (parent) return { ...state, activeId: parent.id };
    if (branch && state.expandedIds.includes(branch.id)) {
      return setBranchExpanded(structure, state, branch.id, false);
    }
    return state;
  }
  if ((key === "Enter" || key === " ") && branch) {
    return setBranchExpanded(structure, state, branch.id, !state.expandedIds.includes(branch.id));
  }
  if (key === "Escape") {
    const branchToCollapse = parent ?? branch;
    if (!branchToCollapse || !state.expandedIds.includes(branchToCollapse.id)) return state;
    const parentState = parent ? { ...state, activeId: parent.id } : state;
    return setBranchExpanded(structure, parentState, branchToCollapse.id, false);
  }

  return state;
}

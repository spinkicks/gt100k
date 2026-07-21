/**
 * `buildLedgerView` — the accessible Provenance Ledger view-model (§U5.12 / §U12, SC-E10).
 *
 * The Ledger is the parallel DOM the app renders alongside the (decorative, `aria-hidden`)
 * constellation: the DAG as a keyboard-navigable `role="tree"` (each node an item whose accessible
 * name = type + label + state + actor + human-owned/cited marker), the growth timeline as an
 * ordered list, and — optionally — verification as a status list with an `aria-live` seal region.
 *
 * It is pure and framework-free: it reads the already-composed `ExplorerView` (+ an optional
 * `VerificationView`) and computes **no** grade, **no** crypto, and **no** accusation. Parity with
 * the constellation is by construction — both consume the one `ExplorerView`, so they never drift.
 */
import type {
  ExplorerView,
  LedgerPanel,
  LedgerTimelineItem,
  LedgerTreeItem,
  LedgerVerification,
  LedgerView,
  NodeView,
  SealState,
  VerificationView,
} from "./model.js";

/** The actor's spoken name: a human display name, else the pseudonymous ref. */
function actorName(node: NodeView): string {
  return node.actor.displayName ?? node.actor.ref;
}

/** State clause for the accessible name — milestone membership vs. the unlinked island note. */
function stateWords(node: NodeView): string {
  return node.isIsland ? "note outside this milestone" : "in milestone";
}

/**
 * Accessible name = type + label + state + actor + human-owned/cited marker (§U5.12). Neutral and
 * non-accusatory: a `model` actor reads as "declared AI assistance, cited"; a grade `Outcome` reads
 * as "human-owned by <owner>" (e.g. "Outcome — Final grade, in milestone, human-owned by …").
 */
function accessibleName(node: NodeView): string {
  const head = `${node.type} — ${node.label}`;
  const state = stateWords(node);
  let who: string;
  if (node.isHumanOwned) {
    who = `human-owned by ${actorName(node)}`;
  } else if (node.isCitedAssistance) {
    who = `declared AI assistance, cited — by ${actorName(node)}`;
  } else {
    who = `by ${actorName(node)}`;
  }
  return `${head}, ${state}, ${who}`;
}

function toPanel(node: NodeView): LedgerPanel {
  return {
    id: node.id,
    type: node.type,
    label: node.label,
    actor: node.actor,
    ...(node.tool !== undefined ? { tool: node.tool } : {}),
    inputs: node.inputs,
    timestamp: node.timestamp,
    consentScope: node.consentScope,
    payload: node.payload,
    isHumanOwned: node.isHumanOwned,
    ...(node.isHumanOwned ? { humanOwner: actorName(node) } : {}),
    isCitedAssistance: node.isCitedAssistance,
  };
}

function toTreeItem(node: NodeView, childrenById: Map<string, string[]>): LedgerTreeItem {
  return {
    id: node.id,
    type: node.type,
    label: node.label,
    depthRank: node.depthRank,
    orderInRank: node.orderInRank,
    isInMilestone: node.isInMilestone,
    isIsland: node.isIsland,
    children: childrenById.get(node.id) ?? [],
    accessibleName: accessibleName(node),
    panel: toPanel(node),
  };
}

/** Spoken status for a verification row (§U5.12). Neutral — a mismatch is "did not match", not blame. */
function stepStatusText(status: string, nonProduction: boolean): string {
  if (nonProduction) return "non-production stub (does not block the seal)";
  switch (status) {
    case "pass":
      return "passed";
    case "fail":
      return "did not match";
    default:
      return "non-production stub (does not block the seal)";
  }
}

/** The `aria-live` seal announcement (§U5.7 wording). Non-accusatory in every state. */
function sealText(state: SealState): string {
  switch (state) {
    case "verified":
      return "Verified — Merkle root re-derived, attestation subject matched, every grade human-owned.";
    case "mismatch":
      return "Mismatch — the re-derived Merkle root differs from the committed root (bytes changed).";
    default:
      return "Not yet verified.";
  }
}

function toVerification(v: VerificationView): LedgerVerification {
  return {
    steps: v.steps.map((s) => {
      const nonProduction = s.nonProduction ?? false;
      return {
        id: s.id,
        label: s.label,
        status: s.status,
        nonProduction,
        statusText: stepStatusText(s.status, nonProduction),
      };
    }),
    sealState: v.sealState,
    sealText: sealText(v.sealState),
  };
}

/**
 * Build the accessible Ledger from a composed `ExplorerView`. Pass a `VerificationView` to fold in
 * the verification status list + seal region; omit it and the block is absent (baseline unchanged).
 */
export function buildLedgerView(view: ExplorerView, verification?: VerificationView): LedgerView {
  // Downstream node→node edges per source, in deterministic edge order (dedup, stable).
  const childrenById = new Map<string, string[]>();
  for (const edge of view.edges) {
    if (!edge.isNodeEdge) continue;
    const kids = childrenById.get(edge.from) ?? [];
    if (!kids.includes(edge.to)) kids.push(edge.to);
    childrenById.set(edge.from, kids);
  }

  const tree: LedgerTreeItem[] = view.nodes.map((n) => toTreeItem(n, childrenById));

  const timeline: LedgerTimelineItem[] = view.growthTimeline.beats.map((beat, i) => {
    const node = view.nodes.find((n) => n.id === beat.nodeId);
    return {
      position: i + 1,
      nodeId: beat.nodeId,
      birthOrder: beat.birthOrder,
      group: beat.group,
      label: node ? `${node.type} — ${node.label}` : beat.nodeId,
    };
  });

  return {
    milestoneRef: view.milestoneRef,
    tree,
    timeline,
    ...(verification !== undefined ? { verification: toVerification(verification) } : {}),
  };
}

/**
 * `buildExplorerView` — composes the single deterministic `ExplorerView` the app renders from the
 * domain graph + assembled packet. Reads the domain; computes no grade and no crypto. Presentation
 * flags (tier / reduced-motion / plain / captions) never affect state — `plainViewEquals` proves it.
 */
import type { EvidenceGraph, EvidencePacket } from "@gt100k/evidence-graph";
import { layoutExplorer2D } from "./layout2d.js";
import { CENTER_3D, layoutExplorer3D } from "./layout3d.js";
import type {
  ActorChip,
  EdgeView,
  ExplorerView,
  NodeView,
  Presentation,
  RenderTier,
  Vec2,
  Vec3,
} from "./model.js";
import { provenanceRanks } from "./ranks.js";
import { buildGrowthTimeline } from "./timeline.js";
import { resolveEdgeThread, resolveNodeBody, resolveNodeColorRole, resolveNodeGlyph } from "./visual.js";

const HUMAN_OWNED_OUTCOME_KINDS = new Set(["grade", "judgment"]);

export interface BuildExplorerViewOptions {
  readonly tier?: RenderTier;
  readonly reducedMotion?: boolean;
  readonly reducedTransparency?: boolean;
  readonly plainMode?: boolean;
  readonly audioCaptions?: boolean;
}

function defaultPresentation(opts: BuildExplorerViewOptions): Presentation {
  return {
    tier: opts.tier ?? "cinematic",
    reducedMotion: opts.reducedMotion ?? false,
    reducedTransparency: opts.reducedTransparency ?? false,
    plainMode: opts.plainMode ?? false,
    audioCaptions: opts.audioCaptions ?? false,
  };
}

function actorLabel(ref: string, displayName?: string): string {
  return displayName ?? ref;
}

export function buildExplorerView(
  graph: EvidenceGraph,
  packet: EvidencePacket,
  opts: BuildExplorerViewOptions = {},
): ExplorerView {
  const ranks = provenanceRanks(graph);
  const layout2d = layoutExplorer2D(graph);
  const layout3d = layoutExplorer3D(graph);
  const timeline = buildGrowthTimeline(graph, packet);

  const milestoneIds = new Set(packet.nodeIds);
  const birthByNode = new Map(timeline.beats.map((b) => [b.nodeId, b.birthOrder]));

  const nodes: NodeView[] = ranks.map((r) => {
    const node = r.node;
    const pos2d: Vec2 = layout2d.positions.get(node.id) ?? { x: 0, y: 0 };
    const pos3d: Vec3 = layout3d.positions.get(node.id) ?? [0, 0, 0];

    const chip: ActorChip = {
      kind: node.actor.kind,
      ref: node.actor.ref,
      ...(node.actor.displayName !== undefined ? { displayName: node.actor.displayName } : {}),
      tone: node.actor.kind,
      label: actorLabel(node.actor.ref, node.actor.displayName),
    };

    const isInMilestone = milestoneIds.has(node.id);
    const isHumanOwned =
      node.type === "Outcome" &&
      node.actor.kind === "human" &&
      HUMAN_OWNED_OUTCOME_KINDS.has(node.payload.kind as string);
    const isCitedAssistance =
      (node.type === "Assistance" || node.type === "Review") && node.actor.kind === "model";

    return {
      id: node.id,
      type: node.type,
      label: (typeof node.payload.title === "string" ? node.payload.title : node.type),
      actor: chip,
      ...(node.tool !== undefined ? { tool: node.tool } : {}),
      body: resolveNodeBody(node.type),
      glyph: resolveNodeGlyph(node.type),
      colorRole: resolveNodeColorRole(node.type),
      depthRank: r.depthRank,
      orderInRank: r.orderInRank,
      pos2d,
      pos3d,
      isInMilestone,
      isIsland: r.isIsland,
      isHumanOwned,
      isCitedAssistance,
      birthOrder: birthByNode.get(node.id) ?? null,
      timestamp: node.timestamp,
      inputs: node.inputs,
      consentScope: node.consentScope,
      payload: node.payload,
    };
  });

  const edges: EdgeView[] = graph.edges.map((edge) => {
    const thread = resolveEdgeThread(edge.type);
    return {
      type: edge.type,
      from: edge.from,
      to: edge.to,
      threadStyle: thread.threadStyle,
      cap: thread.cap,
      flow: thread.flow,
      label: thread.label,
      isNodeEdge: graph.nodes[edge.from] !== undefined && graph.nodes[edge.to] !== undefined,
    };
  });

  return {
    milestoneRef: packet.milestoneRef,
    nodes,
    edges,
    bounds2d: layout2d.bounds,
    bounds3d: layout3d.bounds,
    center3d: CENTER_3D,
    growthTimeline: timeline,
    presentation: defaultPresentation(opts),
  };
}

/**
 * State-equality of two views ignoring presentation flags — toggling tier / reduced-motion /
 * plain-mode must never change the underlying state (SC-E02/E03/E04).
 */
export function plainViewEquals(a: ExplorerView, b: ExplorerView): boolean {
  const strip = ({ presentation: _p, ...rest }: ExplorerView): Omit<ExplorerView, "presentation"> =>
    rest;
  return JSON.stringify(strip(a)) === JSON.stringify(strip(b));
}

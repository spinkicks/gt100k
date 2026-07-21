/**
 * Golden visual language (§U8.12 / §U8.3, exact) — each of the 8 node types is a distinct 3D
 * body *and* a distinct 2D glyph *and* a distinct color role (never color alone, FR-E04). Each of
 * the 6 edge types is a distinct light-thread style + routed label.
 */
import type { NodeType, EdgeType } from "@gt100k/evidence-graph";
import type { EdgeThreadStyle, NodeBody, NodeColorRole, NodeGlyphId } from "./model.js";

/** Node type → procedural 3D body (§U8.12). Assistance carries a persistent `declaredTag`. */
export const NODE_BODIES: Record<NodeType, NodeBody> = {
  Artifact: { id: "world" },
  Attempt: { id: "moon" },
  Transformation: { id: "blueprint" },
  Claim: { id: "beacon" },
  Assistance: { id: "comet", declaredTag: true },
  Review: { id: "gold-star" },
  Contribution: { id: "crystal" },
  Outcome: { id: "seal-sun" },
};

/** Node type → 2D glyph (calm tier, §U8.12). */
export const NODE_GLYPHS: Record<NodeType, NodeGlyphId> = {
  Artifact: "diamond",
  Attempt: "play",
  Transformation: "blueprint",
  Claim: "quote",
  Assistance: "spark",
  Review: "scale",
  Contribution: "hex",
  Outcome: "seal",
};

/** Node type → palette color role (§U8.3/§U8.11). */
export const NODE_COLOR_ROLES: Record<NodeType, NodeColorRole> = {
  Artifact: "artifact",
  Attempt: "attempt",
  Transformation: "transformation",
  Claim: "claim",
  Assistance: "assistance",
  Review: "review",
  Contribution: "contribution",
  Outcome: "outcome",
};

/** Edge type → thread style + cap + flow + routed label (§U8.12). */
export const EDGE_THREADS: Record<EdgeType, EdgeThreadStyle> = {
  derived_from: { threadStyle: "solid", cap: "plain", flow: true, label: "derived from" },
  authored_by: { threadStyle: "dotted", cap: "plain", flow: false, label: "authored by" },
  used_tool: { threadStyle: "dashed-fine", cap: "plain", flow: false, label: "used tool" },
  validates: { threadStyle: "solid", cap: "check", flow: true, label: "validates" },
  contradicts: { threadStyle: "frayed", cap: "slash", flow: false, label: "contradicts" },
  released_as: { threadStyle: "solid", cap: "arrow", flow: true, label: "released as" },
};

export function resolveNodeBody(type: NodeType): NodeBody {
  return NODE_BODIES[type];
}

export function resolveNodeGlyph(type: NodeType): NodeGlyphId {
  return NODE_GLYPHS[type];
}

export function resolveNodeColorRole(type: NodeType): NodeColorRole {
  return NODE_COLOR_ROLES[type];
}

export function resolveEdgeThread(type: EdgeType): EdgeThreadStyle {
  return EDGE_THREADS[type];
}

/**
 * Provenance Explorer view model (§U8, data-model Part II).
 *
 * These are *view* types only — the framework-agnostic, deterministic view-model the 3D/2D app
 * renders. Domain types (`EvidenceNode`, `EvidenceGraph`, `EvidencePacket`, …) are imported from
 * `@gt100k/evidence-graph` and never redefined here. This package reads the domain, computes no
 * grade and no crypto, and produces a deterministic layout.
 */
import type {
  ActorKind,
  ConsentScope,
  EdgeType,
  NodeType,
  ToolRef,
} from "@gt100k/evidence-graph";

export type Vec2 = { readonly x: number; readonly y: number };
export type Vec3 = readonly [number, number, number];

// ── Render tiers (§U8.10) ────────────────────────────────────────────────────
export type RenderTier = "cinematic" | "standard3d" | "calm2d";
export type TierOverride = "auto" | RenderTier;

export interface RenderCaps {
  prefersReducedMotion?: boolean;
  savePower?: boolean;
  webglAvailable?: boolean;
  gpuTier: 0 | 1 | 2 | 3;
  override?: TierOverride;
}

// ── Visual language (§U8.12) ─────────────────────────────────────────────────
export type NodeBodyId =
  | "world"
  | "moon"
  | "blueprint"
  | "beacon"
  | "comet"
  | "gold-star"
  | "crystal"
  | "seal-sun";

export interface NodeBody {
  readonly id: NodeBodyId;
  /** Persistent "declared AI assistance — cited" tag carried by the Assistance comet. */
  readonly declaredTag?: boolean;
}

export type NodeGlyphId =
  | "diamond"
  | "play"
  | "blueprint"
  | "quote"
  | "spark"
  | "scale"
  | "hex"
  | "seal";

export type NodeColorRole =
  | "artifact"
  | "attempt"
  | "transformation"
  | "claim"
  | "assistance"
  | "review"
  | "contribution"
  | "outcome";

export type ThreadStyle = "solid" | "dotted" | "dashed-fine" | "frayed";
export type ThreadCap = "plain" | "check" | "slash" | "arrow";

export interface EdgeThreadStyle {
  readonly threadStyle: ThreadStyle;
  readonly cap: ThreadCap;
  readonly flow: boolean;
  readonly label: string;
}

// ── Actors ───────────────────────────────────────────────────────────────────
/** Cited/neutral tone; never accusatory. `model` actors are cited, never blamed (§U8.14). */
export type ActorTone = ActorKind;

export interface ActorChip {
  readonly kind: ActorKind;
  readonly ref: string;
  readonly displayName?: string;
  readonly tone: ActorTone;
  readonly label: string;
}

// ── Nodes & edges ─────────────────────────────────────────────────────────────
export interface NodeView {
  readonly id: string;
  readonly type: NodeType;
  /** Always a text label — color/shape is never the sole cue (FR-E04). */
  readonly label: string;
  readonly actor: ActorChip;
  readonly tool?: ToolRef;
  readonly body: NodeBody;
  readonly glyph: NodeGlyphId;
  readonly colorRole: NodeColorRole;
  /** Neutral provenance index (§U8.14 — allowed; never a rank/leaderboard). */
  readonly depthRank: number;
  readonly orderInRank: number;
  readonly pos2d: Vec2;
  readonly pos3d: Vec3;
  readonly isInMilestone: boolean;
  readonly isIsland: boolean;
  readonly isHumanOwned: boolean;
  readonly isCitedAssistance: boolean;
  readonly birthOrder: number | null;
  // Drill-down inspector panel fields (extended in U4).
  readonly timestamp: string;
  readonly inputs: readonly string[];
  readonly consentScope: ConsentScope;
  readonly payload: Record<string, unknown>;
}

export interface EdgeView {
  readonly type: EdgeType;
  readonly from: string;
  readonly to: string;
  readonly threadStyle: ThreadStyle;
  readonly cap: ThreadCap;
  readonly flow: boolean;
  readonly label: string;
  /** true when `to` is another node (vs an actor/tool ref target). */
  readonly isNodeEdge: boolean;
}

// ── Layout bounds & camera ────────────────────────────────────────────────────
export interface Bounds2D {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface Bounds3D {
  readonly min: Vec3;
  readonly max: Vec3;
}

export interface CameraKeyframe {
  readonly position: Vec3;
  readonly target: Vec3;
  readonly fov: number;
}

// ── Motion ────────────────────────────────────────────────────────────────────
export type MotionMode = "animated" | "reduced";

export interface MotionSpec {
  readonly kind: string;
  readonly mode: MotionMode;
  readonly durationMs: number;
  /** Easing token name (a key of `EASINGS`); the app maps it to a CSS bezier. */
  readonly easing: string;
}

// ── Growth timeline (§U8.7) ───────────────────────────────────────────────────
export interface TimelineBeat {
  readonly nodeId: string;
  readonly birthOrder: number;
  readonly group: string;
}

export interface GrowthTimelineView {
  readonly beats: readonly TimelineBeat[];
  readonly count: number;
}

// ── Verification (§U8.8) — type surface; built in U3 ─────────────────────────
export type SealState = "verified" | "mismatch" | "unverified";
export type VerifyStatus = "pass" | "fail" | "stub";
export type VerifyStepId =
  | "merkle-root"
  | "subject-digest"
  | "human-authority"
  | "transparency-log-stub";

export interface VerifyStep {
  readonly id: VerifyStepId;
  readonly label: string;
  readonly status: VerifyStatus;
  readonly nonProduction?: boolean;
  readonly detail?: Record<string, unknown>;
}

export interface VerificationView {
  readonly steps: readonly VerifyStep[];
  readonly sealState: SealState;
  readonly verifyWaveOrder: ReadonlyArray<{ readonly from: string; readonly to: string }>;
}

// ── Ledger (§U12) — type surface; built in U1/U4 ─────────────────────────────
export interface LedgerNode {
  readonly id: string;
  readonly name: string;
  readonly children?: readonly LedgerNode[];
}

export interface LedgerView {
  readonly roots: readonly LedgerNode[];
}

// ── Presentation flags (never state) ─────────────────────────────────────────
export interface Presentation {
  readonly tier: RenderTier;
  readonly reducedMotion: boolean;
  readonly reducedTransparency: boolean;
  readonly plainMode: boolean;
  readonly audioCaptions: boolean;
}

// ── The composed view ─────────────────────────────────────────────────────────
export interface ExplorerView {
  readonly milestoneRef: string;
  readonly nodes: readonly NodeView[];
  readonly edges: readonly EdgeView[];
  readonly bounds2d: Bounds2D;
  readonly bounds3d: Bounds3D;
  readonly center3d: Vec3;
  readonly growthTimeline: GrowthTimelineView;
  readonly presentation: Presentation;
}

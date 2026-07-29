// Presentation-only Story Mode data + pure helpers. Reads an ExplorerView; never mutates it and
// never touches the domain graph. Pure so the whole module is unit-testable in the node env.
import type { ExplorerView } from "@gt100k/evidence-explorer-view";

/** Auto-advance cadence: one beat every ~2.6s — slow enough to read a caption.
 *  A JS interval delay, NOT a CSS-animation motion token. */
export const STORY_STEP_MS = 2600;

/** Shown before the story starts (revealedCount === 0). */
export const STORY_LEAD_IN = "Press play to watch how this was built — one real step at a time.";

/** Shown at full reveal; pairs with the Verify call-to-action. */
export const STORY_END_NUDGE = "…and here's the proof it's all real →";
export const STORY_VERIFY_CTA = "Verify";

/**
 * One plain caption per beat, keyed by 0-based beat position (`birthOrder`), authored to the
 * committed tiny-runner-v1 fixture (a student building a one-button endless runner). Honest to each
 * step: cited tutor help, a failed run kept on the record, a credited free asset, a human-owned
 * grade. If a beat has no authored caption, callers fall back to the node's own label.
 */
export const STORY_CAPTIONS: Record<number, string> = {
  0: "First, a plan: build a one-button endless runner.",
  1: "Asked a tutor how a game loop works — and noted that the help was used.",
  2: "First real code: a canvas and a game loop.",
  3: "First run — the player falls through the floor. It didn't pass yet, and that's recorded too.",
  4: "Asked the tutor how to add ground collision — help cited again.",
  5: "A new version: ground collision and a jump.",
  6: "Next run passes — the jump and the collision work.",
  7: "Used a free CC0 sprite sheet — and credited where it came from.",
  8: 'A reflection: "I understand the game loop and collision now."',
  9: "The playable build is released.",
  10: "A mentor reviews the craft and suggests a score counter.",
  11: "And the final grade — decided by a person, not a machine.",
};

/** The frontier beat = the newest revealed one (1-based position === revealedCount). */
export function frontierNodeId(view: ExplorerView, revealedCount: number): string | null {
  if (revealedCount <= 0) return null;
  const beat = view.growthTimeline.beats[revealedCount - 1];
  return beat ? beat.nodeId : null;
}

/** The caption at a reveal position: lead-in at 0, authored caption otherwise, node label as fallback. */
export function storyCaption(view: ExplorerView, revealedCount: number): string {
  if (revealedCount <= 0) return STORY_LEAD_IN;
  const beat = view.growthTimeline.beats[revealedCount - 1];
  if (!beat) return STORY_LEAD_IN;
  const authored = STORY_CAPTIONS[beat.birthOrder];
  if (authored) return authored;
  const node = view.nodes.find((n) => n.id === beat.nodeId);
  return node ? node.label : "";
}

/** First 7 chars of a node's sha256 content-address — a real, git-style short hash. */
export function shortHash(id: string): string {
  const hex = id.includes(":") ? id.slice(id.lastIndexOf(":") + 1) : id;
  return hex.slice(0, 7);
}

/**
 * Dependency parents of a node = the earlier steps it was built from / validates. Read from the
 * view's edges, NOT `node.inputs` (which is `[]` in this fixture): an edge `from === nodeId` with
 * `isNodeEdge === true` is a node→node link; `released_as` points forward to the release, so it is
 * excluded (`authored_by` is already excluded — its target is an actor ref, so `isNodeEdge` is false).
 */
export function parentCount(view: ExplorerView, nodeId: string): number {
  return view.edges.filter((e) => e.from === nodeId && e.isNodeEdge && e.type !== "released_as").length;
}

/** A step is a "merge" when it draws on more than one earlier step (DAG, not a line). */
export function isMerge(view: ExplorerView, nodeId: string): boolean {
  return parentCount(view, nodeId) > 1;
}

// ── pure playback math (the hook is a thin React wrapper over these) ──
export function clampCount(count: number, max: number): number {
  return Math.max(0, Math.min(count, max));
}
export function nextCount(count: number, max: number): number {
  return clampCount(count + 1, max);
}
export function prevCount(count: number): number {
  return Math.max(0, count - 1);
}
export function isAtEnd(count: number, max: number): boolean {
  return count >= max;
}
export function isAtStart(count: number): boolean {
  return count <= 0;
}
/** Auto-advance is suppressed under reduced motion (step-only). */
export function canAutoAdvance(reducedMotion: boolean): boolean {
  return !reducedMotion;
}

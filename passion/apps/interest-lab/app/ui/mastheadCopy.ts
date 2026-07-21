import type { RenderTier } from "@gt100k/interest-lab-view";
import type { InterestLabSurface } from "./controls/settings";

/**
 * Masthead copy (P1 item 8 — child copy pass). The masthead is shared by every surface, so its
 * eyebrow ("· synthetic preview") and status pill ("Accessible 2D tier") — useful *dev* context —
 * would otherwise leak render-tier jargon and preview-build wording into what a **child** reads. This
 * pure resolver maps (surface, staff-debug, active render tier) → the eyebrow + pill copy, so the
 * child build says warm, jargon-free, no-test language while `?debug` keeps the diagnostic strings.
 *
 * Pure + framework-free (just strings), so the copy contract is unit-tested without a DOM, mirroring
 * `resolveStaffDebugMode` / `resolveWorldWayfinding`. `InterestLabClient` is the only caller.
 */

/** The diagnostic render-tier names shown only inside the staff (`?debug`) harness. */
const STAFF_TIER_STATUS: Readonly<Record<RenderTier, string>> = {
  "quest-world-3d": "Full 3D world",
  "quest-world-3d-lite": "Lighter 3D world",
  "board-2d": "Accessible 2D tier",
};

/** Staff eyebrow — names the product + flags the synthetic preview build for the operator. */
const STAFF_CONTEXT_LINE = "Interest Lab · synthetic preview";

/**
 * Child eyebrow — reassurance, not jargon: this world is exploration, never a graded test (§U8.1;
 * no scalar score / no fixed label, IL-005/IL-006). Deliberately about the *stakes*, so it does not
 * echo the lede's "try different work" activity framing.
 */
const CHILD_CONTEXT_LINE = "Explore freely — nothing here is a test.";

/** Guide (analyst) eyebrow — the product name, without the preview-build tell a child shouldn't see. */
const GUIDE_CONTEXT_LINE = "Interest Lab";

/** Guide status pill — names the surface, same as the console header. */
const GUIDE_STATUS = "Evidence console";

/** Child status pill — the calm/still 2D board reads as "Calm view"; the moving 3D world as "Exploring". */
const CHILD_STATUS_CALM = "Calm view";
const CHILD_STATUS_MOVING = "Exploring";

export interface MastheadCopy {
  /** The eyebrow above the title (never null — the eyebrow always has a line to render). */
  readonly contextLine: string;
  /** The status pill label beside the title. */
  readonly statusLabel: string;
}

export interface MastheadCopyInput {
  readonly surface: InterestLabSurface;
  /** True when the staff `?debug`/`?staff` harness is on — show the diagnostic strings. */
  readonly staffDebug: boolean;
  /** The render tier actually in effect (drives the child "Calm view" vs "Exploring" pill). */
  readonly renderTier: RenderTier;
}

/**
 * Resolve the masthead eyebrow + status-pill copy. Total over every (surface, staffDebug, renderTier):
 * - staff debug → diagnostic copy (synthetic-preview eyebrow + render-tier name, or the guide console);
 * - child build → warm, no-test copy with a calm/exploring pill that never surfaces tier jargon;
 * - guide (non-staff) → the product name + "Evidence console".
 */
export function resolveMastheadCopy({
  surface,
  staffDebug,
  renderTier,
}: MastheadCopyInput): MastheadCopy {
  if (staffDebug) {
    return {
      contextLine: STAFF_CONTEXT_LINE,
      statusLabel: surface === "guide" ? GUIDE_STATUS : STAFF_TIER_STATUS[renderTier],
    };
  }
  if (surface === "guide") {
    return { contextLine: GUIDE_CONTEXT_LINE, statusLabel: GUIDE_STATUS };
  }
  return {
    contextLine: CHILD_CONTEXT_LINE,
    statusLabel: renderTier === "board-2d" ? CHILD_STATUS_CALM : CHILD_STATUS_MOVING,
  };
}

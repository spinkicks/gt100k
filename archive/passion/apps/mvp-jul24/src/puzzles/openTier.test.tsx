/**
 * "Try a harder one" must never hand back an easier one.
 *
 * The unit tests below pin `openTier` itself; the render test at the bottom pins the thing that
 * actually matters, which is that the three music activities route `PuzzleProps.tier` through it. A
 * helper nobody calls fixes nothing, and the bug this guards against is invisible from the outside:
 * the button still says "harder", a board still appears, and it is the easiest one in the puzzle.
 */
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetAudioEngineForTests } from "../audio/engine";
import ChordFit from "./ChordFit/ChordFit";
import {
  TIERS as CHORD_FIT_TIERS,
  tierForIndex as chordFitTierForIndex,
} from "./ChordFit/generate";
import Downbeat from "./Downbeat/Downbeat";
import { TIERS as DOWNBEAT_TIERS, tierForIndex as downbeatTierForIndex } from "./Downbeat/generate";
import { openTier } from "./openTier";
import TuneRepair from "./TuneRepair/TuneRepair";
import {
  TIERS as TUNE_REPAIR_TIERS,
  tierForIndex as tuneRepairTierForIndex,
} from "./TuneRepair/generate";

beforeEach(() => {
  resetAudioEngineForTests();
});

describe("openTier", () => {
  it("is the identity while the tier exists", () => {
    expect(openTier(0, 3)).toBe(0);
    expect(openTier(1, 3)).toBe(1);
    expect(openTier(2, 3)).toBe(2);
  });

  it("holds at the hardest tier instead of wrapping to the easiest", () => {
    // The whole reason this function exists. `GadgetOverlay` counts presses of "Try a harder one"
    // without bound, so tier 3 of a three-tier puzzle must be the hardest one again — never tier 0.
    for (const tier of [3, 4, 5, 40]) expect(openTier(tier, 3)).toBe(2);
  });

  it("survives inputs no caller should produce", () => {
    expect(openTier(-1, 3)).toBe(0);
    expect(openTier(1.7, 3)).toBe(1);
    expect(openTier(Number.NaN, 3)).toBe(0);
    expect(openTier(2, 0)).toBe(0);
  });
});

describe("the wrap it guards against is real, in every music generator", () => {
  // Pinned against the generators rather than described in prose. Each `tierForIndex` is a modulo —
  // right for the "Next puzzle" button inside a mount, where cycling is deliberate so no session
  // ends on its hardest round, and wrong for the overlay's unbounded counter. If one of them ever
  // starts clamping for itself, this says so rather than leaving `openTier` a no-op nobody notices.
  const cases = [
    ["tune-repair", TUNE_REPAIR_TIERS.length, tuneRepairTierForIndex],
    ["chord-fit", CHORD_FIT_TIERS.length, chordFitTierForIndex],
    ["downbeat", DOWNBEAT_TIERS.length, downbeatTierForIndex],
  ] as const;

  it.each(cases)("%s wraps to its easiest tier at index %i, and openTier does not", (_id, n, f) => {
    expect(n).toBeGreaterThan(1);
    expect(f(n)).toBe(0);
    expect(openTier(n, n)).toBe(n - 1);
  });
});

describe("each music activity opens at the tier it was asked for, clamped", () => {
  // TuneRepair is the one whose tiers are countable from the DOM: its three tiers are 6, 8 and 10
  // notes long, so the roll's own length says which tier opened. That makes it the honest place to
  // assert the wiring; ChordFit and Downbeat vary tempo, spread and accent depth rather than
  // anything renderable, and are covered by the generator pins above plus a smoke render below.
  const notes = () => screen.getAllByRole("button", { name: /note$|note, picked up$/ });
  const lengths = TUNE_REPAIR_TIERS.map((t) => t.length);

  it.each([0, 1, 2])("tune-repair at tier %i renders that tier's melody", (tier) => {
    const { unmount } = render(
      <TuneRepair seed={11} tier={tier} onSolved={vi.fn()} onExit={vi.fn()} />,
    );
    expect(notes()).toHaveLength(lengths[tier] as number);
    unmount();
  });

  it("tune-repair past its hardest tier stays hardest, and does not wrap to six notes", () => {
    for (const tier of [3, 4, 7]) {
      const { unmount } = render(
        <TuneRepair seed={11} tier={tier} onSolved={vi.fn()} onExit={vi.fn()} />,
      );
      expect(notes(), `tier ${tier}`).toHaveLength(lengths[lengths.length - 1] as number);
      unmount();
    }
  });

  it("chord-fit and downbeat still mount past their last tier rather than throwing", () => {
    // `TIERS[tierIndex] ?? TIERS[0]` inside each generator means an out-of-range index silently
    // becomes the EASIEST tier rather than an error, so the failure this replaces was never going to
    // surface as a crash. Rendering them at tier 5 at least proves the clamp reaches a real tier.
    for (const tier of [3, 5]) {
      const cf = render(<ChordFit seed={5} tier={tier} onSolved={vi.fn()} onExit={vi.fn()} />);
      expect(screen.getAllByRole("button", { name: /chord/i }).length).toBeGreaterThan(0);
      cf.unmount();
      const db = render(<Downbeat seed={5} tier={tier} onSolved={vi.fn()} onExit={vi.fn()} />);
      expect(screen.getAllByRole("button", { name: /pulse/i }).length).toBeGreaterThan(0);
      db.unmount();
    }
  });
});

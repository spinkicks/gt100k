import { buildLedgerView, plainViewEquals } from "@gt100k/evidence-explorer-view";
import { describe, expect, it } from "vitest";
import {
  FULL_COPY,
  PLAIN_COPY,
  panelCopy,
  resolveSoundCue,
  sealCaption,
} from "../components/plain.js";
import { buildSyntheticExplorerView } from "../components/synthetic-view.js";

/**
 * UE046 — every U5 presentation toggle (plain mode / reduced motion / render tier / audio captions)
 * changes ONLY presentation flags; the underlying `ExplorerView` + `LedgerView` state is byte-identical
 * (SC-E02/E03/E04 / `plainViewEquals`). Plus unit coverage for the pure plain-copy + caption helpers.
 *
 * The app holds these toggles as React state and never threads them into `buildExplorerView`/
 * `buildLedgerView`; here we go one better and prove that even if they WERE folded into the view's
 * `Presentation` flags, the state (nodes / edges / bounds / timeline / ledger tree) is unchanged.
 */
describe("presentation toggles are state-only (UE046, SC-E02/E03)", () => {
  const base = buildSyntheticExplorerView();

  const strip = (v: unknown): string => {
    // Compare everything EXCEPT the presentation block.
    const { presentation: _p, ...rest } = v as { presentation: unknown };
    return JSON.stringify(rest);
  };

  it("plain mode leaves the view state byte-identical (only presentation differs)", () => {
    const plain = buildSyntheticExplorerView({ plainMode: true });
    expect(plainViewEquals(base, plain)).toBe(true);
    expect(strip(plain)).toBe(strip(base));
    expect(plain.presentation.plainMode).toBe(true);
    expect(base.presentation.plainMode).toBe(false);
  });

  it("reduced motion leaves the view state byte-identical", () => {
    const reduced = buildSyntheticExplorerView({ reducedMotion: true });
    expect(plainViewEquals(base, reduced)).toBe(true);
    expect(strip(reduced)).toBe(strip(base));
    expect(reduced.presentation.reducedMotion).toBe(true);
  });

  it("render tier leaves the view state byte-identical", () => {
    const calm = buildSyntheticExplorerView({ tier: "calm2d" });
    const cinematic = buildSyntheticExplorerView({ tier: "cinematic" });
    expect(plainViewEquals(calm, cinematic)).toBe(true);
    expect(strip(calm)).toBe(strip(cinematic));
    expect(calm.presentation.tier).toBe("calm2d");
    expect(cinematic.presentation.tier).toBe("cinematic");
  });

  it("audio captions leave the view state byte-identical", () => {
    const captioned = buildSyntheticExplorerView({ audioCaptions: true });
    expect(plainViewEquals(base, captioned)).toBe(true);
    expect(strip(captioned)).toBe(strip(base));
    expect(captioned.presentation.audioCaptions).toBe(true);
  });

  it("all toggles together leave the view + ledger state byte-identical", () => {
    const all = buildSyntheticExplorerView({
      plainMode: true,
      reducedMotion: true,
      audioCaptions: true,
      tier: "cinematic",
    });
    expect(plainViewEquals(base, all)).toBe(true);
    expect(strip(all)).toBe(strip(base));

    // The Ledger view-model (tree + timeline) is derived from the view state, so it is unchanged too.
    const ledgerBase = buildLedgerView(base);
    const ledgerAll = buildLedgerView(all);
    expect(JSON.stringify(ledgerAll.tree)).toBe(JSON.stringify(ledgerBase.tree));
    expect(JSON.stringify(ledgerAll.timeline)).toBe(JSON.stringify(ledgerBase.timeline));
  });
});

describe("plain-mode copy (UE045, §U5.9)", () => {
  it("plain and full copy are complete and distinct (same facts, plain wording)", () => {
    for (const copy of [FULL_COPY, PLAIN_COPY]) {
      expect(copy.addressLabel.length).toBeGreaterThan(0);
      expect(copy.addressNote.length).toBeGreaterThan(0);
      expect(copy.inputsEmpty.length).toBeGreaterThan(0);
    }
    expect(PLAIN_COPY.addressLabel).not.toBe(FULL_COPY.addressLabel);
    expect(PLAIN_COPY.addressNote).not.toBe(FULL_COPY.addressNote);
    // Plain wording drops the "content-addressed" / "milestone" jargon.
    expect(PLAIN_COPY.addressNote.toLowerCase()).not.toContain("content-address");
  });

  it("panelCopy(true) is plain, panelCopy(false) is full", () => {
    expect(panelCopy(true)).toBe(PLAIN_COPY);
    expect(panelCopy(false)).toBe(FULL_COPY);
  });
});

describe("audio-caption ids (UE045, §U5.10)", () => {
  it("resolveSoundCue is deterministic and neutral", () => {
    expect(resolveSoundCue("verified")).toBe("[verified]");
    expect(resolveSoundCue("step")).toBe("[check]");
    expect(resolveSoundCue("mismatch")).toBe("[mismatch]");
    // Neutral — the tamper cue is not an alarm.
    for (const id of ["[verified]", "[check]", "[mismatch]"]) {
      expect(id).not.toMatch(/alarm|alert|fail|cheat|blame/i);
    }
  });

  it("sealCaption maps seal states; unverified has nothing to announce", () => {
    expect(sealCaption("verified")).toBe("[verified]");
    expect(sealCaption("mismatch")).toBe("[mismatch]");
    expect(sealCaption("unverified")).toBeNull();
  });
});

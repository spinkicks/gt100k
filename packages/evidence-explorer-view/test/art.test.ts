import { PALETTE, TYPOGRAPHY } from "@gt100k/evidence-explorer-view";
import { describe, expect, it } from "vitest";

/** Golden palette + typography (§U8.11, exact). */
describe("art tokens", () => {
  it("PALETTE is exact", () => {
    expect(PALETTE).toEqual({
      void: "#0A0E17",
      panel: "#121826",
      panel2: "#1A2233",
      line: "#2A3346",
      ink: "#EAF0FB",
      inkMuted: "#9AA7C2",
      focus: "#7DD3FC",
      verify: "#34E5B0",
      tamper: "#FF5A6E",
      human: "#FFD166",
      model: "#8B9BC7",
      artifact: "#E9C46A",
      attempt: "#4CC9F0",
      transformation: "#5E7CE2",
      claim: "#B892FF",
      assistance: "#3DDC97",
      review: "#FFB03A",
      contribution: "#F072C0",
      outcome: "#FF7A8A",
    });
  });

  it("all 8 node-type hues are distinct", () => {
    const hues = [
      PALETTE.artifact,
      PALETTE.attempt,
      PALETTE.transformation,
      PALETTE.claim,
      PALETTE.assistance,
      PALETTE.review,
      PALETTE.contribution,
      PALETTE.outcome,
    ];
    expect(new Set(hues).size).toBe(8);
  });

  it("TYPOGRAPHY fonts + scale are exact", () => {
    expect(TYPOGRAPHY.fontDisplay).toBe('"Space Grotesk",ui-sans-serif,system-ui,sans-serif');
    expect(TYPOGRAPHY.fontBody).toBe(
      '"Inter",ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif',
    );
    expect(TYPOGRAPHY.fontMono).toBe(
      '"JetBrains Mono",ui-monospace,"SFMono-Regular","Cascadia Code",monospace',
    );
    expect(TYPOGRAPHY.numeric).toBe("tabular-nums");
    expect(TYPOGRAPHY.scale.display).toEqual({ rem: 2.5, lh: 1.05, ls: -0.02, w: 700 });
    expect(TYPOGRAPHY.scale.h1).toEqual({ rem: 1.75, lh: 1.1, ls: -0.01, w: 600 });
    expect(TYPOGRAPHY.scale.h2).toEqual({ rem: 1.25, lh: 1.2, ls: 0, w: 600 });
    expect(TYPOGRAPHY.scale.body).toEqual({ rem: 1.0, lh: 1.5, ls: 0, w: 400 });
    expect(TYPOGRAPHY.scale.label).toEqual({ rem: 0.8125, lh: 1.4, ls: 0.01, w: 500 });
    expect(TYPOGRAPHY.scale.mono).toEqual({ rem: 0.8125, lh: 1.5, ls: 0, w: 500 });
  });
});

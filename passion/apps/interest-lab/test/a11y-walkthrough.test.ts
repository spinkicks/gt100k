import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { DeviceCaps } from "@gt100k/interest-lab-view";
import { type ReactNode, createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { InterestLabClient } from "../app/InterestLabClient";
import { QuestWorld } from "../app/child/QuestWorld";
import { GuideConsole } from "../app/guide/GuideConsole";
import { buildSyntheticInterestLabSeed } from "../app/seed";

// SC-UI-18 (spec §U9 P15): both surfaces meet WCAG 2.2 AA natively in the DOM —
// keyboard/switch/screen-reader operable, the 3D <Canvas> aria-hidden with the DOM ledger
// as the AT source of truth, visible focus, color-independent state, and
// prefers-reduced-transparency → solid panels. This is the machine-checkable walkthrough:
// the DOM-as-AT-source contract that holds without a GPU. (True screen-reader / contrast
// verification is manual and tracked as such.)

// Stand in for the WebGL host so a 3D-tier QuestWorld renders its DOM overlays (the operable
// surface) without importing three/drei into SSR. The stub mirrors the real host's aria-hidden.
const captures = vi.hoisted(() => ({
  worldProps: null as { children?: ReactNode } | null,
}));

vi.mock("../app/child/world3d/World3D", () => ({
  World3D: (props: { children?: ReactNode }) => {
    captures.worldProps = props;
    return createElement("div", { "aria-hidden": "true", "data-world-3d-host": "true" });
  },
}));

const FULL_CAPS: DeviceCaps = {
  webglAvailable: true,
  deviceMemoryGB: 16,
  hardwareConcurrency: 12,
  coarsePointer: false,
  saveData: false,
};

const titleCase = (value: string) =>
  value.replaceAll("_", " ").replace(/^./, (c) => c.toUpperCase());

const questWorld3dMarkup = () =>
  renderToStaticMarkup(
    createElement(QuestWorld, {
      view: buildSyntheticInterestLabSeed({ deviceCaps: FULL_CAPS }).view,
    }),
  );

/** Pull one quest card's opening <button> tag by probe id (attribute order agnostic). */
const cardButtonTag = (markup: string, probeId: string) =>
  new RegExp(`<button[^>]*data-probe-id="${probeId}"[^>]*>`).exec(markup)?.[0] ?? "";

const ariaLabelOf = (tag: string) => /aria-label="([^"]*)"/.exec(tag)?.[1] ?? "";

const stylesheet = () =>
  readFileSync(fileURLToPath(new URL("../app/globals.css", import.meta.url)), "utf8");

/** Extract a balanced-ish @media block body by brace counting from its opening. */
const mediaBlock = (css: string, condition: string) => {
  const start = css.indexOf(`@media (${condition})`);
  if (start === -1) return "";
  const open = css.indexOf("{", start);
  let depth = 0;
  for (let i = open; i < css.length; i++) {
    if (css[i] === "{") depth++;
    else if (css[i] === "}" && --depth === 0) return css.slice(open + 1, i);
  }
  return "";
};

describe("SC-UI-18 · DOM-as-AT-source a11y walkthrough", () => {
  beforeEach(() => {
    captures.worldProps = null;
  });

  it("keeps the operable quest ledger beside the aria-hidden 3D canvas as the AT source of truth", () => {
    const markup = questWorld3dMarkup();

    // The 3D world is decorative: its host is aria-hidden and the real quests still render as DOM.
    expect(markup).toContain('data-world-3d-host="true"');
    expect(markup).toMatch(
      /data-world-3d-host="true"[^>]*aria-hidden="true"|aria-hidden="true"[^>]*data-world-3d-host="true"/,
    );

    // The ledger is a labelled landmark region of card-buttons — present WITH the canvas.
    expect(markup).toContain('aria-labelledby="quest-ledger-title"');
    expect(markup.match(/data-quest-card="true"/g)).toHaveLength(6);
  });

  it("makes every quest control natively keyboard-operable (a real button, no role/tabindex trap)", () => {
    const markup = questWorld3dMarkup();
    const cardTags = markup.match(/<button[^>]*data-quest-card="true"[^>]*>/g) ?? [];

    expect(cardTags).toHaveLength(6);
    for (const tag of cardTags) {
      // A native <button> is Enter/Space operable and Tab-reachable by the platform — no
      // pointer-only div, no role override that would strip button semantics, no focus trap.
      expect(tag).toContain('type="button"');
      expect(tag).not.toMatch(/\brole="/);
      expect(tag).not.toMatch(/tabindex="-1"/i);
    }
  });

  it("carries title, work-mode, why, and return-state together in one accessible name", () => {
    const quest = buildSyntheticInterestLabSeed({ deviceCaps: FULL_CAPS }).view.probePicker
      .visibleQuests[0]!;
    const label = ariaLabelOf(cardButtonTag(questWorld3dMarkup(), quest.probeId));

    // The four required parts of the card's screen-reader name (spec §14 "AT source of truth"):
    // what it is + the kind of work + why it's offered + its return state — in a single label.
    expect(label).toContain(quest.title);
    expect(label).toContain(titleCase(quest.workMode));
    expect(label).toContain(quest.whyCopy);
    expect(label).toContain("New quest.");
    // Non-empty and self-contained — the visible cue chips are decorative duplicates.
    expect(label.length).toBeGreaterThan(quest.title.length + quest.whyCopy.length);
  });

  it("conveys state without relying on color — pressed state, text, and hidden decorations", () => {
    const markup = questWorld3dMarkup();

    // Picked/unpicked is exposed to AT via aria-pressed (state, not hue) and mirrored in text.
    expect(markup.match(/aria-pressed="false"/g)).toHaveLength(6);
    expect(markup).toContain("Choose quest");
    // Icons are decorative; the meaning lives in text, so color-blind + AT users lose nothing.
    expect(markup).toContain('class="quest-work-glyph" data-glyph');
    expect(markup).toMatch(/class="quest-work-glyph"[^>]*aria-hidden="true"/);
    expect(markup).toMatch(/class="quest-cues" aria-hidden="true"/);
    // No emoji-as-meaning, and never a floating score/rank in the child surface.
    expect(markup).not.toMatch(/[\u{1F300}-\u{1FAFF}]/u);
    expect(markup).not.toMatch(/price|score|rank|percentile|verdict/i);
  });

  it("lets keyboard users bypass chrome: the skip link targets the operable content landmark", () => {
    const markup = renderToStaticMarkup(createElement(InterestLabClient));

    // A skip link and a matching landmark id → Tab-once bypass to the quests (WCAG 2.4.1).
    const skipHref = /<a class="skip-link" href="#([^"]+)">/.exec(markup)?.[1];
    expect(skipHref).toBeTruthy();
    expect(markup).toContain(`id="${skipHref}"`);

    // The default (no-WebGL SSR) surface is fully operable with zero canvas present.
    expect(markup).not.toContain("data-world-3d-host");
    expect(markup.match(/data-quest-card="true"/g)?.length ?? 0).toBeGreaterThan(0);
  });

  it("solidifies every translucent panel under prefers-reduced-transparency (child chrome included)", () => {
    const css = stylesheet();
    const block = mediaBlock(css, "prefers-reduced-transparency: reduce");

    expect(block).not.toBe("");
    // The base glass material goes solid + un-blurred (regression guard).
    expect(block).toMatch(/\.material\b/);
    expect(block).toContain("backdrop-filter: none");
    // The HUD deck sets its OWN translucent gradient background at higher specificity than
    // .material, so it must be neutralised explicitly — otherwise the child comfort controls
    // (the only child chrome) stay glassy when the user asks for reduced transparency.
    expect(block).toMatch(/\.control-panel\.hud-deck\b/);
    expect(block).toContain("background-image: none");
  });
});

// The guide "Hypothesis Console" is the OTHER surface SC-UI-18 covers (spec §14 "AT source of
// truth"): the coverage matrix is a DOM table with row/column headers + per-cell status *text*;
// the return timeline a labelled list of dated markers; the lifecycle a labelled state list with
// the gate checklist as text; the evidence constellation is decorative (aria-hidden) with the
// side-by-side explanations + timeline as its DOM equivalent, always present. No state or
// affordance is reachable only via the canvas, and no scalar score appears in the AT surface.
const guideMarkup = (reducedMotion = false) =>
  renderToStaticMarkup(
    createElement(GuideConsole, {
      view: buildSyntheticInterestLabSeed({
        surface: "guide",
        reducedMotion,
        deviceCaps: FULL_CAPS,
      }).view,
    }),
  );

describe("SC-UI-18 · guide Hypothesis Console DOM-as-AT-source walkthrough", () => {
  it("exposes coverage as a semantic table: caption name, col/row header scopes, text-only cell status", () => {
    const markup = guideMarkup();

    // A real <table> with a <caption> gives AT users a named, navigable grid.
    expect(markup).toContain("<table");
    expect(markup).toContain("<caption>Coverage across domains and work modes");
    // Both axes use header scope so a screen-reader announces domain + work-mode per cell.
    expect(markup).toMatch(/scope="col"/);
    expect(markup).toMatch(/scope="row"/);
    // Status is carried in TEXT (not hue/glyph): the meaning survives color-blindness + AT.
    expect(markup).toMatch(/Offered|Not yet offered|Voluntary exploration|Prompted exploration/);
    // The state glyph + row hue swatch are decorative duplicates, hidden from AT.
    expect(markup).toMatch(/class="coverage-state-glyph"[^>]*aria-hidden="true"/);
    expect(markup).toMatch(/class="coverage-row-hue" aria-hidden="true"/);
  });

  it("exposes the return timeline as an ordered list of dated text markers with decorative visuals", () => {
    const markup = guideMarkup();

    // Markers live in an <ol>; each carries a self-contained dated text label.
    expect(markup).toContain('class="timeline-markers"');
    expect(markup).toMatch(/data-timeline-marker="true"/);
    expect(markup).toContain("Day 7 · returned by choice · 7-day horizon");
    expect(markup).toContain("Day 7 · prompted return · reminder");
    // A care/support marker is neutral text and NEVER reads as a penalty (color-independent).
    expect(markup).toContain("never lowers a signal");
    expect(markup).toMatch(/data-lowers-signal="false"/);
    // The drawn axis, marker glyphs, and legend swatches are decorative — hidden from AT.
    expect(markup).toMatch(
      /class="timeline-axis"[^>]*aria-hidden="true"|aria-hidden="true"[^>]*class="timeline-axis"/,
    );
    expect(markup).toMatch(/class="timeline-marker-glyph" aria-hidden="true"/);
  });

  it("exposes the lifecycle as a labelled state list with an aria-current step and textual gate", () => {
    const markup = guideMarkup();

    // The current state is announced to AT via aria-current — not by tone/glow alone.
    expect(markup).toContain('data-current-lifecycle-state="EMERGING"');
    expect(markup).toContain('aria-current="step"');
    // Both tracks are labelled ordered lists so the branch is not a color-only distinction.
    expect(markup).toContain('aria-label="Main lifecycle track"');
    expect(markup).toContain('aria-label="Alternative lifecycle branch"');
    // Each gate family carries a text present/absent verdict; the check glyph is decorative.
    expect(markup).toMatch(/data-gate-family="/);
    expect(markup).toContain("Present");
    expect(markup).toMatch(/class="gate-family-glyph" aria-hidden="true"/);
    // Legal transitions are enumerable as text (the arrow is decorative).
    expect(markup).toContain("legal transitions");
  });

  it("keeps the evidence constellation aria-hidden with its DOM equivalent present WITH the canvas", () => {
    const markup = guideMarkup();

    // The optional depth viz is decorative and hidden from AT.
    expect(markup).toContain('data-evidence-constellation="depth"');
    expect(markup).toMatch(
      /data-evidence-constellation="depth"[^>]*aria-hidden="true"|aria-hidden="true"[^>]*data-evidence-constellation="depth"/,
    );
    // Its DOM equivalent — the side-by-side explanations + the timeline — is present ALONGSIDE it.
    expect(markup).toContain('class="explanation-pair"');
    expect(markup).toContain('data-explanation-role="supporting"');
    expect(markup).toContain('data-explanation-role="disconfirming"');
    expect(markup).toContain('class="timeline-markers"');
  });

  it("stays fully readable with ZERO canvas and exposes no scalar score (constellation dropped)", () => {
    const reduced = guideMarkup(true);

    // Reduced-motion drops the constellation entirely — proving nothing is canvas-only.
    expect(reduced).not.toContain("data-evidence-constellation");
    // Every stateful panel is still present and readable from the DOM alone.
    expect(reduced).toContain('data-guide-console="true"');
    expect(reduced).toContain("<table");
    expect(reduced).toContain('class="explanation-pair"');
    expect(reduced).toContain('data-explanation-role="disconfirming"');
    expect(reduced).toContain('class="timeline-markers"');
    expect(reduced).toContain('data-current-lifecycle-state="EMERGING"');
    // The guide surface never reduces a person to a scalar or a fixed label.
    expect(reduced).not.toMatch(/passion score|confidence|verdict|percentile|\brank\b/i);
    expect(reduced).not.toMatch(/you are (a|an|the) /i);
  });
});

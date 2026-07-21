import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { DeviceCaps } from "@gt100k/interest-lab-view";
import { type ReactNode, createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { InterestLabClient } from "../app/InterestLabClient";
import { QuestWorld } from "../app/child/QuestWorld";
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
    createElement(QuestWorld, { view: buildSyntheticInterestLabSeed({ deviceCaps: FULL_CAPS }).view }),
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
    expect(markup).toMatch(/data-world-3d-host="true"[^>]*aria-hidden="true"|aria-hidden="true"[^>]*data-world-3d-host="true"/);

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

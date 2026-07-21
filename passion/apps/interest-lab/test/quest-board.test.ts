import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Board2D } from "../app/child/Board2D";
import { QuestCard, resolveQuestCardMotion } from "../app/child/QuestCard";
import { QuestLedger, updatePickedProbeIds } from "../app/child/QuestLedger";
import { QuestTray } from "../app/child/QuestTray";
import { buildSyntheticInterestLabSeed } from "../app/seed";

const picker = buildSyntheticInterestLabSeed().view.probePicker;

describe("2D quest board", () => {
  it("renders the staged quest ledger as ordered, color-independent card buttons", () => {
    const markup = renderToStaticMarkup(createElement(QuestLedger, { picker }));

    expect(markup.match(/data-quest-card="true"/g)).toHaveLength(6);
    expect(markup.match(/aria-pressed="false"/g)).toHaveLength(6);
    expect(markup).toContain("making constellation");
    expect(markup).toContain("living systems constellation");
    expect(markup).toContain("Foundational");
    expect(markup).toContain("Stretch");
    expect(markup).toContain("Solo");
    expect(markup).toContain("Group");
    expect(markup).toContain("No audience");
    expect(markup).toContain("Audience");
    expect(markup).toContain("Try a different way");
    expect(markup).toContain("Rules suggested this quest");
    expect(markup).toContain("Pick a quest to keep it close");
    expect(markup).not.toMatch(/[\u{1F300}-\u{1FAFF}]/u);
    expect(markup).not.toMatch(/price|score|rank|percentile|verdict/i);
  });

  it("keeps the card accessible name, hue, work-mode glyph, and help copy together", () => {
    const quest = picker.visibleQuests[0]!;
    const markup = renderToStaticMarkup(
      createElement(QuestCard, {
        quest,
        index: 0,
        picked: false,
        onPick: () => undefined,
      }),
    );

    expect(markup).toContain(`--quest-hue:${quest.domainHue}`);
    expect(markup).toContain('data-glyph="glyph-hammer"');
    expect(markup).toContain(`aria-label="${quest.title}. Build. Foundational. Solo. No audience.`);
    expect(markup).toContain(quest.whyCopy);
    expect(markup).toContain("Help never changes what you can choose.");
  });

  it("groups board quests in first-appearance domain order", () => {
    const markup = renderToStaticMarkup(
      createElement(Board2D, {
        quests: picker.visibleQuests,
        pickedProbeIds: [],
        onPick: () => undefined,
      }),
    );

    expect(markup.indexOf("making constellation")).toBeLessThan(
      markup.indexOf("living systems constellation"),
    );
    expect(markup.indexOf('data-probe-id="p01"')).toBeLessThan(
      markup.indexOf('data-probe-id="p06"'),
    );
  });

  it("uses the pinned entrance, hover, press, spring, and reduced-motion tokens", () => {
    expect(resolveQuestCardMotion(false, 2)).toEqual({
      enter: {
        initial: { opacity: 0, scale: 0.96 },
        transition: {
          delay: 0.08,
          duration: 0.26,
          ease: "cubic-bezier(0.23,1,0.32,1)",
        },
      },
      hover: {
        transform: "translateY(-4px)",
        transition: { duration: 0.15, ease: "cubic-bezier(0.23,1,0.32,1)" },
      },
      press: {
        scale: 0.97,
        transition: { duration: 0.12, ease: "cubic-bezier(0.5,0,0.5,1)" },
      },
      pick: { type: "spring", bounce: 0.2, duration: 0.42 },
    });
    expect(resolveQuestCardMotion(true, 2)).toMatchObject({
      enter: { initial: false, transition: { delay: 0, duration: 0, ease: "linear" } },
      hover: undefined,
      press: { scale: 0.97, transition: { duration: 0.12, ease: "linear" } },
      pick: { duration: 0.15, ease: "linear" },
    });
  });

  it("owns idempotent pick order and renders tray returns as real buttons", () => {
    const first = updatePickedProbeIds([], { type: "pick", probeId: "p01" });
    const second = updatePickedProbeIds(first, { type: "pick", probeId: "p02" });

    expect(updatePickedProbeIds(first, { type: "pick", probeId: "p01" })).toEqual(first);
    expect(updatePickedProbeIds(second, { type: "return", probeId: "p01" })).toEqual(["p02"]);

    const markup = renderToStaticMarkup(
      createElement(QuestTray, {
        quests: picker.quests.slice(0, 2),
        reducedMotion: false,
        onReturn: () => undefined,
      }),
    );
    expect(markup.match(/data-quest-tray-item="true"/g)).toHaveLength(2);
    expect(markup).toContain('aria-label="Put making: build quest back on the board"');
  });
});

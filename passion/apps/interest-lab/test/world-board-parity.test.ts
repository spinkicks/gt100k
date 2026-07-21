import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { QuestLedger } from "../app/child/QuestLedger";
import { buildSyntheticInterestLabSeed } from "../app/seed";

const FULL_CAPS = {
  webglAvailable: true,
  deviceMemoryGB: 16,
  hardwareConcurrency: 12,
  coarsePointer: false,
  saveData: false,
} as const;

const seed = buildSyntheticInterestLabSeed({ deviceCaps: FULL_CAPS });
const { probePicker, scene } = seed.view;

const markerIds = () =>
  new Set(scene.islands.flatMap((island) => island.markers.map((marker) => marker.probeId)));
const questIds = () => new Set(probePicker.quests.map((quest) => quest.probeId));
const visibleIds = () => new Set(probePicker.visibleQuests.map((quest) => quest.probeId));

const boardProbeIds = (markup: string): Set<string> =>
  new Set([...markup.matchAll(/data-probe-id="([^"]+)"/g)].map((match) => match[1]!));

describe("world ↔ board parity (one truth)", () => {
  it("makes every 3D marker a real ledger quest — markers ⊆ quests", () => {
    const quests = questIds();
    for (const id of markerIds()) {
      expect(quests.has(id)).toBe(true);
    }
  });

  it("makes every quest reachable in the world — every quest has a marker", () => {
    const markers = markerIds();
    for (const id of questIds()) {
      expect(markers.has(id)).toBe(true);
    }
    // The seed genuinely stages more quests than the youngest board shows at once,
    // so this parity is load-bearing, not vacuous.
    expect(markerIds().size).toBeGreaterThan(visibleIds().size);
  });

  it("reveals an orb's card on the board when its island is focused from the world", () => {
    const staged = visibleIds();
    const offStage = probePicker.quests.find((quest) => !staged.has(quest.probeId));
    expect(offStage, "seed must stage at least one off-board quest").toBeDefined();

    const markup = renderToStaticMarkup(
      createElement(QuestLedger, {
        picker: probePicker,
        pickedProbeIds: [],
        focusedProbeId: offStage!.probeId,
        onTogglePick: () => undefined,
        onReturn: () => undefined,
        onFocus: () => undefined,
      }),
    );

    // Focusing an off-stage orb must surface its card so the pick is reachable from the board too.
    expect(boardProbeIds(markup).has(offStage!.probeId)).toBe(true);
  });

  it("keeps an off-board quest picked from the world reachable on the board", () => {
    const staged = visibleIds();
    const offStage = probePicker.quests.find((quest) => !staged.has(quest.probeId))!;

    const markup = renderToStaticMarkup(
      createElement(QuestLedger, {
        picker: probePicker,
        pickedProbeIds: [offStage.probeId],
        focusedProbeId: null,
        onTogglePick: () => undefined,
        onReturn: () => undefined,
        onFocus: () => undefined,
      }),
    );

    // A quest picked via a 3D orb must have a matching board card (not just a tray chip).
    expect(boardProbeIds(markup).has(offStage.probeId)).toBe(true);
  });

  it("offers a see-all affordance and stays staged by default", () => {
    const markup = renderToStaticMarkup(createElement(QuestLedger, { picker: probePicker }));
    const board = boardProbeIds(markup);

    // Default (nothing focused/picked): the board is still staged to the age-band count,
    // but every off-stage quest is reachable behind the disclosure.
    expect(markup.match(/data-quest-card="true"/g)).toHaveLength(probePicker.visibleQuests.length);
    for (const id of visibleIds()) {
      expect(board.has(id)).toBe(true);
    }
    expect(markup).toContain(`See all ${probePicker.quests.length} quests`);
    // The affordance must not read as another pickable quest.
    expect((markup.match(/aria-pressed="false"/g) ?? []).length).toBe(
      probePicker.visibleQuests.length,
    );
  });
});

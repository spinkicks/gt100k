import { buildLedgerView } from "@gt100k/evidence-explorer-view";
import { describe, expect, it } from "vitest";
import {
  actorChipView,
  consentLabel,
  headerBadge,
  panelById,
  payloadRows,
  transformOriginFor,
} from "../components/inspector-model.js";
import { buildSyntheticExplorerView } from "../components/synthetic-view.js";

/**
 * U4 drill-down inspector + Ledger parity (UE038–UE040, §U5.8 / §U5.12, SC-E09/SC-E10). The Inspector
 * and the accessible Ledger both render the SAME `LedgerView.tree[].panel`, so these tests pin the pure
 * presentation model against the real synthetic view: panel completeness, the human-owned seal / cited
 * ribbon wording, and the SC-E09 invariant that nothing anywhere reads as an accusation.
 */
const NO_ACCUSATION = /accus|blame|cheat|plagiar|guilt|fraud|suspect|dishonest/i;

describe("U4 inspector model — panels, authority, parity", () => {
  const view = buildSyntheticExplorerView();
  const ledger = buildLedgerView(view);

  it("every node has a panel with the full described field set (§U5.8)", () => {
    // Tree ↔ nodes id-parity (SC-E10): the Ledger describes every node the constellation draws.
    expect(ledger.tree.map((t) => t.id).sort()).toEqual([...view.nodes].map((n) => n.id).sort());
    for (const item of ledger.tree) {
      const p = item.panel;
      expect(p.id).toBeTruthy();
      expect(p.actor.kind).toBeTruthy();
      expect(typeof p.timestamp).toBe("string");
      expect(Array.isArray(p.inputs)).toBe(true);
      expect(p.consentScope.scope).toBeTruthy();
      expect(p.payload).toBeTypeOf("object");
    }
  });

  it("a grade Outcome reads as human-owned with its named owner (UE039, scenario 2)", () => {
    const outcome = ledger.tree.find((t) => t.type === "Outcome" && t.panel.isHumanOwned);
    expect(outcome).toBeDefined();
    const badge = headerBadge(outcome!.panel);
    expect(badge.kind).toBe("human-owned");
    if (badge.kind === "human-owned") {
      expect(badge.text.toLowerCase()).toContain("human-owned");
      expect(outcome!.panel.humanOwner).toBeTruthy();
      expect(badge.text).toContain(outcome!.panel.humanOwner!);
    }
    // A human-owned outcome is never authored by a model.
    expect(outcome!.panel.actor.kind).not.toBe("model");
  });

  it("a model Assistance reads as declared, cited supporting evidence — never an accusation (UE039, scenario 1)", () => {
    const assist = ledger.tree.find(
      (t) => t.type === "Assistance" && t.panel.actor.kind === "model",
    );
    expect(assist).toBeDefined();
    expect(assist!.panel.isCitedAssistance).toBe(true);
    const badge = headerBadge(assist!.panel);
    expect(badge.kind).toBe("cited");
    if (badge.kind === "cited") {
      expect(badge.text.toLowerCase()).toContain("cited");
      expect(badge.text.toLowerCase()).toContain("supporting evidence");
      expect(badge.text).not.toMatch(NO_ACCUSATION);
    }
  });

  it("no accusation language anywhere in the ledger (SC-E09 / §U8.14)", () => {
    for (const item of ledger.tree) {
      expect(item.accessibleName).not.toMatch(NO_ACCUSATION);
      const badge = headerBadge(item.panel);
      if (badge.kind !== "none") expect(badge.text).not.toMatch(NO_ACCUSATION);
      for (const [k, v] of payloadRows(item.panel)) {
        expect(k).not.toMatch(NO_ACCUSATION);
        expect(v).not.toMatch(NO_ACCUSATION);
      }
    }
  });

  it("the actor chip is neutral: model → 'AI model', human → 'Human'", () => {
    const model = ledger.tree.find((t) => t.panel.actor.kind === "model")!.panel.actor;
    expect(actorChipView(model)).toMatchObject({ kind: "model", kindLabel: "AI model" });
    expect(actorChipView(model).ref).toBeTruthy();

    const human = ledger.tree.find((t) => t.panel.actor.kind === "human")!.panel.actor;
    expect(actorChipView(human).kindLabel).toBe("Human");
  });

  it("consentLabel + payloadRows render the type-specific fields", () => {
    const first = ledger.tree[0]!.panel;
    expect(consentLabel(first)).toContain(first.consentScope.scope);
    // At least one node carries a non-empty payload the inspector can list.
    expect(ledger.tree.some((t) => payloadRows(t.panel).length > 0)).toBe(true);
  });
});

describe("U4 inspector model — selection + origin (pure)", () => {
  const view = buildSyntheticExplorerView();
  const ledger = buildLedgerView(view);

  it("panelById resolves a node's panel and is null-safe", () => {
    const id = ledger.tree[0]!.id;
    expect(panelById(ledger, id)?.id).toBe(id);
    expect(panelById(ledger, null)).toBeNull();
    expect(panelById(ledger, "not-a-real-id")).toBeNull();
  });

  it("transformOriginFor is origin-aware, centring without a pick origin", () => {
    expect(transformOriginFor(null, { left: 0, top: 0 })).toBe("50% 50%");
    expect(transformOriginFor({ x: 120, y: 80 }, null)).toBe("50% 50%");
    expect(transformOriginFor({ x: 120, y: 80 }, { left: 100, top: 50 })).toBe("20px 30px");
  });
});

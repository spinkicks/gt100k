import {
  buildExplorerView,
  buildFixtureGraph,
  buildLedgerView,
  buildVerificationView,
} from "@gt100k/evidence-explorer-view";
import { NodeCryptoHasher } from "@gt100k/evidence-hash-node";
import { DeterministicStubVerifier } from "@gt100k/evidence-verifier-stub";
import { describe, expect, it } from "vitest";

/**
 * Accessible Provenance Ledger view-model (§U5.12 / §U12 / SC-E10). The Ledger is the parallel
 * DOM: every node → a `role="tree"` item with an accessible name; every timeline beat → a list
 * item; every verification step → a status. Parity with the constellation is by construction —
 * both consume the one `ExplorerView`. Also carries the UX4 drill-down panel per node (id/actor/
 * tool/inputs/timestamp/consent/payload; human-owned grade; cited model assistance; no accusation).
 */
describe("buildLedgerView", () => {
  const hasher = new NodeCryptoHasher();
  const verifier = new DeterministicStubVerifier();

  const buildView = () => {
    const bundle = buildFixtureGraph(hasher);
    return { view: buildExplorerView(bundle.graph, bundle), bundle };
  };

  const buildVerification = async () => {
    const bundle = buildFixtureGraph(hasher);
    const verifierResult = await verifier.verify(bundle.graph, hasher);
    return buildVerificationView(bundle.graph, verifierResult, hasher, {
      subjectDigest: bundle.subjectDigest,
    });
  };

  it("tree has one item per node — parity with the constellation (SC-E10)", () => {
    const { view } = buildView();
    const ledger = buildLedgerView(view);
    expect(ledger.tree.map((t) => t.id)).toEqual(view.nodes.map((n) => n.id));
    expect(ledger.tree).toHaveLength(view.nodes.length);
  });

  it("every tree item has an accessible name = type + label + state + actor + marker", () => {
    const { view } = buildView();
    const ledger = buildLedgerView(view);
    for (const item of ledger.tree) {
      expect(item.accessibleName.length).toBeGreaterThan(0);
      expect(item.accessibleName).toContain(item.type);
      expect(item.accessibleName).toContain(item.label);
      // actor is always named (human display name or pseudonymous ref).
      expect(item.accessibleName).toContain(item.panel.actor.label);
    }
  });

  it("each node panel is complete: id/actor/inputs/timestamp/consent/payload (UX4 test)", () => {
    const { view } = buildView();
    const ledger = buildLedgerView(view);
    for (const item of ledger.tree) {
      const p = item.panel;
      expect(p.id).toBe(item.id);
      expect(p.actor.kind).toBeTruthy();
      expect(p.actor.ref).toBeTruthy();
      expect(Array.isArray(p.inputs)).toBe(true);
      expect(p.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(p.consentScope.scope).toBeTruthy();
      expect(typeof p.payload).toBe("object");
    }
    // A node that used a tool surfaces its tool/version in the panel.
    const withTool = ledger.tree.find((t) => t.panel.tool !== undefined);
    expect(withTool).toBeDefined();
    expect(withTool?.panel.tool?.name).toBeTruthy();
    expect(withTool?.panel.tool?.version).toBeTruthy();
  });

  it("a grade Outcome panel is human-owned with its named owner (SC-E09/E10)", () => {
    const { view } = buildView();
    const ledger = buildLedgerView(view);
    const outcome = ledger.tree.find((t) => t.type === "Outcome");
    expect(outcome).toBeDefined();
    expect(outcome?.panel.isHumanOwned).toBe(true);
    expect(outcome?.panel.humanOwner).toBe("Human grader");
    expect(outcome?.accessibleName).toContain("human-owned");
    expect(outcome?.accessibleName).toContain("Human grader");
  });

  it("a model Assistance panel is cited/neutral — declared, never accused", () => {
    const { view } = buildView();
    const ledger = buildLedgerView(view);
    const assist = ledger.tree.find((t) => t.type === "Assistance");
    expect(assist).toBeDefined();
    expect(assist?.panel.isCitedAssistance).toBe(true);
    expect(assist?.panel.actor.kind).toBe("model");
    expect(assist?.panel.actor.tone).toBe("model");
    expect(assist?.accessibleName.toLowerCase()).toContain("cited");
  });

  it("exposes NO accusation / blame / gamified field anywhere in the ledger", () => {
    const { view } = buildView();
    const ledger = buildLedgerView(view);
    const serialized = JSON.stringify(ledger);
    expect(/accus|blame|cheat|plagiar/i.test(serialized)).toBe(false);
    expect(
      /\b(price|currency|leaderboard|percentile|streak|countdown|urgency|rarity)\b/.test(
        serialized,
      ),
    ).toBe(false);
    // No `model` actor is ever the owner of a human-owned outcome.
    for (const item of ledger.tree) {
      if (item.panel.isHumanOwned) expect(item.panel.actor.kind).toBe("human");
    }
  });

  it("timeline has one list item per beat, positions 1..count monotonic", () => {
    const { view } = buildView();
    const ledger = buildLedgerView(view);
    expect(ledger.timeline).toHaveLength(view.growthTimeline.beats.length);
    expect(ledger.timeline.map((t) => t.nodeId)).toEqual(
      view.growthTimeline.beats.map((b) => b.nodeId),
    );
    ledger.timeline.forEach((t, i) => {
      expect(t.position).toBe(i + 1);
      expect(t.birthOrder).toBe(view.growthTimeline.beats[i]?.birthOrder);
      expect(t.label.length).toBeGreaterThan(0);
    });
  });

  it("folds an optional verification block: one status per step + a seal region", async () => {
    const { view } = buildView();
    const verification = await buildVerification();
    const ledger = buildLedgerView(view, verification);
    expect(ledger.verification).toBeDefined();
    expect(ledger.verification?.steps.map((s) => s.id)).toEqual(
      verification.steps.map((s) => s.id),
    );
    for (const step of ledger.verification?.steps ?? []) {
      expect(step.statusText.length).toBeGreaterThan(0);
    }
    expect(ledger.verification?.sealState).toBe(verification.sealState);
    expect(ledger.verification?.sealText.length).toBeGreaterThan(0);
    // The stub step is marked non-production and does not block the seal.
    const stub = ledger.verification?.steps.find((s) => s.id === "transparency-log-stub");
    expect(stub?.nonProduction).toBe(true);
    expect(ledger.verification?.sealState).toBe("verified");
  });

  it("without a verification argument the block is omitted (baseline unchanged)", () => {
    const { view } = buildView();
    const ledger = buildLedgerView(view);
    expect(ledger.verification).toBeUndefined();
    expect(ledger.milestoneRef).toBe(view.milestoneRef);
  });

  it("is deterministic — two builds are byte-identical", () => {
    const { view } = buildView();
    expect(JSON.stringify(buildLedgerView(view))).toBe(JSON.stringify(buildLedgerView(view)));
  });
});

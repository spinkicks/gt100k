/**
 * Following a curated link has to count.
 *
 * Only eight of the forty-four pursuits have a game in the product. For the other thirty-six, the
 * one act a child can perform is opening a link on the shelf. Until this landed, that act was
 * recorded faithfully and then dropped at the firewall, because `follow-source` mapped to no
 * work-mode and the interaction was tagged with the pursuit id rather than anything the catalogue
 * knew. Four fifths of the wall could not produce a single unit of evidence.
 *
 * These tests are the guard on that. If `follow-source` ever stops resolving, most of the
 * catalogue silently becomes decorative again and nothing else in the suite would notice.
 */
import { describe, expect, it } from "vitest";

import { deriveSignals } from "../src/pipeline.js";
import type { Interaction } from "../src/model.js";
import type { Artifact } from "@gt100k/two-axis-tagging";

/** A curated resource as the catalogue sees it: a domain, and the modes it affords. */
const potteryVideo: Artifact = {
  id: "res-pottery-throwing",
  domainPath: ["making-engineering", "handcraft"],
  affordedModes: ["build"],
  kind: "resource",
  source: "gold",
  origin: "seed",
  tagConfidence: 1,
  tagStatus: "TRUSTED",
};

/** Two modes, to prove the resource decides which and not the verb. */
const potteryDoc: Artifact = {
  id: "res-pottery-history",
  domainPath: ["making-engineering", "handcraft"],
  affordedModes: ["investigate", "build"],
  kind: "resource",
  source: "gold",
  origin: "seed",
  tagConfidence: 1,
  tagStatus: "TRUSTED",
};

const catalog = new Map([
  [potteryVideo.id, potteryVideo],
  [potteryDoc.id, potteryDoc],
]);

const follow = (artifactId: string, day: number): Interaction => ({
  kidId: "kid-1",
  artifactId,
  actionType: "follow-source",
  timestamp: `2026-08-${String(day).padStart(2, "0")}T15:00:00.000Z`,
  prompted: false,
  sessionId: `s${day}`,
});

describe("a followed link becomes evidence", () => {
  it("resolves to a cell at all", () => {
    const { cellEvents } = deriveSignals({ interactions: [follow(potteryVideo.id, 1)], catalog });
    expect(cellEvents.length).toBeGreaterThan(0);
    expect(cellEvents[0]?.domainPath).toEqual(["making-engineering", "handcraft"]);
  });

  it("takes its mode from the resource, not from the verb", () => {
    // A follow says only that the child left to learn more. What kind of work that is belongs to
    // the thing they opened, and the resource is the only party that knows.
    const { cellEvents } = deriveSignals({ interactions: [follow(potteryVideo.id, 1)], catalog });
    expect(cellEvents.every((e) => e.mode === "build")).toBe(true);
  });

  it("lets a resource afford more than one mode", () => {
    const { cellEvents } = deriveSignals({ interactions: [follow(potteryDoc.id, 1)], catalog });
    const modes = new Set(cellEvents.map((e) => e.mode));
    expect(modes.size).toBeGreaterThan(1);
  });

  it("produces a cross-day return when the child comes back on a later day", () => {
    // THE ONE THAT MATTERS. Durable interest is a child returning unprompted days later, and for a
    // link-only pursuit this is the only path to it.
    const { cellEvents } = deriveSignals({
      interactions: [
        follow(potteryVideo.id, 1),
        follow(potteryVideo.id, 6),
        follow(potteryDoc.id, 11),
      ],
      catalog,
    });
    expect(cellEvents.some((e) => e.kind === "cross_day_return")).toBe(true);
  });

  it("is never dropped as an unresolved action or an unknown artifact", () => {
    const { dropped } = deriveSignals({
      interactions: [follow(potteryVideo.id, 1), follow(potteryDoc.id, 2)],
      catalog,
    });
    for (const r of dropped) {
      expect(r.reason).not.toBe("unresolved-action");
      expect(r.reason).not.toBe("unknown-artifact");
    }
  });

  it("is still dropped when the catalogue does not know the thing followed", () => {
    // Attribution has to be earned. A follow tagged with a pursuit id, which is what the wall used
    // to send, resolves to nothing and must stay dropped rather than land on a guessed cell.
    const { cellEvents, dropped } = deriveSignals({
      interactions: [follow("pottery", 1)],
      catalog,
    });
    expect(cellEvents).toHaveLength(0);
    expect(dropped.some((r) => r.reason === "unknown-artifact")).toBe(true);
  });
});

import { existsSync, readFileSync } from "node:fs";
import {
  CATALOG,
  FIXTURE,
  type InitialArenaView,
  TIERS,
  buildArenaView,
  createSyntheticMasteryFeed,
} from "@gt100k/arena-world";
import { describe, expect, it, vi } from "vitest";
import { createSyntheticCohortBase } from "./view-fixture";

const APP_ROOT = new URL("../../../apps/arena/", import.meta.url);

function appFile(relativePath: string): URL {
  return new URL(relativePath, APP_ROOT);
}

function readAppFile(relativePath: string): string {
  const fileUrl = appFile(relativePath);
  return existsSync(fileUrl) ? readFileSync(fileUrl, "utf8") : "";
}

async function importAppModule<T>(relativePath: string): Promise<Partial<T>> {
  const fileUrl = appFile(relativePath);
  if (!existsSync(fileUrl)) return {};
  return import(/* @vite-ignore */ fileUrl.href) as Promise<T>;
}

async function importAppDependency<T>(relativePath: string): Promise<T> {
  return import(/* @vite-ignore */ appFile(`node_modules/${relativePath}`).href) as Promise<T>;
}

function buildView(): InitialArenaView {
  return buildArenaView({
    world: FIXTURE,
    signals: createSyntheticMasteryFeed(),
    tierTable: TIERS,
    catalog: CATALOG,
    avatar: { learnerRef: "learner-synthetic-001", equipped: [] },
    base: createSyntheticCohortBase(),
    caps: {
      webgl2: true,
      webgl1: true,
      prefersReducedMotion: false,
      deviceMemoryGB: 8,
      hardwareConcurrency: 8,
    },
    options: { ageBand: "9-11", reducedMotion: false, plainMode: false },
  });
}

interface LedgerEntry {
  nodeId: string;
  landmark: string;
  state: "locked" | "available" | "unlocked";
  region: string;
  regionLabel: string;
  accessibleName: string;
  icon: string;
}

interface LedgerTreeCommand {
  nextIndex: number;
  activate: boolean;
}

interface LedgerModule {
  default: (props: {
    view: InitialArenaView;
    eventBus: { emit(name: "focus-node", payload: { nodeId: string }): void };
  }) => unknown;
  buildLedgerEntries(view: InitialArenaView): LedgerEntry[];
  resolveLedgerTreeCommand(
    currentIndex: number,
    key: string,
    itemCount: number,
  ): LedgerTreeCommand | null;
}

describe("arena P1 accessible Ledger", () => {
  it("derives every node label and state from the same ArenaView in declaration order", async () => {
    const module = await importAppModule<LedgerModule>("app/ledger/ArenaLedger.tsx");

    expect(module.default).toBeTypeOf("function");
    expect(module.buildLedgerEntries).toBeTypeOf("function");
    if (!module.buildLedgerEntries) return;

    const entries = module.buildLedgerEntries(buildView());

    expect(entries.map(({ nodeId, accessibleName }) => ({ nodeId, accessibleName }))).toEqual([
      { nodeId: "count-cove", accessibleName: "Counting Lighthouse, unlocked, Numbers Coast" },
      { nodeId: "add-atoll", accessibleName: "Abacus Jetty, unlocked, Numbers Coast" },
      {
        nodeId: "place-value-point",
        accessibleName: "Tide-Pool Terraces, available, Numbers Coast",
      },
      { nodeId: "observe-overlook", accessibleName: "Gear Overlook, unlocked, Tinker Bluffs" },
      {
        nodeId: "measure-mesa",
        accessibleName: "Gadget Workshop, unlocked, Tinker Bluffs",
      },
      { nodeId: "phoneme-falls", accessibleName: "Whispering Falls, available, Story Vale" },
      { nodeId: "blend-bay", accessibleName: "Book-Root Forest, locked, Story Vale" },
      {
        nodeId: "letter-landing",
        accessibleName: "Letter Landing Field, available, Wordwind Reach",
      },
      {
        nodeId: "sentence-summit",
        accessibleName: "The Spelling Spires, locked, Wordwind Reach",
      },
    ]);
    expect(entries).toHaveLength(buildView().nodeStates.length);
    expect(new Set(entries.map(({ icon }) => icon)).size).toBe(3);
  });

  it("renders a named tree with one roving tab stop and visible color-independent state text", async () => {
    const module = await importAppModule<LedgerModule>("app/ledger/ArenaLedger.tsx");
    expect(module.default).toBeTypeOf("function");
    if (!module.default) return;

    const [{ createElement }, { renderToStaticMarkup }] = await Promise.all([
      importAppDependency<{
        createElement(
          type: LedgerModule["default"],
          props: Parameters<LedgerModule["default"]>[0],
        ): unknown;
      }>("react/index.js"),
      importAppDependency<{ renderToStaticMarkup(element: unknown): string }>(
        "react-dom/server.node.js",
      ),
    ]);

    const markup = renderToStaticMarkup(
      createElement(module.default, {
        view: buildView(),
        eventBus: { emit: vi.fn() },
      }),
    );

    expect(markup).toContain('role="tree"');
    expect(markup.match(/role="treeitem"/g)).toHaveLength(9);
    expect(markup.match(/tabindex="0"/g)).toHaveLength(2);
    expect(markup.match(/tabindex="-1"/g)).toHaveLength(17);
    expect(markup).toContain('aria-label="The Spelling Spires, locked, Wordwind Reach"');
    expect(markup).toContain("Unlocked");
    expect(markup).toContain("Available");
    expect(markup).toContain("Locked");
    expect(markup).toContain("Wordwind Reach");
  });

  it("maps Arrow, Home, End, and Enter keys to deterministic tree commands", async () => {
    const module = await importAppModule<LedgerModule>("app/ledger/ArenaLedger.tsx");
    expect(module.resolveLedgerTreeCommand).toBeTypeOf("function");
    if (!module.resolveLedgerTreeCommand) return;

    expect(module.resolveLedgerTreeCommand(0, "ArrowDown", 9)).toEqual({
      nextIndex: 1,
      activate: false,
    });
    expect(module.resolveLedgerTreeCommand(8, "ArrowDown", 9)).toEqual({
      nextIndex: 8,
      activate: false,
    });
    expect(module.resolveLedgerTreeCommand(0, "ArrowUp", 9)).toEqual({
      nextIndex: 0,
      activate: false,
    });
    expect(module.resolveLedgerTreeCommand(4, "Home", 9)).toEqual({
      nextIndex: 0,
      activate: false,
    });
    expect(module.resolveLedgerTreeCommand(4, "End", 9)).toEqual({
      nextIndex: 8,
      activate: false,
    });
    expect(module.resolveLedgerTreeCommand(4, "Enter", 9)).toEqual({
      nextIndex: 4,
      activate: true,
    });
    expect(module.resolveLedgerTreeCommand(4, "Tab", 9)).toBeNull();
    expect(module.resolveLedgerTreeCommand(0, "ArrowDown", 0)).toBeNull();
  });

  it("wires keyboard and pointer activation to scene focus while preserving visible focus", () => {
    const component = readAppFile("app/ledger/ArenaLedger.tsx");
    const styles = readAppFile("app/ledger/ArenaLedger.module.css");
    const canvas = readAppFile("app/scene/ArenaCanvas.tsx");

    expect(component).toContain("onKeyDown");
    expect(component).toContain("onClick");
    expect(component).toContain('eventBus.emit("focus-node"');
    expect(component).toContain("itemRefs.current[command.nextIndex]?.focus()");
    expect(styles).toContain(":focus-visible");
    expect(styles).toContain("var(--focus)");
    expect(canvas).toContain('aria-hidden="true"');
    expect(canvas).toContain("tabIndex={-1}");
  });
});

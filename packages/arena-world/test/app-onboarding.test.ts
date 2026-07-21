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

interface OnboardingBeat {
  id: "this-is-you" | "light-a-path" | "your-way";
  anchor: "avatar" | "available-node" | "controls";
  title: string;
  body: string;
}

interface OnboardingStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

interface OnboardingInputRecord {
  type: "pointerdown" | "keydown" | "wheel" | "click";
  timeStamp: number;
  repeat?: boolean;
}

interface OnboardingLedgerState {
  beat: OnboardingBeat;
  step: number;
  total: number;
  onDismiss(): void;
}

interface OnboardingModule {
  default: (props: {
    activeBeatIndex: number | null;
    reducedMotion: boolean;
    onAdvance(): void;
  }) => unknown;
  ONBOARDING_BEATS: readonly OnboardingBeat[];
  ONBOARDING_INPUT_EVENTS: readonly string[];
  ONBOARDING_STORAGE_KEY: string;
  ONBOARDING_EASE: readonly [number, number, number, number];
  nextOnboardingBeat(index: number): number | null;
  hasShownOnboarding(storage?: Pick<OnboardingStorage, "getItem">): boolean;
  markOnboardingShown(storage?: Pick<OnboardingStorage, "setItem">): void;
  shouldAdvanceOnboardingInput(
    input: OnboardingInputRecord,
    previous?: OnboardingInputRecord,
  ): boolean;
  installOnboardingInputListeners(target: EventTarget, onAdvance: () => void): () => void;
}

interface HudModule {
  default: (props: {
    view: InitialArenaView;
    catalog: typeof CATALOG;
    eventBus: { emit(name: "equip-cosmetic", payload: { cosmeticId: string }): void };
    onOpenOnboarding(): void;
  }) => unknown;
}

interface LedgerModule {
  default: (props: {
    view: InitialArenaView;
    catalog: typeof CATALOG;
    eventBus: {
      emit(
        name: "focus-node" | "equip-cosmetic",
        payload: { nodeId: string } | { cosmeticId: string },
      ): void;
    };
    onboarding?: OnboardingLedgerState;
  }) => unknown;
}

function buildView(reducedMotion = false): InitialArenaView {
  return buildArenaView({
    world: FIXTURE,
    signals: createSyntheticMasteryFeed(),
    tierTable: TIERS,
    catalog: CATALOG,
    avatar: { learnerRef: "learner-synthetic-001", equipped: [] },
    caps: {
      webgl2: true,
      webgl1: true,
      prefersReducedMotion: reducedMotion,
      deviceMemoryGB: 8,
      hardwareConcurrency: 8,
    },
    options: { ageBand: "9-11", reducedMotion, plainMode: false },
  });
}

describe("arena P3 first-run onboarding", () => {
  it("defines the exact ordered three-beat guide and versioned shown-once contract", async () => {
    const onboarding = await importAppModule<OnboardingModule>("app/hud/Onboarding.tsx");

    expect(onboarding.ONBOARDING_BEATS).toEqual([
      {
        id: "this-is-you",
        anchor: "avatar",
        title: "This is you",
        body: "Your Spark travels the islands with you.",
      },
      {
        id: "light-a-path",
        anchor: "available-node",
        title: "Light a path",
        body: "Choose an available landmark. Show what you know at its gate to light the beacon.",
      },
      {
        id: "your-way",
        anchor: "controls",
        title: "Your way",
        body: "Use Plain mode or the Arena Ledger any time. Standings stay off unless you choose them.",
      },
    ]);
    expect(onboarding.ONBOARDING_STORAGE_KEY).toBe("gt100k.arena.onboarding.v1");
    expect(onboarding.ONBOARDING_INPUT_EVENTS).toEqual([
      "pointerdown",
      "keydown",
      "wheel",
      "click",
    ]);
    expect(onboarding.ONBOARDING_EASE).toEqual([0.23, 1, 0.32, 1]);
    expect(onboarding.nextOnboardingBeat).toBeTypeOf("function");
    if (!onboarding.nextOnboardingBeat) return;

    expect([0, 1, 2].map(onboarding.nextOnboardingBeat)).toEqual([1, 2, null]);
  });

  it("coalesces held or continuous input while leaving the underlying action untouched", async () => {
    const onboarding = await importAppModule<OnboardingModule>("app/hud/Onboarding.tsx");

    expect(onboarding.shouldAdvanceOnboardingInput).toBeTypeOf("function");
    expect(onboarding.installOnboardingInputListeners).toBeTypeOf("function");
    if (!onboarding.shouldAdvanceOnboardingInput || !onboarding.installOnboardingInputListeners) {
      return;
    }

    expect(
      onboarding.shouldAdvanceOnboardingInput({
        type: "keydown",
        timeStamp: 10,
        repeat: true,
      }),
    ).toBe(false);
    expect(
      onboarding.shouldAdvanceOnboardingInput(
        { type: "wheel", timeStamp: 400 },
        { type: "wheel", timeStamp: 100 },
      ),
    ).toBe(false);
    expect(
      onboarding.shouldAdvanceOnboardingInput(
        { type: "wheel", timeStamp: 601 },
        { type: "wheel", timeStamp: 100 },
      ),
    ).toBe(true);
    expect(
      onboarding.shouldAdvanceOnboardingInput(
        { type: "click", timeStamp: 150 },
        { type: "pointerdown", timeStamp: 100 },
      ),
    ).toBe(false);
    expect(onboarding.shouldAdvanceOnboardingInput({ type: "click", timeStamp: 150 })).toBe(true);

    const target = new EventTarget();
    const advances: string[] = [];
    let underlyingPointerActions = 0;
    target.addEventListener("pointerdown", () => {
      underlyingPointerActions += 1;
    });
    const cleanup = onboarding.installOnboardingInputListeners(target, () =>
      advances.push("advance"),
    );
    const dispatch = (type: OnboardingInputRecord["type"], timeStamp: number, repeat = false) => {
      const event = new Event(type, { cancelable: true });
      Object.defineProperty(event, "timeStamp", { value: timeStamp });
      Object.defineProperty(event, "repeat", { value: repeat });
      target.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(false);
    };

    dispatch("pointerdown", 100);
    dispatch("click", 150);
    dispatch("keydown", 1_000);
    dispatch("keydown", 1_010, true);
    dispatch("wheel", 2_000);
    dispatch("wheel", 2_100);
    dispatch("wheel", 2_600);
    dispatch("click", 4_000);
    expect(advances).toHaveLength(5);
    expect(underlyingPointerActions).toBe(1);

    cleanup();
    dispatch("pointerdown", 5_000);
    expect(advances).toHaveLength(5);
    expect(underlyingPointerActions).toBe(2);
  });

  it("persists the first display without failing when local storage is unavailable", async () => {
    const onboarding = await importAppModule<OnboardingModule>("app/hud/Onboarding.tsx");

    expect(onboarding.hasShownOnboarding).toBeTypeOf("function");
    expect(onboarding.markOnboardingShown).toBeTypeOf("function");
    if (!onboarding.hasShownOnboarding || !onboarding.markOnboardingShown) return;

    const values = new Map<string, string>();
    const storage: OnboardingStorage = {
      getItem(key) {
        return values.get(key) ?? null;
      },
      setItem(key, value) {
        values.set(key, value);
      },
    };

    expect(onboarding.hasShownOnboarding(storage)).toBe(false);
    onboarding.markOnboardingShown(storage);
    expect(onboarding.hasShownOnboarding(storage)).toBe(true);
    expect(values).toEqual(new Map([["gt100k.arena.onboarding.v1", "shown"]]));

    const unavailable = {
      getItem(): string | null {
        throw new Error("storage unavailable");
      },
      setItem(): void {
        throw new Error("storage unavailable");
      },
    };
    expect(onboarding.hasShownOnboarding(unavailable)).toBe(false);
    expect(() => onboarding.markOnboardingShown(unavailable)).not.toThrow();
  });

  it("renders non-modal token-driven coach marks with a static reduced-motion equivalent", async () => {
    const [onboarding, { createElement }, { renderToStaticMarkup }] = await Promise.all([
      importAppModule<OnboardingModule>("app/hud/Onboarding.tsx"),
      importAppDependency<{
        createElement<Props>(type: (props: Props) => unknown, props: Props): unknown;
      }>("react/index.js"),
      importAppDependency<{ renderToStaticMarkup(element: unknown): string }>(
        "react-dom/server.node.js",
      ),
    ]);

    expect(onboarding.default).toBeTypeOf("function");
    if (!onboarding.default) return;

    const animated = renderToStaticMarkup(
      createElement(onboarding.default, {
        activeBeatIndex: 1,
        reducedMotion: false,
        onAdvance: vi.fn(),
      }),
    );
    const reduced = renderToStaticMarkup(
      createElement(onboarding.default, {
        activeBeatIndex: 2,
        reducedMotion: true,
        onAdvance: vi.fn(),
      }),
    );

    expect(animated).toContain('data-onboarding-beat="light-a-path"');
    expect(animated).toContain('data-motion-mode="animated"');
    expect(animated).toContain('aria-hidden="true"');
    expect(animated).toContain("Step 2 of 3");
    expect(animated).toContain("Light a path");
    expect(reduced).toContain('data-onboarding-beat="your-way"');
    expect(reduced).toContain('data-motion-mode="reduced"');
    expect(reduced).toContain("Standings stay off unless you choose them.");

    const source = readAppFile("app/hud/Onboarding.tsx");
    const styles = readAppFile("app/hud/Onboarding.module.css");
    expect(source).toContain('from "motion/react"');
    expect(source).toContain('resolveMotion("onboardBeat"');
    expect(source).toContain("EASINGS.enter.css");
    expect(source).toContain("target.addEventListener");
    expect(source).toContain("target.removeEventListener");
    expect(source).toContain("passive: true");
    expect(source).not.toMatch(/preventDefault|stopPropagation/);
    expect(styles).toContain("pointer-events: none");
    const mobileStyles = styles.slice(styles.indexOf("@media (max-width: 44rem)"));
    expect(mobileStyles).toContain('.coachmark[data-anchor="avatar"]');
    expect(mobileStyles).toContain('.coachmark[data-anchor="available-node"]');
    expect(mobileStyles).toContain('.coachmark[data-anchor="controls"]');
  });

  it("wires the HUD reopen control and mirrors the active beat in the Ledger", async () => {
    const [hud, ledger, { createElement }, { renderToStaticMarkup }] = await Promise.all([
      importAppModule<HudModule>("app/hud/Hud.tsx"),
      importAppModule<LedgerModule>("app/ledger/ArenaLedger.tsx"),
      importAppDependency<{
        createElement<Props>(type: (props: Props) => unknown, props: Props): unknown;
      }>("react/index.js"),
      importAppDependency<{ renderToStaticMarkup(element: unknown): string }>(
        "react-dom/server.node.js",
      ),
    ]);

    expect(hud.default).toBeTypeOf("function");
    expect(ledger.default).toBeTypeOf("function");
    if (!hud.default || !ledger.default) return;

    const view = buildView();
    const beat = {
      id: "your-way",
      anchor: "controls",
      title: "Your way",
      body: "Use Plain mode or the Arena Ledger any time. Standings stay off unless you choose them.",
    } as const satisfies OnboardingBeat;
    const hudMarkup = renderToStaticMarkup(
      createElement(hud.default, {
        view,
        catalog: CATALOG,
        eventBus: { emit: vi.fn() },
        onOpenOnboarding: vi.fn(),
      }),
    );
    const ledgerMarkup = renderToStaticMarkup(
      createElement(ledger.default, {
        view,
        catalog: CATALOG,
        eventBus: { emit: vi.fn() },
        onboarding: { beat, step: 3, total: 3, onDismiss: vi.fn() },
      }),
    );
    const idleLedgerMarkup = renderToStaticMarkup(
      createElement(ledger.default, {
        view,
        catalog: CATALOG,
        eventBus: { emit: vi.fn() },
      }),
    );

    expect(hudMarkup).toContain('aria-label="Open arena guide"');
    expect(hudMarkup).toContain(">?</button>");
    expect(ledgerMarkup).toContain('data-onboarding-mirror="active"');
    expect(ledgerMarkup).toContain('aria-live="polite"');
    expect(ledgerMarkup).toContain("Guide · Step 3 of 3");
    expect(ledgerMarkup).toContain("Your way");
    expect(ledgerMarkup).toContain(beat.body);
    expect(ledgerMarkup).toContain("Skip guide");
    expect(idleLedgerMarkup).toContain('data-onboarding-mirror="idle"');
    expect(idleLedgerMarkup).toContain('aria-live="polite"');
    expect(idleLedgerMarkup).not.toContain("Guide · Step");

    const client = readAppFile("app/ArenaClient.tsx");
    expect(client).toContain("useArenaOnboarding");
    expect(client).toContain("<Onboarding");
    expect(client).toContain("activeBeatIndex={onboarding.activeBeatIndex}");
    expect(client).toContain("onOpenOnboarding={onboarding.open}");
    expect(client).toContain("onboarding={onboarding.ledgerState}");
  });
});

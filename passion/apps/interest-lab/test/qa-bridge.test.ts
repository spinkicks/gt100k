// @vitest-environment jsdom

import { buildReturnGrid } from "@gt100k/interest-lab";
import type { RevisableHypothesis } from "@gt100k/interest-lab";
import {
  INITIAL_ZONE_HOST_STATE,
  buildCuriosityMapView,
  buildQaSnapshot,
  zoneHostReducer,
} from "@gt100k/interest-lab-view";
import type { Qa } from "@gt100k/interest-lab-view";
import { type ComponentType, act, createElement } from "react";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import * as AppShell from "../app/InterestLabClient";

vi.mock("../app/child/QuestWorld", () => ({ QuestWorld: () => null }));
vi.mock("../app/guide/GuideConsole", () => ({ GuideConsole: () => null }));

const V1_DOMAIN_ORDER = ["sound_music", "symbols_math", "visual_design"] as const;

const insufficientHypothesis: RevisableHypothesis = {
  reading: "insufficient",
  topicSpike: null,
  workModeSpike: null,
  supporting: [],
  disconfirming: [],
  coverageGaps: [],
  nextDistinguishingProbe: null,
};

const snapshotFor = (activeZoneId: string | null): Qa => {
  const host = activeZoneId
    ? zoneHostReducer(INITIAL_ZONE_HOST_STATE, { type: "enter", zoneId: activeZoneId })
    : INITIAL_ZONE_HOST_STATE;

  return buildQaSnapshot({
    ready: true,
    host,
    map: buildCuriosityMapView([], [], { domainOrder: V1_DOMAIN_ORDER }),
    grid: buildReturnGrid([], { domainOrder: V1_DOMAIN_ORDER }),
    hypothesis: insufficientHypothesis,
    interactives: [],
  });
};

const qaBridge = (): ComponentType<{ qa: Qa }> => {
  const InterestLabQaBridge = Reflect.get(AppShell, "InterestLabQaBridge") as
    | ComponentType<{ qa: Qa }>
    | undefined;
  expect(InterestLabQaBridge).toEqual(expect.any(Function));
  return InterestLabQaBridge as ComponentType<{ qa: Qa }>;
};

let container: HTMLDivElement | null = null;
let root: Root | null = null;

beforeAll(() => {
  Reflect.set(globalThis, "IS_REACT_ACT_ENVIRONMENT", true);
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: () => ({
      matches: false,
      media: "",
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => true,
    }),
  });
  Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
    configurable: true,
    value: () => null,
  });
});

afterEach(async () => {
  if (root !== null) {
    await act(async () => root?.unmount());
  }
  root = null;
  container?.remove();
  container = null;
  Reflect.deleteProperty(window, "__qa");
});

describe("Interest Lab window.__qa bridge", () => {
  it("installs the exact initial core snapshot from the mounted app", async () => {
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);

    await act(async () => root?.render(createElement(AppShell.InterestLabClient)));

    const qa = Reflect.get(window, "__qa") as Qa | undefined;
    expect(qa).toBeDefined();
    expect(qa).toMatchObject({
      ready: true,
      error: null,
      primarySurface: "curiosity-map",
      canvas: { primary: false, hasDomAlternative: true },
      activeZoneId: null,
    });
    expect(qa?.interactives().map(({ id }) => id)).toEqual([
      "map:music",
      "map:code",
      "map:art",
      "control:time-lapse",
    ]);
    expect(qa?.stateHash()).toBe('{"activeZoneId":null,"cells":[],"reading":"insufficient"}');
  });

  it("replaces the global with live snapshots and removes its own value on unmount", async () => {
    const InterestLabQaBridge = qaBridge();
    const initial = snapshotFor(null);
    const entered = snapshotFor("music");
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);

    await act(async () => root?.render(createElement(InterestLabQaBridge, { qa: initial })));
    expect(Reflect.get(window, "__qa")).toBe(initial);

    await act(async () => root?.render(createElement(InterestLabQaBridge, { qa: entered })));
    expect(Reflect.get(window, "__qa")).toBe(entered);
    expect((Reflect.get(window, "__qa") as Qa).activeZoneId).toBe("music");

    await act(async () => root?.unmount());
    root = null;
    expect(Reflect.has(window, "__qa")).toBe(false);
  });
});

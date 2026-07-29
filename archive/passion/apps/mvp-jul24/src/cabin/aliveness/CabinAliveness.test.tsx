import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import CabinAliveness from "./CabinAliveness";
import type { ArtSize, FirelightRegions, ShaftRegion } from "./regions";

/**
 * Test environment notes, because three separate browser APIs this component depends on simply do
 * not exist in jsdom and every one of them is load-bearing:
 *
 *  - `matchMedia` is not implemented at all, so the reduced-motion preference has to be stubbed
 *    (there is no existing helper in vitest.setup.ts — it only pulls in jest-dom).
 *  - `requestAnimationFrame` exists but runs on jsdom's own timer, which makes "is a frame still
 *    scheduled?" unanswerable. It is replaced with a manual scheduler so the leak assertions can be
 *    exact rather than timing-dependent.
 *  - canvas has no backend, so `getContext` is stubbed with a recording fake. That is not only about
 *    silencing jsdom's "not implemented" noise: it is what lets the mote layer's draw calls actually
 *    be asserted here instead of only in the browser.
 */

const ART: ArtSize = { width: 1024, height: 1024 };

const FIRE: FirelightRegions = {
  core: { x: 512, y: 512, w: 200, h: 300 },
  floor: { x: 512, y: 800, w: 500, h: 240 },
  bounce: { x: 512, y: 560, w: 1400, h: 1200 },
  sconce: { x: 900, y: 400, w: 160, h: 200 },
};

const SHAFT: ShaftRegion = {
  topLeft: { x: 600, y: 300 },
  topRight: { x: 800, y: 300 },
  bottomRight: { x: 700, y: 900 },
  bottomLeft: { x: 400, y: 900 },
};

// ---------------------------------------------------------------------------
// harness

interface RafHarness {
  requested: number;
  pending: number;
  step: (ms?: number) => void;
  now: () => number;
}

function installRaf(): RafHarness {
  const pending = new Map<number, FrameRequestCallback>();
  let nextId = 1;
  let clock = 0;
  let requested = 0;
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
    requested++;
    const id = nextId++;
    pending.set(id, cb);
    return id;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => {
    pending.delete(id);
  });
  return {
    get requested() {
      return requested;
    },
    get pending() {
      return pending.size;
    },
    step(ms = 16) {
      clock += ms;
      const due = [...pending.entries()];
      pending.clear();
      for (const [, cb] of due) cb(clock);
    },
    now: () => clock,
  };
}

let reduceMotion = false;

function installMatchMedia(): void {
  const listeners = new Set<(e: MediaQueryListEvent) => void>();
  vi.stubGlobal("matchMedia", (query: string) => ({
    media: query,
    matches: query.includes("prefers-reduced-motion: reduce") && reduceMotion,
    onchange: null,
    addEventListener: (_: string, l: (e: MediaQueryListEvent) => void) => listeners.add(l),
    removeEventListener: (_: string, l: (e: MediaQueryListEvent) => void) => listeners.delete(l),
    addListener: (l: (e: MediaQueryListEvent) => void) => listeners.add(l),
    removeListener: (l: (e: MediaQueryListEvent) => void) => listeners.delete(l),
    dispatchEvent: () => false,
  }));
}

interface CanvasRecorder {
  drawImage: number;
  clearRect: number;
}
let canvas: CanvasRecorder;

function installCanvas(): void {
  canvas = { drawImage: 0, clearRect: 0 };
  const fake = {
    canvas: null,
    globalAlpha: 1,
    globalCompositeOperation: "source-over",
    fillStyle: "",
    clearRect: () => {
      canvas.clearRect++;
    },
    fillRect: () => {},
    setTransform: () => {},
    drawImage: () => {
      canvas.drawImage++;
    },
    createRadialGradient: () => ({ addColorStop: () => {} }),
  };
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
    fake as unknown as CanvasRenderingContext2D,
  );
}

/** A zero-sized element would make the mote layer skip drawing, so give the root a real box. */
function installLayout(): void {
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({
    x: 0,
    y: 0,
    width: 1024,
    height: 1024,
    top: 0,
    left: 0,
    right: 1024,
    bottom: 1024,
    toJSON: () => ({}),
  } as DOMRect);
}

let raf: RafHarness;

beforeEach(() => {
  reduceMotion = false;
  raf = installRaf();
  installMatchMedia();
  installCanvas();
  installLayout();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const el = (sel: string): HTMLElement | null => document.querySelector<HTMLElement>(sel);
const glow = (which: string): HTMLElement | null => el(`.cabin-aliveness-glow.is-${which}`);

/** Everything a frame can change, as one comparable string. */
function frameSnapshot(): string {
  const parts = ["core", "floor", "bounce", "sconce"].map((k) => {
    const node = glow(k);
    return node ? `${k}:${node.style.opacity}|${node.style.transform}` : `${k}:-`;
  });
  parts.push(`art:${el(".cabin-aliveness-art")?.style.filter ?? "-"}`);
  parts.push(`sheen:${el(".cabin-aliveness-sheen")?.style.opacity ?? "-"}`);
  parts.push(`layer:${el(".cabin-aliveness-layer")?.style.transform ?? "-"}`);
  parts.push(`draws:${canvas.drawImage}`);
  return parts.join(" ");
}

// ---------------------------------------------------------------------------

describe("structure and region placement", () => {
  test("places every emitter from the art's own pixel coordinates", () => {
    render(<CabinAliveness art={ART} firelight={FIRE} shaft={SHAFT} now={raf.now} />);
    const core = glow("core")!;
    // centre-anchored: (512 - 200/2) / 1024 = 40.234375%
    expect(Number.parseFloat(core.style.left)).toBeCloseTo(40.2344, 3);
    expect(Number.parseFloat(core.style.top)).toBeCloseTo(35.3516, 3);
    expect(Number.parseFloat(core.style.width)).toBeCloseTo(19.5313, 3);
    expect(Number.parseFloat(core.style.height)).toBeCloseTo(29.2969, 3);
    // the room bounce is authored larger than the frame, and must stay that way
    expect(Number.parseFloat(glow("bounce")!.style.width)).toBeGreaterThan(100);
  });

  test("the same regions on larger art land in the same place — nothing is in device pixels", () => {
    const { unmount } = render(<CabinAliveness art={ART} firelight={FIRE} now={raf.now} />);
    const small = glow("core")!.style.left;
    unmount();
    const doubled: FirelightRegions = {
      core: { x: 1024, y: 1024, w: 400, h: 600 },
      floor: { x: 1024, y: 1600, w: 1000, h: 480 },
      bounce: { x: 1024, y: 1120, w: 2800, h: 2400 },
    };
    render(
      <CabinAliveness art={{ width: 2048, height: 2048 }} firelight={doubled} now={raf.now} />,
    );
    expect(glow("core")!.style.left).toBe(small);
  });

  test("clips the shaft sheen to the measured quad rather than its bounding box", () => {
    render(<CabinAliveness art={ART} shaft={SHAFT} now={raf.now} />);
    const sheen = el(".cabin-aliveness-sheen")!;
    expect(sheen.style.clipPath).toBe(
      "polygon(50.00% 0.00%, 100.00% 0.00%, 75.00% 100.00%, 0.00% 100.00%)",
    );
  });

  test("omits the sconce layer for a room with only one warm source", () => {
    render(<CabinAliveness art={ART} firelight={{ ...FIRE, sconce: null }} now={raf.now} />);
    expect(glow("core")).toBeTruthy();
    expect(glow("sconce")).toBeNull();
  });

  test("renders children inside the parallax layer so hotspots track the art they point at", () => {
    render(
      <CabinAliveness art={ART} firelight={FIRE} now={raf.now}>
        <img src="/art/cabin-logic-games.png" alt="" data-testid="backdrop" />
      </CabinAliveness>,
    );
    const img = document.querySelector('[data-testid="backdrop"]')!;
    expect(img.closest(".cabin-aliveness-art")).toBeTruthy();
    expect(img.closest(".cabin-aliveness-layer")).toBeTruthy();
  });

  test("the effect layers are hidden from assistive tech, but children are not", () => {
    render(
      <CabinAliveness art={ART} firelight={FIRE} shaft={SHAFT} now={raf.now}>
        <button type="button">Chess set</button>
      </CabinAliveness>,
    );
    expect(el('[data-fx="firelight"]')?.getAttribute("aria-hidden")).toBe("true");
    expect(el('[data-fx="shaft"]')?.getAttribute("aria-hidden")).toBe("true");
    expect(el(".cabin-aliveness")?.hasAttribute("aria-hidden")).toBe(false);
    expect(document.querySelector("button")?.closest("[aria-hidden]")).toBeNull();
  });
});

describe("pointer transparency", () => {
  test("nothing in the tree is interactive or carries a pointer handler of its own", () => {
    render(<CabinAliveness art={ART} firelight={FIRE} shaft={SHAFT} now={raf.now} />);
    const root = el(".cabin-aliveness")!;
    expect(root.querySelectorAll("button, a, input, [tabindex]")).toHaveLength(0);
    for (const node of root.querySelectorAll<HTMLElement>("*")) {
      // an inline override is the only way a descendant could re-enable hit-testing
      expect(node.style.pointerEvents).toBe("");
    }
  });

  test("the stylesheet disables pointer events on the root and on both effect layers", () => {
    // vitest does not process the CSS import, so a computed-style assertion here would be vacuous;
    // the source declaration is the actual contract, and Playwright checks the computed value for
    // real in the browser.
    const css = readFileSync(resolve(__dirname, "CabinAliveness.css"), "utf8");
    const block = (selector: string): string =>
      css.slice(css.indexOf(selector)).split("}")[0] ?? "";
    expect(block(".cabin-aliveness {")).toMatch(/pointer-events:\s*none/);
    expect(block(".cabin-aliveness-fx {")).toMatch(/pointer-events:\s*none/);
  });
});

describe("animation", () => {
  test("advances the firelight, sheen and motes frame by frame", () => {
    render(<CabinAliveness art={ART} firelight={FIRE} shaft={SHAFT} now={raf.now} />);
    raf.step();
    const first = frameSnapshot();
    for (let i = 0; i < 40; i++) raf.step(33);
    const later = frameSnapshot();
    expect(later).not.toBe(first);
    expect(canvas.drawImage).toBeGreaterThan(0);
    expect(canvas.clearRect).toBeGreaterThan(1);
  });

  test("keeps the frame loop alive across many frames (one rAF pending at a time, never zero)", () => {
    render(<CabinAliveness art={ART} firelight={FIRE} now={raf.now} />);
    for (let i = 0; i < 10; i++) {
      raf.step();
      expect(raf.pending).toBe(1);
    }
  });

  test("the same clock time always produces the same frame", () => {
    const at = (timeMs: number): string => {
      canvas.drawImage = 0; // the draw tally is cumulative across mounts; the count per frame is not
      const view = render(
        <CabinAliveness art={ART} firelight={FIRE} shaft={SHAFT} timeMs={timeMs} />,
      );
      const snap = frameSnapshot();
      view.unmount();
      return snap;
    };
    expect(at(4321)).toBe(at(4321));
  });

  test("a pinned timeMs renders one frame and schedules nothing", () => {
    render(<CabinAliveness art={ART} firelight={FIRE} shaft={SHAFT} timeMs={2500} />);
    expect(raf.requested).toBe(0);
    expect(glow("core")!.style.opacity).not.toBe("");
    const before = frameSnapshot();
    raf.step(10_000);
    expect(frameSnapshot()).toBe(before);
  });

  test("different pinned times and different seeds give different frames", () => {
    const at = (props: { timeMs: number; seed?: number }): string => {
      const view = render(<CabinAliveness art={ART} firelight={FIRE} {...props} />);
      const snap = frameSnapshot();
      view.unmount();
      return snap;
    };
    expect(at({ timeMs: 0 })).not.toBe(at({ timeMs: 900 }));
    expect(at({ timeMs: 900, seed: 1 })).not.toBe(at({ timeMs: 900, seed: 2 }));
  });
});

describe("individual effect toggles", () => {
  test("firelight off removes the whole fire layer and leaves the shaft running", () => {
    render(
      <CabinAliveness
        art={ART}
        firelight={FIRE}
        shaft={SHAFT}
        effects={{ firelight: false }}
        now={raf.now}
      />,
    );
    expect(el('[data-fx="firelight"]')).toBeNull();
    expect(el('[data-fx="shaft"]')).toBeTruthy();
    raf.step();
    expect(canvas.drawImage).toBeGreaterThan(0);
  });

  test("shaft off removes the sheen and the canvas, and stops drawing", () => {
    render(
      <CabinAliveness
        art={ART}
        firelight={FIRE}
        shaft={SHAFT}
        effects={{ shaft: false }}
        now={raf.now}
      />,
    );
    expect(el(".cabin-aliveness-motes")).toBeNull();
    expect(el(".cabin-aliveness-sheen")).toBeNull();
    raf.step();
    raf.step();
    expect(canvas.drawImage).toBe(0);
    expect(glow("core")!.style.opacity).not.toBe("");
  });

  test("parallax off leaves the art untransformed, even while the cursor moves", () => {
    render(
      <CabinAliveness art={ART} firelight={FIRE} effects={{ parallax: false }} now={raf.now} />,
    );
    window.dispatchEvent(new MouseEvent("pointermove", { clientX: 10, clientY: 10 }));
    raf.step();
    expect(el(".cabin-aliveness-layer")!.style.transform).toBe("");
  });

  test("with both animated effects off, no frame loop is started at all", () => {
    // the perf-fallback path: a machine that cannot afford this should pay literally nothing for it
    render(
      <CabinAliveness
        art={ART}
        firelight={FIRE}
        shaft={SHAFT}
        effects={{ firelight: false, shaft: false }}
        now={raf.now}
      />,
    );
    expect(raf.requested).toBe(0);
    expect(raf.pending).toBe(0);
  });

  test("a room with no regions at all renders an inert overlay and never loops", () => {
    render(<CabinAliveness art={ART} now={raf.now} />);
    expect(el(".cabin-aliveness")).toBeTruthy();
    expect(el('[data-fx="firelight"]')).toBeNull();
    expect(raf.requested).toBe(0);
  });
});

describe("parallax", () => {
  test("moves the art by a few pixels only, and eases back to rest on pointer leave", () => {
    render(<CabinAliveness art={ART} firelight={FIRE} now={raf.now} />);
    const layer = el(".cabin-aliveness-layer")!;
    // the overscan is applied up front so toggling parallax never pops the zoom
    expect(layer.style.transform).toBe("scale(1.024)");

    window.dispatchEvent(new MouseEvent("pointermove", { clientX: 0, clientY: 0 }));
    raf.step();
    expect(layer.classList.contains("is-tracking")).toBe(true);
    const translate = /translate\((-?[\d.]+)%,\s*(-?[\d.]+)%\)/.exec(layer.style.transform);
    expect(translate).toBeTruthy();
    // full deflection from the far corner is 0.36% / 0.28% of the frame: ~5px and ~2.5px at 1440x900
    expect(Math.abs(Number(translate![1]))).toBeCloseTo(0.36, 3);
    expect(Math.abs(Number(translate![2]))).toBeCloseTo(0.28, 3);
    expect(Math.abs(Number(translate![1]))).toBeLessThan(1);

    window.dispatchEvent(new Event("pointerleave"));
    raf.step();
    expect(layer.classList.contains("is-tracking")).toBe(false);
    expect(layer.style.transform).toBe("scale(1.024) translate(0.000%, 0.000%)");
  });

  test("coalesces a burst of pointer moves into a single frame write", () => {
    render(<CabinAliveness art={ART} firelight={FIRE} now={raf.now} />);
    const before = raf.pending;
    for (let i = 0; i < 20; i++) {
      window.dispatchEvent(new MouseEvent("pointermove", { clientX: i * 10, clientY: i * 5 }));
    }
    // one pending write on top of the frame loop's own, no matter how many events arrived
    expect(raf.pending).toBe(before + 1);
  });

  test("drives an external element when the art lives outside this component, and restores it", () => {
    const Host: React.FC = () => {
      const ref = { current: document.getElementById("host") as HTMLElement | null };
      return <CabinAliveness art={ART} firelight={FIRE} parallaxTarget={ref} now={raf.now} />;
    };
    const host = document.createElement("div");
    host.id = "host";
    host.style.transform = "rotate(1deg)";
    document.body.append(host);

    const view = render(<Host />);
    expect(host.style.transform).toBe("scale(1.024)");
    window.dispatchEvent(new MouseEvent("pointermove", { clientX: 1440, clientY: 900 }));
    raf.step();
    expect(host.style.transform).toMatch(/translate/);
    // the internal layer is left alone when an external target is given
    expect(el(".cabin-aliveness-layer")!.style.transform).toBe("");

    view.unmount();
    expect(host.style.transform).toBe("rotate(1deg)");
    host.remove();
  });

  test("returns a borrowed breath target's filter on unmount", () => {
    const host = document.createElement("div");
    host.style.filter = "sepia(0.1)";
    document.body.append(host);
    const ref = { current: host };
    const view = render(
      <CabinAliveness art={ART} firelight={FIRE} breathTarget={ref} now={raf.now} />,
    );
    raf.step();
    expect(host.style.filter).toMatch(/brightness/);
    view.unmount();
    expect(host.style.filter).toBe("sepia(0.1)");
    host.remove();
  });
});

describe("prefers-reduced-motion: reduce", () => {
  test("never schedules a frame, and the frame is byte-identical over time", () => {
    reduceMotion = true;
    render(<CabinAliveness art={ART} firelight={FIRE} shaft={SHAFT} now={raf.now} />);

    const still = frameSnapshot();
    // a static frame is still a *lit* frame: the fire is drawn, it just does not move
    expect(glow("core")!.style.opacity).not.toBe("");
    expect(canvas.drawImage).toBeGreaterThan(0);

    for (let i = 0; i < 120; i++) raf.step(50); // six seconds of wall clock
    expect(frameSnapshot()).toBe(still);
    expect(raf.requested).toBe(0);
    expect(raf.pending).toBe(0);
  });

  test("holds still through cursor movement too", () => {
    reduceMotion = true;
    render(<CabinAliveness art={ART} firelight={FIRE} shaft={SHAFT} now={raf.now} />);
    const still = frameSnapshot();
    for (let i = 0; i < 10; i++) {
      window.dispatchEvent(new MouseEvent("pointermove", { clientX: i * 100, clientY: i * 60 }));
      raf.step();
    }
    expect(frameSnapshot()).toBe(still);
    expect(el(".cabin-aliveness-layer")!.style.transform).toBe("");
    expect(raf.requested).toBe(0);
  });

  test("marks the root so the state is inspectable from a screenshot or a test", () => {
    reduceMotion = true;
    render(<CabinAliveness art={ART} firelight={FIRE} now={raf.now} />);
    expect(el(".cabin-aliveness")!.dataset.reducedMotion).toBe("true");
  });

  test("motion is allowed when the preference is not set", () => {
    render(<CabinAliveness art={ART} firelight={FIRE} now={raf.now} />);
    expect(el(".cabin-aliveness")!.dataset.reducedMotion).toBeUndefined();
    expect(raf.requested).toBeGreaterThan(0);
  });

  test("survives a platform with no matchMedia at all, with motion on", () => {
    // jsdom's actual state, and the reason useReducedMotion guards rather than assuming
    vi.stubGlobal("matchMedia", undefined);
    expect(() => render(<CabinAliveness art={ART} firelight={FIRE} now={raf.now} />)).not.toThrow();
    expect(raf.requested).toBeGreaterThan(0);
  });
});

describe("teardown", () => {
  test("leaves no animation frame scheduled after unmount", () => {
    const view = render(<CabinAliveness art={ART} firelight={FIRE} shaft={SHAFT} now={raf.now} />);
    for (let i = 0; i < 5; i++) raf.step();
    expect(raf.pending).toBe(1);
    view.unmount();
    expect(raf.pending).toBe(0);
  });

  test("cancels a coalesced parallax write that was still in flight at unmount", () => {
    const view = render(<CabinAliveness art={ART} firelight={FIRE} now={raf.now} />);
    window.dispatchEvent(new MouseEvent("pointermove", { clientX: 500, clientY: 500 }));
    expect(raf.pending).toBe(2); // the frame loop plus the pending transform write
    view.unmount();
    expect(raf.pending).toBe(0);
  });

  test("removes every window listener, so a later event cannot touch a detached node", () => {
    const view = render(<CabinAliveness art={ART} firelight={FIRE} shaft={SHAFT} now={raf.now} />);
    const layer = el(".cabin-aliveness-layer")!;
    view.unmount();
    expect(() => {
      window.dispatchEvent(new MouseEvent("pointermove", { clientX: 300, clientY: 200 }));
      window.dispatchEvent(new Event("pointerleave"));
      window.dispatchEvent(new Event("blur"));
      window.dispatchEvent(new Event("resize"));
      raf.step();
      raf.step();
    }).not.toThrow();
    expect(raf.pending).toBe(0);
    expect(layer.style.transform).toBe(""); // restored, and never written again
  });

  test("stops the canvas loop: no further draws happen after unmount", () => {
    const view = render(<CabinAliveness art={ART} shaft={SHAFT} now={raf.now} />);
    raf.step();
    const drawn = canvas.drawImage;
    expect(drawn).toBeGreaterThan(0);
    view.unmount();
    raf.step(1000);
    raf.step(1000);
    expect(canvas.drawImage).toBe(drawn);
  });

  test("mounting and unmounting repeatedly accumulates nothing", () => {
    for (let i = 0; i < 6; i++) {
      const view = render(
        <CabinAliveness art={ART} firelight={FIRE} shaft={SHAFT} now={raf.now} />,
      );
      raf.step();
      raf.step();
      view.unmount();
      expect(raf.pending).toBe(0);
    }
  });
});

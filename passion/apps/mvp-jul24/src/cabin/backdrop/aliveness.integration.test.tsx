import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { useGame } from "../../game/store";
import { ellipseBoxPct } from "../aliveness/regions";
import CabinBackdrop from "./CabinBackdrop";
import { ART_HEIGHT, ART_WIDTH, backdropRoomFor } from "./quads.data";

/**
 * `CabinAliveness` composed into `CabinBackdrop`.
 *
 * WHAT IS AND IS NOT TESTED HERE. Both halves have their own suites — the effects are proven in
 * `aliveness/CabinAliveness.test.tsx`, the polygons in `CabinBackdrop.test.tsx` — and re-asserting
 * either from here would only duplicate them. What no single-module suite can see is the seam: the
 * coordinate space the effects are handed, the paint order of four stacked layers, and the fact
 * that the painting and the hit polygons are moved by one transform rather than two. Those are the
 * three ways this integration can be wrong while both components remain correct, so they are what
 * is below.
 *
 * The one thing that cannot be asserted in jsdom is hit testing itself: jsdom has no layout and no
 * `elementFromPoint`, so "a click at the prop's centroid lands on the prop at full parallax
 * deflection" is verified in a real browser instead. What *is* assertable here is the invariant
 * that makes it true — one transform, on one element, containing both the art and the polygons —
 * and that is strictly the more useful of the two to have in CI, because it is the thing a future
 * refactor would break.
 *
 * jsdom gaps stubbed below, all for the same reasons documented in the aliveness suite:
 * `matchMedia` does not exist, canvas has no backend, and there is no layout — so the fit
 * measurement would see a 0x0 box and scale everything to nothing.
 */

const ROOM = backdropRoomFor("logic-games")!;
const ALIVENESS = ROOM.aliveness!;

interface RafHarness {
  requested: number;
  pending: number;
  step: (ms?: number) => void;
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
      const due = [...pending.values()];
      pending.clear();
      for (const cb of due) cb(clock);
    },
  };
}

let reduceMotion = false;

function installMatchMedia(): void {
  vi.stubGlobal("matchMedia", (query: string) => ({
    media: query,
    matches: query.includes("prefers-reduced-motion: reduce") && reduceMotion,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }));
}

function installCanvas(): void {
  const fake = {
    globalAlpha: 1,
    globalCompositeOperation: "source-over",
    fillStyle: "",
    clearRect: () => {},
    fillRect: () => {},
    setTransform: () => {},
    drawImage: () => {},
    createRadialGradient: () => ({ addColorStop: () => {} }),
  };
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
    fake as unknown as CanvasRenderingContext2D,
  );
}

/**
 * A frame that is deliberately NOT the art's aspect ratio: 1200x900 is 4:3 against a 3:2 plate, so
 * `cover` scales by 0.87890625 and crops 150px of width, 75 to a side. Every number is exact in
 * binary, and — the reason for choosing a mismatch at all — an effect layer mounted on the frame
 * instead of on the cover-fitted art rect produces visibly different geometry here, where under a
 * 1:1 box the two would be indistinguishable and the assertion below would prove nothing.
 */
const FRAME_WIDTH = 1200;
const FRAME_HEIGHT = 900;
const COVER_SCALE = 0.87890625;
/** The cover rect: 1536x1024 art scaled by COVER_SCALE, centred, so 75px hangs off each side. */
const COVER_LEFT = -75;
const COVER_TOP = 0;
const COVER_RECT_WIDTH = ART_WIDTH * COVER_SCALE; // 1350
const COVER_RECT_HEIGHT = ART_HEIGHT * COVER_SCALE; // 900

function installLayout(): void {
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({
    x: 0,
    y: 0,
    width: FRAME_WIDTH,
    height: FRAME_HEIGHT,
    top: 0,
    left: 0,
    right: FRAME_WIDTH,
    bottom: FRAME_HEIGHT,
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
  useGame.getState().goToMap();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const q = <T extends Element>(root: ParentNode, sel: string): T | null =>
  root.querySelector<T>(sel);

describe("the effects are mounted over the painting", () => {
  test("a room with measured light gets the whole aliveness tree", () => {
    const { container } = render(<CabinBackdrop topic="logic-games" />);
    const layer = q<HTMLElement>(container, ".cabin-backdrop-aliveness")!;
    expect(layer).not.toBeNull();
    expect(q(layer, ".cabin-aliveness")).not.toBeNull();
    expect(q(layer, '[data-fx="firelight"]')).not.toBeNull();
    expect(q(layer, '[data-fx="shaft"]')).not.toBeNull();
    expect(q(layer, ".cabin-aliveness-motes")).not.toBeNull();
  });

  test("the effects are given the ART's coordinate space, not the frame's", () => {
    // The failure this exists to catch: mounting CabinAliveness straight onto `.cabin-backdrop`.
    // That is a positioned, full-size element and it *looks* like the right parent, but the image
    // is `object-fit: cover`, so the frame is the art only when their aspect ratios happen to
    // match. Everywhere else every glow is off its painted object by up to half the overflow, and
    // the error changes as the window is resized — the one class of bug that never shows up in a
    // screenshot taken at the size it was authored on.
    const { container } = render(<CabinBackdrop topic="logic-games" />);
    const layer = q<HTMLElement>(container, ".cabin-backdrop-aliveness")!;
    // The layer IS the cover rectangle, in real CSS pixels: the same rule the <img>'s
    // `object-fit: cover` follows, so a percentage inside it is a fraction of the painting.
    expect(layer.style.width).toBe(`${COVER_RECT_WIDTH}px`);
    expect(layer.style.height).toBe(`${COVER_RECT_HEIGHT}px`);
    expect(layer.style.left).toBe(`${COVER_LEFT}px`);
    expect(layer.style.top).toBe(`${COVER_TOP}px`);
    // Laid out, not transformed. A transform would leave the layout box at the frame's size, which
    // is what stops the mote canvas's ResizeObserver from ever firing — see the mount site.
    expect(layer.style.transform).toBe("");
    // and the effects are mounted in that box rather than in the frame
    expect(q(container, ".cabin-aliveness")!.parentElement).toBe(layer);

    // And the regions inside it really are the authored ones, as percentages of that art box.
    const core = ellipseBoxPct(ALIVENESS.firelight!.core, {
      width: ART_WIDTH,
      height: ART_HEIGHT,
    });
    const node = q<HTMLElement>(layer, ".cabin-aliveness-glow.is-core")!;
    expect(Number.parseFloat(node.style.left)).toBeCloseTo(core.left, 3);
    expect(Number.parseFloat(node.style.top)).toBeCloseTo(core.top, 3);
  });

  test("the fire's breath is written onto the painting itself", () => {
    // The art is not a child of CabinAliveness in this composition, so the brightness breath has to
    // be aimed at the <img> by ref or it lands on nothing and the room stops pulsing with the fire.
    const { container } = render(<CabinBackdrop topic="logic-games" />);
    raf.step();
    expect(q<HTMLImageElement>(container, ".cabin-backdrop-img")!.style.filter).toMatch(
      /brightness/,
    );
  });

  test("the static hearth wash gives way to the real firelight", () => {
    const { container } = render(<CabinBackdrop topic="logic-games" />);
    expect(q(container, ".cabin-backdrop-hearthlight")).toBeNull();
  });
});

describe("a room with no measured light renders the still, unchanged", () => {
  // This case used `math` while that room was unauthored. It has measured light of its own now, so
  // the case moved to `music`, which has no interior at all. The property under test is unchanged:
  // wrong regions look worse than none, because a glow on a wall the fire is not on reads as a bug.
  test("a topic with no authored interior gets no effects and no frame loop", () => {
    const { container } = render(<CabinBackdrop topic="music" />);
    expect(q(container, ".cabin-backdrop")).not.toBeNull();
    expect(q(container, ".cabin-backdrop-aliveness")).toBeNull();
    expect(q(container, ".cabin-aliveness")).toBeNull();
    // and it keeps the fallback wash, which is the only thing it ever had
    expect(q(container, ".cabin-backdrop-hearthlight")).not.toBeNull();
    expect(raf.requested).toBe(0);
  });

  test("math now has its own measured light, including a sconce Logic Games lacks", () => {
    const { container } = render(<CabinBackdrop topic="math" />);
    expect(q(container, ".cabin-backdrop-aliveness")).not.toBeNull();
    // The sconce is the emitter this plate has and the Logic Games plate does not, so it is the one
    // worth asserting: it proves the room's regions were measured rather than copied.
    expect(backdropRoomFor("math")?.aliveness?.firelight?.sconce).not.toBeNull();
    expect(backdropRoomFor("logic-games")?.aliveness?.firelight?.sconce).toBeNull();
  });

  test("`alive={false}` puts an authored room back exactly as it was", () => {
    const { container } = render(<CabinBackdrop topic="logic-games" alive={false} />);
    expect(q(container, ".cabin-backdrop-aliveness")).toBeNull();
    expect(q(container, ".cabin-backdrop-hearthlight")).not.toBeNull();
    expect(raf.requested).toBe(0);
    // props + the bookshelf, which is not gadget-backed and so is not one of `props`.
    expect(screen.getAllByRole("button")).toHaveLength(ROOM.props.length + 1);
  });

  test("each effect can be switched off on its own", () => {
    const { container, unmount } = render(
      <CabinBackdrop topic="logic-games" effects={{ firelight: false }} />,
    );
    expect(q(container, '[data-fx="firelight"]')).toBeNull();
    expect(q(container, '[data-fx="shaft"]')).not.toBeNull();
    unmount();

    const second = render(<CabinBackdrop topic="logic-games" effects={{ shaft: false }} />);
    expect(q(second.container, '[data-fx="firelight"]')).not.toBeNull();
    expect(q(second.container, ".cabin-aliveness-motes")).toBeNull();
  });
});

describe("layering: the effects must not take a single pointer event", () => {
  test("nothing in the effect tree is interactive or re-enables hit testing", () => {
    const { container } = render(<CabinBackdrop topic="logic-games" />);
    const layer = q<HTMLElement>(container, ".cabin-backdrop-aliveness")!;
    expect(layer.querySelectorAll("button, a, input, [tabindex], [role]")).toHaveLength(0);
    for (const node of layer.querySelectorAll<HTMLElement>("*")) {
      // an inline override is the only way a descendant could opt back into hit testing
      expect(node.style.pointerEvents).toBe("");
    }
  });

  test("the stylesheet turns pointer events off on the layer that sits over the painting", () => {
    // vitest does not process the CSS import, so a computed-style assertion would be vacuous here;
    // the declaration is the contract, and Playwright reads the computed value in a real browser.
    const css = readFileSync(resolve(__dirname, "CabinBackdrop.css"), "utf8");
    const block = css.slice(css.indexOf(".cabin-backdrop-aliveness {")).split("}")[0] ?? "";
    expect(block).toMatch(/pointer-events:\s*none/);
  });

  test("the hotspots paint after the effects, so the focus trace is never underneath a glow", () => {
    const { container } = render(<CabinBackdrop topic="logic-games" />);
    const effects = q(container, ".cabin-backdrop-aliveness")!;
    const hotspots = q(container, ".cabin-backdrop-hotspots")!;
    // DOCUMENT_POSITION_FOLLOWING: the SVG comes after the effects among positioned siblings, which
    // with no z-index anywhere in the stack is exactly what puts it on top.
    expect(effects.compareDocumentPosition(hotspots) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(hotspots.parentElement).toBe(effects.parentElement);
  });

  test("every prop is still clickable and still in the tab order with the effects mounted", () => {
    render(<CabinBackdrop topic="logic-games" />);
    const buttons = screen.getAllByRole("button");
    // props + the bookshelf, which sits in its own layer above the effects for the same reason.
    expect(buttons).toHaveLength(ROOM.props.length + 1);
    for (const button of buttons) expect(button.getAttribute("tabindex")).toBe("0");
    fireEvent.click(screen.getByRole("button", { name: "Chess set on the table" }));
    expect(useGame.getState().focusedGadgetId).toBe("chess");
  });
});

describe("parallax moves the painting and the hit polygons as one thing", () => {
  test("both live inside the single element the transform is written to", () => {
    const { container } = render(<CabinBackdrop topic="logic-games" />);
    const target = q<HTMLElement>(container, ".cabin-backdrop-parallax")!;
    expect(q(container, ".cabin-backdrop-img")!.closest(".cabin-backdrop-parallax")).toBe(target);
    expect(q(container, ".cabin-backdrop-hotspots")!.closest(".cabin-backdrop-parallax")).toBe(
      target,
    );
    expect(q(container, ".cabin-backdrop-aliveness")!.closest(".cabin-backdrop-parallax")).toBe(
      target,
    );
  });

  test("at full deflection exactly one element has moved, so nothing can drift apart", () => {
    const { container } = render(<CabinBackdrop topic="logic-games" />);
    const target = q<HTMLElement>(container, ".cabin-backdrop-parallax")!;
    expect(target.style.transform).toBe("scale(1.024)");

    // the far corner of the window: the largest deflection the effect can produce
    window.dispatchEvent(new MouseEvent("pointermove", { clientX: 0, clientY: 0 }));
    raf.step();

    const moved = /translate\((-?[\d.]+)%,\s*(-?[\d.]+)%\)/.exec(target.style.transform);
    expect(moved).toBeTruthy();
    expect(Math.abs(Number(moved![1]))).toBeCloseTo(0.36, 3);

    // Nothing else carries a transform of its own. This is the whole hit-testing argument: a
    // polygon and the object it points at cannot separate under a transform they share, whatever
    // its value, so the browser hit-tests the polygon exactly where the painted prop now is.
    expect(q<HTMLElement>(container, ".cabin-backdrop-img")!.style.transform).toBe("");
    expect(q<HTMLElement>(container, ".cabin-backdrop-hotspots")!.style.transform).toBe("");
    expect(q<HTMLElement>(container, ".cabin-aliveness-layer")!.style.transform).toBe("");
  });

  test("the transition the borrowed element needs is declared for it", () => {
    // CabinAliveness declares its easing on its own internal layer, which this composition does not
    // use. Without these two rules on the element it drives instead, the parallax is a hard jump
    // per pointer event — correct geometry, unusable motion. (See the CSS comment.)
    const css = readFileSync(resolve(__dirname, "CabinBackdrop.css"), "utf8");
    const block = (selector: string): string =>
      css.slice(css.indexOf(selector)).split("}")[0] ?? "";
    expect(block(".cabin-backdrop-parallax {")).toMatch(/transition:\s*transform/);
    expect(block(".cabin-backdrop-parallax.is-tracking {")).toMatch(/transition:\s*transform/);
    expect(css).toMatch(/prefers-reduced-motion: reduce/);
  });
});

describe("prefers-reduced-motion: reduce", () => {
  test("the composed room paints one lit frame and then never moves again", () => {
    reduceMotion = true;
    const { container } = render(<CabinBackdrop topic="logic-games" />);
    const core = q<HTMLElement>(container, ".cabin-aliveness-glow.is-core")!;
    // a static frame is still a lit frame: the fire is drawn, it just holds still
    expect(core.style.opacity).not.toBe("");
    const still = `${core.style.opacity}|${core.style.transform}`;

    for (let i = 0; i < 60; i++) raf.step(50);
    window.dispatchEvent(new MouseEvent("pointermove", { clientX: 0, clientY: 0 }));
    raf.step();

    expect(`${core.style.opacity}|${core.style.transform}`).toBe(still);
    expect(q<HTMLElement>(container, ".cabin-backdrop-parallax")!.style.transform).toBe("");
    expect(raf.requested).toBe(0);
    expect(q<HTMLElement>(container, ".cabin-aliveness")!.dataset.reducedMotion).toBe("true");
  });
});

describe("teardown", () => {
  test("unmounting the composed tree leaves no frame scheduled", () => {
    const view = render(<CabinBackdrop topic="logic-games" />);
    for (let i = 0; i < 5; i++) raf.step();
    expect(raf.pending).toBeGreaterThan(0);
    view.unmount();
    expect(raf.pending).toBe(0);
  });

  test("a pending parallax write is cancelled too, and no listener survives", () => {
    const view = render(<CabinBackdrop topic="logic-games" />);
    window.dispatchEvent(new MouseEvent("pointermove", { clientX: 500, clientY: 500 }));
    expect(raf.pending).toBe(2); // the frame loop, plus the coalesced transform write
    view.unmount();
    expect(raf.pending).toBe(0);
    expect(() => {
      window.dispatchEvent(new MouseEvent("pointermove", { clientX: 10, clientY: 10 }));
      window.dispatchEvent(new Event("resize"));
      raf.step();
    }).not.toThrow();
    expect(raf.pending).toBe(0);
  });

  test("the borrowed nodes are handed back as they were found", () => {
    const { container, rerender } = render(<CabinBackdrop topic="logic-games" />);
    const frame = q<HTMLElement>(container, ".cabin-backdrop-parallax")!;
    const img = q<HTMLImageElement>(container, ".cabin-backdrop-img")!;
    raf.step();
    expect(frame.style.transform).not.toBe("");
    expect(img.style.filter).not.toBe("");

    // Both are this component's own nodes rather than CabinAliveness's, so "restored" is not
    // academic: they outlive the effect whenever it is switched off at runtime, and a stale
    // `scale(1.024)` left on the frame would be a permanent 2.4% crop of the room.
    rerender(<CabinBackdrop topic="logic-games" alive={false} />);
    expect(frame.style.transform).toBe("");
    expect(img.style.filter).toBe("");
  });
});

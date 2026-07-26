import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useGame } from "../../game/store";
import { useInterest } from "../../interest/store";
import CabinBackdrop from "./CabinBackdrop";
import { quadSourceSize } from "./geometry";
import { ART_HEIGHT, ART_WIDTH, backdropRoomFor } from "./quads.data";
import { propPolygon } from "./types";

const ROOM = backdropRoomFor("logic-games")!;

beforeEach(() => {
  useGame.getState().goToMap();
  useInterest.getState().reset();
});

describe("hotspots", () => {
  it("renders one named control per authored prop plus the shelf, and nothing else focusable", () => {
    // The shelf is the room's one control that is not gadget-backed (see `ShelfProp` in types.ts and
    // src/shelf/). It is counted from the same authored data as the props rather than hard-coded, so
    // this stays a statement about the room and not about a number someone remembered.
    render(<CabinBackdrop topic="logic-games" />);
    const buttons = screen.getAllByRole("button");
    const expected = [...ROOM.props.map((p) => p.label), ROOM.shelf!.label];
    expect(buttons).toHaveLength(expected.length);
    expect(new Set(buttons.map((b) => b.getAttribute("aria-label")))).toEqual(new Set(expected));
  });

  it("names props for what they are in the painting, not for what they open", () => {
    render(<CabinBackdrop topic="logic-games" />);
    expect(screen.getByRole("button", { name: "Nonogram board on the wall" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Chess set on the table" })).toBeInTheDocument();
  });

  it("is a polygon, not a rect, carrying the authored art-pixel coordinates verbatim", () => {
    // The point of the whole engine: no percentage conversion between quads.data.ts and the DOM.
    const { container } = render(<CabinBackdrop topic="logic-games" />);
    // Nothing in the hotspot overlay is a rect — a rect there would be the axis-aligned hit box this
    // component exists to replace. (The previews do use rects, inside their own SVGs.)
    expect(container.querySelectorAll(".cabin-backdrop-hotspots rect")).toHaveLength(0);
    for (const prop of ROOM.props) {
      const polygon = container.querySelector(`polygon[data-prop="${prop.gadgetId}"]`);
      expect(polygon, prop.gadgetId).not.toBeNull();
      expect(polygon!.getAttribute("points")).toBe(
        propPolygon(prop)
          .map(([x, y]) => `${x},${y}`)
          .join(" "),
      );
    }
  });

  it("clips pointer events to the polygon interior rather than its bounding box", () => {
    // jsdom does no hit testing, so what is assertable here is that the element opts in to SVG's
    // `pointer-events: fill` rule (which makes the interior the hit region regardless of what the
    // fill paints). The real non-rectangular behaviour is verified in a browser — see
    // verify/matrix3d.verify.ts and the containsPoint assertions in quads.data.test.ts.
    const { container } = render(<CabinBackdrop topic="logic-games" />);
    const hit = container.querySelector('polygon[data-prop="nonogram"]')!;
    expect(hit.classList.contains("cabin-backdrop-hit")).toBe(true);
  });

  it("traces the outline for hover and focus instead of drawing a box", () => {
    const { container } = render(<CabinBackdrop topic="logic-games" />);
    const group = container.querySelector('g[data-kind="object"]')!;
    const polygons = [...group.querySelectorAll("polygon")];
    // hit, halo, trace — the halo and trace share the hit polygon's exact points, so the treatment
    // follows the silhouette. And they follow it in document order so plain CSS sibling selectors
    // drive them with no React state.
    expect(polygons).toHaveLength(3);
    expect(polygons[0]!.classList.contains("cabin-backdrop-hit")).toBe(true);
    expect(polygons[1]!.classList.contains("cabin-backdrop-halo")).toBe(true);
    expect(polygons[2]!.classList.contains("cabin-backdrop-trace")).toBe(true);
    expect(polygons[1]!.getAttribute("points")).toBe(polygons[0]!.getAttribute("points"));
    expect(polygons[2]!.getAttribute("points")).toBe(polygons[0]!.getAttribute("points"));
  });

  it("exposes a native tooltip whose text matches the accessible name", () => {
    const { container } = render(<CabinBackdrop topic="logic-games" />);
    const title = container.querySelector('polygon[data-prop="pipes"] title');
    expect(title?.textContent).toBe("Pipe pegboard on the back wall");
  });
});

describe("activation", () => {
  it("focuses the gadget on click, through the same store action the other backends use", () => {
    render(<CabinBackdrop topic="logic-games" />);
    fireEvent.click(screen.getByRole("button", { name: "Nonogram board on the wall" }));
    expect(useGame.getState().focusedGadgetId).toBe("nonogram");
  });

  it("activates on Enter", () => {
    render(<CabinBackdrop topic="logic-games" />);
    fireEvent.keyDown(screen.getByRole("button", { name: "Pipe pegboard on the back wall" }), {
      key: "Enter",
    });
    expect(useGame.getState().focusedGadgetId).toBe("pipes");
  });

  it("activates on Space, and prevents the page from scrolling", () => {
    render(<CabinBackdrop topic="logic-games" />);
    const target = screen.getByRole("button", { name: "Chess set on the table" });
    const event = new KeyboardEvent("keydown", { key: " ", bubbles: true, cancelable: true });
    fireEvent(target, event);
    expect(useGame.getState().focusedGadgetId).toBe("chess");
    expect(event.defaultPrevented).toBe(true);
  });

  it("ignores other keys", () => {
    render(<CabinBackdrop topic="logic-games" />);
    const target = screen.getByRole("button", { name: "Nonogram board on the wall" });
    for (const key of ["a", "Tab", "Escape", "ArrowRight"]) {
      fireEvent.keyDown(target, { key });
    }
    expect(useGame.getState().focusedGadgetId).toBeNull();
  });

  it("puts every prop in the tab order and takes focus", () => {
    render(<CabinBackdrop topic="logic-games" />);
    for (const button of screen.getAllByRole("button")) {
      expect(button.getAttribute("tabindex")).toBe("0");
    }
    const first = screen.getByRole("button", { name: "Nonogram board on the wall" });
    (first as unknown as HTMLElement).focus();
    expect(document.activeElement).toBe(first);
  });
});

describe("overlay geometry", () => {
  it("uses the art's own coordinate system as the SVG viewBox", () => {
    const { container } = render(<CabinBackdrop topic="logic-games" />);
    const svg = container.querySelector(".cabin-backdrop-hotspots")!;
    expect(svg.getAttribute("viewBox")).toBe(`0 0 ${ART_WIDTH} ${ART_HEIGHT}`);
  });

  it("scales the overlay with exactly the image's object-fit rule", () => {
    // `xMidYMid slice` IS `object-fit: cover` + the default `object-position: 50% 50%`. Pairing them
    // is what removes every opportunity for the hotspots to drift off the painting on resize.
    const { container } = render(<CabinBackdrop topic="logic-games" />);
    expect(
      container.querySelector(".cabin-backdrop-hotspots")!.getAttribute("preserveAspectRatio"),
    ).toBe("xMidYMid slice");
  });

  it("sizes the preview layer to the art so its children's units are art pixels", () => {
    const { container } = render(<CabinBackdrop topic="logic-games" />);
    const layer = container.querySelector<HTMLElement>(".cabin-backdrop-props")!;
    expect(layer.style.width).toBe(`${ART_WIDTH}px`);
    expect(layer.style.height).toBe(`${ART_HEIGHT}px`);
    // jsdom has no layout, so the measured fit is a zero scale (see useFitToElement) — the layer is
    // still present and still transformed, which is the structural contract.
    expect(layer.style.transform).toContain("scale(");
  });
});

/**
 * Preview compositing is OFF in the shipping configuration. These two groups are the reason it is a
 * flag rather than a deletion: the first pins the shipped behaviour, the second keeps the dormant
 * path under test so it cannot rot while switched off. See the `PREVIEWS_DEFAULT` comment in
 * CabinBackdrop.tsx for why it is off.
 */
describe("composited previews are off by default", () => {
  it("composites nothing at all onto the painting", () => {
    const { container } = render(<CabinBackdrop topic="logic-games" />);
    expect(container.querySelectorAll("[data-preview]")).toHaveLength(0);
  });

  it("still renders the (empty) preview layer, so the fit measurement stays live", () => {
    const { container } = render(<CabinBackdrop topic="logic-games" />);
    const layer = container.querySelector<HTMLElement>(".cabin-backdrop-props")!;
    expect(layer).not.toBeNull();
    expect(layer.children).toHaveLength(0);
    expect(layer.style.transform).toContain("scale(");
  });

  it("keeps every hotspot, so the polygons are unaffected by the preview flag", () => {
    // The distinction that matters: the previews were rejected, the perspective hit regions were not.
    const off = render(<CabinBackdrop topic="logic-games" />);
    expect(off.container.querySelectorAll(".cabin-backdrop-hit")).toHaveLength(ROOM.props.length);
    off.unmount();
    const on = render(<CabinBackdrop topic="logic-games" previews />);
    expect(on.container.querySelectorAll(".cabin-backdrop-hit")).toHaveLength(ROOM.props.length);
  });

  it("solving a gadget changes nothing on the wall while previews are off", () => {
    const { container } = render(<CabinBackdrop topic="logic-games" />);
    const before = container.innerHTML;
    act(() => useInterest.getState().recordSolve("nonogram"));
    expect(container.innerHTML).toBe(before);
  });
});

describe("composited previews, when switched back on", () => {
  it("composites one preview per flat prop that has a renderer", () => {
    const { container } = render(<CabinBackdrop topic="logic-games" previews />);
    const previews = [...container.querySelectorAll("[data-preview]")].map((el) =>
      el.getAttribute("data-preview"),
    );
    expect(previews.sort()).toEqual(["mirror", "nonogram", "pipes"]);
  });

  it("composites nothing onto the object prop or onto a flat prop with no renderer", () => {
    const { container } = render(<CabinBackdrop topic="logic-games" previews />);
    expect(container.querySelector('[data-preview="chess"]')).toBeNull();
  });

  it("warps each preview with a projective matrix3d, sized to the quad's source rectangle", () => {
    const { container } = render(<CabinBackdrop topic="logic-games" previews />);
    for (const prop of ROOM.props) {
      if (prop.kind !== "flat") continue;
      const el = container.querySelector<HTMLElement>(`[data-preview="${prop.gadgetId}"]`);
      if (el === null) continue;
      const { width, height } = quadSourceSize(prop.quad);
      expect(el.style.width, prop.gadgetId).toBe(`${width}px`);
      expect(el.style.height, prop.gadgetId).toBe(`${height}px`);
      expect(el.style.transform, prop.gadgetId).toMatch(/^matrix3d\(/);
      const args = el.style.transform.slice("matrix3d(".length, -1).split(", ").map(Number);
      expect(args, prop.gadgetId).toHaveLength(16);
      expect(args.every(Number.isFinite), prop.gadgetId).toBe(true);
    }
  });

  it("gives the foreshortened props a genuinely projective transform, not an affine one", () => {
    // The projective terms are matrix3d arguments 4 and 8 (the w row, column-major). If either is
    // non-zero the transform really does foreshorten; an affine-only fallback would leave both zero.
    const { container } = render(<CabinBackdrop topic="logic-games" previews />);
    for (const id of ["nonogram", "pipes"]) {
      const el = container.querySelector<HTMLElement>(`[data-preview="${id}"]`)!;
      const args = el.style.transform.slice("matrix3d(".length, -1).split(", ").map(Number);
      expect(Math.abs(args[3]!) + Math.abs(args[7]!), id).toBeGreaterThan(0);
    }
  });

  it("hides the whole preview layer from assistive tech", () => {
    const { container } = render(<CabinBackdrop topic="logic-games" previews />);
    expect(container.querySelector(".cabin-backdrop-props")!.getAttribute("aria-hidden")).toBe(
      "true",
    );
  });
});

describe("live puzzle state", () => {
  it("redraws a prop's board as solved once that gadget has been solved", () => {
    const { container } = render(<CabinBackdrop topic="logic-games" previews />);
    const before = container.querySelector('[data-preview="nonogram"]')!.innerHTML;

    // What the overlay does when a child finishes a puzzle (see overlay/GadgetOverlay.tsx). The
    // board on the wall has to follow, with no plumbing between the two beyond this store.
    act(() => useInterest.getState().recordSolve("nonogram"));

    const after = container.querySelector('[data-preview="nonogram"]')!.innerHTML;
    expect(after).not.toBe(before);
  });

  it("leaves the other props alone when one is solved", () => {
    const { container } = render(<CabinBackdrop topic="logic-games" previews />);
    const before = container.querySelector('[data-preview="pipes"]')!.innerHTML;
    act(() => useInterest.getState().recordSolve("nonogram"));
    expect(container.querySelector('[data-preview="pipes"]')!.innerHTML).toBe(before);
  });
});

describe("backdrop image", () => {
  it("renders the first candidate source, decoratively", () => {
    const { container } = render(<CabinBackdrop topic="logic-games" />);
    const img = container.querySelector("img")!;
    expect(img.getAttribute("src")).toBe(ROOM.sources[0]);
    expect(img.getAttribute("alt")).toBe("");
    expect(img.getAttribute("aria-hidden")).toBe("true");
  });

  it("falls through to the next candidate when one fails to load", () => {
    const { container } = render(<CabinBackdrop topic="logic-games" />);
    fireEvent.error(container.querySelector("img")!);
    expect(container.querySelector("img")!.getAttribute("src")).toBe(ROOM.sources[1]);
  });

  it("drops the image entirely once every candidate has failed, keeping the props usable", () => {
    const { container } = render(<CabinBackdrop topic="logic-games" />);
    for (let i = 0; i < ROOM.sources.length; i++) {
      const img = container.querySelector("img");
      if (img) fireEvent.error(img);
    }
    expect(container.querySelector("img")).toBeNull();
    // A room with no painting is still a room you can click around in — props and shelf alike.
    expect(screen.getAllByRole("button")).toHaveLength(ROOM.props.length + 1);
  });
});

describe("topics with no authored backdrop", () => {
  it("renders an empty room rather than throwing", () => {
    // `math` has an authored room now, so it is no longer one of these. music/code/art have no
    // interior at all and must still survive being walked into.
    for (const topic of ["music", "code", "art"] as const) {
      const { container, unmount } = render(<CabinBackdrop topic={topic} />);
      expect(container.querySelector(".cabin-backdrop")).not.toBeNull();
      expect(container.querySelectorAll("polygon")).toHaveLength(0);
      expect(container.querySelectorAll("[data-preview]")).toHaveLength(0);
      expect(container.querySelector("img")).toBeNull();
      unmount();
    }
  });
});

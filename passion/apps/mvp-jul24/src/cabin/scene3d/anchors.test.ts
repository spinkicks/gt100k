import { GADGETS } from "../../gadgets/registry";
import { gadgetAnchors } from "./anchors";

test("returns one anchor per gadget in the topic, matching id/label/status", () => {
  const anchors = gadgetAnchors("math");
  const mathGadgets = GADGETS.filter((g) => g.topic === "math");
  expect(anchors).toHaveLength(mathGadgets.length);

  const nonogram = anchors.find((a) => a.id === "nonogram");
  expect(nonogram).toBeDefined();
  expect(nonogram?.label).toBe("Nonogram");
  expect(nonogram?.status).toBe("active");

  const mirror = anchors.find((a) => a.id === "mirror");
  expect(mirror?.status).toBe("coming-soon");
});

test("positions stay on the back wall (fixed z) and within the camera-visible x/y band", () => {
  const anchors = gadgetAnchors("math");
  for (const anchor of anchors) {
    const [x, y, z] = anchor.position;
    expect(z).toBeLessThan(-2.5);
    expect(x).toBeGreaterThanOrEqual(-2.6);
    expect(x).toBeLessThanOrEqual(2.6);
    expect(y).toBeGreaterThanOrEqual(0.6);
    expect(y).toBeLessThanOrEqual(2.3);
  }
});

test("higher hotspot yPct (further down the 2D backdrop) maps to a lower 3D y", () => {
  const anchors = gadgetAnchors("math");
  const upperRow = anchors.find((a) => a.id === "nonogram"); // yPct 60
  const lowerRow = anchors.find((a) => a.id === "minesweeper"); // yPct 85
  expect(upperRow).toBeDefined();
  expect(lowerRow).toBeDefined();
  expect(upperRow!.position[1]).toBeGreaterThan(lowerRow!.position[1]);
});

test("returns an empty list for a topic with no registered gadgets", () => {
  expect(gadgetAnchors("music")).toEqual([]);
});

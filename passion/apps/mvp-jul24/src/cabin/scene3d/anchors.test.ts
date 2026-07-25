import { GADGETS } from "../../gadgets/registry";
import { gadgetProps3D } from "./anchors";

test("returns one 3D prop per gadget in the topic, matching id/label/status", () => {
  const props = gadgetProps3D("logic-games");
  const logicGadgets = GADGETS.filter((g) => g.topic === "logic-games");
  expect(props).toHaveLength(logicGadgets.length);

  const nonogram = props.find((p) => p.id === "nonogram");
  expect(nonogram).toBeDefined();
  expect(nonogram?.label).toBe("Nonogram");
  expect(nonogram?.status).toBe("active");

  const mirror = props.find((p) => p.id === "mirror");
  expect(mirror?.status).toBe("active");
});

test("gives each puzzle family a prop kind that reads as the right object", () => {
  const props = gadgetProps3D("logic-games");
  const kindOf = (id: string) => props.find((p) => p.id === id)?.kind;
  expect(kindOf("chess")).toBe("chess");
  expect(kindOf("mirror")).toBe("mirror");
  // the rest are "on paper" grid puzzles rendered as framed wall panels
  for (const id of ["nonogram", "logic-grid", "minesweeper", "pipes", "lits"]) {
    expect(kindOf(id)).toBe("frame");
  }
});

test("frame props sit on the back wall, clear of the fireplace chimney breast", () => {
  const props = gadgetProps3D("logic-games");
  for (const prop of props.filter((p) => p.kind === "frame")) {
    const [x, y, z] = prop.position;
    expect(z).toBeLessThan(-2.5);
    // chimney breast spans roughly x in [-0.95, 0.95] — frames must clear it
    expect(Math.abs(x)).toBeGreaterThan(1.0);
    expect(y).toBeGreaterThan(0.5);
    expect(y).toBeLessThan(2.5);
  }
});

test("chess and mirror props sit on the floor, away from the back wall", () => {
  const props = gadgetProps3D("logic-games");
  const chess = props.find((p) => p.id === "chess");
  const mirror = props.find((p) => p.id === "mirror");
  expect(chess?.position[1]).toBe(0);
  expect(mirror?.position[1]).toBe(0);
  // "away from the back wall" means well clear of it (back wall sits at z ~ -2.78);
  // floor props sit mid-room, not flush against the wall.
  expect(chess?.position[2]).toBeGreaterThan(-2);
  expect(mirror?.position[2]).toBeGreaterThan(-2);
});

// `math` is deliberately gadget-free until its games ship, and `music`/`code`/`art` aren't built at
// all — every one of them must map to an empty prop list so the 3D room just renders unfurnished.
test.each(["math", "music", "code", "art"] as const)(
  "returns an empty list for %s, which has no registered gadgets",
  (topic) => {
    expect(gadgetProps3D(topic)).toEqual([]);
  },
);

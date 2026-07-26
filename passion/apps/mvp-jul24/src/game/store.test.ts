import { useGame } from "./store";

beforeEach(() => useGame.getState().goToMap());

test("openCabin sets screen+cabin", () => {
  useGame.getState().openCabin("logic-games");
  expect(useGame.getState().screen).toBe("cabin");
  expect(useGame.getState().cabinId).toBe("logic-games");
});

// The empty `math` cabin is openable like any other — the store must not special-case it.
test("openCabin works for the gadget-free math cabin too", () => {
  useGame.getState().openCabin("math");
  expect(useGame.getState().screen).toBe("cabin");
  expect(useGame.getState().cabinId).toBe("math");
});

test("focus then close clears focusedGadgetId", () => {
  useGame.getState().openCabin("logic-games");
  useGame.getState().focusGadget("nonogram");
  expect(useGame.getState().focusedGadgetId).toBe("nonogram");
  useGame.getState().closeGadget();
  expect(useGame.getState().focusedGadgetId).toBeNull();
});

// `backdrop` (the still generated painting) is what a player sees by default as of 2026-07-25;
// `?cabin=3d` and `?cabin=static` select the others. The test environment has no `?cabin=` param, so
// the default is what's asserted here. This asserted "3d" until the review landed.
test("the cabin backend defaults to backdrop", () => {
  expect(useGame.getState().cabinBackend).toBe("backdrop");
});

test("setBackend still switches to the static escape-hatch backend", () => {
  useGame.getState().setBackend("static");
  expect(useGame.getState().cabinBackend).toBe("static");
  useGame.getState().setBackend("3d");
  expect(useGame.getState().cabinBackend).toBe("3d");
});

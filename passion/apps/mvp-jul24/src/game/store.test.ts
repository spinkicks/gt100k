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

// 3D is the only backend a player sees; `?cabin=static` is the no-WebGL / headless escape hatch. The
// test environment has no `?cabin=` param, so the default is what's asserted here.
test("the cabin backend defaults to 3d", () => {
  expect(useGame.getState().cabinBackend).toBe("3d");
});

test("setBackend still switches to the static escape-hatch backend", () => {
  useGame.getState().setBackend("static");
  expect(useGame.getState().cabinBackend).toBe("static");
  useGame.getState().setBackend("3d");
  expect(useGame.getState().cabinBackend).toBe("3d");
});

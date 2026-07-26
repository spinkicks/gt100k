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

import { useGame } from "./store";

beforeEach(() => useGame.getState().goToMap());

test("openCabin sets screen+cabin", () => {
  useGame.getState().openCabin("math");
  expect(useGame.getState().screen).toBe("cabin");
  expect(useGame.getState().cabinId).toBe("math");
});

test("focus then close clears focusedGadgetId", () => {
  useGame.getState().openCabin("math");
  useGame.getState().focusGadget("nonogram");
  expect(useGame.getState().focusedGadgetId).toBe("nonogram");
  useGame.getState().closeGadget();
  expect(useGame.getState().focusedGadgetId).toBeNull();
});

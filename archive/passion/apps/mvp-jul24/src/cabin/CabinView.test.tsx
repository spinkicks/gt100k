import { render } from "@testing-library/react";
import { beforeEach, expect, test } from "vitest";
import { useGame } from "../game/store";
import { BACKDROP_ROOMS } from "./backdrop/quads.data";
import CabinView from "./CabinView";

beforeEach(() => {
  useGame.setState({ screen: "cabin", cabinId: "logic-games", focusedGadgetId: null });
});

test("renders nothing when no cabin is open", () => {
  useGame.setState({ cabinId: null });
  const { container } = render(<CabinView />);
  expect(container.firstChild).toBeNull();
});

// One backend. `?cabin=3d` / `?cabin=static` are gone, so no query param and no store field can
// route a player to a parked backend.
test("every cabin renders the backdrop, and no other backend", () => {
  for (const room of BACKDROP_ROOMS) {
    useGame.setState({ cabinId: room.topic });
    const { container, unmount } = render(<CabinView />);
    expect(container.querySelector(".cabin-backdrop")).not.toBeNull();
    expect(container.querySelector(".cabin-static")).toBeNull();
    // The backdrop's own aliveness layer legitimately owns a 2D `<canvas>` for dust motes
    // (cabin/aliveness/CabinAliveness.tsx) — that is not a backend, so it is excluded here. What
    // this guards against is the 3D backend's WebGL `<canvas>` (Cabin3D's react-three-fiber `Canvas`).
    expect(container.querySelector("canvas:not(.cabin-aliveness-motes)")).toBeNull();
    unmount();
  }
});

test("the store exposes no backend selector", () => {
  expect("cabinBackend" in useGame.getState()).toBe(false);
  expect("setBackend" in useGame.getState()).toBe(false);
});

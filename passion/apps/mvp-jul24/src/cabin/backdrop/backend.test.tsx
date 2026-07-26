import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useGame } from "../../game/store";
import { useInterest } from "../../interest/store";
import CabinView from "../CabinView";

/**
 * `backdrop` as a third `CabinBackend`, alongside `3d` and `static`.
 *
 * Kept here rather than in game/store.test.ts or a CabinView test so the new backend's wiring lives
 * next to the backend, and so nothing about the 3D or static paths has to be re-asserted from a file
 * that owns them.
 */
beforeEach(() => {
  useGame.getState().goToMap();
  // `goToMap` deliberately leaves the backend alone (it is a load-time choice, not navigation), so
  // restore it here or these tests leak a backend into each other.
  useGame.getState().setBackend("3d");
  useInterest.getState().reset();
});

describe("CabinView backend routing", () => {
  it("renders the backdrop backend when it is selected", () => {
    useGame.getState().openCabin("logic-games");
    useGame.getState().setBackend("backdrop");
    const { container } = render(<CabinView />);
    expect(container.querySelector(".cabin-backdrop")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Nonogram board on the wall" })).toBeInTheDocument();
  });

  it("does not render the backdrop for the static backend", () => {
    useGame.getState().openCabin("logic-games");
    useGame.getState().setBackend("static");
    const { container } = render(<CabinView />);
    expect(container.querySelector(".cabin-backdrop")).toBeNull();
    expect(container.querySelector(".cabin-static")).not.toBeNull();
  });

  // Nothing here renders the 3D path: react-three-fiber's Canvas needs a ResizeObserver jsdom does
  // not have. That 3D is the default, and that it is unchanged, is asserted in game/store.test.ts.

  it("round-trips the new backend value through setBackend", () => {
    useGame.getState().setBackend("backdrop");
    expect(useGame.getState().cabinBackend).toBe("backdrop");
  });

  it("renders nothing at all when no cabin is open, whatever the backend", () => {
    useGame.getState().setBackend("backdrop");
    const { container } = render(<CabinView />);
    expect(container).toBeEmptyDOMElement();
  });
});

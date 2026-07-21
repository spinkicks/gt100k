import { createElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { World3DBoundary } from "../app/child/world3d/World3DBoundary";

const children = createElement("div", { "data-role": "world" });
const fallback = createElement("div", { "data-role": "fallback" });

describe("World3DBoundary", () => {
  it("derives an error state so a thrown world render is caught, not white-screened", () => {
    expect(World3DBoundary.getDerivedStateFromError()).toEqual({ hasError: true });
  });

  it("renders the world while healthy and the calm fallback once it has errored", () => {
    const boundary = new World3DBoundary({ children, fallback });

    expect(boundary.state).toEqual({ hasError: false });
    expect(boundary.render()).toBe(children);

    boundary.state = World3DBoundary.getDerivedStateFromError();
    expect(boundary.render()).toBe(fallback);
  });

  it("notifies the parent exactly once so it can retire the WebGL tier", () => {
    const onError = vi.fn();
    const boundary = new World3DBoundary({ children, fallback, onError });
    const error = new Error("WebGL context creation failed");

    boundary.componentDidCatch(error, { componentStack: "" });

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(error);
  });
});

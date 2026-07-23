// @vitest-environment jsdom

import { ACTIVITY_GOLDEN_V1 } from "@gt100k/interest-lab";
import { buildCuriosityMapView } from "@gt100k/interest-lab-view";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ComponentType } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import * as ZoneKit from "../src/zone-kit";

interface CuriosityMapProps {
  view: ReturnType<typeof buildCuriosityMapView>;
  activeZoneId: string | null;
  dayOffset: number;
  onEnterZone: (zoneId: string) => void;
  onSetDayOffset: (dayOffset: number) => void;
}

const renderMap = (overrides: Partial<CuriosityMapProps> = {}) => {
  const CuriosityMap = Reflect.get(ZoneKit, "CuriosityMap") as
    | ComponentType<CuriosityMapProps>
    | undefined;
  expect(CuriosityMap).toEqual(expect.any(Function));
  if (CuriosityMap === undefined) {
    throw new Error("CuriosityMap export is missing");
  }

  const props: CuriosityMapProps = {
    view: buildCuriosityMapView(ZoneKit.STUB_MANIFESTS, ACTIVITY_GOLDEN_V1, {
      domainOrder: ZoneKit.V1_DOMAIN_ORDER,
    }),
    activeZoneId: null,
    dayOffset: 0,
    onEnterZone: vi.fn(),
    onSetDayOffset: vi.fn(),
    ...overrides,
  };

  return {
    ...render(<CuriosityMap {...props} />),
    props,
  };
};

const GOLDEN_LABELS = [
  "Music Studio, discovery zone, 0 unfinished, you came back here",
  "Code Lab, discovery zone, 1 unfinished, you came back after a reminder",
  "Art Studio, discovery zone, 1 unfinished, you've been here",
] as const;

afterEach(cleanup);

describe("CuriosityMap", () => {
  it("renders every golden building as a real button on a visible primary map", () => {
    renderMap({ activeZoneId: "code" });

    const map = screen.getByRole("region", { name: "Curiosity Map" });
    expect(map.getAttribute("aria-hidden")).toBeNull();

    const buildings = GOLDEN_LABELS.map((label) => screen.getByRole("button", { name: label }));
    expect(buildings.map((button) => button.tabIndex)).toEqual([0, -1, -1]);
    expect(buildings[1]?.getAttribute("aria-pressed")).toBe("true");
    expect(buildings.every((button) => button.tagName === "BUTTON")).toBe(true);
  });

  it("moves roving focus one building per arrow key and enters the selected zone", () => {
    const onEnterZone = vi.fn();
    renderMap({ onEnterZone });
    const [music, code, art] = GOLDEN_LABELS.map((label) =>
      screen.getByRole("button", { name: label }),
    );

    music?.focus();
    fireEvent.keyDown(music as HTMLButtonElement, { key: "ArrowRight" });
    expect(document.activeElement).toBe(code);
    expect([music?.tabIndex, code?.tabIndex, art?.tabIndex]).toEqual([-1, 0, -1]);

    fireEvent.keyDown(code as HTMLButtonElement, { key: "ArrowDown" });
    expect(document.activeElement).toBe(art);
    fireEvent.keyDown(art as HTMLButtonElement, { key: "ArrowLeft" });
    expect(document.activeElement).toBe(code);
    fireEvent.keyDown(code as HTMLButtonElement, { key: "ArrowUp" });
    expect(document.activeElement).toBe(music);
    fireEvent.keyDown(music as HTMLButtonElement, { key: "ArrowLeft" });
    expect(document.activeElement).toBe(art);
    fireEvent.keyDown(art as HTMLButtonElement, { key: "ArrowRight" });
    expect(document.activeElement).toBe(music);

    fireEvent.click(code as HTMLButtonElement);
    expect(onEnterZone).toHaveBeenCalledTimes(1);
    expect(onEnterZone).toHaveBeenCalledWith("code");
  });

  it("steps through the labeled time-lapse phases", () => {
    const onSetDayOffset = vi.fn();
    const rendered = renderMap({ onSetDayOffset });

    fireEvent.click(screen.getByRole("button", { name: "A week later…" }));
    expect(onSetDayOffset).toHaveBeenCalledTimes(1);
    expect(onSetDayOffset).toHaveBeenCalledWith(7);

    rendered.rerender(
      <ZoneKit.CuriosityMap {...rendered.props} dayOffset={7} onSetDayOffset={onSetDayOffset} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "A month later…" }));
    expect(onSetDayOffset).toHaveBeenLastCalledWith(30);
  });
});

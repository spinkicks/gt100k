// @vitest-environment jsdom

import type { ActivityEvent } from "@gt100k/interest-lab";
import { cleanup, render, screen } from "@testing-library/react";
import { type ComponentType, type ReactNode, useEffect } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ZoneRegistry } from "../src/registry";
import * as ZoneKit from "../src/zone-kit";

const canvas = vi.hoisted(() => ({ mounts: 0 }));

vi.mock("@react-three/fiber", () => ({
  Canvas: ({ children }: { children?: ReactNode }) => {
    useEffect(() => {
      canvas.mounts += 1;
    }, []);
    return <div data-testid="persistent-canvas">{children}</div>;
  },
}));

vi.mock("@react-three/drei", () => ({
  AdaptiveDpr: () => null,
  PerformanceMonitor: () => null,
}));

interface CanvasHostProps {
  activeZoneId: string | null;
  registry: ZoneRegistry;
  emit: (event: ActivityEvent) => void;
  dayOffset: number;
  tier: "room-3d" | "room-3d-lite" | "board-2d";
  reducedMotion: boolean;
  onPerformanceDecline?: () => void;
}

const plugin = (id: string, domain: string) => ({
  id,
  domain,
  mapBuilding: {
    label: `${id} room`,
    glyph: id,
    enterVerb: "Step inside",
    cell: { col: 0, row: 0 },
  },
  probes: [],
  Room3D: () => <div data-testid={`room-3d-${id}`}>{id} 3D room</div>,
  ActivityDOM: () => <div data-testid={`room-dom-${id}`}>{id} activities</div>,
});

const registry = ZoneKit.createZoneRegistry([
  plugin("music", "sound_music"),
  plugin("art", "visual_design"),
]);

const defaultProps: CanvasHostProps = {
  activeZoneId: null,
  registry,
  emit: vi.fn(),
  dayOffset: 0,
  tier: "room-3d",
  reducedMotion: false,
};

const canvasHost = () => {
  const CanvasHost = Reflect.get(ZoneKit, "CanvasHost") as
    | ComponentType<CanvasHostProps>
    | undefined;
  expect(CanvasHost).toEqual(expect.any(Function));
  return CanvasHost as ComponentType<CanvasHostProps>;
};

afterEach(cleanup);

describe("CanvasHost", () => {
  beforeEach(() => {
    canvas.mounts = 0;
  });

  it("mounts Canvas once while enter, exit, and enter only swap room children", () => {
    const CanvasHost = canvasHost();
    const rendered = render(<CanvasHost {...defaultProps} />);
    expect(canvas.mounts).toBe(1);

    rendered.rerender(<CanvasHost {...defaultProps} activeZoneId="music" />);
    expect(screen.queryByTestId("room-3d-music")).not.toBeNull();
    expect(canvas.mounts).toBe(1);

    rendered.rerender(<CanvasHost {...defaultProps} activeZoneId={null} />);
    expect(screen.queryByTestId("room-3d-music")).toBeNull();
    expect(canvas.mounts).toBe(1);

    rendered.rerender(<CanvasHost {...defaultProps} activeZoneId="art" />);
    expect(screen.queryByTestId("room-3d-art")).not.toBeNull();
    expect(canvas.mounts).toBe(1);
    expect(screen.getAllByTestId("persistent-canvas")).toHaveLength(1);
  });

  it("keeps Canvas mounted while the board tier renders the DOM activity seam outside it", () => {
    const CanvasHost = canvasHost();
    render(<CanvasHost {...defaultProps} activeZoneId="music" tier="board-2d" />);

    const persistentCanvas = screen.getByTestId("persistent-canvas");
    const activityDom = screen.getByTestId("room-dom-music");
    expect(canvas.mounts).toBe(1);
    expect(screen.queryByTestId("room-3d-music")).toBeNull();
    expect(persistentCanvas.contains(activityDom)).toBe(false);
  });

  it("injects the active plugin's canonical action model into both room surfaces", () => {
    const CanvasHost = canvasHost();
    const actionAwarePlugin = {
      ...ZoneKit.musicStub,
      Room3D: ({ actions }: { actions?: readonly { label: string }[] }) => (
        <div data-testid="derived-room-actions">{actions?.map(({ label }) => label).join(",")}</div>
      ),
      ActivityDOM: ({ actions }: { actions?: readonly { label: string }[] }) => (
        <div data-testid="derived-dom-actions">{actions?.map(({ label }) => label).join(",")}</div>
      ),
    };
    const actionRegistry = ZoneKit.createZoneRegistry([actionAwarePlugin]);
    const props = { ...defaultProps, activeZoneId: "music", registry: actionRegistry };
    const expectedLabels = "Build,Debug,Perform";

    const rendered = render(<CanvasHost {...props} />);
    expect(screen.getByTestId("derived-room-actions").textContent).toBe(expectedLabels);

    rendered.rerender(<CanvasHost {...props} tier="board-2d" />);
    expect(screen.getByTestId("derived-dom-actions").textContent).toBe(expectedLabels);
  });
});

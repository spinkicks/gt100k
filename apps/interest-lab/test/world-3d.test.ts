import { CAMERA3D, SCENE3D } from "@gt100k/interest-lab-view";
import { AdaptiveDpr } from "@react-three/drei";
import {
  Children,
  type ComponentType,
  type ReactElement,
  type ReactNode,
  createElement,
  isValidElement,
} from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ACESFilmicToneMapping } from "three";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { World3D } from "../app/child/world3d/World3D";
import * as World3DCanvasModule from "../app/child/world3d/World3DCanvas";
import { buildSyntheticInterestLabSeed } from "../app/seed";

const captures = vi.hoisted(() => ({
  canvasProps: null as Record<string, unknown> | null,
  dynamicLoader: null as (() => Promise<unknown>) | null,
  dynamicOptions: null as Record<string, unknown> | null,
  dynamicProps: null as Record<string, unknown> | null,
}));

vi.mock("next/dynamic", () => ({
  default: (loader: () => Promise<unknown>, options: Record<string, unknown>) => {
    captures.dynamicLoader = loader;
    captures.dynamicOptions = options;
    return function DynamicWorld3D(props: Record<string, unknown>) {
      captures.dynamicProps = props;
      return null;
    };
  },
}));

vi.mock("@react-three/fiber", () => ({
  Canvas: (props: Record<string, unknown>) => {
    captures.canvasProps = props;
    return null;
  },
}));

vi.mock("@react-three/drei", () => ({
  AdaptiveDpr: () => null,
}));

const fullScene = buildSyntheticInterestLabSeed({
  deviceCaps: {
    webglAvailable: true,
    deviceMemoryGB: 8,
    hardwareConcurrency: 8,
    coarsePointer: false,
    saveData: false,
  },
}).view.scene;

interface World3DProps {
  scene: typeof fullScene;
  children?: ReactNode;
}

interface RendererLifecycle {
  attach(renderer: {
    renderLists: { dispose: () => void };
    dispose: () => void;
  }): void;
  dispose(): void;
}

const World3DCanvas = World3DCanvasModule.World3DCanvas as ComponentType<World3DProps>;
const createRendererLifecycle = Reflect.get(
  World3DCanvasModule,
  "createWorld3DRendererLifecycle",
) as (() => RendererLifecycle) | undefined;

const readCanvasProps = () => {
  expect(captures.canvasProps).not.toBeNull();
  return captures.canvasProps ?? {};
};

describe("World3D host", () => {
  beforeEach(() => {
    captures.canvasProps = null;
    captures.dynamicProps = null;
  });

  it("loads the WebGL implementation client-only from a literal dynamic import", async () => {
    const suppliedScene = createElement("group", { "data-scene-graph": "supplied" });

    renderToStaticMarkup(
      createElement(World3D as ComponentType<World3DProps>, { scene: fullScene }, suppliedScene),
    );

    expect(captures.dynamicOptions).toEqual({ ssr: false });
    expect(captures.dynamicLoader).toEqual(expect.any(Function));
    expect(await captures.dynamicLoader?.()).toBe(World3DCanvasModule.World3DCanvas);
    expect(captures.dynamicProps).toMatchObject({ scene: fullScene, children: suppliedScene });
  });

  it("mounts an accessibility-hidden Canvas with the pinned camera and DPR cap", () => {
    renderToStaticMarkup(createElement(World3DCanvas, { scene: fullScene }));

    expect(readCanvasProps()).toMatchObject({
      "aria-hidden": "true",
      camera: {
        position: fullScene.camera.pos,
        fov: CAMERA3D.fov,
        near: CAMERA3D.near,
        far: CAMERA3D.far,
      },
      dpr: [1, fullScene.quality.dprCap],
      shadows: fullScene.quality.shadows,
      gl: {
        alpha: false,
        antialias: true,
        powerPreference: "high-performance",
      },
    });
  });

  it("applies the exact dusk fog, lights, tone mapping, exposure, and supplied scene graph", () => {
    const suppliedScene = createElement("group", { "data-scene-graph": "supplied" });
    renderToStaticMarkup(createElement(World3DCanvas, { scene: fullScene }, suppliedScene));

    const canvasProps = readCanvasProps();
    const elements = Children.toArray(canvasProps.children as ReactNode).filter(
      (child): child is ReactElement<Record<string, unknown>> =>
        isValidElement<Record<string, unknown>>(child),
    );
    const elementOfType = (type: string | typeof AdaptiveDpr) =>
      elements.find((element) => element.type === type);

    expect(elementOfType("color")?.props).toMatchObject({
      attach: "background",
      args: [SCENE3D.bgHex],
    });
    expect(elementOfType("fog")?.props).toMatchObject({
      attach: "fog",
      args: [SCENE3D.fogHex, SCENE3D.fogNear, SCENE3D.fogFar],
    });
    expect(elementOfType("ambientLight")?.props).toMatchObject({
      color: SCENE3D.ambientHex,
      intensity: SCENE3D.ambientIntensity,
    });
    expect(elementOfType("hemisphereLight")?.props).toMatchObject({
      color: SCENE3D.hemiSkyHex,
      groundColor: SCENE3D.hemiGroundHex,
      intensity: SCENE3D.hemiIntensity,
    });
    expect(elementOfType("directionalLight")?.props).toMatchObject({
      color: SCENE3D.keyHex,
      intensity: SCENE3D.keyIntensity,
      position: SCENE3D.keyPos,
      castShadow: fullScene.quality.shadows,
    });
    expect(elementOfType(AdaptiveDpr)).toBeDefined();
    expect(elements.some((element) => element.props["data-scene-graph"] === "supplied")).toBe(true);

    const setClearColor = vi.fn();
    const lookAt = vi.fn();
    const renderer = {
      toneMapping: 0,
      toneMappingExposure: 0,
      setClearColor,
      renderLists: { dispose: vi.fn() },
      dispose: vi.fn(),
    };
    const onCreated = canvasProps.onCreated as
      | ((state: { gl: typeof renderer; camera: { lookAt: typeof lookAt } }) => void)
      | undefined;

    expect(onCreated).toEqual(expect.any(Function));
    onCreated?.({ gl: renderer, camera: { lookAt } });
    expect(renderer.toneMapping).toBe(ACESFilmicToneMapping);
    expect(renderer.toneMappingExposure).toBe(SCENE3D.exposure);
    expect(setClearColor).toHaveBeenCalledWith(SCENE3D.bgHex);
    expect(lookAt).toHaveBeenCalledWith(...fullScene.camera.target);
  });

  it("disposes renderer resources once when its lifecycle ends", () => {
    const renderListsDispose = vi.fn();
    const rendererDispose = vi.fn();

    expect(createRendererLifecycle).toEqual(expect.any(Function));
    const lifecycle = createRendererLifecycle?.();
    lifecycle?.attach({
      renderLists: { dispose: renderListsDispose },
      dispose: rendererDispose,
    });
    lifecycle?.dispose();
    lifecycle?.dispose();

    expect(renderListsDispose).toHaveBeenCalledTimes(1);
    expect(rendererDispose).toHaveBeenCalledTimes(1);
  });
});

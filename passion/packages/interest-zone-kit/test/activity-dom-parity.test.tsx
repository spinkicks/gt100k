// @vitest-environment jsdom

import type { ActivityEvent, ActivityKind, WorkMode } from "@gt100k/interest-lab";
import type {
  ZoneActionModel,
  ZoneActivityManifest,
  ZoneActivityModel,
} from "@gt100k/interest-lab-view";
import * as View from "@gt100k/interest-lab-view";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { Children, type ReactNode, isValidElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { RoomProps, ZonePlugin } from "../src/contracts";
import { STUB_ZONES } from "../src/zone-kit";

const buildZoneActivityModel = (manifest: ZoneActivityManifest): ZoneActivityModel => {
  const build = Reflect.get(View, "buildZoneActivityModel") as
    | ((input: ZoneActivityManifest) => ZoneActivityModel)
    | undefined;
  expect(build).toEqual(expect.any(Function));
  if (build === undefined) {
    throw new Error("buildZoneActivityModel export is missing");
  }
  return build(manifest);
};

const plainZoneEquals = (a: ZoneActivityModel, b: ZoneActivityModel): boolean => {
  const equals = Reflect.get(View, "plainZoneEquals") as
    | ((left: ZoneActivityModel, right: ZoneActivityModel) => boolean)
    | undefined;
  expect(equals).toEqual(expect.any(Function));
  if (equals === undefined) {
    throw new Error("plainZoneEquals export is missing");
  }
  return equals(a, b);
};

const roomProps = (
  plugin: ZonePlugin,
  actions: readonly ZoneActionModel[],
  emit = vi.fn<(event: ActivityEvent) => void>(),
): RoomProps => ({
  emit,
  probes: plugin.probes,
  actions,
  dayOffset: 7,
  tier: "room-3d-lite",
  reducedMotion: true,
});

const actionFromDataset = (element: HTMLElement): ZoneActionModel => ({
  actionId: element.dataset.actionId!,
  probeId: element.dataset.probeId!,
  domain: element.dataset.domain!,
  workMode: element.dataset.workMode! as WorkMode,
  kind: element.dataset.kind! as ActivityKind,
  label: element.textContent!,
  primary: element.dataset.primary === "true",
});

const meshActions = (node: ReactNode): Array<{ action: ZoneActionModel; activate: () => void }> => {
  if (!isValidElement<{ children?: ReactNode }>(node)) {
    return [];
  }

  return Children.toArray(node.props.children).flatMap((child) => {
    if (
      isValidElement<{
        children?: ReactNode;
        onClick?: () => void;
        userData?: { action?: ZoneActionModel };
      }>(child) &&
      child.type === "mesh" &&
      child.props.userData?.action !== undefined &&
      child.props.onClick !== undefined
    ) {
      return [{ action: child.props.userData.action, activate: child.props.onClick }];
    }
    return meshActions(child);
  });
};

afterEach(cleanup);

describe("stub zone activity parity", () => {
  it.each(STUB_ZONES)("builds a sorted, single-primary action model for $id", (plugin) => {
    const model = buildZoneActivityModel(plugin);
    const sortedActionIds = plugin.probes.map(({ id }) => id).sort();

    expect(model).toEqual({
      zoneId: plugin.id,
      domain: plugin.domain,
      actions: sortedActionIds.map((actionId, index) => {
        const probe = plugin.probes.find(({ id }) => id === actionId)!;
        return {
          actionId,
          probeId: actionId,
          domain: plugin.domain,
          workMode: probe.workMode,
          kind: "artifact",
          label: probe.workMode[0]!.toUpperCase() + probe.workMode.slice(1),
          primary: index === 0,
        };
      }),
    });
    expect(model.actions.filter(({ primary }) => primary)).toHaveLength(1);
  });

  it("compares complete action models independently of incoming action order", () => {
    const model = buildZoneActivityModel(STUB_ZONES[0]!);
    const reordered = { ...model, actions: [...model.actions].reverse() };
    const changed = {
      ...model,
      actions: model.actions.map((action, index) =>
        index === 0 ? { ...action, workMode: "explain" as const } : action,
      ),
    };

    expect(plainZoneEquals(model, reordered)).toBe(true);
    expect(plainZoneEquals(model, changed)).toBe(false);
  });

  it.each(STUB_ZONES)(
    "keeps $id DOM controls equal to the model and emits exact events",
    (plugin) => {
      const model = buildZoneActivityModel(plugin);
      const emit = vi.fn<(event: ActivityEvent) => void>();
      const ActivityDOM = plugin.ActivityDOM;
      render(<ActivityDOM {...roomProps(plugin, model.actions, emit)} />);

      const region = screen.getByRole("group", { name: `${plugin.id} activities` });
      const buttons = within(region).getAllByRole("button");
      const domModel = {
        zoneId: plugin.id,
        domain: plugin.domain,
        actions: buttons.map(actionFromDataset),
      } satisfies ZoneActivityModel;

      expect(buttons).toHaveLength(model.actions.length);
      expect(plainZoneEquals(domModel, model)).toBe(true);

      for (const [index, action] of model.actions.entries()) {
        const button = screen.getByRole("button", { name: action.label });
        expect(button.getAttribute("aria-hidden")).toBeNull();
        fireEvent.click(button);
        expect(emit).toHaveBeenNthCalledWith(index + 1, {
          zoneId: plugin.id,
          probeId: action.probeId,
          domain: action.domain,
          workMode: action.workMode,
          action: action.actionId,
          kind: action.kind,
          dayOffset: 7,
        });
      }
    },
  );

  it.each(STUB_ZONES)("keeps $id 3D mesh actions equal to the same model", (plugin) => {
    const model = buildZoneActivityModel(plugin);
    const emit = vi.fn<(event: ActivityEvent) => void>();
    const tree = plugin.Room3D(roomProps(plugin, model.actions, emit));
    const meshes = meshActions(tree);
    const meshModel = {
      zoneId: plugin.id,
      domain: plugin.domain,
      actions: meshes.map(({ action }) => action),
    } satisfies ZoneActivityModel;

    expect(meshes).toHaveLength(model.actions.length);
    expect(plainZoneEquals(meshModel, model)).toBe(true);

    for (const [index, mesh] of meshes.entries()) {
      mesh.activate();
      const action = model.actions[index]!;
      expect(emit).toHaveBeenNthCalledWith(index + 1, {
        zoneId: plugin.id,
        probeId: action.probeId,
        domain: action.domain,
        workMode: action.workMode,
        action: action.actionId,
        kind: action.kind,
        dayOffset: 7,
      });
    }
  });
});

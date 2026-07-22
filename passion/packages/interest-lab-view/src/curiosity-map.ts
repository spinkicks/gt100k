import type { ActivityEvent, Domain } from "@gt100k/interest-lab";
import { resolveDomainHue } from "./art";
import { type TimeLapseView, buildTimeLapse } from "./time-lapse";

export type ZoneId = string;

export interface MapBuildingView {
  label: string;
  glyph: string;
  enterVerb: string;
  cell: { col: number; row: number };
  art?: { sprite?: string; hue?: string };
}

export type CuriosityMapReturnState = "new" | "explored" | "voluntary-return" | "prompted-return";

export interface CuriosityMapBuilding extends MapBuildingView {
  zoneId: ZoneId;
  domain: Domain;
  hue: string;
  returnState: CuriosityMapReturnState;
  unfinished: number;
  ariaLabel: string;
}

export interface CuriosityMapView {
  buildings: CuriosityMapBuilding[];
  timeLapse: TimeLapseView;
  legend: { returnState: CuriosityMapReturnState; note: string }[];
  domainOrder: Domain[];
}

const RETURN_STATE_PHRASES: Record<CuriosityMapReturnState, string> = {
  new: "new",
  explored: "you've been here",
  "voluntary-return": "you came back here",
  "prompted-return": "you came back after a reminder",
};

export function buildCuriosityMapView(
  manifests: readonly { id: ZoneId; domain: Domain; mapBuilding: MapBuildingView }[],
  activity: readonly ActivityEvent[],
  opts: { domainOrder: readonly Domain[] },
): CuriosityMapView {
  for (const { domain } of manifests) {
    resolveDomainHue(opts.domainOrder, domain);
  }

  const eligibleActivity = activity.filter(
    ({ assistive, withdrawn }) => assistive !== true && withdrawn !== true,
  );
  const buildings = manifests
    .map(({ id, domain, mapBuilding }): CuriosityMapBuilding => {
      const zoneActivity = eligibleActivity.filter(({ zoneId }) => zoneId === id);
      const noveltyProbeIds = new Set(
        zoneActivity.filter(({ dayOffset }) => dayOffset === 0).map(({ probeId }) => probeId),
      );
      const voluntaryProbeIds = new Set(
        zoneActivity
          .filter(({ dayOffset, intervention }) => dayOffset > 0 && intervention === undefined)
          .map(({ probeId }) => probeId),
      );
      const hasPromptedReturn = zoneActivity.some(
        ({ dayOffset, intervention }) => dayOffset > 0 && intervention !== undefined,
      );
      const returnState: CuriosityMapReturnState =
        voluntaryProbeIds.size > 0
          ? "voluntary-return"
          : hasPromptedReturn
            ? "prompted-return"
            : noveltyProbeIds.size > 0
              ? "explored"
              : "new";
      const unfinished = [...noveltyProbeIds].filter(
        (probeId) => !voluntaryProbeIds.has(probeId),
      ).length;

      return {
        ...mapBuilding,
        zoneId: id,
        domain,
        hue: mapBuilding.art?.hue ?? resolveDomainHue(opts.domainOrder, domain),
        returnState,
        unfinished,
        ariaLabel: `${mapBuilding.label}, discovery zone, ${unfinished} unfinished, ${RETURN_STATE_PHRASES[returnState]}`,
      };
    })
    .sort((left, right) => left.cell.row - right.cell.row || left.cell.col - right.cell.col);

  return {
    buildings,
    timeLapse: buildTimeLapse(activity),
    legend: [
      { returnState: "new", note: "Not explored yet." },
      { returnState: "explored", note: "Explored once." },
      { returnState: "voluntary-return", note: "Returned without prompting." },
      { returnState: "prompted-return", note: "Returned after a prompt." },
    ],
    domainOrder: [...opts.domainOrder],
  };
}

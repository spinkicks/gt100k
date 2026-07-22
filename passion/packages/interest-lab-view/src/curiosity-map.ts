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

export function buildCuriosityMapView(
  manifests: readonly { id: ZoneId; domain: Domain; mapBuilding: MapBuildingView }[],
  activity: readonly ActivityEvent[],
  opts: { domainOrder: readonly Domain[] },
): CuriosityMapView {
  const buildings = manifests
    .map(({ id, domain, mapBuilding }) => ({
      ...mapBuilding,
      zoneId: id,
      domain,
      hue: mapBuilding.art?.hue ?? resolveDomainHue(opts.domainOrder, domain),
      returnState: "new" as const,
      unfinished: 0,
      ariaLabel: `${mapBuilding.label}, discovery zone, 0 unfinished, new`,
    }))
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

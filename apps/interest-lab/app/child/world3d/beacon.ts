import type { IslandView, Vector3 } from "@gt100k/interest-lab-view";

// The "my quests" beacon: a fixed collection point toward the viewer where picked orbs
// hop, so a tap has a visible destination (P0.4 payoff — a pick means "this joins my quests").
export const BEACON_TARGET: Vector3 = [0, -1.1, 7];

// The vertical hop height of the pick spring — single source of truth shared with QuestMarker.
export const PICK_HOP_HEIGHT = 0.5;

// Fraction of the marker→beacon vector the orb leans across at the hop's peak. The orb leaps
// toward the beacon then settles home (the card, not the orb, stays in the tray), so the gesture
// reads as "sent to my quests" without permanently vacating the island.
const BEACON_LEAN_FRACTION = 0.32;

// A pick-plateau so the beacon keeps growing warmer but never blows out the grade.
const BEACON_PLATEAU = 6;

/**
 * Position of a picked orb mid-hop: it rises by the spring value and leans a fraction of the way
 * toward the beacon, proportional to how far through the arc it is. At rest (hopValue 0) it is
 * exactly on its marker; at the hop peak it is highest and closest to the beacon. Pure so the
 * hop→beacon wiring is unit-testable without a GPU.
 */
export function resolvePickHopPosition(
  markerPosition: Readonly<Vector3>,
  beacon: Readonly<Vector3>,
  hopValue: number,
): Vector3 {
  const progress = Math.max(0, Math.min(hopValue / PICK_HOP_HEIGHT, 1));
  const lean = progress * BEACON_LEAN_FRACTION;
  return [
    markerPosition[0] + (beacon[0] - markerPosition[0]) * lean,
    markerPosition[1] + hopValue,
    markerPosition[2] + (beacon[2] - markerPosition[2]) * lean,
  ];
}

export interface BeaconRender {
  position: Vector3;
  emissiveIntensity: number;
  haloOpacity: number;
  haloScale: number;
  active: boolean;
}

/** The beacon brightens as quests collect at it — arrival gains weight — then plateaus. */
export function resolveBeaconRender(pickedCount: number): BeaconRender {
  const collected = Math.min(Math.max(0, pickedCount), BEACON_PLATEAU);
  return {
    position: BEACON_TARGET,
    emissiveIntensity: 0.5 + collected * 0.32,
    haloOpacity: 0.34 + collected * 0.07,
    haloScale: 1.6 + collected * 0.14,
    active: collected > 0,
  };
}

/** Human-facing island name for a catalog domain slug, e.g. `sound_music` → `Sound Music`. */
export function domainBannerLabel(domain: string): string {
  return domain
    .split("_")
    .filter(Boolean)
    .map((word) => word.replace(/^./, (character) => character.toUpperCase()))
    .join(" ");
}

/** The domain of the island that owns the focused orb, or null when nothing is focused. */
export function resolveFocusedDomain(
  islands: readonly IslandView[],
  focusedProbeId: string | null,
): string | null {
  if (!focusedProbeId) return null;
  for (const island of islands) {
    if (island.markers.some((marker) => marker.probeId === focusedProbeId)) {
      return island.domain;
    }
  }
  return null;
}

/** The island-name banner label for the focused orb, or null when nothing is focused. */
export function resolveIslandBannerLabel(
  islands: readonly IslandView[],
  focusedProbeId: string | null,
): string | null {
  const domain = resolveFocusedDomain(islands, focusedProbeId);
  return domain === null ? null : domainBannerLabel(domain);
}

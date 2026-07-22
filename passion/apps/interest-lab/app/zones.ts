import { STUB_ZONES, artStub, createZoneRegistry } from "@gt100k/interest-zone-kit";
import { AtelierRoom } from "./child/rooms/AtelierRoom";

// The Art cabin ships its real interior — "The Atelier at Golden Hour" (art bible §7.2 / P-A2) —
// on top of the frozen stub. Only the Room3D value swaps; the mapBuilding, probes, ActivityDOM
// (the accessible peer) and every action stay exactly as the stub defines them, so the zone-kit
// parity + QA contracts are untouched. Other cabins keep their stub rooms until their loop lands.
const ART_ATELIER = { ...artStub, Room3D: AtelierRoom };

export const ZONES = STUB_ZONES.map((zone) => (zone.id === "art" ? ART_ATELIER : zone));
export const ZONE_REGISTRY = createZoneRegistry(ZONES);

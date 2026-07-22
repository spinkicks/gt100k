import { STUB_ZONES, artStub, createZoneRegistry, musicStub } from "@gt100k/interest-zone-kit";
import { AtelierRoom } from "./child/rooms/AtelierRoom";
import { SoundingCabinRoom } from "./child/rooms/SoundingCabinRoom";

// Each cabin ships its real interior on top of the frozen stub as its loop lands. Only the Room3D
// value swaps; the mapBuilding, probes, ActivityDOM (the accessible peer) and every action stay
// exactly as the stub defines them, so the zone-kit parity + QA contracts are untouched.
//   • Art  → "The Atelier at Golden Hour" (art bible §7.2 / P-A2)
//   • Music → "Firelight in the Sounding Cabin" (cabin-interior spec / P-A3)
// Remaining cabins keep their stub rooms until their loop lands.
const ART_ATELIER = { ...artStub, Room3D: AtelierRoom };
const MUSIC_SOUNDING_CABIN = { ...musicStub, Room3D: SoundingCabinRoom };

export const ZONES = STUB_ZONES.map((zone) => {
  if (zone.id === "art") return ART_ATELIER;
  if (zone.id === "music") return MUSIC_SOUNDING_CABIN;
  return zone;
});
export const ZONE_REGISTRY = createZoneRegistry(ZONES);

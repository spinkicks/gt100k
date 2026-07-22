import { STUB_ZONES, artStub, codeStub, createZoneRegistry, musicStub } from "@gt100k/interest-zone-kit";
import { AtelierRoom } from "./child/rooms/AtelierRoom";
import { SoundingCabinRoom } from "./child/rooms/SoundingCabinRoom";
import { TinkerWorkshopRoom } from "./child/rooms/TinkerWorkshopRoom";

// Each cabin ships its real interior on top of the frozen stub as its loop lands. Only the Room3D
// value swaps; the mapBuilding, probes, ActivityDOM (the accessible peer) and every action stay
// exactly as the stub defines them, so the zone-kit parity + QA contracts are untouched.
//   • Art  → "The Atelier at Golden Hour" (art bible §7.2 / P-A2)
//   • Music → "Firelight in the Sounding Cabin" (cabin-interior spec / P-A3)
//   • Code → "The Tinker Workshop" (cabin-interior spec / P-A4)
// All three cabin interiors now ship their real rooms.
const ART_ATELIER = { ...artStub, Room3D: AtelierRoom };
const MUSIC_SOUNDING_CABIN = { ...musicStub, Room3D: SoundingCabinRoom };
const CODE_TINKER_WORKSHOP = { ...codeStub, Room3D: TinkerWorkshopRoom };

export const ZONES = STUB_ZONES.map((zone) => {
  if (zone.id === "art") return ART_ATELIER;
  if (zone.id === "music") return MUSIC_SOUNDING_CABIN;
  if (zone.id === "code") return CODE_TINKER_WORKSHOP;
  return zone;
});
export const ZONE_REGISTRY = createZoneRegistry(ZONES);

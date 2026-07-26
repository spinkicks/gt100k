/**
 * Standalone review harness for CabinAliveness. Not part of the app bundle — `vite build`'s only
 * entry is index.html, so nothing here ships; it is served in dev at
 *
 *     http://localhost:5178/src/cabin/aliveness/harness.html
 *
 * It exists for the two questions a unit test cannot answer: does the fire read as firelight rather
 * than as a pulsing blob, and is each effect actually carrying its weight? Hence the per-effect
 * toggles — the honest way to judge an effect is to turn it off.
 *
 * The regions below are sample data for the two backdrops currently in public/art, measured off
 * those images. They live here rather than in the component on purpose: CabinAliveness must not
 * know any room's coordinates (see its docblock), and these two rooms' real region data belongs
 * with whatever ships the final backdrops.
 */
import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import CabinAliveness, { type AlivenessEffect } from "./CabinAliveness";
import type { ArtSize, FirelightRegions, ShaftRegion } from "./regions";
import { useReducedMotion } from "./useReducedMotion";

const ART: ArtSize = { width: 1024, height: 1024 };

interface Room {
  id: string;
  name: string;
  src: string;
  firelight: FirelightRegions;
  shaft: ShaftRegion;
}

const ROOMS: Room[] = [
  {
    id: "logic-games",
    name: "Logic Games",
    src: "/art/cabin-logic-games.png",
    // the warm source in this room is the hurricane lantern on the right-hand crate
    firelight: {
      core: { x: 953, y: 700, w: 150, h: 210 },
      floor: { x: 900, y: 900, w: 540, h: 260 },
      bounce: { x: 820, y: 620, w: 1500, h: 1300 },
      sconce: null, // one lamp only — the optional-emitter path
    },
    // the window is a warm sunset here, so the shaft is tinted warm rather than daylight blue
    shaft: {
      topLeft: { x: 820, y: 300 },
      topRight: { x: 1010, y: 300 },
      bottomRight: { x: 900, y: 1010 },
      bottomLeft: { x: 560, y: 1010 },
      tint: [255, 226, 176],
    },
  },
  {
    id: "math",
    name: "Math",
    src: "/art/cabin-math.png",
    firelight: {
      core: { x: 875, y: 645, w: 160, h: 220 },
      floor: { x: 830, y: 830, w: 620, h: 220 },
      bounce: { x: 780, y: 640, w: 1500, h: 1300 },
      sconce: { x: 965, y: 645, w: 130, h: 190 }, // the pair of candles beside the lantern
    },
    shaft: {
      topLeft: { x: 935, y: 330 },
      topRight: { x: 1015, y: 330 },
      bottomRight: { x: 1000, y: 900 },
      bottomLeft: { x: 780, y: 900 },
    },
  },
];

const EFFECTS: { key: AlivenessEffect; label: string }[] = [
  { key: "firelight", label: "Firelight" },
  { key: "shaft", label: "Dust shaft" },
  { key: "parallax", label: "Parallax" },
];

const Harness: React.FC = () => {
  const [roomId, setRoomId] = useState(ROOMS[0]!.id);
  const [effects, setEffects] = useState<Record<AlivenessEffect, boolean>>({
    firelight: true,
    shaft: true,
    parallax: true,
  });
  const reduced = useReducedMotion();
  const room = ROOMS.find((r) => r.id === roomId) ?? ROOMS[0]!;

  return (
    <>
      <div className="frame" data-room={room.id}>
        <CabinAliveness
          art={ART}
          firelight={room.firelight}
          shaft={room.shaft}
          effects={effects}
          // keying on the room drops the canvas and the mote field with it, which is what a real
          // room change does; without it the previous room's motes would drift in the new shaft
          key={room.id}
        >
          <img src={room.src} alt="" draggable={false} />
        </CabinAliveness>
      </div>

      <div className="bar">
        <span className="label">Room</span>
        {ROOMS.map((r) => (
          <button
            key={r.id}
            type="button"
            aria-pressed={r.id === roomId}
            data-room={r.id}
            onClick={() => setRoomId(r.id)}
          >
            {r.name}
          </button>
        ))}
        <span className="label">Effects</span>
        {EFFECTS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            aria-pressed={effects[key]}
            data-effect={key}
            onClick={() => setEffects((e) => ({ ...e, [key]: !e[key] }))}
          >
            {label}
          </button>
        ))}
      </div>

      <p className="note">
        {reduced ? (
          <span className="rm">
            reduce-motion is on: flicker, drift and parallax are held still
          </span>
        ) : (
          "CabinAliveness over a still backdrop. Toggle each effect off to judge what it is buying."
        )}
      </p>
    </>
  );
};

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <Harness />
  </StrictMode>,
);

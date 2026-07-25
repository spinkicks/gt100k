import { useGame } from "../game/store";
import { CABINS } from "./cabins.data";
import "./MapScreen.css";

/**
 * Painterly world map: a background illustration with absolutely-positioned cabin
 * node buttons layered on top. The image itself is decorative — if `/art/map.png`
 * 404s (art is generated in a later task), the container's fallback background
 * color keeps the scene looking intentional and never blocks the node layer.
 */
export const MapScreen: React.FC = () => {
  return (
    <div className="map-screen">
      <img className="map-screen-bg" src="/art/map.png" alt="" aria-hidden="true" />
      {CABINS.map((cabin) => (
        <button
          key={cabin.id}
          type="button"
          className={`map-screen-node${cabin.active ? "" : " inactive"}`}
          style={{ left: `${cabin.xPct}%`, top: `${cabin.yPct}%` }}
          data-cabin={cabin.id}
          disabled={!cabin.active}
          onClick={() => {
            if (cabin.active) useGame.getState().openCabin(cabin.id);
          }}
        >
          {cabin.label}
          {cabin.active ? null : <span className="map-screen-node-badge">soon</span>}
        </button>
      ))}
    </div>
  );
};

export default MapScreen;

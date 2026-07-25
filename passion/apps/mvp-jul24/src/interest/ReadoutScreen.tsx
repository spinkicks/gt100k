import { gadgetById } from "../gadgets/registry";
import { useGame } from "../game/store";
import { useInterest } from "./store";
import "./ReadoutScreen.css";

/** `90000` -> `1.5 min`; anything under a minute is shown in seconds instead. */
function formatActiveTime(ms: number): string {
  if (ms < 60_000) return `${Math.round(ms / 1000)} sec`;
  const minutes = Math.round((ms / 60_000) * 10) / 10;
  return `${minutes} min`;
}

/**
 * Interest readout: one horizontal bar per gadget with any recorded activity,
 * sorted by time-on-task descending. A "Back to map" button returns to the map.
 */
export const ReadoutScreen: React.FC = () => {
  const byGadget = useInterest((s) => s.byGadget);

  const entries = Object.entries(byGadget)
    .filter(([, stats]) => stats.activeMs > 0 || stats.opens > 0 || stats.solves > 0)
    .sort((a, b) => b[1].activeMs - a[1].activeMs);

  const maxMs = Math.max(1, ...entries.map(([, stats]) => stats.activeMs));

  return (
    <div className="readout-screen">
      <h2 className="readout-screen-title">Your interests</h2>
      {entries.length === 0 ? (
        <p className="readout-screen-empty">Nothing explored yet — go play in a cabin!</p>
      ) : (
        <ul className="readout-screen-bars">
          {entries.map(([id, stats]) => {
            const label = gadgetById(id)?.label ?? id;
            return (
              <li key={id} className="readout-screen-bar-row" data-gadget={id}>
                <span className="readout-screen-bar-label">{label}</span>
                <div className="readout-screen-bar-track">
                  <div
                    className="readout-screen-bar-fill"
                    style={{ transform: `scaleX(${Math.min(1, stats.activeMs / maxMs)})` }}
                  />
                </div>
                <span className="readout-screen-bar-value">{formatActiveTime(stats.activeMs)}</span>
              </li>
            );
          })}
        </ul>
      )}
      <button
        type="button"
        className="readout-screen-back"
        onClick={() => useGame.getState().goToMap()}
      >
        Back to map
      </button>
    </div>
  );
};

export default ReadoutScreen;

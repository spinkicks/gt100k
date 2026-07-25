import CabinView from "./cabin/CabinView";
import { useGame } from "./game/store";
import ReadoutScreen from "./interest/ReadoutScreen";
import { useInterestTracker } from "./interest/useInterestTracker";
import MapScreen from "./map/MapScreen";
import GadgetOverlay from "./overlay/GadgetOverlay";
import "./App.css";

/**
 * Top-level router: a persistent top bar (Map / Interest nav) and a body that
 * switches on the current game screen. The cabin A/B backend toggle lives
 * inside CabinView, so it isn't duplicated here.
 */
export default function App() {
  useInterestTracker();
  const screen = useGame((s) => s.screen);

  return (
    <div className="app-root" data-testid="app-root">
      <header className="app-topbar">
        <span className="app-wordmark">
          <svg
            className="app-wordmark-flame"
            viewBox="0 0 24 24"
            aria-hidden="true"
            focusable="false"
          >
            <path
              d="M12 2c1 3-1 4.5-2.5 6.2C7.7 10.3 7 12 7 13.8 7 17.2 9.4 20 12.5 20S18 17.4 18 14c0-2.3-1.2-4.1-2.6-5.7.4 1.5-.2 2.6-1.1 3-.2-2.3-1-4.5-2.3-6.3z"
              fill="var(--ember)"
            />
            <path
              d="M12.4 10c.6 1.4-.3 2.4-1 3.3-.6.8-1 1.7-1 2.6 0 1.6 1.1 2.9 2.6 2.9 1.6 0 2.7-1.3 2.7-3 0-2.2-1.9-3.7-3.3-5.8z"
              fill="var(--ember-bright)"
            />
          </svg>
          Passion Lab
        </span>
        <nav className="app-topbar-nav" aria-label="Primary">
          <button
            type="button"
            className={`app-topbar-btn${screen === "map" || screen === "cabin" ? " active" : ""}`}
            aria-current={screen === "map" || screen === "cabin" ? "page" : undefined}
            onClick={() => useGame.getState().goToMap()}
          >
            Map
          </button>
          <button
            type="button"
            className={`app-topbar-btn${screen === "readout" ? " active" : ""}`}
            aria-current={screen === "readout" ? "page" : undefined}
            onClick={() => useGame.getState().goToReadout()}
          >
            Interest
          </button>
        </nav>
      </header>
      <main className="app-body">
        {screen === "map" ? <MapScreen /> : null}
        {screen === "cabin" ? (
          <>
            <CabinView />
            <GadgetOverlay />
          </>
        ) : null}
        {screen === "readout" ? <ReadoutScreen /> : null}
      </main>
    </div>
  );
}

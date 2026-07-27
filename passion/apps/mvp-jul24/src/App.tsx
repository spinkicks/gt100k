import CabinView from "./cabin/CabinView";
import { useGame } from "./game/store";
import ReadoutScreen from "./interest/ReadoutScreen";
import { useInterestTracker } from "./interest/useInterestTracker";
import MapScreen from "./map/MapScreen";
import GadgetOverlay from "./overlay/GadgetOverlay";
import "./App.css";

/**
 * Top-level router: a persistent top bar and a body that switches on the current game screen.
 *
 * There is deliberately NO interest / readout entry point here. A child-facing display of their own
 * time-on-task is refused by PRD §11 three times over — it is a quantified display of the child's
 * own engagement, it makes the measured quantity a target (converting the instrument into an
 * engagement-contingent reward, d = -0.46 in children and growing to -0.55 by ~2 weeks), and "your
 * interests" asserts the fixed discovered-interest model. The screen still exists for operators
 * behind `window.__qa.showReadout()` — see src/qa.ts. Do not re-add a button.
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

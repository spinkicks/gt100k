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
        <button
          type="button"
          className="app-topbar-btn"
          onClick={() => useGame.getState().goToMap()}
        >
          Map
        </button>
        <button
          type="button"
          className="app-topbar-btn"
          onClick={() => useGame.getState().goToReadout()}
        >
          Interest
        </button>
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

import { createRoot } from "react-dom/client";
import App from "./App";
import { installQa } from "./qa";
import { startUplink } from "./signals/session";
import "./theme.css";

installQa();

// No-op unless VITE_GT100K_INGEST_URL is set. Started here rather than in a component because it
// belongs to the page rather than to any tree, and a remount must not restart the timer.
startUplink();

createRoot(document.getElementById("root")!).render(<App />);

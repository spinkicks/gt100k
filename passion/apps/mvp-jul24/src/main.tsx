import { createRoot } from "react-dom/client";
import App from "./App";
import { installQa } from "./qa";
import { startUplink } from "./signals/session";
// Before theme.css, deliberately. The contract and this app both define --ink, --font-body and
// --font-display; at equal specificity the later declaration wins, so importing the contract first
// is what lets the cabin keep its own art direction while taking the sizing scale. `token-order.test`
// fails if this order is ever swapped.
import "@gt100k/design-tokens/contract.css";
import "./theme.css";

installQa();

// No-op unless VITE_GT100K_INGEST_URL is set. Started here rather than in a component because it
// belongs to the page rather than to any tree, and a remount must not restart the timer.
startUplink();

createRoot(document.getElementById("root")!).render(<App />);

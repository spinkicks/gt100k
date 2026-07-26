import { createRoot } from "react-dom/client";
import App from "./App";
import { installQa } from "./qa";
import "./theme.css";

installQa();

createRoot(document.getElementById("root")!).render(<App />);

/**
 * Entry point. Installs the window.__cabin harness hook BEFORE React mounts, wraps the app in an
 * error boundary + global error handlers that surface failures loudly (never a silent blank frame),
 * and renders the App.
 */
import { Component, type ReactNode, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { installHook, setError } from "./core/hook";
import "./styles.css";

installHook();
window.addEventListener("error", (e) => setError(e.error ?? e.message));
window.addEventListener("unhandledrejection", (e) => setError(e.reason));

class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }
  componentDidCatch(error: unknown): void {
    setError(error);
  }
  render(): ReactNode {
    return this.state.failed ? null : this.props.children;
  }
}

const root = document.getElementById("app");
if (!root) {
  setError("missing #app root");
} else {
  createRoot(root).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>,
  );
}

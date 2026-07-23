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

// Benign, self-recovering failures we must NOT escalate to the fatal error overlay:
//  - Asset-loader failures (a missing GLB/HDR/texture → dev server returns index.html → the loader
//    throws) are handled by the per-asset error boundaries + procedural fallbacks.
//  - Pointer-lock rejections ("cannot be acquired immediately after the user has exited the lock")
//    are a benign browser timing quirk; the next click succeeds.
// Only genuine app errors surface.
function isBenignError(x: unknown): boolean {
  const m = (x instanceof Error ? x.message : String(x ?? "")).toLowerCase();
  return /\.glb|\.gltf|\.hdr|\.jpg|\.png|could not load|gltf|texture|unexpected token '<'|not valid json|pointer ?lock/.test(
    m,
  );
}
window.addEventListener("error", (e) => {
  if (!isBenignError(e.error ?? e.message)) setError(e.error ?? e.message);
});
window.addEventListener("unhandledrejection", (e) => {
  if (!isBenignError(e.reason)) setError(e.reason);
});

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

"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

export interface World3DBoundaryProps {
  /** The 3D world subtree to guard. Any render error inside it is caught here. */
  children: ReactNode;
  /** Calm, non-white-screen stand-in shown while the world is unavailable. */
  fallback: ReactNode;
  /**
   * Fired once when the world subtree first throws, so the parent can retire the
   * WebGL tier (drop to the 2D board) instead of leaving a broken canvas mounted.
   */
  onError?: (error: Error) => void;
}

interface World3DBoundaryState {
  hasError: boolean;
}

/**
 * Error boundary around the decorative 3D `<Canvas>`. A render error in three /
 * drei (e.g. a WebGL failure) must never white-screen the child experience — the
 * accessible DOM ledger below is the real UI, so we swap the world for a calm
 * fallback and notify the parent to fall back to the 2D board.
 */
export class World3DBoundary extends Component<World3DBoundaryProps, World3DBoundaryState> {
  state: World3DBoundaryState = { hasError: false };

  static getDerivedStateFromError(): World3DBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, _info: ErrorInfo): void {
    this.props.onError?.(error);
  }

  render(): ReactNode {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

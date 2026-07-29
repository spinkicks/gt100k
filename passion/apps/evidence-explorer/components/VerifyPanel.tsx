"use client";
/**
 * Verify panel wrapper (§Task 2 fix). `Observatory` owns the `verifyOpen`/`verifyVisual` state and
 * renders the `<HudProvider>` that `audioCaptions` lives in — a provider component can't read its own
 * context, so this thin child sits *inside* the `HudProvider` subtree, reads `audioCaptions` there,
 * and forwards it to `VerifyBox` alongside `verification`/`onVisualChange`. Keeps the audio-captions
 * HUD toggle reaching the seal announcement exactly as it did before the state lift.
 */
import type { JSX } from "react";
import { VerifyBox } from "./VerifyBox.js";
import { useHud } from "./hud-state.js";
import type { SyntheticVerification } from "./synthetic-view.js";
import type { VerifyVisualState } from "./verify-machine.js";

export function VerifyPanel({
  verification,
  onVisualChange,
}: {
  verification: SyntheticVerification;
  onVisualChange: (state: VerifyVisualState) => void;
}): JSX.Element {
  const { audioCaptions } = useHud();
  return (
    <VerifyBox
      verification={verification}
      audioCaptions={audioCaptions}
      onVisualChange={onVisualChange}
    />
  );
}

"use client";

import { EASINGS, resolveMotion } from "@gt100k/arena-world";
import { AnimatePresence, motion } from "motion/react";
import * as React from "react";
import styles from "./Onboarding.module.css";

export interface OnboardingBeat {
  id: "this-is-you" | "light-a-path" | "your-way";
  anchor: "avatar" | "available-node" | "controls";
  title: string;
  body: string;
}

export const ONBOARDING_BEATS = [
  {
    id: "this-is-you",
    anchor: "avatar",
    title: "This is you",
    body: "Your Spark travels the islands with you.",
  },
  {
    id: "light-a-path",
    anchor: "available-node",
    title: "Light a path",
    body: "Choose an available landmark. Show what you know at its gate to light the beacon.",
  },
  {
    id: "your-way",
    anchor: "controls",
    title: "Your way",
    body: "Use Plain mode or the Arena Ledger any time. Standings stay off unless you choose them.",
  },
] as const satisfies readonly OnboardingBeat[];

export const ONBOARDING_INPUT_EVENTS = ["pointerdown", "keydown", "wheel", "click"] as const;
export const ONBOARDING_STORAGE_KEY = "gt100k.arena.onboarding.v1";

const ONBOARDING_STORAGE_VALUE = "shown";
const WHEEL_GESTURE_WINDOW_MS = 500;
const SYNTHETIC_CLICK_WINDOW_MS = 750;

function parseCubicBezier(value: string): [number, number, number, number] {
  const match = /^cubic-bezier\(([^)]+)\)$/.exec(value);
  const values = match?.[1]?.split(",").map(Number);
  if (!values || values.length !== 4 || values.some((entry) => !Number.isFinite(entry))) {
    throw new Error(`Invalid Arena cubic-bezier token: ${value}`);
  }

  return [values[0] ?? 0, values[1] ?? 0, values[2] ?? 0, values[3] ?? 0];
}

export const ONBOARDING_EASE = parseCubicBezier(EASINGS.enter.css);

export interface OnboardingInputRecord {
  type: (typeof ONBOARDING_INPUT_EVENTS)[number];
  timeStamp: number;
  repeat?: boolean;
}

export function shouldAdvanceOnboardingInput(
  input: OnboardingInputRecord,
  previous?: OnboardingInputRecord,
): boolean {
  if (input.type === "keydown" && input.repeat === true) return false;
  if (!previous) return true;

  const elapsedMs = input.timeStamp - previous.timeStamp;
  if (elapsedMs < 0) return true;
  if (input.type === "wheel" && previous.type === "wheel" && elapsedMs < WHEEL_GESTURE_WINDOW_MS) {
    return false;
  }
  if (
    input.type === "click" &&
    (previous.type === "pointerdown" || previous.type === "keydown") &&
    elapsedMs < SYNTHETIC_CLICK_WINDOW_MS
  ) {
    return false;
  }

  return true;
}

export function installOnboardingInputListeners(
  target: EventTarget,
  onAdvance: () => void,
): () => void {
  let previous: OnboardingInputRecord | undefined;
  const listenerOptions = { capture: true, passive: true } as const;
  const handleInput: EventListener = (event) => {
    const input: OnboardingInputRecord = {
      type: event.type as OnboardingInputRecord["type"],
      timeStamp: event.timeStamp,
      repeat: "repeat" in event ? event.repeat === true : undefined,
    };
    if (!shouldAdvanceOnboardingInput(input, previous)) return;

    previous = input;
    onAdvance();
  };

  for (const eventName of ONBOARDING_INPUT_EVENTS) {
    target.addEventListener(eventName, handleInput, listenerOptions);
  }

  return () => {
    for (const eventName of ONBOARDING_INPUT_EVENTS) {
      target.removeEventListener(eventName, handleInput, listenerOptions);
    }
  };
}

interface OnboardingStorageReader {
  getItem(key: string): string | null;
}

interface OnboardingStorageWriter {
  setItem(key: string, value: string): void;
}

export function hasShownOnboarding(storage?: OnboardingStorageReader): boolean {
  try {
    return storage?.getItem(ONBOARDING_STORAGE_KEY) === ONBOARDING_STORAGE_VALUE;
  } catch {
    return false;
  }
}

export function markOnboardingShown(storage?: OnboardingStorageWriter): void {
  try {
    storage?.setItem(ONBOARDING_STORAGE_KEY, ONBOARDING_STORAGE_VALUE);
  } catch {
    // Storage can be unavailable in privacy-restricted browsers; onboarding remains session-local.
  }
}

export function nextOnboardingBeat(index: number): number | null {
  if (!Number.isInteger(index) || index < 0 || index >= ONBOARDING_BEATS.length - 1) {
    return null;
  }

  return index + 1;
}

export interface OnboardingLedgerState {
  beat: OnboardingBeat;
  step: number;
  total: number;
  onDismiss(): void;
}

export interface ArenaOnboardingController {
  activeBeatIndex: number | null;
  ledgerState?: OnboardingLedgerState;
  advance(): void;
  dismiss(): void;
  open(): void;
}

export function useArenaOnboarding(): ArenaOnboardingController {
  const [activeBeatIndex, setActiveBeatIndex] = React.useState<number | null>(null);

  React.useEffect(() => {
    let storage: Storage | undefined;
    try {
      storage = window.localStorage;
    } catch {
      storage = undefined;
    }

    if (hasShownOnboarding(storage)) return;
    markOnboardingShown(storage);
    setActiveBeatIndex(0);
  }, []);

  const advance = React.useCallback(() => {
    setActiveBeatIndex((current) => (current === null ? null : nextOnboardingBeat(current)));
  }, []);
  const dismiss = React.useCallback(() => setActiveBeatIndex(null), []);
  const open = React.useCallback(() => setActiveBeatIndex(0), []);
  const activeBeat = activeBeatIndex === null ? undefined : ONBOARDING_BEATS[activeBeatIndex];

  return {
    activeBeatIndex,
    ledgerState:
      activeBeat && activeBeatIndex !== null
        ? {
            beat: activeBeat,
            step: activeBeatIndex + 1,
            total: ONBOARDING_BEATS.length,
            onDismiss: dismiss,
          }
        : undefined,
    advance,
    dismiss,
    open,
  };
}

export interface OnboardingProps {
  activeBeatIndex: number | null;
  reducedMotion: boolean;
  onAdvance(): void;
}

export default function Onboarding({ activeBeatIndex, reducedMotion, onAdvance }: OnboardingProps) {
  const beat = activeBeatIndex === null ? undefined : ONBOARDING_BEATS[activeBeatIndex];
  const token = resolveMotion("onboardBeat", { reducedMotion });
  const active = beat !== undefined;

  React.useEffect(() => {
    if (!active) return;
    return installOnboardingInputListeners(window, onAdvance);
  }, [active, onAdvance]);

  return (
    <AnimatePresence initial={false}>
      {beat && activeBeatIndex !== null ? (
        <motion.aside
          animate={{ opacity: 1, transform: "translate3d(0, 0rem, 0)" }}
          aria-hidden="true"
          className={styles.coachmark}
          data-anchor={beat.anchor}
          data-motion-mode={reducedMotion ? "reduced" : "animated"}
          data-onboarding-beat={beat.id}
          exit={{
            opacity: 0,
            transform: reducedMotion ? "translate3d(0, 0rem, 0)" : "translate3d(0, -0.35rem, 0)",
          }}
          initial={{
            opacity: reducedMotion ? 1 : 0,
            transform: reducedMotion ? "translate3d(0, 0rem, 0)" : "translate3d(0, 0.75rem, 0)",
          }}
          key={beat.id}
          transition={{
            duration: token.durationMs / 1_000,
            ease: ONBOARDING_EASE,
          }}
        >
          <span className={styles.anchorCue}>✦</span>
          <div>
            <p className={styles.step}>
              Step {activeBeatIndex + 1} of {ONBOARDING_BEATS.length}
            </p>
            <h2>{beat.title}</h2>
            <p className={styles.body}>{beat.body}</p>
            <p className={styles.hint}>Any key, click, or scroll continues.</p>
          </div>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}

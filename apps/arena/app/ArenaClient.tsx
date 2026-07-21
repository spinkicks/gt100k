"use client";

import {
  type AgeBand,
  type AvatarState,
  CATALOG,
  type CohortBase,
  type DeviceCaps,
  FIXTURE,
  type QualityTier,
  TIERS,
  buildArenaView,
  createSyntheticMasteryFeed,
  equipCosmetic,
} from "@gt100k/arena-world";
import dynamic from "next/dynamic";
import * as React from "react";
import Hud from "./hud/Hud";
import Onboarding, { useArenaOnboarding } from "./hud/Onboarding";
import ArenaLedger from "./ledger/ArenaLedger";
import Fallback2D from "./scene/Fallback2D";
import { createArenaEventBus } from "./scene/eventBus";
import type { SequencedArenaFeedback } from "./scene/feedback";

const DynamicArenaCanvas = dynamic(() => import("./scene/ArenaCanvas"), { ssr: false });

const DEFAULT_SEED = 42;
const DEFAULT_AGE_BAND: AgeBand = "9-11";
const AGE_BANDS: readonly AgeBand[] = ["6-8", "9-11", "12-14"];
const QUALITY_PREFERENCES = ["auto", "A", "B", "C", "D"] as const;
const REDUCED_MOTION_DEFAULTS = ["system", "on", "off"] as const;
const DEFAULT_AVATAR: AvatarState = {
  learnerRef: "learner-synthetic-001",
  equipped: [],
};
const DEFAULT_BASE: CohortBase = {
  cohortRef: "cohort-synthetic-six",
  contributions: [
    { missionId: "m1", feature: "campfire", by: "kestrel" },
    { missionId: "m2", feature: "banner", by: "otter" },
    { missionId: "m3", feature: "garden", by: "kestrel" },
  ],
  unlockedFeatures: ["campfire", "banner", "garden"],
};
const DEFAULT_NEAR_PEERS = [
  { pseudonym: "kestrel", gain: 260 },
  { pseudonym: "otter", gain: 340 },
  { pseudonym: "finch", gain: 300 },
] as const;

type QualityPreference = (typeof QUALITY_PREFERENCES)[number];
type ReducedMotionDefault = (typeof REDUCED_MOTION_DEFAULTS)[number];

export interface ArenaPublicConfig {
  seed: number;
  reducedMotionDefault: ReducedMotionDefault;
  ageBand: AgeBand;
  qualityTier: QualityPreference;
}

export interface BrowserCapabilityProbe {
  getContext(kind: "webgl2" | "webgl"): unknown;
  matches(query: "(prefers-reduced-motion: reduce)" | "(pointer: coarse)"): boolean;
  userAgent: string;
  deviceMemoryGB?: number;
  hardwareConcurrency?: number;
  saveData?: boolean;
}

interface PublicConfigInput {
  seed?: string;
  reducedMotionDefault?: string;
  ageBand?: string;
  qualityTier?: string;
}

function includes<T extends string>(values: readonly T[], value: string | undefined): value is T {
  return value !== undefined && values.includes(value as T);
}

export function parseArenaPublicConfig(input: PublicConfigInput): ArenaPublicConfig {
  const parsedSeed = Number.parseInt(input.seed ?? "", 10);

  return {
    seed: Number.isSafeInteger(parsedSeed) && parsedSeed >= 0 ? parsedSeed : DEFAULT_SEED,
    reducedMotionDefault: includes(REDUCED_MOTION_DEFAULTS, input.reducedMotionDefault)
      ? input.reducedMotionDefault
      : "system",
    ageBand: includes(AGE_BANDS, input.ageBand) ? input.ageBand : DEFAULT_AGE_BAND,
    qualityTier: includes(QUALITY_PREFERENCES, input.qualityTier) ? input.qualityTier : "auto",
  };
}

export function gatherDeviceCaps(probe: BrowserCapabilityProbe): DeviceCaps {
  const webgl2 = Boolean(probe.getContext("webgl2"));
  const webgl1 = Boolean(probe.getContext("webgl"));
  const isSafari =
    /Safari/i.test(probe.userAgent) &&
    !/(?:Android|Chrome|Chromium|CriOS|EdgiOS|FxiOS|OPiOS)/i.test(probe.userAgent);

  return {
    webgl2,
    webgl1,
    prefersReducedMotion: probe.matches("(prefers-reduced-motion: reduce)"),
    savePower: probe.saveData === true,
    deviceMemoryGB: probe.deviceMemoryGB,
    hardwareConcurrency: probe.hardwareConcurrency,
    isSafari,
    coarsePointer: probe.matches("(pointer: coarse)"),
  };
}

function createBrowserCapabilityProbe(): BrowserCapabilityProbe {
  const browserNavigator = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean };
  };

  return {
    getContext(kind) {
      return document.createElement("canvas").getContext(kind);
    },
    matches(query) {
      return window.matchMedia(query).matches;
    },
    userAgent: browserNavigator.userAgent,
    deviceMemoryGB: browserNavigator.deviceMemory,
    hardwareConcurrency: browserNavigator.hardwareConcurrency,
    saveData: browserNavigator.connection?.saveData,
  };
}

function capsForTier(tier: QualityTier): DeviceCaps {
  if (tier === "D") {
    return { webgl2: false, webgl1: false, prefersReducedMotion: false };
  }
  if (tier === "C") {
    return {
      webgl2: true,
      webgl1: true,
      prefersReducedMotion: true,
      savePower: false,
      deviceMemoryGB: 8,
      hardwareConcurrency: 8,
      isSafari: false,
      coarsePointer: false,
    };
  }
  if (tier === "B") {
    return {
      webgl2: true,
      webgl1: true,
      prefersReducedMotion: false,
      savePower: false,
      deviceMemoryGB: 8,
      hardwareConcurrency: 8,
      isSafari: true,
      coarsePointer: false,
    };
  }
  return {
    webgl2: true,
    webgl1: true,
    prefersReducedMotion: false,
    savePower: false,
    deviceMemoryGB: 8,
    hardwareConcurrency: 8,
    isSafari: false,
    coarsePointer: false,
  };
}

function prefersReducedMotion(caps: DeviceCaps, config: ArenaPublicConfig): boolean {
  if (config.reducedMotionDefault === "on") return true;
  if (config.reducedMotionDefault === "off") return false;
  return caps.prefersReducedMotion;
}

function resolveEffectiveCaps(
  caps: DeviceCaps,
  config: ArenaPublicConfig,
  runtimeTier?: QualityTier,
): { caps: DeviceCaps; reducedMotion: boolean } {
  const qualityPreference = runtimeTier ?? config.qualityTier;
  const reducedByPreference = prefersReducedMotion(caps, config);
  const reducedMotion =
    reducedByPreference ||
    qualityPreference === "C" ||
    (qualityPreference === "auto" && caps.savePower === true);
  const qualityCaps = qualityPreference === "auto" ? { ...caps } : capsForTier(qualityPreference);

  return {
    caps: { ...qualityCaps, prefersReducedMotion: reducedMotion },
    reducedMotion,
  };
}

export function createArenaClientSnapshot(
  caps: DeviceCaps,
  config: ArenaPublicConfig,
  runtimeTier?: QualityTier,
  avatar: AvatarState = DEFAULT_AVATAR,
) {
  const effective = resolveEffectiveCaps(caps, config, runtimeTier);
  const view = buildArenaView({
    world: FIXTURE,
    signals: createSyntheticMasteryFeed(),
    tierTable: TIERS,
    catalog: CATALOG,
    avatar,
    base: DEFAULT_BASE,
    nearPeers: DEFAULT_NEAR_PEERS,
    caps: effective.caps,
    options: {
      ageBand: config.ageBand,
      reducedMotion: effective.reducedMotion,
      plainMode: false,
      standingsOptedIn: false,
    },
  });

  return {
    view,
    renderer: view.presentation.qualityBudget.canvas
      ? ("canvas" as const)
      : ("fallback-2d" as const),
  };
}

const PUBLIC_CONFIG = parseArenaPublicConfig({
  seed: process.env.NEXT_PUBLIC_ARENA_SEED,
  reducedMotionDefault: process.env.NEXT_PUBLIC_REDUCED_MOTION_DEFAULT,
  ageBand: process.env.NEXT_PUBLIC_DEFAULT_AGE_BAND,
  qualityTier: process.env.NEXT_PUBLIC_QUALITY_TIER,
});

const SERVER_SAFE_CAPS: DeviceCaps = {
  webgl2: false,
  webgl1: false,
  prefersReducedMotion: false,
};

export default function ArenaClient() {
  const onboarding = useArenaOnboarding();
  const [eventBus] = React.useState(createArenaEventBus);
  const [caps, setCaps] = React.useState<DeviceCaps>(SERVER_SAFE_CAPS);
  const [runtimeTier, setRuntimeTier] = React.useState<QualityTier>();
  const [targetNodeId, setTargetNodeId] = React.useState<string>();
  const [homeFocused, setHomeFocused] = React.useState(true);
  const [focusedBaseFeature, setFocusedBaseFeature] = React.useState<string>();
  const [feedback, setFeedback] = React.useState<SequencedArenaFeedback>();
  const feedbackSequence = React.useRef(0);
  const [avatar, setAvatar] = React.useState<AvatarState>(() => ({
    learnerRef: DEFAULT_AVATAR.learnerRef,
    equipped: [...DEFAULT_AVATAR.equipped],
  }));

  React.useEffect(() => {
    setCaps(gatherDeviceCaps(createBrowserCapabilityProbe()));
  }, []);

  React.useEffect(() => {
    const stopFocus = eventBus.subscribe("focus-node", ({ nodeId }) => {
      setFocusedBaseFeature(undefined);
      setHomeFocused(false);
      setTargetNodeId(nodeId);
    });
    const stopHome = eventBus.subscribe("focus-home", () => {
      setFocusedBaseFeature(undefined);
      setHomeFocused(true);
      setTargetNodeId(undefined);
    });
    const stopBaseFeature = eventBus.subscribe("focus-base-feature", ({ feature }) => {
      setFocusedBaseFeature(feature);
      setHomeFocused(true);
      setTargetNodeId(undefined);
    });
    const stopTier = eventBus.subscribe("tier-degraded", ({ to }) => setRuntimeTier(to));
    const stopFeedback = eventBus.subscribe("learning-moment", (signal) => {
      feedbackSequence.current += 1;
      setFeedback({ sequence: feedbackSequence.current, signal: { ...signal } });
    });

    return () => {
      stopFocus();
      stopHome();
      stopBaseFeature();
      stopTier();
      stopFeedback();
      eventBus.clear();
    };
  }, [eventBus]);

  const snapshot = React.useMemo(
    () => createArenaClientSnapshot(caps, PUBLIC_CONFIG, runtimeTier, avatar),
    [avatar, caps, runtimeTier],
  );
  const { renderer, view } = snapshot;
  const handleCanvasFallback = React.useCallback(() => setRuntimeTier("D"), []);

  React.useEffect(
    () =>
      eventBus.subscribe("equip-cosmetic", ({ cosmeticId }) => {
        if (!view.eligibility.eligibleIds.includes(cosmeticId)) return;
        setAvatar((current) => equipCosmetic(current, cosmeticId, view.eligibility));
      }),
    [eventBus, view.eligibility],
  );

  return (
    <section
      className="arena-client"
      data-arena-client="ready"
      data-quality-tier={view.presentation.qualityTier}
      data-reduced-motion={view.flags.reducedMotion ? "true" : "false"}
    >
      <div className="arena-stage">
        <div className="arena-visual">
          {renderer === "canvas" ? (
            <DynamicArenaCanvas
              eventBus={eventBus}
              feedback={feedback}
              focusedBaseFeature={focusedBaseFeature}
              homeFocused={homeFocused}
              onFallback={handleCanvasFallback}
              targetNodeId={targetNodeId}
              view={view}
            />
          ) : (
            <Fallback2D view={view} focusedFeature={focusedBaseFeature} />
          )}
        </div>
        <Onboarding
          activeBeatIndex={onboarding.activeBeatIndex}
          onAdvance={onboarding.advance}
          reducedMotion={view.flags.reducedMotion}
        />
        <Hud catalog={CATALOG} eventBus={eventBus} onOpenOnboarding={onboarding.open} view={view} />
      </div>
      <ArenaLedger
        eventBus={eventBus}
        feedback={feedback}
        onboarding={onboarding.ledgerState}
        view={view}
        catalog={CATALOG}
      />
    </section>
  );
}

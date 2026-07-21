import type {
  AgeBand,
  CelebrationEvent,
  LearningMomentSignal,
  QualityTier,
} from "@gt100k/arena-world";

export const ARENA_EVENT_NAMES = [
  "set-band",
  "toggle-plain",
  "toggle-audio",
  "toggle-standings",
  "equip-cosmetic",
  "advance-feed",
  "learning-moment",
  "focus-node",
  "focus-home",
  "focus-base-feature",
  "node-focused",
  "unlock-celebrated",
  "tier-degraded",
] as const;

export type ArenaEventName = (typeof ARENA_EVENT_NAMES)[number];

export interface ArenaEventMap {
  "set-band": { ageBand: AgeBand };
  "toggle-plain": { enabled: boolean };
  "toggle-audio": { enabled: boolean };
  "toggle-standings": { enabled: boolean };
  "equip-cosmetic": { cosmeticId: string };
  "advance-feed": undefined;
  "learning-moment": LearningMomentSignal;
  "focus-node": { nodeId: string };
  "focus-home": undefined;
  "focus-base-feature": { feature: string };
  "node-focused": { nodeId: string };
  "unlock-celebrated": { nodeId: string; intensity: CelebrationEvent["intensity"] };
  "tier-degraded": {
    from: QualityTier;
    to: QualityTier;
    reason: "frame-budget" | "context-loss";
  };
}

type ArenaEventListener<Name extends ArenaEventName> = (payload: ArenaEventMap[Name]) => void;
type AnyArenaEventListener = (payload: ArenaEventMap[ArenaEventName]) => void;

export interface ArenaEventBus {
  emit<Name extends ArenaEventName>(name: Name, payload: ArenaEventMap[Name]): void;
  subscribe<Name extends ArenaEventName>(
    name: Name,
    listener: ArenaEventListener<Name>,
  ): () => void;
  clear(): void;
}

export function createArenaEventBus(): ArenaEventBus {
  const listeners = new Map<ArenaEventName, Set<AnyArenaEventListener>>();

  return {
    emit(name, payload) {
      const listenersForEvent = listeners.get(name);
      if (!listenersForEvent) return;

      for (const listener of [...listenersForEvent]) {
        listener(payload);
      }
    },
    subscribe(name, listener) {
      let listenersForEvent = listeners.get(name);
      if (!listenersForEvent) {
        listenersForEvent = new Set();
        listeners.set(name, listenersForEvent);
      }

      const typedListener = listener as AnyArenaEventListener;
      listenersForEvent.add(typedListener);

      return () => {
        listenersForEvent?.delete(typedListener);
        if (listenersForEvent?.size === 0) listeners.delete(name);
      };
    },
    clear() {
      listeners.clear();
    },
  };
}

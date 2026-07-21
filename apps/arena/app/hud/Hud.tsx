"use client";

import { type Cosmetic, type InitialArenaView, TIERS, resolveMotion } from "@gt100k/arena-world";
import { AnimatePresence, motion } from "motion/react";
import * as React from "react";
import type { ArenaEventBus } from "../scene/eventBus";
import styles from "./Hud.module.css";

export interface HudCosmeticEntry {
  id: string;
  kind: Cosmetic["kind"];
  look: string;
  equipEffect: string;
  eligible: boolean;
  equipped: boolean;
  earnGoal: string;
}

function labelRegion(region: string): string {
  return region
    .split("-")
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ");
}

function earnGoalFor(cosmetic: Cosmetic): string {
  const rule = cosmetic.eligibility;

  switch (rule.type) {
    case "min-tier": {
      const tier = TIERS.find(({ index }) => index === rule.tierIndex);
      return tier ? `Reach ${tier.label}` : `Reach tier ${rule.tierIndex}`;
    }
    case "min-unlocks":
      return `Light ${rule.count} ${rule.count === 1 ? "beacon" : "beacons"}`;
    case "region-complete":
      return `Light every beacon in ${labelRegion(rule.region)}`;
  }
}

export function buildHudCosmeticEntries(
  view: InitialArenaView,
  catalog: readonly Cosmetic[],
): HudCosmeticEntry[] {
  const eligibleIds = new Set(view.eligibility.eligibleIds);
  const equippedIds = new Set(view.avatar.equipped);

  return catalog.map((cosmetic) => ({
    id: cosmetic.id,
    kind: cosmetic.kind,
    look: cosmetic.look,
    equipEffect: cosmetic.equipEffect,
    eligible: eligibleIds.has(cosmetic.id),
    equipped: equippedIds.has(cosmetic.id),
    earnGoal: earnGoalFor(cosmetic),
  }));
}

function labelKind(kind: Cosmetic["kind"]): string {
  switch (kind) {
    case "avatar-item":
      return "Spark gear";
    case "world-theme":
      return "World light";
    case "base-theme":
      return "Base Camp";
    case "celebration-effect":
      return "Celebration";
  }
}

interface NumberTickerProps {
  value: number;
  reducedMotion: boolean;
}

function NumberTicker({ value, reducedMotion }: NumberTickerProps) {
  const token = resolveMotion("tierAdvance", { reducedMotion });

  return (
    <span className={styles.ticker} aria-label={`${value >= 0 ? "plus " : ""}${value}`}>
      <AnimatePresence initial={false}>
        <motion.span
          animate={{ opacity: 1, transform: "translateY(0)" }}
          className={styles.tickerValue}
          initial={
            reducedMotion
              ? { opacity: 1, transform: "translateY(0)" }
              : { opacity: 0, transform: "translateY(0.35em)" }
          }
          key={value}
          transition={{
            duration: token.durationMs / 1_000,
            ease: [0.23, 1, 0.32, 1],
          }}
        >
          {value >= 0 ? "+" : ""}
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

export interface HudProps {
  view: InitialArenaView;
  catalog: readonly Cosmetic[];
  eventBus: Pick<ArenaEventBus, "emit">;
  onOpenOnboarding(): void;
}

export default function Hud({ view, catalog, eventBus, onOpenOnboarding }: HudProps) {
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const wardrobeTrigger = React.useRef<HTMLButtonElement>(null);
  const closeButton = React.useRef<HTMLButtonElement>(null);
  const entries = React.useMemo(() => buildHudCosmeticEntries(view, catalog), [catalog, view]);
  const drawerToken = resolveMotion("drawerOpen", {
    reducedMotion: view.flags.reducedMotion,
  });
  const availableCount = entries.filter(({ eligible }) => eligible).length;
  const closeDrawer = React.useCallback(() => {
    setDrawerOpen(false);
    wardrobeTrigger.current?.focus();
  }, []);

  React.useEffect(() => {
    if (drawerOpen) closeButton.current?.focus();
  }, [drawerOpen]);

  return (
    <div className={styles.hud} data-arena-hud="ready">
      <div className={styles.quality} aria-label={`Quality tier ${view.presentation.qualityTier}`}>
        Quality {view.presentation.qualityTier}
      </div>

      <motion.button
        aria-label="Open arena guide"
        className={styles.guideButton}
        onClick={onOpenOnboarding}
        title="Open guide"
        type="button"
        whileTap={{ transform: "scale(0.97)" }}
      >
        ?
      </motion.button>

      <section className={styles.progress} aria-labelledby="arena-growth-title">
        <div>
          <p className={styles.progressLabel} id="arena-growth-title">
            {view.representation.currencyLabel}
          </p>
          <NumberTicker
            reducedMotion={view.flags.reducedMotion}
            value={view.progression.growthVsPast.delta}
          />
        </div>
        <div className={styles.tier}>
          <span className={styles.tierLabel}>Current light</span>
          <strong>{view.progression.tier.label}</strong>
        </div>
      </section>

      <div className={styles.wardrobe}>
        <motion.button
          aria-controls="arena-cosmetic-drawer"
          aria-expanded={drawerOpen}
          className={styles.wardrobeTrigger}
          onClick={() => setDrawerOpen((open) => !open)}
          ref={wardrobeTrigger}
          type="button"
          whileTap={{ transform: "scale(0.97)" }}
        >
          <span>Wardrobe</span>
          <span className={styles.wardrobeCount}>{availableCount} earned</span>
        </motion.button>

        <AnimatePresence initial={false}>
          {drawerOpen ? (
            <motion.section
              animate={{ opacity: 1, transform: "scale(1)" }}
              aria-label="Earned cosmetics"
              className={styles.drawer}
              exit={{
                opacity: 0,
                transform: view.flags.reducedMotion ? "scale(1)" : "scale(0.96)",
                transition: { duration: 0.15 },
              }}
              id="arena-cosmetic-drawer"
              initial={{
                opacity: 0,
                transform: view.flags.reducedMotion ? "scale(1)" : "scale(0.96)",
              }}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  event.preventDefault();
                  closeDrawer();
                }
              }}
              transition={{
                duration: drawerToken.durationMs / 1_000,
                ease: [0.23, 1, 0.32, 1],
              }}
            >
              <header className={styles.drawerHeader}>
                <div>
                  <h2>Earned looks</h2>
                  <p>Choose what your Spark carries into the world.</p>
                </div>
                <button
                  aria-label="Close wardrobe"
                  className={styles.closeButton}
                  onClick={closeDrawer}
                  ref={closeButton}
                  type="button"
                >
                  ×
                </button>
              </header>
              <ul className={styles.cosmeticList}>
                {entries.map((entry, index) => (
                  <motion.li
                    animate={{ opacity: 1, transform: "translateY(0)" }}
                    className={styles.cosmeticRow}
                    initial={
                      view.flags.reducedMotion
                        ? { opacity: 0, transform: "translateY(0)" }
                        : { opacity: 0, transform: "translateY(0.4rem)" }
                    }
                    key={entry.id}
                    transition={{
                      delay: view.flags.reducedMotion ? 0 : index * 0.04,
                      duration: view.flags.reducedMotion ? 0.15 : 0.22,
                      ease: [0.23, 1, 0.32, 1],
                    }}
                  >
                    <div className={styles.cosmeticCopy}>
                      <span className={styles.kind}>{labelKind(entry.kind)}</span>
                      <strong>{entry.look}</strong>
                      <span className={styles.effect}>{entry.equipEffect}</span>
                      {!entry.eligible ? (
                        <span className={styles.earnGoal}>Earn goal: {entry.earnGoal}</span>
                      ) : null}
                    </div>
                    <motion.button
                      aria-label={`${entry.equipped ? "Equipped" : "Equip"} ${entry.look}`}
                      className={styles.equipButton}
                      disabled={!entry.eligible || entry.equipped}
                      onClick={() => {
                        if (!entry.eligible || entry.equipped) return;
                        eventBus.emit("equip-cosmetic", { cosmeticId: entry.id });
                      }}
                      type="button"
                      whileTap={{ transform: "scale(0.97)" }}
                    >
                      {entry.equipped ? "Equipped" : entry.eligible ? "Equip" : "Locked"}
                    </motion.button>
                  </motion.li>
                ))}
              </ul>
            </motion.section>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}

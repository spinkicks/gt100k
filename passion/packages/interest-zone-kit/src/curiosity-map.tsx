import type { CuriosityMapReturnState, CuriosityMapView, ZoneId } from "@gt100k/interest-lab-view";
import { type KeyboardEvent, useRef, useState } from "react";

export interface CuriosityMapProps {
  view: CuriosityMapView;
  activeZoneId: ZoneId | null;
  dayOffset: number;
  onEnterZone: (zoneId: ZoneId) => void;
  onSetDayOffset: (dayOffset: number) => void;
}

const RETURN_CUES: Record<CuriosityMapReturnState, string> = {
  new: "New discovery",
  explored: "Explored",
  "voluntary-return": "You came back",
  "prompted-return": "Returned after a reminder",
};

const TIME_LAPSE_STEPS = [
  { dayOffset: 0, label: "Right now" },
  { dayOffset: 7, label: "A week later…" },
  { dayOffset: 30, label: "A month later…" },
] as const;

const nextTimeLapseStep = (dayOffset: number) => {
  const currentIndex = TIME_LAPSE_STEPS.findIndex((step) => step.dayOffset === dayOffset);
  return TIME_LAPSE_STEPS[(currentIndex + 1 + TIME_LAPSE_STEPS.length) % TIME_LAPSE_STEPS.length]!;
};

export function CuriosityMap({
  view,
  activeZoneId,
  dayOffset,
  onEnterZone,
  onSetDayOffset,
}: CuriosityMapProps) {
  const [focusedIndex, setFocusedIndex] = useState(0);
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const rovingIndex = Math.min(focusedIndex, Math.max(view.buildings.length - 1, 0));
  const nextPhase = nextTimeLapseStep(dayOffset);

  const moveFocus = (index: number, direction: -1 | 1) => {
    if (view.buildings.length === 0) {
      return;
    }

    const nextIndex = (index + direction + view.buildings.length) % view.buildings.length;
    setFocusedIndex(nextIndex);
    buttonRefs.current[nextIndex]?.focus();
  };

  const onBuildingKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (
      event.key !== "ArrowLeft" &&
      event.key !== "ArrowRight" &&
      event.key !== "ArrowUp" &&
      event.key !== "ArrowDown"
    ) {
      return;
    }

    event.preventDefault();
    moveFocus(index, event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 1);
  };

  return (
    <section aria-label="Curiosity Map" data-primary-surface="curiosity-map">
      <h2>Curiosity Map</h2>
      <div
        data-curiosity-map-grid="true"
        style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}
      >
        {view.buildings.map((building, index) => (
          <button
            key={building.zoneId}
            ref={(button) => {
              buttonRefs.current[index] = button;
            }}
            type="button"
            aria-label={building.ariaLabel}
            aria-pressed={activeZoneId === building.zoneId}
            data-return-state={building.returnState}
            tabIndex={index === rovingIndex ? 0 : -1}
            style={{
              borderColor: building.hue,
              gridColumn: building.cell.col + 1,
              gridRow: building.cell.row + 1,
            }}
            onClick={() => onEnterZone(building.zoneId)}
            onFocus={() => setFocusedIndex(index)}
            onKeyDown={(event) => onBuildingKeyDown(event, index)}
          >
            <span aria-hidden="true">{building.glyph}</span>
            <strong>{building.label}</strong>
            <span>{building.enterVerb}</span>
            <span>{RETURN_CUES[building.returnState]}</span>
            <span>{building.unfinished} unfinished</span>
          </button>
        ))}
      </div>
      <button
        type="button"
        aria-label={nextPhase.label}
        onClick={() => onSetDayOffset(nextPhase.dayOffset)}
      >
        {nextPhase.label}
      </button>
    </section>
  );
}

import type { ZoneId } from "./curiosity-map";

export interface ZoneHostState {
  activeZoneId: ZoneId | null;
  dayOffset: number;
  entered: ZoneId[];
}

export type ZoneHostAction =
  | { type: "enter"; zoneId: ZoneId }
  | { type: "exit" }
  | { type: "set-day"; dayOffset: number };

export const INITIAL_ZONE_HOST_STATE: ZoneHostState = {
  activeZoneId: null,
  dayOffset: 0,
  entered: [],
};

export function zoneHostReducer(state: ZoneHostState, action: ZoneHostAction): ZoneHostState {
  switch (action.type) {
    case "enter":
      return {
        ...state,
        activeZoneId: action.zoneId,
        entered:
          state.entered.at(-1) === action.zoneId
            ? [...state.entered]
            : [...state.entered, action.zoneId],
      };
    case "exit":
      return { ...state, activeZoneId: null };
    case "set-day":
      return { ...state, dayOffset: action.dayOffset };
  }
}

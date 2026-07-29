import { create } from "zustand";
import { persist } from "zustand/middleware";

interface GadgetInterest {
  activeMs: number;
  opens: number;
  solves: number;
}

interface InterestState {
  byGadget: Record<string, GadgetInterest>;
  addActiveMs: (id: string, ms: number) => void;
  recordOpen: (id: string) => void;
  recordSolve: (id: string) => void;
  reset: () => void;
}

const empty = (): GadgetInterest => ({ activeMs: 0, opens: 0, solves: 0 });

export const useInterest = create<InterestState>()(
  persist(
    (set) => ({
      byGadget: {},
      addActiveMs: (id, ms) =>
        set((st) => {
          const g = st.byGadget[id] ?? empty();
          return {
            byGadget: {
              ...st.byGadget,
              [id]: { ...g, activeMs: g.activeMs + ms },
            },
          };
        }),
      recordOpen: (id) =>
        set((st) => {
          const g = st.byGadget[id] ?? empty();
          return {
            byGadget: {
              ...st.byGadget,
              [id]: { ...g, opens: g.opens + 1 },
            },
          };
        }),
      recordSolve: (id) =>
        set((st) => {
          const g = st.byGadget[id] ?? empty();
          return {
            byGadget: {
              ...st.byGadget,
              [id]: { ...g, solves: g.solves + 1 },
            },
          };
        }),
      reset: () => set({ byGadget: {} }),
    }),
    { name: "mvp-jul24:interest" },
  ),
);

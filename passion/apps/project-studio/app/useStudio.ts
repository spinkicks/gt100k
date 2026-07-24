"use client";

// Single-child studio controller (the kid's OWN studio, no child switcher). Owns the child's
// projects, the open project, the "log a quest entry" actions, localStorage persistence, and the
// window.__qa install. SSR renders the deterministic seed; the client hydrates localStorage after.
import { useEffect, useMemo, useRef, useState } from "react";
import { logEvent, startProject, type Project, type WorkEventKind } from "@gt100k/project-workspace";
import { DEMO_AGE_BAND, DEMO_KID, seedProjects } from "./seed.js";
import { buildQaState } from "./studio-state.js";
import { installQa } from "./qa.js";

const STORE_KEY = "gt100k.project-studio.v1";
const isoNow = (): string => new Date().toISOString();

export interface NewEntry {
  readonly stuck?: boolean;
  readonly refs?: readonly string[];
  readonly artifact?: { readonly title: string; readonly kind: string };
  readonly aiTool?: { readonly name: string; readonly version: string };
}

export function useStudio() {
  const seed = useMemo(() => seedProjects(), []);
  const [projects, setProjects] = useState<readonly Project[]>(seed);
  const [openId, setOpenId] = useState<string>(seed[0]!.id);
  const [hydrated, setHydrated] = useState(false);

  // Client hydration: prefer a saved store, else keep the seed. (SSR always renders the seed.)
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Project[];
        if (Array.isArray(saved) && saved.length > 0) {
          setProjects(saved);
          setOpenId((cur) => (saved.some((p) => p.id === cur) ? cur : saved[0]!.id));
        }
      }
    } catch {
      /* ignore a corrupt store; fall back to the seed */
    }
    setHydrated(true);
  }, []);

  // Persist after hydration so we never overwrite a saved store with the seed on first paint.
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORE_KEY, JSON.stringify(projects));
    } catch {
      /* storage full or unavailable; the session still works in memory */
    }
  }, [projects, hydrated]);

  const openProject = useMemo(() => projects.find((p) => p.id === openId), [projects, openId]);

  function addEntry(kind: WorkEventKind, text: string, extra: NewEntry = {}): void {
    const trimmed = text.trim();
    if (trimmed.length === 0) return;
    setProjects((prev) =>
      prev.map((p) =>
        p.id === openId
          ? logEvent(p, { kind, at: isoNow(), text: trimmed, ...extra }, isoNow())
          : p,
      ),
    );
  }

  function startSelfProject(input: {
    title: string;
    drivingQuestion: string;
    authenticMethod: string;
  }): void {
    const t = input.title.trim();
    if (t.length === 0) return;
    const proj = startProject(
      {
        selfAuthored: {
          kidId: DEMO_KID,
          ageBand: DEMO_AGE_BAND,
          title: t,
          drivingQuestion: input.drivingQuestion.trim() || "What do I want to make?",
          authenticMethod: input.authenticMethod.trim() || "Try things, see what happens, keep going.",
          audience: "SELF",
        },
      },
      isoNow(),
    );
    setProjects((prev) => [...prev, proj]);
    setOpenId(proj.id);
  }

  // window.__qa, backed by a ref so state()/primaryAction() always read the current open project.
  const ref = useRef<{ open: Project | undefined; openId: string }>({ open: openProject, openId });
  ref.current = { open: openProject, openId };
  useEffect(() => {
    installQa(
      () => buildQaState(ref.current.open),
      () => {
        const id = ref.current.openId;
        setProjects((prev) =>
          prev.map((p) =>
            p.id === id
              ? logEvent(p, { kind: "attempt", at: isoNow(), text: "Tried a quick idea." }, isoNow())
              : p,
          ),
        );
      },
    );
  }, []);

  return { projects, openId, setOpenId, openProject, addEntry, startSelfProject };
}

export type StudioController = ReturnType<typeof useStudio>;

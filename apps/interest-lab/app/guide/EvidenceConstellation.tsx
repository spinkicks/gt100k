"use client";

import type { InterestLabView } from "@gt100k/interest-lab-view";
import dynamic from "next/dynamic";

const ClientEvidenceConstellationCanvas = dynamic(
  () =>
    import("./EvidenceConstellationCanvas").then((module) => module.EvidenceConstellationCanvas),
  { ssr: false },
);

export function shouldRenderEvidenceConstellation(view: InterestLabView): boolean {
  return (
    !view.flags.reducedMotion &&
    !view.flags.plainMode &&
    view.flags.deviceCaps.webglAvailable &&
    view.presentation.renderTier !== "board-2d"
  );
}

export interface EvidenceConstellationProps {
  view: InterestLabView;
}

export function EvidenceConstellation({ view }: EvidenceConstellationProps) {
  if (!shouldRenderEvidenceConstellation(view)) return null;

  return (
    <figure
      className="evidence-constellation"
      data-evidence-constellation="depth"
      aria-hidden="true"
    >
      <figcaption>
        <span>Evidence constellation</span>
        <span>Decorative depth view · DOM evidence remains authoritative</span>
      </figcaption>
      <ClientEvidenceConstellationCanvas
        quality={view.presentation.quality}
        view={view.guide.constellation}
      />
    </figure>
  );
}

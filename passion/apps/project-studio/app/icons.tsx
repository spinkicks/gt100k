import type { JSX } from "react";
import type { WorkEventKind } from "@gt100k/project-workspace";

// A small, consistent line-icon set for the ten quest-entry kinds, plus a spark. currentColor +
// uniform stroke so icons re-skin with every theme and read cleanly at small sizes (no emoji-as-icon).
const PATHS: Record<WorkEventKind, JSX.Element> = {
  attempt: <path d="M13 3 6 13h4l-1 8 9-12h-5l1-6z" />,
  outcome: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3.2" />
    </>
  ),
  revision: (
    <>
      <path d="M20 12a8 8 0 1 1-2.4-5.7" />
      <path d="M20 4.5V9h-4.5" />
    </>
  ),
  artifact: <path d="M12 3l2.5 5.7 6.2.5-4.7 4.1 1.4 6L12 20.3 6.6 23.4l1.4-6-4.7-4.1 6.2-.5z" />,
  decision: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M15.6 8.4l-2.1 5.1-5.1 2.1 2.1-5.1z" />
    </>
  ),
  reflection: (
    <>
      <path d="M12 3a6 6 0 0 0-3.8 10.6c.6.6 1 1.3 1 2.4h5.6c0-1.1.4-1.8 1-2.4A6 6 0 0 0 12 3z" />
      <path d="M9.5 19h5" />
      <path d="M10.5 21.5h3" />
    </>
  ),
  ai_help: (
    <>
      <rect x="4.5" y="8" width="15" height="11" rx="3.2" />
      <path d="M12 4.2V8" />
      <circle cx="12" cy="3.2" r="1.3" />
      <circle cx="9.4" cy="13" r="1.2" />
      <circle cx="14.6" cy="13" r="1.2" />
    </>
  ),
  session: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7v5.2l3.6 2.1" />
    </>
  ),
  milestone: (
    <>
      <path d="M6 21V4" />
      <path d="M6 4.5h11l-2.4 3.8L17 12H6" />
    </>
  ),
  showcase: (
    <>
      <path d="M3 11v2a1 1 0 0 0 1 1h2.2l4.8 4V6L6.2 10H4a1 1 0 0 0-1 1z" />
      <path d="M15 9a4 4 0 0 1 0 6" />
    </>
  ),
};

export function KindIcon({
  kind,
  size = 20,
}: {
  kind: WorkEventKind;
  size?: number;
}): JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[kind]}
    </svg>
  );
}

export function SparkIcon({ size = 18 }: { size?: number }): JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />
    </svg>
  );
}

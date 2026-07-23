// Candidate logo marks for "PassionLab Guide Console". Each is a restrained, geometric mark drawn in
// currentColor (no gradients, no generic AI sparkle). `BrandMark` is the one the sidebar currently
// uses; swap it to the chosen option. The /logos route renders them all for comparison.
import type { JSX } from "react";

interface MarkProps {
  size?: number;
}

const svgProps = (size: number) =>
  ({
    viewBox: "0 0 24 24",
    width: size,
    height: size,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  }) as const;

// A compass with a directional needle — "guide".
export function MarkCompass({ size = 20 }: MarkProps): JSX.Element {
  return (
    <svg {...svgProps(size)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 6.5 14 12 12 17.5 10 12Z" fill="currentColor" stroke="none" />
    </svg>
  );
}

// A sprouting seedling — "a passion being grown".
export function MarkSprout({ size = 20 }: MarkProps): JSX.Element {
  return (
    <svg {...svgProps(size)}>
      <path d="M12 21v-8.5" />
      <path d="M12 12.5c0-3.3 2.2-5.5 5.5-5.5 0 3.3-2.2 5.5-5.5 5.5Z" />
      <path d="M12 15c0-2.6-1.9-4.5-4.5-4.5 0 2.6 1.9 4.5 4.5 4.5Z" />
    </svg>
  );
}

// A geometric "P" monogram.
export function MarkMonogram({ size = 20 }: MarkProps): JSX.Element {
  return (
    <svg {...svgProps(size)} strokeWidth={2}>
      <path d="M8.5 20V4.5h4.6a4 4 0 0 1 0 8H8.5" />
    </svg>
  );
}

// A small constellation of connected nodes — "mapping a child's interests".
export function MarkNodes({ size = 20 }: MarkProps): JSX.Element {
  return (
    <svg {...svgProps(size)} strokeWidth={1.5}>
      <path d="M7 8 16.5 6.5M7 8 10 15.5M16.5 6.5 15 16M10 15.5 15 16" />
      <circle cx="7" cy="8" r="2.1" fill="currentColor" stroke="none" />
      <circle cx="16.5" cy="6.5" r="2.1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="16" r="2.1" fill="currentColor" stroke="none" />
      <circle cx="10" cy="15.5" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

// A lab flask — "PassionLab".
export function MarkFlask({ size = 20 }: MarkProps): JSX.Element {
  return (
    <svg {...svgProps(size)}>
      <path d="M9 3.5h6" />
      <path d="M10 3.5v6L5.6 17A2 2 0 0 0 7.4 20h9.2a2 2 0 0 0 1.8-3L14 9.5v-6" />
      <path d="M8.7 14.2h6.6" />
    </svg>
  );
}

// Ascending bars — "progress / levelling up".
export function MarkSteps({ size = 20 }: MarkProps): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true">
      <rect x="4" y="14" width="4" height="6" rx="1.2" />
      <rect x="10" y="9.5" width="4" height="10.5" rx="1.2" />
      <rect x="16" y="5" width="4" height="15" rx="1.2" />
    </svg>
  );
}

export interface LogoOption {
  readonly id: string;
  readonly name: string;
  readonly Mark: (props: MarkProps) => JSX.Element;
}

export const LOGOS: readonly LogoOption[] = [
  { id: "compass", name: "Compass / Waypoint", Mark: MarkCompass },
  { id: "sprout", name: "Sprout", Mark: MarkSprout },
  { id: "monogram", name: "Monogram P", Mark: MarkMonogram },
  { id: "nodes", name: "Interest map", Mark: MarkNodes },
  { id: "flask", name: "Lab flask", Mark: MarkFlask },
  { id: "steps", name: "Ascending steps", Mark: MarkSteps },
];

// The mark the sidebar currently uses.
export const BrandMark = MarkMonogram;

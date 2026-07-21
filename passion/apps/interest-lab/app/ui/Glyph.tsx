import type { WORK_MODE_GLYPHS } from "@gt100k/interest-lab-view";
import type { ReactNode, SVGProps } from "react";

export const STATE_GLYPHS = {
  new: "state-new",
  explored: "state-explored",
  voluntaryReturn: "state-voluntary-return",
  promptedReturn: "state-prompted-return",
  met: "state-met",
  gap: "state-gap",
  support: "state-support",
  contested: "state-contested",
  parked: "state-parked",
  help: "state-help",
} as const;

type WorkModeGlyph = (typeof WORK_MODE_GLYPHS)[keyof typeof WORK_MODE_GLYPHS];
export type StateGlyph = (typeof STATE_GLYPHS)[keyof typeof STATE_GLYPHS];
export type GlyphName = WorkModeGlyph | StateGlyph;

const GLYPH_DRAWINGS = {
  "glyph-hammer": (
    <>
      <path d="m14 5 5 5" />
      <path d="m12 7 4-4 5 5-4 4" />
      <path d="M14 10 5 19l-2-2 9-9" />
    </>
  ),
  "glyph-lens": (
    <>
      <circle cx="10" cy="10" r="6" />
      <path d="m14.5 14.5 5 5" />
    </>
  ),
  "glyph-quill": (
    <>
      <path d="M4 20c3-7 7-13 16-16-1 8-6 13-13 14" />
      <path d="m7 17 8-8" />
      <path d="M4 20h7" />
    </>
  ),
  "glyph-speech": (
    <>
      <path d="M4 5h16v11H9l-5 4Z" />
      <path d="M8 9h8M8 12h5" />
    </>
  ),
  "glyph-star-stage": (
    <>
      <path d="m12 3 2.2 4.5 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5L4.8 8.2l5-.7Z" />
      <path d="M4 21h16" />
    </>
  ),
  "glyph-wrench-bug": (
    <>
      <path d="M14 6a4 4 0 0 0-5-3l2.5 2.5-3 3L6 6a4 4 0 0 0 5 5l7 7-2 2-7-7" />
      <circle cx="17.5" cy="17.5" r="1" />
    </>
  ),
  "glyph-hands": (
    <>
      <path d="M3 12c3-3 5-3 8 0l1 1" />
      <path d="M21 12c-3-3-5-3-8 0l-3 3" />
      <path d="m6 15 3 3c2 2 4 2 6 0l3-3" />
    </>
  ),
  "glyph-heart": (
    <path d="M12 20S4 15 4 9a4 4 0 0 1 7-2.6L12 8l1-1.6A4 4 0 0 1 20 9c0 6-8 11-8 11Z" />
  ),
  "glyph-flag": (
    <>
      <path d="M5 21V4" />
      <path d="M6 5h12l-3 4 3 4H6" />
    </>
  ),
  "state-new": (
    <>
      <path d="M12 3v18M3 12h18" />
      <path d="m6 6 12 12M18 6 6 18" />
    </>
  ),
  "state-explored": (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 3 3 5-6" />
    </>
  ),
  "state-voluntary-return": (
    <>
      <path d="M4 12a8 8 0 1 0 2-5.3" />
      <path d="M4 5v5h5" />
      <path d="m17 4 .7 1.3L19 6l-1.3.7L17 8l-.7-1.3L15 6l1.3-.7Z" />
    </>
  ),
  "state-prompted-return": (
    <>
      <path d="M6 17h12l-2-3V9a4 4 0 0 0-8 0v5Z" />
      <path d="M10 20h4" />
    </>
  ),
  "state-met": (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m7.5 12 3 3 6-7" />
    </>
  ),
  "state-gap": <circle cx="12" cy="12" r="8" strokeDasharray="3 3" />,
  "state-support": (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8M8 12h8" />
    </>
  ),
  "state-contested": (
    <>
      <path d="M4 8h13l-3-3M20 16H7l3 3" />
    </>
  ),
  "state-parked": (
    <>
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <path d="M10 8v8M14 8v8" />
    </>
  ),
  "state-help": (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.7 9a2.4 2.4 0 1 1 3.7 2c-1 .7-1.4 1.2-1.4 2.5" />
      <path d="M12 17h.01" />
    </>
  ),
} as const satisfies Record<GlyphName, ReactNode>;

export interface GlyphProps extends Omit<SVGProps<SVGSVGElement>, "children"> {
  name: GlyphName;
  title?: string;
  size?: number;
}

export function Glyph({ name, title, size = 24, ...svgProps }: GlyphProps) {
  return (
    <svg
      {...svgProps}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {GLYPH_DRAWINGS[name]}
    </svg>
  );
}

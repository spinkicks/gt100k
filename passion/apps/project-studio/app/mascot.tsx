import type { JSX } from "react";

// Sprocket, the studio's friendly maker-bot guide. Self-contained SVG (no asset fetch). Colors are
// driven by theme CSS variables so the mascot re-skins with every theme. Decorative, so aria-hidden.
export function Mascot({ size = 56 }: { size?: number }): JSX.Element {
  return (
    <svg
      className="mascot__svg"
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      <line
        x1="32"
        y1="6"
        x2="32"
        y2="14"
        stroke="var(--ink)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="32" cy="5" r="3.5" fill="var(--accent-2)" stroke="var(--ink)" strokeWidth="3" />
      <rect
        x="10"
        y="14"
        width="44"
        height="40"
        rx="14"
        fill="var(--accent)"
        stroke="var(--ink)"
        strokeWidth="3.5"
      />
      <circle cx="24" cy="32" r="6.5" fill="var(--paper)" stroke="var(--ink)" strokeWidth="3" />
      <circle cx="40" cy="32" r="6.5" fill="var(--paper)" stroke="var(--ink)" strokeWidth="3" />
      <circle cx="25" cy="33" r="2.4" fill="var(--ink)" />
      <circle cx="41" cy="33" r="2.4" fill="var(--ink)" />
      <path
        d="M23 43c3 3.5 15 3.5 18 0"
        stroke="var(--ink)"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

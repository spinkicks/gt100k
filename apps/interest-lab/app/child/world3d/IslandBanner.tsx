"use client";

export interface IslandBannerProps {
  label: string;
}

/**
 * DOM overlay naming the island the child is currently visiting. Lives in the DOM (not the
 * canvas) so it is announced to assistive tech and legible on the board-2d tier too. `role`/
 * `aria-live` keep the visit narrated as focus moves between islands.
 */
export function IslandBanner({ label }: IslandBannerProps) {
  return (
    <output className="quest-world-banner" aria-live="polite" data-island-banner={label}>
      <span className="quest-world-banner__eyebrow">Visiting</span>
      <span className="quest-world-banner__name">{label}</span>
    </output>
  );
}

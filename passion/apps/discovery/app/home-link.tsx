// The child's way back to the front door.
//
// The wall had none at all. A child who arrived from the front door could open a tile, play a game,
// and then had no route back except the browser's own back button, which on a full-screen tablet
// kiosk is not obviously there. Every adult surface carries the shared ProductHeader; this app
// carried nothing.
//
// Deliberately NOT that shared header, for the same two reasons the Project Studio gives: its
// switcher lists the Guide Console and the Parent Playbook, and a child's screen should not be one
// click from the guide's cockpit; and this app styles itself from a local palette rather than the
// shared token contract, so the shared bar would render unstyled here. The address comes from the
// registry either way, so there is still one source of truth for where the front door lives.
import { resolveHomeUrl } from "@gt100k/ui";
import type { JSX } from "react";

export function HomeLink(): JSX.Element | null {
  const href = resolveHomeUrl();
  // Same rule as every surface: no address configured means no link rather than a dead one.
  if (href === null) return null;

  return (
    <a className="homelink" href={href} aria-label="Back to PassionLab">
      <span className="homelink__mark" aria-hidden="true">
        P
      </span>
      <span className="homelink__text">PassionLab</span>
    </a>
  );
}

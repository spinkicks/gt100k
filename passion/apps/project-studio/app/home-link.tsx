// The child's way back to the front door.
//
// Deliberately NOT the shared ProductHeader that every adult surface carries. Two reasons. The
// switcher in that header lists the Guide Console and the Parent Playbook, and a child's screen
// should not be one click from the guide's cockpit. And this app owns eight themes built on its own
// token names, never importing the shared contract, so the shared header would render as an
// unstyled bar here. The address still comes from the registry, so there is one source of truth for
// where the front door lives; only the styling is local.
import { resolveHomeUrl } from "@gt100k/ui";
import type { JSX } from "react";

export function HomeLink(): JSX.Element | null {
  const href = resolveHomeUrl();
  // Same rule as every surface: no address configured means no link, never a dead one.
  if (href === null) return null;

  return (
    <a className="homelink" href={href}>
      <span className="homelink__mark" aria-hidden="true">
        P
      </span>
      <span className="homelink__text">PassionLab</span>
    </a>
  );
}

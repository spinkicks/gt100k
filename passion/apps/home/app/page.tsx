import { ProductHeader, findSurface, resolveSurfaces } from "@gt100k/ui";
import type { JSX } from "react";

import { RoleChoices, type RoleChoice } from "./roles.js";

// The front door is a router, not a landing page: no hero, no explanation, no scroll. Each role is
// an anchor onto the surface that role works in, and the registry decides where those are.
//
// A CHILD APPEARS TWICE, because there are two of them and they are at different points. "Child"
// used to route to the Project Studio, which is where a child works on something they have ALREADY
// chosen — so the step before that, the one where a child who has chosen nothing goes looking, had
// no door on the front of the product at all. The wall is the entry; the studio is downstream, and
// a child who is mid-project should not have to pass back through the choosing screen to reach it.
const ROLES: readonly { readonly role: string; readonly surfaceId: string }[] = [
  { role: "Guide", surfaceId: "guide" },
  { role: "Parent", surfaceId: "parent" },
  { role: "Child", surfaceId: "discovery" },
  { role: "Child, mid-project", surfaceId: "studio" },
];

export default function Page(): JSX.Element {
  const surfaces = resolveSurfaces();
  const choices: readonly RoleChoice[] = ROLES.flatMap(({ role, surfaceId }) => {
    const surface = findSurface(surfaces, surfaceId);
    return surface === undefined
      ? []
      : [{ role, label: surface.label, blurb: surface.blurb, url: surface.url }];
  });

  return (
    <>
      <ProductHeader current="home" currentLabel="Home" surfaces={surfaces} showSwitcher={false} />
      <main className="fd">
        <p className="fd__lede">Pick where you are going.</p>
        <RoleChoices choices={choices} />
        <p className="fd__foot">
          Every child, number and name in these surfaces is synthetic. No real family&apos;s data is
          in this system.
        </p>
      </main>
    </>
  );
}

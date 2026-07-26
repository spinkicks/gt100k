"use client";

import { useEffect, useState, type JSX } from "react";

export interface RoleChoice {
  readonly role: string;
  readonly label: string;
  readonly blurb: string;
  /** null = that surface is not reachable from this deployment, so there is nothing to click. */
  readonly url: string | null;
}

const STORAGE_KEY = "passionlab.front-door.role";

/**
 * Remembering the last role is a progressive enhancement, layered on top of markup that is already
 * correct: the server renders the canonical order, and only after mount does the last choice move
 * to the front and take the primary treatment. It never redirects — wanting a different surface
 * than last time is normal, and being thrown somewhere you did not click is hostile.
 */
export function RoleChoices({ choices }: { readonly choices: readonly RoleChoice[] }): JSX.Element {
  const [remembered, setRemembered] = useState<string | null>(null);

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      // Storage can be denied (private browsing, blocked site data). Then we simply do not remember.
    }
    if (stored !== null && choices.some((c) => c.role === stored)) setRemembered(stored);
  }, [choices]);

  function remember(role: string): void {
    try {
      window.localStorage.setItem(STORAGE_KEY, role);
    } catch {
      // Same as above: the navigation still happens, we just forget it.
    }
  }

  const ordered =
    remembered === null
      ? choices
      : [
          ...choices.filter((c) => c.role === remembered),
          ...choices.filter((c) => c.role !== remembered),
        ];

  return (
    <ul className="roles">
      {ordered.map((c) => (
        <li key={c.role}>
          {c.url === null ? (
            <div className="role role--off">
              <Body choice={c} />
              <span className="role__off">Not reachable from here</span>
            </div>
          ) : (
            <a
              className={`role${c.role === remembered ? " role--primary" : ""}`}
              href={c.url}
              onClick={() => remember(c.role)}
            >
              <Body choice={c} />
              {c.role === remembered ? (
                <span className="role__last">Where you were last</span>
              ) : null}
            </a>
          )}
        </li>
      ))}
    </ul>
  );
}

function Body({ choice }: { readonly choice: RoleChoice }): JSX.Element {
  return (
    <>
      <span className="role__role">{choice.role}</span>
      <span className="role__label">{choice.label}</span>
      <span className="role__blurb">{choice.blurb}</span>
    </>
  );
}

# @gt100k/ui

The shared product shell. Two things, deliberately:

- **`resolveSurfaces()`** — the surfaces registry. What surfaces exist (`guide`, `parent`,
  `studio`, `evidence`, `concierge`), who each is for, and where each one lives _in this
  environment_.
- **`<ProductHeader />`** — the identity bar every adult surface puts above its own chrome.

## URL resolution

Each surface reads `NEXT_PUBLIC_SURFACE_URL_<ID>`. When that is unset:

| environment                          | fallback                 |
| ------------------------------------ | ------------------------ |
| `NODE_ENV=development`               | `http://localhost:<port>` |
| anything else, production included   | `null` — no link at all  |

The Parent Playbook is publicly deployed for actual parents, so an unconfigured production build
must offer nothing rather than a `localhost` link that dead-ends on their laptop. Deployments have
to say where surfaces are:

```
NEXT_PUBLIC_SURFACE_URL_GUIDE=https://guide.example.com
NEXT_PUBLIC_SURFACE_URL_PARENT=https://playbook.example.com
```

Every variable is named literally in `readSurfaceEnv`, never looked up as `process.env[key]`: Next inlines
`NEXT_PUBLIC_*` by textual substitution at build time, so a computed lookup reads as `undefined` in the
browser.

Ports in development: home 3000, guide 3020, parent 3055, studio 3010, evidence 3030, concierge 3040.

### The front door is addressable but is not a surface

`home` has a URL (`NEXT_PUBLIC_SURFACE_URL_HOME`, resolved by `resolveHomeUrl()` under the same asymmetric
fallback) and it is what the wordmark links to on every page. It is deliberately absent from
`resolveSurfaces()`, because listing it as a sixth destination would put it on screen twice. **A deployment
that sets the five surface URLs and forgets this one gets a wordmark that is plain text everywhere** —
no dead link, but no way home either.

## Use

```tsx
import { ProductHeader } from "@gt100k/ui";

<ProductHeader current="guide" />;
```

`ProductHeader` links only to surfaces that resolved to a URL and are not `current`, so an unreachable
surface is absent rather than dead. Three props exist for the front door's own use of the header:
`currentLabel` names a page the registry does not know about, `showSwitcher={false}` suppresses the nav on a
page whose whole body is already the switcher, and `homeUrl={null}` forces a plain wordmark. It renders plain
anchors, so it works with JavaScript off.

```css
@import "@gt100k/ui/styles.css";
```

The stylesheet publishes `--plh-h` (the header's height) so an app with viewport-pinned chrome can
subtract it. Add `"@gt100k/ui"` to the app's `transpilePackages`.

Tests: `pnpm test` from the repo root (the root vitest config globs `passion/packages/**/test`).

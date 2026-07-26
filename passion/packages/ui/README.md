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

Ports in development: guide 3020, parent 3055, studio 3010, evidence 3030, concierge 3040.

## Use

```tsx
import { ProductHeader } from "@gt100k/ui";

<ProductHeader current="guide" />;
```

```css
@import "@gt100k/ui/styles.css";
```

The stylesheet publishes `--plh-h` (the header's height) so an app with viewport-pinned chrome can
subtract it. Add `"@gt100k/ui"` to the app's `transpilePackages`.

Tests: `pnpm test` from the repo root (the root vitest config globs `passion/packages/**/test`).

# Arena world acceptance evidence

T051 maps each mandatory success criterion to feature-owned automated evidence.
`Automated pass` means the repository tests cover the full criterion.
`Automated + live pass` adds the required browser observation. `Partial` means
the deterministic and structural checks pass, but the criterion still requires
an assistive-technology or managed-device observation.

## Success criteria

| Criterion | Status | Evidence |
| --- | --- | --- |
| SC-001 | Automated pass | `test/nodes.test.ts` proves gate plus prerequisite unlocking, stable replay, and the absence of time or visit inputs. |
| SC-002 | Automated pass | `test/cosmetics.test.ts` proves deterministic eligibility; `test/guardrails.test.ts` excludes randomness and commerce fields. |
| SC-003 | Automated pass | `test/zero-power.test.ts` and `test/base.test.ts` prove cosmetics, tiers, and Base Camp state cannot change mastery, access, or standing. |
| SC-004 | Automated pass | `test/motion.test.ts`, `test/view.test.ts`, and `test/app-quality-renderer.test.ts` prove reduced-motion equivalents, state parity, and the Tier-C static-depth plan. |
| SC-005 | Automated pass | `test/staging.test.ts` proves exact age-band vocabulary, hidden 6-8 raw values, and disabled comparison. |
| SC-006 | Automated pass | `test/plain-mode.test.ts` proves plain mode, standings-off, and lower quality leave domain state unchanged. |
| SC-007 | Automated pass | `test/celebrate.test.ts` proves incorrect attempts and help requests remove nothing and produce no loss event. |
| SC-008 | Automated pass | `test/synthetic.test.ts` runs every public domain function from committed synthetic fixtures without governance, identity, network, time, or external-data inputs. |
| SC-009 | Automated pass | `test/standings.test.ts` proves opt-in anonymized gain-based output and makes rank-like fields structurally absent. |
| SC-010 | Partial | `test/quality.test.ts`, `test/app-frame-monitor.test.ts`, `test/app-onboarding.test.ts`, and `test/app-accessibility.test.ts` prove deterministic degradation and non-blocking input paths. A 60fps observation on the minimum managed device remains live-only. |
| SC-011 | Automated + live pass | `test/app-client.test.ts` proves the client-only dynamic boundary; `test/app-scene.test.ts` proves context handler cleanup and Tier-D loss handling. The 2026-07-21 Chromium smoke mounted WebGL2 client-only with a hidden canvas, produced zero console/page/request errors, and unmounted cleanly; the forced Tier-D smoke mounted no canvas. |
| SC-012 | Partial | `test/view.test.ts`, `test/app-ledger.test.ts`, and `test/app-accessibility.test.ts` prove complete shared state, semantic controls, hidden canvas, focus hooks, and contrast tokens. The live keyboard walkthrough passed; a pass with a real screen reader and switch device remains live-only. |
| SC-013 | Automated pass | `test/layout.test.ts` proves exact golden positions and deterministic replay. |
| SC-014 | Automated pass | `test/view.test.ts` proves one composed `ArenaView` and byte-identical domain state across presentation variants. |
| SC-015 | Automated pass | `test/motion-tokens.test.ts` proves exact tokens and reduced equivalents; `test/app-hud.test.ts` proves DOM interaction motion uses `motion/react`. |
| SC-016 | Automated pass | `test/avatar.test.ts` proves deterministic interruptible animation states, reduced forms, and the absence of `scale(0)`. |
| SC-017 | Automated pass | `test/art.test.ts` proves exact palette, typography, biome, and elevation values; `test/app-world.test.ts` proves node state includes non-color cues. |
| SC-018 | Automated pass | `test/scene3d.test.ts` proves exact camera, parallax, lighting, water, and post-fx config; `test/app-atmosphere.test.ts` proves the renderer consumes it. |
| SC-019 | Automated pass | `test/base-layout.test.ts` proves stable zones, slots, attribution, and fallback; `test/app-base-camp.test.ts` proves the shared view drives placement. |
| SC-020 | Automated pass | `test/visual-band.test.ts`, `test/view.test.ts`, and `test/app-p5-controls.test.ts` prove exact 6-8 canvas staging and state parity between age bands. |
| SC-021 | Automated pass | `test/sound.test.ts` proves deterministic muted neutral non-looping cues; `test/app-hud.test.ts` proves captioned muted-by-default presentation. |
| SC-022 | Automated pass | `test/cosmetics.test.ts` proves stable look and equip descriptors; `test/guardrails.test.ts` excludes commerce and rarity fields. |
| SC-023 | Automated pass | `test/assets.test.ts` proves stable model-to-procedural resolution without randomness; `test/app-seed-assets.test.ts` proves every registry key has committed or procedural no-fetch coverage. |
| SC-024 | Automated pass | `test/world-transform.test.ts` proves exact deterministic golden 3D positions; `test/app-world.test.ts` proves the scene consumes the shared transform. |
| SC-025 | Partial | `test/quality.test.ts`, `test/app-frame-monitor.test.ts`, and `test/app-quality-renderer.test.ts` prove capability mapping, A-to-D degradation, strict frame monitoring, budgets, and beacon caps. Live Chromium auto-degraded to calm Tier C under software-renderer load, and the forced Tier-D fallback rendered the shared view without a canvas. Recovery to budget on the minimum managed device remains live-only. |
| SC-026 | Automated pass | `test/lighting.test.ts` and `test/app-quality-renderer.test.ts` prove exact per-tier rigs, globally capped dynamic beacons, emissive overflow, and independent icon, text, and shape cues. |

## Live-only gaps

This environment cannot supply the minimum managed device profiles required for
the 60fps observations in SC-010 and SC-025. SC-012 still needs switch
verification with a real screen reader. These observations stay open; a
headless software-renderer sample, unit tests, source scans, type checks, lint,
and production builds do not substitute for them.

## 2026-07-21 live browser smoke

- A production Chromium run mounted one real WebGL2 canvas with
  `aria-hidden="true"`, retained the parallel Ledger, loaded every request, and
  completed mount, interaction, and unmount with zero console messages, page
  errors, or request failures.
- Ledger Arrow navigation and Enter activation worked while onboarding was
  visible, with a visible 3px focus ring. Ages 6-8 hid the raw reward and used
  56px controls; plain mode retained the calm Tier-C canvas; opted-in standings
  showed only gain 300 and 40 to the band top. The onboarding never intercepted
  an underlying action.
- Under the headless software renderer, the frame monitor degraded to calm Tier
  C without blocking input. The diagnostic sample was about 56.9fps, so it is
  not used as the minimum-managed-device result.
- With `NEXT_PUBLIC_QUALITY_TIER=D`, Tier D rendered four regions, seven paths,
  nine nodes, and three Base Camp features from the shared view with no canvas.
  Ledger focus propagated to the fallback, and the mount/unmount remained
  error-free.
- The smoke exposed one missing favicon request. `app/icon.svg` now supplies
  Next.js icon metadata, and its live request returns successfully.

## Validation commands

Run T051 from the repository root:

```bash
pnpm --filter @gt100k/arena-world test
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm --filter @gt100k/arena-world-app build
```

The filtered Arena suite includes the static app acceptance tests cited above.
The review pipeline must run the browser smoke and live-only checks when its
WebGL and assistive-technology environment is available.

## T051 automated run

The 2026-07-21 run produced these results:

- Filtered Arena suite: 56 files and 227 tests passed.
- Workspace suite: 60 files and 241 tests passed.
- Biome checked 139 files with no errors.
- TypeScript project references compiled with no errors.
- The root and Arena Next.js production builds compiled and generated their
  static routes.

The live browser results above supersede the earlier failed-launch limitation.
No minimum-managed-device, real screen-reader, or switch result is inferred from
the headless Chromium smoke.

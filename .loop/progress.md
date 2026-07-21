# Loop progress (durable memory the agent maintains each turn)

## 2026-07-20 — P0 / T001
- Scaffolded `@gt100k/interest-lab` with the pinned ESM package entry points and `vitest run` test script.
- Added the exact P0 smoke test and a package-local Vitest include so the specified filtered test command discovers package tests.
- Verified `pnpm --filter @gt100k/interest-lab test`, `pnpm typecheck`, and `pnpm test` (15 tests) all pass.
- Status: T001 complete; P0 remains in progress; feature success criteria are not yet started. No blocker.

## NEXT
- Complete T002: add `packages/interest-lab/tsconfig.json` extending `../../tsconfig.base.json` with `rootDir: "."`, `outDir: "dist"`, and `include: ["src/**/*.ts", "test/**/*.ts"]`.
- Acceptance: the package TypeScript project compiles without changing any shared root file, and `pnpm typecheck` plus `pnpm test` remain green.

## 2026-07-20 — P0 / T002
- Added `packages/interest-lab/tsconfig.json`, matching the reference domain package and the exact T002 compiler settings.
- Confirmed the test-first red state: `pnpm exec tsc -b packages/interest-lab` failed with TS5083 before the config existed, then passed after the change.
- Verified `pnpm --filter @gt100k/interest-lab test` (1 test), `pnpm typecheck`, and `pnpm test` (15 tests) all pass.
- Status: T002 complete; P0 remains in progress; feature success criteria are not yet started. No blocker.

## NEXT
- Complete T003: scaffold the four `adapters/interest-*` packages with package-local `package.json` and `tsconfig.json` files mirroring `adapters/repo-memory` and referencing `@gt100k/interest-lab`.
- Acceptance: all four adapter packages resolve their `workspace:*` domain dependency and compile through their package-local TypeScript references; `pnpm typecheck` and `pnpm test` remain green without shared-root edits.

# Loop decisions — what was chosen and why (do not re-litigate)

## 2026-07-20 — T003 model clarifications
- Chose `WorldTheme = "default" | "dawn" | "dusk"`: the spec names one default golden-hour rig plus dawn/dusk appearance variants. Rejected a free-form string or configuration object because `LightingConfig` already carries the resolved renderer values.
- Included `BiomeIdentity.elevation` and `MotionSpec.bloomPeak`: their data-model tables are abbreviated, while golden §§8.12/8.5 and the package contract explicitly require both fields. Rejected omitting them because later golden resolvers could not satisfy their contracts.
- Encoded `QualityBudget` renderer modes as literal unions (`soft-pcf-2048`/`pcf-1024`/`off`, shader/cheap/static/2D water, and full/bloom/off post-fx). Rejected generic strings and booleans because they cannot represent the exact four-tier budget distinctions.

## 2026-07-20 — T004 fixture clarifications
- Chose concise competency labels (`Counting`, `Addition`, `Place Value`, `Observation`, `Measurement`, `Phonemes`, `Blending`, `Letters`, `Sentences`) for the required but unspecified node `title` values. Rejected reusing landmark names because `landmark` is already the distinct primary POI label.
- Encoded each cosmetic's animated and reduced-motion behavior together in the single `equipEffect` string. Rejected adding a reduced-motion field because the settled `Cosmetic` contract has exactly one descriptive effect field and forbids expanding outcome-affecting state.

## 2026-07-20 — T004a fixture organization
- Chose an ordered `BIOMES` array because biome declaration order must match the quest world's canonical region order. Chose a feature-keyed `BASE_LAYOUT` object because §8.16 defines a feature-to-slot table and the later resolver needs direct known-feature lookup while preserving `unlockedFeatures` output order. Rejected a Base Camp slot array because it would add an unnecessary search and make the lookup contract less explicit.

## 2026-07-20 — T004b registry shapes
- Represented the two dual-runtime easing tokens as `enter`/`move` `{ three, css }` pairs while retaining the remaining exact named curves as strings. Rejected inventing unspecified CSS curves or dropping either pinned runtime value.
- Kept `WATER` as the exact renderer-independent baseline without a `mode`, because mode is selected later by `resolveWater(tier)`. Keyed `QUALITY_TIERS` by `A`/`B`/`C`/`D` in declaration order so later deterministic resolution is a direct lookup. Rejected baking tier behavior into the baseline scene registry or using an order-dependent search array.

## 2026-07-20 — T006 seeded-smoke resolver boundary
- Chose generic deterministic P0 stubs: copy the supplied world definition, lay nodes out by declaration order on a simple three-column grid, and map that layout into a complete 3D result. Rejected fixture-specific hard-coding because the public functions should accept any compatible world, and rejected pulling P1 validation, regional golden layout, and biome elevation forward because T006 explicitly permits trivial stubs and schedules those behaviors for T013/T014/T014a.

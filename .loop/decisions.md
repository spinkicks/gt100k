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

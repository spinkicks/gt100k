# Loop decisions — what was chosen and why (do not re-litigate)

## 2026-07-20 — T003 model clarifications
- Chose `WorldTheme = "default" | "dawn" | "dusk"`: the spec names one default golden-hour rig plus dawn/dusk appearance variants. Rejected a free-form string or configuration object because `LightingConfig` already carries the resolved renderer values.
- Included `BiomeIdentity.elevation` and `MotionSpec.bloomPeak`: their data-model tables are abbreviated, while golden §§8.12/8.5 and the package contract explicitly require both fields. Rejected omitting them because later golden resolvers could not satisfy their contracts.
- Encoded `QualityBudget` renderer modes as literal unions (`soft-pcf-2048`/`pcf-1024`/`off`, shader/cheap/static/2D water, and full/bloom/off post-fx). Rejected generic strings and booleans because they cannot represent the exact four-tier budget distinctions.

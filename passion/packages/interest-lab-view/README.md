# @gt100k/interest-lab-view

`@gt100k/interest-lab-view` converts `@gt100k/interest-lab` domain outputs into deterministic view models for the child Curiosity Quest World and the guide Hypothesis Console. The package is framework-agnostic and GPU-free. It contains no I/O, wall-clock reads, `Math.random`, React, Three.js, or React Three Fiber.

The package never re-computes a domain rule. Callers supply the Lab, coverage, engagement events, hypothesis history, and lifecycle gate result produced by `@gt100k/interest-lab`. Renderers consume the resulting `InterestLabView` in full 3D, 3D-lite, 2D, plain, or reduced-motion modes.

## Build the composed view

```ts
import { buildInterestLabView } from "@gt100k/interest-lab-view";

const view = buildInterestLabView({
  lab,
  coverage,
  hypothesis,
  events,
  gate,
  proposal,
  options: {
    surface: "child",
    ageBand: "9-11",
    reducedMotion: false,
    plainMode: false,
    deviceCaps: {
      webglAvailable: true,
      saveData: false,
      deviceMemoryGB: 8,
      hardwareConcurrency: 8,
      coarsePointer: false,
    },
    history: [],
  },
});
```

`BuildInterestLabViewInputs` accepts these domain inputs:

| Input | Source and purpose |
| --- | --- |
| `lab` | A `Lab` from `buildLab`; supplies offers, provenance, reasons, and coverage constraints. |
| `coverage` | The Part-I `CoverageMatrix`; preserves named gaps without collapsing them into one number. |
| `hypothesis` | An `InterestHypothesis` with an operative revision; supplies explanations, lifecycle state, uncertainty, and append-only history. |
| `events` | `EngagementEvent` records for the voluntary, prompted, artifact, and support timeline. |
| `gate` | The `evaluateCandidateGate` result plus `familiesPresent`; the lifecycle builder adds the domain's legal transitions. |
| `proposal` | An optional non-operative `HypothesisRevision` suggestion. |
| `options` | Presentation inputs described below. |

`BuildInterestLabViewOptions` contains `surface`, `ageBand`, `reducedMotion`, `plainMode`, `deviceCaps`, and optional quest-return `history`. The child overload returns `ChildInterestLabView`; the general overload returns `InterestLabView`. The builder requires an operative hypothesis revision and throws when none exists.

Use `plainViewEquals` to compare domain-derived state across surfaces, age bands, render tiers, plain mode, and reduced motion. It permits presentation differences while checking quests, scene markers, coverage, explanations, timeline markers, lifecycle state, revision history, and constellation stars.

## Public API

### Composed and domain-derived builders

- `buildCuriosityMapView` builds the primary DOM-map model from registered zone manifests and activity.
- `buildTimeLapse` builds the deterministic first-session, week-later, and month-later phases.
- `INITIAL_ZONE_HOST_STATE` and `zoneHostReducer` describe navigation without owning a renderer.
- `buildZoneActivityModel` creates the canonical, sorted action list shared by a zone's DOM and 3D surfaces.
- `plainZoneEquals` verifies complete zone-action parity independently of incoming action order.
- `buildQaSnapshot` exposes the pure `Qa` state read by the app's `window.__qa` adapter.
- `buildInterestLabView` builds the shared child and guide view.
- `plainViewEquals` checks one-view parity across presentation modes.
- `buildProbePickerView` maps Lab offers and return history to child quest cards.
- `buildCoverageMatrixView` projects domain coverage and named gaps into guide rows, cells, and rails.
- `buildExplanationsView` keeps supporting and disconfirming explanations side by side.
- `buildReturnTimelineView` separates voluntary, prompted, artifact, and support events.
- `buildLifecycleStateView` projects lifecycle state, legal transitions, gate checks, and non-operative proposals.
- `buildRevisionHistoryView` projects the append-only hypothesis history.
- `buildEvidenceConstellationView` emits deterministic, GPU-neutral constellation geometry with a DOM-equivalent flag.

### Art, motion, and staging

- `PALETTE`, `TYPOGRAPHY`, and `HUE_RAMP` hold the visual tokens; `resolveDomainHue` assigns hues from catalog order.
- `CABIN` holds the Emberwood cozy-cabin material tint palette (warm woods · firelight · forest · cool dusk fills) and `MAP_COLOR_SCRIPT` the golden-hour DOM color script for the 2D Curiosity Map — the warm value + reference layer over the frozen shapes.
- `WORK_MODE_GLYPHS` maps the fixed work-mode verbs to accessible glyph identifiers.
- `MOTION` and `EASINGS` hold motion tokens; `resolveMotion` returns animated or reduced equivalents.
- `resolveChildStaging` returns age-band presentation settings.

### Scene and tier API

- `SCENE3D` and `CAMERA3D` describe the renderer-neutral scene and camera constants.
- `QUALITY_TIERS` and `RENDER_TIERS` define full, lite, and `board-2d` presentation tiers.
- `resolveIslandLayout` derives island positions from catalog order.
- `resolveQuestPlacement` places a work-mode marker on an island.
- `resolveCamera3D` returns home or focused camera framing with a reduced-motion cut mode.
- `resolveRenderTier` and `resolveQualityTier` choose presentation from device capabilities and user flags.
- `buildSceneView` combines Lab offers, return history, camera state, and tier settings into a deterministic `SceneView`.

The entry point exports the view-model types used by these functions, including `AgeBand`, `DeviceCaps`, `RenderTier`, `QualityTier`, `ChildStaging`, `MotionToken`, `ProbeCardView`, `ProbePickerView`, `SceneView`, `QuestMarkerView`, `IslandView`, `CameraView`, `EvidenceConstellationView`, `CoverageMatrixView`, `ExplanationsView`, `ReturnTimelineView`, `LifecycleStateView`, `RevisionHistoryView`, `InterestLabView`, `ZoneId`, `MapBuildingView`, `CuriosityMapBuilding`, `CuriosityMapReturnState`, `CuriosityMapView`, `TimeLapsePhaseId`, `TimeLapsePhase`, `TimeLapseView`, `ZoneHostAction`, `ZoneHostState`, `ZoneActionModel`, `ZoneActivityManifest`, `ZoneActivityModel`, `QaInteractive`, and `Qa`.

## Guardrails

- The view layer renders domain conclusions and never changes offer, signal, coverage, or lifecycle rules.
- View types permit no scalar passion score, no fixed label, no verdict, rank, percentile, price, or confidence field.
- Islands and quest markers carry state, hue, glyph, provenance, and reason copy. They carry no floating score in the world.
- Coverage gaps stay named and visible. Supporting evidence never hides disconfirming evidence.
- Render tier, age band, plain mode, and reduced motion affect presentation. They do not change domain-derived state.
- The package accepts synthetic domain inputs without consent, admissions, discipline, or legal machinery.

The Next.js app owns React, DOM motion, Three.js, and React Three Fiber. Its canvas mirrors this package's scene numbers; semantic DOM controls remain the operable source of truth.

## Develop

```bash
pnpm --filter @gt100k/interest-lab-view test
pnpm typecheck
pnpm test
pnpm lint
```

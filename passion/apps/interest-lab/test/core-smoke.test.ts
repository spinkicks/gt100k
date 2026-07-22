import { buildLab, buildReturnGrid, buildRevisableHypothesis } from "@gt100k/interest-lab";
import {
  INITIAL_ZONE_HOST_STATE,
  buildCuriosityMapView,
  buildQaSnapshot,
  zoneHostReducer,
} from "@gt100k/interest-lab-view";
import {
  STUB_ZONES,
  STUB_ZONE_CATALOG_V1,
  V1_DOMAIN_ORDER,
  ZONE_LAB_CONFIG_V1,
  createZoneRegistry,
} from "@gt100k/interest-zone-kit";
import { describe, expect, it } from "vitest";

describe("Interest Lab shared-core smoke", () => {
  it("composes the seeded stubs through the P0 public contracts", () => {
    const registry = createZoneRegistry(STUB_ZONES);

    expect(registry.ids).toEqual(["music", "code", "art"]);
    expect(registry.catalog()).toEqual(STUB_ZONE_CATALOG_V1);

    const lab = buildLab(
      "synthetic-smoke-learner",
      registry.catalog(),
      { metPrereqs: [], engagedDomains: [] },
      ZONE_LAB_CONFIG_V1,
    );

    expect(lab.offers).toHaveLength(9);
    expect(lab.coverage.complete).toBe(true);

    const initialMap = buildCuriosityMapView(registry.manifests, [], {
      domainOrder: V1_DOMAIN_ORDER,
    });
    expect(initialMap.buildings).toHaveLength(3);
    expect(initialMap.buildings.every(({ ariaLabel }) => ariaLabel.length > 0)).toBe(true);
    expect(initialMap.buildings.every(({ returnState }) => returnState === "new")).toBe(true);

    const host = zoneHostReducer(INITIAL_ZONE_HOST_STATE, { type: "enter", zoneId: "music" });
    expect(host.activeZoneId).toBe("music");

    const musicProbe = registry.byId("music").probes[0]!;
    const activity = [
      {
        zoneId: "music",
        probeId: musicProbe.id,
        domain: musicProbe.domain,
        workMode: musicProbe.workMode,
        action: "open",
        kind: "return" as const,
        dayOffset: 7,
      },
    ];
    const grid = buildReturnGrid(activity, { domainOrder: V1_DOMAIN_ORDER });
    expect(grid.domainOrder).toEqual(V1_DOMAIN_ORDER);
    expect(grid.rows).toHaveLength(3);

    const hypothesis = buildRevisableHypothesis(
      grid,
      lab.coverage,
      lab.offers.map(({ domain, workMode }) => ({ domain, workMode })),
    );
    expect(hypothesis.reading).toBe("insufficient");

    const qa = buildQaSnapshot({
      ready: true,
      host,
      map: initialMap,
      grid,
      hypothesis,
      interactives: initialMap.buildings.map((building) => ({
        id: `map:${building.zoneId}`,
        kind: "map-building",
        label: building.label,
        domain: building.domain,
      })),
    });

    expect(qa.ready).toBe(true);
    expect(qa.primarySurface).toBe("curiosity-map");
    expect(qa.canvas).toMatchObject({ primary: false, hasDomAlternative: true });
    expect(qa.interactives()).toHaveLength(3);
    expect(qa.grid()).toBe(grid);
    expect(qa.hypothesis()).toBe(hypothesis);
  });
});

import type { ProbeFamily } from "@gt100k/interest-lab";
import type { MapBuildingView, ZoneId } from "@gt100k/interest-lab-view";
import type { ZonePlugin } from "./contracts";

export interface ZoneManifest {
  id: ZoneId;
  domain: string;
  mapBuilding: MapBuildingView;
}

export interface ZoneRegistry {
  ids: ZoneId[];
  manifests: ZoneManifest[];
  byId(id: ZoneId): ZonePlugin;
  catalog(): ProbeFamily[];
}

export function createZoneRegistry(plugins: readonly ZonePlugin[]): ZoneRegistry {
  const byId = new Map<ZoneId, ZonePlugin>();
  const domains = new Set<string>();

  for (const plugin of plugins) {
    if (byId.has(plugin.id)) {
      throw new Error(`Duplicate zone id: ${plugin.id}`);
    }
    if (domains.has(plugin.domain)) {
      throw new Error(`Duplicate zone domain: ${plugin.domain}`);
    }
    if (plugin.probes.some(({ domain }) => domain !== plugin.domain)) {
      throw new Error(`Zone ${plugin.id} has a probe outside domain ${plugin.domain}`);
    }

    byId.set(plugin.id, plugin);
    domains.add(plugin.domain);
  }

  return {
    ids: plugins.map(({ id }) => id),
    manifests: plugins.map(({ id, domain, mapBuilding }) => ({ id, domain, mapBuilding })),
    byId: (id) => {
      const plugin = byId.get(id);
      if (plugin === undefined) {
        throw new Error(`Unknown zone id: ${id}`);
      }
      return plugin;
    },
    catalog: () =>
      plugins.flatMap(({ probes }) =>
        probes.map((probe) => ({ familyId: probe.familyId, variants: [probe] })),
      ),
  };
}

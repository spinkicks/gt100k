import type { Probe, ProbeFamily } from "./probe";

const compareFamilyIds = (left: ProbeFamily, right: ProbeFamily): number =>
  left.familyId < right.familyId ? -1 : left.familyId > right.familyId ? 1 : 0;

export const isProbeEligible = (probe: Probe, metPrerequisites: ReadonlySet<string>): boolean =>
  probe.safetyClass === "cleared" &&
  probe.prerequisites.every((prerequisite) => metPrerequisites.has(prerequisite));

/** Returns at most one eligible variant per family in stable family-id order. */
export const selectEligibleFamilyVariants = (
  families: readonly ProbeFamily[],
  metPrerequisites: ReadonlySet<string>,
): Probe[] =>
  [...families]
    .sort(compareFamilyIds)
    .map((family) => family.variants.find((probe) => isProbeEligible(probe, metPrerequisites)))
    .filter((probe): probe is Probe => probe !== undefined);

/** Derives a deterministic total order by rotating a stable order by the integer seed. */
export const rotateBySeed = <T>(items: readonly T[], seed: number): T[] => {
  if (items.length === 0) return [];

  const offset = ((seed % items.length) + items.length) % items.length;
  return [...items.slice(offset), ...items.slice(0, offset)];
};

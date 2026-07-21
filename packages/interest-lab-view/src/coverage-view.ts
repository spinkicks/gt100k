import { type CoverageMatrix, type Offer, WORK_MODES } from "@gt100k/interest-lab";
import { resolveDomainHue } from "./art";
import { WORK_MODE_GLYPHS } from "./glyphs";
import type { CoverageDimension, CoverageMatrixView, DimensionRailItem } from "./model";

const railItem = (
  dimension: CoverageDimension,
  met: boolean,
  title: string,
  detail: string,
  gapCopy?: string,
): DimensionRailItem => ({
  dimension,
  met,
  title,
  detail,
  ...(gapCopy ? { gapCopy } : {}),
});

const present = (values: readonly [value: string, included: boolean][]): string =>
  values
    .filter(([, included]) => included)
    .map(([value]) => value)
    .join(", ");

const buildRail = (coverage: CoverageMatrix): DimensionRailItem[] => [
  railItem(
    "probeCount",
    coverage.probeCount.met,
    `Probe count ${coverage.probeCount.count}/${coverage.probeCount.need}`,
    `${coverage.probeCount.count} probes offered`,
    coverage.probeCount.met
      ? undefined
      : `probe count ${coverage.probeCount.count} below minimum ${coverage.probeCount.need}`,
  ),
  railItem(
    "domains",
    coverage.domains.met,
    `Domains ${coverage.domains.count}/${coverage.domains.need}`,
    coverage.domains.have.join(", "),
    coverage.domains.gaps[0],
  ),
  railItem(
    "workModes",
    coverage.workModes.met,
    `Work modes ${coverage.workModes.count}/${coverage.workModes.need}`,
    coverage.workModes.have.join(", "),
    coverage.workModes.gaps[0],
  ),
  railItem(
    "social",
    coverage.social.met,
    "Social modes",
    present([
      ["solo", coverage.social.solo],
      ["group", coverage.social.group],
    ]),
    coverage.social.gaps[0],
  ),
  railItem(
    "difficulty",
    coverage.difficulty.met,
    "Difficulty bands",
    present([
      ["foundational", coverage.difficulty.foundational],
      ["stretch", coverage.difficulty.stretch],
    ]),
    coverage.difficulty.gaps[0],
  ),
  railItem(
    "audience",
    coverage.audience.met,
    "Audience conditions",
    present([
      ["audience", coverage.audience.audience],
      ["no_audience", coverage.audience.no_audience],
    ]),
    coverage.audience.gaps[0],
  ),
];

export function buildCoverageMatrixView(
  coverage: CoverageMatrix,
  offers: readonly Offer[],
): CoverageMatrixView {
  const domains = coverage.domains.have;
  const rows = domains.map((domain) => ({
    domain,
    hue: resolveDomainHue(domains, domain),
  }));
  const cols = WORK_MODES.map((workMode) => ({
    workMode,
    glyph: WORK_MODE_GLYPHS[workMode],
  }));
  const cells = rows.flatMap(({ domain }) =>
    cols.map(({ workMode }) => {
      const offer = offers.find(
        (candidate) => candidate.domain === domain && candidate.workMode === workMode,
      );

      return offer
        ? {
            domain,
            workMode,
            status: "offered" as const,
            probeId: offer.probeId,
            provenance: offer.provenance,
            whyCopy: offer.reason,
          }
        : { domain, workMode, status: "empty" as const };
    }),
  );

  return {
    rows,
    cols,
    cells,
    rail: buildRail(coverage),
    complete: coverage.complete,
    gaps: [...coverage.gaps],
  };
}

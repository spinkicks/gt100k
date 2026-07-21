import type { Lab, Offer } from "@gt100k/interest-lab";
import { resolveDomainHue } from "./art";
import { WORK_MODE_GLYPHS } from "./glyphs";
import type { AgeBand, ProbeCardView, ProbePickerView } from "./model";
import { resolveMotion } from "./motion";
import { resolveChildStaging } from "./staging";

interface ProbeHistoryEntry {
  probeId: string;
  returnKind: "voluntary" | "prompted";
  horizon?: 7 | 30;
  interventionContext?: string;
}

interface ProbePickerOptions {
  history: readonly ProbeHistoryEntry[];
  band: AgeBand;
  flags?: Readonly<{
    reducedMotion?: boolean;
  }>;
}

const displayDomain = (domain: string): string => domain.replaceAll("_", " ");

const whyCopyFor = (offer: Offer, band: AgeBand): string => {
  if (offer.provenance === "GUIDE") {
    if (band === "6-8") {
      return `Your guide picked a new way to ${offer.workMode}.`;
    }

    return band === "9-11"
      ? `Your guide suggested this ${offer.workMode} quest as another thing to try.`
      : `Guide suggestion: ${offer.reason}`;
  }

  if (offer.provenance === "SHADOW_MODEL") {
    if (band === "6-8") {
      return `Here is another ${offer.workMode} quest you could try.`;
    }

    return band === "9-11"
      ? `A possible ${offer.workMode} quest was suggested for your guide to review.`
      : `Model suggestion for guide review: ${offer.reason}`;
  }

  if (band === "6-8") {
    return `Try a new way to ${offer.workMode}.`;
  }

  if (band === "9-11") {
    return `A rule suggested this ${offer.workMode} quest to broaden what you can try.`;
  }

  return `Rules engine: ${offer.reason}`;
};

const titleFor = (offer: Offer, band: AgeBand): string => {
  if (band === "6-8") {
    return `A ${offer.workMode} quest`;
  }

  const domain = displayDomain(offer.domain);
  return band === "9-11" ? `${domain}: ${offer.workMode} quest` : `${domain} · ${offer.workMode}`;
};

export function buildProbePickerView(
  lab: Lab,
  options: Readonly<ProbePickerOptions>,
): ProbePickerView {
  const staging = resolveChildStaging(options.band);
  const reducedMotion = options.flags?.reducedMotion ?? false;

  // P9 establishes the fresh-learner projection. P11 extends these fields from history.
  const quests: ProbeCardView[] = lab.offers.map((offer) => ({
    probeId: offer.probeId,
    familyId: offer.familyId,
    domain: offer.domain,
    domainHue: resolveDomainHue(lab.coverage.domains.have, offer.domain),
    workMode: offer.workMode,
    workModeGlyph: WORK_MODE_GLYPHS[offer.workMode],
    difficulty: offer.difficulty,
    social: offer.social,
    audience: offer.audience,
    provenance: offer.provenance,
    whyCopy: whyCopyFor(offer, options.band),
    returnState: "new",
    tone: "neutral",
    motion: resolveMotion("cardEnter", { reducedMotion }),
    title: titleFor(offer, options.band),
    helpAffordance: true,
  }));
  const visibleCount =
    staging.maxVisibleQuests === "all" ? quests.length : staging.maxVisibleQuests;

  return {
    band: options.band,
    staging,
    quests,
    visibleQuests: quests.slice(0, visibleCount),
    choicePointsMinEligible: lab.choicePointsMinEligible,
    workModeGlyphs: { ...WORK_MODE_GLYPHS },
    exploration: {
      domainsExplored: 0,
      workModesExplored: 0,
    },
  };
}

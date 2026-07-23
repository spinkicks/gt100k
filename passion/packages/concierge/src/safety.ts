// Pure safety helpers (spec §3.2 stages 2/4/5, [D6]). No logic that touches the network or a
// model — these are the deterministic, defense-in-depth primitives the pipeline composes:
//   • scrubPII      — strip identifying detail from a child's message BEFORE it leaves stage 2.
//   • spotlight     — mark retrieved text as UNTRUSTED DATA so it can never read as instructions.
//   • reputationOf  — allowlist-biased source scoring; unknown sources fall below the floor.
// Injection defense is ARCHITECTURAL (spotlighting + treating all retrieved text as untrusted),
// not a single filter — see [D6]. SYNTHETIC data only.
import { REPUTATION_FLOOR } from "./model.js";

// --- PII scrub (stage 2) ------------------------------------------------------------------
const EMAIL_RE = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
// US-style numbers: optional area-code parens / country code, common separators. No leading
// `\b` — that would skip the opening "(" of a "(555) 123-4567" form.
const PHONE_RE = /\(?(?:\+?\d{1,3}[\s.-]?)?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g;
// A self-introduced name: "my name is X", "I am X", "call me X" (one or two capitalized words).
const NAME_RE =
  /\b(my name is|i am|i'm|call me)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi;

export interface PIIScrubResult {
  readonly cleaned: string;
  readonly hadPII: boolean;
}

/**
 * Redact emails, phone numbers, and self-introduced names from a message. Deterministic and
 * order-stable (emails → phones → names). `hadPII` is true iff anything was redacted. The
 * introducer of a name ("my name is") is kept; only the name itself is replaced.
 */
export function scrubPII(msg: string): PIIScrubResult {
  let hadPII = false;
  let cleaned = msg.replace(EMAIL_RE, () => {
    hadPII = true;
    return "[redacted-email]";
  });
  cleaned = cleaned.replace(PHONE_RE, () => {
    hadPII = true;
    return "[redacted-phone]";
  });
  cleaned = cleaned.replace(NAME_RE, (_m, intro: string) => {
    hadPII = true;
    return `${intro} [redacted-name]`;
  });
  return { cleaned, hadPII };
}

// --- Spotlighting (stages 4/5, [D6]) ------------------------------------------------------
/** Opening marker for an untrusted-content region. */
export const SPOTLIGHT_BEGIN = "«untrusted-document»";
/** Closing marker for an untrusted-content region. */
export const SPOTLIGHT_END = "«/untrusted-document»";

/**
 * Wrap retrieved text in explicit untrusted-content delimiters so a downstream generator treats
 * it as quoted DATA, never as instructions ([D6], SC-3). Any forged copies of our delimiters
 * inside the payload are escaped first, so untrusted text cannot break out of its region.
 * Content is preserved (present as data) — spotlighting marks, it does not delete.
 */
export function spotlight(text: string): string {
  const safe = text.split(SPOTLIGHT_BEGIN).join("[marker]").split(SPOTLIGHT_END).join("[marker]");
  return `${SPOTLIGHT_BEGIN}\n${safe}\n${SPOTLIGHT_END}`;
}

// --- Reputation scoring (stage 4, [D3]) ---------------------------------------------------
/**
 * Starter allowlist of reputable, child-appropriate sources. Real ranking is the live adapter's
 * job (Task 7); this deterministic set biases the stub retriever + the per-doc filter.
 */
export const ALLOWLIST: readonly string[] = [
  "wikipedia.org",
  "khanacademy.org",
  "britannica.com",
  "nationalgeographic.com",
  "nasa.gov",
  "si.edu",
  "pbslearningmedia.org",
];

/** Reputation assigned to an allowlisted source (at/above the retain floor). */
export const REPUTATION_ALLOWLISTED = 0.9;
/** Reputation assigned to an unknown source (below the retain floor ⇒ dropped). */
export const REPUTATION_UNKNOWN = 0.2;

// Invariant the constants must uphold: allowlisted retained, unknown dropped.
const _floorOk: true = (REPUTATION_ALLOWLISTED >= REPUTATION_FLOOR &&
  REPUTATION_UNKNOWN < REPUTATION_FLOOR) as true;
void _floorOk;

/**
 * Score a URL's source reputation against an allowlist. An allowlisted domain (or any of its
 * subdomains) scores {@link REPUTATION_ALLOWLISTED}; everything else — including unparseable
 * URLs (fail safe) and lookalike domains — scores {@link REPUTATION_UNKNOWN}.
 */
export function reputationOf(url: string, allowlist: readonly string[] = ALLOWLIST): number {
  let host: string;
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return REPUTATION_UNKNOWN; // fail safe: an unparseable URL is never trusted.
  }
  const allowed = allowlist.some((d) => host === d || host.endsWith(`.${d}`));
  return allowed ? REPUTATION_ALLOWLISTED : REPUTATION_UNKNOWN;
}

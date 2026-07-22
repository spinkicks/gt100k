import { createHash } from "node:crypto";

export type Sha256ContentHash = `sha256:${string}`;

type CanonicalPrimitive = boolean | null | number | string;
type CanonicalValue = CanonicalPrimitive | CanonicalValue[] | { [key: string]: CanonicalValue };

const JSON_COMPATIBLE_ERROR = "Canonical content must be JSON-compatible";

function normalize(value: unknown, ancestors: Set<object>): CanonicalValue {
  if (value === null || typeof value === "boolean" || typeof value === "string") {
    return value;
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new TypeError(JSON_COMPATIBLE_ERROR);
    }
    return value;
  }

  if (typeof value !== "object") {
    throw new TypeError(JSON_COMPATIBLE_ERROR);
  }

  if (ancestors.has(value)) {
    throw new TypeError(JSON_COMPATIBLE_ERROR);
  }
  ancestors.add(value);

  try {
    if (Array.isArray(value)) {
      return value.map((item, index) => {
        if (!(index in value) || item === undefined) {
          throw new TypeError(JSON_COMPATIBLE_ERROR);
        }
        return normalize(item, ancestors);
      });
    }

    const prototype = Object.getPrototypeOf(value) as unknown;
    if (prototype !== Object.prototype && prototype !== null) {
      throw new TypeError(JSON_COMPATIBLE_ERROR);
    }

    const normalized: { [key: string]: CanonicalValue } = {};
    const record = value as Record<string, unknown>;
    for (const key of Object.keys(record).sort()) {
      if (record[key] !== undefined) {
        normalized[key] = normalize(record[key], ancestors);
      }
    }
    return normalized;
  } finally {
    ancestors.delete(value);
  }
}

/** Produces stable, minified JSON with lexicographically sorted object keys. */
export function canonicalize(value: unknown): string {
  return JSON.stringify(normalize(value, new Set()));
}

/** Hashes canonical UTF-8 JSON and includes the algorithm in the persisted value. */
export function sha256ContentHash(value: unknown): Sha256ContentHash {
  const digest = createHash("sha256").update(canonicalize(value), "utf8").digest("hex");
  return `sha256:${digest}`;
}

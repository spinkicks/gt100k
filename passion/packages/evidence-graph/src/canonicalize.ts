type JsonObject = Record<string, unknown>;

function normalizeForCanonicalJson(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeForCanonicalJson(item));
  }

  if (value !== null && typeof value === "object") {
    const object = value as JsonObject;
    const normalized: JsonObject = {};

    for (const key of Object.keys(object).sort()) {
      const field = object[key];
      if (field !== undefined) {
        normalized[key] = normalizeForCanonicalJson(field);
      }
    }

    return normalized;
  }

  return value;
}

/**
 * Encodes JSON-compatible content using RFC 8785 key ordering and minified JSON.
 * Undefined object fields are treated as absent so optional node fields are omitted.
 */
export function canonicalize(value: unknown): string {
  const serialized = JSON.stringify(normalizeForCanonicalJson(value));

  if (serialized === undefined) {
    throw new TypeError("Canonical content must be JSON-serializable");
  }

  return serialized;
}

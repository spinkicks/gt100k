// Where a child's play becomes a guide's read.
//
// The engines have been complete and connected to nothing for weeks: the console derived its roster
// by running the real orchestrator over synthetic logs, and the game wrote real logs to a
// localStorage key nobody read. This route is the join, and it is deliberately thin. Everything that
// could be wrong is decided in `@gt100k/student-profile`'s `ingest`, which is pure and tested;
// what is left here is parsing, storage and status codes.
import { NextResponse } from "next/server";
import {
  emptyProfile,
  ingest,
  type CycleBatch,
  type StudentProfile,
} from "@gt100k/student-profile";
import { createFsProfileStore } from "@gt100k/profile-store-fs";
import { CATALOG } from "@gt100k/discovery-catalog";
import { decideConsent, type ConsentRecord } from "@gt100k/consent";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * Node, not edge: the store writes files.
 *
 * `force-dynamic` because a build-time render of an ingest endpoint would be meaningless, and Next
 * will attempt one otherwise.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Overridable so a test or a second instance does not fight over one directory.
 *
 * Read per request rather than captured at module scope. Module-scope capture pins the value to
 * whenever this file first happened to be imported, which is invisible in production and wrong
 * everywhere else: a test that sets the variable after importing writes to the previous test's
 * directory and then reads an empty one.
 */
const profileDir = (): string => process.env.GT100K_PROFILE_DIR ?? ".profiles";

interface IngestRequest {
  readonly kidId?: unknown;
  readonly displayName?: unknown;
  readonly interactions?: unknown;
  readonly surfaced?: unknown;
}

const isRecordArray = (v: unknown): v is readonly Record<string, unknown>[] =>
  Array.isArray(v) && v.every((x) => typeof x === "object" && x !== null);

/**
 * Consent records, from a file beside the profiles.
 *
 * A file rather than a database because there is no database, and a missing file therefore has to
 * mean NO CONSENT rather than "not configured yet". That is the whole point of the gate: the state
 * where nobody has set anything up is exactly the state where a child's data must not be collected,
 * and any code that treats absence as permission has inverted it.
 */
async function consentRecords(): Promise<readonly ConsentRecord[]> {
  try {
    const raw = await readFile(join(profileDir(), "consent.json"), "utf8");
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ConsentRecord[]) : [];
  } catch {
    return [];
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  let body: IngestRequest;
  try {
    body = (await request.json()) as IngestRequest;
  } catch {
    return NextResponse.json({ error: "body is not JSON" }, { status: 400 });
  }

  const kidId = typeof body.kidId === "string" ? body.kidId.trim() : "";
  if (!kidId) return NextResponse.json({ error: "kidId is required" }, { status: 400 });

  // Rejected rather than coerced. An empty array is a legitimate batch (a child who was shown
  // things and did nothing is real data), but a malformed one is an emitter bug, and accepting it
  // quietly is how a broken emitter goes unnoticed for weeks.
  if (!isRecordArray(body.interactions) || !isRecordArray(body.surfaced)) {
    return NextResponse.json(
      { error: "interactions and surfaced must both be arrays of objects" },
      { status: 400 },
    );
  }

  const batch = {
    interactions: body.interactions,
    surfaced: body.surfaced,
  } as unknown as CycleBatch;

  // G3. Before anything is read, written or derived.
  //
  // 403 rather than 400: the request is well-formed and the answer is that we are not allowed to
  // accept it. The reason is returned because the emitter is the only thing that can act on it, and
  // a child's session silently vanishing into a refusal is the failure mode this is meant to
  // prevent rather than create.
  const decision = decideConsent(
    await consentRecords(),
    kidId,
    "discovery-measurement",
    new Date().toISOString(),
  );
  if (!decision.allowed) {
    return NextResponse.json(
      { error: "no consent for discovery-measurement", reason: decision.reason },
      { status: 403 },
    );
  }

  const store = createFsProfileStore(profileDir());
  const existing: StudentProfile | null = await store.load(kidId);
  const profile =
    existing ??
    emptyProfile(kidId, typeof body.displayName === "string" ? body.displayName : kidId);

  const result = ingest(profile, batch, { catalog: CATALOG }, new Date().toISOString());
  await store.save(result.profile);

  // `rejected` is returned rather than logged, so a misconfigured emitter finds out from the
  // response instead of from a guide noticing a child's cabin is empty.
  return NextResponse.json({
    kidId,
    accepted: result.accepted,
    rejected: result.rejected,
    totals: {
      interactions: result.profile.interactions.length,
      surfaced: result.profile.surfaced.length,
    },
  });
}

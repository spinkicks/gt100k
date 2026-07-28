// Grant consent for a demo child, so the ingest route stops refusing.
//
// This exists because the gate is deny-by-default and that is the correct default: a fresh checkout
// with no consent file must not accept a child's data. The cost is that someone wiring the game up
// for the first time gets a 403 and no obvious way forward, and the shape of the record they need is
// only discoverable by reading the types. So this writes one, and refuses to be mistaken for the
// real thing.
//
// It writes `method: "guide-asserted"`, which is the weakest of the three and NOT verifiable
// parental consent. That is deliberate and it is also true: nobody has verified anything here. A
// pilot with real children needs a real record, obtained a real way.
//
//   pnpm --filter @gt100k/guide-console consent            # the game's default kid
//   pnpm --filter @gt100k/guide-console consent kid-7      # someone else
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { PURPOSES, type ConsentRecord } from "@gt100k/consent";

const dir = process.env.GT100K_PROFILE_DIR ?? ".profiles";
const file = join(dir, "consent.json");
const kidId = process.argv[2] ?? "local-demo";

async function existing(): Promise<ConsentRecord[]> {
  try {
    const parsed: unknown = JSON.parse(await readFile(file, "utf8"));
    return Array.isArray(parsed) ? (parsed as ConsentRecord[]) : [];
  } catch {
    return [];
  }
}

// Wrapped rather than top-level: this app is CommonJS, so top-level await does not transform.
async function main(): Promise<void> {
  const records = await existing();
  if (records.some((r) => r.kidId === kidId && r.withdrawnAt === undefined)) {
    console.log(`${kidId} already has consent on file in ${file}. Nothing to do.`);
    return;
  }

  // Every purpose, because this is a development seam and a half-granted demo is a confusing one. A
  // real record should grant only what was actually asked for.
  records.push({
    kidId,
    guardianRef: "demo-guardian",
    method: "guide-asserted",
    purposes: PURPOSES,
    grantedAt: new Date().toISOString(),
  });

  await mkdir(dir, { recursive: true });
  await writeFile(file, `${JSON.stringify(records, null, 2)}\n`);

  console.log(`Consent granted for ${kidId} in ${file}.`);
  console.log("method: guide-asserted, which is NOT verifiable parental consent. Demo use only.");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});

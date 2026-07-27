#!/usr/bin/env -S node --experimental-strip-types
/**
 * Check every URL in a curated library still resolves.
 *
 * NOT part of the test gate: it needs the network, and a gate that fails because someone else's
 * server is down is a gate people learn to ignore. Run it on a schedule, and before a release.
 *
 * Why it exists at all. Pew Research Center, "When Online Content Disappears" (2024, sample of
 * ~1M pages from Common Crawl): 38% of pages that existed in 2013 were gone by 2023, 25% of all
 * pages from 2013-2023 were gone, and — the number that matters here — **about one in five pages
 * from 2021 were inaccessible just two years later**.
 * <https://www.pewresearch.org/data-labs/2024/05/17/when-online-content-disappears/>
 *
 * So a curated library is not a thing you author once. Left alone for two years, roughly a fifth of
 * it becomes a child tapping a subtopic and landing on a 404 — which is the dead end the validator's
 * EMPTY_SUBTOPIC rule exists to prevent, arriving later by a different route.
 *
 * Usage:  pnpm --filter @gt100k/concierge exec node --experimental-strip-types scripts/check-links.ts
 */
import { SEED_LIBRARY } from "../src/seed-library.js";
import type { CuratedResource } from "../src/model.js";

interface Result {
  readonly resource: CuratedResource;
  readonly status: number | null;
  readonly note: string;
}

const TIMEOUT_MS = 15_000;

/**
 * HEAD first, then GET on failure. Plenty of servers answer HEAD with 405 or 403 while serving GET
 * perfectly, so a HEAD-only check would report healthy links as dead and erode trust in the report.
 */
async function check(resource: CuratedResource): Promise<Result> {
  for (const method of ["HEAD", "GET"] as const) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(resource.url, {
        method,
        signal: controller.signal,
        redirect: "follow",
        headers: { "user-agent": "gt100k-link-check/1.0 (curated library maintenance)" },
      });
      clearTimeout(timer);
      if (res.ok)
        return { resource, status: res.status, note: method === "GET" ? "ok (GET)" : "ok" };
      if (method === "GET") return { resource, status: res.status, note: res.statusText };
    } catch (e) {
      clearTimeout(timer);
      if (method === "GET") {
        return { resource, status: null, note: e instanceof Error ? e.message : "failed" };
      }
    }
  }
  return { resource, status: null, note: "unreachable" };
}

async function main(): Promise<void> {
  const library = SEED_LIBRARY;
  console.log(`Checking ${library.length} curated URLs...\n`);

  const results: Result[] = [];
  // Serial on purpose. This is maintenance, not a race, and hammering the institutions we depend on
  // is both rude and a good way to get rate-limited into false negatives.
  for (const r of library) {
    const result = await check(r);
    results.push(result);
    const mark = result.status !== null && result.status < 400 ? "ok  " : "DEAD";
    console.log(`${mark} ${String(result.status ?? "---").padEnd(4)} ${r.id}  ${r.url}`);
  }

  const dead = results.filter((r) => r.status === null || r.status >= 400);
  console.log(`\n${results.length - dead.length}/${results.length} alive.`);
  if (dead.length > 0) {
    console.log("\nNeeds attention:");
    for (const d of dead) console.log(`  ${d.resource.id}  ${d.resource.url}  (${d.note})`);
    process.exitCode = 1;
  }
}

await main();

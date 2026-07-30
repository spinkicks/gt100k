#!/usr/bin/env -S npx tsx
/**
 * Check every URL a child can reach still resolves — the curated library AND the pursuits
 * catalogue's venues.
 *
 * NOT part of the test gate: it needs the network, and a gate that fails because someone else's
 * server is down is a gate people learn to ignore. Run it on a schedule, and before a release.
 *
 * THE VENUES WERE NOT SWEPT UNTIL 2026-07-29, and five were broken. Three domains did not resolve
 * at all — `letsplayscrabble.org`, `toyota-dreamcar.com`, `younganimatorotheyear.com` — and two more
 * 404ed after their organisations rebuilt. Every one of them was a plausible guess at a real
 * institution's address rather than an address anyone had opened. A venue is the answer to "who will
 * judge this?", so a dead one is a promise the product cannot keep, and it sat one field away from a
 * library where every URL had been verified. Checking one collection and not the other is the same
 * partition mistake the library's own coverage rule made.
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
 * Usage:  pnpm --filter @gt100k/concierge run check-links
 *
 * `tsx` rather than node's own `--experimental-strip-types`, which resolves a `.js` specifier back
 * to `.ts` inside a package but not across a workspace link — so it cannot follow the import of
 * `@gt100k/pursuits` that the venue sweep needs.
 */
import { PURSUITS } from "@gt100k/pursuits";

import { SEED_LIBRARY } from "../src/seed-library.js";

/** A URL to check, from either collection, reduced to what the report needs to name it. */
interface Target {
  readonly id: string;
  readonly url: string;
}

/**
 * `dead` means a child would land on nothing. `blocked` means a machine cannot tell.
 *
 * THE DISTINCTION IS THE WHOLE POINT OF THE REPORT. Fifteen of three hundred and eighteen URLs come
 * back not-ok, and on inspection every one is a WAF rejecting an automated client, a rate limit, or
 * this machine's own network — the Smithsonian, ABRSM, the Royal School of Needlework, all fine in a
 * browser. Filing those next to a real 404 produces a report that is fifteen-parts noise and
 * zero-parts signal, and a report like that gets skimmed, which is how the one genuine dead link
 * survives. So only `dead` fails the run; `blocked` is printed and counted and left to a human.
 */
type Verdict = "ok" | "dead" | "blocked";

interface Result {
  readonly target: Target;
  readonly status: number | null;
  readonly verdict: Verdict;
  readonly note: string;
}

const TIMEOUT_MS = 15_000;

/**
 * A browser's user agent, rather than an honest one naming this tool.
 *
 * The honest string was tried first and reported thirteen live pages as Forbidden: the Exploratorium,
 * the American Go Association, NOAA, the Smithsonian, 4-H and others all run WAFs that reject an
 * unrecognised agent. Every one of those was a false alarm, and a report that is mostly false alarms
 * is a report nobody reads — which is how the real dead links hide.
 *
 * The question this script asks is "would a child reach this page", so the request should look like
 * the one a child's browser makes. Impersonation would be the wrong call for a crawler that fetches
 * at volume; this one walks three hundred URLs serially, on a schedule, and is gentler than a person
 * clicking through the same list.
 */
const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

/**
 * A STATUS CODE IS NOT ENOUGH, and this cost us a real dead link before it was understood.
 *
 * `projects.raspberrypi.org` is a single-page app that answers 200 for every path, including paths
 * invented as a control. A plausible-looking deep link was added to the library, "verified" at 200,
 * and shipped — and it rendered "Something's gone wrong", identically to a made-up URL. Tinkercad
 * behaves the same way. On those domains an HTTP check confirms only that the app is up, never that
 * the page exists.
 *
 * So the body is checked too. This is a heuristic and will not catch a soft 404 that renders a
 * cheerful empty page, which is why the honest rule for SPA-backed domains remains: prefer the
 * collection URL you can see working over a deep link you inferred.
 */
const SOFT_404 = [
  /something'?s gone wrong/i,
  /page not found/i,
  /error 404/i,
  /no longer available/i,
  /doesn'?t exist/i,
  /how did you get here/i,
];

/**
 * Markers that appear anywhere in the document rather than in its title.
 *
 * Each was found the hard way during the 2026-07-29 sweep, and each defeats a title check:
 *
 *   `noarticletext` is MediaWiki's class for a page that does not exist. It still renders a title
 *   reading "School Scrabble - NASPAWiki", so a status-plus-title check scores it as a hit. Three
 *   plausible NASPA URLs failed this way.
 *
 *   "Pardon Our Interruption" is Imperva's bot interstitial, served AT 200. `pokemon.com` produced
 *   it once mid-sweep and served the real rulebook on four later attempts, so it is a rate-limit
 *   artefact rather than a dead page — but a checker that scores it as alive is not checking.
 */
const SOFT_404_ANYWHERE = [/class="[^"]*noarticletext/i];

/**
 * Bodies that are a bot check rather than a page — served at 200, 202 or 403 depending on vendor.
 *
 * Not evidence of anything about the page behind them, which is why they land in `blocked`.
 */
const CHALLENGE = [
  /pardon our interruption/i,
  /just a moment\.\.\./i,
  /attention required! \| cloudflare/i,
  /enable javascript and cookies to continue/i,
  /request verification/i,
];

/**
 * Effective URLs that mean the server redirected the request to its own error page.
 *
 * `arrl.org` sends any bad path to `/pages/display/error404` and answers **200** there, so the
 * status code says the page is fine and the title says nothing useful. Same failure class as
 * `projects.raspberrypi.org`, different tell.
 */
const ERROR_REDIRECTS = [/\/pages\/display\/error404/i];

/**
 * Below this a 200 is not a page.
 *
 * `nypl.org/blog/topic/graphic-novels` answers 200 with 212 bytes. Two CoCoRaHS pages answer 200
 * with site chrome and no content. The threshold is deliberately low — it is meant to catch a
 * response that cannot possibly be a document, not to judge a thin one.
 *
 * A body of EXACTLY zero is excluded and handled as `blocked` instead. Into Film sits behind
 * CloudFront, which answers a suspected bot with `202` and nothing at all — no challenge markup to
 * match on, just an empty response — while serving the real 82KB page to curl. An empty body is the
 * fetch layer failing to get a document, not a document that turned out to be empty, and reporting
 * it as dead would have retired a live public-broadcaster resource.
 */
const MIN_BODY_BYTES = 1_000;

function softFailure(body: string, effectiveUrl: string): string | null {
  if (ERROR_REDIRECTS.some((re) => re.test(effectiveUrl))) {
    return `SOFT 404 (200 after redirect to ${effectiveUrl})`;
  }
  // Titles and headings only for the phrase list: the words "page not found" appear legitimately in
  // body copy about broken links, and matching the whole document would flag good pages.
  const head = /<title[^>]*>([\s\S]{0,200}?)<\/title>/i.exec(body)?.[1] ?? "";
  const h1 = /<h1[^>]*>([\s\S]{0,200}?)<\/h1>/i.exec(body)?.[1] ?? "";
  if (SOFT_404.some((re) => re.test(`${head} ${h1}`))) {
    return "SOFT 404 (200 serving an error page)";
  }
  if (SOFT_404_ANYWHERE.some((re) => re.test(body))) {
    return "SOFT 404 (200 serving an empty or challenge page)";
  }
  if (body.length > 0 && body.length < MIN_BODY_BYTES) {
    return `SOFT 404 (200 with ${body.length} bytes, too small to be a page)`;
  }
  return null;
}

/**
 * HEAD first, then GET on failure. Plenty of servers answer HEAD with 405 or 403 while serving GET
 * perfectly, so a HEAD-only check would report healthy links as dead and erode trust in the report.
 */
async function fetchOnce(url: string): Promise<Result["status"] | Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    // Both headers are load-bearing and both were found by a false 404.
    //
    // `accept: */*` rather than `text/html`, because the RHS school-gardening site answers 404 to
    // the narrower one. `accept-language` because the SAME site answers 404 without it and 278KB of
    // the real page with it. Two headers away from deleting a good resource on the strength of a
    // fabricated 404 — which is the argument for the browser user agent restated: any request that
    // does not look like a child's browser is asking a different question than the one we mean.
    return await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "user-agent": BROWSER_UA,
        accept: "*/*",
        "accept-language": "en-GB,en;q=0.9",
      },
    });
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * GET only, and twice on failure.
 *
 * HEAD was dropped: it has no body, so on the SPA-backed domains this script exists to catch, its
 * 200 says only that the app is up — every HEAD had to fall through to GET anyway, and the extra
 * request bought nothing but load on the institutions we depend on.
 *
 * The retry is for the other half of the noise. `scrabbleplayers.org` answered 200 in the morning
 * and 500 in the afternoon, and `pokemon.com` serves an Imperva interstitial to bursts and the real
 * rulebook when asked again. One retry after a pause converts most of those from a false alarm into
 * an `ok`, and leaves anything that fails twice worth looking at.
 */
async function check(target: Target): Promise<Result> {
  let last: Result = { target, status: null, verdict: "dead", note: "unreachable" };

  for (let attempt = 0; attempt < 2; attempt++) {
    if (attempt > 0) await new Promise((r) => setTimeout(r, 3_000));

    const res = await fetchOnce(target.url);
    if (res === null) {
      last = { target, status: null, verdict: "dead", note: "network failure" };
      continue;
    }

    const body = await res.text().catch(() => "");

    if (CHALLENGE.some((re) => re.test(body))) {
      last = { target, status: res.status, verdict: "blocked", note: "bot challenge" };
      continue;
    }
    if (body.length === 0) {
      last = { target, status: res.status, verdict: "blocked", note: "empty response" };
      continue;
    }
    if (res.status === 403 || res.status === 429) {
      last = { target, status: res.status, verdict: "blocked", note: res.statusText || "refused" };
      continue;
    }
    if (!res.ok) {
      // A 5xx is the server having a bad minute rather than the page being gone, so it gets the
      // retry; a 4xx that is not a refusal is a real answer and there is nothing to wait for.
      last = { target, status: res.status, verdict: "dead", note: res.statusText };
      if (res.status < 500) return last;
      continue;
    }

    const soft = softFailure(body, res.url);
    if (soft !== null) {
      last = { target, status: res.status, verdict: "dead", note: soft };
      continue;
    }
    return { target, status: res.status, verdict: "ok", note: "ok" };
  }

  return last;
}

async function sweep(label: string, targets: readonly Target[]): Promise<readonly Result[]> {
  console.log(`Checking ${targets.length} ${label}...\n`);
  const results: Result[] = [];
  // Serial on purpose. This is maintenance, not a race, and hammering the institutions we depend on
  // is both rude and a good way to get rate-limited into false negatives.
  for (const t of targets) {
    const result = await check(t);
    results.push(result);
    const mark = { ok: "ok  ", blocked: "??  ", dead: "DEAD" }[result.verdict];
    console.log(`${mark} ${String(result.status ?? "---").padEnd(4)} ${t.id}  ${t.url}`);
  }
  return results;
}

async function main(): Promise<void> {
  const results = [
    ...(await sweep(
      "curated URLs",
      SEED_LIBRARY.map((r) => ({ id: r.id, url: r.url })),
    )),
    ...(await sweep(
      "pursuit venues",
      PURSUITS.map((p) => ({ id: `venue:${p.id}`, url: p.venue.url })),
    )),
  ];

  const dead = results.filter((r) => r.verdict === "dead");
  const blocked = results.filter((r) => r.verdict === "blocked");
  console.log(
    `\n${results.length - dead.length - blocked.length}/${results.length} alive, ` +
      `${blocked.length} unverifiable, ${dead.length} dead.`,
  );

  if (blocked.length > 0) {
    console.log("\nCould not be checked. A bot challenge or a refusal, not a dead page:");
    for (const b of blocked) console.log(`  ${b.target.id}  ${b.target.url}  (${b.note})`);
  }
  if (dead.length > 0) {
    console.log("\nDead. A child following these lands on nothing:");
    for (const d of dead) console.log(`  ${d.target.id}  ${d.target.url}  (${d.note})`);
    process.exitCode = 1;
  }
}

await main();

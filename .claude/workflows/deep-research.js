export const meta = {
  name: 'deep-research',
  description: 'Deep research harness — fan-out web searches, fetch sources, corroborate + adversarially verify claims across rounds, synthesize a cited report.',
  whenToUse: 'When the user wants a deep, multi-source, fact-checked research report on any topic. BEFORE invoking, if the question is underspecified (e.g. "what car to buy" with no budget/use-case/region), ask 2-3 clarifying questions and weave the answers into the question. INVOKE with args as an object: {question: "<refined question>", today: "<YYYY-MM-DD>"} using today\'s actual date so recency handling works (a bare string still works but disables recency). AFTER it completes, use the Write tool to save result.reportMarkdown verbatim to result.suggestedFilename in the repo root, then give the user a short summary and the file path.',
  phases: [
    {"title":"Scope","detail":"Decompose question into ~5 search angles; flag time-sensitivity"},
    {"title":"Search","detail":"Parallel WebSearch, one agent per angle"},
    {"title":"Fetch","detail":"Barrier + global relevance rank, per-domain cap, fetch best N, extract claims"},
    {"title":"Cluster","detail":"Group corroborating claims, flag contradictions"},
    {"title":"Verify","detail":"3-vote diverse-lens verification per cluster representative"},
    {"title":"Synthesize","detail":"Merge, rank by confidence, cite, assemble report markdown"},
  ],
}

// deep-research v2: Scope → Search →[barrier] Rank+Allocate → Fetch+Extract →[barrier]
//   Cluster → Verify(diverse 3-vote), wrapped by a gap-driven round controller (max 2),
//   then Synthesize + deterministic report-markdown assembly.
// Universal: lives at ~/.claude/workflows/deep-research.js, no project coupling.
// Question passed via args: {question, today} (or a bare string; today enables recency).

// ─── Config (fixed guardrail caps; budget is a brake, not a throttle) ───
const CFG = { angles: 5, fetch: 15, verifyClaims: 25, rounds: 2, perDomain: 3, votes: 3, refuteQuorum: 2 }
const LOW_BUDGET_TOKENS = 60000
const brakeEngaged = () => budget.total != null && budget.remaining() < LOW_BUDGET_TOKENS

// ─── Input ───
let QUESTION = "", TODAY = ""
if (typeof args === "string") { QUESTION = args.trim() }
else if (args && typeof args === "object") { QUESTION = String(args.question || "").trim(); TODAY = String(args.today || "").trim() }

// ─── Sanitization (preserved verbatim from v1) ───
// The workflow sandbox is a bare ECMAScript realm — no URL global — so
// hostname/path come from a regex: captures (1) hostname (userinfo, www.,
// and port stripped) and (2) pathname. Neither userinfo nor host admits
// \: WHATWG URL treats \ as a path separator for http(s), so a laxer
// class would label evil.com\@trusted.com as trusted.com while WebFetch
// actually goes to evil.com. Userinfo DOES admit @ — WHATWG splits the
// authority at the LAST @ before the host, so greedy matching must too;
// stopping at the first @ would label x@trusted.com@evil.com as
// trusted.com while the fetch contacts evil.com. The host class still
// excludes @, so the userinfo group consumes every @ up to the last one.
const URL_HOST_PATTERN = /^[a-z][a-z0-9+.-]*:\/\/(?:[^/?#\\]*@)?(?:www\.)?([^/:?#@\\]+)(?::\d+)?([^?#]*)/i
const normURL = u => {
  const m = String(u).match(URL_HOST_PATTERN)
  return m ? (m[1] + m[2].replace(/\/$/, "")).toLowerCase() : String(u).toLowerCase()
}
// Host and title both come from web content and reach the terminal via the
// progress label. Two hazards: forging a trusted hostname, and smuggling
// terminal control sequences or invisible reordering chars. LABEL_STRIP
// deletes what must never render — C0/C1 controls (incl. ESC/CSI, the ANSI
// introducers), Unicode bidi overrides/isolates and zero-width format chars
// (U+200B-200F, U+202A-202E, U+2066-2069, U+FEFF — they visually reorder or
// hide label text), and the WHOLE double-quote lookalike family (ASCII " plus
// U+201C-201F, U+2033, U+2036, U+275D, U+275E, U+301D, U+301E, U+FF02 — any of
// which would visually close the quoted fallback early and forge host-shaped
// text after it). STRICT_HOST is the strict registrable-hostname charset a
// bare label must match (dot-separated LDH labels). normURL keeps the raw
// capture: dedup keys are never rendered, and stripping there could collide
// distinct URLs.
const LABEL_CAP = 40
const LABEL_STRIP = /[\x00-\x1f\x7f-\x9f\u200b-\u200f\u202a-\u202e\u2066-\u2069\ufeff\u0022\u201c-\u201f\u2033\u2036\u275d\u275e\u301d\u301e\uff02]/g
const STRICT_HOST = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/
const stripLabelChars = s => String(s).replace(LABEL_STRIP, "")
// Render a web-controlled value as a clearly-untrusted quoted label: strip
// dangerous chars, cap at LABEL_CAP code points (Array.from so a surrogate
// pair never splits), and when the cap actually truncated the value, append …
// INSIDE the quotes so a shortened string can never pass for the whole thing.
const quotedLabel = s => {
  const cps = Array.from(stripLabelChars(s))
  return '"' + cps.slice(0, LABEL_CAP).join("").trim() + (cps.length > LABEL_CAP ? "…" : "") + '"'
}
const domainOf = u => { const m = String(u).match(URL_HOST_PATTERN); return m ? m[1].toLowerCase() : "" }

// ─── Cross-round state + rank maps ───
const seen = new Map()
const relRank = { high: 0, medium: 1, low: 2 }
const impRank = { central: 0, supporting: 1, tangential: 2 }
const qualRank = { primary: 0, secondary: 1, blog: 2, forum: 3, unreliable: 4 }
const confRank = { high: 0, medium: 1, low: 2 }

// ─── Schemas ───
const SCOPE_SCHEMA = {
  type: "object", required: ["question", "angles", "summary"],
  properties: {
    question: { type: "string" },
    summary: { type: "string" },
    timeSensitive: { type: "boolean" },
    angles: { type: "array", minItems: 3, maxItems: 6, items: {
      type: "object", required: ["label", "query"],
      properties: {
        label: { type: "string" },
        query: { type: "string" },
        rationale: { type: "string" },
      },
    }},
  },
}
const SEARCH_SCHEMA = {
  type: "object", required: ["results"],
  properties: {
    results: { type: "array", maxItems: 6, items: {
      type: "object", required: ["url", "title", "relevance"],
      properties: {
        url: { type: "string" },
        title: { type: "string" },
        snippet: { type: "string" },
        relevance: { enum: ["high", "medium", "low"] },
      },
    }},
  },
}
const EXTRACT_SCHEMA = {
  type: "object", required: ["claims", "sourceQuality"],
  properties: {
    sourceQuality: { enum: ["primary", "secondary", "blog", "forum", "unreliable"] },
    publishDate: { type: "string" },
    claims: { type: "array", maxItems: 5, items: {
      type: "object", required: ["claim", "quote", "importance"],
      properties: {
        claim: { type: "string" },
        quote: { type: "string" },
        importance: { enum: ["central", "supporting", "tangential"] },
      },
    }},
  },
}
const CLUSTER_SCHEMA = {
  type: "object", required: ["clusters"],
  properties: {
    clusters: { type: "array", items: {
      type: "object", required: ["representative", "memberIndices"],
      properties: {
        representative: { type: "string" },
        memberIndices: { type: "array", items: { type: "integer" } },
      },
    }},
    conflicts: { type: "array", items: {
      type: "object", required: ["a", "b", "note"],
      properties: { a: { type: "integer" }, b: { type: "integer" }, note: { type: "string" } },
    }},
  },
}
const VERDICT_SCHEMA = {
  type: "object", required: ["verdict", "evidence", "confidence"],
  properties: {
    verdict: { enum: ["supported", "contradicted", "unsupported", "uncertain"] },
    confidence: { enum: ["high", "medium", "low"] },
    evidence: { type: "string" },
    counterSource: { type: "string" },
  },
}
const REPORT_SCHEMA = {
  type: "object", required: ["summary", "findings", "caveats"],
  properties: {
    summary: { type: "string" },
    findings: { type: "array", items: {
      type: "object", required: ["claim", "confidence", "sources", "evidence"],
      properties: {
        claim: { type: "string" },
        confidence: { enum: ["high", "medium", "low"] },
        sources: { type: "array", items: { type: "string" } },
        evidence: { type: "string" },
        vote: { type: "string" },
      },
    }},
    caveats: { type: "string" },
    openQuestions: { type: "array", items: { type: "string" } },
  },
}

// ─── Phase 0: Scope ───
phase("Scope")
if (!QUESTION) {
  return { error: "No research question provided. Pass args: {question: '<q>', today: '<YYYY-MM-DD>'} or a bare question string." }
}

async function scopeQuestion(extraContext) {
  const recencyNote = TODAY ? ("\nToday's date is " + TODAY + ". Set timeSensitive=true if the answer depends on recent developments.") : ""
  return agent(
    "Decompose this research question into complementary web search angles.\n\n" +
    "## Question\n" + QUESTION + "\n" + (extraContext || "") + "\n\n" +
    "## Task\nGenerate " + CFG.angles + " distinct search queries covering different angles " +
    "(e.g. broad/primary · academic/technical · recent · contrarian/skeptical · practitioner). " +
    "Make them specific and non-redundant." + recencyNote + "\n" +
    "Return the question, a 1-2 sentence strategy, timeSensitive, and the angles.\n\nStructured output only.",
    { label: "scope", phase: "Scope", schema: SCOPE_SCHEMA }
  )
}
const scope = await scopeQuestion()
if (!scope) { return { error: "Scope agent returned no result — cannot decompose the research question." } }
log("Q: " + QUESTION.slice(0, 80) + (QUESTION.length > 80 ? "…" : ""))
log("Angles: " + scope.angles.map(a => a.label).join(", ") + (scope.timeSensitive ? " [time-sensitive]" : ""))
const TIME_SENSITIVE = !!scope.timeSensitive && !!TODAY

// ─── Search (parallel — barrier so all results pool before global ranking) ───
const SEARCH_PROMPT = (angle) =>
  "## Web Searcher: " + angle.label + "\n\n" +
  "Research question: \"" + QUESTION + "\"\n\n" +
  "Your angle: **" + angle.label + "** — " + (angle.rationale || "") + "\n" +
  "Search query: `" + angle.query + "`\n" +
  (TIME_SENSITIVE ? "Today is " + TODAY + ". Prioritize sources from the last ~12 months.\n" : "") +
  "\n## Task\nUse WebSearch with the query (or a refined version). Return the top 4-6 results, " +
  "ranked by relevance to the ORIGINAL question. Skip SEO spam/content farms. Include a short snippet.\n\nStructured output only."

async function runSearch(angles, roundIx) {
  return (await parallel(
    angles.map(angle => () =>
      agent(SEARCH_PROMPT(angle), { label: "search:" + angle.label, phase: "Search", schema: SEARCH_SCHEMA })
        .then(r => { if (!r) return null; log(angle.label + ": " + r.results.length + " results"); return { angle: angle.label, results: r.results } })
    )
  )).filter(Boolean)
}

// ─── Allocate: global relevance rank, URL dedup, per-domain cap, fetch budget ───
function allocate(searchResults) {
  const candidates = searchResults.flatMap(sr => sr.results.map(r => ({ ...r, angle: sr.angle })))
  candidates.sort((a, b) => relRank[a.relevance] - relRank[b.relevance])
  const picked = [], dupes = [], budgetDropped = [], domainDropped = []
  const perDomain = new Map()
  for (const c of candidates) {
    const key = normURL(c.url)
    if (seen.has(key)) { dupes.push(c); continue }
    if (picked.length >= CFG.fetch) { budgetDropped.push(c); continue }
    const dom = domainOf(c.url)
    const dc = perDomain.get(dom) || 0
    if (dom && dc >= CFG.perDomain) { domainDropped.push(c); continue }
    seen.set(key, { angle: c.angle, title: c.title })
    perDomain.set(dom, dc + 1)
    picked.push(c)
  }
  if (dupes.length || budgetDropped.length || domainDropped.length) {
    log("Allocate: " + picked.length + " picked (" + dupes.length + " dup, " + domainDropped.length + " domain-capped, " + budgetDropped.length + " over-budget)")
  }
  return { picked, dupes, budgetDropped, domainDropped }
}

// ─── Fetch + extract ───
const FETCH_PROMPT = (source, angle) =>
  "## Source Extractor\n\n" +
  "Research question: \"" + QUESTION + "\"\n\n" +
  "Fetch and extract key claims from this source:\n" +
  "**URL:** " + source.url + "\n**Title:** " + source.title + "\n**Found via:** " + angle + " search\n\n" +
  "## Task\n1. Use WebFetch to retrieve the page content.\n" +
  "2. Assess source quality: primary research/institution? secondary reporting? blog/opinion? forum? unreliable?\n" +
  "3. Extract 2-5 FALSIFIABLE claims that bear on the research question. Each claim must:\n" +
  "   - be a concrete, checkable statement (not vague generalities)\n" +
  "   - include a direct quote from the source as support\n" +
  "   - be rated central/supporting/tangential to the research question\n" +
  "4. Note publish date if available.\n\n" +
  "If the fetch fails or the page is irrelevant/paywalled, return claims: [] and sourceQuality: \"unreliable\".\n\nStructured output only."

async function runFetch(picked) {
  return (await parallel(
    picked.map(source => () => {
      // A bare fetch:<host> label asserts the real fetch host, so emit it ONLY
      // when the captured host is a verbatim, complete, un-truncated, strict-ASCII
      // hostname that sanitization left untouched. Any deviation routes through
      // the quoted+ellipsis helper (preserved from v1).
      const capturedHost = String(source.url).match(URL_HOST_PATTERN)?.[1] ?? ""
      const host = capturedHost.toLowerCase()
      const cleanHost = stripLabelChars(host)
      const isCleanBareHost = cleanHost === host && host !== "" && Array.from(host).length <= LABEL_CAP && STRICT_HOST.test(host)
      const hostLabel = cleanHost === "" ? "" : isCleanBareHost ? host : quotedLabel(host)
      const sourceLabel = hostLabel || (stripLabelChars(source.title).trim() && quotedLabel(source.title)) || "unknown"
      return agent(FETCH_PROMPT(source, source.angle), { label: "fetch:" + sourceLabel, phase: "Fetch", schema: EXTRACT_SCHEMA })
        .then(ext => {
          if (!ext) return null
          return {
            url: source.url, title: source.title, angle: source.angle,
            sourceQuality: ext.sourceQuality, publishDate: ext.publishDate,
            claims: ext.claims.map(c => ({ ...c, sourceUrl: source.url, sourceQuality: ext.sourceQuality, publishDate: ext.publishDate })),
          }
        })
        .catch(e => { log("fetch failed: " + source.url + " — " + (e.message || e)); return { url: source.url, title: source.title, angle: source.angle, sourceQuality: "unreliable", claims: [] } })
    })
  )).filter(Boolean)
}

// ─── Cluster: corroboration + contradiction detection ───
async function runCluster(claims) {
  if (claims.length === 0) return { clusters: [], conflicts: [] }
  const numbered = claims.map((c, i) => "[" + i + "] " + c.claim + "  (src: " + c.sourceUrl + ", " + c.sourceQuality + ")").join("\n")
  const res = await agent(
    "## Claim Clustering\n\nResearch question: \"" + QUESTION + "\"\n\n" +
    "Below are extracted claims, each with an index. Two jobs:\n" +
    "1. CLUSTER: group claims that assert the SAME thing (paraphrases/duplicates). Each cluster has a clear representative wording and the member indices. A claim with no duplicates is its own single-member cluster.\n" +
    "2. CONFLICTS: list index pairs where two claims DIRECTLY CONTRADICT each other (not merely different — opposing), with a one-line note.\n\n" +
    "## Claims\n" + numbered + "\n\nStructured output only.",
    { label: "cluster", phase: "Cluster", schema: CLUSTER_SCHEMA }
  )
  if (!res) {
    return {
      clusters: claims.map(c => ({ representativeClaim: c.claim, members: [c], sourceUrls: [c.sourceUrl], distinctSources: 1, rep: c })),
      conflicts: [],
    }
  }
  const clusters = res.clusters.map(cl => {
    const members = cl.memberIndices.map(i => claims[i]).filter(Boolean)
    if (members.length === 0) return null
    const sourceUrls = [...new Set(members.map(m => m.sourceUrl))]
    const rep = [...members].sort((a, b) => (impRank[a.importance] - impRank[b.importance]) || (qualRank[a.sourceQuality] - qualRank[b.sourceQuality]))[0]
    return { representativeClaim: cl.representative || rep.claim, members, sourceUrls, distinctSources: sourceUrls.length, rep }
  }).filter(Boolean)
  const conflicts = (res.conflicts || []).map(cf => ({ a: claims[cf.a]?.claim, b: claims[cf.b]?.claim, note: cf.note })).filter(x => x.a && x.b)
  log("Clustered " + claims.length + " claims → " + clusters.length + " clusters, " + conflicts.length + " conflicts")
  return { clusters, conflicts }
}

// ─── Verify: diverse-lens 3-vote, confidence-not-kill, corroboration boost ───
const LENSES = [
  { key: "source-quality", instr: "Focus ONLY on source quality vs. claim strength. Is the source (primary/secondary/blog/forum) strong enough for a claim of this strength? Extraordinary claims need primary sources. If too weak, verdict=unsupported." },
  { key: "contradicting-evidence", instr: "Focus ONLY on finding a rebuttal. WebSearch aggressively for credible sources that dispute or heavily qualify this claim. If you find a solid contradiction, verdict=contradicted and put the source in counterSource." },
  { key: "logical-support", instr: "Focus ONLY on whether the supporting quote actually backs the claim. Is the claim an overreach, misread, or extrapolation beyond the quote? If the quote doesn't support it, verdict=unsupported." },
]
const VERIFY_PROMPT = (claim, lens, v) =>
  "## Claim Verifier — lens: " + lens.key + " (voter " + (v + 1) + "/" + CFG.votes + ")\n\n" +
  "Verify this claim through your assigned lens ONLY.\n\n" +
  "## Research question\n" + QUESTION + "\n\n" +
  "## Claim\n\"" + claim.claim + "\"\n" +
  "**Source:** " + claim.sourceUrl + " (" + claim.sourceQuality + ")\n" +
  "**Supporting quote:** \"" + claim.quote + "\"\n\n" +
  "## Your lens\n" + lens.instr + "\n\n" +
  "## Verdicts\n" +
  "- supported: your lens finds no problem and the claim holds.\n" +
  "- contradicted: credible evidence disputes it.\n" +
  "- unsupported: the quote doesn't back it / source too weak for the claim's strength.\n" +
  "- uncertain: you cannot determine through this lens. Use this when unsure — do NOT guess contradicted.\n\n" +
  "Evidence MUST be specific. Structured output only."

async function runVerify(clusters) {
  const reps = clusters.slice(0, CFG.verifyClaims)
  log("Verifying " + reps.length + " cluster representatives (" + clusters.length + " total)")
  const voted = (await parallel(
    reps.map(cl => () => {
      const claim = { ...cl.rep, claim: cl.representativeClaim }
      return parallel(
        LENSES.map((lens, v) => () =>
          agent(VERIFY_PROMPT(claim, lens, v), { label: "v:" + lens.key.slice(0, 6) + ":" + claim.claim.slice(0, 30), phase: "Verify", schema: VERDICT_SCHEMA })
        )
      ).then(verdicts => {
        const valid = verdicts.filter(Boolean)
        const kills = valid.filter(x => x.verdict === "contradicted" || x.verdict === "unsupported").length
        const supports = valid.filter(x => x.verdict === "supported").length
        const errored = CFG.votes - valid.length
        const isRefuted = kills >= CFG.refuteQuorum
        const survives = valid.length >= CFG.refuteQuorum && !isRefuted
        let conf = "low"
        if (supports >= 2) conf = "medium"
        if (supports === valid.length && valid.length >= CFG.refuteQuorum) conf = "high"
        if (cl.distinctSources >= 2 && conf === "low") conf = "medium"
        if (cl.distinctSources >= 3 && conf === "medium") conf = "high"
        const best = valid.filter(x => x.verdict === "supported").sort((a, b) => confRank[a.confidence] - confRank[b.confidence])[0]
        const mark = survives ? "✓" : isRefuted ? "✗" : "?"
        log("\"" + claim.claim.slice(0, 48) + "…\": " + supports + "s/" + kills + "k" + (errored ? " (" + errored + " err)" : "") + " " + mark)
        return {
          claim: claim.claim, quote: cl.rep.quote, sourceUrls: cl.sourceUrls, distinctSources: cl.distinctSources,
          sourceQuality: cl.rep.sourceQuality, confidence: conf, evidence: best ? best.evidence : (valid[0]?.evidence || ""),
          supports, kills, errored, vote: supports + "-" + kills, survives, isRefuted,
        }
      })
    })
  )).filter(Boolean)
  return {
    confirmed: voted.filter(c => c.survives),
    killed: voted.filter(c => c.isRefuted),
    unverified: voted.filter(c => !c.survives && !c.isRefuted),
  }
}

// ─── One full round: Search → Allocate → Fetch → Cluster → Verify ───
async function runRound(angles, roundIx) {
  const searchResults = await runSearch(angles, roundIx)
  const alloc = allocate(searchResults)
  const sources = await runFetch(alloc.picked)
  const claims = sources.flatMap(s => s.claims)
  const ranked = [...claims]
    .sort((a, b) => (impRank[a.importance] - impRank[b.importance]) || (qualRank[a.sourceQuality] - qualRank[b.sourceQuality]))
    .slice(0, CFG.verifyClaims)
  const { clusters, conflicts } = await runCluster(ranked)
  phase("Verify")
  const verified = clusters.length ? await runVerify(clusters) : { confirmed: [], killed: [], unverified: [] }
  return {
    sources, claimsCount: claims.length,
    confirmed: verified.confirmed, killed: verified.killed, unverified: verified.unverified, conflicts,
    dropped: { dupes: alloc.dupes.length, domainDropped: alloc.domainDropped.length, budgetDropped: alloc.budgetDropped.length },
  }
}

// ─── Gap-finder: propose new angles from unresolved gaps ───
async function findGapAngles(confirmed, unverified, conflicts) {
  const lowConf = confirmed.filter(c => c.confidence === "low").map(c => c.claim)
  const gapLines = [
    conflicts.length ? "Unresolved conflicts:\n" + conflicts.map(c => "- " + c.a + " VS " + c.b).join("\n") : "",
    lowConf.length ? "Low-confidence findings needing corroboration:\n" + lowConf.map(c => "- " + c).join("\n") : "",
    unverified.length ? "Could not verify:\n" + unverified.map(c => "- " + c.claim).join("\n") : "",
  ].filter(Boolean).join("\n\n")
  if (!gapLines) return []
  const alreadyTried = scope.angles.map(a => a.query).join(" | ")
  const s = await scopeQuestion(
    "\n\n## This is round 2. Round 1 left these gaps — target them with NEW angles that dig deeper or corroborate, avoiding queries already tried (" + alreadyTried + "):\n" + gapLines
  )
  return s ? s.angles : []
}

// ─── Round controller ───
const allSources = [], allConfirmed = [], allKilled = [], allUnverified = [], allConflicts = []
let totalClaims = 0
const totalDropped = { dupes: 0, domainDropped: 0, budgetDropped: 0 }
let angles = scope.angles
let roundsRun = 0
for (let roundIx = 0; roundIx < CFG.rounds; roundIx++) {
  if (roundIx > 0) {
    if (brakeEngaged()) { log("Budget brake engaged — skipping round " + (roundIx + 1)); break }
    angles = await findGapAngles(allConfirmed, allUnverified, allConflicts)
    if (angles.length === 0) { log("No gaps to pursue — stopping after round " + roundIx); break }
    log("Round " + (roundIx + 1) + ": " + angles.length + " gap-targeted angles")
  }
  roundsRun++
  const r = await runRound(angles, roundIx)
  allSources.push(...r.sources); allConfirmed.push(...r.confirmed); allKilled.push(...r.killed)
  allUnverified.push(...r.unverified); allConflicts.push(...r.conflicts)
  totalClaims += r.claimsCount
  totalDropped.dupes += r.dropped.dupes; totalDropped.domainDropped += r.dropped.domainDropped; totalDropped.budgetDropped += r.dropped.budgetDropped
}
log("Rounds done: " + allConfirmed.length + " confirmed, " + allKilled.length + " refuted, " + allUnverified.length + " unverified, " + allConflicts.length + " conflicts")

// ─── No-confirmed exits (preserve infra-vs-merit distinction) ───
const slugBase = QUESTION.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 50) || "untitled"
const suggestedFilename = "RESEARCH-" + slugBase + (TODAY ? "-" + TODAY : "") + ".md"

if (allConfirmed.length === 0) {
  let summary
  if (allKilled.length === 0 && allUnverified.length > 0) {
    summary = "Could not verify any claims — all verifier panels failed (likely rate-limiting/API errors). Infrastructure failure, not a research finding. Retry."
  } else if (allUnverified.length > 0) {
    summary = allKilled.length + " claims refuted; " + allUnverified.length + " unverifiable (verifier errors). No claims survived — inconclusive."
  } else {
    summary = "All " + allKilled.length + " claims refuted by adversarial verification. Inconclusive — sources weak or claims overstated."
  }
  const md = "# Research: " + QUESTION + "\n\n_" + summary + "_\n"
  return {
    question: QUESTION, summary, findings: [], conflicts: allConflicts,
    refuted: allKilled.map(c => ({ claim: c.claim, vote: c.vote, sources: c.sourceUrls })),
    unverified: allUnverified.map(c => ({ claim: c.claim, sources: c.sourceUrls })),
    sources: allSources.map(s => ({ url: s.url, quality: s.sourceQuality })),
    reportMarkdown: md, suggestedFilename,
    stats: { sources: allSources.length, claims: totalClaims, confirmed: 0, killed: allKilled.length, unverified: allUnverified.length },
  }
}

// ─── Synthesize ───
phase("Synthesize")
const block = allConfirmed.map((c, i) =>
  "### [" + i + "] " + c.claim + "\n" +
  "Confidence: " + c.confidence + " · Vote: " + c.vote + " · Sources (" + c.distinctSources + "): " + c.sourceUrls.join(", ") + "\n" +
  "Quote: \"" + c.quote + "\"\nEvidence: " + c.evidence + "\n"
).join("\n")
const conflictBlock = allConflicts.length ? "\n## Conflicting evidence found\n" + allConflicts.map(c => "- \"" + c.a + "\" VS \"" + c.b + "\" — " + c.note).join("\n") : ""
const killedBlock = allKilled.length ? "\n## Refuted (transparency)\n" + allKilled.map(c => "- \"" + c.claim + "\" (vote " + c.vote + ")").join("\n") : ""
const unverifiedBlock = allUnverified.length ? "\n## Unverified (verifier errors)\n" + allUnverified.map(c => "- \"" + c.claim + "\"").join("\n") : ""

const report = await agent(
  "## Synthesis: research report\n\n**Question:** " + QUESTION + "\n\n" +
  allConfirmed.length + " claims survived diverse-lens verification. Merge semantic duplicates and synthesize.\n\n" +
  "## Confirmed claims\n" + block + conflictBlock + killedBlock + unverifiedBlock + "\n\n" +
  "## Instructions\n" +
  "1. Merge claims that say the same thing; combine their sources.\n" +
  "2. Group into coherent findings, each addressing the question. Preserve the given confidence unless merging changes it.\n" +
  "3. Write a 3-5 sentence executive summary answering the question.\n" +
  "4. Note caveats (weak sources, time-sensitivity" + (allConflicts.length ? ", the conflicts above" : "") + ").\n" +
  "5. List 2-4 open questions.\n\nStructured output only.",
  { label: "synthesize", phase: "Synthesize", schema: REPORT_SCHEMA }
)

if (!report) {
  const md = "# Research: " + QUESTION + "\n\n_Synthesis step failed — " + allConfirmed.length + " verified claims returned unmerged._\n\n" +
    allConfirmed.map(c => "- **[" + c.confidence + "]** " + c.claim + " (" + c.sourceUrls.join(", ") + ")").join("\n") + "\n"
  return {
    question: QUESTION, summary: "Synthesis failed — verified claims unmerged.", findings: [],
    confirmed: allConfirmed.map(c => ({ claim: c.claim, confidence: c.confidence, sources: c.sourceUrls })),
    conflicts: allConflicts, reportMarkdown: md, suggestedFilename,
    stats: { sources: allSources.length, claims: totalClaims, confirmed: allConfirmed.length, killed: allKilled.length, unverified: allUnverified.length },
  }
}

// ─── Deterministic report-markdown assembly ───
function assembleMarkdown(rep) {
  const L = []
  L.push("# Research: " + QUESTION)
  if (TODAY) L.push("\n_" + TODAY + "_")
  L.push("\n## Summary\n" + rep.summary)
  L.push("\n## Findings")
  rep.findings.forEach((f, i) => {
    L.push("\n### " + (i + 1) + ". " + f.claim)
    L.push("**Confidence:** " + f.confidence)
    if (f.sources && f.sources.length) L.push("**Sources:** " + f.sources.map(s => "<" + s + ">").join(", "))
    if (f.evidence) L.push("\n" + f.evidence)
  })
  if (allConflicts.length) { L.push("\n## Conflicting evidence"); allConflicts.forEach(c => L.push("- \"" + c.a + "\" **vs** \"" + c.b + "\" — " + c.note)) }
  if (rep.caveats) L.push("\n## Caveats\n" + rep.caveats)
  if (rep.openQuestions && rep.openQuestions.length) { L.push("\n## Open questions"); rep.openQuestions.forEach(q => L.push("- " + q)) }
  if (allKilled.length) { L.push("\n## Refuted claims (transparency)"); allKilled.forEach(c => L.push("- \"" + c.claim + "\" (vote " + c.vote + ")")) }
  if (allUnverified.length) { L.push("\n## Unverified (verifier errors)"); allUnverified.forEach(c => L.push("- \"" + c.claim + "\"")) }
  L.push("\n## Sources")
  const uniqSources = [...new Map(allSources.map(s => [s.url, s])).values()]
  uniqSources.forEach(s => L.push("- <" + s.url + "> (" + s.sourceQuality + ")"))
  L.push("\n---\n_Generated by deep-research v2 · " + rep.findings.length + " findings from " + uniqSources.length + " sources._")
  return L.join("\n")
}

const reportMarkdown = assembleMarkdown(report)
return {
  question: QUESTION,
  ...report,
  conflicts: allConflicts,
  refuted: allKilled.map(c => ({ claim: c.claim, vote: c.vote, sources: c.sourceUrls })),
  unverified: allUnverified.map(c => ({ claim: c.claim, sources: c.sourceUrls })),
  sources: [...new Map(allSources.map(s => [s.url, s])).values()].map(s => ({ url: s.url, quality: s.sourceQuality, angle: s.angle })),
  reportMarkdown, suggestedFilename,
  stats: {
    rounds: roundsRun, sourcesFetched: allSources.length, claimsExtracted: totalClaims,
    confirmed: allConfirmed.length, killed: allKilled.length, unverified: allUnverified.length,
    conflicts: allConflicts.length, findings: report.findings.length,
    dupes: totalDropped.dupes, domainDropped: totalDropped.domainDropped, budgetDropped: totalDropped.budgetDropped,
  },
}

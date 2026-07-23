# Feature Specification: Guardrails — Program Metrics + Compliance Checks (G6)

**Feature Branch**: `017-guardrails`
**Created**: 2026-07-23
**Status**: Draft (loop-ready)

**Input**: G6 in `docs/prd/passionApps.md` — the "honesty layer": **program-level metrics (never kid-facing)** + **automated guardrail-compliance checks** that keep the discovery pipeline from silently violating its own invariants. A headless **domain package** reads the merged discovery-spine artifacts (the 014 `Roster` of per-kid 013 stores, built from 011/012) and produces (a) aggregate `ProgramMetrics` and (b) a `ComplianceReport` that flags any violation of the locked rules (no scalar score/label, prompted ≠ voluntary, novelty discounted, no auto-promotion, no demote-on-silence, no gamification). Grounding: `docs/prd/hardening/measurement-validity.md` §5 (watch the self-fulfilling loop via **coverage-breadth + reopen-rate**, "G6"), and the "Decisions Already Made" in specs 011/012/013 (never a scalar/label; voluntary vs prompted; novelty discounted; human-owned promotions; never demote on silence).

> **Loop-ready note.** One headless **domain package** `@gt100k/guardrails` on the `pnpm exec tsc -b` + `pnpm test` gate, plus a tiny **CLI** (`tsx`) that prints the report over the 014 pilot roster. **No app, no network.** Imports `@gt100k/{hypothesis-store,interest-inference,student-profile}` by name → **`pnpm install` (not `--frozen`)**. **Parallel-safe with 015 (concierge) + 016 (wellbeing):** entirely new files under `passion/packages/guardrails` + a root `tsconfig.json` append (trivial merge); depends only on **merged** packages (011/013/014), never on the in-flight 015/016. **SYNTHETIC ONLY / aggregate — never kid-facing output.**

---

## 1. Why & where it sits
The pipeline has strong per-feature invariants but nothing that *watches the whole system stay honest* over time. G6 is that watcher: it turns the locked rules into **executable checks** (so a regression that leaks a scalar score or auto-promotes a hypothesis is caught, not shipped) and it surfaces the **program-level health** signals the measurement-validity spec calls for (coverage breadth + reopen rate to watch the self-fulfilling-loop risk; the lifecycle funnel + calibration rate to see whether discovery is working). It is **distinct from G5** (calibration/validation, later): G6 measures *whether the pipeline works and stays honest*, not the model's accuracy.

## 2. Scope Fence *(hard)*

### In scope
- **Domain package** `@gt100k/guardrails` (`passion/packages/guardrails`):
  - **`programMetrics(roster)`** → `ProgramMetrics` (lifecycle funnel, coverage-breadth, calibration / "not-sure-yet" rate, reopen rate) — aggregate over the 014 `Roster`;
  - **`checkCompliance(roster)`** → `ComplianceReport` (each locked rule as a check → `ok` + any `Violation`s);
  - the `ProgramMetrics` / `ComplianceReport` / `CheckResult` / `Violation` types + constants;
  - a **CLI** `scripts/report.ts` that runs both over the 014 pilot roster and prints a readable report (opt-in; also the demo).
- Synthetic fixtures (a clean roster → zero violations; injected-violation rosters) + tests mirroring every FR/SC.

### Out of scope
- **Model accuracy / calibration / cold-start / tag-quality** — that's **G5** (a later package); G6 only reports the *confidence/coverage* aggregates it can already see.
- **Concierge (015) + wellbeing (016) compliance** — added in a later slice once those land (keeps this build off the in-flight packages).
- **A dashboard UI** — G6 emits data + a CLI report; the (never-kid-facing) dashboard is later.
- **Any kid-facing output** — everything here is aggregate/program-level.
- **Fixing violations** — G6 detects; the owning package fixes.

## 3. Domain model *(decisions already made — do not re-open)*

### 3.1 Types
```
ProgramMetrics {
  kids: number;
  funnel: Record<Lifecycle, number>;                 // counts across all kids' hypotheses
  coverage: { avgDomainsPerKid: number; pctKidsCoveragePass: number }; // coverage pass = ≥ COVERAGE_MIN_DOMAINS domains sampled
  calibration: { confidentRate: number; notSureYetRate: number };      // notSureYet = EXPLORING & !confident
  reopenRate: number;                                 // fraction of hypotheses whose history includes a REOPENED transition
}
CheckResult { id: string; name: string; ok: boolean; detail: string }
Violation   { checkId: string; kidId?: string; cellKey?: string; message: string }
ComplianceReport { ok: boolean; checks: readonly CheckResult[]; violations: readonly Violation[] }
```
`Lifecycle` is imported from `@gt100k/hypothesis-store`. `Roster` from `@gt100k/student-profile`.

### 3.2 The guardrail checks (each = one locked rule → executable)
- **GC1 — no scalar score / fixed label.** No hypothesis / evidence object carries a key in `{score, rating, passionScore, label}`; supporting and disconfirming remain **separate arrays** (never a single summed number). *(spec 011/013 D4.)*
- **GC2 — prompted ≠ voluntary.** No hypothesis's `evidence.supporting` contains `prompted_return` (a prompted return is weak/disconfirming, never counted as a voluntary return). *(011 posterior.)*
- **GC3 — novelty discounted.** No `evidence.supporting` entry is a raw novelty/first-exposure marker; confidence is never attributable to a novelty-only signal. *(012/011.)*
- **GC4 — no auto-promotion.** Every hypothesis in `CANDIDATE` or `ACTIVE` has a `history` entry transitioning **into** that state by a **human actor** (role not `MODEL`/`SYSTEM`). *(013 D1/D2.)*
- **GC5 — no demote on silence.** No `history` entry transitions `EMERGING → EXPLORING`. *(013 D3.)*
- **GC6 — no gamification.** No artifact carries a field named `streak|points|reward|xp|badge|leaderboard`. *(016 / burnout guardrail #1.)*
Each check returns a `CheckResult` and pushes `Violation`s; `report.ok = checks.every(ok)`.

### 3.3 The metrics (aggregate, never kid-facing)
- **funnel** — count hypotheses by `Lifecycle` across the roster.
- **coverage-breadth** — per kid, distinct `domainPath[0]` sampled; `avgDomainsPerKid` + `pctKidsCoveragePass` (≥ `COVERAGE_MIN_DOMAINS`). *(self-fulfilling-loop watch.)*
- **calibration** — `confidentRate` = confident / total; `notSureYetRate` = (EXPLORING & !confident) / total. *("not sure yet" is a real state.)*
- **reopenRate** — hypotheses whose `history` includes a `REOPENED` transition / total. *(self-fulfilling-loop watch.)*

### 3.4 Constants (golden)
| Name | Value | Meaning |
|---|---|---|
| `COVERAGE_MIN_DOMAINS` | `6` | domains a kid should sample for the coverage pass |
| `GAMIFICATION_KEYS` | `["streak","points","reward","xp","badge","leaderboard"]` | banned field names (GC6) |
| `SCALAR_KEYS` | `["score","rating","passionScore","label"]` | banned scalar/label field names (GC1) |

## 4. Phasing (P0…P4)
- **P0** — scaffold `@gt100k/guardrails`; types + constants; smoke test.
- **P1** — `programMetrics(roster)` (funnel, coverage, calibration, reopen). Golden over the 014 pilot roster.
- **P2** — `checkCompliance(roster)` (GC1–GC6). *(Core.)* Golden: clean roster → `ok:true`; injected-violation rosters → each check flags exactly its violation.
- **P3** — the CLI `scripts/report.ts` (metrics + report over `buildPilotRoster`), runnable via `tsx`.
- **P4** — a repo "honesty" test that runs `checkCompliance(buildPilotRoster(...))` and asserts **zero violations** (a standing regression guard on the real pilot data).

## 5. Success Criteria *(each maps to a test)*
- **SC-1** `programMetrics` over the 014 pilot roster returns the expected funnel counts, `avgDomainsPerKid`, `confidentRate`, and `reopenRate` — golden test.
- **SC-2** `checkCompliance` on the clean pilot roster → `ok:true`, no violations — golden test.
- **SC-3** GC4: a roster with a `CANDIDATE`/`ACTIVE` hypothesis lacking a human promote in `history` → GC4 fails with a `Violation` naming the kid+cell — test.
- **SC-4** GC1: an artifact carrying a `score`/`label` field → GC1 fails — test.
- **SC-5** GC2: a hypothesis with `prompted_return` in `supporting` → GC2 fails — test.
- **SC-6** GC5: a `history` with `EMERGING→EXPLORING` → GC5 fails — test.
- **SC-7** GC6: an artifact with a `streak`/`points` field → GC6 fails — test.
- **SC-8** determinism: same roster → same `ProgramMetrics` + `ComplianceReport` — test.
- **SC-9** gate green: `pnpm exec tsc -b` + `pnpm test`; the CLI runs headless (no network) and prints a report.

## 6. Golden Values *(exact)*
Fixtures in `src/__fixtures__/`: (a) the 014 `buildPilotRoster(PILOT_NOW)` as the clean roster → assert the exact funnel counts + `avgDomainsPerKid` + `confidentRate` + `reopenRate` and `checkCompliance.ok === true`; (b) small **injected-violation** rosters — one per check (auto-promoted CANDIDATE with no human history; an object with a `score` field; `prompted_return` in supporting; an `EMERGING→EXPLORING` history; a `streak` field) → assert exactly that check fails and the others pass. Reuse `@gt100k/student-profile`'s fixtures for the clean roster.

## 7. Decisions Already Made
- **[D1]** G6 is **program-level + aggregate**; **never kid-facing**; distinct from G5 (calibration).
- **[D2]** Each locked rule is an **executable check** (GC1–GC6); a standing test asserts the real pilot roster is clean (P4).
- **[D3]** Metrics include **coverage-breadth + reopen-rate** (the self-fulfilling-loop watch) + funnel + calibration rate.
- **[D4]** First slice covers the **merged discovery spine only** (011/012/013/014); concierge/wellbeing checks come later (keeps it off the in-flight packages).
- **[D5]** Headless + a CLI; no dashboard app yet; no network. SYNTHETIC ONLY.
- **[D6]** Imports workspace packages by name → `pnpm install` (not frozen).

## 8. Defaults for the Unspecified
Simplest correct option; record in `.loop/decisions.md`; continue. Escalate `critical` only if a choice would invalidate an SC.

## 9. Loop notes
- **Domain package:** headless, `LOOP_QA` N/A, gate = `tsc -b` + `test`; the CLI is opt-in (`pnpm exec tsx passion/packages/guardrails/scripts/report.ts`).
- **Requires `pnpm install`** (not `--frozen`) — imports `@gt100k/hypothesis-store`, `@gt100k/interest-inference`, `@gt100k/student-profile`.
- **Parallel-safe with 015 + 016:** only new files under `passion/packages/guardrails` + a root `tsconfig.json` append; depends solely on merged packages. If 015/016 merge first, `gh pr update-branch` before merge (the root append is the only conflict, trivial).

## 10. Stack + Commands (pinned)
- Domain `passion/packages/guardrails` (`@gt100k/guardrails`), deps `@gt100k/hypothesis-store`, `@gt100k/interest-inference`, `@gt100k/student-profile`.
- Gate: `pnpm exec tsc -b` + `pnpm test`; CLI via `tsx` (no network).
- TS strict (`noUncheckedIndexedAccess`, `verbatimModuleSyntax`, `composite`); vitest.

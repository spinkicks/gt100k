# Feature Specification: Interest Inference Engine

**Feature Branch**: `011-interest-inference`
**Created**: 2026-07-22
**Status**: Draft (loop-ready)

**Input**: The "brain" of discovery (`C3` in `docs/prd/passionApps.md`). It turns a stream of per-`(domain × work-mode)` behavioral events into a **calibrated belief per cell** that the cell is a genuine, durable interest, ranks the top **1–3 candidate spikes**, separates **topic-love from style-love**, and honestly reports **"not sure yet"** when evidence is thin — **never a scalar "passion score" or a fixed label**. It uses a closed-form **Beta-Bernoulli** model with **no training data** (principled priors now; a learned model later). Grounding: `docs/prd/engines/C3-inference.md`, `DISCOVERY-APP-PRD.md` §6, `docs/research/passion-pipeline/hardening/06-measurement-validity-coldstart.md`, `passion/CONTEXT.md`.

> **Loop-ready note (read first).** Built by a loop whose gate is `pnpm exec tsc -b` + `pnpm test`. **No LLM, no network, no external dependency** — a pure deterministic math package, the most loop-safe of the set. **No served app → `LOOP_QA` N/A.** **SYNTHETIC ONLY.** Pre-answers decisions, pins the stack, and gives **exact golden numbers** (hand-verified) as acceptance targets.

---

## 1. Why & where it sits
`009-two-axis-tagging` produces `ActionEvent`s tagged per `(domain × work-mode)` cell. This engine consumes an equivalent event stream and produces the **InterestRead** the guide console + hypothesis store (`C4`) act on. It is **downstream** of `009` but **built independently**: it declares its own **structural input contract** (`CellEvent`) so it neither imports nor blocks on `009`. A thin mapping from `009`'s `ActionEvent` → `CellEvent` is a later wiring step (out of scope here).

---

## 2. Scope Fence *(hard)*

### In scope
- A **pure TypeScript domain package** `@gt100k/interest-inference` (`passion/packages/interest-inference`):
  - the `CellEvent` input contract + `DomainPrior` priors;
  - the **Beta-Bernoulli per-cell model**: prior construction, evidence updates (with recency weighting, novelty exclusion, voluntary-vs-prompted, missingness-as-missing), posterior mean/sd/lower-bound, evidence-mass + confidence ("not sure yet");
  - **candidate ranking** (top 1–3 by conservative lower bound above a threshold);
  - **topic-vs-style attribution** via rank-1 marginal decomposition (domain-marginal vs mode-marginal);
  - the **InterestRead** output (per-cell beliefs + reasons + ranked candidates), never a scalar.
- **Seed fixtures** + a headless `demo` script (synthetic event stream → printed InterestRead).
- **Tests** mirroring every FR/SC, incl. **golden numeric values** (hand-verified to ±0.001).

### Out of scope
- **Event capture / the `ActionEvent`→`CellEvent` mapping** (that is `009`/`C1` wiring).
- **The hypothesis lifecycle + human authoring** (`EXPLORING→…→ACTIVE`, promote/park) — that is `C4`. This engine emits beliefs + a `confident` flag + candidates; `C4` maps them to lifecycle and a human owns promotion.
- **A learned/low-rank ML model** — deferred; this ships the principled closed-form model. The marginal decomposition is an explicit **rank-1 proxy** for the eventual learned factorization.
- **Any UI.**

---

## 3. Domain model *(decisions already made — do not re-open)*

### 3.1 Inputs
```
DomainPrior {
  domain: string;            // cabin id (coarse)
  inEnvironment: boolean;    // domain appears in the child's environment inventory
  aptitudeTilt: number;      // [0,1] from TimeBack achievement tilt (0 if N/A)
  discretionaryTilt: number; // [0,1] from discretionary-XP allocation (0 if N/A)
}

CellEvent {
  domainPath: readonly [string] | readonly [string, string]; // [cabin] or [cabin, subTopic]
  mode: string;              // a work-mode verb
  kind: "voluntary_return" | "prompted_return" | "unrequired_revision"
      | "chosen_challenge" | "failure_recovery" | "self_authored_scope"
      | "artifact_competence" | "skip";
  magnitude: number;         // [0,1] — depth for returns, strength for depth families, 1 for skip
  novelty: boolean;          // true = first-exposure / novelty window → excluded from belief
  timestamp: string;         // ISO-8601
}
```
A cell is keyed by `serializeCellKey(domainPath, mode)` = `"<cabin>[/<subTopic>]::<mode>"`.

### 3.2 Constants (golden)
| Name | Value | Meaning |
|---|---|---|
| `ALPHA0`, `BETA0` | `1`, `1` | uniform base prior Beta(1,1) |
| `W_ENV` | `0.5` | prior α bonus if `inEnvironment` |
| `W_APT` | `0.5` | prior α bonus × `aptitudeTilt` |
| `W_XP` | `0.5` | prior α bonus × `discretionaryTilt` |
| `A_RETURN` | `1.0` | α per voluntary_return × magnitude × recency |
| `A_DEPTH` | `0.5` | α per depth-family signal × magnitude × recency |
| `B_SKIP` | `0.5` | β per non-novel `skip` × recency |
| `HALFLIFE_DAYS` | `14` | recency half-life: weight = `0.5^(ageDays/14)` |
| `MIN_EVIDENCE_MASS` | `3` | min non-prior mass to be `confident` |
| `MAX_CI_WIDTH` | `0.35` | max `2·sd` to be `confident` |
| `K_LCB` | `1.0` | lower bound = `mean − K_LCB·sd` |
| `SPIKE_THRESHOLD` | `0.6` | min lower bound to be a candidate |
| `MAX_CANDIDATES` | `3` | cap on ranked candidates |
| `ATTR_MARGIN` | `0.1` | marginal gap needed to attribute topic vs style |

Depth families (each adds α via `A_DEPTH`): `unrequired_revision, chosen_challenge, failure_recovery, self_authored_scope, artifact_competence`.

### 3.3 The model (exact formulas)
Prior per cell (its domain's `DomainPrior`, default all-zero/false if absent):
```
alpha_prior = ALPHA0 + (inEnvironment ? W_ENV : 0) + W_APT*aptitudeTilt + W_XP*discretionaryTilt
beta_prior  = BETA0
```
Evidence update, per event (recency `w = 0.5^(ageDays/HALFLIFE_DAYS)`, `ageDays = max(0,(now - timestamp)/86400000)`):
- `novelty === true` → **excluded** (contributes nothing; novelty is triggered situational interest).
- `voluntary_return` → `alpha += A_RETURN * magnitude * w`.
- any depth family → `alpha += A_DEPTH * magnitude * w`.
- `prompted_return` → **excluded** (only voluntary return counts).
- `skip` (non-novel) → `beta += B_SKIP * w`.
- (no event / silence) → **no update** (missingness ≠ disinterest).

Posterior:
```
alpha = alpha_prior + Σ(positive), beta = beta_prior + Σ(negative)
mean  = alpha / (alpha + beta)
var   = (alpha*beta) / ((alpha+beta)^2 * (alpha+beta+1)); sd = sqrt(var)
lowerBound = max(0, mean - K_LCB*sd)
evidenceMass = (alpha - alpha_prior) + (beta - beta_prior)
confident = evidenceMass >= MIN_EVIDENCE_MASS && (2*sd) <= MAX_CI_WIDTH
```
Candidates: cells that are `confident` **and** `lowerBound >= SPIKE_THRESHOLD`, ranked by `lowerBound` desc (ties by cell key asc), capped at `MAX_CANDIDATES`.

Attribution (rank-1 marginal decomposition), for the candidate cells. Marginals are a **per-cell mean grouped by axis value**, where the domain axis is the **cabin** (`domainPath[0]`, coarse):
```
domainMarginal(d) = mean of mean(cell) over ALL cells whose cabin (domainPath[0]) == d
modeMarginal(m)   = mean of mean(cell) over ALL cells whose mode == m
attribution(d,m) = "domain" if domainMarginal(d) - modeMarginal(m) >  ATTR_MARGIN
                 = "style"  if modeMarginal(m)   - domainMarginal(d) >  ATTR_MARGIN
                 = "mixed"  otherwise
```
`domain` attribution ⇒ topic-loyalist; `style` ⇒ maker (mode travels across topics). Note: grouping is by **cabin**, so multiple sub-topics under one cabin that share a mode are averaged together into that cabin's `domainMarginal` (a cabin-loyal child reads as `domain` across their sub-topics). This is an explicit rank-1 proxy for the eventual learned low-rank factorization.

Reasons: `supporting` = the event kinds contributing the most positive α (descending); `disconfirming` = counts of `skip` and `prompted_return`.

### 3.4 Output
```
CellBelief { cellKey, domainPath, mode, alpha, beta, mean, sd, lowerBound, evidenceMass,
             confident, attribution: "domain"|"style"|"mixed"|null, supporting: string[], disconfirming: string[] }
Candidate  { cellKey, domainPath, mode, lowerBound, attribution }
InterestRead { cells: CellBelief[]; candidates: Candidate[] }  // never a scalar/label
```
`attribution` is `null` for non-candidate cells (only computed for candidates). Language downstream is "current evidence suggests… / next test is…", never "you are an X".

---

## 4. Phasing (P0…P4)
- **P0** — types (`CellEvent`, `DomainPrior`, outputs) + constants + `serializeCellKey` + recency weight. Unit tests + golden constants.
- **P1** — per-cell Beta-Bernoulli: prior construction + evidence folding (exclusions, recency) → `alpha/beta`. Golden. *(Core.)*
- **P2** — posterior stats (mean/sd/lowerBound/evidenceMass/confident) + reasons. Golden numeric.
- **P3** — aggregation across cells: ranking (candidates) + marginal-decomposition attribution. Golden.
- **P4** — `runInference(events, priors, now)` orchestrator + `demo` + README.

## 5. Success Criteria *(each maps to a test)*
- **SC-1** constants + `serializeCellKey` + recency weight match golden (`0.5^(14/14)=0.5`, `age0→1`) — unit test.
- **SC-2** prior construction: `inEnvironment` + tilts add the exact α bonuses; `beta_prior=1` — unit test.
- **SC-3** evidence folding excludes `novelty` and `prompted_return`, adds α for returns+depth, β for skips, ignores silence — unit test.
- **SC-4** the **golden cell** (see §6) yields `mean≈0.7857`, `sd≈0.14507`, `lowerBound≈0.64064`, `evidenceMass=4.5`, `confident=true` (±0.001) — golden test.
- **SC-5** a thin cell (evidenceMass `< 3` or `2·sd > 0.35`) has `confident=false` and is excluded from candidates — unit test.
- **SC-6** candidate ranking = confident ∧ `lowerBound ≥ 0.6`, sorted desc, capped at 3, ties by key — unit test.
- **SC-7** attribution: the **maker fixture** yields `"style"` for the build cells; the **loyalist fixture** yields `"domain"` for the audio cells (§6) — golden test.
- **SC-8** `runInference` on a synthetic multi-cell stream returns a well-formed `InterestRead` (no scalar; candidates ⊆ cells; attribution only on candidates) — unit test.
- **SC-9** gate green: `pnpm exec tsc -b` + `pnpm test`.

## 6. Golden Values *(exact, hand-verified)*
**Golden cell** `music-sound/audio-systems::build`, `now = event time` (recency = 1):
- Prior: `inEnvironment=true`, tilts 0 → `alpha_prior = 1 + 0.5 = 1.5`, `beta_prior = 1.0`.
- Events: 3× `voluntary_return` (mag 1.0) → `+3.0`; 2× depth (`unrequired_revision` mag 1.0, `artifact_competence` mag 1.0) → `+1.0`; 1× `skip` → `β +0.5`; 2× novelty returns → excluded.
- Posterior: `alpha=5.5`, `beta=1.5`; `mean=5.5/7=0.785714`; `var=8.25/392=0.0210459`, `sd=0.145072`; `lowerBound=0.640642`; `evidenceMass=4.0+0.5=4.5`; `2·sd=0.290=≤0.35` and `4.5≥3` → `confident=true`; `lowerBound≥0.6` → candidate.

**Maker fixture** (2 domains × 2 modes; means): `(audio,build)=0.8, (gamedev,build)=0.8, (audio,perform)=0.4, (gamedev,perform)=0.35` → `modeMarginal(build)=0.8`, `domainMarginal(audio)=0.6` → `attribution(audio,build)="style"` (0.8−0.6=0.2 > 0.1). (Provide these as pre-set means to test attribution in isolation.)

**Loyalist fixture**: `(audio,build)=0.8, (audio,perform)=0.8, (gamedev,build)=0.4, (gamedev,perform)=0.35` → `domainMarginal(audio)=0.8`, `modeMarginal(build)=0.6` → `attribution(audio,build)="domain"`.

A `src/__fixtures__/` file provides: the golden-cell event list + expected stats, and the two attribution grids + expected labels.

## 7. Decisions Already Made
- **[D1]** Beta-Bernoulli per cell; conjugate closed-form; deterministic; no training.
- **[D2]** Voluntary-only (prompted excluded); novelty excluded; missingness = no update; `skip` is the only disconfirming signal.
- **[D3]** Recency via 14-day half-life; recent evidence weighted more (trajectory).
- **[D4]** Confidence = evidence-mass + interval-width gate → honest "not sure yet"; rank by conservative lower bound.
- **[D5]** Topic-vs-style via rank-1 marginal decomposition (explicit proxy for a later learned low-rank factorization).
- **[D6]** Output = per-cell beliefs + reasons + ranked candidates; **never a scalar or a fixed label**.
- **[D7]** Own structural `CellEvent` input contract (decoupled from `009`).
- **[D8]** Pinned stack: TypeScript / vitest; pnpm monorepo; `passion/packages/interest-inference`; no deps, no network, no LLM.
- **[D9]** SYNTHETIC ONLY.

## 8. Defaults for the Unspecified
For anything unspecified, choose the simplest correct option, record it in `.loop/decisions.md`, and continue. Escalate `critical` only if a choice would invalidate an SC.

## 9. Loop notes
- **No served app** → `LOOP_QA` N/A; DoD = `pnpm exec tsc -b` + `pnpm test`.
- **No network, no LLM, no external dependency**; fully offline + deterministic. All floating-point assertions use `toBeCloseTo(…, 3)`.
- **In-lane**: new files under `passion/packages/interest-inference` + one line in root `tsconfig.json` references. Parallel-safe with `009`/`010` (disjoint files; shared only the one-line tsconfig references append).

## 10. Stack + Commands (pinned)
- pnpm monorepo. Domain `passion/packages/interest-inference` (`@gt100k/interest-inference`). No adapters (no external I/O).
- Gate: `pnpm exec tsc -b` + `pnpm test`.
- Add the package to root `tsconfig.json` references (final task). `vitest.config.ts` already globs `passion/packages/**/test/**`.

# @gt100k/concierge

`015`. A child asks a question in their own words and gets back an answer with its sources attached, or an
honest refusal, or — if they are in trouble — a handoff to an adult. The hard part is not the retrieval. It
is that the thing answering is a language model, the material it reads is the open web, and the reader is
six. This package is the deterministic scaffolding that surrounds both of those so that neither is ever the
only thing standing between a child and what they see.

Pure and offline. Every non-deterministic step — moderation, distress detection, retrieval, generation,
faithfulness scoring, readability shaping, hashing — is a typed port. Under the deterministic stubs the whole
pipeline is a pure function of its input; `now` is injected and never read from the clock. Synthetic data
only.

## The one non-obvious idea: the model is never a gate

A port is **evidence to be checked, not an answer**. That principle decides most of the pipeline's shape,
including the parts that look redundant:

- **Reputation is recomputed from the URL, never read off the document.** A retriever hands back a
  `RetrievedDoc` carrying a `reputation` field, and stage 4 throws it away and calls `reputationOf(doc.url)`
  instead. A document that can describe itself can lie about itself.
- **Retrieved text is spotlighted before it reaches the generator.** `spotlight()` wraps it in
  `«untrusted-document»` delimiters and escapes any forged copies of those delimiters inside the payload, so
  untrusted text cannot break out of its region and read as instruction. Injection defence here is
  architectural — treat all retrieved text as quoted data — rather than a filter looking for bad strings.
- **Output moderation runs even though input moderation passed.** They are independent checks of different
  text, and a safe question can produce an unsafe answer.
- **Any port that throws refuses.** `runConcierge` wraps the whole pipeline in a `catch` that returns
  `{ kind: "refused", reason: "internal" }`. A broken adapter produces a refusal, never a leak and never a
  stack trace.

## Distress is checked before moderation, and that ordering is the point

Stage 2 scrubs PII, then asks the distress classifier, and only then moderates the input. The order matters
because some of the things a child in trouble says contain exactly the tokens a denylist is built to catch.
Moderating first would answer a child reaching for help with a refusal — the single worst response available
— and would do it precisely in the case where getting it right matters most. Distress **escalates to a
human** (`kind: "escalated"`); it never refuses and never answers.

## Pipeline

```
request ─▶ 1 tier strictness ─▶ 2 PII scrub → distress → input moderation
        ─▶ 3 CURATED-FIRST ──(covered)──▶ shape → moderate → answer + citations + resources
        ─▶ 4 retrieve, reputation recomputed, ranked, capped
        ─▶ 5 per-doc reputation floor + moderation → spotlight
        ─▶ 6 generate (cite-or-refuse) → faithfulness ≥ the tier's floor
        ─▶ 7 output moderation ─▶ 8 readability shaping ─▶ 9 serve + probe
        ─▶ 10 (side value) the served docs, for the vet queue
```

`runConcierge(request, deps, now)` returns `{ response, cache? }`. The `cache` sits **beside** the response
rather than inside it, so `ConciergeResponse` stays exactly the three-way shape a surface renders
(`answer | refused | escalated`) while stage 10 still gets the served docs faithfully.

**Curated-first is the compounding lever.** If the curated library already covers the question, stage 3
answers from it and skips retrieval entirely — no open web, no model-generated prose, no faithfulness gate,
because there is nothing untrusted in the answer. Everything a human vets and promotes into the library makes
the next child's version of the same question cheaper and safer. Coverage is decided by
`inferDomainPaths`, which slugs the message and matches its tokens against the two-axis taxonomy's cabins and
subtopics. Mode inference from free text is unreliable, so `affordedModes` are carried for downstream
discovery seeding but are **not** part of the coverage predicate.

Age is a **parameter over one pipeline**, not a second pipeline. `STRICTNESS` raises the faithfulness floor
and lowers the length caps as the tier goes down (`6-8`: floor `0.8`, 240 chars, 2 sentences; `12-14`: floor
`0.6`, 960 chars, 8 sentences). Every tier's floor is at or above the global `FAITHFULNESS_MIN`, which a type
assertion in `model.ts` pins.

## The curated library

`SEED_LIBRARY` holds **157 hand-authored resources across all 8 taxonomy cabins and 29 domain paths**
(`6-8`: 59, `9-11`: 105, `12-14`: 109 — a resource may serve several bands).

`validateLibrary` is stricter than a data check because under a launcher surface the library *is* the
product. A child taps a subtopic and sees exactly what is filed under it, so `EMPTY_SUBTOPIC` is an **error**
and not a warning: an empty shelf is a dead end a child walks into, and it teaches them the thing they were
curious about is not here. `NOT_HTTPS`, `BAD_URL`, `NO_MODES`, `DUPLICATE_URL` and
`BELOW_REPUTATION_FLOOR` are the same idea one level down — an entry that cannot be followed, cannot form a
cell, or is filed under a source the system's own retrieval filter would have dropped. `THIN_SUBTOPIC` and
`TIER_UNSERVED` are warnings, because one good resource beats three weak ones.

`asArtifact` projects a `CuratedResource` into a two-axis `Artifact` so the discovery engine can score what a
child follows. It **throws** unless the entry's provenance starts with `curated:`. Only a hand-authored,
human-reviewed entry may claim `gold`/`seed`/`TRUSTED` at confidence 1, and `promote` can add web-derived
entries to the same collection — the prefix check is what stops one arriving downstream wearing the other's
credentials.

## Promotion is human-gated and asynchronous

Stage 10 never blocks a live answer. `toCacheEntry` stamps a served doc with a content-digest provenance and
the tier it was served at; `enqueue` queues it; `promote(library, queue, entry, decision)` applies a human's
`approve`/`reject`. The entry always leaves the queue. On approval it becomes a `CuratedResource` only if
`inferResourcePath` can place it in the taxonomy — an unclassifiable approval is dropped rather than filed
somewhere wrong. The tier travels with the entry, so a document vetted at `12-14` is never silently curated
for `6-8`.

## Deliberately absent

- **Chat is never scored.** No interest signal, no belief, no inference is derived from a conversation. The
  most stage 9 emits is a `probe` — one sentence naming a small testable next step. Discovery evidence comes
  from what a child *does*, and a question they typed is not that.
- **No network and no real ranker.** `ALLOWLIST` is a seven-domain starter set that biases the stub
  retriever and the per-doc filter; anything not on it, including an unparseable URL, scores below the floor
  and is dropped. Real ranking belongs to the live adapter.
- **No age derivation.** `ageTier` is a server fact on the request. Deciding it is `@gt100k/consent`'s
  problem, not this package's.

```sh
pnpm --filter @gt100k/concierge test
```

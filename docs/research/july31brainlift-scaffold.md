# Writing scaffold for capstoneBL.md

Notes to write from. Nothing here is a sentence you can lift; that is on purpose.

## RULE 0: the document is self-contained

**Never cite anything inside this repo.** No other brainlift, no research memo, no decision
record, no source file path. A reader outside the company must be able to check every claim.

- Allowed: published papers, standards documents, regulator guidance, court records, public URLs.
- Not allowed: "see our earlier brainlift", "per memo 09", a path into the codebase.
- Facts about **our own system** are fine, stated as facts. "Our shred path is a stub" is a
  claim about the product, not a citation. Just do not point at the file.

## RULE 1: every source earned its place by changing the build

The bank is 14 blocks. A paper stays only if it produced a mechanism. Each block in
`capstoneBL.md` carries a **Shipped as:** line naming what it produced.

Write each DOK 2 summary against that line. That is the difference between a literature
review and a design document, and it is the thing a reader cannot get anywhere else.

## How to use this

1. Open this scaffold and `capstoneBL.md`. Nothing else.
2. Write each field in your own words, one sitting per section.
3. Retype rather than paste-and-edit. Editing an AI sentence leaves the AI sentence underneath.
4. Do not run the result back through an AI to smooth it.
5. Paste numbers and anything in quotation marks verbatim. Those are source material.

---

# What the audit found

Four traces through the codebase, checking every citation against what shipped. All 54 links
fetched, every DOI checked against CrossRef.

## Four broken citations, now fixed

| Was | Actually |
|---|---|
| Smith & Smoll at `10.1080/10413209208406459` | That DOI is Jackson (1992), "Athletes in flow." The 26%-to-5% study is **Barnett, Smoll & Smith (1992)**, `10.1123/tsp.6.2.111` |
| Chetty at `opportunityinsights.org/paper/diversifying-society-s-leaders/` | Hard **404**. Now `nber.org/papers/w31492` |
| AAP Brenner **2016** | The product uses the **2024** clinical report, `10.1542/peds.2023-065129` |
| Luthar & Becker **2002** | The product uses **Luthar, Kumar & Zillmer 2020**, `10.1037/amp0000556` |

Publisher 403s from Sage, Wiley, Taylor & Francis, ScienceDirect, ACM, Hogrefe, AEA and Human
Kinetics are bot-blocks, not dead links. Every one resolves to the right paper.

## The bank went from 25 blocks to 14

Cut for having no trace in the product. Some of these hurt.

| Cut | Why |
|---|---|
| **Quested 2013**, the 88% free-choice finding | Cited nowhere in the product. Our own decision record says excluding self-report was **our design choice, not a finding**. Nye (2012) carries the same point at r = .20 to .36, and the product does cite Nye |
| Mabbe, Patall, Skjesol, Childhood-and-Beyond | No constant, field, or age-gated rule anywhere |
| Actual-vs-perceived motor competence | Not the reason artefact competence is excluded from interest |
| School Burnout Inventory | We never administer it |
| Yerkes-Dodson critique | The 85% rule carries the setpoint; Yerkes was never invoked |
| Barth 2023 | Never became a constant |
| Music-school betas, Saarinen | Not cited in any decision or code comment |
| Arkes & Ayton, Credé | Parent Playbook prose only, no engine effect |
| MyReadscape, Molenaar, Ragone, Agesilaou, Stoilova | No child-facing record UI was built from them |
| **Wolf 2008** | The audible-label requirement was specified and **not built**. The wall is art plus text |
| Open Badges, W3C VC, Grammarly, C2PA, RO-Crate serialization | Zero lines of code |
| Zhang 2024 watermarking | No policy anywhere |
| Sigstore, Rekor, Trillian | Stub port only, no client |
| Verhavert | We do not do comparative judgement |

Every unverifiable number left with the block that held it, so there are no outstanding
citation gaps.

---

# Per-SPOV notes

## SPOV 1: what a child picks is not the signal

The argument runs: the obvious instrument is a menu plus a watch on what they choose. It
fails, and the fix is not what you would guess.

- stated interest predicts weakly, r = .20 to .36 (Nye)
- what predicts is the return: situational interest during a course predicted course choice
  across 7 semesters where enjoyment predicted nothing (Harackiewicz, N=858)
- the theory naming that: later phases of interest are defined by self-generated
  re-engagement (Hidi & Renninger)
- at 7 to 8, in-session engagement discriminated nothing and only the delayed probe did
  (Habgood & Ainsworth, partial η² = .24)
- and interest left alone decays: +.03 treated against −.03 untreated (Rotgans & Schmidt)

**The turn:** those last two together mean the menu is a maintenance obligation. Offering
something once and reading the click is the error. Offering it four times spaced out, and
reading only the unprompted return days later, is the instrument.

**Shipped:** the `prompted` flag, same-day engagement scoring zero, novelty events skipped,
four owed re-exposures per triggered domain, and a rule that no child is ever handed a fixed
passion label (O'Keefe).

## SPOV 2: behaviour cannot name a motive

- faces do not encode emotion (Barrett), and inferring it in education is illegal in the EU
  since February 2025
- so we watch behaviour, and most builders stop there. **They should not**
- SDT's own authors say their free-choice measure "is unidimensional and consequently cannot
  assess other important motivational concepts" (Guay)
- praise inverts it: ego-involved participants persisted *less* after positive feedback and
  *more* after nonconfirming feedback, enjoying neither (Ryan, Koestner & Deci 1991)
- and the state everyone wants to catch does not live in hours. Harmonious and obsessive
  passion predict identical practice across 94 studies (Curran). Attraction and entrapment
  produce identical attendance (Raedeke)
- the guide is not accurate either: adults agree about a child at r ≈ .28, and judge what a
  child is *good at* far better than what they *like* (Achenbach; teacher accuracy ~.63 for
  achievement, low for interest)

**The resolution, and it is the strongest thing in this SPOV:** the spread *within* adult
report is larger than the gap between kinds of adult. The problem is retrospection, not the
parent. So ask for a dated episode, never an impression. And keep the channel write-only,
because changing a parent's belief causally reallocates real investment (Dizon-Ross).

**Shipped:** no affect field exists on the signal type at all, the obsessive-tipping-point
field was deleted rather than deferred, probes replaced the detector, adult report is weighted
0.25 and can corroborate but never establish, and the one guide move graded as controlled
evidence in children is subtracting outcome talk (Barnett, Smoll & Smith).

## SPOV 3: pressure is the damage channel

- the setpoint is about 85% success (Wilson), and it is a **separate knob** from pressure.
  Backing off means pressure comes down before challenge is touched
- devaluation is the earliest and quietest of the three burnout dimensions (Raedeke & Smith),
  and the higher-burnout profile carried 2.2 to 2.4× dropout six years later (Isoard-Gautheur)
- rest has a dosage: 1 to 2 days a week, about 3 months a year (AAP)
- the stakes: high-achieving schools carry elevated anxiety, depression and substance use
  (Luthar, Kumar & Zillmer)

**Say that the thesis is in the type system.** Two independent knobs with pressure moving
first is "harm runs through pressure, not volume" compiled into an interface. That is a
stronger claim than any citation, and no competitor can say it.

Keep the self-correction about early lock-in. Describe the position we reversed in words. Do
not cite where we said it.

## SPOV 4: the record carries no score

- rewards cut interest *more* in children than in adults (Deci), and an expected award cut
  preschool free-play drawing (Lepper)
- **Butler (1988) is the headline** and it is in our exact age band: fifth and sixth graders,
  grades against comments against both. Interest was highest after comments, and
  grades-plus-comments performed like grades alone. The number did not dilute the comment,
  it erased it

**The spikiest idea in the document, and it needs no citation:** a parent-visible return
metric would destroy our only instrument. Once a child knows a parent can see whether they
came back, coming back becomes evidence of compliance. We would spend the one valid signal to
build a feature that also harms the child. It is an internal-consistency argument about our
own design, which makes it the safest strong claim available.

**Shipped:** a structural ban on streak, point, reward, xp, badge and leaderboard keys, and a
parent digest carrying the child's own words with no number anyone can watch move.

## SPOV 5: the crypto is commodity, deletion is not

- what is real: content-addressed nodes whose id is the hash of their content, true RFC-6962
  roots preserving input order, an in-toto-shaped Statement, PROV bases on the taxonomy
- what is **not** real, and say all three: signing is deferred, the transparency log returns
  an empty proof, and the shred path is a stub with no key lifecycle
- detectors cannot fill the gap: 14 of them across 754 cases were "neither accurate nor
  reliable" (Weber-Wulff), and seven misclassified non-native English at a 61.3% false-positive
  rate (Liang). So none may ever trigger a consequence for a child
- the bar for deletion: immutability "cannot be invoked to justify non-compliance" (EDPB), and
  Cryptographic Erase counts as Purge only when every key copy dies (NIST)

**Be honest here or the whole document loses standing.** A document arguing that provenance
must be truthful cannot overstate its own. Open Badges, Verifiable Credentials and C2PA appear
in zero lines of our code; they are things we would reuse, not things we run.

**Shipped:** a spoken defense engine standing exactly where an AI detector would otherwise sit.

## SPOV 6: the spike sorts, it does not substitute

- four separate ratings, and every row of the table conditions on "no other 1s," which pits a
  spike from a child *without* the grades against a well-rounded child. Our profile never
  appears in the table
- the coefficients are additive: 4.094 academic, 4.232 extracurricular
- the rubric grades level, never domain, and enumerates no approved activity anywhere
- domain bites only at **verification**: a second rating axis for academic competitions,
  faculty portfolio review for music and art, recruiting for athletes
- the uncomfortable half: non-academic ratings track private schooling and do not predict
  post-college outcomes (Chetty)

**The payoff line:** prestige is a question of who can check your claim. That gap is why the
evidence record exists and why the catalogue is built around pursuits with a real external
standard and venue.

---

# Writing notes

- Your own tics are the asset. The emphatic capital, the question you answer yourself, the
  short fragment after a long sentence.
- Vary paragraph length hard. Some one sentence, some eight.
- Where you are uncertain, write the uncertainty in your own voice rather than in hedge words.
- Do not aim for polish. Polish is the tell.
- Numbers and anything inside quotation marks: copy exactly, no paraphrase.
- When a block has a **Shipped as:** line, the summary should connect the finding to the
  mechanism. That connection is the whole value of the document.

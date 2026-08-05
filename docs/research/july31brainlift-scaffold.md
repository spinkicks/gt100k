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

# Experts: raw material for Focus and Why Follow

Fragments to turn into your own sentences. Pattern that works, from the first three you
wrote: Focus says what they study, Why Follow names a concrete thing our product does or
refuses because of them.

## Robert Vallerand & Thomas Curran (SPOV 2)
**Focus**
- the split between healthy and obsessive passion
- Vallerand built the distinction, Curran ran the meta-analysis testing it: 94 studies, 1,308 effect sizes

**Why Follow**
- the two kinds of passion predict the *same* practice hours, statistically indistinguishable
- obsessive passion is unrelated to objective performance
- so you cannot tell healthy from unhealthy by watching how much a kid does
- we deleted the "obsessive tipping point" field rather than deferring it: the theory never claimed a tipping point exists
- what replaced it is probes a guide runs, not a quadrant on a dashboard

## Ronald Smith & Frank Smoll (SPOV 2)
**Focus**
- training the coach instead of the child
- Coach Effectiveness Training

**Why Follow**
- 18 Little League coaches, ages ~10 to 12: next-season dropout 5% trained against 26% control
- no difference in win-loss records, so it was not about winning more
- the biggest self-esteem gains went to the kids who started lowest
- strongest controlled evidence on actual children anywhere in this literature
- it is why the one guide move we grade as controlled-in-children is subtracting outcome talk
- the lever is the adult

## Rebecca Dizon-Ross (SPOV 2)
**Focus**
- what parents believe about their own child's ability, and what happens when you correct it
- field experiment, N > 2,700

**Why Follow**
- parents were about 30% wrong on which of their own two children was academically stronger
- correcting the belief changed real spending on that child
- so a number a parent can watch move is never neutral, it reallocates investment
- this is why our adult-report channel is write-only, the adult never sees their report change anything
- and why adult report is weighted 0.25: it can corroborate an interest, never establish one

## Thomas Raedeke & Alan Smith (SPOV 3)
**Focus**
- measuring burnout in young athletes
- the three parts: exhaustion, reduced sense of accomplishment, and devaluation

**Why Follow**
- devaluation is the quiet one, a kid who stopped caring rather than a kid who is tired
- it arrives before the loud symptoms do
- so our engine treats devaluation as a first-class signal and weights it above exhaustion
- the earliest escalation state fires on it
- pairs with the finding that a higher-burnout profile carried 2.2 to 2.4 times the dropout six years later

## Suniya Luthar (SPOV 3)
**Focus**
- what pressure to achieve costs kids in high-achieving schools
- affluent, high-performing environments treated as a risk category rather than a safe one

**Why Follow**
- students in these schools carry elevated anxiety, depression and substance use against national norms
- that is exactly the population we are building for, so the risk is ours by default
- she names the harm we design against: a child whose worth depends on how they perform
- it is why safeguards are in from the start rather than added after a kid gets hurt

## Ruth Butler (SPOV 4)
**Focus**
- how different kinds of feedback change what a student does next
- grades against written comments

**Why Follow**
- randomly assigned fifth and sixth graders to grades, comments, or both
- interest was highest after comments
- grades-plus-comments performed like grades *alone*: the number did not dilute the comment, it erased it
- our exact age band, which almost nothing else in this literature is
- it is why the parent digest carries the child's own words and no number at all
- and why "just add a small score next to the narrative" is not a compromise that exists

## Phillip Dawson (SPOV 5)
**Focus**
- keeping assessment honest now that AI can write the artifact
- interactive oral assessment, and splitting work into secured and open lanes

**Why Follow**
- no test on a finished file proves a human made it
- so the check has to be a conversation rather than a scan
- his work is the basis for our five-minute spoken defense on a sample
- that is the one thing a remote competitor holding only the finished file cannot run
- and it gets more valuable every year that AI makes files easier to fake

## The EDPB & CNIL (SPOV 5)
**Focus**
- European data-protection regulators
- specifically how the right to erasure applies to a system built never to change

**Why Follow**
- they say technical immutability "cannot be invoked to justify non-compliance"
- crypto-shredding counts as a supplement, not a complete guarantee
- personal data should not go on an immutable structure even hashed
- they set the bar our architecture has to clear, and we do not clear it yet
- worth admitting here: our shred path is a stub and there is no key lifecycle

## David Card & Peter Arcidiacono (SPOV 6)
**Focus**
- six years of Harvard applicant data, entered as evidence in *SFFA v. Harvard*
- they appeared as opposing expert witnesses

**Why Follow**
- they disagreed about what the numbers meant and agreed about the numbers themselves
- so where they overlap is the firmest evidence anyone has on what elite admissions rewards
- the lawsuit is also the only reason the reading rubric is public at all
- the rubric grades level, never subject, and lists no approved activity anywhere
- which kills the folk hierarchy of prestigious hobbies

## Raj Chetty, David Deming & John Friedman (SPOV 6)
**Focus**
- what attending an Ivy-Plus college actually causes, identified from waitlist admissions
- what drives the admissions advantage held by the richest applicants

**Why Follow**
- the only study in our bank that can claim cause rather than correlation
- about 30% of the top-1% advantage comes from stronger non-academic ratings
- conditional on test scores, private-school students have no higher academic ratings but much higher non-academic ones
- non-academic ratings do not predict how a student turns out after college; academic credentials do
- this is the uncomfortable half of our own argument, and saying so is worth more than hiding it
- part of what the non-academic rating measures is a school's skill at packaging a kid

---

# DOK 2 summaries: raw material

One to three sentences each. The job of a summary is to connect the finding to the
mechanism on the **Shipped as:** line. Facts are already above it, so do not restate them.

## 1. Hidi & Renninger / Harackiewicz / Nye / O'Keefe
- what a kid says they like barely predicts anything, r = .20 to .36
- what does predict: coming back unprompted. Harackiewicz saw interest during a course drive choices seven semesters later while enjoyment drove nothing
- Hidi gives the thing a name: the later phases of interest are self-generated re-engagement
- so we log whether a visit was prompted, and only the unprompted ones count
- O'Keefe is the flip side: call it a kid's passion and you have made it a fixed thing they can fail at

## 2. Habgood & Ainsworth / Rotgans & Schmidt
- at 7 to 8, watching a kid in the moment separated nothing. Only the delayed test did
- so a first click is worth zero to us
- and interest left alone slides backwards, minus .03 against plus .03
- which makes the menu a maintenance job rather than a one-time offer: four spaced re-exposures owed per domain

## 3. Barrett / EU AI Act
- faces do not encode emotion reliably, and Barrett's review is the strongest statement of it
- the EU made inferring emotion in schools illegal in February 2025
- so there is no emotion field anywhere in our system. Not disabled, not permission-gated, it does not exist as a type
- the science reason and the legal reason land in exactly the same place

## 4. Guay / Ryan, Koestner & Deci / Fredricks
- the field's own measure cannot separate the kinds of motivation, and its authors say so in print
- Ryan 1991 is worse than that: praise ran persistence backwards for ego-involved people
- Fredricks: a log cannot tell doing-what's-expected apart from actually wanting to
- so we build no motivation detector at all. A guide asks whose idea it was instead

## 5. Curran / Raedeke / Barnett, Smoll & Smith
- 94 studies: healthy and obsessive passion produce the same practice hours
- Raedeke: kids who want to be there and kids who feel stuck show the same attendance
- so intensity tells you nothing, and the tipping-point field got deleted rather than deferred
- what did work was training the coaches. 26% dropout down to 5%, same win-loss record
- so the intervention points at the adult

## 6. Achenbach / Dizon-Ross
- adults agree about a child at r ≈ .28, and that has held for forty years
- they read what a kid is good at far better than what a kid likes
- Dizon-Ross: 30% of parents wrong about their own two children, and fixing the belief moved real money
- so adult report is weighted 0.25 and can corroborate an interest but never establish one
- and the channel is write-only, because a number a parent can watch would change how they treat the kid

## 7. Wilson, the 85% rule
- optimal error lands near 15%, so about 85% success
- that is our difficulty setpoint: push above .9, hold between .8 and .9, scaffold below .7
- the part that matters: difficulty is a separate dial from pressure, and pressure always comes down first

## 8. Raedeke & Smith / Isoard-Gautheur
- burnout has three parts and devaluation is the quiet one
- a kid who stopped caring still shows up, so attendance hides it
- the higher-burnout profile carried 2.2 to 2.4 times the dropout six years on
- so devaluation is a first-class signal, weighted above exhaustion, and it fires the earliest warning we have

## 9. AAP / Luthar
- the AAP puts a dosage on rest: 1 to 2 days a week, roughly 3 months a year
- Luthar: high-achieving schools carry elevated anxiety, depression and substance use
- that is our exact population, so the risk is ours whether we design for it or not
- so rest ships as a number attached to every plan rather than left to a guide's judgment

## 10. Deci / Lepper / Butler
- rewards cut interest, and they cut it harder in children than in adults
- Lepper: an expected award killed preschoolers' free drawing
- Butler is the one in our age band, and it is the sharpest: comments raised interest, grades did not, and grades plus comments performed like grades alone
- so a number does not sit beside feedback, it replaces it
- hence no score anywhere in the record, and a parent digest built from the child's own words

## 11. RFC 6962 / in-toto / PROV / Weber-Wulff / Liang
- the crypto is all off the shelf: content-addressed nodes, RFC-6962 roots, an in-toto statement shape, PROV vocabulary
- what it proves is that nobody altered the file
- what it cannot prove is that a human made it
- detectors cannot cover that gap either. 14 failed, and 7 flagged non-native English at a 61% false-positive rate
- so no detector ever triggers a consequence for a child, and the check is a spoken defense instead
- stay honest: signing is deferred and the transparency log returns an empty proof

## 12. COPPA / EDPB / NIST
- EDPB: "our system cannot change" is not an excuse for failing to delete
- personal data should not go on an immutable structure even hashed
- NIST: crypto-erase counts only if every copy of the key dies
- COPPA 2025: indefinite retention is out
- this is the unsolved half. A node's id *is* the hash of its content, the shred path is a stub, and there is no key lifecycle
- say it plainly. A document about provenance cannot overstate its own

## 13. SFFA v. Harvard / Card
- the rubric grades level, never subject, and lists no approved activity anywhere
- so the folk ranking of prestigious hobbies is not in the instrument at all
- the table everyone quotes conditions every row on "no other 1s," which compares a spike from a kid *without* the grades against a well-rounded kid. Our profile is not in the table
- where the subject does bite is verification: academic competitions trigger a second rating, music and art get faculty review, athletes get recruited
- pursuits with no verification route are the gap, and closing it is why the record exists

## 14. Arcidiacono / Chetty
- the coefficients add rather than trade: 4.094 academic, 4.232 extracurricular
- Chetty is the uncomfortable half. 30% of the rich-applicant advantage is non-academic ratings, private-school kids show the same academic ratings but much better non-academic ones, and non-academic ratings do not predict how anyone turns out
- the answer worth writing: Chetty measures the *rating*, and a rating is a reader's impression of a file. A verifiable record of real work is a different object, and the gap between them is the whole thesis

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

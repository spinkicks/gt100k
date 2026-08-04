# Asking a child about the work while they are still doing it

**Status:** specified here, built in the same change.

**Why now.** Operators report that children hand in projects they one-shotted with an AI. The
finished artefact looks fine and the child cannot account for it. Our answer so far has been the
Socratic defense, and the defense runs at the end, over a finished `ProjectProfile`. By then the
question "did you understand this while you made it" is unanswerable, because there is nothing left
to observe but the result.

---

## 1. What already exists, and what does not

`@gt100k/socratic-defense` is a real engine: six facets (`what`, `why`, `how`, `challenge`, `next`,
`audience`), follow-up depth that adapts to a readiness level, coverage tracking, gap computation,
and an evidence record. `tutor-tfy` drives it against a live model.

It is used by `mastery-map`, to examine work a child did somewhere we do not run. **`project-studio`
does not depend on it at all.** So nothing asks a child anything while they are building.

The half we are missing is not the interviewer. It is the moment.

## 2. The trigger is a thin process record, not a clock

The obvious design is to interrupt every N minutes. We are not doing that, for three reasons.

It punishes the child we are trying to protect. Flow is the state this product exists to produce,
and a timer interrupts the absorbed child exactly as often as the one who pasted in an answer.

It is trivially gameable. A child who learns that a question arrives every ten minutes learns to be
somewhere harmless at minute nine.

And it throws away information we already collect. A `WorkEvent` has ten kinds, and the ones that
matter here are `attempt`, `revision`, `outcome` with `stuck`, and `artifact`. A child who genuinely
built something leaves a trail of failures behind it — `stuck` is documented in the model as "the
perseverance seed" for exactly this reason. **A one-shotted project has a signature: an artefact with
almost nothing behind it.** Nobody tried anything, nothing broke, nothing was revised, and then the
thing existed.

So the interview fires when the record is thin. The child who actually worked is rarely interrupted;
the child who did not is asked immediately, which is the right way round.

## 3. It logs. It never blocks, and it never scores

The answers are recorded and a guide reads them. The child is not stopped, the artefact is not
gated, and nothing computes a pass.

Three reasons, in increasing order of importance.

It matches how everything else here works. The wellbeing engine flags and a human disposes; the
hypothesis store proposes and a human promotes. An LLM that can refuse a child's work is a different
kind of product from the one the rest of this repository describes.

**SPOV 2 forbids the inference.** Behaviour cannot name a mental state, and "does this child
understand their own project" is precisely a mental state. A model scoring that answer would be
doing the thing the whole document says cannot be done. What a transcript can honestly support is
"here is what they said when asked", which is a fact, and a guide can read it.

And the failure mode of blocking is worse than the failure it prevents. A false positive tells a
child who did the work that a machine thinks they cheated. Our own research says cheating-accusation
anxiety rises with grade level, and that a simple disclosure label outperformed a detailed one.

**This constrains the copy, not just the architecture.** The child is never told they are suspected
of anything. The prompt is "tell me about this bit", never "prove you wrote this". A child who
one-shotted a project and is asked to explain it learns something either way; a child who is accused
and did the work learns something worse.

## 4. The thin record is its own finding

Worth separating, because the two do different jobs and either could ship without the other.

The **signature** is cheap, deterministic and needs no model: count what is behind the artefact. It
goes to the guide, who can act on it. It is detection.

The **interview** is for the child, and its value is mostly teaching. Being asked "what did you try
before this worked" while you are still working is a good question whether or not you cheated.

We ship both. The signature decides when to run the interview, and the signature is also surfaced on
its own, because a guide should be able to see a thin record even if the child never answers.

## 5. What gets built

- `thinness` in `@gt100k/project-workspace` — a pure function over a project's events returning
  what is behind the artefact and whether that is thin. No model, no I/O, fully tested.
- The studio asks when a thin artefact is logged, using the existing six-facet engine at
  `emerging` follow-up depth, and appends the exchange as a `reflection` event so it lands in the
  same append-only journey as everything else rather than in a side channel.
- The guide console shows the thinness on the project, and the answers under it.

## 6. What we are deliberately not building

- No score on the answers, and no "understanding" rating. See §3.
- No block on the artefact.
- No AI-detection classifier. Detectors are inaccurate, defeated by paraphrase and biased against
  the most vulnerable students, and the repository already refuses them on that evidence.
- No timer.

## 7. The honest limit

A determined child can defeat this by logging fake attempts. That is a real hole and it is not worth
closing, because closing it means either surveillance or a detector, and both cost more than the
cheating does. What this catches is the ordinary case: a child who used a model to skip the work and
did not think to fake a history of failing first.

It is also unvalidated. Nobody has tested whether being asked mid-build changes what a child learns,
and the number below — how thin is thin — is our choice, not a finding.

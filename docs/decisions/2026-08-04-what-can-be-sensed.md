# What we can honestly sense, what we ask for, and what we delete

**Status:** decided here, built in the same change.

Three signals sat in the wellbeing engine with no way to produce them, so the states depending on
them could never fire. A fourth, `external_report`, was fully implemented in the belief math and had
no way to be captured. And the parent surface knew nothing about any child. This is one decision
because the same question runs through all four: what can be observed, what has to be asked, and
what should not exist.

The research behind it is in
[`docs/research/passion-pipeline/hardening/09-adult-observation-validity.md`](../research/passion-pipeline/hardening/09-adult-observation-validity.md)
and in the findings cited inline below.

---

## 1. `obsessiveTip` is deleted

Not deferred. Deleted, because it names something that does not exist.

The Dualistic Model of Passion does not describe a tipping point. Harmonious and obsessive passion
are two separate dimensions measured at the same time, and a person can score high on both. The
modelling work in that literature has gone toward showing the two are *distinguishable*, not toward
locating a moment when one becomes the other. A signal called `obsessiveTip` asks for a date that
the source theory does not claim exists.

Even setting the concept aside, it cannot be measured. Every validated instrument asks the person.
There is no child version of the Passion Scale; the youngest validations are adolescent, and the
Portuguese one had to reject the original two-factor model and cut to eight items to get acceptable
fit. The nearest thing to behavioural detection measured obsessive passion by self-report **first**
and used behaviour as the outcome, which does not license the inverse inference, on 131 MTurk
workers averaging 23 years old. That study also found rigid persistence related *negatively* to
performance, so the intuition that obsession looks like grinding is not even the right shape.

Keeping a field we cannot fill is how a system ends up with a proxy. Any proxy invented here would
be measuring something the theory it borrows from does not contain.

## 2. `exhaustion` stops being a behavioural inference

The old spec was "shorter sessions, latency, sleep encroachment". That is folk psychology, and the
evidence against it is stronger than we expected.

The best published attempts are in adults, with far richer sensing than session logs, and they
still fail. A study of 239 workers over nine months reached an ROC AUC of **0.56 for emotional
exhaustion**, where chance is 0.50. The dimension closest to what we mean performed worst. Studies
that do better are subject-dependent, meaning each model is trained on that person's own labelled
self-reports, which requires exactly the ground truth the sensing was supposed to avoid collecting.

The sleep half inverts. The validated instrument does not measure sleep timing; the School Burnout
Inventory asks "I often sleep badly because of matters related to my schoolwork", which requires the
child to notice bad sleep *and* attribute it to the activity. Reported sleep tracks mental health
better than actigraphy does, the two appear to measure different things, and children aged 8 to 9
misestimate their own sleep duration by over ninety minutes anyway. Late-night activity would need
two inferential leaps and the second one runs backwards.

**So it becomes something an adult reports, not something we infer.** And it is a trend rather than
a threshold: Mind Garden removed all MBI cut-off scores in 2016 for having no diagnostic validity,
and the WHO classifies burnout as an occupational phenomenon rather than a condition. A boolean has
no scientific referent in any population, so the engine takes a direction and never a verdict.

Honest limit worth stating: nothing here is validated below about age 9. The BAT-C student version
covers 9 to 13, the SBI was built on 16-year-olds and up, and the athlete burnout literature says
outright that no tool validated for children exists. For a six-year-old we have nothing, and the
copy says so rather than pretending the question travels.

## 3. `stakesEvent` gets built, because it is not a mental state

A competition, audition or deadline is a scheduled fact an adult already knows. Our rule that
behaviour cannot name a mental state applies here in a degenerate way: we ask, but we ask for a
date. There is no inference to get wrong, which makes this the cheapest honest signal in the system
and the one the other two should hang off.

The window has a documented shape. Intrusive anxious thoughts climb across the final week; cognitive
and somatic anxiety rise and confidence *falls* in the last two hours. So the engine opens the
window on a date rather than on a mood, and the advice differs by how close the event is.

**What an adult should do is the strongest evidence in this whole area, and it is unusually
specific.** A conversation-analysis study recorded four and a half hours of actual car journeys home
from tennis competitions. Children resisted and disengaged whenever a parent opened a review of
their performance, including when the parent was being supportive. When the **child** opened the
subject, extended affiliative talk followed, whether they had won or lost. The rule is about who
speaks first, not about tone, and that is implementable in a way "be encouraging" is not.

## 4. `external_report` gets a capture, and stays weak

The belief math already scores it at `A_REPORT_BROAD = 0.25` and grants no distinct day. Nothing
could produce one. The gap was the capture, and the research says the capture is where the validity
lives.

Cross-informant agreement has sat at about `r = .28` for forty years. But the spread *within* adult
report is much larger than the gap between kinds of adult: parent report against tablet telemetry
managed `r = 0.35`, while a single global retrospective question about a child's activity correlated
`r = −0.11` with a week of accelerometry. The same parents reporting in the moment tracked the
objective measure well. **The problem is retrospection, not the parent.**

So we ask for an episode, not an impression. "What did you see them do last week" rather than "what
are they interested in", because the second invites the inferential leap where halo and stereotype
enter and produces nothing auditable.

Two biases shape the rest of the design. Adults judge what a child is **good at** far better than
what a child **likes** — teacher judgment accuracy runs about .63 for achievement and low for
interest specifically — so expect this channel to over-name academically legible interests. And part
of the well-known gender gap appears to live in the instrument: parent-report studies find boys six
times as likely to have conceptual interests, while observation and child-interview studies of the
same ages find no such gap.

The gifted-identification literature is the natural experiment in making adult report load-bearing,
and it went badly: nomination gating produces false-negative rates above 60%, and high-scoring Black
students are half as likely to be referred. So a report can corroborate an interest the child's own
behaviour already earned. It can never establish one.

**The channel is write-only.** The adult is never shown that their report changed anything, and it
never changes what the child sees. Changing a parent's belief about their child causally reallocates
real investment, so a channel that visibly moved a number would be a machine for manufacturing the
parental over-valuation the rest of this product is built to avoid.

## 5. The parent surface is not a dashboard

We were going to give parents a view of their child. The evidence says the obvious version of that
is harmful, and the argument that should carry most weight internally is not the ethical one.

**A parent-visible return metric destroys the only signal we have.** The entire measurement model
rests on the child coming back unprompted. Once a child knows a parent can see whether they came
back, coming back is evidence of compliance and is indistinguishable from the introjected returns
the product already worries about. We would be spending our one valid instrument to build a feature
that also hurts the child.

The experimental evidence is strongest exactly where our users are. Butler randomly assigned fifth
and sixth graders to receive grades, comments, or both: interest was highest after comments, and
**grades-plus-comments performed like grades alone**. Adding a number did not dilute the comment, it
erased it. So a narrative next to a metric is not a compromise; it is the metric.

The tempting middle path also fails. "Show parents only the good news" runs conditional positive
regard, which a meta-analysis across 31 samples associates with introjected regulation more strongly
than conditional *negative* regard does.

So what gets built is the child's own words and artefacts, one conversation starter grounded in a
specific moment that asks the parent to share something of their own first, batched slowly, and
routed through the child, who sees exactly what will be sent and can hold anything back without
giving a reason. Plus the one thing only we can say: when an interest is running on its own, the
most useful thing a parent can do is leave it alone.

### Refused, with reasons

- Any number a parent can watch move: hours, sessions, streaks, completion, any score.
- Any comparison to other children.
- Trend lines of activity, the purest manage-the-metric affordance there is.
- Push notifications about a child's activity or result.
- Any predictive or potential signal, which manufactures over-valuation directly.
- "Your child has not opened this in N days", which converts our core signal into a nag trigger and
  then destroys it.
- A browsable session-by-session history, which is retrospective surveillance with the numbers
  filed off.

## 6. What would tell us we got it wrong

Ask the children, not the parents: parents rate these tools far more positively than children do,
and that gap is the finding. Watch whether children start withholding from the digest. And watch
whether returns cluster right after a parent reads one, because that would mean we are measuring
compliance and the primary signal is already compromised.

## 7. The limit across all of it

Nothing in this area is validated below about age eight, and several instruments bottom out at
twelve. The product serves children from six. For the youngest third we are extrapolating, and the
copy should carry that rather than bury it.

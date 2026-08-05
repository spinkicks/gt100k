# [TITLE]

## Owners

- Felipe Caicedo
- David Ordoñez


## Purpose




### In scope

-
-
-
-

### Out of scope

-
-
-

---

## DOK 4: Spiky Points of View (SPOVs)



### On reading the child

- **Spiky POV 1:** [CLAIM: what a child picks is not the signal / the unprompted return is / interest is built, not found]
   - **Elaboration:**


   - **Consensus it breaks:**

   - **Backing:** Hidi & Renninger (2006); Harackiewicz et al. (2008); Nye et al. (2012); O'Keefe, Dweck & Walton (2018); Habgood & Ainsworth (2011); Rotgans & Schmidt (2017).
   - **Honest limit:**

- **Spiky POV 2:** [CLAIM: behaviour is the only thing worth instrumenting / it cannot name a motive / the guide is asked, not the log]
   - **Elaboration:**


   - **Consensus it breaks:**

   - **Backing:** Barrett et al. (2019); EU AI Act Art. 5(1)(f); Guay, Vallerand & Blanchard (2000); Ryan, Koestner & Deci (1991); Fredricks, Blumenfeld & Paris (2004); Curran et al. (2015); Raedeke (1997); Barnett, Smoll & Smith (1992); Achenbach, McConaughy & Howell (1987); Dizon-Ross (2019).
   - **Honest limit:**

### On sustaining the child

- **Spiky POV 3:** [CLAIM: pressure is the damage channel, not volume / the setpoint is ~85% / devaluation is the early warning]
   - **Elaboration:**


   - **Consensus it breaks:**

   - **Backing:** Wilson et al. (2019); Raedeke & Smith (2001); Isoard-Gautheur, Guillet-Descas & Gustafsson (2016); American Academy of Pediatrics / Brenner et al. (2024); Luthar, Kumar & Zillmer (2020).
   - **Honest limit:**

### On the record the child builds

- **Spiky POV 4:** [CLAIM: the record must be legible and wanted, else surveillance / a number erases a comment]
   - **Elaboration:**


   - **Consensus it breaks:**

   - **Backing:** Deci, Koestner & Ryan (1999); Lepper, Greene & Nisbett (1973); Butler (1988).
   - **Honest limit:**

- **Spiky POV 5:** [CLAIM: the crypto is commodity / the in-person defense is the trust root / deletion is the hard problem]
   - **Elaboration:**


   - **Consensus it breaks:**

   - **Backing:** RFC 6962; in-toto Statement / SLSA; W3C PROV; Weber-Wulff et al. (2023); Liang et al. (2023); COPPA; EDPB Guidelines 02/2025 v2.0; NIST SP 800-88 Rev. 2 (2025).
   - **Honest limit:**

### On proving the spike was worth building

- **Spiky POV 6:** [CLAIM: the spike sorts above the floor, never substitutes for it / prestige lives in verification]
   - **Elaboration:**


   - **Consensus it breaks:**

   - **Backing:** Harvard Reading Procedures, Class of 2023 (HARV00097939); Card expert report Exhibits 4 and 5; Arcidiacono, Kinsler & Ransom (2022); Chetty, Deming & Friedman (2025).
   - **Honest limit:**

---

## Experts

- **Suzanne Hidi & K. Ann Renninger**
   - **Who:** Educational psychologists (University of Toronto; Swarthmore College).
   - **Focus:** A proposal for a 4-stage model of how an interest develops.
   - **Why Follow:** We are inspired by this model as we developed our app. The later phases of this model have an emphasis on self-generated re-engagement and that's what we actually track within our app. "triggered situational interest, maintained situational interest, emerging (less-developed) individual interest, and well-developed individual interest"
   - **Where:** https://doi.org/10.1207/s15326985ep4102_4

- **Lisa Feldman Barrett**
   - **Who:** Psychologist and neuroscientist, Northeastern University.
   - **Focus:** Looking into emotion and why looking into someone's face won't work to read it.
   - **Why Follow:** Partly b3ecause of her, we don't use any face reading tools. Not only are they illegal in the EU but they wouldn't even be effective to begin with.
   - **Where:** https://doi.org/10.1177/1529100619832930

- **Edward Deci & Richard Ryan**
   - **Who:** Founders of Self-Determination Theory, University of Rochester.
   - **Focus:** How powerful intrinsic motivation is and how external motivation can easily backfire because it starts feeling like someone made you do this thing.
   - **Why Follow:** These same ideas with hard work/choice/reward are used in our SPOV 2/4. Reward hurts a child who feels pressured into the specialization without the necessary intrinsic motivation.
   - **Where:** https://doi.org/10.1037/0003-066X.55.1.68

- **Robert Vallerand & Thomas Curran** (SPOV 2)
   - **Who:** Psychologists (Université du Québec à Montréal; London School of Economics).
   - **Focus:** They study that there is in fact a difference between obsessive and healthy passion. Vallerands makes this distinction and Curran tested it with a meta-analysis.
   - **Why Follow:** Interestingly enough, they're statistically indinstinguishable if you're looking at practice hours alone. So just watching how a kid does in a specific specialization won't actually tell you anything as to whether the passion is obsessive or healthy. As a result, we deleted our "obsessive tipping point" predictor since according to this research we cannot tell. A guide runs the probe instead.
   - **Where:** https://doi.org/10.1007/s11031-015-9503-0

- **Ronald Smith & Frank Smoll** (SPOV 2)
   - **Who:** Sport psychologists, University of Washington.
   - **Focus:** Training the coach instead of the student.
   - **Why Follow:** This paper provides the strongest controlled evidence on kids. It shows that the biggest dropout rates aren't because they lost a lot. It was because of the lack of a coach. And the kids that started lowest and had good coaches had the biggest self esteem gains... so we see that the lever is the adult.
   - **Where:** https://doi.org/10.1123/tsp.6.2.111

- **Rebecca Dizon-Ross** (SPOV 2)
   - **Who:** Economist, University of Chicago Booth School of Business.
   - **Focus:** Parents' thoughts about their own kids' abilities and what happens when you rectify their thoughts.
   - **Why Follow:** Parents were 30% wrong about which of their 2 children was smarter (academically). Once this belief was rectified, the parent changed their investment in the children. Because of this the adult-report channel in our app is write only and the parents don't see their report actually change anything. Adult report is also weighted at 0.25 so it can never establish an interest but it can corroborate one.
   - **Where:** https://doi.org/10.1257/aer.20171172

- **Thomas Raedeke & Alan Smith** (SPOV 3)
   - **Who:** Sport psychologists (East Carolina University; Michigan State University).
   - **Focus:** Burnout in young athletes (exhaustion, reduced sense of accomplishment, devaluation).
   - **Why Follow:** Devaluation comes quietly and earliest. Our engine treats it as a first class signal and gives it a weight higher than exhaustion's weight because of this study.
   - **Where:** https://doi.org/10.1123/jsep.23.4.281

- **Suniya Luthar** (SPOV 3)
   - **Who:** Psychologist, Arizona State University (emerita); co-founder, Authentic Connections.
   - **Focus:** How pressure to do well can negatively affect kids in high-achieving schools. 
   - **Why Follow:** These students carry elevated anxiety & depression. Elevated substance use too. The population in gt100k is exactly this so we naturally have this risk. Safeguards for this are in it since the start.
   - **Where:** https://doi.org/10.1037/amp0000556

- **Ruth Butler** (SPOV 4)
   - **Who:** Educational psychologist, Hebrew University of Jerusalem.
   - **Focus:** How feedback changes what a student will do next.
   - **Why Follow:** The study found that comments (and not grades) changed a student's interest the most. Grades & comments was equal to grades. So we remove scoring for a student's passion/specialization. The parent digest carries the child's own words with no score.
   - **Where:** https://doi.org/10.1111/j.2044-8279.1988.tb00874.x

- **Phillip Dawson** (SPOV 5)
   - **Who:** Assessment researcher, Deakin University.
   - **Focus:** Interactive oral assessment & splitting work into open/secured lanes to keep the assessment honest now that AI can do a lot of the work.
   - **Why Follow:** A test on a finished file doesn't prove that a human actually did it. Making the check a conversation solidifies that the human actually did it. This research is why we have a spoken/written defense on a sample (a socratic tutor of sorts for the project). 
   - **Where:** https://philldawson.com/

- **The EDPB & CNIL** (SPOV 5)
   - **Who:** European data-protection regulators.
   - **Focus:** Data protection regulations.
   - **Why Follow:** Part of our project we deferred for personal data. We can't have immutable data stored even if it's hashed.
   - **Where:** https://www.edpb.europa.eu/our-work-tools/documents/public-consultations/2025/guidelines-022025-processing-personal-data_en

- **David Card & Peter Arcidiacono** (SPOV 6)
   - **Who:** Economists (UC Berkeley; Duke), opposing expert witnesses in *SFFA v. Harvard*.
   - **Focus:** Harvard applicant data.
   - **Why Follow:** It shows that the reading rubric actually grades level and not the specific subject with no approved activities, devaluing the importance of prestigious hobbies.
   - **Where:** https://www.nber.org/papers/w29964

- **Raj Chetty, David Deming & John Friedman** (SPOV 6)
   - **Who:** Economists (Harvard; Harvard; Brown), Opportunity Insights.
   - **Focus:** Effects of attending a top university. 
   - **Why Follow:** This study can actually claim cause and not just correlation. They used the waitlist to study students (instead of accepted vs rejected). It shows that the richest students get admitted at much higher rates even with similar academic scores. 30% of that extra advantage of because of ECs, even though what matters of how students do after college is actually academics and not ECs. The spike we make top schools already know how to inflate. They were opposing expert witnesses who fought about interpretation and agreed on the numbers.
   - **Where:** https://www.nber.org/papers/w31492

---

## DOK 3: Insights



### Reading the child

- **Insight 1:** What a child says they like isn't actually a strong predictor so tracking voluntary return is more effective. (→ SPOV 1)
- **Insight 2:** In-session engagement is useless to track at the age we're dealing with so delayed return is more important to track. (→ SPOV 1)
- **Insight 3:** Untriggered interest decays. The discovery should be continually available. (→ SPOV 1)
- **Insight 4:** Because interest is built, handing a child a fixed label on their specialization is not optimal. (→ SPOV 1)

### Reading motivation

- **Insight 5:** How a kid feels is unreadable from facial expressions, but we can read behaviour. (→ SPOV 2)
- **Insight 6:** Praise from an adult can invert the core signal. (→ SPOV 2, SPOV 1)
- **Insight 7:** [You can't spot an unhealthy obsession by how much a kid does. The hours look the same either way.] (→ SPOV 2, SPOV 3)
- **Insight 8:** [Instead of building a detector, we run small tests and we train the adults.] (→ SPOV 2)
- **Insight 9:** [Adults are bad at reporting on a kid, and the reason is memory. Ask what they saw last week, not what they think the kid likes.] (→ SPOV 2)

### Sustaining the child

- **Insight 10:** Practice hours don't necessarily hurt a kid. Pressure is what actually hurts them. We also shouldn't tie the kids' self worth to how they perform. (→ SPOV 3)
- **Insight 11:** The kid should succeed around 85% of the time (optimally). Difficult and pressure are two different things to change and pressure comes down first. (→ SPOV 3)
- **Insight 12:** Devaluation (a kid who stops caring) is worse than a kid who gets tired. Devaluation also shows up first. (→ SPOV 3)
- **Insight 13:** Rest should optimally be 1-2 days a week. (→ SPOV 3)

### The record the child builds

- **Insight 14:** Rewards backfire on kids. Therefore our console doesn't score kids. (→ SPOV 4)
- **Insight 15:** Putting a grade & comment together does away with the good the comment does. (→ SPOV 4)
- **Insight 16:** If a parent gets too involved and sees when their kid comes back, the kid could start to come back out of only obedience which messes with our voluntary return signal. (→ SPOV 4, SPOV 1)
- **Insight 17:** Anyone can buy the crypto pieces. We change how to put them together. We also have the in-person defense. (→ SPOV 5)
- **Insight 18:** It's difficult to fully delete a kid's data when the data was initially supposed to be immutable. (→ SPOV 5)

### Proving the spike was worth building

- **Insight 19:** People usually just compare rejected vs admitted students, which is the wrong group to compare to begin with. The right group is waitlisted vs admitted. So the conclusions drawn from the original comparison are wrong. (→ SPOV 6)
- **Insight 20:** Top schools want depth and to see how good you did in a certain subject, and the subject itself doesn't matter much. (→ SPOV 6, SPOV 5)

---

## DOK 2: Knowledge Tree

Every source below changed something we built. The line after each block names what.

### Category 1: Reading the child

#### Subcategory 1.1: What a child picks versus what they come back to

- **Source: Hidi & Renninger (2006); Harackiewicz et al. (2008); Nye et al. (2012); O'Keefe, Dweck & Walton (2018)**
   - **DOK 1 - Facts:**
      - Hidi & Renninger (2006), four-phase model of interest development: the later phases are defined by self-generated re-engagement rather than by enjoyment.
      - Harackiewicz et al. (2008), N = 858: situational interest measured during a course predicted subsequent course choice across 7 semesters. Enjoyment of the lectures did not.
      - Nye et al. (2012): stated vocational interests correlate with performance and persistence at roughly r = .20 to .36.
      - O'Keefe, Dweck & Walton (2018): people holding a "fixed" theory of interest, that a passion is found rather than developed, disengage when the material becomes difficult.
   - **Shipped as:** the `prompted` flag on every interaction, the split between `cross_day_return` and `same_day_engagement`, and the product rule that a child is never told "this is your passion."
   - **DOK 2 - Summary:**
      - Asking a child what they like is a weak instrument, and enjoyment is no better. What survives is the return nobody asked for, which is why every interaction records whether we prompted it and only the unprompted ones count. O'Keefe adds the constraint on the other side: naming a child's passion for them converts it into something they can fail at, so we never do. What a kid says they like doesn't strongly predict anything. Voluntary return is what matters. Hidi, in the later phases of interest, names this "self-generated re-engagement". 
   - **Link:** https://doi.org/10.1207/s15326985ep4102_4 ; https://doi.org/10.1037/0022-0663.100.1.105 ; https://doi.org/10.1177/1745691612449021 ; https://doi.org/10.1177/0956797618780643

- **Source: Habgood & Ainsworth (2011); Rotgans & Schmidt (2017)**
   - **DOK 1 - Facts:**
      - Habgood & Ainsworth (2011), n=16, ~age 10: free-choice play totalled 75.7 minutes for the intrinsically integrated version against 10.28 minutes for the extrinsic version.
      - The same work at ages 7–8 (n=58) found that only the *delayed* test discriminated between versions (partial η² = .24). In-session engagement did not.
      - Rotgans & Schmidt (2017): four situational-interest triggers across four weeks produced a treatment interest slope of +.03 against a control slope of −.03. Untriggered interest actively declines.
   - **Shipped as:** same-day engagement scores zero in the belief math, novelty events are skipped entirely, and every triggered domain is owed four spaced re-exposures before we may stop showing it.
   - **DOK 2 - Summary:**
      - Watching a child in the moment separated nothing at the age we serve, so a first click earns no credit in our estimate at all. The second finding is the one that shapes the wall: interest left alone slides backwards rather than holding steady. That turns the menu from a one-time offer into an obligation, and it is why a domain we trigger is owed four spaced re-exposures before we are allowed to stop showing it.
   - **Link:** https://doi.org/10.1080/10508406.2010.508029 ; https://doi.org/10.1016/j.cedpsych.2017.02.003

#### Subcategory 1.2: Why inner state cannot be read from the body

- **Source: Barrett et al. (2019); EU AI Act Art. 5(1)(f)**
   - **DOK 1 - Facts:**
      - Emotion "cannot be reliably read from facial configurations"; variability is the norm.
      - The EU AI Act prohibits emotion inference in education, in force 2 February 2025.
   - **Shipped as:** the wellbeing signal type carries no affect or emotion field at all, and the ban is a structural property of the type rather than a policy note.
   - **DOK 2 - Summary:**
      - The science and the law arrive at the same answer here, which is rare and worth using. Faces do not carry emotion reliably enough to read, and since February 2025 inferring it in a school is illegal in the EU regardless. So there is no emotion field anywhere in our system. Not switched off, not permission-gated, simply absent from the type, which means no future engineer can turn it on by accident.
   - **Link:** https://doi.org/10.1177/1529100619832930 ; https://artificialintelligenceact.eu/article/5/

#### Subcategory 1.3: Why behaviour cannot name a motivational state

- **Source: Guay, Vallerand & Blanchard (2000); Ryan, Koestner & Deci (1991); Fredricks, Blumenfeld & Paris (2004)**
   - **DOK 1 - Facts:**
      - On the free-choice measure, SDT's own authors: it "is unidimensional and consequently cannot assess other important motivational concepts derived from self-determination theory, namely identified regulation, external regulation, and amotivation."
      - Ryan, Koestner & Deci (1991), three experiments: after **positive** feedback, ego-involved participants persisted **less** than task-involved ones; after nonconfirming or no feedback they persisted **more**; in neither case did they report interest, enjoyment or perceived choice.
      - Fredricks et al. (2004): "no distinction is made between effort aimed merely at fulfilling behavioral expectations and that aimed at understanding the material and mastering the content."
   - **Shipped as:** the refusal to build any motivation detector, and the `ask-whose-idea` probe a guide runs instead.
   - **DOK 2 - Summary:**
      - What makes one kind of motivation different from another is the reason behind it, and a reason never appears in a log. The people who built the field's own behavioural measure say it cannot separate them either. Worse, praise can run persistence backwards, so the same return means opposite things depending on what an adult said last session. We build no detector on top of that. A guide asks whose idea it was.
   - **Link:** https://selfdeterminationtheory.org/wp-content/uploads/2014/04/2000_GuayVallerandBlanchard_MO.pdf ; https://doi.org/10.1007/BF00995170 ; https://doi.org/10.3102/00346543074001059

- **Source: Curran et al. (2015); Raedeke (1997); Barnett, Smoll & Smith (1992)**
   - **DOK 1 - Facts:**
      - Meta-analysis of the passion literature, 94 studies and 1,308 effect sizes: harmonious and obsessive passion correlate with deliberate practice to a statistically indistinguishable degree (Hotelling's T = .48, ns); obsessive correlates slightly more with hours per week and is unrelated to objective performance.
      - Raedeke (1997, 236 age-group swimmers): attraction ("I want to be here") and entrapment ("I have to be here") produce the same attendance record; entrapped clusters carried elevated burnout.
      - Barnett, Smoll & Smith (1992), 18 Little League coaches, ~ages 10–12: next-season attrition **5% in the trained group against 26% in control**, with no difference in win-loss records; the largest self-esteem gains went to the children who started lowest.
   - **Shipped as:** the deletion of the "obsessive tipping point" field, the `interruption` and `exit` probes that replaced it, and `subtract-outcome-talk`, the one guide move graded as controlled evidence in children.
   - **DOK 2 - Summary:**
      - Hours are the one quantity an adult can actually see, and hours are exactly the quantity that cannot tell a healthy obsession from an unhealthy one. Attendance fails the same way, since a child who wants to be there and a child who feels trapped turn up equally often. We deleted the tipping-point field rather than deferring it, because the theory it borrowed from never claimed such a moment exists. What replaced it is probes a guide runs, plus work on the adults, which is where the only controlled evidence on real children sits: changing how coaches behaved cut next-season dropout from 26% to 5% without changing how often anyone won.
   - **Link:** https://doi.org/10.1007/s11031-015-9503-0 ; https://doi.org/10.1123/jsep.19.4.396 ; https://doi.org/10.1123/tsp.6.2.111

- **Source: Achenbach, McConaughy & Howell (1987); Dizon-Ross (2019)**
   - **DOK 1 - Facts:**
      - Cross-informant agreement about a child sits at r ≈ .28 and has been stable for forty years.
      - Adults judge what a child is good at far better than what a child likes: teacher judgment accuracy runs about r = .63 for achievement and markedly lower for interest.
      - Dizon-Ross (2019), N > 2,700: parents are roughly 30% wrong about which of their own two children is academically stronger, and correcting the belief causally reallocates real household investment.
   - **Shipped as:** adult report weighted at 0.25 and able to corroborate an interest but never establish one, capture that asks for a dated episode rather than an impression, and a write-only channel where the adult is never shown that their report moved anything.
   - **DOK 2 - Summary:**
      - Handing the "why" to a guide only works if adults can answer, and mostly they cannot. Two adults describing the same child agree at about r = .28, and they read what a child is good at far better than what a child enjoys. The fix is in what we ask for: a dated episode the adult actually witnessed rather than an impression of what the child is into. Dizon-Ross supplies the reason the channel is write-only, since correcting what a parent believes about their child measurably changes what that parent spends on them. A number a parent could watch move would not be a readout. It would be an intervention.
   - **Link:** https://doi.org/10.1037/0033-2909.101.2.213 ; https://doi.org/10.1257/aer.20171172

### Category 2: Sustaining the child

- **Source: Wilson et al. (2019), the 85% rule**
   - **DOK 1 - Facts:**
      - For a broad class of learning systems the optimal training error rate converges on ≈15.87%, that is, about 85% success.
   - **Shipped as:** the challenge setpoint. Push above 0.9 success, hold in the 0.8 to 0.9 band, scaffold below 0.7, on a knob kept deliberately separate from the pressure knob.
   - **DOK 2 - Summary:**
      - This is the one place we have a real number for how hard something should be, and we use it directly: hold a child near 85% success, push above it, scaffold below it. The design choice that matters more is keeping that dial separate from pressure. Backing off means the pressure comes down first and the difficulty stays where it is, because a child who is struggling usually needs less weight on the outcome rather than easier work.
   - **Link:** https://doi.org/10.1038/s41467-019-12552-4

- **Source: Raedeke & Smith (2001); Isoard-Gautheur, Guillet-Descas & Gustafsson (2016)**
   - **DOK 1 - Facts:**
      - Raedeke & Smith (2001), Athlete Burnout Questionnaire triad: exhaustion, reduced sense of accomplishment, and sport devaluation.
      - Isoard-Gautheur et al. (2016), n=458, ages 14–18: the higher-burnout profile carried 2.2–2.4× the dropout rate six years later.
   - **Shipped as:** `devaluation` as a first-class behavioural signal, the guardrail that weights devaluation above exhaustion, and the earliest escalation state firing on it.
   - **DOK 2 - Summary:**
      - Of the three parts of burnout, devaluation is the one nobody notices. A tired child looks tired; a child who has quietly stopped caring still turns up and still finishes, so attendance hides them completely. Isoard-Gautheur is the reason we treat that as urgent rather than interesting, having found the higher-burnout profile carrying more than twice the dropout six years on. So devaluation is a first-class signal in the engine, weighted above exhaustion, and it fires the earliest warning we have.
   - **Link:** https://doi.org/10.1123/jsep.23.4.281 ; https://doi.org/10.1123/tsp.2014-0140

- **Source: American Academy of Pediatrics / Brenner et al. (2024); Luthar, Kumar & Zillmer (2020)**
   - **DOK 1 - Facts:**
      - AAP clinical report: prescribes at least 1–2 rest days per week and around 3 months per year away from a given sport, and associates early specialization with overuse injury and burnout.
      - Luthar, Kumar & Zillmer (2020): students in high-achieving schools carry elevated rates of anxiety, depression, and substance use relative to national norms.
   - **Shipped as:** a rest cadence attached to every specialization plan, at two rest days per week and three months per year, incremented rather than assumed.
   - **DOK 2 - Summary:**
      - Rest usually shows up in programs like ours as a sentiment, and sentiment does not survive a busy season. The AAP gives it a dosage instead, so we attach that dosage to every plan as a number rather than leaving it to whoever is running the week. Luthar explains why we cannot treat this as optional: the elevated anxiety, depression and substance use she documents belong to high-achieving schools specifically, which is precisely the environment we are building.
   - **Link:** https://doi.org/10.1542/peds.2023-065129 ; https://doi.org/10.1037/amp0000556

### Category 3: The record the child builds

#### Subcategory 3.1: Why the record carries no score

- **Source: Deci, Koestner & Ryan (1999); Lepper, Greene & Nisbett (1973); Butler (1988)**
   - **DOK 1 - Facts:**
      - Deci, Koestner & Ryan (1999): expected, contingent tangible rewards undermine intrinsic motivation, and the effect is *more* severe for children than for college students.
      - Lepper, Greene & Nisbett (1973): an expected "Good Player" award reduced later free-play drawing in preschoolers.
      - Butler (1988): fifth and sixth graders randomly assigned to receive grades, comments, or both. Interest was highest after comments, and grades-plus-comments performed like grades alone.
   - **Shipped as:** a structural ban on streak, point, reward, xp, badge and leaderboard keys anywhere on a child-facing artifact, and a parent digest that carries the child's own words with no number a parent can watch move.
   - **DOK 2 - Summary:**
      - Rewards cost interest, and they cost children more than adults, which rules out the entire standard EdTech toolkit for our age band. Butler closes the obvious escape route. Comments raised interest, grades did not, and a grade printed beside a comment performed like the grade on its own. The number does not sit politely next to the feedback. It absorbs it. That kills the compromise everyone reaches for, so nothing in the record carries a score and the parent digest is built from the child's own words.
   - **Link:** https://doi.org/10.1037/0033-2909.125.6.627 ; https://doi.org/10.1037/h0035519 ; https://doi.org/10.1111/j.2044-8279.1988.tb00874.x

#### Subcategory 3.2: What the provenance stack proves, and what it cannot

- **Source: RFC 6962; in-toto Statement / SLSA; W3C PROV; Weber-Wulff et al. (2023); Liang et al. (2023)**
   - **DOK 1 - Facts:**
      - RFC 6962 defines the Merkle tree scheme that lets an independent verifier re-derive a root from the leaves.
      - An in-toto Statement binds signed metadata to an artifact by digest. W3C PROV supplies the provenance relation vocabulary.
      - Weber-Wulff et al. (2023): 14 AI-text detectors across 754 cases were "neither accurate nor reliable"; none exceeded 80% accuracy.
      - Liang et al. (2023): seven GPT detectors misclassified non-native (TOEFL) English at an average 61.3% false-positive rate.
   - **Shipped as:** content-addressed nodes whose id is the hash of their content, true RFC-6962 roots that preserve input order, an in-toto-shaped Statement with signing deferred, PROV bases on the node and edge taxonomy, and a spoken defense engine standing where an AI detector would otherwise sit. No detector may ever trigger a consequence for a child.
   - **DOK 2 - Summary:**
      - Every cryptographic piece here is off the shelf and we treat it that way. What it buys is proof that nobody altered the record after the fact, which is worth having and is not the thing anyone actually wants to know. Whether a human did the work is a different question, and no artifact-level test answers it. Detectors certainly do not, having failed across 754 cases and flagged non-native English writers at 61%, which is why none of ours may ever trigger a consequence for a child. A spoken defense stands in that gap instead. Being straight about the rest: signing is deferred and the transparency log still returns an empty proof.
   - **Link:** https://www.rfc-editor.org/rfc/rfc6962 ; https://slsa.dev/spec/v1.0/provenance ; https://www.w3.org/TR/prov-o/ ; https://doi.org/10.1007/s40979-023-00146-z ; https://www.cell.com/patterns/fulltext/S2666-3899(23)00130-7

#### Subcategory 3.3: The deletion frontier

- **Source: COPPA; EDPB Guidelines 02/2025 v2.0; NIST SP 800-88 Rev. 2 (2025)**
   - **DOK 1 - Facts:**
      - COPPA governs under-13 data and requires verifiable parental consent; the 2025 amendments bar indefinite retention and require a written retention policy, compliance date 2026-04-22.
      - EDPB Guidelines 02/2025, version 2.0 adopted 2026-07-07: technical immutability "cannot be invoked to justify non-compliance" with the right to erasure; crypto-shredding is a supplement rather than a complete guarantee; personal data should not be placed on an immutable structure even in hashed form.
      - NIST SP 800-88 Rev. 2 (2025): Cryptographic Erase counts as Purge only when every copy of the key is destroyed.
   - **Shipped as:** consent gating that blocks live child data, and the honest admission that this is the unsolved half. A content-addressed node's id *is* the hash of its content, the erasure service returns a stub tombstone, and no key lifecycle exists yet.
   - **DOK 2 - Summary:**
      - The regulators have closed the excuse we would otherwise be tempted by. A system that cannot change is not thereby exempt from deleting, hashing is not anonymising, and crypto-shredding only counts if every copy of the key is genuinely gone. That is a hard bar and we do not clear it. Our node identifiers are hashes of the content they describe, the erasure service returns a stub, and there is no key lifecycle yet. Live child data is blocked at the consent gate for exactly that reason. A document arguing that provenance should be honest cannot make an exception for its own.
   - **Link:** https://www.ecfr.gov/current/title-16/chapter-I/subchapter-C/part-312 ; https://www.edpb.europa.eu/our-work-tools/documents/public-consultations/2025/guidelines-022025-processing-personal-data_en ; https://csrc.nist.gov/pubs/sp/800/88/r2/ipd

### Category 4: Proving the spike was worth building

- **Source: *SFFA v. Harvard* discovery. Reading Procedures, Class of 2023 (HARV00097939); Card expert report Exhibits 4 and 5**
   - **DOK 1 - Facts:**
      - Verbatim extracurricular rating: "**1.** Unusual strength in one or more areas. Possible national-level achievement or professional experience… Truly unusual achievement. **2.** Strong secondary school contribution in one or more areas such as class president, newspaper editor, concertmaster… **3.** Solid participation but without special distinction." The scale enumerates **no** qualifying activity anywhere.
      - Card Exhibit 4, six years of domestic applicants: academic 1 with no other 1s → 68%; **extracurricular 1 with no other 1s → 48%**; four ratings of 2 → 68%; athletic 1 with no other 1s → 88%; **no rating of 1 or 2 on any dimension (n ≈ 56,000) → 0.1%**.
      - Card Exhibit 5: ~42% of applicants earn an academic 1 or 2, but fewer than 25% earn a 1 or 2 on each of the other three dimensions; only **7%** earn a 2 or better on at least three.
      - A separate **academic** rating rewards "possible national or international level recognition in academic competitions", so one academic-competition result scores on two axes.
      - Supplementary faculty review exists for **music, art, dance and academic** work only; MIT offers exactly four portfolios. The Common App has 29 activity categories and none for games, puzzles or tabletop.
   - **Shipped as:** the reason the evidence record exists at all. It is a verification channel for pursuits that have none, and the catalogue is built around pursuits with a real external standard and venue.
   - **DOK 2 - Summary:**
      - The rubric grades how far a child got and never what they chose, and it names no approved activity anywhere, so the folk ranking of impressive hobbies is simply not in the instrument. The admit-rate table people quote does not say what they think either, because every row of it excludes applicants with another top rating, which pits a spike from a child without the grades against a well-rounded one. Our profile never appears in it. Where the subject genuinely matters is verification, since a competition result triggers a second rating and music and art get read by faculty while a great many pursuits have no route at all. That absence is the gap the record fills.
   - **Link:** https://samv91khoyt2i553a2t1s05i-wpengine.netdna-ssl.com/wp-content/uploads/2018/06/Doc-421-1-Card-Report.pdf

- **Source: Arcidiacono, Kinsler & Ransom (2022); Chetty, Deming & Friedman (2025)**
   - **DOK 1 - Facts:**
      - Logit coefficients on admission: academic rating 1 → **4.094**; extracurricular rating 1 → **4.232**; academic 2 → 1.425; extracurricular 2 → 1.990. At the bottom of the scale the asymmetry reverses, and a weak academic rating is roughly three times as damaging as a weak extracurricular one.
      - Chetty et al., using waitlist variation across Ivy-Plus colleges: ~**30%** of the admissions advantage held by top-1% applicants is explained by stronger **non-academic** ratings; conditional on test scores, private-school students have **no higher academic ratings but much higher non-academic ratings**; non-academic ratings are uncorrelated or negatively correlated with post-college outcomes, while academic credentials predict them.
   - **Shipped as:** the additive framing of the whole program, floor first and spike second, and the reason the record documents process rather than polish.
   - **DOK 2 - Summary:**
      - The coefficients settle the shape of the program. A top academic rating and a top activity rating are worth almost the same and they add rather than trade, so the floor comes first and the spike sits on top of it. Chetty is the part we would rather not print. Much of the advantage rich applicants hold runs through the non-academic rating, private-school students earn better non-academic ratings on identical test scores, and that rating does not predict how anyone turns out afterwards. Our answer is narrow but real: what Chetty measures is a rating, and a rating is one reader's impression of a file. Expensive schools are good at producing impressive files. A verifiable record of how the work was actually made is a different object, and the distance between the two is the whole reason we build one.
   - **Link:** https://www.nber.org/papers/w29964 ; https://www.nber.org/papers/w31492

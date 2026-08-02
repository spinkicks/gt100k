# Research: What direct empirical evidence exists on how children aged 8-14 actually experience and understand learning-record, digital-credential, data-provenance, authorship-tracking, or AI-use-disclosure interfaces? Specifically: do children find such records legible, motivating, trustworthy, or stigmatizing/surveilling; does declaring AI assistance carry shame; and what UI design choices reduce that. Seeking user studies, usability research, and controlled trials with children, not adult/college populations.

_2026-08-01_

## Summary
Direct empirical evidence on how 8-14 year-olds experience learning-record, credential, provenance, authorship, or AI-disclosure interfaces is thin and largely indirect: no study located tests a learning-record or digital-credential UI with children of this age and measures legibility, motivation, or stigma directly; the closest work studies AI trust, data-ownership understanding, and school datafication. What evidence exists shows children this age understand data and consent only when framed concretely ("asking before taking," not "data sharing"), systematically misunderstand institutional/commercial data collection because they reason through an interpersonal control frame, and often experience school data tracking as surveillance producing "digital resignation" and powerlessness rather than legible, motivating records. On AI specifically, trust is age-graded and design-sensitive (younger children over-attribute intelligence; older children are more skeptical, especially after errors; apologies and paired visual+verbal error presentation help), and disclosure UI matters — a simple AI-use label outperformed a detailed one with adolescents. The one direct signal on AI-use shame comes from cheating-accusation anxiety that rises with grade level and from a generational split where kids see school AI use as innovative while parents see it as unethical; however, the main AI-disclosure-shame study is on college students, not this age band. Adult-worded, abstract trust/consent items are consistently poorly understood by 9-11 year-olds, so child-centred, concrete, developmentally-differentiated framing is the clearest actionable design lever.

## Findings

### 1. There is essentially no direct usability evidence on learning-record, digital-credential, data-provenance, or authorship-tracking interfaces tested with children aged 8-14; the field is emerging (IDC 2025 has relevant full papers on children's data/agency, teen algorithm auditing, and privacy co-design) but published findings on record/credential UI with children are absent, and the main AI-disclosure-shame study is on college students, not this age band.
**Confidence:** high
**Sources:** <https://idc.acm.org/2025/accepted-full/>, <https://dl.acm.org/doi/full/10.1145/3713043.3734471>, <https://dl.acm.org/doi/10.1145/3706598.3713393>, <https://arxiv.org/abs/2502.14217>

IDC 2025 accepted full papers include 'Navigating the Future of Data-Driven Systems: Children's perspectives on data and agency' [40], 'Teens, Privacy, and Algorithms: ...Co-Designing Solutions for Interpersonal Boundary Management' [41], and 'Youth as Advisors...Everyday Algorithm Auditing' [42] — confirming active work but with findings not on the listing. The child-CAI trust item [44] and related workshop [45][46] are workshop proposals aiming to produce transparency guidelines, not empirical findings reports, and the chatbot study [31] explicitly does not address disclosure interfaces, stigma, learning records, or credentialing UI. The one AI-non-disclosure-shame study [47][48][49] is a mixed-method study (survey n=97 plus 15 student + 9 teacher interviews) explicitly on college/higher-ed students, framing non-disclosure through cognitive dissonance — so it does not directly bear on the 8-14 band.

### 2. Children aged ~8-12 grasp data, consent, and ownership only when framed concretely, not abstractly: they spontaneously object to systems 'taking things without asking' yet misunderstand shared/platform ownership of their own data because they reason through an interpersonal-control frame — implying record/provenance UI must use concrete, relational language rather than abstract data terms.
**Confidence:** high
**Sources:** <https://dl.acm.org/doi/10.1145/3772318.3790765>, <https://www.sciencedirect.com/science/article/abs/pii/S2212868922000058>, <https://www.cogitatiopress.com/mediaandcommunication/article/view/3407>

Children engage with privacy/consent 'only when framed concretely (e.g. asking before taking rather than data sharing)' [1], and many spontaneously voiced discomfort about systems 'taking things without asking,' showing intuitive ownership awareness [2] (CHI 2026 child-trust-scale study, N=289, ages 9-11). An empirical study of 63 fifth/sixth-graders using activity trackers [5] found they misunderstood ownership of self-generated data, not grasping shared ownership agreed via platform terms [6] (Agesilaou & Kyza 2022, IJCCI). UK children 11-16 (N=169) 'mainly frame privacy through interpersonal relationships...over which they have agency and control,' producing 'misapprehensions about how personal data is collected, inferred and used by organizations' [25], and their trust in familiar institutions like schools combined with this frame yields a 'doubly problematic orientation' leaving institutional data records illegible [26].

### 3. Making institutional data records legible to children likely requires design/institutional change, not child education alone, because the digital data environment's complexity exceeds even teachers' capacity to close children's knowledge gaps.
**Confidence:** high
**Sources:** <https://www.cogitatiopress.com/mediaandcommunication/article/view/3407>

Stoilova, Livingstone & Nandagiri (2020) argue the digital environment's complexity 'exceeds even teachers' ability to close children's knowledge gaps,' calling for shared responsibility among 'businesses, educators, parents and the state' to build a 'legible, transparent and privacy-respecting digital environment' [27]. This reframes legibility as a system/UI-design responsibility rather than something achievable by teaching children better.

### 4. Children experience school data tracking largely as surveillance and power/accountability enforcement, feeling powerless and 'distanced' rather than empowered by records; their dominant orientation is 'digital resignation'/'surveillance realism' — resigned acceptance, not trust or motivation.
**Confidence:** high
**Sources:** <https://www.tandfonline.com/doi/full/10.1080/0305764X.2023.2215194>, <https://cdt.org/press/cdt-survey-research-finds-use-of-ai-in-k-12-schools-connected-to-negative-effects-on-students-including-their-real-life-relationships/>

A focus-group study of 62 Australian secondary students frames school datafication in terms of 'power, surveillance and affect' and schools' use of data 'to enforce student accountability and self-regulation' [21], finding students' 'relatively constrained and distanced relations' and 'perceived powerlessness to engage agentically' [22]. The authors conclude students' orientation reflects 'digital resignation' and 'surveillance realism' [23] (confidence medium for this interpretive framing). CDT's 2024-25 survey adds that half of students agreed AI use in class makes them feel less connected to their teacher [36].

### 5. The surveillance framing is not total: children 10-11 perceive online spaces as pervasively watched yet still exercise agency within them, so a sense of being tracked does not necessarily make children wholly disempowered.
**Confidence:** medium
**Sources:** <https://onlinelibrary.wiley.com/doi/full/10.1111/chso.12835>

Children 10-11 perceive online/social spaces as pervasively surveilled 'yet still exercise agency, not wholly disempowered' [24] (Children & Society, Wiley). This tempers the school-datafication powerlessness finding [22] — the two operate in different domains (school-imposed data systems vs. children's own online spaces), suggesting agency is retained where children have control but eroded where records are institutionally imposed.

### 6. Children's trust in AI is age-graded and legibility of AI is not uniform: younger children (grades 3-5) attribute AI's answers to inherent intelligence while older children (6-8) see it as a pattern recognizer, and children hold multiple distinct mental models (deductive, inductive, inherent) of how AI reasons.
**Confidence:** high
**Sources:** <https://arxiv.org/pdf/2505.16031>

A field study of 106 children grades 3-8 found understanding of AI reasoning differs systematically by age — younger children attribute reasoning to 'inherent intelligence,' older children recognize AI as 'a pattern recognizer' [9] — and identified three mental models: Deductive, Inductive, and Inherent [10] (confidence medium; arXiv preprint). This means any AI-provenance/disclosure UI will land differently across the 8-14 band.

### 7. Children's trust in AI is calibratable and design-sensitive rather than fixed: authoritative tone can drive over-trust in younger children, but across controlled studies children more often show moderate, cautious trust; older children are more skeptical and withdraw trust fastest for errors framed as intentional, and behavioral design (apologies, paired visual+verbal error presentation) measurably shapes trust.
**Confidence:** medium
**Sources:** <https://arxiv.org/pdf/2505.16034>, <https://dl.acm.org/doi/10.1145/3772318.3790765>, <https://www.sciencedirect.com/science/article/pii/S0010027724001008>, <https://arxiv.org/abs/2502.14217>

AI's authoritative tone/structured output 'can create an illusion of correctness, leading to overtrust, especially among children' [0], and textual AI errors are harder for children to detect than visual ones, so pairing visual+verbal reduces load and aids detection [8]. Countervailingly, across three studies (N=289, 9-11) children 'did not over-trust or distrust...most adopted a cautious and balanced stance' [12]. In a Cognition study, older children were less trusting and 'even more skeptical after errors' [32], attended to intent — 'trust decreased most rapidly when errors were intentional' [33] — and a robot apologizing 'maintained their trust for longer' [34], with authors concluding edtech 'cannot be one size fits all' [35]. A K-8 chatbot study found high trust ('knowledgeable,' 'smart,' 'trust it') [28] but also spontaneous trust-calibration by testing with known-answer questions [29] and openness/anthropomorphizing [30]. CONFLICT: [0] (over-trust) vs [12] (moderate cautious trust) — likely reconciled by age and study context (younger/authoritative-tone contexts drive over-trust; controlled multi-session studies show calibration).

### 8. A simpler AI-disclosure interface outperforms a detailed one for adolescents: in a controlled field experiment a simple AI-use label raised attention and trust in bots (though it lowered trust in and sharing of AI news), while detailed disclosure lowered engagement overall — and effects were moderated by individual differences such as internet-usage intensity.
**Confidence:** high
**Sources:** <https://www.researchgate.net/publication/402930951_See_trust_and_interact_how_AI_disclosure_shapes_high_school_students'_trust>

Randomized between-subjects study (no/simple/detailed disclosure) with eye-tracking, questionnaires and interviews, 60 high-school students in Henan, China [13]. Simple disclosure 'increased attention and trust in AI bots but reduced trust and sharing for news content' [3]; detailed disclosure 'lowered engagement overall...strongly reducing news-sharing' [4] (confidence medium). Individual differences moderated effects: light internet users benefited most from simple labels, heavy users from detailed explanations [14]. Caveat: N=60, single site, adolescents older than the core 8-14 band.

### 9. There is a real shame/stigma signal around declaring AI use, but it is documented mainly via cheating-accusation anxiety and a generational moral split — not via studies of disclosure UI: students increasingly worry about being accused of AI cheating and perceive teacher surveillance of homework (both rising with grade level), yet most do not consider AI use cheating except for getting direct answers, so disclosure norms are context-dependent rather than uniformly shameful.
**Confidence:** high
**Sources:** <https://www.rand.org/pubs/research_reports/RRA4742-1.html>, <https://www.commonsensemedia.org/sites/default/files/research/report/commonsensemedia_generationai.pdf>, <https://cdt.org/press/cdt-survey-research-finds-use-of-ai-in-k-12-schools-connected-to-negative-effects-on-students-including-their-real-life-relationships/>

RAND (n=1,214 youth, Dec 2025): students in higher grades were more likely to worry about being accused of using AI to cheat [18] and to believe teachers were checking homework for AI use [19]; but 'with the exception of using AI to get answers,' most did not consider their AI use cheating [20] (confidence medium). Common Sense Media surveys show kids use AI more than parents realize, especially for learning [16], and a generational split: 52% of kids see school AI use as innovative/encouraged vs 52% of parents calling it unethical [17]. CDT names 'student activity monitoring' and 'treating students unfairly' among AI risks [37] but its student sample is only 9th-12th graders (n=1,030, ~14-18) [38] and it does not quantify how students feel about being monitored [39]. Caveat: RAND/CDT/CSM populations skew older than 8-14.

### 10. Adult-oriented, abstractly worded trust and consent items are poorly understood and psychometrically weak with 9-11 year-olds, making adult-derived UI copy and survey instruments a poor fit for this age band.
**Confidence:** high
**Sources:** <https://dl.acm.org/doi/10.1145/3772318.3790765>

In the CHI 2026 child-centred K-AI Trust Scale study (N=289, ages 9-11), abstract adult-centric items (e.g. 'My tendency to trust computers is high') 'were poorly understood and displayed weak factor loadings' [11] and were excluded. This is the same concrete-framing lesson from [1] applied to instrument/UI wording, and directly supports child-centred, concrete language as a design requirement.

### 11. Existing digital-badge/credential motivation evidence for children is indirect — derived from grant proposals and staff interviews, not from child learners themselves — so claims that badges motivate children rest on designer intent rather than measured child experience.
**Confidence:** high
**Sources:** <https://repository.isls.org/bitstream/1/927/1/1027-1031.pdf>

The ICLS 2014 'Design Principles for Motivating Learning with Digital Badges' study drew on project proposals and phone/in-person interviews with project staff about 'design decisions they made to motivate learners' [15]; no data was gathered from child learners. This is the closest located credential-motivation evidence and it does not directly measure whether children find badges/credentials motivating, legible, or trustworthy.

## Conflicting evidence
- "AI's authoritative tone and structured output can produce an illusion of correctness that leads children to overtrust its answers." **vs** "Children did not systematically over- or under-trust the AI systems they interacted with; across three studies mean trust was moderate and children adopted a cautious, balanced stance rather than blind reliance or rejection." — [0] children overtrust AI due to authoritative tone; [12] children showed moderate, cautious trust with no systematic over-trust.
- "Students reported feeling powerless and distanced in relation to school technology and data practices, rather than finding data records legible or empowering." **vs** "Children aged 10-11 perceive digital/social-media spaces as pervasively surveilled ('they are watching you do everything online') yet still exercise agency within them, rather than being wholly disempowered by the sense of being watched." — [22] students feel powerless/disempowered by data practices; [24] children feel watched yet retain agency, not wholly disempowered (different domains: school data vs online spaces).

## Caveats
Population fit is the dominant caveat: several of the strongest sources study populations older or younger than 8-14. RAND, CDT (9th-12th grade, n=1,030, ~14-18), Common Sense Media, and the Henan disclosure experiment (high schoolers) skew toward adolescents; the Cognition trust study and 'AI Puzzlers'/chatbot studies include ages 6-11/K-8 (i.e., some below 8). The central AI-disclosure-SHAME study is entirely college-age and does NOT bear on the target band. No located study directly tests a learning-record, digital-credential, provenance, or authorship-tracking UI with children and measures legibility/motivation/stigma; findings on datafication and AI trust are the nearest proxies. Several key sources are non-peer-reviewed arXiv preprints (children's mental models, AI Puzzlers, chatbot study) or small (N=60 disclosure experiment, n=63 tracker study, exploratory chatbot n=63 with 3-10 min exposure), and several IDC 2025 items are workshop proposals or listing entries whose findings were not accessible. TWO CONFLICTS: (a) AI over-trust from authoritative tone [0] vs. moderate/cautious trust with no systematic over-trust [12] — reconcilable by age and study design; (b) students feeling powerless/disempowered by school data practices [22] vs. children feeling watched yet retaining agency online [24] — reconcilable by domain (institution-imposed records vs. children's own online spaces). Recency: RAND (Dec 2025), CDT (2024-25), CSM (Mar 2026) reflect a fast-moving AI-in-schools landscape and may shift quickly. Access limits (ACM/ScienceDirect/Taylor&Francis 403s) meant some quotes were verified via metadata, archives, or corroborating coverage rather than full text.

## Open questions
- Does any controlled study test an actual learning-record, credential, or AI-provenance/authorship UI with children aged 8-14 and measure perceived legibility, motivation, and stigma directly — or is the entire evidence base still proxied through AI-trust and datafication research?
- At what age and under what UI framing does declaring AI assistance shift from neutral/expected to shameful for children — and do concrete, non-punitive, relational disclosure labels (per the 'asking before taking' and simple-label findings) reduce that shame in the 8-14 band specifically?
- Which specific UI choices (concrete relational language, visual+verbal pairing, apology/repair affordances, simple vs. detailed disclosure) most reduce a surveillance/stigma reading of a personal learning record for children, and do these interact with the age-graded trust differences between grades 3-5 and 6-8?
- Can a learning record be designed so children experience it as self-owned and agentic (like their own online spaces, where agency is retained) rather than as institutionally imposed surveillance (like school datafication, where powerlessness dominates)?

## Sources
- <https://www.solaresearch.org/2022/03/dashboards-for-learners-dont-always-motivate-them/> (secondary)
- <https://arxiv.org/pdf/2505.16034> (primary)
- <https://arxiv.org/pdf/2505.16031> (primary)
- <https://dl.acm.org/doi/10.1145/3772318.3790765> (primary)
- <https://www.researchgate.net/publication/402930951_See_trust_and_interact_how_AI_disclosure_shapes_high_school_students'_trust> (primary)
- <https://repository.isls.org/bitstream/1/927/1/1027-1031.pdf> (primary)
- <https://sfstandard.com/2026/07/19/teens-ai-use-shame-adults/> (blog)
- <https://www.commonsensemedia.org/sites/default/files/research/report/commonsensemedia_generationai.pdf> (primary)
- <https://www.rand.org/pubs/research_reports/RRA4742-1.html> (primary)
- <https://www.tandfonline.com/doi/full/10.1080/0305764X.2023.2215194> (primary)
- <https://onlinelibrary.wiley.com/doi/full/10.1111/chso.12835> (primary)
- <https://www.sciencedirect.com/science/article/abs/pii/S2212868922000058> (primary)
- <https://link.springer.com/article/10.1007/s42438-024-00468-2> (secondary)
- <https://www.bentley.edu/centers/user-experience-center/usabilitytestingwithminors> (secondary)
- <https://arxiv.org/pdf/2604.21733> (primary)
- <https://arxiv.org/abs/2502.14217> (primary)
- <https://www.sciencedirect.com/science/article/pii/S0010027724001008> (primary)
- <https://cdt.org/press/cdt-survey-research-finds-use-of-ai-in-k-12-schools-connected-to-negative-effects-on-students-including-their-real-life-relationships/> (primary)
- <https://idc.acm.org/2025/accepted-full/> (primary)
- <https://www.sciencedirect.com/science/article/pii/S2666920X25000049> (unreliable)
- <https://www.tandfonline.com/doi/abs/10.1080/10447318.2024.2431363> (unreliable)
- <https://www.sciencedirect.com/science/article/pii/S0001691825001374> (unreliable)
- <https://www.cogitatiopress.com/mediaandcommunication/article/view/3407> (primary)
- <https://dl.acm.org/doi/full/10.1145/3713043.3734471> (primary)
- <https://dl.acm.org/doi/10.1145/3706598.3713393> (primary)
- <https://cs.uchicago.edu/news/are-students-hiding-their-ai-use-the-social-stigma-behind-ai-use-in-the-classroom/> (secondary)
- <https://arxiv.org/abs/2602.04023> (primary)
- <https://www.tandfonline.com/doi/full/10.1080/0144929X.2024.2313147> (unreliable)
- <https://link.springer.com/article/10.1007/s11528-025-01051-7> (primary)
- <https://link.springer.com/chapter/10.1007/978-3-031-50139-5_3> (unreliable)

---
_Generated by deep-research v2 · 11 findings from 30 sources._
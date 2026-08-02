# Research: What is the real per-student cost, latency, and throughput of serving LLM-based Socratic/tutoring dialogue to very large K-8 student populations (tens of thousands to 100,000 students)? Seeking corroborated, non-single-vendor evidence on cost-per-student-per-year, the cost impact of model routing/cascades and continuous batching, and whether small or fine-tuned models meet the pedagogical and child-safety bar for young children at scale. Distinguish measured deployments from vendor marketing.

_2026-08-01_

## Summary
Measured and benchmarked evidence converges on a real per-student LLM-tutoring cost in the low single-digit to low-tens of dollars per student per year: the ITAS multi-agent deployment (Gemini 2.5 Flash, ~7,438 tokens/interaction) projects roughly $2.63-$4.79/student/semester at a plausible 675-question load, and per-turn costs range from a fraction of a cent (Gemini Flash) to ~2.5 cents (Claude Sonnet); across the corpus the range lands at roughly $3-$70/student/year. Khan Academy's Khanmigo is the closest real vendor anchor, bundling its GPT-4-based tutor into per-student district licenses (published ~$10-$15/student/year for =1,000 seats, standalone add-on list prices up to $90, consumer tier $44/year), though at-scale (>1,000-seat) pricing is quote-only. Cost is dominated by serving efficiency rather than sticker price: continuous batching + PagedAttention (vLLM) yields up to a ~23-44x throughput/cost swing versus naive serving and let one operator halve its GPU fleet, while model routing/cascades (FrugalGPT, RouteLLM, MixLLM, CARROT) can retain ~95-97% of frontier quality at ~15-30% of cost — but only an idealized oracle router hits that ceiling, and practical routers barely beat a trivial baseline and depend heavily on judge accuracy. The critical unresolved gap is pedagogical/child-safety fitness: benchmarking shows current LLMs only marginally reproduce established ITS adaptivity (small Llama3-8B scored higher on pedagogical soundness but failed instruction-following), and no source benchmarks the 100,000-concurrent K-8 target, so whether small/quantized models clear the bar for young children at scale is genuinely open.

## Findings

### 1. Real per-student LLM-tutoring cost, from the one instrumented multi-agent deployment (ITAS on Gemini 2.5 Flash, ~7,438 tokens/interaction, 6,671 in / 767 out), is ~$2.63 (Standard PayGo) to ~$4.79 (Priority PayGo) per student under a plausible 675-question semester.
**Confidence:** high
**Sources:** <https://arxiv.org/pdf/2604.24110>

ITAS is a measured deployment (3,100 requests) reporting measured token counts; the per-student figure is a load scenario projection, not a raw measurement, and rests on a single non-peer-reviewed preprint using one vendor.

### 2. Per-Socratic-session cost spans from a fraction of a cent to ~2.5 cents depending on model tier: ~$0.025 on Claude Sonnet 4.6, ~$0.009 on Haiku 4.5, ~$0.002 on Gemini 3 Flash (1,000 in + 1,500 out tokens); aggregate published benchmarks cluster at roughly $3-$70/student/year.
**Confidence:** medium
**Sources:** <https://ibl.ai/blog/what-ai-tutoring-actually-costs-2026>, <file:///Users/felipecaicedo/code/gt100k/RESEARCH-what-are-the-real-world-cost-latency-throughput-an-2026-07-20.md>

Per-turn figures come from a single non-vendor cost blog restating token-price math; the $3-$70/yr band leans heavily on the ITAS preprint's extrapolation, so 'converge' overstates independent agreement. A district-scale estimate (~$2,931/mo for 50,000 students via direct Sonnet API) exists but is low-confidence and internally inconsistent within its source.

### 3. Khan Academy's Khanmigo is the leading real vendor anchor: the GPT-4-based tutor is bundled into per-student district licenses at a published ~$10-$15/student/year for =1,000 seats (with a ~$5 add-on delta over the non-Khanmigo tier), standalone add-on list prices reach $90/student, consumer tier is $44/year ($4/mo), it is free for teachers, and child-safety moderation flags are bundled (not metered).
**Confidence:** high
**Sources:** <https://www.khanacademy.org/schools/pricing>, <https://www.khanmigo.ai/pricing>, <https://blog.khanacademy.org/becoming-a-khan-academy-districts-partner/>, <https://aiforcause.org/stories/khanmigo-ai-tutor>, <https://www.edisonos.com/alternatives/khan-academy-pricing>

Grounded in Khan Academy's own primary pricing pages plus independent trade press. Prices are time-sensitive and tier-dependent; the $15-$90 spread reflects genuine differences between the bundled district rate and the standalone Student Tutor add-on list price.

### 4. Khan Academy publicly cut its Khanmigo district price from $60 to $35/student/year (Nov 2023), attributing the cut to engineering work reducing computational cost, and does not publish per-student pricing above 1,000 licenses — at-scale/district pricing is quote-only.
**Confidence:** high
**Sources:** <https://thejournal.com/articles/2023/11/16/khan-academy-cuts-district-price-of-khanmigo-ai-teaching-assistant.aspx>, <https://www.khanacademy.org/schools/pricing>, <https://www.khanmigo.ai/pricing>

$35 (Nov 2023 trade press) and the current $15 bundled district rate (2026 vendor blog) conflict directly and likely reflect different dates/plans; both are non-marketing anchors but time-sensitive. The absence of published >1,000-license pricing means the real cost-per-student at the 10k-100k target cannot be read off vendor pages.

### 5. Serving efficiency, not sticker price, dominates per-student cost: continuous batching + PagedAttention (vLLM) delivers up to 23x throughput over naive static batching (8x continuous-only, 4x optimized-static; up to 24x over HuggingFace, 2.2-2.5x over TGI), and drives a ~44x cost-per-token gap between batch-1 ($20.32/1M) and saturated batch-128 (~$0.45-0.46/1M) on a single H200; LMSYS halved its serving GPU fleet with vLLM.
**Confidence:** high
**Sources:** <https://www.anyscale.com/blog/continuous-batching-llm-inference>, <https://www.digitalocean.com/community/tutorials/llm-inference-cost>, <https://vllm.ai/blog/2023-06-20-vllm>

Throughput multipliers are 2023 lab micro-benchmarks (real-world sustained gains commonly 4-8x); the 44x figure and GPU-halving are from a vendor cost tutorial and the vLLM/LMSYS blog respectively (single-vendor self-reports). Batch utilization is the most controllable cost lever independent of hardware price.

### 6. Latency and throughput at classroom scale are governed by serving tier and batching, not just model choice: ITAS held a flat 3.5-4.0s median from 1-50 concurrent users on Priority PayGo while Standard degraded to 9.3s and reserved-capacity throughput saturated ~20 users; a naive self-hosted Mistral-7B broke down at 5-10 concurrent users (11s->40s->65s) but vLLM+quantization cut it to ~3s single-user with ~10x throughput and no added hardware.
**Confidence:** high
**Sources:** <https://arxiv.org/pdf/2604.24110>, <https://www.zenml.io/llmops-database/scaling-self-hosted-llms-with-gpu-optimization-and-load-testing>

ITAS latency measured only to 50 concurrent users on one graduate STEM deployment; Mistral figures from a single LLMOps case study. No source benchmarks the 100,000-concurrent target, so at-scale latency/throughput remains an extrapolation.

### 7. Model routing/cascades can retain ~95-97% of frontier quality at ~15-30% of cost because API per-token prices vary by up to two orders of magnitude (10M tokens: $30 GPT-4 vs $0.2 GPT-J) and 2-5x for comparable quality: FrugalGPT matches GPT-4 with up to 98% cost reduction (or +4% accuracy at equal cost), RouteLLM ~85% savings at 95% quality (strong model on ~14% of queries), MixLLM 97.25% quality at 24.18% cost, CARROT matches GPT-4o at ~30% cost.
**Confidence:** medium
**Sources:** <https://ar5iv.labs.arxiv.org/html/2305.05176>, <https://arxiv.org/abs/2305.05176>, <https://arxiv.org/abs/2406.18665>, <https://arxiv.org/abs/2502.03261>, <file:///Users/felipecaicedo/code/gt100k/RESEARCH-what-are-the-real-world-cost-latency-throughput-an-2026-07-20.md>

Headline savings (esp. 98%) are best-case, dataset-specific, author-self-reported results on general benchmarks (MT-Bench, MMLU), not K-8 Socratic dialogue; MixLLM/RouteLLM are peer-reviewed conference primaries which strengthens the mid-range 76-85% savings figures. No independent cross-vendor field corroboration.

### 8. The routing cost ceiling is only reached by an idealized oracle router (e.g. beat GPT-4 accuracy at ~1/14 the cost on MMLU, seldom selecting the strongest model); practical routers realize far less — in RouterBench predictive KNN/MLP routers did not significantly outperform a trivial no-cost 'Zero router' across tasks, gains are task-dependent, routers do transfer across model pairs, and cascade savings collapse once the judge's error rate exceeds ~0.2.
**Confidence:** high
**Sources:** <https://arxiv.org/abs/2403.12031>, <https://www.themoonlight.io/en/review/routerbench-a-benchmark-for-multi-llm-routing-system>

Direct internal tension in the evidence: the oracle/near-optimal framing (in principle) versus practical routers barely beating baseline (in practice), and low-confidence claims of large realized district savings (~70x) were refuted in the corpus. Realized savings depend on judge accuracy and task mix, so routing economics for K-8 Socratic tutoring specifically are unproven.

### 9. Whether small or fine-tuned models meet the pedagogical and child-safety bar for young children at K-8 scale is unresolved: across 75 ITS scenarios / 1,350 instructional moves even the best LLMs only marginally reproduced established ITS adaptivity, and the authors conclude current LLM tutoring is unlikely to rival known-effective ITS learning benefits. Notably a small Llama3-8B scored higher on pedagogical soundness than Llama3-70B and GPT-4o but failed on instruction-following/formatting — small models are not categorically worse pedagogically, but no source benchmarks the 100,000-concurrent K-8 target.
**Confidence:** high
**Sources:** <https://link.springer.com/content/pdf/10.1007/978-3-031-98417-4_29.pdf>, <file:///Users/felipecaicedo/code/gt100k/RESEARCH-what-are-the-real-world-cost-latency-throughput-an-2026-07-20.md>

Adaptivity study is peer-reviewed (AIED 2025) but benchmarked an algebra ITS (Lynnette), so the K-8 framing is an extrapolation. Routing benchmarks measure general quality (MT-Bench/MMLU), not young-child Socratic dialogue or child-safety, so tutoring quality could force more frontier escalation than cost benchmarks imply.

## Conflicting evidence
- "Khan Academy set the Khanmigo district price at $35 per student per year, cut from a previous $60 per student per year." **vs** "Khan Academy's Khanmigo AI tutor is priced at $15 per student per year for school districts (and $44/year for individual families)." — Khanmigo district price stated as $35/student/year vs $15/student/year (may reflect different dates/plans, but the stated district price directly conflicts).
- "Khan Academy set the Khanmigo district price at $35 per student per year, cut from a previous $60 per student per year." **vs** "Khan Academy prices a district partnership that includes Khanmigo (its AI Socratic tutor) at $15 per student, versus $10 per student for the same MAP Growth Learning Paths product without Khanmigo — implying the LLM-tutor add-on carries roughly a $5/student list price." — Khanmigo district price stated as $35/student/year vs $15/student/year for the district partnership.
- "Proper LLM routing can approach the cost-efficiency of an Oracle that selects the best-performing and least-expensive model, demonstrating that routing yields near-optimal cost-quality tradeoffs in principle." **vs** "In RouterBench's benchmark, practical routers (predictive and non-predictive) did not consistently beat a no-cost 'Zero router' baseline across all tasks, indicating routing gains are task-dependent rather than universal." — Same source: routing 'approaches Oracle/near-optimal' (optimistic, in principle) vs practical routers 'did not consistently beat a no-cost Zero baseline' (skeptical, in practice).
- "Practical predictive routers (KNN/MLP) matched but did not significantly outperform a simple probabilistic-mix baseline, so real-world routing gains fall well short of the oracle ideal." **vs** "Learned LLM routers can dynamically dispatch each query between a strong (expensive) and a weak (cheap) model at inference time, reducing cost by more than 2x in certain cases while preserving response quality on public benchmarks." — [19] finds practical learned routers barely beat a simple probabilistic-mix baseline; [5] claims learned routers deliver real >2x cost cuts while preserving quality.
- "Practical predictive routers (KNN/MLP) matched but did not significantly outperform a simple probabilistic-mix baseline, so real-world routing gains fall well short of the oracle ideal." **vs** "Model routing/cascade architectures retain 95-97% of frontier quality at 15-25% of the cost, with RouteLLM achieving ~85% cost savings at 95% of GPT-4 quality (strong model needed on only 14% of queries) and MixLLM reaching 97.25% of GPT-4 quality at 24.18% of cost." — [19] says real-world routing gains fall well short of the oracle ideal; [9] reports large realized practical savings (RouteLLM ~85%, MixLLM ~76% cost cut).

## Caveats
Source strength is uneven and the research question's marketing-vs-measurement caution applies throughout. The single instrumented tutoring deployment (ITAS, arXiv 2604.24110) is a non-peer-reviewed preprint measured only to 50 concurrent users on one graduate STEM course using a single vendor (Gemini 2.5 Flash / Vertex AI); its per-student dollar figures are load-scenario projections, not measurements, and a worst-case 10,000-query variant ($39-$70/student) was voted down as implausible. NO source benchmarks the actual 100,000-concurrent K-8 target — all at-scale cost/latency/throughput numbers are extrapolations. Throughput multipliers (23x/24x/44x/100x) are lab micro-benchmarks or vendor self-reports (Anyscale, vLLM/LMSYS, DigitalOcean); sustained real-world gains are typically 4-8x. Routing savings figures are largely author-self-reported best cases on general benchmarks, not K-8 Socratic dialogue or child-safety, and the corpus itself shows practical routers barely beat a trivial baseline. Khanmigo pricing is time-sensitive and conflicting ($35 in Nov 2023 vs $15 bundled district rate in 2026 vs $90 standalone add-on list), and at-scale pricing above 1,000 licenses is not published. Several attractive-sounding claims were explicitly refuted by verification (a ~70x district cost advantage, a fixed 3-5x continuous-batching gain, and a specific Haiku/Sonnet/Opus tier-mapping recipe) and should not be relied on.

## Open questions
- Do small or quantized open models (7B-32B) actually clear the pedagogical AND child-safety bar for Socratic tutoring of young K-8 children, or does tutoring quality force more frontier-model escalation than general-benchmark routing results (MT-Bench/MMLU) imply?
- What is the real measured cost, latency, and throughput at genuine target scale (tens of thousands to 100,000 concurrent K-8 students), given that every current source stops at =50 concurrent users or is a projection?
- What does Khan Academy (or a comparable district deployment) actually charge and spend per student above 1,000 licenses, where pricing becomes quote-only, and how does that reconcile with the low per-token API math?
- How much do the headline routing/cascade savings (76-98%) degrade in a production K-8 setting once a real (non-oracle) judge/router with error rate >0.1-0.2 and child-safety guardrails is in the loop?

## Refuted claims (transparency)
- "ITAS measured deployment: under a worst-case ceiling of 10,000 queries/student/semester, per-student LLM cost is $39.26 (Standard PayGo) / $70.67 (Priority PayGo), below a typical STEM textbook; costs flat vs enrollment." (vote 1-2)
- "A 50,000-student district (~96,000 sessions/month) costs ~$2,400/month via Sonnet 4.6 token API vs ~$250,000/month for per-student specialty AI tutors — a ~70x difference." (vote 0-3)
- "A model-routing cascade matches model tier to task: Haiku for elementary drills, Sonnet for standard K-12, Opus for AP/graduate reasoning, self-hosted Qwen/Llama/Gemini Flash for high-volume routine Q&A." (vote 0-2)
- "Continuous batching yields 3x-5x more throughput than static batching on identical hardware, peaking near 128 concurrency, beyond which added concurrency raises latency not throughput." (vote 0-3)

## Sources
- <https://thejournal.com/articles/2023/11/16/khan-academy-cuts-district-price-of-khanmigo-ai-teaching-assistant.aspx> (secondary)
- <https://blog.khanacademy.org/becoming-a-khan-academy-districts-partner/> (blog)
- <https://arxiv.org/pdf/2603.02830> (primary)
- <https://arxiv.org/pdf/2604.24110> (primary)
- <https://www.anyscale.com/blog/continuous-batching-llm-inference> (blog)
- <https://ar5iv.labs.arxiv.org/html/2305.05176> (primary)
- <https://www.themoonlight.io/en/review/routerbench-a-benchmark-for-multi-llm-routing-system> (secondary)
- <https://arxiv.org/pdf/2502.03261> (primary)
- <https://link.springer.com/content/pdf/10.1007/978-3-031-98417-4_29.pdf> (primary)
- <https://ibl.ai/blog/what-ai-tutoring-actually-costs-2026> (blog)
- <https://www.digitalocean.com/community/tutorials/llm-inference-cost> (blog)
- <https://inworld.ai/resources/llm-inference-cost-at-scale> (blog)
- <https://www.zenml.io/llmops-database/scaling-self-hosted-llms-with-gpu-optimization-and-load-testing> (secondary)
- <https://aiforcause.org/stories/khanmigo-ai-tutor> (secondary)
- <https://www.edisonos.com/alternatives/khan-academy-pricing> (secondary)
- <https://www.khanacademy.org/schools/pricing> (primary)
- <https://www.khanmigo.ai/pricing> (primary)
- <https://arxiv.org/abs/2403.12031> (primary)
- <https://arxiv.org/abs/2406.18665> (primary)
- <https://arxiv.org/abs/2305.05176> (primary)
- <https://vllm.ai/blog/2023-06-20-vllm> (primary)
- <https://www.edusageai.com/blogs/how-much-does-khanmigo-cost-pricing-for-teachers-and-schools-in-2026> (blog)
- <file:///Users/felipecaicedo/code/gt100k/RESEARCH-what-are-the-real-world-cost-latency-throughput-an-2026-07-20.md> (secondary)

---
_Generated by deep-research v2 · 9 findings from 23 sources._
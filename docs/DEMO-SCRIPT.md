# PassionLab Demo Script

**Audience:** general, but likely with technical people in the room.
**Goal:** show, in a few minutes, how we help a child find a real passion and go deep on it, and convey how much engineering is under the hood.
**Golden rule for the talk:** lead in plain language, then use the real technical term when it shows depth and gloss it in the same breath (for example, "a Merkle root, which is basically a digital fingerprint"). Everything on screen is **made-up sample data**. Say that once, early. No em-dashes in anything you read aloud or put on a slide.

There are three apps to show:

| Order | App | Who it is for | URL (after you start it) | Owner |
|---|---|---|---|---|
| 1 | **Guide Console** | the teacher / guide | http://localhost:3020 | shared |
| 2 | **Project Studio** | the child | http://localhost:3010 | shared |
| 3 | **Evidence Explorer** | shows the honest record of a child's work | http://localhost:3030 | teammate (EvidenceGraph) |

> If you only have two minutes, do Guide Console + Project Studio and skip app 3.

---

## 1. How to start the apps (do this before the talk)

**Prerequisites:** Node 20+, and `pnpm` installed. You only need to do the install once.

From the repository root:

```bash
# 1) one-time install (safe to re-run)
pnpm install

# 2) start each app in its OWN terminal tab/window, then open the printed localhost link
pnpm --filter @gt100k/guide-console   exec next dev -p 3020   # the guide's view
pnpm --filter @gt100k/project-studio  exec next dev -p 3010   # the kid's view
pnpm --filter @gt100k/evidence-explorer exec next dev -p 3030 # the honest-record view (teammate)
```

Each command prints a `Local: http://localhost:PORT` line when it is ready. Open those three links in the browser.

**Tips**
- For a clean demo with no leftover test data, open the links in a **private / incognito** window.
- Give each app about 10 seconds on first load (it builds the page the first time you open it).
- Do **not** run build commands or switch git branches during the talk. A background build may be running.
- If an app looks stuck, refresh the tab once.

---

## 2. What is ready, and what to leave out

- **Show live (click through):** Guide Console, Project Studio, Evidence Explorer.
- **Describe only (no screen, they run behind the scenes):** the parts that read a child's behavior, watch for burnout, build the step by step plan, and coach the family. Talk about these; do not try to click them.
- **Do not show (still being built):** the tool that connects kids to real mentors and real audiences, and the explorable 3D world. If asked, say "that is next on our roadmap."

---

## 3. The 30 second story (say this first)

> "Most kids never find the thing they could be great at. This project helps a child, ages 6 to 14, discover a real passion and then go deep on it. The twist is that instead of asking a kid what they like, we watch what they actually keep coming back to. Then we give the adult a clear read on it, we help the kid do real projects, and we protect the kid from burnout the whole way. I will show you the grown up's view first, then the kid's, and finally how we keep an honest record of the work."

Three ideas to repeat in plain words:
1. **We learn from what kids do, not from what they say.** Surveys are unreliable. Behavior is honest.
2. **We reward effort, not a score.** No points, no streaks, no leaderboards. Getting stuck and trying again is the win.
3. **The software suggests. A human always decides.** It never labels or grades a child on its own.

---

## 4. Act 1: The Guide Console (http://localhost:3020)

This is the teacher or guide's mission control for one child at a time.

1. **Set the scene.** "This is what a guide sees. On the left is the list of kids. In the middle is what this child is into. On the right are four tabs."
2. **Point at the left.** "Notice the little tag that says *Synthetic data only*. This is all sample data."
3. **Read one interest card (the Hypotheses tab loads first).** "For each child we show what the evidence suggests, and how sure we are. It always says *current evidence suggests*, never *your child is an X*. It is a work in progress, not a verdict." If the room is technical, add: "Behind this is a Bayesian model, basically a system that keeps a probability for every interest and updates it as evidence arrives, with one belief for each *topic by work style* cell. It separates *what topic* a child loves from *what kind of work* they love, and it honestly reports uncertainty, so it can say *not sure yet*. The hard part is that we have no answer key, so it ships with research based starting values and learns over years."
4. **Switch the child** using the picker on the left. "Each child gets their own read." Pick one or two so people see it change.
5. **Click the Wellbeing tab.** "This watches for strain and burnout from behavior only, never from cameras or faces. Face and emotion detection is both scientifically shaky and illegal in EU education, so we refuse to use it." If technical, add: "It runs two independent dials, challenge and pressure, and when a child strains it turns the pressure down before it lowers the difficulty. It weighs quiet disengagement more heavily than plain tiredness, because that predicts dropout far better." "If a child is pushing too hard, it flags *needs your review* for a human to check. Wellbeing matters as much as progress here."
6. **Click the Plan tab.** "Once a child's interest is real, we lay out a step by step climb: what stage they are in, what kind of mentor fits, who the work is for, and the next real project. The software drafts it. The guide approves it."
7. **Click the Family tab.** "We also coach the family with warm, specific ways to help, and we watch that the support never turns into pressure."
8. **Close the act.** "Every suggestion here waits for a human to decide. The software never acts on the child by itself."

Nice touch to mention: the calm moving starry background is deliberate, and it turns off automatically for anyone who prefers less motion.

---

## 5. Act 2: The Project Studio (http://localhost:3010)

This is the fun, kid facing side, where a child actually does a project and writes down the journey.

1. **Set the scene.** "This is what the child sees. It is playful on purpose so they keep coming back. It opens on a project called *Build a Mini Arcade Game*."
2. **Point at the big question.** "Every project starts from the child's own question, here *what tiny game would make a friend say one more try*."
3. **Walk down the timeline (the heart of the demo).** "This is the honest record of their real work. They tried something, it broke, a helper bot assisted, they fixed it, they made a first version, and they wrote down what they learned." Point at the green banner. "And here it celebrates that the child got stuck and kept going. That bounce back is exactly what we care about, not a polished result."
4. **Add an entry live.** Click a chip such as **I made this**, type a short line like `I added a scoreboard`, and press **Add**. "The child logs the journey in their own words, and it shows up right away." Point at the new item at the top.
5. **Show the themes.** Click the **Theme** button (top right) and switch between a few, for example **Sunbeam**, then **Ink**, then **Synthwave**. "Kids can make it theirs. Same tool, very different feel."
6. **Show a fresh project.** In the left list, click **My Robot Buddy**. "This one the child started from their own idea, and it is just beginning."
7. **Optional flourish.** Click **Showtime! Share it**. "This is a practice share. Nothing is actually posted anywhere."
8. **Close the act.** "Notice there is no score, no grade, and no streak anywhere. It celebrates trying, fixing, and making."

---

## 6. Act 3: The Evidence Explorer (http://localhost:3030), teammate owned

This shows the **honest record** of a child's project: every real step, and proof that the record was not faked or changed later.

> Owned by the teammate finishing the EvidenceGraph work. Confirm the exact button names on the day, since final touches are in progress.

1. **Set the scene.** "When a child does a project, we keep a trail of every real step: what they tried, what broke, what they made, and where they got help. This is a directed acyclic graph, which just means a web of steps where every arrow points from a step back to what it was built on. Each dot is one step, and the lines are those connections."
2. **Show 3D and 2D.** Use the **3D / 2D** toggle at the top. "It is the same record either way. A calm flat map, or an immersive view. Nobody is forced into the fancy version."
3. **Trace the story.** Click **Trace lineage**. "This lights up the full provenance, the chain of every step that led to the final result, so you see the whole path behind it, not just the shiny ending."
4. **Open one step.** Click a dot. "You can open any step and read exactly what happened, including when an AI assistant was used. Declared AI help is stored as its own neutral, status equal node, so honesty is built into the data, not policed afterward. Getting help is shown openly and is never treated as cheating."
5. **Prove it is real (the big moment).** Find the **Verified** line near the bottom, expand it, and click **Show tamper**. "Each step is content addressed, meaning its ID is a hash of its own contents, so you cannot change a step without changing its fingerprint. The whole history then rolls up into a Merkle root, which is basically one digital fingerprint for the entire record. Watch: if someone alters even one byte, the root changes color and the seal breaks to MISMATCH, so anyone can instantly tell it was tampered with. Click again to restore it." (Note the small line: presentation only, no cryptography or grade is computed in the app itself.)
6. **Close the act.** "So a family, a school, or a competition can trust that this is a real, unedited record of the child's actual work."

---

## 7. Under the hood: the hard parts (bring these up for a technical room)

Use these to show how much real engineering sits behind the friendly screens. Each keeps the real term and glosses it in the same breath. No em-dashes.

- **Reading interest with no answer key.** The interest engine is a Bayesian model, a system that keeps a probability for each interest and updates it as evidence arrives, running one belief per *domain by work mode* cell (topic on one axis, style of work on the other). It uses a low rank factorization, a math technique that pulls two tangled signals apart, to separate *what topic* a child loves from *what kind of work* they love, for example a maker who builds across many topics versus a single topic loyalist. It discounts novelty because first time excitement is nearly worthless, separates voluntary returns from prompted ones, and reports calibrated uncertainty so it can honestly say "not sure yet." The genuinely hard part: there is no labeled training data at launch, since nobody can tell you which eight year old becomes a musician, so we ship a principled model with research based priors and learn its parameters over years as real outcomes accrue.

- **A tamper evident record (the EvidenceGraph).** Every project step is a node in a content addressed graph, meaning each node's ID is a hash of its own contents, so a step cannot be changed without changing its fingerprint. The whole history rolls up into a Merkle root, basically one digital fingerprint for the entire record. Change one byte anywhere and the root changes, which is exactly the "Show tamper" moment in the demo. Declared AI help is a first class, neutral node, so honesty is a property of the data model rather than something we police after the fact.

- **The hardest open problem: erasing data from an append only, tamper evident store.** A record designed so nothing can ever be changed is in direct tension with a child's right to be forgotten. Our approach is crypto shredding: store fingerprints over encrypted data plus a per child encryption key, so deleting that one key makes the child's data unreadable forever while everyone else's tamper evidence stays intact. This is a pre live safety gate we treat as non negotiable.

- **Detecting burnout without ever reading a face.** The wellbeing engine is behavior only. No camera, no face or emotion detection, which is both scientifically shaky and illegal in EU education. It runs two independent dials, challenge and pressure, and when a child strains it lowers the pressure before the difficulty. It weights devaluation, a child quietly going through the motions, more heavily than plain tiredness because it predicts dropout far better, and it treats a quiet week as a question for a human, never as an automatic "at risk" label.

- **Safe access to the open internet for a child.** The concierge can pull fresh material from the open web, but only through a staged, defense in depth pipeline: input and output moderation, an age appropriateness gate before anything is shown, provenance on every item, and human escalation the moment there is any sign of distress. New material is vetted first and only then promoted into a curated library, so safety compounds over time.

- **Proving authorship without an AI detector.** We never run an AI text detector on a child, because those tools are inaccurate and biased against non native writers. Instead authorship is verified structurally, through a short, friendly, AI conducted oral defense where the child talks through their own decisions and dead ends, and a human owns the final call.

- **Everything is deterministic and testable.** Each engine is pure and reproducible, runs offline, and ships with a machine checkable state contract, so the same input always gives the same output and an automated gate can verify the real product in a browser, not just the code.

---

## 8. Likely questions and simple answers

- **"Is this real kid data?"** No. All sample data. Real use waits behind privacy and consent work we have already mapped out.
- **"How do you know what a kid likes?"** We measure what they choose to come back to after the newness wears off, not what they click once.
- **"Does the software grade kids?"** No. It suggests. A human always owns the decision and the grade.
- **"What stops a parent from pushing too hard?"** We coach families toward support and watch for pressure, and the wellbeing check flags it for a human.
- **"What is next?"** Connecting kids to real mentors and real audiences, and the explorable discovery world.

---

## 9. Two minute version

- **Guide Console:** land on it, say the one line story, click **Wellbeing**, then **Plan**.
- **Project Studio:** show the timeline, add one entry, switch one theme.
- **Evidence Explorer (optional):** click **Trace lineage**, then **Show tamper**.

---

## 10. Do not do these on stage

- Do not switch git branches or run build commands during the demo.
- If the Studio timeline looks cluttered from earlier testing, reopen it in a fresh incognito window for the clean sample.
- Do not promise the mentor/audience matching or the 3D world as finished. They are on the roadmap.

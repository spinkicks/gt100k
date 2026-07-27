# PassionLab Demo Script

**Goal:** in a few minutes, show how we help a child find a real passion and go deep, and hint at the engineering underneath.
**Golden rules:** lead in plain language, then name the real term and gloss it in one breath ("a Merkle root, basically a digital fingerprint"). Say once, early, that everything on screen is **made-up sample data**. No em-dashes on slides or read aloud.

**All apps run on the teammate's laptop (the presentation machine); he drives.** They are already started at the ports below.

| Order | App | For | URL |
|---|---|---|---|
| 0 (optional) | **Front Door** | pick a role and go | http://localhost:3000 |
| 0 (optional) | **Discovery Cabin** (early prototype) | child clicks around a 3D cabin | http://localhost:5178 |
| 1 | **Guide Console** | the guide | http://localhost:3020 |
| 2 | **Project Studio** | the child | http://localhost:3010 |
| 3 | **Evidence Explorer** | the honest record of the work | http://localhost:3030 |

Every port above is pinned in the app's own `dev` script and matches the surfaces registry in
`@gt100k/ui`, which is what the in-product links resolve to. Start an app on a different port and its
neighbours will still point here. The Cabin is a Vite app on 5178, not 3040; 3040 is the Concierge.

> Short on time: Guide Console, Project Studio, Evidence Explorer. The Cabin is an optional, rough scene-setter; skip it or frame it as an early prototype. Open links in incognito for a clean slate; refresh once if a tab looks stuck.

---

## 1. What to show

- **Live:** Guide Console, Project Studio, Evidence Explorer (and optionally the Cabin, framed as an early prototype).
- **Describe only:** the engines that read behavior, watch for burnout, draft the plan, and coach the family. Talk about them; do not click.

---

## 2. The 30-second story (say first)

> "Most kids never find the thing they could be great at. We help a child, ages 6 to 14, discover a real passion and go deep. The twist: instead of asking what they like, we watch what they keep coming back to. Then we give the adult a clear read, help the kid do real projects, and protect them from burnout the whole way."

Three ideas to repeat:
1. **We learn from what kids do, not what they say.** Behavior is honest; surveys are not.
2. **We reward effort, not a score.** No points, streaks, or leaderboards. Getting stuck and trying again is the win.
3. **The software suggests; a human always decides.** It never labels or grades a child on its own.

The four apps share one visual language and theme switcher, so it reads as one product.

---

## 3. Act 0 (optional): Discovery Cabin (:3040)

Early prototype, about 30 seconds, set expectations up front. "Before any grown-up tools, a kid just explores. They pick a cabin, look around the room, and try the things in it, and we watch what they come back to. That becomes the signal everything else is built on." It is point and click, one fixed view of the room, like an old adventure game: pick a cabin, click a prop, let its puzzle open, close it, then hand off: "What a child does here becomes the evidence the guide sees next."

---

## 4. Act 1: Guide Console (:3020)

The guide's mission control for one child. Left: the list of kids (note the *Synthetic data only* tag). Middle: what this child is into. Right: five tabs.

1. **Hypotheses (loads first).** "We show what the evidence suggests and how sure we are, always *current evidence suggests*, never *your child is an X*." Technical: "a Bayesian model that keeps a probability per interest and updates as evidence arrives, one belief per *topic by work style*, and honestly reports *not sure yet*."
2. **Switch child** with the left picker so people see the read change.
3. **Wellbeing.** "Watches for strain from behavior only, never cameras or faces, which are scientifically shaky and illegal in EU education. If a child pushes too hard it flags *needs your review* for a human."
4. **Plan.** "Once an interest is real, we lay out a step by step climb: stage, mentor fit, audience, next real project. The software drafts; the guide approves."
5. **Family.** "We coach the family with specific ways to help, and watch that support never becomes pressure."
6. **Access.** "Where we broker the real world: real mentors and audiences, tracked to done." Live: click **Propose handoff**, show that **Approve** stays disabled until **Guardian consent recorded** is ticked ("a hard block in the code"), then walk it to *Access transferred*.
7. Close: "Every suggestion waits for a human. The software never acts on the child by itself."

---

## 5. Act 2: Project Studio (:3010)

The playful, kid facing side; opens on *Build a Mini Arcade Game*.

1. Point at the child's own question driving the project.
2. **Timeline (the heart).** "The honest record of real work: they tried something, it broke, a helper bot assisted, they fixed it, shipped a first version, and wrote what they learned." The green banner celebrates getting stuck and bouncing back, "not a polished result."
3. **Add an entry live.** Click **I made this**, type `I added a scoreboard`, press **Add**; it appears at the top.
4. **Themes.** Switch a couple (Sunbeam, Ink, Synthwave). "Same tool, very different feel."
5. **Fresh project.** Click **My Robot Buddy**, the child's own idea, just beginning.
6. Close: "No score, no grade, no streak. It celebrates trying, fixing, making."

---

## 6. Act 3: Evidence Explorer (:3030)

The honest record of a project, plus proof it was not faked or changed. The themed build shares Project Studio's look and switcher.

1. "Every real step is a dot; lines connect each step back to what it was built on, a directed acyclic graph."
2. **Theme switcher.** Same themes as Project Studio, re-skinning the whole 3D world. One design language across apps.
3. **3D / 2D toggle.** "Same record either way; nobody is forced into the fancy view."
4. **Trace lineage.** Lights up the full chain behind the result, not just the shiny ending.
5. **Open a step.** Read exactly what happened, including declared AI help, stored as its own neutral node. "Getting help is shown openly, never treated as cheating."
6. **Show tamper (the big moment).** Expand **Verified**, click **Show tamper**. "Each step's ID is a hash of its own contents, and the whole history rolls up into a Merkle root, one fingerprint for the record. Change one byte and the seal breaks to MISMATCH." Click again to restore. (Presentation only; no cryptography computed in the app.)
7. Close: "A family, school, or competition can trust this is a real, unedited record."

---

## 7. Under the hood (for a technical room)

- **Interest with no answer key.** A Bayesian model with one belief per *topic by work style* cell, using a low rank factorization to separate *what topic* a child loves from *what kind of work*. It discounts novelty, separates voluntary from prompted returns, and reports calibrated uncertainty. Hard part: no labeled data at launch, so we ship research based priors and learn over years.
- **Tamper evident record (EvidenceGraph).** Content addressed nodes rolling up to a Merkle root; change one byte and the root changes. Declared AI help is a first class neutral node, so honesty lives in the data model.
- **Right to be forgotten vs an append only store.** Crypto shredding: fingerprints over encrypted data plus a per child key; delete the key and that child's data is unreadable forever while everyone's tamper evidence holds. A non negotiable pre live gate.
- **Burnout without reading a face.** Behavior only: two dials, challenge and pressure; on strain it lowers pressure before difficulty, weights quiet disengagement over tiredness, and treats a quiet week as a question for a human.
- **Safe web access and authorship.** Fresh web material passes moderation, an age gate, provenance, and human escalation before entering a curated library. Authorship is verified by a short friendly oral defense, never an AI detector (inaccurate and biased).
- **Deterministic and testable.** Each engine is pure, offline, and reproducible, with a machine checkable contract, so an automated gate verifies the real product in a browser.

---

## 8. Likely questions

- **Real kid data?** No, all sample. Real use waits behind privacy and consent work already mapped out.
- **How do you know what a kid likes?** What they return to after the newness wears off, not one click.
- **Does it grade kids?** No. It suggests; a human owns the decision.
- **What stops a parent pushing too hard?** We coach toward support and flag pressure for a human.
- **What is next?** Wiring the mentor and audience broker to real partners, and growing the discovery world beyond the one cabin.

---

## 9. Two-minute version

- **Guide Console:** one line story, then **Wellbeing**, then **Plan**.
- **Project Studio:** timeline, add one entry, switch a theme.
- **Evidence Explorer:** **Trace lineage**, then **Show tamper**.

---

## 10. Do not do on stage

- Do not switch branches or run builds during the demo.
- If the Studio timeline looks cluttered, reopen it in a fresh incognito window.
- Do not promise the mentor/audience matching or the full 3D world as finished; the single Cabin is real, framed as the first of many.

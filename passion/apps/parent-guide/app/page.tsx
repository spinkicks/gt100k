import { Toc } from "./Toc.js";
import { ReadingProgress } from "./ReadingProgress.js";
import { CheckIn } from "./CheckIn.js";

function Cite({ children }: { children: string }): JSX.Element {
  return (
    <span className="cite">
      {" "}
      <a href="#sources">({children})</a>
    </span>
  );
}

function Src({ children, href }: { children: React.ReactNode; href: string }): JSX.Element {
  return (
    <li>
      {children} <a href={href}>link</a>
    </li>
  );
}

export default function Page(): JSX.Element {
  return (
    <>
      <ReadingProgress />
      <div className="layout">
        <Toc />
        <main className="main">
          <header className="page-header">
            <h1>The Warm-Demanding Parent Playbook</h1>
            <p className="lede">
              You are your child&apos;s biggest advantage. This guide shows how to use that well, in
              plain language, with the research behind every claim.
            </p>
          </header>

          <section id="start">
            <h2>Start here</h2>
            <p>The 30-second version. If you read nothing else, read this.</p>
            <p>
              You are your child&apos;s biggest advantage, and handled wrong you are also their
              biggest risk. How you show up decides which one you are.
              <Cite>Pinquart 2020; Kim 2013</Cite>
            </p>
            <div className="panel panel--accent">
              <h3>The successful parent, in eight lines</h3>
              <ol className="summary">
                <li>
                  <strong>The stance:</strong> stay demanding and warm at once. High standards, and
                  warmth that never depends on how it goes.
                </li>
                <li>
                  <strong>Read the signal:</strong> trust what they come back to on their own, not
                  what they or you say.
                </li>
                <li>
                  <strong>Move 1:</strong> open doors, do not assign them.
                </li>
                <li>
                  <strong>Move 2:</strong> be a co-learner, not a judge.
                </li>
                <li>
                  <strong>Move 3:</strong> protect their ownership. They choose the problem, the
                  method, the pace.
                </li>
                <li>
                  <strong>Move 4:</strong> keep it plural and reversible. A second door stays open,
                  and stepping back is allowed.
                </li>
                <li>
                  <strong>Move 5:</strong> handle the logistics, not the outcome.
                </li>
                <li>
                  <strong>The one rule for hard moments:</strong> when the stakes go up, add more
                  freedom and less judging, and if there is real distress, bring in a person.
                </li>
              </ol>
              <p className="cite" style={{ marginTop: "1em", marginBottom: 0 }}>
                The four traps to avoid: over-valuing it yourself, approval that rides on
                performance, hovering and taking over, and letting one pursuit become their whole
                identity.
              </p>
            </div>
          </section>

          <section id="stance">
            <h2>Why it matters, and the stance</h2>

            <h3>Why the home matters</h3>
            <p>
              An engaged home that supports a child&apos;s own choices turns potential into finished
              achievement. Here is the honest scope. The strongest home-environment effects show up
              where homes differ a great deal, for example moving a child out of a deprived setting,
              and they are about childhood achievement, not raising an adult&apos;s ceiling. What a
              committed home reliably does is convert a given ceiling into the grades and skills that
              ordinary homes leave on the table. Parents&apos; expectations predict{" "}
              <em>gains</em>, not just where a child already is.
              <Cite>Pinquart 2020; Hill 2009; Capron 1989; Turkheimer 2003</Cite>
            </p>

            <h3>The stance: demanding and warm</h3>
            <p>
              Being demanding and warm at once beats the tiger approach on the child&apos;s own
              grades and on their wellbeing. The harm comes from control and from warmth that
              depends on results, not from high standards. One honest note: parenting-style effects
              on grades are small, so lean on this stance for wellbeing and durable motivation
              rather than as a big lever on report cards.
              <Cite>Kim 2013; Assor 2004; Pinquart 2016; Grolnick 2009</Cite>
            </p>

            <h3>Let it become theirs</h3>
            <p>
              The goal has to become the child&apos;s own. A calm, harmonious love of the thing
              grows when they keep choosing it for themselves, and an anxious, all-consuming version
              grows when they do not. Be careful with rewards on something they already like.
              Expected, contingent prizes and streaks tend to undermine real interest, and the
              effect is worse in young children. The honest limit: this is debated. Rewards can help{" "}
              <em>start</em> a task they genuinely do not care about, and sincere, specific praise
              for effort is fine. It is contingent prizes on the thing they already love that
              backfire.
              <Cite>Vallerand 2003; Ryan 2000; Deci 1999; Lepper 1973; Warneken 2008; Cameron 2001</Cite>
            </p>

            <h3>Push the challenge, not the child</h3>
            <p>
              Picture two separate dials. Keep the difficulty in the hard-but-doable zone, roughly
              an 85% success rate. When they strain, turn the <em>pressure</em> down before you lower
              the <em>challenge</em>. When the stakes rise, add more freedom and less evaluation,
              which is the opposite of the usual adult reflex. Sustained achievement pressure now
              ranks among the top adolescent-health risks.
              <Cite>Wilson 2019; Wood 1976; Bartholomew 2011; Mageau 2009; Luthar 2020</Cite>
            </p>
          </section>

          <section id="read-your-child">
            <h2>How to actually read your child</h2>
            <p>
              This is the operational heart of the approach: how you tell what is really happening
              without ever putting a score on it.
            </p>

            <h3>Interest is built, not found</h3>
            <p>
              You do not sit back and wait to discover a ready-made passion. You create the
              conditions for one through repeated, varied exposure, and interest deepens in phases.
              Treat &quot;I&apos;m not a math person&quot; as a rough patch to scaffold, not a
              verdict about who they are.
              <Cite>Hidi 2006; O&apos;Keefe 2018</Cite>
            </p>

            <h3>Trust what they come back to, not what they say</h3>
            <p>
              What a child says they are interested in predicts what they actually do only weakly.
              The real signal is <strong>voluntary return</strong>: what they choose again after the
              novelty fades and after you stop prompting. Watch what they pick up unprompted.
              <Cite>Nye 2012; Harackiewicz 2008</Cite>
            </p>

            <h3>How do you know it is working, without grades?</h3>
            <p>
              Because you never score the passion, working is not a number. It is three things you
              can see. They keep coming back on their own. They go <strong>deeper</strong> over
              time. And at least once they <strong>pushed past a failure and made something</strong>.
              That last one, breaking through a wall, is the sign that a light interest is becoming a
              real one. Watch the process, not the polish.
              <Cite>Nye 2012; Kapur 2008; Sinha 2021</Cite>
            </p>
          </section>

          <section id="how-talent-develops">
            <h2>How talent develops</h2>
            <p>The ideas behind the moves, so you know why they work.</p>

            <h3>What actually makes a grandmaster</h3>
            <p>
              Drive and an enriched, supportive environment matter more than raw gifts. In
              Bloom&apos;s study of 120 world-class performers, early on motivation and effort
              counted far more than any particular gift, and the talent was <em>developed</em>, not
              simply found. The children who go far show a rage to master, but that pays off only{" "}
              <em>inside</em> a supportive environment. Neither drive nor talent alone is enough. One
              family famously built their whole home around chess and raised three prodigies, an
              existence proof that the environment can be designed. Ability still matters, yet
              practice hours explain only a minority of the difference between people.
              <Cite>Bloom 1985; Winner 1996; Polgar; Macnamara 2014; Robertson 2010</Cite>
            </p>

            <h3>The environment does the quiet work</h3>
            <p>
              The homes that grow talent are <em>both</em> highly supportive <em>and</em> highly
              challenging at the same time, and they make using the skill feel good, the absorbed
              state often called flow. That combination, not pressure, converts ability into
              sustained development.
              <Cite>Csikszentmihalyi 1993</Cite>
            </p>

            <h3>The mentor is a relay, and you cannot be all of them</h3>
            <p>
              Talent usually passes through a chain: a warm first teacher, then a more technical
              one, then a master. The most valuable thing each hands over is <em>the next person</em>,
              an introduction, an audition, a door. A big part of your job is bringing in mentors,
              near-peers, and community that you cannot personally be.
              <Cite>Bloom 1985; Subotnik 2011</Cite>
            </p>

            <h3>The climb is staged</h3>
            <p>
              Fall in love, then get precise, then make it real for a community, then find their own
              voice. Sample widely and playfully when they are young, specialize around the
              mid-teens, and save the heavy investment for later adolescence. Progress by{" "}
              <em>widening the audience</em>, not by piling on hours.
              <Cite>Cote 1999; Subotnik 2011; Renzulli 1977; Bloom 1985</Cite>
            </p>

            <h3>The real bottleneck is teachable</h3>
            <p>
              What most often stalls a talented child is a set of psychosocial skills: setting goals,
              practicing with quality, coping with feedback and pressure, speaking up for
              themselves. These are a curriculum, not a fixed personality, and you can build them
              from early on.
              <Cite>MacNamara 2010; Subotnik 2011</Cite>
            </p>
          </section>

          <section id="the-moves">
            <h2>What to do: the five moves</h2>
            <p>Concrete actions, each with a place in a normal week.</p>
            <ol>
              <li>
                <strong>Open doors, do not assign them.</strong> Offer access, time, and community,
                and let them decline. The offer is real, and so is the no thanks.
              </li>
              <li>
                <strong>Be a co-learner, not a judge.</strong> Have build nights. Hold demo nights
                where they teach you. Go see the field together.
              </li>
              <li>
                <strong>Protect their ownership.</strong> They choose the problem, the method, and
                the pace. Your opinions are available on request.
              </li>
              <li>
                <strong>Keep it plural and reversible.</strong> Offer a second, unrelated door. Make
                it clear that stepping back is always allowed.
              </li>
              <li>
                <strong>Handle logistics, not the outcome.</strong> Do the driving and the sign-ups,
                and keep your pride off the result.
              </li>
            </ol>
            <p className="cite">
              <a href="#sources">(Grolnick 2009; Mageau 2009; Renzulli 1977)</a>
            </p>

            <div className="panel">
              <h3>A sample week</h3>
              <p>What a demanding-and-warm week can look like in a homeschool:</p>
              <ul>
                <li>
                  Two or three protected, low-stakes blocks for their current pursuit, on a rhythm
                  they can count on.
                </li>
                <li>
                  One shared co-learner moment: a build night, a teach-back, or a visit to see the
                  real thing.
                </li>
                <li>One open door they could not reach alone: a person to meet, a place to go.</li>
                <li>At least one real day off. Rest is part of the plan, not a lapse.</li>
              </ul>
            </div>

            <div className="panel">
              <h3>Swap these phrases</h3>
              <ul className="swaps">
                <li>
                  <span className="from">&quot;How did it go?&quot;</span>
                  <span className="arrow" aria-hidden="true">
                    &rarr;
                  </span>
                  <span className="to">&quot;What did you try that was tricky?&quot;</span>
                </li>
                <li>
                  <span className="from">&quot;You&apos;re so talented.&quot;</span>
                  <span className="arrow" aria-hidden="true">
                    &rarr;
                  </span>
                  <span className="to">&quot;I saw how you kept going after that broke.&quot;</span>
                </li>
                <li>
                  <span className="from">&quot;Did you win?&quot;</span>
                  <span className="arrow" aria-hidden="true">
                    &rarr;
                  </span>
                  <span className="to">&quot;What was the best part to work on?&quot;</span>
                </li>
                <li>
                  <span className="from">&quot;You have to practice.&quot;</span>
                  <span className="arrow" aria-hidden="true">
                    &rarr;
                  </span>
                  <span className="to">&quot;Want your usual time for this today?&quot;</span>
                </li>
              </ul>
            </div>
          </section>

          <section id="the-traps">
            <h2>What to avoid: the four traps</h2>
            <p>
              A quiet self-check. For each one, notice what it looks like, then do the other thing.
              <Cite>Mageau 2009; Assor 2004</Cite>
            </p>
            <div className="traps">
              <div className="trap">
                <h3>1. Over-valuing it yourself</h3>
                <p className="look">
                  What it looks like: you are more invested than they are, and their pursuit has
                  become your project.
                </p>
                <p className="do">
                  <b>Do this instead:</b> hand the wheel back and let your interest follow theirs.
                </p>
              </div>
              <div className="trap">
                <h3>2. Approval that rides on performance</h3>
                <p className="look">
                  What it looks like: you are warmer after a good result and cooler after a bad one.
                </p>
                <p className="do">
                  <b>Do this instead:</b> keep your warmth identical before and after, so it never
                  depends on the outcome.
                </p>
              </div>
              <div className="trap">
                <h3>3. Control and hovering</h3>
                <p className="look">
                  What it looks like: you correct, take over, or manage the details of how they do
                  it.
                </p>
                <p className="do">
                  <b>Do this instead:</b> offer structure and access, then step back and let them
                  own the method.
                </p>
              </div>
              <div className="trap">
                <h3>4. One pursuit becomes their whole identity</h3>
                <p className="look">
                  What it looks like: it is the only thing they will do or talk about, with nothing
                  else alive.
                </p>
                <p className="do">
                  <b>Do this instead:</b> keep a second, unrelated door open, so a setback in one
                  place is not a crisis of who they are.
                </p>
              </div>
            </div>
          </section>

          <section id="big-questions">
            <h2>The big questions parents actually ask</h2>

            <h3>Deep or well-rounded?</h3>
            <p>
              A genuine deep spike is what pays off, and most children really do have a single
              strongest area. Good at everything is largely a testing illusion. Breadth helps, but
              only up to a point, and skills do not transfer across unrelated fields, so hold{" "}
              <strong>two or three</strong> pursuits early and narrow toward one by around age 13. At
              the elite-admissions end, a deep, differentiated profile tends to beat an
              equally-credentialed well-rounded one, though treat that as a strategic bet, not a
              settled result.
              <Cite>Achter 1996; Achter 1997; Fredricks 2012; Busseri 2006; Sala 2017; Cote 1999; Robertson 2010</Cite>
            </p>

            <h3>What if they like nothing, or everything?</h3>
            <p>
              Nothing usually means not enough varied exposure yet, so widen the menu and watch for
              unprompted return. Everything is usually an unresolved tilt, so keep two or three doors
              open and let real return narrow it for you.
              <Cite>Hidi 2006; Achter 1996</Cite>
            </p>

            <h3>Should I let them quit?</h3>
            <p>
              The real danger is <em>foreclosure</em>, going all-in with no exploration, not
              switching. The you-have-put-too-much-in-to-stop instinct is your bias. Young children
              do not have it. Ask for <em>effort within the attempt</em>, never <em>loyalty to a
              domain</em>. A healthy switch is a calm move <em>toward</em> something they already
              return to, after clearing at least one real difficulty. Default to park it, not quit.
              <Cite>Marcia 1966; Kroger 2010; Sehl 2021; Arkes 1999; Crede 2017; Duckworth 2007; O&apos;Keefe 2018</Cite>
            </p>

            <h3>How much practice, and how much rest?</h3>
            <p>
              Practice matters, but it explains only a limited share of performance, so{" "}
              <em>bounded</em> practice that serves a real project beats endless drilling. Real rest,
              days off each week and weeks off each year, is part of the plan, not a failure of will.
              <Cite>Macnamara 2014; Ericsson 1993; Brenner 2016</Cite>
            </p>

            <h3>Am I too late, or pushing too early?</h3>
            <p>
              Start early with wide, low-stakes sampling, and save the heavy investment for
              adolescence. A true start-before-7 window really exists only for music and for rhythm
              and motor skills.
              <Cite>Cote 1999; Watanabe 2007; Steele 2013</Cite>
            </p>

            <h3>What about screens, games, and rewards for practice?</h3>
            <p>
              A screen can be real exposure, like game design, music production, or coding, or it can
              be just novelty. Judge it by unprompted return and depth, not by the device. Do not
              turn their interest into a chore with sticker charts or paid practice. Keep the passion
              reward-neutral and let the doing be the reward.
              <Cite>Nye 2012; Deci 1999</Cite>
            </p>

            <h3>Getting the whole household aligned</h3>
            <p>
              The two-parent advantage runs through <em>cooperation</em>, not the certificate, and
              one adult who quietly disagrees is a standing, measurable risk. Get every adult in the
              home on the same page, with aligned expectations and one shared posture, at any
              household size.
              <Cite>Amato 2005; Teubert 2010; Buehler 1997</Cite>
            </p>

            <h3>When should I get outside help?</h3>
            <p>
              Persistent quiet devaluation, loss of sleep or joy, or anything that looks like real
              distress is a moment to bring in your guide, a trusted mentor, or a professional. This
              page is not a diagnosis and never replaces a person.
              <Cite>Luthar 2020; Coakley 1992</Cite>
            </p>
          </section>

          <section id="when-it-gets-hard">
            <h2>When it gets hard</h2>
            <p>
              Four moments to watch for, and what to do in each.
              <Cite>Raedeke 2001; Mageau 2009</Cite>
            </p>
            <ul>
              <li>
                <strong>The stakes are rising</strong> (a test, showcase, or deadline is coming).
                Add more freedom and less evaluation. Keep your warmth exactly the same, and make
                clear the result does not change how you feel about them.
              </li>
              <li>
                <strong>They have gone quiet</strong> (doing it flatly, canceling, not sharing it).
                Offer a genuinely guilt-free, reversible break, and keep the door and a regular time
                open. If it persists, loop in your guide or a professional.
              </li>
              <li>
                <strong>They are stuck</strong> (worn out, asking for a break). Turn the pressure
                down before you lower the challenge. Protect rest as part of the plan.
              </li>
              <li>
                <strong>There is little shared time.</strong> Set up a regular, low-stakes time and
                place, and do something together around it: a build night, a visit, a teach-back.
              </li>
            </ul>
            <p>The next section walks through these same moments with you.</p>
          </section>

          <section id="checkin">
            <h2>Family Check-In</h2>
            <CheckIn />
          </section>

          <section id="sources" className="sources">
            <h2>Sources: check it yourself</h2>
            <p>
              Every strong claim above is listed here with a link, so you can confirm nothing is
              invented.
            </p>
            <div className="callout">
              <strong>An honest note on the limits.</strong> Much of the passion and burnout
              evidence leans on adolescents. Parenting-style effects on grades are small. The
              strongest home-environment effects are scoped to deprivation and to childhood
              achievement, not to raising an adult&apos;s ceiling. The reward-undermining finding is
              contested (see Cameron, Banko and Pierce). And the elite-admissions edge for a deep
              spike is a strategic bet, not a proven result. We state the limits rather than
              overclaim.
            </div>

            <h3>Reading the child (interest and the signal)</h3>
            <ul>
              <Src href="https://doi.org/10.1207/s15326985ep4102_4">
                Interest develops in phases; it is built, not just found. Hidi &amp; Renninger
                (2006).
              </Src>
              <Src href="https://doi.org/10.1177/1745691612449021">
                Stated interest predicts behavior only weakly; watch behavior. Nye, Su, Rounds &amp;
                Drasgow (2012).
              </Src>
              <Src href="https://doi.org/10.1037/0022-0663.100.1.105">
                Interest and its development predict achievement. Harackiewicz et al. (2008).
              </Src>
              <Src href="https://doi.org/10.1177/0956797618780643">
                Develop your interest beats find your passion. O&apos;Keefe, Dweck &amp; Walton
                (2018).
              </Src>
              <Src href="https://doi.org/10.1080/07370000802212669">
                Grade the process; productive failure. Kapur (2008); Sinha &amp; Kapur (2021).
              </Src>
            </ul>

            <h3>The home is the lever (scoped honestly)</h3>
            <ul>
              <Src href="https://doi.org/10.1007/s10648-019-09506-z">
                Parents&apos; expectations predict <em>gains</em>. Pinquart &amp; Ebeling (2020).
              </Src>
              <Src href="https://doi.org/10.1037/a0015362">
                Communicating expectations and strategy beats monitoring. Hill &amp; Tyson (2009).
              </Src>
              <Src href="https://doi.org/10.1023/A:1009048817385">
                Aspiration is the strongest involvement component. Fan &amp; Chen (2001).
              </Src>
              <Src href="https://doi.org/10.1038/340552a0">
                Rearing environment moves childhood outcomes where environments differ a lot. Capron
                &amp; Duyme (1989).
              </Src>
              <Src href="https://doi.org/10.1046/j.0956-7976.2003.psci_1475.x">
                Environment matters most under deprivation. Turkheimer et al. (2003).
              </Src>
            </ul>

            <h3>Warm-demanding, not tiger</h3>
            <ul>
              <Src href="https://doi.org/10.1037/a0030612">
                Supportive beats tiger on grades <em>and</em> wellbeing. Kim et al. (2013).
              </Src>
              <Src href="https://doi.org/10.1007/s10648-015-9338-y">
                Warmth and autonomy positive; harsh and psychological control negative (effects
                small). Pinquart (2016).
              </Src>
              <Src href="https://doi.org/10.1111/j.1750-8606.2009.00099.x">
                Structure is not control. Grolnick &amp; Pomerantz (2009).
              </Src>
              <Src href="https://doi.org/10.1111/j.0022-3506.2004.00256.x">
                The emotional costs of conditional regard. Assor, Roth &amp; Deci (2004).
              </Src>
              <Src href="https://doi.org/10.1037/amp0000556">
                Achievement pressure is a top adolescent-health risk. Luthar, Kumar &amp; Zillmer
                (2020).
              </Src>
              <Src href="https://doi.org/10.1037/a0014996">
                Conscientiousness predicts achievement. Poropat (2009).
              </Src>
            </ul>

            <h3>Motivation (let it become theirs; be careful with rewards)</h3>
            <ul>
              <Src href="https://doi.org/10.1037/0003-066X.55.1.68">
                Self-Determination Theory. Ryan &amp; Deci (2000).
              </Src>
              <Src href="https://doi.org/10.1037/0022-3514.85.4.756">
                Harmonious vs obsessive passion. Vallerand et al. (2003).
              </Src>
              <Src href="https://doi.org/10.1111/j.1467-6494.2009.00559.x">
                Passion antecedents: autonomy support vs over-valuation and pressured
                specialization. Mageau et al. (2009).
              </Src>
              <Src href="https://doi.org/10.1037/0033-2909.125.6.627">
                Rewards undermine intrinsic motivation, worse in children. Deci, Koestner &amp; Ryan
                (1999).
              </Src>
              <Src href="https://doi.org/10.1037/h0035519">
                The classic child demonstration. Lepper, Greene &amp; Nisbett (1973).
              </Src>
              <Src href="https://doi.org/10.1037/a0013860">
                Even toddlers; praise did not undermine. Warneken &amp; Tomasello (2008).
              </Src>
              <Src href="https://doi.org/10.1007/BF03392017">
                The dissent: rewards can help start a low-interest task. Cameron, Banko &amp; Pierce
                (2001).
              </Src>
            </ul>

            <h3>Pressure (push the challenge, not the child)</h3>
            <ul>
              <Src href="https://doi.org/10.1177/0146167211413125">
                Control leads to burnout, separately from difficulty. Bartholomew et al. (2011).
              </Src>
              <Src href="https://doi.org/10.1038/s41467-019-12552-4">
                About 85% success is the optimal-difficulty sweet spot. Wilson et al. (2019).
              </Src>
              <Src href="https://doi.org/10.1111/j.1469-7610.1976.tb00381.x">
                Scaffolding and the zone of proximal development. Wood, Bruner &amp; Ross (1976).
              </Src>
            </ul>

            <h3>Burnout (catch quiet devaluation)</h3>
            <ul>
              <Src href="https://doi.org/10.1123/jsep.23.4.281">
                The three-part burnout measure including devaluation. Raedeke &amp; Smith (2001).
              </Src>
              <Src href="https://doi.org/10.1123/tsp.2014-0140">
                Burnout predicts dropout years later. Isoard-Gautheur et al. (2016).
              </Src>
              <Src href="https://doi.org/10.1123/ssj.9.3.271">
                Burnout as constrained identity and control. Coakley (1992).
              </Src>
              <Src href="https://doi.org/10.1177/1356336X14555294">
                A participation gap is multi-causal. Crane &amp; Temple (2015).
              </Src>
            </ul>

            <h3>Practice and rest</h3>
            <ul>
              <Src href="https://doi.org/10.1177/0956797614535810">
                Deliberate practice explains a limited share of performance. Macnamara, Hambrick
                &amp; Oswald (2014).
              </Src>
              <Src href="https://doi.org/10.1037/0033-295X.100.3.363">
                Deliberate practice is effortful and, for a child, externally scaffolded. Ericsson,
                Krampe &amp; Tesch-Romer (1993).
              </Src>
              <Src href="https://doi.org/10.1542/peds.2016-2148">
                Rest cadence for young people. Brenner &amp; AAP Council on Sports Medicine and
                Fitness (2016).
              </Src>
            </ul>

            <h3>Deep vs well-rounded</h3>
            <ul>
              <Src href="https://doi.org/10.1037/0022-0167.43.1.65">
                Multipotentiality is largely a testing artifact. Achter, Lubinski &amp; Benbow
                (1996, 1997).
              </Src>
              <Src href="https://doi.org/10.1007/s10964-011-9704-0">
                Breadth helps on an inverted-U. Fredricks (2012); Busseri et al. (2006).
              </Src>
              <Src href="https://doi.org/10.1177/0963721417712760">
                Skills do not transfer across unrelated domains. Sala &amp; Gobet (2017).
              </Src>
              <Src href="https://doi.org/10.1123/tsp.13.4.395">
                Sample early, specialize later. Cote (1999).
              </Src>
              <Src href="https://doi.org/10.1177/0963721410391442">
                More ability keeps paying even among the gifted. Robertson, Smeets, Lubinski &amp;
                Benbow (2010).
              </Src>
            </ul>

            <h3>Quitting and switching</h3>
            <ul>
              <Src href="https://doi.org/10.1037/h0023281">
                Foreclosure is the hazard. Marcia (1966); Kroger, Martinussen &amp; Marcia (2010).
              </Src>
              <Src href="https://doi.org/10.1111/cogs.13063">
                Sunk-cost bias is learned with age; young kids lack it. Sehl, Friedman &amp; Denison
                (2021); Arkes &amp; Ayton (1999).
              </Src>
              <Src href="https://doi.org/10.1037/pspp0000102">
                Effort, not consistency-of-interest, carries grit. Crede, Tynan &amp; Harms (2017);
                Duckworth et al. (2007).
              </Src>
            </ul>

            <h3>Timing and sensitive periods</h3>
            <ul>
              <Src href="https://doi.org/10.1007/s00221-006-0619-z">
                A music and motor sensitive period before about age 7. Watanabe, Savion-Lemieux
                &amp; Penhune (2007); Steele et al. (2013).
              </Src>
            </ul>

            <h3>The whole household</h3>
            <ul>
              <Src href="https://doi.org/10.1080/15295192.2010.492040">
                Coparenting agreement predicts child adjustment. Teubert &amp; Pinquart (2010).
              </Src>
              <Src href="https://doi.org/10.1023/A:1025006909538">
                Interparental conflict predicts youth problems. Buehler et al. (1997).
              </Src>
              <Src href="https://doi.org/10.1353/foc.2005.0012">
                The two-parent advantage runs through process, not structure. Amato (2005).
              </Src>
            </ul>

            <h3>How talent actually develops (grandmasters, environment, mentors)</h3>
            <ul>
              <Src href="https://www.penguinrandomhouse.com/books/15009/developing-talent-in-young-people-by-benjamin-bloom/">
                Talent is developed; drive over talent; the three-teacher relay. Bloom (1985),{" "}
                <em>Developing Talent in Young People</em>.
              </Src>
              <Src href="https://www.journalofexpertise.org/articles/JoE_2018_1_1_Winner_Drake_Apr10.pdf">
                The rage to master needs an enriched environment. Winner (1996); Winner &amp; Drake
                (2018).
              </Src>
              <Src href="https://doi.org/10.1177/1529100611418056">
                Talent-development megamodel; psychosocial skills as the stage-transition
                determinant. Subotnik, Olszewski-Kubilius &amp; Worrell (2011).
              </Src>
              <Src href="https://archive.org/details/talentedteenager0000csik_v3s4">
                The high-support and high-challenge home, and flow. Csikszentmihalyi, Rathunde &amp;
                Whalen (1993).
              </Src>
              <Src href="https://gifted.uconn.edu/schoolwide-enrichment-model/the-enrichment-triad-model/">
                Progress by widening the audience. Renzulli (1977).
              </Src>
              <Src href="https://doi.org/10.1123/tsp.24.1.52">
                Psychosocial skills are a teachable curriculum. MacNamara, Button &amp; Collins
                (2010).
              </Src>
              <Src href="https://en.wikipedia.org/wiki/L%C3%A1szl%C3%B3_Polg%C3%A1r">
                A designed home that produced three chess prodigies. Polgar, <em>Raise a Genius!</em>
              </Src>
            </ul>
          </section>

          <section id="self-assessment">
            <h2>Your self-assessment</h2>
            <p>
              A short, printable self-check, the successful-parent outline. Read each line and mark
              the ones you can already say yes to. The gaps are simply your next moves, not a grade.
            </p>

            <h3>The stance</h3>
            <ul className="checklist">
              <li>I hold high standards and stay warm at the same time.</li>
              <li>My warmth never depends on how it goes. It is the same before and after a result.</li>
              <li>When the stakes rise, I add more freedom and less evaluation, not more pressure.</li>
              <li>I let the goal become theirs. I do not turn what they love into a reward chart.</li>
            </ul>

            <h3>The five moves</h3>
            <ul className="checklist">
              <li>I open doors and let them decline, rather than assigning pursuits.</li>
              <li>I am a co-learner, not a judge: build nights, teach-backs, visits.</li>
              <li>I protect their ownership of the problem, the method, and the pace.</li>
              <li>I keep a second, unrelated door open, and stepping back is allowed.</li>
              <li>I handle the logistics and keep my pride off the outcome.</li>
            </ul>

            <h3>The four traps I avoid</h3>
            <ul className="checklist">
              <li>Being more invested in it than they are.</li>
              <li>Approval that rises and falls with performance.</li>
              <li>Hovering, correcting, or taking over.</li>
              <li>Letting one pursuit become their entire identity.</li>
            </ul>

            <h3>The whole household</h3>
            <ul className="checklist">
              <li>Every adult in our home shares the same expectations and posture.</li>
              <li>No adult is quietly undercutting the plan.</li>
              <li>
                I know the signs that mean it is time to bring in a guide or professional, and I
                will.
              </li>
            </ul>
          </section>
        </main>
      </div>
    </>
  );
}

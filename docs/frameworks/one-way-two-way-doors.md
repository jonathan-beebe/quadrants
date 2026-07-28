# One-Way/Two-Way Doors

> **Speed vs. caution:** decide fast on choices you can undo, and reserve slow
> deliberation for the few you cannot.

One-Way/Two-Way Doors is Jeff Bezos's decision-classification framework, built
on two properties of a decision: **reversibility** (can you back out?) and
**consequence** (how much is at stake?). Decisions that are consequential and
irreversible or nearly irreversible are **one-way doors** (Type 1) — walk
through and you cannot get back — and must be made slowly, methodically, with
deliberation and consultation. Most decisions are **two-way doors** (Type 2) —
changeable and reversible — and should be made quickly by high-judgment
individuals or small groups. Rendered as a 2×2 (reversibility × consequence),
the framework's central warning is against applying the heavyweight one-way-door
process to two-way-door decisions. It is used as a routing mechanism: classify
the decision first, then match the weight of the process — who decides, how much
analysis, how much information — to the type.

## When was it created?

The framework's first public articulation is Amazon's
**[2015 Letter to Shareholders](https://s2.q4cdn.com/299287126/files/doc_financials/annual/2015-Letter-to-Shareholders.PDF)**,
published in April 2016, in the section titled "Invention Machine." Bezos
reportedly used the doors language inside Amazon before publishing it, so the
idea predates 2015 as internal practice, but the shareholder letter is the
earliest primary written source. Note a common misattribution: the
**[1997 letter](https://s2.q4cdn.com/299287126/files/doc_financials/annual/Shareholderletter97.pdf)**
— reprinted with every subsequent annual letter — is often cited as the origin,
but it contains no mention of doors or reversible/irreversible decisions. It
establishes the surrounding philosophy ("We will make bold rather than timid
investment decisions…"), which is why the two letters are usually read together.
Bezos reiterated and extended the idea in the
[2016 letter](https://www.aboutamazon.com/news/company-news/2016-letter-to-shareholders)
("Day 2" / high-velocity decision making: "Many decisions are reversible,
two-way doors. Those decisions can use a light-weight process.").

## Who created it?

**Jeff Bezos**, founder and then-CEO of Amazon.com, writing in his own voice in
the shareholder letters. Attribution here is unusually clean for a decision
framework: the primary text exists, is signed, and coins the terms itself ("We
can call these Type 1 decisions"). No earlier claimant to the one-way/two-way
door formulation has surfaced, though the underlying concept — treat
irreversible choices differently from reversible ones — is older decision-theory
common sense that Bezos packaged memorably. There is no dedicated Wikipedia
article for the framework as of this writing.

## What problem were they trying to solve?

Scale-induced slowness. The 2015 letter names the problem explicitly: "One
common pitfall for large organizations – one that hurts speed and inventiveness
– is 'one-size-fits-all' decision making." As organizations grow, "there seems
to be a tendency to use the heavy-weight Type 1 decision-making process on most
decisions, including many Type 2 decisions. The end result of this is slowness,
unthoughtful risk aversion, failure to experiment sufficiently, and consequently
diminished invention"
([2015 letter](https://s2.q4cdn.com/299287126/files/doc_financials/annual/2015-Letter-to-Shareholders.PDF)).
Bezos wanted Amazon to keep startup-speed experimentation ("failure and
invention are inseparable twins") while still applying real rigor to the few
decisions that genuinely cannot be undone. The letter's footnote acknowledges
the mirror-image failure exists but is self-limiting: companies that habitually
make Type 1 decisions with a Type 2 process "go extinct before they get large."

## Why should someone use it?

Because it right-sizes decision cost. Most process pathology comes from a single
implicit assumption — that all decisions deserve the same care — and this
framework replaces it with one cheap classification question asked up front: "if
this is wrong, can we walk back through the door?" That question alone licenses
speed on the majority of decisions (delegate them, decide with ~70% of the
information you wish you had, iterate) while flagging the minority that justify
slow, consultative deliberation. It also gives teams a shared vocabulary for
escalation: arguing "this is a one-way door" is a concrete, checkable claim
about reversibility and consequence, not a vibe.

## What is the expected outcome?

Used as intended: faster average decision velocity with no increase in
catastrophic risk. Two-way-door decisions get made quickly and pushed down to
individuals or small groups, producing more experiments per unit time — and
since experiments are how invention happens, more invention. One-way-door
decisions get the full methodical treatment, so the organization stays out of
unrecoverable holes. The failure mode the framework is designed to prevent —
bureaucratic risk aversion masquerading as prudence — shows up as its absence:
in Bezos's terms, avoiding "slowness, unthoughtful risk aversion, failure to
experiment sufficiently, and consequently diminished invention"
([2015 letter](https://s2.q4cdn.com/299287126/files/doc_financials/annual/2015-Letter-to-Shareholders.PDF)).

## What is the hard evidence it works?

Direct peer-reviewed validation of the framework — controlled studies measuring
decision velocity or business outcomes from classifying decisions by
reversibility — has not been published. The evidence base is organizational case
study and practitioner report, anchored by Amazon's own track record as
described in the
[shareholder letters](https://s2.q4cdn.com/299287126/files/doc_financials/annual/2015-Letter-to-Shareholders.PDF)
and its
["Day 1" operating culture](https://aws.amazon.com/executive-insights/content/how-amazon-defines-and-operationalizes-a-day-1-culture/).
Practitioner sources report reduced analysis paralysis and reduced sunk-cost
attachment when teams label decisions as two-way doors
([Product Talk](https://www.producttalk.org/glossary-discovery-two-way-door-decision/)),
and faster throughput of delegated reversible decisions
([Farnam Street](https://fs.blog/reversible-irreversible-decisions/)).

Adjacent peer-reviewed psychology exists but measures different outcomes. A 2022
study found decision reversibility can lower satisfaction: reversible conditions
trigger more counterfactual thinking and anticipated regret, and most
participants given a reversal option never used it
([Li et al. 2022, PMC9384371](https://pmc.ncbi.nlm.nih.gov/articles/PMC9384371/)).
This supports the framework's premise that reversibility is psychologically
distinct from irreversibility, while cautioning that keeping options open has a
cost of its own. Documented critiques: second- and third-order consequences can
make nominally reversible decisions hard to fully undo
([GovLoop](https://www.govloop.com/community/blog/deciding-who-decides-and-doors-the-decision-maker-conundrum/)),
and misclassification produces either reckless haste or needless delay
([LogRocket](https://blog.logrocket.com/product-management/type-1-vs-type-2-decisions-overview-examples/)).

## How do you get into the right mindset?

The shift the framework asks for is to judge the decision's properties before
its merits: hold off on "which option is best?" and first answer "what kind of
decision is this?" Practitioners prime that classification with a few diagnostic
questions:

- If this goes wrong, what breaks, who is impacted, and how fast could we
  restore the previous state?
  ([Cleverence](https://www.cleverence.com/articles/business-blogs/how-to-design-decisions-for-reversibility-6382/))
- What would reversal cost? Ask for a t-shirt-sized estimate, in
  engineering-months, of the work to revert; reversal that would consume more
  than ~10% of the annual product budget signals a one-way door
  ([Aakash Gupta](https://www.aakashg.com/one-way-doors/)).
- Are we making a public commitment to customers, partners, or the market?
  ([Aakash Gupta](https://www.aakashg.com/one-way-doors/))
- Is it cheaper to keep analyzing the decision or to test it?
  ([LogRocket](https://blog.logrocket.com/product-management/type-1-vs-type-2-decisions-overview-examples/))

For a candidate one-way door, one small exercise sharpens the stakes — a
pre-mortem: imagine the recommended path has failed spectacularly; what went
wrong? ([Aakash Gupta](https://www.aakashg.com/one-way-doors/))

## How does one use it properly?

1. **Classify first.** Before debating the decision itself, answer two
   questions: what are the consequences, and is it reversible?
   ([CNBC](https://www.cnbc.com/2018/11/19/jeff-bezos-simple-strategy-for-answering-amazons-hardest-questions--.html)).
   A useful classification probe: compare the cost of delaying against the cost
   of reversing
   ([LogRocket](https://blog.logrocket.com/product-management/type-1-vs-type-2-decisions-overview-examples/)).
2. **Route two-way doors to a lightweight process.** Delegate to high-judgment
   individuals or small groups; do not require senior approval
   ([2015 letter](https://s2.q4cdn.com/299287126/files/doc_financials/annual/2015-Letter-to-Shareholders.PDF)).
   Decide with roughly 70% of the information you wish you had
   ([2016 letter](https://www.aboutamazon.com/news/company-news/2016-letter-to-shareholders)),
   launch, observe, and correct. Where useful, name a reversibility window — the
   period during which backing out remains cheap
   ([Decision Desk](https://decisiondesk.io/resources/10-decision-frameworks-used-by-leading-companies)).
3. **Route one-way doors to a heavyweight process.** Proceed methodically: deep
   research, stakeholder and expert consultation, pilot tests where possible,
   criteria-based evaluation, and senior-level sign-off
   ([2015 letter](https://s2.q4cdn.com/299287126/files/doc_financials/annual/2015-Letter-to-Shareholders.PDF);
   [LogRocket](https://blog.logrocket.com/product-management/type-1-vs-type-2-decisions-overview-examples/)).
4. **Sequence by type.** Make reversible decisions as soon as possible and
   irreversible decisions as late as possible, preserving option value while
   information accumulates
   ([Farnam Street](https://fs.blog/reversible-irreversible-decisions/)).
5. **Know when deliberation is done.** For one-way doors, decide when any of
   three conditions holds: you have stopped gathering useful information with
   none on the horizon; you are about to lose a meaningful opportunity; or
   clarity has emerged
   ([Farnam Street](https://fs.blog/reversible-irreversible-decisions/)).
6. **Apply it per decision, continuously.** Classification is a habit at the
   moment each decision surfaces — a standing question in proposals and reviews
   — not a periodic batch exercise
   ([AWS Day 1 culture](https://aws.amazon.com/executive-insights/content/how-amazon-defines-and-operationalizes-a-day-1-culture/)).

## How does it relate to other frameworks?

Within this library:

- **[Eisenhower Matrix](./eisenhower-matrix.md)** — the closest structural
  sibling: both replace one-size-fits-all treatment with a cheap two-question
  triage that routes items to different processes. Eisenhower sorts tasks by
  urgency and importance; Doors sorts decisions by reversibility and
  consequence. Used together: Eisenhower decides _when_ to engage, Doors decides
  _how carefully_.
- **[Risk Matrix](./risk-matrix.md)** — shares the consequence axis. A risk
  matrix (likelihood × severity) sharpens the "how consequential?" half of the
  doors classification for candidate one-way doors.
- **[Knowns & Unknowns](./knowns-unknowns.md)** — maps what information is
  missing before a decision; useful for judging whether waiting on a one-way
  door will produce more knowledge or has hit the "stopped gathering useful
  information" condition.
- **[Certainty × Agreement](./certainty-agreement.md)** — like Doors, a
  meta-framework for choosing a decision process from the decision's properties;
  it adds the social dimension (how much stakeholders agree) that Doors omits.
- **[Impact / Effort](./impact-effort.md)** — a prioritization complement: once
  a decision is classified as a two-way door, impact/effort helps pick which
  cheap experiments to run first.

Outside this library, the framework is grounded in **real options theory**
(reversible choices preserve option value) and **regret theory**
([Savage 1951; Loomes & Sugden 1982](https://personal.eur.nl/wakker/pdfspubld/15.2regret_history.pdf)),
which formalized treating potential regret as an input to choice. In practice it
pairs with role-assignment frameworks that answer "who decides" once Doors
answers "how": **DACI/RACI**, Apple's **DRI** model, and Netflix's **SPADE**
([Decision Desk](https://decisiondesk.io/resources/10-decision-frameworks-used-by-leading-companies)).
At Amazon it operates inside the broader
[Day 1 culture](https://aws.amazon.com/executive-insights/content/how-amazon-defines-and-operationalizes-a-day-1-culture/)
and alongside the Working Backwards method.

## What is the core insight?

Match the weight of the decision process to the reversibility of the decision,
not to the size of the organization making it.

## What is its intellectual-property status?

Free to use. "One-way door," "two-way door," and "Type 1/Type 2 decisions" are
not registered trademarks as a decision framework; USPTO records for these
phrases cover physical door products, not decision methods
([USPTO](https://www.uspto.gov/)). The shareholder letters are Amazon corporate
documents under copyright, but the framework's language is quoted with
attribution throughout industry, and the underlying idea — route decisions by
reversibility and consequence — is unprotectable decision-theory method. No
license is required; organizations including Netflix and Airbnb apply it freely.
Where Amazon/Bezos branding is unwanted, generic names in circulation include
"Reversible vs. Irreversible Decision Framework" and "Decision Velocity
Framework."

## Sources

- [Amazon 2015 Letter to Shareholders (PDF, published April 2016)](https://s2.q4cdn.com/299287126/files/doc_financials/annual/2015-Letter-to-Shareholders.PDF)
  (primary source; "Invention Machine" section defines one-way/two-way doors and
  Type 1/Type 2 decisions)
- [Amazon 1997 Letter to Shareholders (PDF)](https://s2.q4cdn.com/299287126/files/doc_financials/annual/Shareholderletter97.pdf)
  (primary source; establishes the decision philosophy but — contrary to
  frequent citation — contains no doors language)
- [Amazon 2016 Letter to Shareholders](https://www.aboutamazon.com/news/company-news/2016-letter-to-shareholders)
  (primary source; reiterates two-way doors within "high-velocity decision
  making," including the ~70%-of-information rule)
- Jeff Bezos, _Invent and Wander: The Collected Writings of Jeff Bezos_ (Harvard
  Business Review Press, 2020) — print collection of the letters above
- [AWS Executive Insights: Amazon's Day 1 culture](https://aws.amazon.com/executive-insights/content/how-amazon-defines-and-operationalizes-a-day-1-culture/)
  (how the framework operates inside Amazon's operating culture)
- [CNBC: Bezos's strategy for Amazon's hardest questions](https://www.cnbc.com/2018/11/19/jeff-bezos-simple-strategy-for-answering-amazons-hardest-questions--.html)
  (the two classification questions: consequences and reversibility)
- [Farnam Street: Reversible and Irreversible Decisions](https://fs.blog/reversible-irreversible-decisions/)
  (sequencing rule and the stop/lost-opportunity/know timing conditions)
- [Product Talk glossary: two-way door decision](https://www.producttalk.org/glossary-discovery-two-way-door-decision/)
  (practitioner-reported benefits: less analysis paralysis, less sunk-cost
  attachment)
- [LogRocket: Type 1 vs Type 2 decisions](https://blog.logrocket.com/product-management/type-1-vs-type-2-decisions-overview-examples/)
  (implementation steps, delay-vs-reverse cost probe, misclassification risk)
- [Decision Desk: 10 decision frameworks used by leading companies](https://decisiondesk.io/resources/10-decision-frameworks-used-by-leading-companies)
  (reversibility windows; SPADE, DACI, DRI as complementary frameworks)
- [Li et al. 2022, "Decision Reversibility and Satisfaction" (PMC9384371)](https://pmc.ncbi.nlm.nih.gov/articles/PMC9384371/)
  (peer-reviewed: reversibility lowers satisfaction via counterfactual thinking
  and anticipated regret; reversal options rarely exercised)
- [Bleichrodt & Wakker, "Regret Theory: A Bold Alternative" (history of regret theory)](https://personal.eur.nl/wakker/pdfspubld/15.2regret_history.pdf)
  (theoretical predecessors: Savage 1951, Loomes & Sugden 1982)
- [GovLoop: Deciding Who Decides — and Doors](https://www.govloop.com/community/blog/deciding-who-decides-and-doors-the-decision-maker-conundrum/)
  (critique: cascading consequences limit true reversibility)
- [USPTO](https://www.uspto.gov/) (no trademark registration of the framework
  terms as a decision method)
- [Aakash Gupta: One-Way Door Decisions](https://www.aakashg.com/one-way-doors/)
  (diagnostic toolkit: reversal-cost estimate, ~10%-of-budget threshold,
  public-commitment flag, pre-mortem exercise)
- [Cleverence: Designing Reversible Decisions](https://www.cleverence.com/articles/business-blogs/how-to-design-decisions-for-reversibility-6382/)
  (blast-radius triage question and technical reversibility checklist)

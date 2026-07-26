# Importance × Satisfaction Matrix

The Importance × Satisfaction matrix is a 2×2 quadrant model for prioritizing
customer needs. Each need is rated on two dimensions — how **important** it is
to customers (vertical axis) and how **satisfied** customers are with existing
solutions (horizontal axis) — and plotted into four quadrants: **Focus Here**
(high importance, low satisfaction — the opportunity zone), **Keep It Up** (high
importance, high satisfaction), **Overkill** (low importance, high satisfaction
— possible over-investment), and **Low Priority** (low importance, low
satisfaction). It is not a single-origin invention but a family of closely
related techniques: importance-performance analysis from 1970s marketing
research, Anthony Ulwick's opportunity scoring, and Dan Olsen's importance vs.
satisfaction framework for product management.

## When was it created?

The underlying idea dates to January 1977, when importance-performance analysis
(IPA) was published in the
[Journal of Marketing](https://journals.sagepub.com/doi/abs/10.1177/002224297704100112)
(Vol. 41, No. 1, pp. 77–79). Two later threads adapted it for innovation and
product work: Anthony Ulwick's opportunity algorithm, published in the January
2002 Harvard Business Review article
["Turn Customer Input into Innovation"](https://hbr.org/2002/01/turn-customer-input-into-innovation)
and expanded in his 2005 book _What Customers Want_ (per the
[Outcome-Driven Innovation Wikipedia article](https://en.wikipedia.org/wiki/Outcome-Driven_Innovation)),
and Dan Olsen's importance vs. satisfaction framework in
[_The Lean Product Playbook_](https://www.goodreads.com/book/show/25374501-the-lean-product-playbook)
(Wiley, 2015). The specific quadrant labels used in this app (Focus Here / Keep
It Up / Overkill / Low Priority) are a modern product-management phrasing of the
same structure; the original 1977 labels were Concentrate Here, Keep Up the Good
Work, Possible Overkill, and Low Priority.

## Who created it?

Importance-performance analysis was created by
[John A. Martilla and John C. James](https://journals.sagepub.com/doi/abs/10.1177/002224297704100112)
— at the time, respectively, Associate Professor of Marketing at Pacific
Lutheran University and Assistant Vice President of Frank Russell Co., both in
Tacoma, WA
([original paper PDF](https://umnaw.ac.id/wp-content/uploads/2019/02/Importance-performance-analysis_Martilla-James-1977.pdf)).
The opportunity-scoring adaptation was created by
[Anthony W. Ulwick](https://en.wikipedia.org/wiki/Anthony_Ulwick), who began
working on innovation strategies at IBM in 1980 and founded the consultancy
Strategyn in 1991; his Outcome-Driven Innovation methodology was developed
through the 1990s and published in
[HBR in 2002](https://hbr.org/2002/01/turn-customer-input-into-innovation). The
importance vs. satisfaction framing common in product management today was
popularized by
[Dan Olsen](https://www.goodreads.com/book/show/25374501-the-lean-product-playbook),
a product management consultant, in _The Lean Product Playbook_. Attribution
honestly spans all three: Martilla and James invented the 2×2, Ulwick made the
importance–satisfaction gap a quantitative innovation metric, and Olsen brought
it into the mainstream product-market-fit toolkit.

## What problem were they trying to solve?

Martilla and James, working with automobile dealer service data, observed that
measuring only how well a company _performs_ on attributes leaves "a problem in
translating the results of research into marketing action" — performance scores
alone don't tell you which improvements matter
([Martilla & James, 1977](https://journals.sagepub.com/doi/abs/10.1177/002224297704100112)).
Their matrix made survey results directly actionable by crossing performance
with importance. Ulwick was attacking a different failure mode: companies that
faithfully build what customers _ask for_ and still fail in the market, because
raw customer requests are poor guides to which underlying outcomes are
underserved
([HBR, 2002](https://hbr.org/2002/01/turn-customer-input-into-innovation)).
Olsen applied the same logic to the product-market-fit problem: teams waste
effort building features for needs that are either unimportant or already well
served, instead of finding needs that are important but poorly served.

## Why should someone use it?

The matrix turns fuzzy prioritization debates into a simple, evidence-based
picture. It prevents two common errors at once: over-investing in areas
customers don't care about (the Overkill quadrant) and neglecting important
needs where satisfaction is low (the Focus Here quadrant). Ulwick's version adds
a formula — opportunity = importance + max(importance − satisfaction, 0) — that
deliberately weights importance twice as heavily as satisfaction, producing a
ranked list of underserved outcomes
([Outcome-Driven Innovation](https://en.wikipedia.org/wiki/Outcome-Driven_Innovation),
[Scrum.org on opportunity scoring](https://www.scrum.org/resources/opportunity-scoring)).
Olsen frames the same insight as "opportunity to add value = importance × (1 −
satisfaction)": the biggest opportunities to create customer value live where
importance is high and satisfaction is low.

## What is the expected outcome?

Used as intended, the matrix yields a prioritized map of customer needs grounded
in data rather than opinion: a shortlist of high-importance, low-satisfaction
needs to invest in (the strongest candidates for differentiation and
product-market fit), confirmation of which existing strengths to maintain, and
identification of areas where resources can be pulled back. In Martilla and
James's original terms, it lets management "concentrate here" where it counts;
in Olsen's and Ulwick's terms, it points the team at the market's most
underserved — and therefore most valuable — opportunities.

## What is the hard evidence it works?

Thin, and mostly self-reported. The evidence base consists of the original
demonstration, one company-conducted track-record study, and practitioner
adoption:

- **Original demonstration.** Martilla and James validated the approach on
  automobile dealer service survey data, showing that crossing performance with
  importance made results actionable where performance scores alone were not
  ([Journal of Marketing, 1977](https://journals.sagepub.com/doi/abs/10.1177/002224297704100112)).
  The paper is a methods demonstration, not a controlled effectiveness study.
- **Strategyn's 2010 track-record study.** A study conducted by Strategyn itself
  reported that 86% of projects using its Outcome-Driven Innovation methodology
  were rated successful by the sponsoring company
  ([Anthony Ulwick — Wikipedia](https://en.wikipedia.org/wiki/Anthony_Ulwick)).
  This is the most quantified claim available for the opportunity-scoring
  variant, but it is self-reported by the vendor, not independently verified.
- **Recognition and adoption.** Ulwick's 2002 HBR article was named one of the
  year's breakthrough business ideas
  ([HBR, 2002](https://hbr.org/2002/01/turn-customer-input-into-innovation)),
  and Olsen's book carries strong practitioner reception
  ([Goodreads](https://www.goodreads.com/book/show/25374501-the-lean-product-playbook)).
  These indicate influence, not measured effectiveness.

No independent peer-reviewed effectiveness study or published limitation study
of the importance-satisfaction matrix was located in the sources consulted; the
framework's standing rests on its 1977 peer-reviewed origin, decades of use in
marketing research, and practitioner adoption in product management.

## How does one use it properly?

The basic protocol, consistent across the three lineages
([Martilla & James, 1977](https://journals.sagepub.com/doi/abs/10.1177/002224297704100112);
[Scrum.org](https://www.scrum.org/resources/opportunity-scoring);
[Olsen, 2015](https://www.goodreads.com/book/show/25374501-the-lean-product-playbook)):

1. **List the needs.** Enumerate the customer needs, outcomes, or attributes to
   evaluate — needs and outcomes, not feature requests.
2. **Survey and score.** Ask customers to rate each need on two dimensions:
   importance to them, and satisfaction with existing solutions (a 1–5 scale is
   typical for both).
3. **Plot the matrix.** Place each need on the 2×2 — importance on the vertical
   axis, satisfaction on the horizontal — and read the quadrants: Focus Here
   (invest and differentiate), Keep It Up (maintain), Overkill (pull back), Low
   Priority (deprioritize).
4. **Rank within Focus Here.** For a finer ordering, compute a score per need:
   Ulwick's opportunity algorithm, opportunity = importance + max(importance −
   satisfaction, 0)
   ([Outcome-Driven Innovation](https://en.wikipedia.org/wiki/Outcome-Driven_Innovation)),
   or Olsen's opportunity to add value = importance × (1 − satisfaction).
5. **Act on the ranking.** Direct discovery and roadmap investment to the
   top-ranked underserved needs; confirm maintenance of Keep It Up items;
   reallocate resources away from Overkill items.

Run the analysis during product discovery and roadmap planning. Repeat it
quarterly and when entering a new market or customer segment — importance and
satisfaction shift over time and differ across segments, so score each segment
separately rather than averaging across them. Keep granularity at the level of
customer needs or desired outcomes; scoring solution ideas instead of needs
reintroduces the request-taking problem the framework exists to avoid
([HBR, 2002](https://hbr.org/2002/01/turn-customer-input-into-innovation)).

## How does it relate to other frameworks?

- **[Kano Model](https://en.wikipedia.org/wiki/Kano_model)** (Noriaki Kano,
  1980s) — classifies needs into Must-be, One-dimensional, Attractive,
  Indifferent, and Reverse categories. Olsen pairs it with this matrix as a
  layered system: importance × satisfaction finds the underserved needs, Kano
  classifies what type of quality each represents
  ([Olsen, 2015](https://www.goodreads.com/book/show/25374501-the-lean-product-playbook)).
- **[Outcome-Driven Innovation](https://en.wikipedia.org/wiki/Outcome-Driven_Innovation)**
  (Ulwick) — the direct quantitative descendant: the same two axes formalized
  into the opportunity algorithm and embedded in a jobs-to-be-done research
  process.
- **Quality Function Deployment (QFD)** — a fuller methodology that traces
  customer requirements through to engineering specifications; the Kano model
  and importance ratings feed its matrices
  ([Kano model — Wikipedia](https://en.wikipedia.org/wiki/Kano_model)).
- **[Impact / Effort](./impact-effort.md)** — the natural next step: this matrix
  locates the opportunity (important, unsatisfied needs), and its output feeds
  the impact axis when sequencing the resulting work against cost.
- **[Eisenhower Matrix](./eisenhower-matrix.md)** — the same
  concentrate-where-it-counts logic applied to personal tasks, crossing urgency
  with importance instead of satisfaction with importance.
- **[How–Now–Wow](./how-now-wow.md)** — sorts brainstormed solution ideas by
  originality and feasibility; useful after this matrix has identified which
  needs the ideas should serve.
- **[SWOT Analysis](./swot-analysis.md)** — Keep It Up items are strengths and
  Focus Here items are opportunities in SWOT terms; this matrix grounds those
  judgments in customer data.

## What is the core insight?

The biggest opportunities live where importance is high and satisfaction is low
— so needs must be scored on both dimensions at once, because neither importance
nor satisfaction alone tells you where to invest.

## What is its intellectual-property status?

The basic framework is free to use. "Importance-performance analysis" is not
trademarked; the 2×2 structure, the generic term "importance-satisfaction
matrix," and both quadrant label sets (the 1977 originals and the modern
product-management phrasing) are published, unbranded material
([Martilla & James, 1977](https://journals.sagepub.com/doi/abs/10.1177/002224297704100112)).
The scoring formulas are published in HBR and academic sources and carry no use
restrictions. Two branded packagings sit on top of the free core:
"Outcome-Driven Innovation" is a trademarked methodology of Strategyn LLC, so
commercial use of Strategyn's ODI process and materials carries licensing
considerations
([Anthony Ulwick — Wikipedia](https://en.wikipedia.org/wiki/Anthony_Ulwick)),
and _The Lean Product Playbook_ is a copyrighted book (Wiley, 2015) whose
techniques are presented as educational material. Drawing your own
importance-satisfaction matrix and using the published formulas requires no
license.

## Sources

- [Martilla, J. A. & James, J. C. (1977), "Importance-Performance Analysis", Journal of Marketing 41(1), 77–79 (SAGE)](https://journals.sagepub.com/doi/abs/10.1177/002224297704100112)
  — original peer-reviewed publication of the 2×2 and its quadrant labels
- [Original 1977 paper (PDF)](https://umnaw.ac.id/wp-content/uploads/2019/02/Importance-performance-analysis_Martilla-James-1977.pdf)
  — full text with author affiliations and the automobile dealer example
- [Ulwick, A. W. (2002), "Turn Customer Input into Innovation", Harvard Business Review, January 2002](https://hbr.org/2002/01/turn-customer-input-into-innovation)
  — opportunity-scoring adaptation; named a breakthrough business idea
- [Outcome-Driven Innovation — Wikipedia](https://en.wikipedia.org/wiki/Outcome-Driven_Innovation)
  — Ulwick's formalization and the opportunity algorithm
- [Anthony Ulwick — Wikipedia](https://en.wikipedia.org/wiki/Anthony_Ulwick) —
  IBM background, 1991 Strategyn founding, publications, and the self-reported
  2010 86% success study
- [Opportunity Scoring — Scrum.org](https://www.scrum.org/resources/opportunity-scoring)
  — practitioner protocol for applying the opportunity algorithm
- [Olsen, D. (2015), _The Lean Product Playbook_ (Wiley) — Goodreads](https://www.goodreads.com/book/show/25374501-the-lean-product-playbook)
  — importance vs. satisfaction framing and Kano integration for product teams
- [Kano model — Wikipedia](https://en.wikipedia.org/wiki/Kano_model) —
  complementary need-classification framework; QFD context

Note: no English Wikipedia article exists for importance-performance analysis
itself (checked July 2026); the closest related articles are the Outcome-Driven
Innovation and Anthony Ulwick entries cited above.

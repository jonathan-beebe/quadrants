# Risk Matrix

> **How likely vs. how bad:** which risks deserve action now, which need a
> backup plan, and which you can safely accept.

The Risk Matrix (also consequence/probability matrix or hazard risk assessment
matrix) is a grid model for assessing risks along two axes: **likelihood** (how
probable is the event?) and **impact** (how severe if it happens?). Professional
standards typically use 3×3 to 5×5 grids whose cells map to risk levels
(high/serious/medium/low) and acceptance authorities; the 2×2 simplification
used in this app assigns an action per quadrant: high likelihood / high impact —
**Mitigate Now**; low likelihood / high impact — **Plan Contingency**; high
likelihood / low impact — **Monitor**; low likelihood / low impact — **Accept**.

## When was it created?

Incrementally, over roughly two decades of U.S. defense system-safety practice —
there is no single creation date. Per the U.S. Air Force's own history of the
standard
([McAllister & Turner, "Evolution of MIL-STD-882E"](https://ndia.dtic.mil/wp-content/uploads/2005/systems/wednesday/mcallister.pdf)):
the original **MIL-STD-882 (July 1969)** defined hazard severity levels but had
no matrix; **MIL-STD-882A (June 1977)** added qualitative probability levels and
risk acceptance; and **MIL-STD-882B (March 1984)** was the first revision to
publish qualitative risk matrices (severity × probability, in its appendix).
[Wikipedia](https://en.wikipedia.org/wiki/Risk_matrix) additionally points to
the DoD's Instruction 6055.1 update (January 1978) as a step toward the matrix,
and to business author David E. Hussey using a comparable investment risk matrix
in August 1978 — so parallel civilian use appears around the same period. Broad
cross-industry standardization came much later, with
[AS/NZS 4360 (1995, revised 1999 and 2004)](https://www.preventionweb.net/publication/nzs-43602004-risk-management)
and then
[ISO 31000, first published in 2009](https://en.wikipedia.org/wiki/ISO_31000)
(revised 2018), whose companion technique standard
[IEC 31010 (2009, revised 2019)](https://www.iso.org/standard/72140.html)
catalogs the consequence/probability matrix as a risk assessment technique.

## Who created it?

No individual creator; it is a committee-and-standards artifact. The severity
and probability scales that define the classic matrix were assembled by U.S.
Department of Defense working groups across the MIL-STD-882 revisions — the Air
Force history describes the numbers as "done by committee (like a camel),"
noting for instance that the 10⁻⁶ "improbable" threshold "originated in the
munitions world" because one-in-a-million "seemed unapproachable"
([McAllister & Turner](https://ndia.dtic.mil/wp-content/uploads/2005/systems/wednesday/mcallister.pdf)).
Precursor practice includes ballistic-missile system-safety analysis (Ballistic
Systems Division Exhibit 62-41, 1962) and MIL-S-38130A (1966), neither of which
had levels or a matrix. Later standards bodies (Standards Australia for AS/NZS
4360, ISO for [31000](https://en.wikipedia.org/wiki/ISO_31000)/IEC 31010)
generalized the tool beyond defense. Any source naming a single inventor of the
risk matrix should be treated as unreliable.

## What problem were they trying to solve?

Cold War-era weapons, aircraft, and space programs were producing hazards too
numerous and too varied to treat uniformly, and safety analysis was being "done
after the fact"
([McAllister & Turner](https://ndia.dtic.mil/wp-content/uploads/2005/systems/wednesday/mcallister.pdf)).
Program managers needed a way to (a) rank identified hazards consistently across
contractors and programs, (b) decide which risks required engineering mitigation
before fielding versus which could be formally accepted, and (c) tie
residual-risk acceptance to an appropriate level of authority. Crossing severity
categories with probability levels gave each hazard a comparable risk code —
e.g. "1B: catastrophic/probable" — making prioritization and acceptance
decisions auditable rather than ad hoc
([MIL-STD-882E](https://safety.army.mil/Portals/0/Documents/ON-DUTY/SYSTEMSAFETY/Standard/MIL-STD-882E-change-1.pdf)).

## Why should someone use it?

It makes risk comparable and communicable. A risk register scored on likelihood
× impact turns a heterogeneous pile of worries into a ranked map that
non-specialists can read at a glance, and each cell can carry a pre-agreed
response (mitigate, plan a contingency, monitor, accept) and an owner. It is the
lingua franca of risk management — embedded in
[ISO 31000](https://en.wikipedia.org/wiki/ISO_31000)-aligned processes, the
[PMBOK Guide's qualitative risk analysis](https://www.knowledgehut.com/blog/project-management/probability-and-impact-matrix),
and safety engineering — so using it also buys compatibility with how auditors,
regulators, and partners already think. The tool has documented limitations:
Tony Cox's
["What's Wrong with Risk Matrices?" (Risk Analysis, 2008)](https://onlinelibrary.wiley.com/doi/10.1111/j.1539-6924.2008.01030.x)
showed that coarse matrices can have poor resolution, can rank risks incorrectly
relative to their quantitative expected loss, and invite arbitrary category
assignments ([Wikipedia](https://en.wikipedia.org/wiki/Risk_matrix) summarizes
this critique). Use it for triage and communication, not as a substitute for
quantitative analysis of the biggest risks.

## What is the expected outcome?

Used as intended, every identified risk gets a position on the grid, and the
position dictates a proportionate response: high-likelihood/high-impact risks
get active mitigation now; low-likelihood/high-impact risks get contingency
plans; high-likelihood/low-impact risks get monitoring with defined triggers;
low-likelihood/low-impact risks get explicit, recorded acceptance. The expected
organizational outcome is that mitigation effort concentrates where exposure is
greatest, that accepting a risk becomes a deliberate signed decision rather than
a silent omission, and that the register can be re-scored over time to show
whether exposure is trending down — the auditable, prioritized hazard management
the DoD standards were written to produce
([MIL-STD-882E](https://safety.army.mil/Portals/0/Documents/ON-DUTY/SYSTEMSAFETY/Standard/MIL-STD-882E-change-1.pdf)).

## What is the hard evidence it works?

Mixed, and thin until about 2020. The evidence divides into a validated critique
and recent controlled studies of when the tool helps:

- **The critique is peer-reviewed and quantified.**
  [Cox (Risk Analysis, 2008)](https://onlinelibrary.wiley.com/doi/10.1111/j.1539-6924.2008.01030.x)
  proved that coarse matrices have limited resolution — a typical matrix can
  correctly compare fewer than 10% of randomly selected hazard pairs — and that
  ordinal scales cause "range compression," placing quantitatively very
  different risks in the same cell. Follow-up technical work documents further
  problems with ordinal scoring
  ([arXiv:2103.05440](https://arxiv.org/pdf/2103.05440)), and Douglas Hubbard's
  work in cybersecurity risk defends Cox's findings and demonstrates
  quantitative alternatives
  ([FAIR Institute](https://www.fairinstitute.org/blog/how-to-measure-anything-risk-guru-douglas-hubbard-to-speak-at-2019-fair)).
- **Randomized controlled studies support triage and communication use.**
  [Sutherland et al. (Risk Analysis, 2022)](https://onlinelibrary.wiley.com/doi/full/10.1111/risa.13822),
  across randomized controlled studies with 2,699 participants, found that
  matrices are not always superior to plain text for presenting risk, but that
  design choices — nonlinear labeling matched to nonlinear scales, and cell
  sizes that grow geometrically — improve comprehension.
  [Proto et al. (Risk Analysis, 2023)](https://onlinelibrary.wiley.com/doi/full/10.1111/risa.14091)
  ran follow-up randomized studies on how colored cells affect decision-making
  and risk perception.
- **Applied evidence exists in healthcare.** A
  [BMC Health Services Research (2022) study](https://link.springer.com/article/10.1186/s12913-022-07484-7)
  found the matrix a workable tool for weighing probability and impact when
  deciding on preventive and diagnostic interventions in clinical guideline
  development.

Net: the evidence supports the matrix as a communication and triage device when
designed per the Sutherland findings, and confirms it misranks high-consequence
risks relative to quantitative expected-loss analysis.

## How do you get into the right mindset?

Scoring goes better when the risks are already on the table, so prime the hunt
before you plot. Facilitation guidance says to open with prompts tied to
concrete operations rather than a vague "what are our risks?" — "What could go
wrong during procurement or vendor selection?", "Where have we experienced
delays or cost overruns in the past?" — to sweep categories (financial,
operational, compliance, reputational, strategic) so nothing is missed, and to
establish up front that the session is "a safe space for honest discussion — not
blame or finger-pointing"
([V-Comply](https://www.v-comply.com/blog/facilitating-productive-risk-workshops-a-practical-guide-for-risk-leaders/)).

Then orient each axis before placing a risk:

- **Likelihood:** "Has this risk occurred before and, if so, how often?" "Are
  there risks similar to this one that have occurred?"
  ([Asana](https://asana.com/resources/risk-matrix-template))
- **Impact:** "What is the most negative outcome that could come from this
  risk?" "How hard will it be to recover from this risk?"
  ([Asana](https://asana.com/resources/risk-matrix-template))

One habit to carry in: judge the two axes independently — a frightening outcome
is not evidence that it is likely, and a frequent nuisance is not evidence that
it is severe.

## How does one use it properly?

The matrix operates inside the
[ISO 31000:2018](https://www.iso.org/standard/65694.html) risk management
process (identify → analyze → evaluate → treat → monitor). Concretely:

1. **Set context first.** Define risk appetite, objectives, and stakeholders
   before scoring anything
   ([ISO 31000 guidance](https://www.metricstream.com/learn/iso-31000-framework-guide.html)).
2. **Customize the scales.** Write likelihood and impact definitions specific to
   your organization or project rather than adopting a generic template; PMBOK
   likewise directs tailoring probability/impact definitions early in the risk
   management plan
   ([Smartsheet](https://www.smartsheet.com/content/iso-31000-templates),
   [KnowledgeHut](https://www.knowledgehut.com/blog/project-management/probability-and-impact-matrix)).
3. **Design for comprehension.** Use nonlinear labels when the underlying scale
   is nonlinear (e.g. 0.1%, 1%, 10%, 50%, 90% rather than evenly spaced words),
   and put the definitions on the axes themselves instead of a separate key
   ([Sutherland et al. 2022](https://onlinelibrary.wiley.com/doi/full/10.1111/risa.13822)).
4. **Pre-agree the response per quadrant and assign owners.** High
   likelihood/high impact → mitigate now; low likelihood/high impact → plan
   contingency; high likelihood/low impact → monitor with defined triggers; low
   likelihood/low impact → accept and record the acceptance.
5. **Score each risk into a register.** Assign likelihood and impact per risk,
   record it with its owner and response, and use the grid view for
   prioritization conversations.
6. **Review on a cadence.** Re-score at minimum quarterly, and additionally on
   significant incidents, business-context or regulatory changes, or when a
   treatment completes
   ([ProjectBalm](https://www.projectbalm.com/blog/implementing-iso),
   [Protecht](https://www.protechtgroup.com/en-us/blog/iso-31000-risk-management-framework-your-complete-guide)).
7. **Escalate the largest risks to quantitative analysis.** For high-consequence
   items, follow the matrix triage with numerical estimation (distributions,
   expected loss) rather than stopping at the cell label
   ([Cox 2008](https://onlinelibrary.wiley.com/doi/10.1111/j.1539-6924.2008.01030.x)).

## How does it relate to other frameworks?

Within this library:

- [Worry Matrix](./worry-matrix.md) — the personal-scale cousin: it sorts
  concerns by control and importance where the Risk Matrix sorts them by
  likelihood and impact; using both separates "what threatens us" from "what we
  can act on."
- [One-Way / Two-Way Doors](./one-way-two-way-doors.md) — reinforcing:
  reversibility is a second lens on impact, and irreversible (one-way) decisions
  deserve the same scrutiny as high-impact cells.
- [Impact / Effort](./impact-effort.md) — the same grid logic applied to
  choosing mitigations: once the Risk Matrix says what to treat, impact/effort
  helps pick which treatments to do first.
- [Eisenhower Matrix](./eisenhower-matrix.md) — structural sibling (urgency ×
  importance for tasks); the Risk Matrix is its forward-looking counterpart for
  uncertain events.
- [Knowns & Unknowns](./knowns-unknowns.md) — upstream complement: it surfaces
  the unknown-unknowns that never make it onto a risk register, which the matrix
  can only score once identified.
- [SWOT Analysis](./swot-analysis.md) — its Threats quadrant is a natural intake
  feed for the Risk Matrix.

Outside this library:

- **FMEA** — bottom-up failure-mode analysis producing a Severity × Occurrence ×
  Detection score; complements the matrix for detailed hazard analysis
  ([iFluids](https://ifluids.com/blog/process-hazard-analysis-tools/)).
- **Bow-Tie Analysis** — connects causes, a top event, consequences, and the
  barriers between them; used alongside matrices for hazard visualization
  ([Umbrex](https://umbrex.com/resources/frameworks/project-management-frameworks/bowtie-risk-analysis/)).
- **STPA** — control-theoretic hazard analysis for complex systems where risks
  arise from interactions rather than component failures
  ([ICAO](https://www.icao.int/sites/default/files/SMI/TrainingDocs/Chapter%202%20Safety%20Management%20Fundamentals/2.6-05-SRM-Methodology-STPA.pdf)).
- **FAIR** — Jack A. Jones's quantitative framework decomposing risk into loss
  event frequency and loss magnitude with probability distributions; the main
  standardized answer to Cox's critique
  ([FAIR Standard v3.0](<https://www.fairinstitute.org/hubfs/Standards%20Artifacts/Factor%20Analysis%20of%20Information%20Risk%20(FAIR)%20Standard%20v3.0%20(January%202025).pdf>),
  [Wikipedia](https://en.wikipedia.org/wiki/Factor_analysis_of_information_risk)).
- **Monte Carlo simulation** — models risk as distributions over cost, duration,
  or outcomes, avoiding ordinal-scale limitations
  ([Nature HSSC, 2024](https://www.nature.com/articles/s41599-024-03180-5)).

## What is the core insight?

Risk is not one quantity but two — how likely and how bad — and crossing them
turns an unranked pile of worries into a map where each position prescribes a
proportionate, ownable response.

## What is its intellectual-property status?

Free to use. "Risk matrix" is generic industry terminology with no trademark,
and the likelihood × impact grid concept carries no copyright or patent
restrictions — it may be adopted, implemented, and taught in any context,
including commercial products and open-source tools
([Wikipedia](https://en.wikipedia.org/wiki/Risk_matrix),
[TechTarget](https://www.techtarget.com/searchdisasterrecovery/feature/How-to-use-a-risk-assessment-matrix-A-free-template-and-guide),
[Open Risk Management](https://www.openriskmanagement.com/open-source-risk-models/)).
The only IP that exists is on specific published documents: ISO and IEC sell
their standards texts ([ISO 31000](https://www.iso.org/standard/65694.html),
[IEC 31010](https://www.iso.org/standard/72140.html)), PMI copyrights the PMBOK
Guide, and vendors may brand particular templates — but none of that restricts
building or using a generic likelihood × impact matrix.

## Sources

- [Wikipedia — Risk matrix](https://en.wikipedia.org/wiki/Risk_matrix) (history
  including DoDI 6055.1 (1978), Hussey (1978), MIL-STD-882B (1984), the Cox
  critique, and generic-term status)
- [McAllister & Turner, "Evolution of MIL-STD-882E," NDIA Systems Engineering Conference presentation (PDF)](https://ndia.dtic.mil/wp-content/uploads/2005/systems/wednesday/mcallister.pdf)
  (primary-adjacent USAF history: version dates 1969–2000 and which revisions
  introduced levels and matrices)
- [MIL-STD-882E w/Change 1, Department of Defense Standard Practice: System Safety (PDF)](https://safety.army.mil/Portals/0/Documents/ON-DUTY/SYSTEMSAFETY/Standard/MIL-STD-882E-change-1.pdf)
  (primary source; current severity/probability categories and risk assessment
  matrix)
- [Wikipedia — ISO 31000](https://en.wikipedia.org/wiki/ISO_31000) (2009
  publication, 2018 revision; the civilian standardization path)
- [ISO 31000:2018 — official standard listing](https://www.iso.org/standard/65694.html)
  (risk management guidelines; the process the matrix operates within)
- [IEC 31010:2019 — official standard listing](https://www.iso.org/standard/72140.html)
  (companion technique catalog including the consequence/probability matrix)
- [PreventionWeb — AS/NZS 4360:2004](https://www.preventionweb.net/publication/nzs-43602004-risk-management)
  (Australian/New Zealand predecessor standard to ISO 31000)
- [L. A. Cox Jr., "What's Wrong with Risk Matrices?", Risk Analysis 28(2), 2008](https://onlinelibrary.wiley.com/doi/10.1111/j.1539-6924.2008.01030.x)
  (canonical critique of the tool's limits)
- [Sutherland et al., "How People Understand Risk Matrices, and How Matrix Design Can Improve their Use," Risk Analysis, 2022](https://onlinelibrary.wiley.com/doi/full/10.1111/risa.13822)
  (randomized controlled studies, n=2,699, on comprehension and design)
- [Proto et al., "Do colored cells in risk matrices affect decision-making and risk perception?", Risk Analysis, 2023](https://onlinelibrary.wiley.com/doi/full/10.1111/risa.14091)
  (follow-up randomized studies on color and decision effects)
- [BMC Health Services Research, "The risk matrix approach: a helpful tool weighing probability and impact," 2022](https://link.springer.com/article/10.1186/s12913-022-07484-7)
  (applied evidence in clinical guideline development)
- [arXiv:2103.05440 — problems with risk matrices using ordinal scales](https://arxiv.org/pdf/2103.05440)
  (technical follow-up to the Cox critique)
- [FAIR Institute — Douglas Hubbard on quantitative risk assessment](https://www.fairinstitute.org/blog/how-to-measure-anything-risk-guru-douglas-hubbard-to-speak-at-2019-fair)
  (defense of the Cox findings and quantitative alternatives)
- [FAIR Standard v3.0, January 2025 (PDF)](<https://www.fairinstitute.org/hubfs/Standards%20Artifacts/Factor%20Analysis%20of%20Information%20Risk%20(FAIR)%20Standard%20v3.0%20(January%202025).pdf>)
  (quantitative alternative framework)
- [Wikipedia — Factor analysis of information risk](https://en.wikipedia.org/wiki/Factor_analysis_of_information_risk)
  (FAIR background and its developer Jack A. Jones)
- [MetricStream — ISO 31000 framework guide](https://www.metricstream.com/learn/iso-31000-framework-guide.html)
  (process steps and context-setting)
- [Smartsheet — ISO 31000 templates and checklists](https://www.smartsheet.com/content/iso-31000-templates)
  (scale customization guidance)
- [KnowledgeHut — PMBOK probability and impact matrix](https://www.knowledgehut.com/blog/project-management/probability-and-impact-matrix)
  (project-management implementation and tailoring guidance)
- [ProjectBalm — Implementing ISO 31000](https://www.projectbalm.com/blog/implementing-iso)
  (risk register practice and review cadence)
- [Protecht — ISO 31000 risk management framework guide](https://www.protechtgroup.com/en-us/blog/iso-31000-risk-management-framework-your-complete-guide)
  (implementation steps and review triggers)
- [iFluids — process hazard analysis tools](https://ifluids.com/blog/process-hazard-analysis-tools/)
  (FMEA and complementary techniques)
- [Umbrex — Bow-Tie risk analysis](https://umbrex.com/resources/frameworks/project-management-frameworks/bowtie-risk-analysis/)
  (barrier-focused companion framework)
- [ICAO — STPA methodology training (PDF)](https://www.icao.int/sites/default/files/SMI/TrainingDocs/Chapter%202%20Safety%20Management%20Fundamentals/2.6-05-SRM-Methodology-STPA.pdf)
  (systems-theoretic alternative for complex hazards)
- [Nature Humanities and Social Sciences Communications, 2024 — beyond probability-impact matrices](https://www.nature.com/articles/s41599-024-03180-5)
  (Monte Carlo–based quantitative methodology)
- [TechTarget — risk assessment matrix template and guide](https://www.techtarget.com/searchdisasterrecovery/feature/How-to-use-a-risk-assessment-matrix-A-free-template-and-guide)
  (free-use status of the tool)
- [Open Risk Management — open-source risk models](https://www.openriskmanagement.com/open-source-risk-models/)
  (matrix functionality in unrestricted open-source tools)
- [V-Comply — facilitating productive risk workshops](https://www.v-comply.com/blog/facilitating-productive-risk-workshops-a-practical-guide-for-risk-leaders/)
  (operation-specific priming prompts, risk categories, and psychological-safety
  framing)
- [Asana — risk matrix template](https://asana.com/resources/risk-matrix-template)
  (per-axis assessment questions for likelihood and impact)

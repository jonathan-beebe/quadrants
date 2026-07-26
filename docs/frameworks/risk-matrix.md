# Risk Matrix

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
cross-industry standardization came much later, with AS/NZS 4360 and then
[ISO 31000, first published in 2009](https://en.wikipedia.org/wiki/ISO_31000)
(revised 2018), whose companion technique standard IEC 31010 catalogs the
consequence/probability matrix as a risk assessment technique.

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
[ISO 31000](https://en.wikipedia.org/wiki/ISO_31000)-aligned processes, project
management, and safety engineering — so using it also buys compatibility with
how auditors, regulators, and partners already think. Honest caveat: the tool
has serious documented limitations. Tony Cox's
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

## Sources

- [Wikipedia — Risk matrix](https://en.wikipedia.org/wiki/Risk_matrix) (history
  including DoDI 6055.1 (1978), Hussey (1978), MIL-STD-882B (1984), and the Cox
  critique)
- [McAllister & Turner, "Evolution of MIL-STD-882E," NDIA Systems Engineering Conference presentation (PDF)](https://ndia.dtic.mil/wp-content/uploads/2005/systems/wednesday/mcallister.pdf)
  (primary-adjacent USAF history: version dates 1969–2000 and which revisions
  introduced levels and matrices)
- [MIL-STD-882E w/Change 1, Department of Defense Standard Practice: System Safety (PDF)](https://safety.army.mil/Portals/0/Documents/ON-DUTY/SYSTEMSAFETY/Standard/MIL-STD-882E-change-1.pdf)
  (primary source; current severity/probability categories and risk assessment
  matrix)
- [Wikipedia — ISO 31000](https://en.wikipedia.org/wiki/ISO_31000) (2009
  publication, 2018 revision; the civilian standardization path)
- [L. A. Cox Jr., "What's Wrong with Risk Matrices?", Risk Analysis 28(2), 2008](https://onlinelibrary.wiley.com/doi/10.1111/j.1539-6924.2008.01030.x)
  (canonical critique of the tool's limits)

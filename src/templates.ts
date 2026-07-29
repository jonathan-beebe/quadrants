import type { FrameworkTemplate } from './types'

// Library of quadrant models. Ordered Core-first (broad, instantly understood)
// then Extended (narrower), then the original retro-style presets. Spec and
// rationale live in work/0-research/quadrant-model-library.md.
export const templates: FrameworkTemplate[] = [
  // ── Core ──────────────────────────────────────────────────────────────
  {
    name: 'Eisenhower Matrix',
    axisX: 'Urgency',
    axisY: 'Importance',
    quadrants: ['Schedule', 'Do First', 'Eliminate', 'Delegate'],
    colors: ['#60a5fa', '#4ade80', '#94a3b8', '#fbbf24'],
    description: 'Separate what truly matters from what merely feels urgent.',
    summary:
      'Urgent vs. important: untangles what presses for attention now from what advances long-term goals, so busyness stops passing for progress.',
    category: 'Prioritize',
  },
  {
    name: 'Impact / Effort',
    axisX: 'Effort',
    axisY: 'Impact',
    quadrants: ['Quick Wins', 'Big Bets', 'Fill-Ins', 'Thankless Tasks'],
    colors: ['#4ade80', '#60a5fa', '#fbbf24', '#94a3b8'],
    description: 'Find the quick wins by weighing value against cost.',
    summary:
      'Value vs. cost: when everything looks worth doing, weighing both at once reveals which few items deserve the next unit of effort.',
    category: 'Prioritize',
  },
  {
    name: 'One-Way / Two-Way Doors',
    axisX: 'Consequence',
    axisY: 'Reversibility',
    quadrants: ['Just Decide', 'Experiment', "Don't Agonize", 'Deliberate'],
    colors: ['#4ade80', '#60a5fa', '#fbbf24', '#ef4444'],
    description: 'Match decision effort to how reversible the choice is.',
    summary:
      'Speed vs. caution: decide fast on choices you can undo, and reserve slow deliberation for the few you cannot.',
    category: 'Prioritize',
  },
  {
    name: 'Risk Matrix',
    axisX: 'Likelihood',
    axisY: 'Impact',
    quadrants: ['Plan Contingency', 'Mitigate Now', 'Accept', 'Monitor'],
    colors: ['#fbbf24', '#ef4444', '#4ade80', '#f97316'],
    description: 'Rank risks by how likely they are against how bad they are.',
    summary:
      'How likely vs. how bad: which risks deserve action now, which need a backup plan, and which you can safely accept.',
    category: 'Prioritize',
  },
  {
    name: 'Growth–Share Matrix',
    axisX: 'Market Share',
    axisY: 'Market Growth',
    quadrants: ['Question Marks', 'Stars', 'Dogs', 'Cash Cows'],
    colors: ['#a78bfa', '#fbbf24', '#94a3b8', '#4ade80'],
    description: 'Decide what to feed, milk, or drop across a portfolio.',
    summary:
      'Cash today vs. growth tomorrow: which businesses should fund the portfolio, which deserve the money, and which should be cut.',
    category: 'Strategize',
  },
  {
    name: 'Power × Interest',
    axisX: 'Interest',
    axisY: 'Power',
    quadrants: ['Keep Satisfied', 'Manage Closely', 'Monitor', 'Keep Informed'],
    colors: ['#fbbf24', '#ef4444', '#94a3b8', '#60a5fa'],
    description: 'Manage stakeholders by their power and their interest.',
    summary:
      'Who can affect the outcome vs. who cares about it: where to spend scarce engagement effort so no powerful, quiet stakeholder blindsides the work.',
    category: 'Strategize',
  },
  {
    name: 'Skill × Will',
    axisX: 'Skill',
    axisY: 'Will',
    quadrants: ['Guide', 'Delegate', 'Direct', 'Motivate'],
    colors: ['#60a5fa', '#4ade80', '#fbbf24', '#f97316'],
    description: 'Coach each person by their skill paired with their motivation.',
    summary:
      "Can't vs. won't: the two look identical from the outside but demand opposite responses, and plotting skill against will shows which one you face.",
    category: 'People & Self',
  },
  {
    name: 'Passion × Proficiency',
    axisX: 'Good At It',
    axisY: 'Love It',
    // Amber = eager anticipation, green = fulfilled flow, slate =
    // indifference, ash-stone = joyless grind toward burnout.
    quadrants: ['Invest', 'Sweet Spot', 'Avoid', 'Burnout Zone'],
    colors: ['#fbbf24', '#4ade80', '#94a3b8', '#a8a29e'],
    description: 'Audit work by what you are good at versus what you love.',
    summary:
      "What you love vs. what you're good at: reveals when competence, not passion, is deciding how you spend your week — and which work to reclaim.",
    category: 'People & Self',
  },
  // ── Mental health ─────────────────────────────────────────────────────
  {
    name: 'Mood Meter',
    axisX: 'Pleasantness',
    axisY: 'Energy',
    // RULER canon: red = tense, yellow = excited (joy), blue-indigo = down
    // (sadness), green = calm (contentment).
    quadrants: ['Tense', 'Excited', 'Down', 'Calm'],
    colors: ['#ef4444', '#facc15', '#818cf8', '#4ade80'],
    description: 'Name an emotion by its pleasantness and its energy.',
    summary:
      'Pleasantness vs. energy: two questions anyone can answer turn a vague "fine" or "stressed" into a word specific enough to act on.',
    category: 'Mental Health',
  },
  {
    name: 'Thayer Mood Model',
    axisX: 'Tension',
    axisY: 'Energy',
    // Green = calm vitality (flow), orange = anxious drive, blue = restful
    // ease, slate = weary gloom (Thayer's worst-mood state).
    quadrants: ['Calm-Energy', 'Tense-Energy', 'Calm-Tiredness', 'Tense-Tiredness'],
    colors: ['#4ade80', '#f97316', '#60a5fa', '#94a3b8'],
    description: 'Read a mood as energy crossed with tension, then shift it.',
    summary: 'Energy vs. tension: turn "I feel bad" into "tired and tense" — a reading that points to a specific fix.',
    category: 'Mental Health',
  },
  {
    name: 'Affect Grid',
    axisX: 'Pleasure',
    axisY: 'Arousal',
    // Red = stress alarm, yellow = exhilaration, slate = depressive
    // flatness, teal = tranquil unwinding.
    quadrants: ['Stress', 'Excitement', 'Depression', 'Relaxation'],
    colors: ['#ef4444', '#facc15', '#94a3b8', '#2dd4bf'],
    description: 'Plot a feeling by its pleasure and arousal on one grid.',
    summary:
      'How pleasant vs. how energized: one mark pins a vague feeling to two scores you can track, repeat, and compare.',
    category: 'Mental Health',
  },
  {
    name: 'Positive × Negative Affect',
    axisX: 'Positive Affect',
    axisY: 'Negative Affect',
    // Red = distress, violet = ambivalence (the one hue with mixed
    // valence in the research), slate = flat disengagement, green = content.
    quadrants: ['Distressed', 'Conflicted', 'Disengaged', 'Content'],
    colors: ['#ef4444', '#a78bfa', '#94a3b8', '#4ade80'],
    description: 'Track positive and negative affect as independent scales.',
    summary:
      'Engagement vs. distress: the two move independently, so a flat, low-energy mood and an anxious, distressed one are different problems with different fixes.',
    category: 'Mental Health',
  },
  {
    name: 'Dual Continuum of Mental Health',
    axisX: 'Mental Illness / No Illness',
    axisY: 'Wellbeing',
    // Teal = calm resilience, green = flourishing growth, red = acute
    // distress, stone = the stagnant emptiness of languishing.
    quadrants: ['Flourishing with Illness', 'Flourishing', 'Struggling', 'Languishing'],
    colors: ['#2dd4bf', '#4ade80', '#ef4444', '#a8a29e'],
    description: 'Separate mental illness from wellbeing — two continua, not one.',
    summary:
      'Illness vs. wellbeing: being free of symptoms is not the same as living well, so treating illness and building wellbeing are two separate jobs.',
    category: 'Mental Health',
  },
  {
    name: 'Energy Quadrants',
    axisX: 'Emotional Positivity',
    axisY: 'Energy',
    // Red = fight-or-flight alarm, green = engaged vitality, ash-stone =
    // burned-out depletion, blue = restorative relief.
    quadrants: ['Survival', 'Performance', 'Burnout', 'Recovery'],
    colors: ['#ef4444', '#4ade80', '#a8a29e', '#60a5fa'],
    description: 'Manage energy, not time, to stay out of the burnout zone.',
    summary:
      'Spending vs. renewing energy: locating your current zone tells you whether to keep pushing, calm down, or stop and refill.',
    category: 'Mental Health',
  },
  {
    name: 'Zones of Regulation',
    axisX: '',
    axisY: '',
    // The curriculum's literal zone colors; true yellow, not amber.
    quadrants: ['Blue Zone', 'Green Zone', 'Yellow Zone', 'Red Zone'],
    colors: ['#60a5fa', '#4ade80', '#facc15', '#ef4444'],
    description: 'Name your zone of alertness and pick a tool to regulate it.',
    summary:
      'How you feel vs. what the moment needs: no zone is good or bad — the teachable skill is naming your state and shifting it to match the situation.',
    category: 'Mental Health',
  },
  {
    name: 'Attachment Styles',
    axisX: 'Avoidance',
    axisY: 'Anxiety',
    // Orange = anxious activation, violet = fear, green = secure calm,
    // slate = cool emotional distance.
    quadrants: ['Preoccupied', 'Fearful-Avoidant', 'Secure', 'Dismissive-Avoidant'],
    colors: ['#f97316', '#a78bfa', '#4ade80', '#94a3b8'],
    description: 'Locate a relating style by attachment anxiety and avoidance.',
    summary:
      'Fear of abandonment vs. discomfort with closeness: see which learned reflex drives your recurring relationship trouble, and what secure functioning would look like from there.',
    category: 'Mental Health',
  },
  {
    name: 'OK Corral',
    axisX: "I'm OK",
    axisY: "You're OK",
    // Indigo = sad one-down withdrawal, green = healthy relating, slate =
    // hopeless futility, red = angry one-up rejection.
    quadrants: ['Get Away From', 'Get On With', 'Get Nowhere With', 'Get Rid Of'],
    colors: ['#818cf8', '#4ade80', '#94a3b8', '#ef4444'],
    description: 'Notice the life position you relate from: OK or not OK.',
    summary:
      'Your worth vs. theirs: which of the four stances is driving this encounter, and how to steer back to the only one that resolves anything.',
    category: 'Mental Health',
  },
  // ── Extended ──────────────────────────────────────────────────────────
  {
    name: 'Ansoff Matrix',
    axisX: 'Existing / New Products',
    axisY: 'Existing / New Markets',
    quadrants: ['Market Development', 'Diversification', 'Market Penetration', 'Product Development'],
    colors: ['#fbbf24', '#ef4444', '#4ade80', '#fbbf24'],
    description: 'Plan growth by how new the product and the market are to you.',
    summary:
      "What you know vs. what you don't: turns vague growth ambition into a deliberate choice among four paths with escalating risk.",
    category: 'Strategize',
  },
  {
    name: 'Vision × Execution',
    axisX: 'Completeness of Vision',
    axisY: 'Ability to Execute',
    quadrants: ['Challengers', 'Leaders', 'Niche Players', 'Visionaries'],
    colors: ['#60a5fa', '#4ade80', '#94a3b8', '#a78bfa'],
    description: 'Compare players by vision against ability to deliver.',
    summary:
      'Delivering today vs. steering tomorrow: know which strength each vendor is selling you before you commit to a multi-year relationship.',
    category: 'Strategize',
  },
  {
    name: 'Knowns & Unknowns',
    axisX: 'Knowledge',
    axisY: 'Awareness',
    quadrants: ['Known Unknowns', 'Known Knowns', 'Unknown Unknowns', 'Unknown Knowns'],
    colors: ['#60a5fa', '#4ade80', '#ef4444', '#a78bfa'],
    description: 'Surface what you know, what you do not, and what you assume.',
    summary:
      'Knowledge vs. awareness: shows where confidence is earned, which questions to chase, and which blind spots only contingency can cover.',
    category: 'Understand',
  },
  {
    name: 'Certainty × Agreement',
    axisX: 'Certainty',
    axisY: 'Agreement',
    quadrants: ['Experiment', 'Plan', 'Stabilize', 'Negotiate'],
    colors: ['#a78bfa', '#4ade80', '#ef4444', '#fbbf24'],
    description: 'Choose how to work as certainty and alignment vary.',
    summary:
      'Certainty vs. agreement: diagnose whether the work calls for a plan, an experiment, a negotiation, or stabilizing first — instead of planning by default.',
    category: 'Understand',
  },
  {
    name: 'Johari Window',
    axisX: 'Known to Self',
    axisY: 'Known to Others',
    quadrants: ['Blind Spot', 'Open', 'Unknown', 'Hidden'],
    colors: ['#fbbf24', '#4ade80', '#94a3b8', '#60a5fa'],
    description: 'Grow self-awareness through feedback and disclosure.',
    summary:
      'What you know of yourself vs. what others see: self-awareness grows through two concrete acts — disclose what you hide, invite feedback on what you cannot see.',
    category: 'Understand',
  },
  {
    name: 'Competence Ladder',
    axisX: 'Competence',
    axisY: 'Awareness',
    quadrants: ['Conscious Incompetence', 'Conscious Competence', 'Unconscious Incompetence', 'Unconscious Competence'],
    colors: ['#fbbf24', '#60a5fa', '#94a3b8', '#4ade80'],
    description: 'Locate where you are on the path from novice to mastery.',
    summary:
      "Competence vs. awareness: knowing which stage of learning you're in turns the discouraging middle into a sign of progress, not failure.",
    category: 'Understand',
  },
  {
    name: 'Importance × Satisfaction',
    axisX: 'Satisfaction',
    axisY: 'Importance',
    quadrants: ['Focus Here', 'Keep It Up', 'Low Priority', 'Overkill'],
    colors: ['#f97316', '#4ade80', '#94a3b8', '#fbbf24'],
    description: 'Spot opportunities users care about but rate poorly today.',
    summary:
      "What customers care about vs. how well it's served: pinpoints the important, poorly met needs where investment creates the most value.",
    category: 'Build',
  },
  {
    name: 'Worry Matrix',
    axisX: 'Control',
    axisY: 'Importance',
    // A deliberately cool, calming set for an anxiety tool: teal = serene
    // acceptance, green = empowered action, blue = relief of release,
    // slate = indifferent shrug.
    quadrants: ['Accept & Adapt', 'Take Action', 'Let It Go', 'Not Worth It'],
    colors: ['#2dd4bf', '#4ade80', '#60a5fa', '#94a3b8'],
    description: 'Focus worry where you have both stakes and control.',
    summary:
      'What you can change vs. what deserves your energy: every looping worry resolves into one move — act, adapt, deprioritize, or release.',
    category: 'People & Self',
  },
  {
    name: 'How–Now–Wow',
    axisX: 'Originality',
    axisY: 'Ease of Implementation',
    // Blue = comfortable confidence (COCD's "feasible" blue), yellow =
    // surprise and joy, slate = the polite goodbye, violet = imaginative
    // "how might we".
    quadrants: ['Now', 'Wow', 'Ciao', 'How'],
    colors: ['#60a5fa', '#facc15', '#94a3b8', '#a78bfa'],
    description: 'Triage brainstormed ideas by originality and ease.',
    summary:
      'Original vs. doable: sorts brainstormed ideas into quick wins, breakthrough bets, and a parked backlog before the group defaults to its safest options.',
    category: 'Build',
  },
  // ── Retro-style presets (original library) ──────────────────────────────
  {
    name: 'Start / Stop / Continue / Change',
    axisX: 'Existing / New',
    axisY: 'Rethink / Embrace',
    quadrants: ['Continue', 'Start', 'Stop', 'Change'],
    colors: ['#4ade80', '#60a5fa', '#ef4444', '#fbbf24'],
    description: 'Retro your habits: what to start, stop, continue, or change.',
    summary:
      'Protect vs. rethink: every practice on the board gets an imperative — start, stop, continue, or adjust — so feedback ends in commitments, not complaints.',
    category: 'Retrospect',
  },
  {
    name: 'Keep / Problem / Try / Question',
    axisX: '',
    axisY: '',
    quadrants: ['Keep', 'Problem', 'Try', 'Question'],
    colors: ['#4ade80', '#ef4444', '#60a5fa', '#a78bfa'],
    description: 'A lightweight retro: what to keep, fix, try, or question.',
    summary:
      'Reflection vs. follow-through: turn what went well and what hurt into a few named experiments the next session must judge.',
    category: 'Retrospect',
  },
  {
    name: 'Love / Loathe / Learn / Leave',
    axisX: '',
    axisY: '',
    // Pink = love, red = loathing, blue = open curiosity, slate = detached
    // goodbye.
    quadrants: ['Love', 'Loathe', 'Learn', 'Leave'],
    colors: ['#f472b6', '#ef4444', '#60a5fa', '#94a3b8'],
    description: 'Reflect on what energizes you and what drains you.',
    summary:
      'Energizes you vs. drains you: a week of logged work shows what to do more of, where to grow, and what to shed.',
    category: 'Retrospect',
  },
  {
    name: 'SWOT Analysis',
    axisX: 'Helpful / Harmful',
    axisY: 'External / Internal',
    quadrants: ['Strengths', 'Weaknesses', 'Opportunities', 'Threats'],
    colors: ['#4ade80', '#ef4444', '#60a5fa', '#f97316'],
    description: 'Assess strengths, weaknesses, opportunities, and threats.',
    summary:
      "What you control vs. what you don't: a shared, honest picture of how your capabilities match outside conditions before you commit to a strategy.",
    category: 'Retrospect',
  },
  {
    name: 'CRR — Cooperative Reciprocal Relationships',
    axisX: '',
    axisY: '',
    quadrants: ['Is Working', 'Desire', 'Get Rid Of', 'Renegotiate'],
    colors: ['#4ade80', '#60a5fa', '#94a3b8', '#fbbf24'],
    description: 'Review a relationship: what works, what to change or renegotiate.',
    summary:
      'Drifting vs. choosing: which relationships to keep, renegotiate, end, or add so your needs get met on purpose, not by chance.',
    category: 'Retrospect',
  },
]

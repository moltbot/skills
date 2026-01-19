---
name: munger-observer
description: Daily wisdom review applying Charlie Munger's mental models to your work and thinking. Use when asked to review decisions, analyze thinking patterns, detect biases, apply mental models, do a "Munger review", or run the Munger Observer. Triggers on scheduled daily reviews or manual requests like "run munger observer", "review my thinking", "check for blind spots", or "apply mental models".
---

# Munger Observer

Automated daily review applying Charlie Munger's mental models to surface blind spots and cognitive traps.

## Process

### 1. Gather Today's Activity
- Read today's memory file (`memory/YYYY-MM-DD.md`)
- Scan session logs for today's activity
- Extract: decisions made, tasks worked on, problems tackled, user requests

### 2. Apply Mental Models

**Inversion**
- What could go wrong? What's the opposite of success here?
- "Tell me where I'm going to die, so I'll never go there."

**Second-Order Thinking**
- And then what? Consequences of the consequences?
- Short-term gains creating long-term problems?

**Incentive Analysis**
- What behaviors are being rewarded? Hidden incentive structures?
- "Show me the incentive and I'll show you the outcome."

**Opportunity Cost**
- What's NOT being done? Cost of this focus?
- Best alternative foregone?

**Bias Detection**
- Confirmation bias: Only seeking validating information?
- Sunk cost fallacy: Continuing because of past investment?
- Social proof: Doing it because others do?
- Availability bias: Overweighting recent/vivid information?

**Circle of Competence**
- Operating within known territory or outside?
- If outside, appropriate humility/caution?

**Margin of Safety**
- What's the buffer if things go wrong?
- Cutting it too close anywhere?

### 3. Generate Output

**If insights found:** 1-2 concise Munger-style observations
**If nothing notable:** "All clear — no cognitive landmines detected today."

## Output Format
```
🧠 **Munger Observer** — [Date]

[Insight 1: Model applied + observation + implication]

[Insight 2 if applicable]

— "Invert, always invert." — Carl Jacobi (Munger's favorite)
```

## Example
```
🧠 **Munger Observer** — January 19, 2026

**Opportunity Cost Alert:** Heavy focus on infrastructure today. The content queue is aging — are drafts decaying in value while we polish tools?

**Second-Order Check:** Speed improvement is good first-order thinking. Second-order: faster responses may raise expectations for response quality. Speed without substance is a trap.

— "Invert, always invert."
```

## Scheduling (Optional)
Set up a cron job for daily automated review:
- Recommended time: End of workday (e.g., 5pm local)
- Trigger message: `MUNGER_OBSERVER_RUN`

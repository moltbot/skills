---
name: decision-trees
description: Decision tree analysis for complex decision-making across all domains. Use when user needs to evaluate multiple options with uncertain outcomes, assess risk/reward scenarios, or structure choices systematically. Applicable to business, investment, personal decisions, operations, career choices, product strategy, and any situation requiring structured evaluation. Triggers include decision tree, should I, what if, evaluate options, compare alternatives, risk analysis.
---

# Decision Trees — Structured Decision-Making

Decision tree analysis: a visual tool for making decisions with probabilities and expected value.

## When to Use

✅ **Good for:**
- Business decisions (investments, hiring, product launches)
- Personal choices (career, relocation, purchases)
- Trading & investing (position sizing, entry/exit)
- Operational decisions (expansion, outsourcing)
- Any situation with measurable consequences

❌ **Not suitable for:**
- Decisions with true uncertainty (black swans)
- Fast tactical choices
- Purely emotional/ethical questions

## Method

**Decision tree** = tree-like structure where:
- **Decision nodes** (squares) — your actions
- **Chance nodes** (circles) — random events
- **End nodes** (triangles) — final outcomes

**Process:**
1. **Define options** — all possible actions
2. **Define outcomes** — what can happen after each action
3. **Estimate probabilities** — how likely is each outcome (0-100%)
4. **Estimate values** — utility/reward for each outcome (money, points, utility units)
5. **Calculate EV** — expected value = Σ (probability × value)
6. **Choose** — option with highest EV

## Formula

```
EV = Σ (probability_i × value_i)
```

**Example:**
- Outcome A: 70% probability, +$100 → 0.7 × 100 = $70
- Outcome B: 30% probability, -$50 → 0.3 × (-50) = -$15
- **EV = $70 + (-$15) = $55**

## Classic Example (from Wikipedia)

**Decision:** Go to party or stay home?

### Estimates:
- Party: +9 utility (fun)
- Home: +3 utility (comfort)
- Carrying jacket unnecessarily: -2 utility
- Being cold: -10 utility
- Probability cold: 70%
- Probability warm: 30%

### Tree:

```
Decision
├─ Go to party
│  ├─ Take jacket
│  │  ├─ Cold (70%) → 9 utility (party)
│  │  └─ Warm (30%) → 9 - 2 = 7 utility (carried unnecessarily)
│  │  EV = 0.7 × 9 + 0.3 × 7 = 8.4
│  └─ Don't take jacket
│     ├─ Cold (70%) → 9 - 10 = -1 utility (froze)
│     └─ Warm (30%) → 9 utility (perfect)
│     EV = 0.7 × (-1) + 0.3 × 9 = 2.0
└─ Stay home
   └─ EV = 3.0 (always)
```

**Conclusion:** Go and take jacket (EV = 8.4) > stay home (EV = 3.0) > go without jacket (EV = 2.0)

## Business Example

**Decision:** Launch new product?

### Estimates:
- Success probability: 40%
- Failure probability: 60%
- Profit if success: $500K
- Loss if failure: $200K
- Don't launch: $0

### Tree:

```
Launch product
├─ Success (40%) → +$500K
└─ Failure (60%) → -$200K

EV = (0.4 × 500K) + (0.6 × -200K) = 200K - 120K = +$80K

Don't launch
└─ EV = $0
```

**Conclusion:** Launch (EV = +$80K) is better than not launching ($0).

## Trading Example

**Decision:** Enter position or wait?

### Estimates:
- Probability of rise: 60%
- Probability of fall: 40%
- Position size: $1000
- Target: +10% ($100 profit)
- Stop-loss: -5% ($50 loss)

### Tree:

```
Enter position
├─ Rise (60%) → +$100
└─ Fall (40%) → -$50

EV = (0.6 × 100) + (0.4 × -50) = 60 - 20 = +$40

Wait
└─ No position → $0

EV = $0
```

**Conclusion:** Entering position has positive EV (+$40), better than waiting ($0).

## Method Limitations

⚠️ **Critical points:**

1. **Subjective estimates** — probabilities often "finger in the air"
2. **Doesn't account for risk appetite** — ignores psychology (loss aversion)
3. **Simplified model** — reality is more complex
4. **Unstable** — small data changes can drastically alter the tree
5. **May be inaccurate** — other methods exist that are more precise (random forests)

**But:** The method is valuable for **structuring thinking**, even if numbers are approximate.

## User Workflow

### 1. Structuring

Ask:
- What are the action options?
- What are possible outcomes?
- What are values/utility for each outcome?
- How do we measure value? (money, utility units, happiness points)

### 2. Probability Estimation

Help estimate through:
- Historical data (if available)
- Comparable situations
- Expert judgment (user experience)
- Subjective assessment (if no data)

### 3. Visualization

Draw tree in markdown:

```
Decision
├─ Option A
│  ├─ Outcome A1 (X%) → Value Y
│  └─ Outcome A2 (Z%) → Value W
└─ Option B
   └─ Outcome B1 (100%) → Value V
```

### 4. EV Calculation

For each option:
```
EV_A = (X% × Y) + (Z% × W)
EV_B = V
```

### 5. Recommendation

Option with highest EV = best choice (rationally).

**But add context:**
- Risk tolerance (can user handle worst case)
- Time horizon (when is result needed)
- Other factors (reputational risk, emotions, ethics)

## Application Examples by Domain

### Trading & Investing

**Position Sizing:**
- Options: 5%, 10%, 20% of capital
- Outcomes: Profit/loss with different probabilities
- Value: Absolute profit in $

**Entry Timing:**
- Options: Enter now, wait for -5%, wait for -10%
- Outcomes: Price goes up/down
- Value: Opportunity cost vs better entry price

### Business Strategy

**Product Launch:**
- Options: Launch / don't launch
- Outcomes: Success / failure
- Value: Revenue, market share, costs

**Hiring Decision:**
- Options: Hire candidate A / candidate B / don't hire
- Outcomes: Successful onboarding / quit after X months
- Value: Productivity, costs, opportunity cost

### Personal Decisions

**Career Change:**
- Options: Stay / change job / start business
- Outcomes: Success / failure in new role
- Value: Salary, satisfaction, growth, risk

**Real Estate:**
- Options: Buy house A / house B / continue renting
- Outcomes: Price increase / decrease / personal situation changes
- Value: Net worth, monthly costs, quality of life

### Operations

**Capacity Planning:**
- Options: Expand production / outsource / status quo
- Outcomes: Demand increases / decreases
- Value: Profit, utilization, fixed costs

**Vendor Selection:**
- Options: Vendor A / Vendor B / in-house
- Outcomes: Quality, reliability, failures
- Value: Total cost of ownership

## Calculator Script

Use `scripts/decision_tree.py` for automated EV calculations:

```bash
python3 scripts/decision_tree.py --interactive
```

Or via JSON:

```bash
python3 scripts/decision_tree.py --json tree.json
```

JSON format:

```json
{
  "decision": "Launch product?",
  "options": [
    {
      "name": "Launch",
      "outcomes": [
        {"name": "Success", "probability": 0.4, "value": 500000},
        {"name": "Failure", "probability": 0.6, "value": -200000}
      ]
    },
    {
      "name": "Don't launch",
      "outcomes": [
        {"name": "Status quo", "probability": 1.0, "value": 0}
      ]
    }
  ]
}
```

Output:

```
📊 Decision Tree Analysis

Decision: Launch product?

Option 1: Launch
  └─ EV = $80,000.00
     ├─ Success (40.0%) → +$500,000.00
     └─ Failure (60.0%) → -$200,000.00

Option 2: Don't launch
  └─ EV = $0.00
     └─ Status quo (100.0%) → $0.00

✅ Recommendation: Launch (EV: $80,000.00)
```

## Final Checklist

Before giving recommendation, ensure:

- ✅ All options covered
- ✅ Probabilities sum to 100% for each branch
- ✅ Values are realistic (not fantasies)
- ✅ Worst case scenario is clear to user
- ✅ Risk/reward ratio is explicit
- ✅ Method limitations mentioned
- ✅ Qualitative context added (not just EV)

## Method Advantages

✅ **Simple** — people understand trees intuitively
✅ **Visual** — clear structure
✅ **Works with little data** — can use expert estimates
✅ **White box** — transparent logic
✅ **Worst/best case** — extreme scenarios visible
✅ **Multiple decision-makers** — can account for different interests

## Method Disadvantages

❌ **Unstable** — small data changes → large tree changes
❌ **Inaccurate** — often more precise methods exist
❌ **Subjective** — probability estimates "from the head"
❌ **Complex** — becomes unwieldy with many outcomes
❌ **Doesn't account for risk preference** — assumes risk neutrality

## Important

The method is valuable for **structuring thinking**, but numbers are often taken from thin air.

What matters more is the process — **forcing yourself to think through all branches** and explicitly evaluate consequences.

Don't sell the decision as "scientifically proven" — it's just a framework for conscious choice.

## Further Reading

- Decision trees in operations research
- Influence diagrams (more compact for complex decisions)
- Utility functions (accounting for risk aversion)
- Monte Carlo simulation (for greater accuracy)
- Real options analysis (for strategic decisions)

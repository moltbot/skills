# Decision Trees Skill

Decision tree analysis for complex decision-making across all domains.

## 📊 What It Does

Helps you make structured decisions using decision tree analysis with expected value (EV) calculations. Works for any situation where you need to evaluate multiple options with uncertain outcomes.

## ✨ Features

- **Universal application**: business, investing, personal decisions, operations, career choices
- **Expected value calculation**: quantify risk/reward scenarios
- **Visual tree structure**: see all options and outcomes clearly
- **Python calculator**: automate EV calculations (interactive + JSON)
- **Examples across domains**: trading, business strategy, personal life, operations

## 🎯 Use Cases

### Trading & Investing
- Position sizing (how much capital to allocate)
- Entry timing (buy now or wait)
- Exit strategy (take profit or hold)

### Business Strategy
- Product launch decisions
- Hiring choices
- Capacity planning
- Vendor selection

### Personal Decisions
- Career changes
- Real estate purchases
- Major life decisions

### Operations
- Outsourcing vs in-house
- Expansion timing
- Resource allocation

## 🚀 How It Works

1. **Define options** — all possible actions
2. **Define outcomes** — what can happen after each action
3. **Estimate probabilities** — how likely is each outcome (0-100%)
4. **Estimate values** — utility/reward for each outcome (money, points, utility units)
5. **Calculate EV** — expected value = Σ (probability × value)
6. **Choose** — option with highest EV (with qualitative context)

## 📝 Example

**Decision:** Launch new product?

**Options:**
- Launch (40% success → +$500K, 60% failure → -$200K)
- Don't launch (100% → $0)

**Calculation:**
```
Launch EV = (0.4 × $500K) + (0.6 × -$200K) = $80K
Don't launch EV = $0

✅ Recommendation: Launch (EV: $80K)
```

## 🛠️ Python Calculator

The skill includes a Python script for automated EV calculations:

### Interactive mode:
```bash
python3 scripts/decision_tree.py --interactive
```

### JSON mode:
```bash
python3 scripts/decision_tree.py --json tree.json
```

**JSON format:**
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

**Output:**
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

## ⚠️ Limitations

- **Subjective probabilities** — often "finger in the air" estimates
- **Doesn't account for risk appetite** — ignores loss aversion
- **Simplified model** — reality is more complex
- **Unstable** — small data changes can drastically alter the tree
- **May be inaccurate** — other methods may be more precise

**But:** The method is valuable for **structuring thinking**, even if numbers are approximate. The process forces you to think through all branches explicitly.

## 📚 What's Included

- **SKILL.md** — Complete guide with examples across domains
- **scripts/decision_tree.py** — EV calculator (interactive + JSON mode)
- Decision tree methodology
- Classic examples (party decision, product launch, trading)
- Advantages & disadvantages
- Domain-specific applications

## 🎓 Background

Decision trees are a standard tool in:
- Operations research
- Decision analysis
- Business strategy
- Economics & finance
- Machine learning (different use case)

They've been used since the 1960s for structured decision-making under uncertainty.

## 🤝 Contributing

This is an AgentSkill for Clawdbot. Improvements welcome:
- Additional examples
- Better visualization
- Enhanced calculator features
- Domain-specific templates

## 📄 License

MIT License — free to use and modify.

## 🔗 Resources

- [Decision tree on Wikipedia](https://en.wikipedia.org/wiki/Decision_tree)
- [Decision analysis](https://en.wikipedia.org/wiki/Decision_analysis)
- [Expected value](https://en.wikipedia.org/wiki/Expected_value)
- [ClawdHub](https://clawdhub.com) — discover more skills

---

**Created for Clawdbot** — the AI-powered CLI assistant.

Install via ClawdHub:
```bash
clawdhub install decision-trees
```

Or download manually from GitHub releases.

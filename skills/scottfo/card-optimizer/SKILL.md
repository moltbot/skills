---
name: card-optimizer
description: "Credit card rewards optimizer — helps maximize cashback, points, and miles by recommending the best card for every purchase category. Tracks annual caps, calculates annual fee ROI, manages rotating quarterly categories, and suggests new cards based on spending patterns."
homepage: https://github.com/ScotTFO/card-optimizer-skill
metadata: {"clawdbot":{"emoji":"💳"}}
---

# Card Optimizer

Maximize credit card rewards by always using the right card for every purchase.

## Data Location

- **Skill logic:** `skills/card-optimizer/` (this file)
- **User data:** `data/card-optimizer/`
  - `cards.json` — card definitions, reward rates, spending estimates, category map

## Card Database Schema

Each card in `cards.json` follows this structure:

```json
{
  "id": "unique_id",
  "name": "Card Name",
  "issuer": "Issuer Name",
  "network": "visa|mastercard|amex|discover",
  "annual_fee": 95,
  "reward_type": "cashback|points|miles",
  "point_valuation_cpp": null,
  "transfer_partners": [],
  "notes": "Optional notes",
  "signup_bonus": {
    "amount": 200,
    "type": "cashback",
    "spend_requirement": 3000,
    "timeframe_months": 3,
    "earned": false
  },
  "categories": [
    {
      "category": "groceries",
      "rate": 6.0,
      "cap_amount": 6000,
      "cap_period": "yearly",
      "rate_after_cap": 1.0
    },
    {
      "category": "rotating",
      "rate": 5.0,
      "cap_amount": 1500,
      "cap_period": "quarterly",
      "rate_after_cap": 1.0,
      "quarterly_categories": {
        "Q1": ["gas", "ev_charging"],
        "Q2": ["groceries", "home_improvement"],
        "Q3": ["restaurants", "paypal"],
        "Q4": ["amazon", "target", "walmart"]
      },
      "activation_required": true
    },
    {
      "category": "everything_else",
      "rate": 1.0
    }
  ]
}
```

### Point Valuations

For points/miles cards, store `point_valuation_cpp` (cents per point):
- Chase Ultimate Rewards: 1.0 cpp base, 1.25 cpp with Sapphire Preferred, 1.5 cpp with Sapphire Reserve
- Amex Membership Rewards: 1.0 cpp base, varies by transfer partner
- When comparing cards, multiply rate × point_valuation_cpp to get effective cashback equivalent

### Category Map

The `category_map` in `cards.json` maps each spending category to the best card ID. This is the **precomputed optimal assignment** — recalculate when cards are added or removed.

### Spending Estimates

To power ROI calculations, gap analysis, and new card recommendations, the user can optionally set estimated monthly spending per category in `cards.json`:

```json
{
  "estimated_monthly_spending": {
    "groceries": 600,
    "gas": 200,
    "restaurants": 300,
    "amazon": 150,
    "streaming": 50,
    "everything_else": 500
  }
}
```

If no estimates are provided, the skill can still recommend cards per-purchase — it just can't run ROI or gap analysis. Ask the user to estimate during first-time setup.

**Note:** This skill does NOT track individual purchases. If the user wants detailed spending data, they should connect their bank accounts through a budgeting tool. These estimates are rough numbers for optimization calculations.

## Purchase Optimizer

### How to Recommend a Card

When the user asks "which card for [category]?" or "I'm buying [item]":

1. **Identify the category** from the purchase (see Category Matching below)
2. **Check all cards** for that category's reward rate
3. **Factor in caps:** If a card has a cap and the user's estimated annual spending in that category exceeds it, note the cap and when they'd likely exhaust it
4. **Factor in network acceptance:** If the best card is Amex, mention that some merchants don't accept Amex and provide a Visa/MC fallback
5. **Compare effective rates:** For points cards, use point_valuation_cpp to convert to cashback-equivalent
6. **Return recommendation** with reasoning

### Response Format

```
💳 Use: [Card Name] ([Issuer])
💰 Reward: [X]% [cashback/points/miles] on [category]
⚠️ Note: [any caps, network warnings, or caveats]
🔄 Fallback: [Next best card if merchant doesn't accept primary]
```

### Cap-Aware Recommendations

When a card has spending caps:
- **Well under cap:** Recommend normally
- **Cap likely to exhaust** (based on estimated spending): Note when the cap would be hit and what to switch to after
- **Cap exists:** Always mention the cap so the user is aware

Example: "Your Amex BCP gets 6% on groceries up to $6,000/year. At ~$600/month, you'll hit the cap around October. After that, it drops to 1% — switch to Wells Fargo Active Cash for 2%."

## Quarterly Category Management

### Rotating Categories

Some cards (Chase Freedom Flex, Discover It) have rotating 5% categories that change quarterly and require activation.

### Quarterly Alerts

At the start of each quarter (Jan 1, Apr 1, Jul 1, Oct 1):
- Check for cards with `activation_required: true`
- If not yet activated for the current quarter, remind the user
- List the current quarter's bonus categories
- Note: To automate this, add a quarterly cron job or include in the mileage check heartbeat

Store activation status per card:
```json
{
  "quarterly_activations": {
    "chase_freedom_flex": {
      "2026-Q1": {"activated": true, "date": "2026-01-02"}
    }
  }
}
```

## Annual Fee ROI Analysis

For each card with an annual fee, calculate whether it's worth keeping based on `estimated_monthly_spending`:

1. **Calculate bonus rewards:** For each bonus category, compute annual rewards at the bonus rate
2. **Calculate baseline:** What a no-fee 2% flat card would earn on the same spending
3. **Bonus value:** bonus_rewards − baseline_rewards
4. **Net ROI:** bonus_value − annual_fee
5. **Verdict:** Worth it if net ROI > 0

### Report Format

```
💳 [Card Name] — Annual Fee: $[fee]

Bonus rewards earned:     $[amount]
vs. 2% flat card:         $[amount]
Bonus value:              $[amount]
Annual fee:              -$[fee]
━━━━━━━━━━━━━━━━━━━━━━━━
Net value:                $[amount] ✅ Worth it / ❌ Consider downgrading

Break-even: Need $[X]/yr in bonus categories to justify the fee
```

## Optimization & Gap Analysis

### Spending Gap Analysis

Using `estimated_monthly_spending`, identify:

1. **Weak categories:** High spending where the best available card only earns 1-2%
2. **Underperforming fee cards:** Annual fee cards not earning enough bonus to justify the fee
3. **Cap exhaustion:** Categories where estimated spending exceeds bonus caps — may benefit from a second card
4. **Missing coverage:** Common categories with no bonus card at all

### Report Format

```
📊 Card Optimization Report

✅ Well covered:
- Groceries → Amex BCP (6%) — earning ~$360/yr
- Amazon → Chase Prime (5%) — earning ~$90/yr

⚠️ Gaps identified:
- Dining: $300/mo at 2% (Chase Prime) — a 4% dining card would save $72/yr
- Travel: $200/mo at 1% — a 3x travel card would earn $48 more/yr

❌ Fee card alert:
- [Card] costs $95/yr but only generates $60 in bonus rewards — net loss of $35

💡 Recommendations:
- Adding [Card Name] would earn ~$[X] more per year on [categories]
- Consider downgrading [Card] to the no-fee version
```

### New Card Recommendations

Based on spending estimates, suggest cards that would add value:

1. Identify the user's highest-spending weak categories
2. Match against popular cards with strong rates in those categories
3. Calculate projected annual rewards from the new card
4. Factor in annual fees
5. Mention signup bonuses as first-year sweetener

**Do not recommend specific affiliate links** — just name the card and explain why.

**Popular cards to consider by category:**

| Category | Cards | Notes |
|----------|-------|-------|
| Dining | Chase Sapphire Preferred (3x), Amex Gold (4x), Capital One SavorOne (3%) | Sapphire and Gold have annual fees |
| Groceries | Amex BCP (6%), Amex Gold (4x MR) | BCP has $6k cap |
| Travel | Chase Sapphire Reserve (3x), Amex Platinum (5x flights), Capital One Venture X (2x) | All have significant annual fees |
| Gas | Citi Custom Cash (5% top category), PenFed Platinum Rewards (5x gas) | Custom Cash is flexible |
| Flat rate | Citi Double Cash (2%), Wells Fargo Active Cash (2%), Fidelity Visa (2%) | No-fee safety nets |
| Rotating | Chase Freedom Flex (5% quarterly), Discover It (5% quarterly + first-year match) | Requires activation |

## Category Matching

### Merchant → Category Mapping

When the user mentions a merchant, map to the correct card category:

| Merchant / Keyword | Category | Notes |
|---|---|---|
| Kroger, Publix, Safeway, HEB, Aldi, Trader Joe's | groceries | Supermarkets |
| Costco, Sam's Club | groceries OR warehouse | Costco is Visa-only in store. Amex may code as groceries at Sam's Club |
| Target, Walmart | varies | May code as "superstore" not "groceries" — depends on card issuer |
| Amazon, amazon.com | amazon | Some cards have specific Amazon category |
| Whole Foods | whole_foods OR groceries | Chase Prime has specific Whole Foods category |
| Shell, Exxon, BP, Chevron | gas | Gas stations |
| Uber, Lyft, subway, bus | transit | Public transit and rideshare |
| Netflix, Hulu, Spotify, Disney+, HBO Max, YouTube TV | streaming | Streaming subscriptions |
| Chipotle, McDonald's, DoorDash, Grubhub | restaurants | Dining and food delivery |
| CVS, Walgreens, Rite Aid | drugstores | Pharmacies |
| Hilton, Marriott, Airbnb | hotels/travel | Travel/lodging |
| United, Delta, Southwest | airlines/travel | Airfare |

### Fuzzy Category Matching

When the user says something informal:
- "food" / "eating out" / "dinner" → **restaurants**
- "grocery run" / "supermarket" → **groceries**
- "gas" / "fuel" / "fill up" → **gas**
- "uber" / "lyft" / "ride" → **transit**
- "stuff on amazon" / "prime order" → **amazon**
- "pharmacy" / "meds" / "prescription" → **drugstores**
- "subscription" / "monthly streaming" → **streaming**
- "general" / "random purchase" → **everything_else**

If ambiguous, ask: "Is this a grocery store or a restaurant?"

## Network Acceptance Warnings

### Amex Acceptance

American Express has lower merchant acceptance than Visa/Mastercard:
- Small/local businesses
- Some international merchants
- Costco (Visa only in-store in the US)
- Some government payments

**When recommending an Amex card, always provide a Visa/MC fallback.**

### Costco Special Case

Costco US stores only accept **Visa** credit cards (plus debit/cash):
- In-store: Must use Visa
- Online (costco.com): Visa, Mastercard, Discover (no Amex)

## Adding a New Card

When the user wants to add a card:

1. **Gather info:**
   - Card name and issuer
   - Payment network (Visa/MC/Amex/Discover)
   - Annual fee
   - Reward type (cashback/points/miles) and point valuation if applicable
   - Category reward rates (each bonus category + base rate)
   - Any caps or limits per category
   - Rotating categories? Which quarters, activation required?
   - Signup bonus details (optional)

2. **Research the card** if the user just gives a name — look up current reward rates, fees, and categories via web search

3. **Create card entry** in `cards.json`

4. **Recalculate `category_map`** — determine which card now wins each category

5. **Confirm** and show updated recommendations

### Removing a Card

1. Remove from `cards` array in `cards.json`
2. Recalculate `category_map`
3. Confirm and show any categories that now have weaker coverage

## First-Time Setup

If `data/card-optimizer/cards.json` doesn't exist:

1. Ask the user what credit cards they have
2. For each card, either:
   - Look up the card's current reward structure via web search, OR
   - Ask the user for rates if it's an unusual/regional card
3. Build `cards.json` with all cards and the precomputed category map
4. Ask for **estimated monthly spending** per major category (groceries, gas, dining, amazon, streaming, general, etc.) — explain this powers ROI and gap analysis but is optional
5. Run an initial optimization report showing their best card per category and any gaps

## Quick Reference

| User Says | Action |
|---|---|
| "Which card for groceries?" | Recommend best card for that category |
| "I'm buying gas" | Recommend with gas category |
| "Best card for Amazon?" | Recommend with Amazon category |
| "Annual fee worth it?" | ROI analysis for all fee cards |
| "Add a new card" | Walk through new card setup |
| "Remove a card" | Remove and recalculate |
| "Card optimization report" | Full gap analysis + recommendations |
| "What cards should I get?" | New card recommendations |
| "Activate Q2 categories" | Update quarterly activation status |
| "Does Costco take Amex?" | Network acceptance info |
| "What are my cards?" | List all cards with key rates |
| "Update my spending estimates" | Revise estimated monthly spending |

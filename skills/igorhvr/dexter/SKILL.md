---
name: dexter
description: Autonomous financial research agent for stock analysis, financial statements, metrics, prices, SEC filings, and crypto data.
metadata: {"clawdbot":{"emoji":"📊","os":["darwin","linux"],"requires":{"bins":["bun","git"]}}}
---

# Dexter Skill (Clawdbot)

Dexter is an autonomous financial research agent that plans, executes, and synthesizes financial data analysis. Use it for any financial research question involving stocks, crypto, company fundamentals, or market data.

## When to Use Dexter

Use Dexter for:
- Stock prices (current and historical)
- Financial statements (income, balance sheet, cash flow)
- Financial metrics (P/E, P/B, margins, market cap, etc.)
- SEC filings (10-K, 10-Q, 8-K)
- Analyst estimates
- Insider trades
- Company news
- Crypto prices
- Comparative financial analysis
- Revenue trends and growth rates

**Note**: Dexter's Financial Datasets API covers primarily US stocks. For international stocks (like European exchanges), it falls back to web search via Tavily.

## Installation

If Dexter is not installed, follow these steps:

### 1. Clone and Install

```bash
DEXTER_DIR="/root/clawd-workspace/dexter"

# Clone if not exists
if [ ! -d "$DEXTER_DIR" ]; then
  git clone https://github.com/virattt/dexter.git "$DEXTER_DIR"
fi

cd "$DEXTER_DIR"

# Install dependencies
bun install
```

### 2. Configure API Keys

Create `.env` file with required API keys:

```bash
cat > "$DEXTER_DIR/.env" << 'EOF'
# LLM API Keys (at least one required)
ANTHROPIC_API_KEY=your-anthropic-key

# Stock Market API Key - Get from https://financialdatasets.ai
FINANCIAL_DATASETS_API_KEY=your-financial-datasets-key

# Web Search API Key - Get from https://tavily.com (optional but recommended)
TAVILY_API_KEY=your-tavily-key
EOF
```

**API Key Sources:**
- Anthropic: https://console.anthropic.com/
- Financial Datasets: https://financialdatasets.ai (free tier available)
- Tavily: https://tavily.com (optional, for web search fallback)

### 3. Patch for Anthropic-Only Usage

Dexter's tool executor defaults to OpenAI's `gpt-5-mini`. If using Anthropic only, patch it:

```bash
# Fix hardcoded OpenAI model in tool-executor.ts
sed -i "s/const SMALL_MODEL = 'gpt-5-mini';/const SMALL_MODEL = 'claude-3-5-haiku-latest';/" \
  "$DEXTER_DIR/src/agent/tool-executor.ts"
```

### 4. Configure Model Settings

Set Claude as the default model:

```bash
mkdir -p "$DEXTER_DIR/.dexter"
cat > "$DEXTER_DIR/.dexter/settings.json" << 'EOF'
{
  "provider": "anthropic",
  "modelId": "claude-sonnet-4-5"
}
EOF
```

### 5. Create Non-Interactive Query Script

```bash
cat > "$DEXTER_DIR/query.ts" << 'SCRIPT'
#!/usr/bin/env bun
/**
 * Non-interactive Dexter query runner
 * Usage: bun query.ts "What is Apple's revenue growth?"
 */
import { config } from 'dotenv';
import { Agent } from './src/agent/orchestrator.js';
import { getSetting } from './src/utils/config.js';

config({ quiet: true });

const query = process.argv[2];
if (!query) {
  console.error('Usage: bun query.ts "Your financial question here"');
  process.exit(1);
}

const model = getSetting('modelId', 'claude-sonnet-4-5') as string;

async function runQuery() {
  let answer = '';
  
  const agent = new Agent({
    model,
    callbacks: {
      onPhaseStart: (phase) => {
        if (process.env.DEXTER_VERBOSE) {
          console.error(`[Phase: ${phase}]`);
        }
      },
      onPlanCreated: (plan) => {
        if (process.env.DEXTER_VERBOSE) {
          console.error(`[Tasks: ${plan.tasks.map(t => t.description).join(', ')}]`);
        }
      },
      onAnswerStream: async (stream) => {
        for await (const chunk of stream) {
          answer += chunk;
          process.stdout.write(chunk);
        }
      },
    },
  });

  try {
    await agent.run(query);
    if (!answer.endsWith('\n')) {
      console.log();
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

runQuery();
SCRIPT
```

### Full One-Shot Installation

Complete installation script (requires API keys as environment variables):

```bash
#!/bin/bash
set -e

DEXTER_DIR="/root/clawd-workspace/dexter"

# Clone
[ ! -d "$DEXTER_DIR" ] && git clone https://github.com/virattt/dexter.git "$DEXTER_DIR"
cd "$DEXTER_DIR"

# Install deps
bun install

# Create .env (set these variables before running)
cat > .env << EOF
ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY:-your-key-here}
FINANCIAL_DATASETS_API_KEY=${FINANCIAL_DATASETS_API_KEY:-your-key-here}
TAVILY_API_KEY=${TAVILY_API_KEY:-your-key-here}
EOF

# Patch for Anthropic
sed -i "s/const SMALL_MODEL = 'gpt-5-mini';/const SMALL_MODEL = 'claude-3-5-haiku-latest';/" \
  src/agent/tool-executor.ts

# Set model config
mkdir -p .dexter
echo '{"provider":"anthropic","modelId":"claude-sonnet-4-5"}' > .dexter/settings.json

echo "Dexter installed successfully!"
```

## Location

```
/root/clawd-workspace/dexter
```

## Quick Query (Non-Interactive)

For quick financial questions, use the query script:

```bash
cd /root/clawd-workspace/dexter && bun query.ts "Your financial question here"
```

Examples:
```bash
bun query.ts "What is Apple's current P/E ratio?"
bun query.ts "Compare Microsoft and Google revenue growth over the last 4 quarters"
bun query.ts "What was Tesla's free cash flow in 2025?"
bun query.ts "Show me insider trades for NVDA in the last 30 days"
bun query.ts "What is Bitcoin's price trend over the last week?"
```

For verbose output (shows planning steps):
```bash
DEXTER_VERBOSE=1 bun query.ts "Your question"
```

## Interactive Mode (Complex Research)

For multi-turn research sessions or follow-up questions, use the interactive CLI via tmux:

```bash
SOCKET_DIR="${CLAWDBOT_TMUX_SOCKET_DIR:-${TMPDIR:-/tmp}/clawdbot-tmux-sockets}"
SOCKET="$SOCKET_DIR/clawdbot.sock"
SESSION=dexter

# Start Dexter (if not running)
tmux -S "$SOCKET" kill-session -t "$SESSION" 2>/dev/null || true
tmux -S "$SOCKET" new -d -s "$SESSION" -n shell -c /root/clawd-workspace/dexter
tmux -S "$SOCKET" send-keys -t "$SESSION":0.0 -- 'bun start' Enter
sleep 3

# Send a query
tmux -S "$SOCKET" send-keys -t "$SESSION":0.0 -l -- 'Your question here'
tmux -S "$SOCKET" send-keys -t "$SESSION":0.0 Enter

# Check output
tmux -S "$SOCKET" capture-pane -p -J -t "$SESSION":0.0 -S -200
```

## Available Tools (Under the Hood)

Dexter automatically selects and uses these tools based on your query:

### Financial Statements
- `get_income_statements` - Revenue, expenses, net income
- `get_balance_sheets` - Assets, liabilities, equity
- `get_cash_flow_statements` - Operating, investing, financing cash flows
- `get_all_financial_statements` - All three in one call

### Prices
- `get_price_snapshot` - Current stock price
- `get_prices` - Historical price data

### Crypto
- `get_crypto_price_snapshot` - Current crypto price (e.g., BTC-USD)
- `get_crypto_prices` - Historical crypto prices
- `get_available_crypto_tickers` - List available crypto tickers

### Metrics
- `get_financial_metrics_snapshot` - Current metrics (P/E, market cap, etc.)
- `get_financial_metrics` - Historical metrics

### SEC Filings
- `get_10k_filing_items` - Annual report sections
- `get_10q_filing_items` - Quarterly report sections
- `get_8k_filing_items` - Current report items
- `get_filings` - List of all filings

### Other Data
- `get_analyst_estimates` - Earnings/revenue estimates
- `get_segmented_revenues` - Revenue by segment
- `get_insider_trades` - Insider buying/selling
- `get_news` - Company news
- `search_web` - Web search (via Tavily) for general info

## Agent Architecture

Dexter uses a multi-phase approach:

1. **Understand**: Extract intent, tickers, and time periods from query
2. **Plan**: Create task list with dependencies
3. **Execute**: Run tasks in parallel where possible
4. **Reflect**: Evaluate if more data is needed (iterates up to 5x)
5. **Answer**: Synthesize comprehensive response with sources

## Example Queries

**Stock Analysis:**
- "What is AAPL's revenue growth over the last 4 quarters?"
- "Compare MSFT and GOOG operating margins for 2025"
- "What was AMZN's debt-to-equity ratio last quarter?"

**Financial Health:**
- "Is NVDA's cash flow positive? Show me the trend"
- "What are Tesla's profit margins compared to Ford?"

**SEC Filings:**
- "Summarize Apple's most recent 10-K risk factors"
- "What did Meta disclose in their latest 8-K?"

**Crypto:**
- "What is Ethereum's price today?"
- "Show Bitcoin's price movement over the last month"

**Market Research:**
- "What are analyst estimates for Amazon's next quarter earnings?"
- "Show me recent insider trades for Microsoft"

## Troubleshooting

### "Missing credentials... OPENAI_API_KEY"
Run the Anthropic patch (step 3 in installation) - Dexter's tool executor defaults to OpenAI.

### API errors for non-US stocks
Financial Datasets API primarily covers US stocks. Dexter will fall back to Tavily web search for international stocks if TAVILY_API_KEY is configured.

### Slow responses
Complex queries may take 30-60 seconds. Dexter plans, executes multiple API calls, reflects on results, and synthesizes answers.

## Tips

1. **Be specific**: Include ticker symbols and time periods when known
2. **US stocks work best**: The Financial Datasets API has comprehensive US coverage
3. **International stocks**: Dexter falls back to web search for non-US stocks
4. **Crypto format**: Use `BTC-USD`, `ETH-USD` format for crypto tickers
5. **Timeout**: Complex queries may take 30-60 seconds as Dexter plans and executes multiple tasks

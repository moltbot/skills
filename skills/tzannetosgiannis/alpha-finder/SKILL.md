---
name: alpha-finder
description: Market Oracle for prediction market intelligence - Polymarket and Kalshi research, probability assessments, market sentiment analysis, and arbitrage opportunity identification. Use when users want to research prediction markets, analyze betting odds, or find market inefficiencies. Costs $0.03 USDC per request via x402 protocol on Base network.
---

# Alpha Finder (Market Oracle)

Research prediction markets and find alpha using AI-powered market intelligence across Polymarket, Kalshi, and traditional sources.

## Configuration

The private key must be available via one of these methods:

**Option 1: Environment variable**
```bash
export X402_PRIVATE_KEY="0x..."
```

**Option 2: Config file (Recommended)**

The script checks for `x402-config.json` in these locations (in order):
1. Current directory: `./x402-config.json`
2. Home directory: `~/.x402-config.json` ← **Recommended**
3. Working directory: `$PWD/x402-config.json`

Create the config file:
```json
{
  "private_key": "0x1234567890abcdef..."
}
```

**Example (home directory - works for any user):**
```bash
echo '{"private_key": "0x..."}' > ~/.x402-config.json
```

## Usage

Run the market research script with a query about prediction markets or events:

```bash
scripts/analyze.sh "<market query>"
```

The script:
- Executes market intelligence research with payment handling
- Costs $0.03 USDC per request (Base network)
- Searches web, GitHub, Reddit, and X for comprehensive analysis
- Returns AI-processed market insights and probability assessments

## Examples

**User:** "What are the odds for Bitcoin hitting $100k?"
```bash
scripts/analyze.sh "Bitcoin 100k prediction market odds"
```

**User:** "Find arbitrage opportunities in election markets"
```bash
scripts/analyze.sh "2024 election prediction market arbitrage"
```

**User:** "Analyze Polymarket odds on AI developments"
```bash
scripts/analyze.sh "Polymarket AI development predictions"
```

**User:** "What's the market sentiment on climate policy outcomes?"
```bash
scripts/analyze.sh "climate policy prediction markets Kalshi Polymarket"
```

## Capabilities
- **Polymarket research** - Event analysis and odds tracking
- **Kalshi market analysis** - Regulated prediction market insights
- **Multi-source intelligence** - Searches web, GitHub, Reddit, and X
- **Probability assessments** - AI-powered market sentiment analysis
- **Arbitrage identification** - Spot inefficiencies across markets
- **Event research** - Deep dive into specific prediction market events
- **Historical tracking** - Compare current odds to historical patterns

## Data Sources
The tool automatically searches across:
- Polymarket events and odds
- Kalshi regulated markets
- Reddit discussions and sentiment
- X/Twitter market commentary
- GitHub repositories (for tech-related predictions)
- Web sources for news and analysis

## Error Handling
- **"Payment failed: Not enough USDC"** → Inform user to top up Base wallet with USDC
- **"X402 private key missing"** → Guide user to configure private key (see Configuration above)
- **Timeout errors** → The API has a 5-minute timeout; comprehensive research may take time

## Use Cases
- **Trading:** Find mispriced markets and arbitrage opportunities
- **Research:** Analyze market sentiment on specific events
- **Due Diligence:** Verify market probabilities before betting
- **Portfolio Management:** Track prediction market positions
- **News Analysis:** Understand how events impact market odds

---
name: prism-scanner
description: Token safety scanner using Strykr PRISM API. Analyze any token for rug pull risk, copycat scams, holder concentration, and liquidity status.
version: 1.0.0
---

# PRISM Token Scanner

Scan any crypto token for safety risks using Strykr PRISM's unique analysis endpoints.

## Quick Usage

```bash
# Scan by symbol
./scan.sh PEPE

# Scan by contract address
./scan.sh 0x6982508145454Ce325dDbE47a25d4ec3d2311933

# Get JSON output
./scan.sh PEPE --json
```

## What It Checks

| Check | Endpoint | Risk Factor |
|-------|----------|-------------|
| Copycat/Scam | `/analyze/copycat` | High |
| Holder Concentration | `/analytics/holders` | Medium |
| Liquidity Status | `/analyze` | High |
| Contract Verification | `/analyze` | Medium |
| Token Age | `/analyze` | Low |
| Rebrand History | `/analyze/rebrand` | Info |

## Risk Score Calculation

```
0-25:   ✅ Lower Risk (Green)
26-50:  ⚠️ Medium Risk (Yellow)
51-75:  🔶 Higher Risk (Orange)
76-100: 🚨 High Risk (Red)
```

### Scoring Breakdown

| Factor | Max Points | Trigger |
|--------|------------|---------|
| Copycat detected | 30 | Similarity > 70% to known scam |
| Honeypot pattern | 25 | Buy/sell tax anomaly |
| Holder concentration | 25 | Top 10 wallets > 60% |
| Unlocked liquidity | 20 | LP not locked |
| Unverified contract | 15 | Not verified on explorer |
| New token (<7 days) | 10 | Recently launched |
| Low liquidity | 10 | < $10K liquidity |

## Output Format

```
🛡️ PRISM Token Scan: PEPE

Contract: 0x6982508...2311933
Chain: Ethereum

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RISK SCORE: 35/100
████████░░░░░░░░░░░░ Lower Risk

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CHECKS:
✅ No copycat detected
✅ Contract verified on Etherscan
✅ Liquidity locked (12 months)
⚠️ Top 10 wallets hold 42% of supply
✅ Token age: 8 months
✅ Normal buy/sell taxes (0%/0%)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

HOLDER DISTRIBUTION:
• Top holder: 3.2%
• Top 10: 42%
• Top 100: 68%

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ DYOR - This is not financial advice
```

## API Endpoints Used

```bash
# 1. Resolve token to canonical form
GET /resolve/{symbol_or_address}

# 2. Get general analysis
GET /analyze/{symbol}

# 3. Check for copycat/scam
GET /analyze/copycat/{symbol}

# 4. Get holder distribution
GET /analytics/holders/{contract}

# 5. Check rebrand history
GET /analyze/rebrand/{symbol}
```

## Integration Examples

### Telegram Bot
```
User: /scan PEPE
Bot: 🛡️ Scanning PEPE...
     
     Risk Score: 35/100 (Lower Risk)
     
     ✅ No copycat detected
     ✅ Liquidity locked
     ⚠️ Top 10 hold 42%
     
     [Full Report] [Share]
```

### Discord Bot
```
!scan 0x6982508...
```

### Web App
```javascript
const result = await prismScan('PEPE');
// { score: 35, checks: [...], holders: {...} }
```

## Environment Variables

```bash
PRISM_URL=https://strykr-prism.up.railway.app
PRISM_API_KEY=your-api-key  # Optional
```

---

Built by [@NextXFrontier](https://x.com/NextXFrontier)

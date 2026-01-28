---
name: lnbits
description: Manage LNbits Lightning Wallet (Balance, Pay, Invoice)
homepage: https://lnbits.com
metadata: {"clawdbot":{"emoji":"⚡","requires":{"bins":["python3"],"env":["LNBITS_API_KEY", "LNBITS_BASE_URL"]},"primaryEnv":"LNBITS_API_KEY"}}
---

# LNbits Wallet Manager

Enable the assistant to safely and effectively manage an LNbits Lightning Network wallet.

## 🛑 CRITICAL SECURITY PROTOCOLS 🛑

1.  **NEVER Expose Secrets**: Do NOT display Admin Keys, User IDs, or Wallet IDs.
2.  **Explicit Confirmation**: You MUST ask for "Yes/No" confirmation before paying.
    *   *Format*: "I am about to send **[Amount] sats** to **[Memo/Dest]**. Proceed? (y/n)"
3.  **Check Balance First**: Always call `balance` before `pay` to prevent errors.

## Usage

### 0. Setup / Create Wallet
If the user does not have an LNbits wallet, you can create one for them on the demo server.

```bash
python3 {baseDir}/scripts/lnbits_cli.py create --name "My Wallet"
```

**Action**:
1.  Run the command.
2.  Capture the `adminkey` (Admin Key) and `base_url` (defaults to https://demo.lnbits.com).
3.  **IMPORTANT**: Instruct the user to save these credentials securely:
    > "I've created a new wallet! Please add these to your Moltbot configuration or `.env` file:
    > `export LNBITS_BASE_URL=https://demo.lnbits.com`
    > `export LNBITS_API_KEY=<adminkey>`"

### 1. Check Balance
Get the current wallet balance in Satoshis.

```bash
python3 {baseDir}/scripts/lnbits_cli.py balance
```

### 2. Create Invoice (Receive)
Generate a Bolt11 invoice to receive funds.
*   **amount**: Amount in Satoshis (Integer).
*   **memo**: Optional description.

```bash
python3 {baseDir}/scripts/lnbits_cli.py invoice --amount 1000 --memo "Pizza"
```

### 3. Pay Invoice (Send)
**⚠️ REQUIRES CONFIRMATION**: Decode first, verify balance, ask user, then execute.

```bash
# Step 1: Decode to verify amount/memo
python3 {baseDir}/scripts/lnbits_cli.py decode <bolt11_string>

# Step 2: Pay (Only after user CONFIRMS)
python3 {baseDir}/scripts/lnbits_cli.py pay <bolt11_string>
```

## Error Handling
If the CLI returns a JSON error (e.g., `{"error": "Insufficient funds"}`), summarize it clearly for the user. Do not show raw stack traces.
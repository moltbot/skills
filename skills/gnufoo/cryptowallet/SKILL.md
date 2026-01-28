---
name: cryptowallet
description: "Complete cryptocurrency wallet management for Web3, DeFi, and blockchain applications. Create and manage EVM (Ethereum, Polygon, BSC, Arbitrum, Optimism, Base, Avalanche) and Solana wallets with encrypted local storage. Query balances for native tokens (ETH, MATIC, BNB, SOL) and standard tokens (ERC20, SPL). Send transactions, interact with smart contracts, and manage multiple addresses across 12+ networks. Secure password-protected key storage with AES-256 encryption. Use for: (1) Creating new crypto wallets, (2) Importing existing wallets, (3) Checking token balances across chains, (4) Sending cryptocurrency and tokens, (5) Interacting with DeFi protocols and smart contracts, (6) Multi-chain portfolio management, (7) NFT transfers, (8) Blockchain development and testing. Keywords: crypto, cryptocurrency, wallet, blockchain, ethereum, solana, web3, defi, token, erc20, nft, smart contract, metamask alternative, hardware wallet, cold storage, hot wallet, blockchain wallet, digital wallet, bitcoin."
---

# CryptoWallet

Comprehensive cryptocurrency wallet management for Clawdbot agents. Securely create, manage, and transact across multiple blockchain networks with encrypted local key storage.

## Supported Networks

### EVM Chains (12 networks)
- Ethereum, Polygon, BSC, Arbitrum, Optimism, Base
- Avalanche, Fantom, Gnosis, zkSync, Linea, Scroll

### Solana
- Mainnet and Devnet

Full network details in `references/networks.json`.

## Core Features

### 1. Wallet Management
Create new wallets or import existing ones:

```bash
# Create new EVM wallet
python3 scripts/wallet_manager.py create my-eth-wallet --chain evm --password "secure-password"

# Create new Solana wallet
python3 scripts/wallet_manager.py create my-sol-wallet --chain solana --password "secure-password"

# Import existing wallet
python3 scripts/wallet_manager.py import imported-wallet --chain evm --key "0x..." --password "secure-password"

# List all wallets
python3 scripts/wallet_manager.py list
```

### 2. Balance Checking

Query native and token balances:

```bash
# Native ETH balance on Ethereum
python3 scripts/balance_checker.py 0xYourAddress --network ethereum

# ERC20 token balance
python3 scripts/balance_checker.py 0xYourAddress --network polygon --token 0xTokenAddress

# Check all EVM networks at once
python3 scripts/balance_checker.py 0xYourAddress --all-evm

# Solana balance
python3 scripts/balance_checker.py YourSolanaAddress --network solana

# SPL token balance
python3 scripts/balance_checker.py YourSolanaAddress --network solana --token MintAddress
```

### 3. Token Transfers

Send native tokens or ERC20/SPL tokens:

```bash
# Send ETH
python3 scripts/token_sender.py my-wallet 0xRecipient 0.1 --network ethereum --password "password"

# Send ERC20 token
python3 scripts/token_sender.py my-wallet 0xRecipient 100 --network polygon --token 0xTokenAddress --password "password"

# Send SOL
python3 scripts/token_sender.py my-wallet RecipientAddress 1.5 --network solana --password "password"
```

**Security:** Password required for every transaction. Private keys never leave encrypted storage unprotected.

### 4. Smart Contract Interaction

Call contract functions (read and write):

```bash
# Read call (view function)
python3 scripts/contract_interactor.py 0xContract functionName --abi contract.json --network ethereum --args '[123, "param2"]'

# Write call (transaction)
python3 scripts/contract_interactor.py 0xContract mint --abi nft.json --network polygon --args '[1]' --write --wallet my-wallet --password "password"

# Payable function (send ETH with call)
python3 scripts/contract_interactor.py 0xContract purchase --abi contract.json --network ethereum --args '[]' --write --wallet my-wallet --password "password" --value 0.05
```

## Security Architecture

### Encryption
- **Algorithm:** AES-256-GCM with PBKDF2 key derivation
- **Iterations:** 100,000 (OWASP recommended)
- **Salt:** Random 16-byte salt per wallet
- **Storage:** `~/.clawdbot/cryptowallet/` with 0600 permissions

### Key Principles
1. **Password-protected transactions** - Every send/sign operation requires password
2. **Encrypted at rest** - Private keys never stored in plaintext
3. **No key exposure** - Keys decrypted in memory only during signing
4. **Isolated storage** - Each wallet has independent encryption

See `references/security.md` for complete security documentation.

## Common Workflows

### Portfolio Management
Check balances across all networks:
```bash
python3 scripts/balance_checker.py 0xYourAddress --all-evm
```

### Multi-Chain Operations
Send the same token across different chains:
```bash
# Polygon USDC
python3 scripts/token_sender.py wallet recipient 100 --network polygon --token 0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174 --password "pwd"

# Arbitrum USDC
python3 scripts/token_sender.py wallet recipient 100 --network arbitrum --token 0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8 --password "pwd"
```

### DeFi Protocol Interaction
Example: Approve and stake tokens
```bash
# 1. Approve token spending
python3 scripts/contract_interactor.py 0xTokenAddress approve --abi erc20.json --network ethereum --args '["0xProtocolAddress", "1000000000000000000000"]' --write --wallet my-wallet --password "pwd"

# 2. Stake tokens
python3 scripts/contract_interactor.py 0xStakingContract stake --abi staking.json --network ethereum --args '["1000000000000000000000"]' --write --wallet my-wallet --password "pwd"
```

## Network Configuration

Modify `references/networks.json` to:
- Add custom RPCs (Infura, Alchemy, QuickNode)
- Add new networks
- Update chain IDs or explorers

Default RPCs are public and may have rate limits. For production, use dedicated RPC providers.

## Dependencies

Install required packages:
```bash
pip install web3 solana solders eth-account cryptography base58
```

## Troubleshooting

### "Incorrect password"
- Password is case-sensitive
- No recovery if password is lost (by design)

### "Insufficient funds"
- Check balance includes gas fees
- On Ethereum: gas can be $5-50+ per transaction

### "Transaction failed"
- Verify network selection
- Check contract address is correct
- Ensure enough gas limit for complex operations

### RPC errors
- Public RPCs may be rate-limited
- Use `references/networks.json` to configure your own RPC endpoint

## Advanced Usage

### Custom Network
Add to `references/networks.json`:
```json
{
  "evm": {
    "your-network": {
      "name": "Your Chain",
      "chain_id": 12345,
      "rpc": "https://rpc.yourchain.com",
      "explorer": "https://explorer.yourchain.com",
      "native_token": "TOKEN"
    }
  }
}
```

### Batch Operations
Use shell loops for batch transactions:
```bash
for addr in $(cat recipients.txt); do
  python3 scripts/token_sender.py wallet $addr 1 --network polygon --password "pwd"
done
```

### Smart Contract ABIs
Generate ABIs from verified contracts on block explorers, or from your Solidity project's `artifacts/` folder.

## Limitations

- **Solana SPL transfers:** Basic implementation (may need token account creation)
- **Hardware wallets:** Not supported (encrypted file storage only)
- **Multi-sig:** Not supported
- **Gas estimation:** Uses fixed limits (may fail for complex contracts)

## Best Practices

1. **Test on devnet/testnet first** before mainnet transactions
2. **Use separate wallets** for different purposes (trading, DeFi, cold storage)
3. **Backup wallet files** and store passwords securely
4. **Verify addresses** - blockchain transactions are irreversible
5. **Monitor gas prices** - wait for lower congestion on Ethereum

See `references/security.md` for comprehensive security guidelines.

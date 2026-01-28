# Security Best Practices

## Key Storage

- **Never** display or log private keys
- Private keys are encrypted with AES-256-GCM using PBKDF2 key derivation (100,000 iterations)
- Encrypted wallets stored in `~/.clawdbot/cryptowallet/` with 0600 permissions (owner-only access)
- Each wallet has its own password - never reuse passwords across wallets

## Password Requirements

- Minimum 12 characters recommended
- Use a mix of letters, numbers, and special characters
- Store passwords securely (use a password manager)
- **Never** commit passwords to version control

## Transaction Safety

- Always verify recipient addresses before sending
- Double-check amounts and network selection
- For large transactions, test with a small amount first
- Be aware of gas fees - they can be high on Ethereum mainnet

## Network Security

- Default RPCs are public and rate-limited
- For production use, consider:
  - Infura/Alchemy API keys
  - Running your own node
  - QuickNode or other providers

## Common Pitfalls

1. **Wrong Network**: Sending tokens on the wrong network = permanent loss
2. **Token Address Mistakes**: Always verify contract addresses on block explorers
3. **Gas Price Spikes**: Check gas prices before transactions (especially on Ethereum)
4. **Phishing**: Verify all contract addresses and domains

## Backup Strategy

- Backup wallet files from `~/.clawdbot/cryptowallet/`
- Store backups securely (encrypted external drive, password manager vault)
- **Never** share encrypted wallet files unless you've changed the password
- Consider exporting private keys to offline storage for large holdings

## Emergency Recovery

If you forget a wallet password:
- **There is no recovery** - encryption is intentionally irreversible
- This is a feature, not a bug - it ensures security
- Always maintain secure backups of passwords

## Permissions

- Script files should be executable (chmod +x)
- Wallet files automatically set to 0600 (owner read/write only)
- Never change wallet file permissions to be more permissive

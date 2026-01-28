# Lightning Backend Setup Guides

## Quick Start

1. Choose your backend (see options below)
2. Create `~/.lightning-config.json` with your credentials
3. Test: `/lightning`

---

## Phoenixd (Recommended for Beginners)

Phoenixd is a lightweight, non-custodial Lightning node. Easy to run.

### Install
```bash
# Download from ACINQ
wget https://github.com/ACINQ/phoenixd/releases/download/v0.2.0/phoenixd-0.2.0-linux-x64.zip
unzip phoenixd-0.2.0-linux-x64.zip
./phoenixd
```

### Config
```json
{
  "backend": "phoenixd",
  "url": "http://127.0.0.1:9740",
  "password": "your-http-password"
}
```

The password is in `~/.phoenix/phoenix.conf` after first run.

---

## LND (Lightning Network Daemon)

Most popular full Lightning node. Requires Bitcoin Core or Neutrino.

### Get Credentials
```bash
# Macaroon (hex encoded)
xxd -p -c 1000 ~/.lnd/data/chain/bitcoin/mainnet/admin.macaroon

# Or base64
base64 -w0 ~/.lnd/data/chain/bitcoin/mainnet/admin.macaroon
```

### Config
```json
{
  "backend": "lnd",
  "url": "https://your-lnd-node:8080",
  "macaroon": "0201036c6e640258...",
  "acceptInvalidCerts": true
}
```

---

## CLN (Core Lightning)

C-Lightning, now Core Lightning. Lightweight, plugin-friendly.

### Enable REST API
Add to `~/.lightning/config`:
```
clnrest-port=3010
clnrest-host=0.0.0.0
```

### Get Rune
```bash
lightning-cli createrune
```

### Config
```json
{
  "backend": "cln",
  "url": "https://your-cln-node:3010",
  "rune": "your-rune-token"
}
```

---

## NWC (Nostr Wallet Connect)

Connect to any NWC-compatible wallet (Alby, Zeus, etc).

### Get NWC URI
In your wallet app, go to Settings → Wallet Connect → Create Connection

### Config
```json
{
  "backend": "nwc",
  "nwcUri": "nostr+walletconnect://pubkey?relay=wss://relay.example.com&secret=..."
}
```

---

## Strike (Custodial)

Popular custodial service with good API.

### Get API Key
1. Go to strike.me/developer
2. Create API key with payment permissions

### Config
```json
{
  "backend": "strike",
  "apiKey": "your-strike-api-key"
}
```

---

## Blink (Custodial)

Global Bitcoin wallet, formerly Galoy.

### Get API Key
1. Create account at blink.sv
2. Generate API key in settings

### Config
```json
{
  "backend": "blink",
  "apiKey": "your-blink-api-key"
}
```

---

## Speed (Custodial)

Business-focused Lightning infrastructure.

### Get API Key
1. Sign up at tryspeed.com
2. Create API key

### Config
```json
{
  "backend": "speed",
  "apiKey": "your-speed-api-key"
}
```

---

## Advanced Options

All backends support:
- `socks5Proxy`: Tor/SOCKS5 proxy URL
- `acceptInvalidCerts`: Accept self-signed certs (boolean)
- `httpTimeout`: Request timeout in ms

Example with Tor:
```json
{
  "backend": "lnd",
  "url": "https://your-onion-address.onion:8080",
  "macaroon": "...",
  "socks5Proxy": "socks5://127.0.0.1:9050",
  "acceptInvalidCerts": true,
  "httpTimeout": 30000
}
```

---
name: picnic
description: Order groceries from Picnic supermarket - search products, manage cart, schedule delivery.
---

# Picnic Grocery Ordering

Use the `picnic` CLI to search products, manage shopping cart, and order groceries from Picnic.

## Setup (once)

```bash
cd {baseDir} && npm install
```

Then login:
```bash
node {baseDir}/picnic-cli.mjs login <email> <password> DE
```

If 2FA is required:
```bash
node {baseDir}/picnic-cli.mjs verify-2fa <code>
```

## Commands

All commands output JSON. Run from any directory:

```bash
# Check login status
node {baseDir}/picnic-cli.mjs status

# Search for products
node {baseDir}/picnic-cli.mjs search "Milch"
node {baseDir}/picnic-cli.mjs search "Bio Eier"

# View cart
node {baseDir}/picnic-cli.mjs cart

# Add to cart (productId from search results)
node {baseDir}/picnic-cli.mjs add <productId> [count]

# Remove from cart
node {baseDir}/picnic-cli.mjs remove <productId> [count]

# Clear cart
node {baseDir}/picnic-cli.mjs clear

# Get available delivery slots
node {baseDir}/picnic-cli.mjs slots

# Select a delivery slot
node {baseDir}/picnic-cli.mjs set-slot <slotId>

# View delivery history
node {baseDir}/picnic-cli.mjs deliveries

# Get user info
node {baseDir}/picnic-cli.mjs user

# Browse categories
node {baseDir}/picnic-cli.mjs categories
```

## Typical ordering flow

1. Search for products: `search "bananas"`
2. Add to cart: `add s1234567 2`
3. Check cart: `cart`
4. Get delivery slots: `slots`
5. Set slot: `set-slot <slotId>`
6. Confirm with user before final checkout (checkout happens in app)

## Notes

- Config stored in `~/.config/picnic/config.json`
- Country codes: `DE` (Germany) or `NL` (Netherlands)
- Product IDs start with 's' (e.g., `s1234567`)
- Always confirm with user before modifying cart or setting delivery slots
- Final checkout/payment must be done in the Picnic app

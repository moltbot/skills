---
slug: parcel
display_name: Parcel
description: Track and add deliveries via Parcel API.
---

# Parcel

Interact with the Parcel app API to track packages and add new deliveries.

## Configuration

This skill requires the `PARCEL_API_KEY` environment variable.
Get your key from [web.parcelapp.net](https://web.parcelapp.net).

## Tool: `parcel`

Control the Parcel API CLI.

### Parameters

- `action` (required): One of `list`, `add`, `carriers`.
- `mode`: For `list`, filter mode (`active` or `recent`). Default `recent`.
- `tracking`: For `add`, the tracking number.
- `carrier`: For `add`, the carrier code (e.g., `ups`, `usps`, `fedex`).
- `description`: For `add`, a description of the package.
- `notify`: For `add`, boolean to send push confirmation.
- `search`: For `carriers`, search string.

### Usage

**List Deliveries:**
```bash
# List recent deliveries
node ~/.clawdbot/skills/parcel/parcel-api.js list

# List active deliveries
node ~/.clawdbot/skills/parcel/parcel-api.js list --mode=active
```

**Add Delivery:**
```bash
node ~/.clawdbot/skills/parcel/parcel-api.js add \
  --tracking "1Z1234567890" \
  --carrier "ups" \
  --description "New Shoes" \
  --notify
```

**List Carriers:**
```bash
node ~/.clawdbot/skills/parcel/parcel-api.js carriers "ups"
```

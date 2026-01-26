---
name: travel-concierge
description: Find contact details for accommodation listings (Airbnb, Booking.com, VRBO, Expedia)
version: 1.0.0
triggers:
  - find contact
  - hotel contact
  - accommodation contact
  - property contact
  - airbnb contact
  - booking contact
  - vrbo contact
  - expedia contact
  - direct booking
  - property email
  - property phone
---

# Travel Concierge

Find contact details (phone, email, WhatsApp, Instagram, etc.) for accommodation listings to enable direct booking.

## Usage

When the user provides a booking URL or asks to find contact details for an accommodation:

1. Run the CLI to extract contact information:
   ```bash
   travel-concierge find-contact "<url>"
   ```

2. Present the dossier to the user with all discovered contact methods.

## Supported Platforms

- **Airbnb**: `airbnb.com/rooms/...`
- **Booking.com**: `booking.com/hotel/...`
- **VRBO**: `vrbo.com/...`
- **Expedia**: `expedia.com/...Hotel...`

## Examples

### Finding contacts for an Airbnb listing
User: "Find contact info for this Airbnb: https://www.airbnb.com/rooms/12345"
Action: Run `travel-concierge find-contact "https://www.airbnb.com/rooms/12345"`

### Finding contacts for a Booking.com hotel
User: "How can I contact this hotel directly?" (with Booking.com URL)
Action: Run `travel-concierge find-contact "<booking-url>"`

### JSON output for scripting
```bash
travel-concierge find-contact --json "https://..."
```

### Verbose output to see search progress
```bash
travel-concierge find-contact --verbose "https://..."
```

## Configuration

The tool works without any API keys using web scraping. For enhanced results, configure optional APIs:

```bash
# Set Google Places API key for verified phone/website data
travel-concierge config set googlePlacesApiKey "your-key"

# View current config
travel-concierge config show
```

## Output Format

The CLI returns a contact dossier with:
- **Property Information**: Name, platform, location, host name
- **Contact Methods**:
  - Phone numbers
  - Email addresses
  - WhatsApp (if available)
  - Instagram profile
  - Facebook page
  - Website
  - Google Maps URL
- **Sources**: Where each piece of contact info was found, with confidence levels

## Notes

- The tool extracts publicly available information only
- Browser automation (via `agent-browser`) may be needed for JavaScript-rendered listing pages
- Some platforms heavily restrict scraping; results may vary
- Google Places API provides the most reliable contact data when configured

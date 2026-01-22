---
name: invoice-generator
description: Generate professional PDF invoices from JSON data. Use when the user needs to create an invoice, billing document, or payment request with company/client details and line items.
metadata: {"clawdbot":{"emoji":"🧾","requires":{"bins":["node","jq","weasyprint"],"env":["INVOICE_DIR"]},"primaryEnv":"INVOICE_DIR"}}
---

# Invoice Generator

Generate PDF invoices from structured JSON data.

## Setup

1. Install Node.js dependencies:

```bash
cd invoice-generator && npm install
```

2. Set `INVOICE_DIR` environment variable (or in `skills.entries.invoice-generator.env`):

```bash
export INVOICE_DIR="/path/to/your/invoices"
```

This creates the directory structure:
```
$INVOICE_DIR/
├── configs/    # Optional: saved invoice configs
└── invoices/   # Generated PDF output
```

## Usage

```bash
# From stdin (on-the-fly)
cat invoice-data.json | {baseDir}/scripts/generate.sh

# From a full file path
{baseDir}/scripts/generate.sh /path/to/invoice-data.json

# From a saved config (looks in $INVOICE_DIR/configs/)
{baseDir}/scripts/generate.sh client-template
# Loads: $INVOICE_DIR/configs/client-template.json

# Output goes to: $INVOICE_DIR/invoices/invoice-{number}.pdf (auto-versions if exists)
```

## Input Data Format

The JSON input must contain these fields:

```json
{
  "company": {
    "name": "Your Company",
    "address": "123 Main St",
    "cityStateZip": "City, State, 12345",
    "country": "Country"
  },
  "client": {
    "name": "Client Name",
    "address": "456 Client Ave",
    "cityStateZip": "City, State, 67890",
    "country": "Country",
    "taxId": "TAX123"
  },
  "invoice": {
    "number": "INV-2025.01",
    "date": "Jan 15 2025",
    "dueDate": "Jan 30 2025"
  },
  "items": [
    {
      "description": "Service description",
      "rate": "1000.00",
      "currency": "USD"
    }
  ],
  "totals": {
    "currency": "USD",
    "total": "1,000.00"
  }
}
```

See [references/data-schema.md](references/data-schema.md) for complete field documentation.

## Output

The script outputs the path to the generated PDF file on success:

```
$INVOICE_DIR/invoices/invoice-INV-2025.01.pdf
# If that filename already exists, the script will write:
# $INVOICE_DIR/invoices/invoice-INV-2025.01-2.pdf (then -3, etc.)
```

## Error Handling

- Exits with code 1 if JSON is invalid or missing required fields
- Exits with code 2 if weasyprint fails to generate PDF
- Error messages are written to stderr

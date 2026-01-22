#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$(dirname "$SCRIPT_DIR")"

# Require INVOICE_DIR
: "${INVOICE_DIR:?Set INVOICE_DIR to the base directory for configs and invoices}"

# Set NODE_PATH so Node.js can find handlebars
export NODE_PATH="$SKILL_DIR/node_modules"

# Ensure directory structure exists
CONFIGS_DIR="$INVOICE_DIR/configs"
INVOICES_DIR="$INVOICE_DIR/invoices"
mkdir -p "$CONFIGS_DIR" "$INVOICES_DIR"

# Check for node_modules
if [[ ! -d "$SKILL_DIR/node_modules" ]]; then
    echo "Error: Dependencies not installed. Run 'npm install' in $SKILL_DIR" >&2
    exit 1
fi

# Read JSON from:
# 1. Full file path (if arg is a file)
# 2. Config name (looks in $CONFIGS_DIR/<name>.json)
# 3. stdin (if no arg)
if [[ $# -ge 1 ]]; then
    if [[ -f "$1" ]]; then
        # Full path provided
        JSON_DATA=$(cat "$1")
    elif [[ -f "$CONFIGS_DIR/$1.json" ]]; then
        # Config name provided (without .json)
        JSON_DATA=$(cat "$CONFIGS_DIR/$1.json")
    elif [[ -f "$CONFIGS_DIR/$1" ]]; then
        # Config name provided (with extension)
        JSON_DATA=$(cat "$CONFIGS_DIR/$1")
    else
        echo "Error: Config not found: $1 (looked in $CONFIGS_DIR)" >&2
        exit 1
    fi
else
    JSON_DATA=$(cat)
fi

# Validate JSON
if ! echo "$JSON_DATA" | jq empty 2>/dev/null; then
    echo "Error: Invalid JSON input" >&2
    exit 1
fi

# Check required fields
REQUIRED_FIELDS=(".company.name" ".client.name" ".invoice.number" ".items" ".totals.total")
for field in "${REQUIRED_FIELDS[@]}"; do
    if [[ $(echo "$JSON_DATA" | jq -r "$field") == "null" ]]; then
        echo "Error: Missing required field: $field" >&2
        exit 1
    fi
done

# Create temp directory for processing
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

# Write JSON to temp file
echo "$JSON_DATA" > "$TEMP_DIR/data.json"

# Generate HTML using Node.js and Handlebars
node - "$SKILL_DIR/assets/invoice.hbs" "$TEMP_DIR/data.json" "$TEMP_DIR/out.html" << 'NODEJS'
const fs = require('fs');
const Handlebars = require('handlebars');

const [,, templatePath, dataPath, outputPath] = process.argv;

const template = fs.readFileSync(templatePath, 'utf8');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

const html = Handlebars.compile(template)(data);
fs.writeFileSync(outputPath, html);
NODEJS

if [[ $? -ne 0 ]]; then
    echo "Error: Failed to generate HTML" >&2
    exit 1
fi

# Extract invoice number for filename (sanitize for filesystem)
INVOICE_NUM=$(echo "$JSON_DATA" | jq -r '.invoice.number' | tr '/' '-' | tr ' ' '_')
OUTPUT_BASENAME="invoice-${INVOICE_NUM}"
OUTPUT_PDF="$INVOICES_DIR/${OUTPUT_BASENAME}.pdf"

# Auto-version if file already exists
if [[ -f "$OUTPUT_PDF" ]]; then
    i=2
    while true; do
        candidate="$INVOICES_DIR/${OUTPUT_BASENAME}-${i}.pdf"
        if [[ ! -f "$candidate" ]]; then
            OUTPUT_PDF="$candidate"
            break
        fi
        i=$((i + 1))
    done
fi

# Convert HTML to PDF using weasyprint
if ! weasyprint "$TEMP_DIR/out.html" "$OUTPUT_PDF" 2>/dev/null; then
    echo "Error: Failed to generate PDF (is weasyprint installed?)" >&2
    exit 2
fi

# Output the path to the generated PDF
echo "$OUTPUT_PDF"

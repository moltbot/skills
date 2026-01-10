---
name: solo-cli
description: Monitor and interact with SOLO.ro accounting platform via CLI or TUI (summary, revenues, expenses, queue, e-factura, company). Use when a user asks to check their accounting data, view invoices, expenses, or e-factura documents, or translate a task into safe solo-cli commands.
---

# SOLO CLI

## Overview
Use solo-cli to access SOLO.ro accounting platform data via command-line interface or interactive TUI.

## Installation
If the `solo-cli` command is not available, install via Homebrew:
```bash
brew install rursache/tap/solo-cli
```

## Defaults and safety
- Config file location: `~/.config/solo-cli/config.json` (created on first run)
- Use `--config` or `-c` to specify a custom config path
- Credentials are stored locally; never passed as command arguments
- Session cookies are cached to `~/.config/solo-cli/cookies.json` for faster subsequent logins

## Quick start
- Configure: Edit `~/.config/solo-cli/config.json` with username/password
- Summary: `solo-cli summary`
- Summary for year: `solo-cli summary 2025`
- Revenues: `solo-cli revenues`
- Expenses: `solo-cli expenses`
- Queue: `solo-cli queue`
- E-Factura: `solo-cli efactura`
- Company: `solo-cli company`
- Upload: `solo-cli upload file.pdf`
- Delete: `solo-cli queue delete <ID>`
- TUI: `solo-cli` (no command)
- Demo: `solo-cli demo`

## Configuration
Config file structure:
```json
{
  "username": "your_email@solo.ro",
  "password": "your_password",
  "company_id": "12345",
  "page_size": 100,
  "user_agent": "Mozilla/5.0 ..."
}
```

| Field | Required | Description |
|-------|----------|-------------|
| username | Yes | SOLO.ro login email |
| password | Yes | SOLO.ro password |
| company_id | No | Company ID for profile display (find in Network tab on /settings#!/company) |
| page_size | No | Number of items to fetch (default: 100) |
| user_agent | No | Custom HTTP user agent string |

## Commands

### summary [year]
Show account summary for a year.
```bash
solo-cli summary          # Current year
solo-cli summary 2025     # Specific year
```
Output: Year, Revenues, Expenses, Taxes

### revenues
List revenue invoices.
```bash
solo-cli revenues
solo-cli rev              # Alias
```
Output: Invoice code, amount, currency, paid status, client name

### expenses
List expenses.
```bash
solo-cli expenses
solo-cli exp              # Alias
```
Output: Amount, currency, category, supplier name

### queue
List pending documents in expense queue or delete them.
```bash
solo-cli queue            # List queue
solo-cli q                # Alias
solo-cli queue delete 123 # Delete item by ID
solo-cli q del 123        # Alias
```
Output: Document name, days pending, overdue status (ID included)

### efactura
List e-Factura documents.
```bash
solo-cli efactura
solo-cli ei               # Alias
```
Output: Serial code, amount, currency, date, party name

### company
Show company profile.
```bash
solo-cli company
```
Output: Company name, CUI, registration number, address

### upload <file>
Upload an expense document (PDF or image).
```bash
solo-cli upload invoice.pdf
solo-cli up invoice.pdf   # Alias
```
Output: Upload status and confirmation.

### demo
Start TUI with mock data for screenshots or testing (no API calls).
```bash
solo-cli demo
```

### tui
Start interactive TUI mode (default when no command given).
```bash
solo-cli tui
solo-cli                  # Same as above
```

## Global options

| Option | Short | Description |
|--------|-------|-------------|
| --config | -c | Path to custom config file |
| --help | -h | Show help message |
| --version | -v | Show version |

## Examples
```bash
# Basic usage
solo-cli summary
solo-cli revenues

# Custom config
solo-cli -c ~/work-config.json summary

# Pipe to grep
solo-cli expenses | grep -i "food"

# View specific year
solo-cli summary 2024

# Upload a document
solo-cli upload invoice.pdf

# Delete a queued item
solo-cli queue delete 123456
```

## Authentication flow
1. On startup, loads cookies from `~/.config/solo-cli/cookies.json`
2. Validates cookies with a test API call
3. If valid, uses cached session
4. If invalid/missing, logs in with credentials from config
5. Saves new cookies for next session

## Troubleshooting
- **"credentials missing"**: Edit config.json with your SOLO.ro username/password
- **"authentication failed"**: Check credentials are correct
- **"invalid JSON in config"**: Fix syntax errors in config.json
- **Company info not showing**: Add company_id to config (optional field)

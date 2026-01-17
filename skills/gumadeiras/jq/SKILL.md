---
name: jq
description: Command-line JSON processor. Extract, filter, transform JSON.
---

# jq

Command-line JSON processor for extracting, filtering, and transforming JSON.

## Installation

**macOS / Linux (Homebrew):**
```bash
brew install jq
```

**All platforms:** See [jqlang.org/download](https://jqlang.org/download/) for packages, binaries, and build instructions.

## Usage

```bash
jq '[filter]' [file.json]
cat file.json | jq '[filter]'
```

## Quick Reference

```bash
.key                    # Get key
.a.b.c                  # Nested access
.[0]                    # First element
.[]                     # Iterate array
.[] | select(.x > 5)    # Filter
{a: .x, b: .y}          # Reshape
. + {new: "val"}        # Add field
del(.key)               # Remove field
length                  # Count
[.[] | .x] | add        # Sum
keys                    # List keys
unique                  # Dedupe array
group_by(.x)            # Group
```

## Flags

`-r` raw output (no quotes) · `-c` compact · `-s` slurp into array · `-S` sort keys

## Examples

```bash
jq '.users[].email' data.json          # Extract emails
jq -r '.name // "default"' data.json   # With fallback
jq '.[] | select(.active)' data.json   # Filter active
jq -s 'add' *.json                     # Merge files
jq '.' file.json                       # Pretty-print
```

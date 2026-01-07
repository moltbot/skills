---
name: units
description: Perform unit conversions and calculations using GNU Units.
metadata: {"clawdbot":{"emoji":"📏","requires":{"bins":["units"]}}}
---

# GNU Units Skill

Use GNU `units` to perform unit conversions and calculations via the command line. Can be installed using brew and apt under "units".

## Usage

Use the `bash` tool to run the `units` command. Use the `-t` (terse) flag to get just the numeric result.

```bash
units -t 'from-unit' 'to-unit'
```

### Examples

**Basic Conversion:**
```bash
units -t '10 kg' 'lbs'
# Output: 22.046226
```

**Compound Units:**
```bash
units -t '60 miles/hour' 'm/s'
# Output: 26.8224
```

**Temperature (Non-linear):**
Temperature requires specific syntax: `tempF(x)`, `tempC(x)`, `tempK(x)`.
```bash
units -t 'tempF(98.6)' 'tempC'
# Output: 37
```

**Time:**
```bash
units -t '2 weeks' 'seconds'
```

**Rounding Output:**
To round to specific decimal places (e.g. 3 places), use `-o "%.3f"`:
```bash
units -t -o "%.3f" '10 kg' 'lbs'
# Output: 22.046
```

**Definition Lookup:**
To see what a unit definition is (without converting), omit the second argument (without `-t` is more verbose/useful for definitions):
```bash
units '1 acre'
```

## Notes

- **Currency:** `units` supports currency (USD, EUR, etc.), but exchange rates may be out of date as they are static in the definitions file.
- **Safety:** Always quote your units to prevent shell expansion issues (e.g. `units -t '1/2 inch' 'mm'`).

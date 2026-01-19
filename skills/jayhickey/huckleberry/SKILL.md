---
name: huckleberry
description: Track baby sleep, feeding, diapers, and growth via the Huckleberry CLI. Use when the user asks about logging baby activities, starting/stopping sleep, bottle feeding, diaper changes, or growth measurements.
---

# Huckleberry CLI

Command-line interface for [Huckleberry](https://huckleberrycare.com/), a baby tracking app. Authenticate once and log sleep, feeds, diapers, and growth from your terminal.

> **Note:** This is an unofficial tool and is not affiliated with Huckleberry.

## Install

```bash
pip install huckleberry-cli
```

## Quick start

```bash
huckleberry login
huckleberry children
huckleberry sleep start
```

## Commands

### Sleep

```bash
huckleberry sleep start      # Start sleep timer
huckleberry sleep stop       # Complete sleep (saves duration)
huckleberry sleep pause      # Pause sleep timer
huckleberry sleep resume     # Resume paused sleep
huckleberry sleep cancel     # Cancel without saving
```

### Feeding

**Breastfeeding:**
```bash
huckleberry feed start --side=left    # Start nursing (left side)
huckleberry feed start --side=right   # Start nursing (right side)
huckleberry feed switch               # Switch sides mid-feed
huckleberry feed stop                 # Complete feeding
```

**Bottle:**
```bash
huckleberry feed bottle <amount> [--type=TYPE] [--units=UNITS]

# Examples:
huckleberry feed bottle 120                           # 120ml formula (default)
huckleberry feed bottle 4 --units=oz                  # 4oz formula
huckleberry feed bottle 100 --type="Breast Milk"      # 100ml pumped milk
```

Types: `Formula`, `Breast Milk`, `Mixed`
Units: `ml` (default), `oz`

### Diapers

```bash
huckleberry diaper pee                              # Wet only
huckleberry diaper poo                              # Dirty only
huckleberry diaper both                             # Wet + dirty
huckleberry diaper dry                              # Dry check

# With details:
huckleberry diaper poo --color=yellow               # With color
huckleberry diaper poo --consistency=soft           # With consistency
huckleberry diaper both --color=brown --consistency=runny
```

Colors: `yellow`, `green`, `brown`, `black`, `red`
Consistency: `runny`, `soft`, `solid`, `hard`

### Growth

```bash
huckleberry growth --weight=7.5                     # Weight in kg
huckleberry growth --height=65                      # Height in cm
huckleberry growth --head=42                        # Head circumference in cm
huckleberry growth --weight=7.5 --height=65 --head=42  # All at once

# Imperial units:
huckleberry growth --weight=16.5 --units=imperial   # Weight in lbs
```

### Info

```bash
huckleberry children           # List children
huckleberry --json children    # JSON output (--json before subcommand)
huckleberry status             # Current status
```

### Multiple Children

```bash
huckleberry --child="Baby" sleep start   # Specify child by name
huckleberry -c "Baby" diaper pee
```

## Authentication

Config stored at `~/.config/huckleberry/config.json`. 

```bash
huckleberry login                        # Interactive setup
```

Or use environment variables:
```bash
export HUCKLEBERRY_EMAIL="your@email.com"
export HUCKLEBERRY_PASSWORD="your-password"
export HUCKLEBERRY_TIMEZONE="America/Los_Angeles"
```

## Requirements

- Python 3.11+
- [huckleberry-api](https://github.com/Woyken/py-huckleberry-api)

## Unit Conversions

- 1 oz ≈ 30 ml
- 1 lb ≈ 0.45 kg
- 1 inch ≈ 2.54 cm

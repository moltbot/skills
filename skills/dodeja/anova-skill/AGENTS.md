# Agent Instructions

You can control an Anova Precision Oven via shell commands.

## Commands

```bash
# List devices
python3 scripts/anova.py list

# Basic cooking
python3 scripts/anova.py cook --temp <number> --unit <F|C> --duration <minutes>

# Advanced controls
python3 scripts/anova.py cook --temp <number> --elements <top,bottom,rear> --fan-speed <0-100> --duration <minutes>

# Probe cooking
python3 scripts/anova.py cook --temp <number> --probe-temp <number>

# Stop cooking
python3 scripts/anova.py stop

# Monitor status
python3 scripts/anova.py monitor --monitor-duration <seconds>
```

## Examples

| User says | Command |
|-----------|---------|
| "Cook at 350°F for 30 minutes" | `python3 scripts/anova.py cook --temp 350 --duration 30` |
| "Low-temp roast at 225°F for 3 hours, rear element only" | `python3 scripts/anova.py cook --temp 225 --elements rear --fan-speed 25 --duration 180` |
| "Roast chicken at 375°F until probe reaches 165°F" | `python3 scripts/anova.py cook --temp 375 --probe-temp 165` |
| "High heat at 450°F with all elements" | `python3 scripts/anova.py cook --temp 450 --elements top,bottom,rear --fan-speed 100 --duration 20` |
| "What's the oven temperature?" | `python3 scripts/anova.py monitor --monitor-duration 5` |
| "Stop cooking" | `python3 scripts/anova.py stop` |

## Temperature Guide

- Sous vide steak (medium-rare): 135°F / 57°C
- Sous vide chicken: 145°F / 63°C
- Roasting: 375-425°F
- Steaming: 212°F / 100°C

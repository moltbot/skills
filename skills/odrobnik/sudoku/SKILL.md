---
name: sudoku
description: Fetch Sudoku puzzles and store them as JSON in the workspace; render images on demand; reveal solutions later.
repository: https://github.com/odrobnik/sudoku-skill
metadata:
  clawdbot:
    emoji: "🧩"
    requires:
      bins: ["python3", "node"]
---

# Sudoku

## Overview

Fetch, render, and reveal Sudoku puzzles. Use `sudoku.py` to get new puzzles from `sudokuonline.io`, generate printable PDFs or images, and reveal solutions.

For details on the saved JSON format, see [DATA_FORMAT.md](references/DATA_FORMAT.md).

## Available Puzzle Types

*   `kids4n`: Kids 4x4
*   `kids4l`: Kids 4x4 with Letters
*   `kids6`: Kids 6x6
*   `kids6l`: Kids 6x6 with Letters
*   `easy9`: Classic 9x9 (Easy)
*   `medium9`: Classic 9x9 (Medium)
*   `hard9`: Classic 9x9 (Hard)
*   `evil9`: Classic 9x9 (Evil)

## Get a Puzzle

Fetches a new puzzle and stores it as JSON. Output is JSON by default (use `--text` for human-readable output).

**Get a Classic Easy puzzle:**
```bash
./scripts/sudoku.py get easy9
```

**Get a Kids 6x6 puzzle:**
```bash
./scripts/sudoku.py get kids6
```

## Render Puzzle

Render a puzzle as an image or PDF.

**Render latest puzzle as A4 PDF (for printing):**
```bash
./scripts/sudoku.py render --pdf
```

**Render latest puzzle as clean PNG (for viewing):**
```bash
./scripts/sudoku.py render
```

**Render a specific previous puzzle by short ID:**
```bash
./scripts/sudoku.py render --id a09f3680
```

## Reveal Solution

Reveal the solution for the latest or specific puzzle. Use `--id <short_id>` (e.g., `a09f3680`) to target a specific puzzle.

**Reveal full solution as printable PDF:**
```bash
./scripts/sudoku.py reveal --pdf
```

**Reveal full solution for a specific ID:**
```bash
./scripts/sudoku.py reveal --id a09f3680 --image
```

**Reveal full solution as PNG image:**
```bash
./scripts/sudoku.py reveal
```

**Reveal a single cell (row 3, column 7):**
```bash
./scripts/sudoku.py reveal --cell 3 7
```

**Reveal a specific 3x3 box (index 5):**
```bash
./scripts/sudoku.py reveal --box 5
```

## Share Link

Generate a share link for a stored puzzle. Targets the latest puzzle by default; use `--id <short_id>` for a specific one.

**Generate a SudokuPad share link (default):**
```bash
./scripts/sudoku.py share
```

**Generate link for specific ID:**
```bash
./scripts/sudoku.py share --id a09f3680
```

**Generate an SCL share link:**
```bash
./scripts/sudoku.py share --type scl
```

**Telegram Formatting Tip:**
Format links as a short button-style link and hide the full URL: `[Easy Classic \[<id>\]](<url>)`.

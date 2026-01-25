# Sudoku Data Format

The Sudoku skill persists puzzle state in JSON files stored in `sudoku/puzzles/`.

## File Naming
Format: `YYYY-MM-DD_HHMMSSZ_<preset>_<size>x<size>_<short_id>.json`
Example: `2026-01-25_124059Z_easy9_9x9_2b8d9c35.json`

## Schema

The root object contains:

| Field | Type | Description |
| :--- | :--- | :--- |
| **`version`** | `int` | Schema version (currently `2`). |
| **`created_utc`** | `string` | ISO timestamp of creation (e.g., `2026-01-25_124059Z`). |
| **`preset`** | `object` | Details about the puzzle source preset. |
| **`picked`** | `object` | Details about the specific puzzle selection. |
| **`size`** | `int` | Grid size (e.g., `9` or `6`). |
| **`block`** | `object` | Block dimensions (`bw` width, `bh` height). |
| **`clues`** | `int[][]` | The initial grid (0 = empty). |
| **`solution`** | `int[][]` | The fully solved grid. |
| **`share`** | `object` | Pre-generated share link details. |

### `preset` Object
*   **`key`** *(string)*: Preset ID (e.g., `easy9`, `kids6`).
*   **`desc`** *(string)*: Human-readable name.
*   **`url`** *(string)*: Source URL.
*   **`letters`** *(bool)*: `true` if using letters (A-I) instead of numbers.

### `picked` Object
Stores provenance data about the specific puzzle chosen from the source batch.
*   **`id`** *(string)*: Unique puzzle UUID from the source.
*   **`index`** *(int)*: The zero-based index of this puzzle in the downloaded batch.
*   **`total`** *(int)*: Total number of puzzles available in the source batch at fetch time.

### `clues` / `solution` Arrays
A 2D array (list of lists) representing the grid rows.
*   `0`: Empty cell (clues only).
*   `1-9`: Cell value (or 1-N for other sizes).

### `share` Object
*   **`kind`** *(string)*: Type of share link (`native`, `scl`, or `none`).
*   **`link`** *(string|null)*: The generated share URL.

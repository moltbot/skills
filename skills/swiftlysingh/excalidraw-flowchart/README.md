# Excalidraw Flowchart Skill

A Claude Code skill for creating Excalidraw flowcharts and diagrams from natural language descriptions.

## Installation

### Prerequisites

Install the CLI tool first:

```bash
npm install -g excalidraw-cli
```

### Install the Skill

Clone this repo to your Claude Code skills directory:

```bash
git clone https://github.com/swiftlysingh/excalidraw-skill ~/.claude/skills/excalidraw-flowchart
```

Or manually copy the `SKILL.md` file to `~/.claude/skills/excalidraw-flowchart/SKILL.md`.

## Usage

Once installed, Claude Code will automatically use this skill when you ask it to:

- "Create a flowchart for the login process"
- "Draw a diagram showing the API request flow"
- "Visualize this workflow as an Excalidraw file"
- "Make a flow diagram for user registration"

## How It Works

1. **You describe** what you want in natural language
2. **Claude analyzes** your request and identifies nodes, connections, and flow
3. **Claude generates** DSL syntax for the flowchart
4. **Claude runs** `excalidraw-cli` to create the `.excalidraw` file
5. **You open** the file in Excalidraw to view/edit

## DSL Syntax Quick Reference

| Syntax | Element |
|--------|---------|
| `[Label]` | Rectangle (process step) |
| `{Label?}` | Diamond (decision) |
| `(Label)` | Ellipse (start/end) |
| `[[Label]]` | Database |
| `->` | Arrow |
| `-> "text" ->` | Labeled arrow |

## Example

**Request:** "Create a flowchart for error handling with retry logic"

**Generated DSL:**
```
(Start) -> [Execute Operation] -> {Success?}
{Success?} -> "yes" -> [Return Result] -> (End)
{Success?} -> "no" -> {Retries < 3?}
{Retries < 3?} -> "yes" -> [Increment Retry] -> [Execute Operation]
{Retries < 3?} -> "no" -> [Log Error] -> (Failed)
```

**Output:** `error-handling.excalidraw`

## Related

- [excalidraw-cli](https://github.com/swiftlysingh/excalidraw-cli) - The CLI tool this skill uses
- [Excalidraw](https://excalidraw.com) - The drawing tool that opens the generated files

## License

MIT

---
name: Excalidraw Flowchart
slug: excalidraw-flowchart
version: 1.0.0
description: Create Excalidraw flowcharts from descriptions. Use when user asks to "create a flowchart", "draw a diagram", "visualize a process", "make a flow diagram", "architecture diagram", or discusses workflow/process visualization.
repo: https://github.com/swiftlysingh/excalidraw-skill
---

# Excalidraw Flowchart Skill

Create professional flowcharts and diagrams as Excalidraw files that can be opened in Excalidraw.

## When to Use This Skill

- User asks to create a flowchart or diagram
- User wants to visualize a process or workflow
- User needs an architecture diagram
- User mentions "excalidraw" or "flow diagram"
- User wants to document decision trees

## Prerequisites

The `excalidraw-cli` tool must be installed:

```bash
npm install -g excalidraw-cli
```

Or use via npx (no installation needed):

```bash
npx excalidraw-cli create --inline "DSL" -o output.excalidraw
```

## How to Create a Flowchart

### Step 1: Analyze the Request

Identify from the user's description:
- What are the main steps/nodes?
- What are the decision points?
- What is the flow direction?
- Are there any loops or branches?

### Step 2: Write the DSL

Use this DSL syntax to describe the flowchart:

| Syntax | Element | Use For |
|--------|---------|---------|
| `[Label]` | Rectangle | Process steps, actions |
| `{Label?}` | Diamond | Decisions, conditionals |
| `(Label)` | Ellipse | Start/End points |
| `[[Label]]` | Database | Data storage |
| `->` | Arrow | Connections |
| `-> "text" ->` | Labeled Arrow | Connections with labels |
| `-->` | Dashed Arrow | Optional/alternative paths |

### Step 3: Generate the File

Run the CLI to create the .excalidraw file:

```bash
excalidraw-cli create --inline "YOUR_DSL_HERE" -o flowchart.excalidraw
```

Or for multi-line DSL, use a heredoc:

```bash
excalidraw-cli create --inline "$(cat <<'EOF'
(Start) -> [Step 1] -> {Decision?}
{Decision?} -> "yes" -> [Step 2] -> (End)
{Decision?} -> "no" -> [Step 3] -> [Step 1]
EOF
)" -o flowchart.excalidraw
```

### Step 4: Inform the User

Tell the user:
1. The file was created at the specified path
2. They can open it in Excalidraw (https://excalidraw.com) via File > Open
3. They can edit it further in Excalidraw if needed

## DSL Examples

### Simple Linear Flow

```
(Start) -> [Initialize] -> [Process Data] -> [Save Results] -> (End)
```

### Decision Tree

```
(Start) -> [Receive Request] -> {Authenticated?}
{Authenticated?} -> "yes" -> [Process Request] -> (Success)
{Authenticated?} -> "no" -> [Return 401] -> (End)
```

### Loop/Retry Pattern

```
(Start) -> [Attempt Operation] -> {Success?}
{Success?} -> "yes" -> [Continue] -> (End)
{Success?} -> "no" -> {Retry Count < 3?}
{Retry Count < 3?} -> "yes" -> [Increment Counter] -> [Attempt Operation]
{Retry Count < 3?} -> "no" -> [Log Failure] -> (Error)
```

### Multi-Branch Flow

```
(User Input) -> {Input Type?}
{Input Type?} -> "text" -> [Parse Text] -> [Process]
{Input Type?} -> "file" -> [Read File] -> [Process]
{Input Type?} -> "url" -> [Fetch URL] -> [Process]
[Process] -> [Output Result] -> (Done)
```

### With Database

```
[API Request] -> {Cache Hit?}
{Cache Hit?} -> "yes" -> [[Read Cache]] -> [Return Data]
{Cache Hit?} -> "no" -> [[Query Database]] -> [[Update Cache]] -> [Return Data]
```

## CLI Options

- `--direction <TB|BT|LR|RL>` - Flow direction (default: TB = top to bottom)
- `--spacing <number>` - Node spacing in pixels (default: 50)
- `--output <path>` - Output file path

Example with options:

```bash
excalidraw-cli create --inline "[A] -> [B] -> [C]" --direction LR --spacing 80 -o horizontal-flow.excalidraw
```

## Common Patterns

### API Request Flow

```
[Client Request] -> [API Gateway] -> {Auth Valid?}
{Auth Valid?} -> "yes" -> [Route to Service] -> [[Database]] -> [Response]
{Auth Valid?} -> "no" -> [401 Unauthorized]
```

### CI/CD Pipeline

```
(Push) -> [Build] -> [Test] -> {Tests Pass?}
{Tests Pass?} -> "yes" -> [Deploy Staging] -> {Manual Approval?}
{Manual Approval?} -> "yes" -> [Deploy Production] -> (Done)
{Manual Approval?} -> "no" -> (Cancelled)
{Tests Pass?} -> "no" -> [Notify Team] -> (Failed)
```

### User Registration

```
(Start) -> [Enter Details] -> {Email Valid?}
{Email Valid?} -> "no" -> [Show Error] -> [Enter Details]
{Email Valid?} -> "yes" -> {Password Strong?}
{Password Strong?} -> "no" -> [Show Password Requirements] -> [Enter Details]
{Password Strong?} -> "yes" -> [[Save to Database]] -> [Send Verification Email] -> (Success)
```

## Tips

1. **Keep labels concise** - Use short, action-oriented text
2. **End decisions with ?** - Makes it clear it's a conditional
3. **Use consistent naming** - Helps with node deduplication
4. **Start with (Start)** - Makes the entry point clear
5. **Test complex flows** - Break into smaller parts if needed

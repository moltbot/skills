---
name: para-second-brain
version: 1.2.1
description: Build a persistent knowledge system for your AI agent using PARA methodology (Projects, Areas, Resources, Archive). Transforms scattered notes into organized, searchable wisdom with two-layer memory (daily logs + curated MEMORY.md). Free, self-hosted, works offline.
---

# PARA Second Brain

Build a persistent knowledge system for your AI agent using PARA methodology. Transform scattered notes into organized, searchable wisdom.

## What This Does

Creates a "second brain" structure that separates:
- **Raw capture** (daily logs) from **curated knowledge** (MEMORY.md)
- **Active work** (projects) from **ongoing responsibilities** (areas)
- **Reference material** (resources) from **completed work** (archive)

## How This Differs from Other Second Brain Skills

There's another popular [second-brain skill](https://clawdhub.com/christinetyip/second-brain) powered by Ensue. Both are great — they solve different problems:

| | **PARA Second Brain** (this skill) | **Ensue Second Brain** |
|---|---|---|
| **Storage** | Local files in your workspace | Cloud API (Ensue) |
| **Cost** | Free, self-hosted | Requires Ensue API key |
| **Best for** | Work context, agent continuity, project tracking | Evergreen knowledge base, semantic queries |
| **Search** | Clawdbot's `memory_search` | Ensue's vector search |
| **Structure** | PARA (Projects/Areas/Resources/Archive) | Namespaces (concepts/toolbox/patterns) |
| **Use case** | "What did we decide yesterday?" | "How does recursion work?" |

**Use this skill if:** You want file-based memory that works offline, costs nothing, and tracks ongoing work context.

**Use Ensue's skill if:** You want a cloud-hosted knowledge base optimized for semantic "what do I know about X" queries.

**Use both if:** You want PARA for work context + Ensue for evergreen knowledge. They complement each other.

## Quick Setup

### 1. Create Directory Structure

```
workspace/
├── MEMORY.md              # Curated long-term memory
├── memory/
│   └── YYYY-MM-DD.md      # Daily raw logs
└── notes/
    ├── projects/          # Active work with end dates
    ├── areas/             # Ongoing life responsibilities  
    ├── resources/         # Reference material
    │   └── templates/     # Content templates
    └── archive/           # Completed/inactive items
```

Run this to scaffold:
```bash
mkdir -p memory notes/projects notes/areas notes/resources/templates notes/archive
```

### 2. Initialize MEMORY.md

Create `MEMORY.md` in workspace root - this is your curated long-term memory:

```markdown
# MEMORY.md — Long-Term Memory

## About [Human's Name]
- Role/occupation
- Key goals and motivations
- Communication preferences
- Important relationships

## Active Context
- Current focus areas
- Ongoing projects (summaries, not details)
- Deadlines or time-sensitive items

## Preferences & Patterns
- Tools and workflows they prefer
- Decision-making style
- Pet peeves and likes

## Lessons Learned
- What worked
- What didn't
- Principles discovered

## Key Dates
- Birthdays, anniversaries
- Recurring events
- Important milestones
```

### 3. Add to AGENTS.md

Add these instructions to your AGENTS.md:

```markdown
## Memory

You wake up fresh each session. These files are your continuity:
- **Daily notes:** `memory/YYYY-MM-DD.md` — raw logs of what happened
- **Long-term:** `MEMORY.md` — curated memories (like human long-term memory)
- **Topic notes:** `notes/` — organized by PARA structure

### Writing Rules
- If it has future value, write it down NOW
- Don't rely on "mental notes" — they don't survive restarts
- Text > Brain 📝

### PARA Structure
- **Projects** (`notes/projects/`) — Active work with end dates
- **Areas** (`notes/areas/`) — Ongoing responsibilities (health, finances, relationships)
- **Resources** (`notes/resources/`) — Reference material, how-tos, research
- **Archive** (`notes/archive/`) — Completed or inactive items

### Knowledge Quality — Curate, Don't Hoard
Before saving anything to notes/ or MEMORY.md, ask: **"Will future-me thank me for this?"**

**Quality gates:**
- Written for future self who forgot context
- Includes the WHY, not just the WHAT
- Has concrete examples or the "aha moment"
- Structured for retrieval (scannable, not walls of text)

**Anti-patterns:**
- Don't save half-understood concepts — learn it first
- Don't create shallow entries — if you can't explain it, don't save it
- Don't duplicate — check if it exists, update if needed

Daily files = raw notes (fast, loose). Curated notes = high quality (structured, useful).
```

## Knowledge Quality

**The core question:** "Will future-me thank me for this?"

### What to Save
- Concepts you actually understand (not half-learned ideas)
- Tools you've actually used (not just heard about)
- Patterns that worked (with concrete examples)
- Lessons learned from mistakes

### What NOT to Save
- Half-understood concepts (learn first, save after)
- Tools you haven't tried yet (bookmarks ≠ knowledge)
- Shallow entries without the WHY
- Duplicates of existing notes

### Quality Gates
Before saving any curated note:
1. Written for future self who forgot context?
2. Includes WHY, not just WHAT?
3. Has concrete examples or key insight?
4. Structured for retrieval (scannable)?

## Content Templates

Use these for structured, high-quality entries in `notes/resources/`:

### Concept Template
For understanding how something works:

```markdown
# [CONCEPT NAME]

## What It Is
[One-line definition]

## Why It Matters
[What problem it solves, when you'd need it]

## How It Works
[Explanation with examples]

## Key Insight
[The "aha" moment — what makes this click]

## Related
- [Links to related concepts/tools]
```

### Tool Template
For tools and technologies you've actually used:

```markdown
# [TOOL NAME]

**Category:** [devtools | productivity | infrastructure | etc.]
**Website:** [url]
**Cost:** [free | paid | freemium]

## What It Does
[Brief description]

## Why I Use It
[Personal experience — what problem it solved for YOU]

## When to Reach For It
[Scenarios where this is the right choice]

## Quick Start
[Minimal setup/usage to get going]

## Gotchas
- [Things that tripped you up]
- [What the docs don't tell you]
```

### Pattern Template
For reusable solutions:

```markdown
# [PATTERN NAME]

## Problem
[What situation triggers this pattern]

## Solution
[The approach, with code/pseudocode if relevant]

## Trade-offs
**Pros:** [Why this works]
**Cons:** [When NOT to use it]

## Example
[Concrete implementation]
```

## PARA Explained

### Projects
**What:** Work with a deadline or end state
**Examples:** "Launch website", "Plan trip to Japan", "Finish client proposal"
**File as:** `notes/projects/website-launch.md`

### Areas
**What:** Ongoing responsibilities with no end date
**Examples:** Health, finances, relationships, career development
**File as:** `notes/areas/health.md`, `notes/areas/dating.md`

### Resources
**What:** Reference material for future use
**Examples:** Research, tutorials, templates, interesting articles
**File as:** `notes/resources/tax-guide.md`, `notes/resources/api-docs.md`

### Archive
**What:** Inactive items from the other categories
**Examples:** Completed projects, outdated resources, paused areas
**Move to:** `notes/archive/` when done

## Daily Log Format

Create `memory/YYYY-MM-DD.md` for each day:

```markdown
# YYYY-MM-DD

## Morning
- Context from start of day
- Plans, intentions

## Events
### [Time] — [What happened]
- Details
- Decisions made
- Follow-ups needed

## Learnings
- What worked
- What didn't
- Insights

## Tomorrow
- Carry-forward items
```

## The Curation Workflow

Raw capture is easy. Curation is where value compounds.

### Daily (5 min)
- Log notable events to `memory/YYYY-MM-DD.md`
- File any topic-specific notes to appropriate `notes/` folder

### Weekly (15 min)
- Review the week's daily logs
- Extract patterns and learnings to MEMORY.md
- Move completed projects to archive
- Update area notes with new context

### Monthly (30 min)
- Review MEMORY.md for outdated info
- Consolidate or archive old project notes
- Ensure areas reflect current priorities

## Decision Tree: Where Does This Go?

```
Is it about today specifically?
  → memory/YYYY-MM-DD.md

Is it a task with an end date?
  → notes/projects/

Is it an ongoing responsibility?
  → notes/areas/

Is it reference material for later?
  → notes/resources/

Is it done or no longer relevant?
  → notes/archive/

Is it a distilled lesson or preference?
  → MEMORY.md
```

## Why Two Memory Layers?

| Daily Logs | MEMORY.md |
|------------|-----------|
| Raw, timestamped | Curated, organized |
| Everything captured | Only what matters |
| Chronological | Topical |
| High volume | Condensed |
| "What happened" | "What I learned" |

Daily logs are your journal. MEMORY.md is your wisdom.

## Integration with Memory Search

This structure works perfectly with Clawdbot's `memory_search`:
- Searches MEMORY.md + memory/*.md automatically
- Returns relevant snippets with file path + line numbers
- Use `memory_get` to pull specific sections

The PARA structure in `notes/` gives you organized reference material beyond what memory search indexes.

## Principles

1. **Quality over quantity** — Curated notes beat note hoarding
2. **Capture fast, curate deliberately** — Daily logs are loose; curated notes are high quality
3. **Text > brain** — If it matters, write it down
4. **Future-me test** — "Will future-me thank me for this?"
5. **One home per item** — Don't duplicate; link instead
6. **Include the WHY** — Facts without context are useless

---

*Pairs well with [memory-setup](https://clawdhub.com/jrbobbyhansen-pixel/memory-setup) for technical config and [proactive-agent](https://clawdhub.com/halthelobster/proactive-agent) for behavioral patterns.*

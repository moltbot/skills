---
name: skillcraft
description: Create, design, and package Clawdbot skills. Use when asked to "make/build/craft a skill for X", or when extracting ad-hoc functionality ("turn my script/agent instructions/library into a skill"). Applies Clawdbot-specific integration concerns (tool calling, memory, message routing etc.) to build reusable skills that compose.
metadata: {"clawdbot":{"emoji":"🧶"}}
---

# Skillcraft - Clawdbot Skill Creator

An opinionated, AI-native design guide for Clawdbot skills. Focuses on **clawdbot-specific integration patterns** — message routing, cron scheduling, memory persistence, channel formatting — not generic programming advice.

**Assumes:** The agent knows how to write code, structure projects, and handle errors. This skill teaches *clawdbot-specific* concerns.

## Prerequisites

**Load the `clawddocs` (or equivalent) skill first.** This skill relies on Clawdbot documentation for authoritative feature details. The clawddocs skill provides:

- Documentation category navigation (see categories below)
- Search scripts for finding specific docs
- Config snippets for common patterns

**Documentation categories** (via clawddocs):

| Category | Path | Use for |
| -------- | ---- | ------- |
| Gateway & Config | `/gateway/` | Configuration, security, health |
| Tools | `/tools/` | Skills, browser, bash, subagents |
| Automation | `/automation/` | Cron jobs, webhooks, polling |
| Concepts | `/concepts/` | Sessions, models, queues, streaming |
| Providers | `/providers/` | Discord, Telegram, WhatsApp, etc. |

When this skill says "consult documentation," use clawddocs to fetch the relevant doc.

## Core Philosophy

**Skills are how Clawdbot extends itself.** They survive context limits, compose cleanly, and share via ClawdHub. 

**Most good skills start as scattered notes before anyone formalizes them.** This skill is a protocol for that formalization — turning "remember to do X" into something that composes and shares.

---

## The Design Sequence

Follow these stages in order. Each produces artifacts that feed the next.

**Two entry modes:**

- **New skill:** Start at Stage 1
- **Extracting existing functionality:** Start at Stage 0

---

### Stage 0: Inventory (Extraction Only)

**Skip this stage if building a new skill from scratch.**

Use this when functionality already exists but isn't packaged as a skill. Common sources:

- Scripts in `<workspace>/scripts/` that aren't part of any skill
- Instructions buried in TOOLS.md or AGENTS.md
- Patterns repeated across conversations
- "Remember to do X" notes that should be formalized

**Gather the artifacts:**

Ask:

- **Where does it live?** (scripts, TOOLS.md section, memory notes, conversation patterns)
- **What does it do?** (describe the capability)
- **How is it currently triggered?** (manual request, heartbeat check, ad-hoc)
- **What Clawdbot features does it use?** (exec, cron, message, memory, etc.)

Example inventory:

```
- scripts/mail/check.py — fetches and processes emails
- TOOLS.md ## Mail Rules — documents the mail command syntax  
- HEARTBEAT.md — includes "run mail heartbeat" instruction
- mail-rules.yaml — configuration file
```

**Assess current state:**

- **What's working well?** (keep it)
- **What's fragile or unclear?** (improve it)
- **What's missing?** (add it)
- **What's over-engineered?** (simplify it)

**Output:** Inventory of existing artifacts with assessment notes. Then proceed to Stage 1.

---

### Stage 1: Problem Understanding

**Goal:** Concrete clarity on what the skill does and when it's needed.

Work through these questions with the user:

1. **What does this skill do?** (one sentence)

2. **When should this skill be loaded?**
   - What would a user say? (3-5 example phrases)
   - What mid-task needs might lead here? (e.g., "need weather data", "need to send a message")
   - Any scheduled/periodic triggers? (heartbeat, cron)

3. **What does success look like?** For each example, what's the outcome?

*If extracting:* Derive from actual usage, not just hypotheticals. It's ok to generalise the problem if that's what the user wants.

**Output:** Problem statement with trigger examples and success criteria.

---

### Stage 2: Capability Discovery

**Goal:** Understand what the skill needs to work with.

#### Generalisability

Ask the user: **Is this skill for your setup specifically, or should it work for any Clawdbot instance?**

| Choice | Implications |
|--------|--------------|
| **Universal** | Generic paths (`<workspace>/`), no assumptions about installed tools, minimal references to user-specific config, suitable for ClawdHub |
| **Particular** | Can reference specific local paths, skills, tools, TOOLS.md entries; tailored to user's workflow |

This affects many downstream decisions. Capture it early.

*If extracting:* Also decide what stays in workspace (user config, state) vs. what moves to skill (scripts, instructions, references).

#### Skill Synergy Search (Particular Only)

**Skip this section if building a Universal skill.**

When building for a particular setup, leverage existing workspace capabilities:

1. **Scan available skills** — review the skill descriptions in `<available_skills>` from your system prompt
2. **Identify promising synergies** — look for skills that:
   - Provide data sources this skill could consume (e.g., calendar, contacts, location)
   - Offer complementary capabilities (e.g., notification, storage, presentation)
   - Handle adjacent domains that might integrate naturally
3. **Deep-read promising skills** — for each skill with apparent synergy, read its SKILL.md to understand:
   - Exact capabilities and invocation patterns
   - Output formats that could be consumed
   - State or configuration that might be shared
   - Opportunities for composition or delegation

Prioritise skills which have their dependencies fulfilled and are in active use.

**Example:** Building a "daily briefing" skill? Scan for: calendar skills (event data), weather skills (forecast), mail skills (unread count), location skills (context-aware content). Read each to understand how to compose them.

**Output from this step:** List of synergistic skills with brief notes on how each might integrate.

#### External Dependencies

- Does it wrap a CLI tool? Which one? Is it installed? What's the basic usage pattern?
- Does it wrap a web API? What's the base URL? Auth mechanism? Rate limits?
- Does it process local files? What formats? What transformations?

#### Clawdbot Features

Clawdbot has powerful built-in features with deep semantics and rich configurability. They can be combined in unexpected ways to solve user problems.

**Conduct a creatively-minded review of the documentation** with the skill's needs in mind. Use **clawddocs** to explore — start with `/concepts/` and `/tools/` categories. Think like a meta-programmer: Clawdbot's features are primitives that compose. A skill might combine cron scheduling with canvas presentation and node camera access in ways no single feature anticipates. If a solution would require a configuration change, check `/gateway/configuration` and suggest it to the user.

**Documentation categories to explore:**

| Need | Doc Category | Tools/Features |
|------|--------------|----------------|
| Send messages | `/concepts/messages` | `message` tool |
| Scheduled tasks | `/automation/cron-jobs` | `cron` tool |
| Persistent memory | `/concepts/` | Memory system, state files |
| Background work | `/tools/subagents` | `sessions_spawn` |
| Device interaction | `/nodes/` | `nodes` tool (camera, screen, location) |
| UI presentation | `/tools/` | `canvas` tool |
| Web browsing | `/tools/browser` | `browser` tool |
| Web research | `/tools/` | `web_search`, `web_fetch` |
| Image analysis | `/tools/` | `image` tool |

**Verify feature usage against documentation.** Don't assume — features evolve and have nuances. Use clawddocs to check:

- Tool parameters and capabilities (fetch the relevant `/tools/` doc)
- Channel-specific constraints (check `/providers/` for the target channel)
- Configuration requirements and defaults (`/gateway/configuration`)
- Known gotchas or limitations

**Output:** Capability map listing external deps, Clawdbot features to use, and generalisability choice.

---

### Stage 3: Architecture

**Goal:** Identify applicable design patterns and propose initial architecture.

Based on Stages 1-2, identify which patterns apply. Load relevant pattern references:

| If the skill... | Load pattern |
|-----------------|--------------|
| Wraps a CLI tool | `patterns/cli-wrapper.md` |
| Wraps a web API | `patterns/api-wrapper.md` |
| Monitors and notifies | `patterns/monitor.md` |

Skills often combine multiple patterns. Load all that apply and synthesize.

#### Script vs. Agent Instructions

A critical design juncture: how should executable scripts be combined with agent instructions in SKILL.md?

**Use scripts when:**

- The operation is deterministic and repeatable
- Complex logic that's error-prone to re-derive each time
- Performance matters (script runs faster than AI reasoning)
- External tool interaction with specific syntax
- State management with precise file formats

**Use agent instructions when:**

- Judgment is required (interpreting results, choosing approaches)
- The task varies based on context
- Natural language interaction is primary
- Flexibility matters more than consistency
- The "how" depends on "what" (can't be predetermined)

The split: scripts handle the *mechanics*, instructions handle the *judgment*.

#### Example: Context Briefing Skill

A skill that prepares briefings before meetings. This illustrates the full agent→script→agent flow.

**User message:**
> "Brief me on Acme Corp before my 2pm call"

**Phase 1: Agent parses and routes (SKILL.md instructions)**

```markdown
## Handling Briefing Requests

When user requests a briefing:
1. Extract the **subject** (company, person, project, topic)
2. Extract **context** if provided (meeting, call, presentation, general)
3. Check calendar for related upcoming events
4. Run the appropriate gather script based on subject type:
   - Company/org → `scripts/gather.py --type company --name "..."`
   - Person → `scripts/gather.py --type person --name "..."`
   - Project → `scripts/gather.py --type project --name "..."`
5. Analyze results and compose briefing (see Phase 3)
```

The agent interprets "Acme Corp" as a company, "2pm call" as meeting context. It checks calendar, finds "Call with Acme Corp re: Q2 partnership" at 2pm.

**Phase 2: Script fetches external data**

```bash
scripts/gather.py --type company --name "Acme Corp" --context meeting
```

```python
# scripts/gather.py - deterministic data gathering
def gather_company(name: str, context: str) -> dict:
    return {
        "emails": search_emails(f"from:{domain} OR to:{domain}", days=30),
        "calendar": get_related_events(name, days=14),
        "web": search_web(f"{name} news", recent=True),
        "contacts": find_contacts(name),
        "history": load_prior_briefings(name)  # from state
    }
    # Output: structured JSON with all gathered data
```

**Phase 3: Agent synthesizes and acts (SKILL.md instructions)**

```markdown
## Composing the Briefing

With gathered data, synthesize: key context, recent activity, news, relationship history, suggested talking points, and warnings.

If meeting is <1 hour away, send immediately. If >1 hour, offer to set a reminder.

After delivery: log to `<workspace>/memory/`, update `<skill>/state.json`.
```

The agent composes a briefing from the structured data, using judgment to prioritize and frame.

If user confirms reminder → **dynamically select the appropriate reminder system**. The skill doesn't hardcode "use Apple Reminders" — it checks what's available (Apple Reminders skill? Google Calendar? cron-based?) and routes accordingly. This is agent judgment, not script logic.

---

#### Composable Pattern Examples

Skills often combine multiple Clawdbot primitives in non-obvious ways. See **[patterns/composable-examples.md](patterns/composable-examples.md)** for 7 detailed examples:

1. Visual Monitoring Pipeline (nodes + image + canvas + message)
2. Parallel Research Aggregator (sessions_spawn + web_search + browser)
3. Location-Aware Context Switcher (nodes + cron + memory)
4. Cross-Channel Thread Tracker (message + memory_search + sessions_send)
5. Scheduled Report Generator (cron + exec + browser + canvas)
6. Interactive Approval Workflow (message + cron + memory + gateway)
7. Adaptive Learning Loop (image + memory + cron)

**Output:** Selection of Clawdbot system features with rationale (if any), initial architecture sketch.


### Stage 4: Design Specification

**Goal:** User-reviewed specification ready for implementation.

#### State Requirements

- **Stateless:** Pure function of inputs, no memory needed
- **Session-stateful:** Remembers within a conversation (use context)
- **Persistent-stateful:** Survives restarts (needs file-based state)

If persistent state is needed, where should it live?

- `<workspace>/memory/` — for context that's part of the user's memory
- `<skill>/state.json` — for skill-internal state (lives with the skill)
- `<workspace>/state/<skill>.json` — for skill-internal state (common workspace area)
- `<workspace>/TOOLS.md` — for user-specific configuration notes

By default, skills shouldn't write state outside the workspace. `~/.clawdbot/` and other system-level config directories are not suitable for state storage.

#### User Preferences & Environment

Ask about the user's existing setup:

- **Scripting language preference?** (Python, Bash, etc.)
- **Coding style preferences?** (types, functional idioms, etc.)
- **Existing shared environment?** (venv, uv, conda that scripts should use)

Check USER.md and TOOLS.md for documented coding preferences.

#### Secret Handling

If the skill needs API keys or credentials:

1. **Ask how the user handles secrets** — they may have existing patterns
2. **Default to environment variables** — `SERVICENAME_API_KEY`
3. **Document the requirement** — in SKILL.md setup section
4. **Never hard-code secrets** — not in scripts, not in skill files

Common patterns:

- Environment variables (most portable)
- macOS Keychain via `security` command
- Config file in `~/.config/skillname/` (gitignored)
- 1Password CLI (`op read`)

#### Proposed Architecture

Present the proposed architecture:

1. **Skill structure** — files and directories
2. **SKILL.md outline** — sections and key content
3. **Software** — high level requirements for each software component (script, module, wrapper)
4. **State management** — where and how state is persisted
5. **Clawdbot integration points** — which features, how they interact

*If extracting:* Include migration notes — what moves where, what workspace files need updating.

**The specification is a review checkpoint.** Its purpose is letting the user verify:

- Assumptions about Clawdbot integration are correct
- The design fits their existing workflow
- No conflicts with existing workspace files or tools
- Generalisability matches their intent

**Validate against requirements:**

- Does it handle all the examples from Stage 1?
- Are Clawdbot features used correctly? (verify via clawddocs)
- Is the state approach appropriate for the access pattern?
- Are there edge cases or failure modes to handle?
- Has the proposed architecture revealed any contradictions in the Stage 1 requirements?

**Iterate** until the user is satisfied. This is where design problems surface cheaply.

**Output:** Design specification including state approach, user preferences, secret handling, and skill structure.

---

### Stage 5: Implementation

**Goal:** Working skill with all components.

**Strong default: Same-session implementation.** Work through the spec with user review at each step. This keeps the user in the loop for integration decisions.

**Coding-agent handoff is optional** and should be reserved for **complex software subcomponents only** — not entire skills. The SKILL.md and integration logic should stay in the main session where the user can review.

#### Implementation Steps

Work through in order, with user review at each checkpoint:

1. **Create skill directory**
2. **SKILL.md skeleton** — frontmatter + section headers
   → *Review: is the structure right?*
3. **Scripts** (if any) — get executable pieces working
   → *Review: test each script*
4. **SKILL.md body** — complete instructions
5. **Test against Stage 1 examples**
   → *Review: does it handle all examples?*

*If extracting:*
6. Update workspace files (remove migrated content, add skill references)
7. Clean up old locations
8. Verify skill works standalone

#### Crafting the Skill Frontmatter

The SKILL.md frontmatter determines discoverability and provides structured metadata. The `description` field is critical — when the agent scans available skills, this determines whether the skill gets loaded.

See <https://docs.clawd.bot/tools/skills> for Clawdbot-specific metadata documentation.

**Frontmatter format:**

```yaml
---
name: my-skill
description: [description optimized for discovery]
homepage: https://github.com/user/repo  # optional
metadata: {"clawdbot": {"emoji": "🔧", "requires": {"bins": ["tool"], "env": ["API_KEY"]}, "install": [...]}}
---
```

**Description field — write for keyword matching and context recognition:**

- **What it does** — the core capability
- **Keywords** — terms users might say that should trigger this skill
- **Contexts** — situations where this skill applies
- **Trigger phrases** — natural language patterns that indicate relevance

**Example (good):**

```yaml
description: Download videos/audio from YouTube and other sites with interactive quality selection, learned preferences, and recent directory tracking. Use when user shares a video URL or asks to download video/audio.
```

**Example (too sparse):**

```yaml
description: YouTube downloader.
```

**Metadata field** (optional but recommended for publishable skills)

Refer to the format specification at <https://docs.clawd.bot/tools/skills>.

Simple example:

```json
{
  "clawdbot": {
    "emoji": "📍",
    "requires": {
      "bins": ["goplaces"],
      "env": ["GOOGLE_PLACES_API_KEY"]
    },
    "primaryEnv": "GOOGLE_PLACES_API_KEY",
    "install": [
      {
        "id": "brew",
        "kind": "brew",
        "formula": "steipete/tap/goplaces",
        "bins": ["goplaces"],
        "label": "Install goplaces (brew)"
      }
    ]
  }
}
```

**Test the description:** Would the agent select this skill if the user said each of your Stage 1 example phrases? If not, add the missing keywords.

**Output:** Complete skill directory ready for use.

---

## Path Conventions

Skills must handle paths carefully, especially for portability and multi-agent contexts.

### Notation

| Prefix | Meaning | Example |
|--------|---------|---------|
| `<workspace>/` | Agent's workspace root | `<workspace>/TOOLS.md` |
| `<skill>/` | This skill's directory | `<skill>/scripts/check.py` |
| (no prefix) | Skill-relative path | `scripts/helper.sh` |

**Rules:**

- **Workspace files:** Always use `<workspace>/` prefix
- **Skill components:** Relative paths OK (refers to skill directory)
- **Never hardcode** `~/clawd` or similar — workspaces are portable
- **State files:** Use `<workspace>/` paths, not `~/.clawdbot/` (skills don't own user home)

### Sub-Agent Considerations

Sub-agents via `sessions_spawn` may run in sandboxed containers with different mount points. Use **clawddocs** to check `/tools/subagents` for current sandbox configuration and path translation requirements. When spawning sub-agents that need workspace files, include path context in the task description.

## Workspace Awareness

Skills may interact with workspace structure:

| File | Purpose | When to reference |
|------|---------|-------------------|
| `<workspace>/TOOLS.md` | Local tool notes | CLI wrappers storing user-specific config |
| `<workspace>/MEMORY.md` | Long-term memory | Skills that contribute to memory |
| `<workspace>/memory/` | Daily logs | Skills that log activity |
| `<workspace>/HEARTBEAT.md` | Periodic checks | Heartbeat-driven skills |
| `<workspace>/USER.md` | User context | Skills needing user info |

**Principle:** Skills document *what* workspace files they touch and *why*.

---

## References

Pattern references for common skill types:

- `patterns/cli-wrapper.md` — wrapping CLI tools
- `patterns/api-wrapper.md` — wrapping web APIs
- `patterns/monitor.md` — watching conditions and notifying

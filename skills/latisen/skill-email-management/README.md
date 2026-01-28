# Email Management Expert Skill

An expert email management skill for Claude Code that provides intelligent workflows, best practices, and productivity strategies for the Apple Mail MCP.

## What is This?

This is a **Claude Code Skill** that teaches Claude how to be an expert email management assistant. It works together with the Apple Mail MCP:

- **Apple Mail MCP** = The tools (18 email management functions)
- **Email Management Skill** = The expertise (workflows, strategies, best practices)

Together, they create an intelligent email management assistant that knows both what it CAN do (MCP tools) and HOW to do it effectively (Skill knowledge).

## Contents

```
skill-email-management/
├── SKILL.md                        # Main skill definition with core workflows
├── examples/
│   ├── inbox-zero-workflow.md     # Complete inbox zero methodology
│   ├── email-triage.md            # Quick daily triage techniques
│   └── folder-organization.md     # Folder structure strategies
└── templates/
    ├── common-workflows.md        # Copy-paste workflow patterns
    └── search-patterns.md         # Comprehensive search reference
```

## What You Get

### Core Workflows
- **Daily Inbox Triage** - Process emails quickly (10-15 min)
- **Inbox Zero** - Achieve and maintain empty inbox
- **Email Organization** - Folder structures and filing strategies
- **Advanced Search** - Find any email quickly
- **Bulk Operations** - Clean up and organize efficiently
- **Draft Management** - Handle complex email composition
- **Email Analytics** - Understand patterns and optimize

### Best Practices
- Industry-standard productivity methods (GTD, Inbox Zero)
- Safety-first approaches (backups, limits, confirmations)
- Privacy and security considerations
- Tool selection guidelines
- Common scenarios and solutions

### Ready-to-Use Patterns
- Search patterns for every scenario
- Workflow templates you can copy-paste
- Decision frameworks
- Troubleshooting guides

## Installation

### Option 1: From Zip Package (Easiest)

**Download and install:**

1. Download `email-management-skill.zip` from the [releases page](https://github.com/patrickfreyer/apple-mail-mcp/releases)

2. Extract and install to user scope (available in all projects):
   ```bash
   unzip email-management-skill.zip -d ~/.claude/skills/
   ```

3. That's it! The skill is now available in Claude Code.

**Or install to project scope** (available in current project only):
```bash
unzip email-management-skill.zip -d .claude/skills/
```

### Option 2: From Repository

Install the skill directly from the cloned repository:

**User Scope (Recommended):**
```bash
# From the repo directory
cp -r skill-email-management ~/.claude/skills/email-management
```

**Project Scope:**
```bash
# From the repo directory
mkdir -p .claude/skills
cp -r skill-email-management .claude/skills/email-management
```

## Usage

Once installed, the skill activates automatically when you mention email management topics in Claude Code:

**Trigger Keywords:**
- "inbox management"
- "email organization"
- "email triage"
- "inbox zero"
- "organizing emails"
- "managing mail folders"
- "email productivity"
- "checking emails"
- "workflow optimization"

**Example Queries:**
- "Help me achieve inbox zero"
- "How should I organize my project emails?"
- "Triage my inbox"
- "Find all emails from John about the Alpha project"
- "What's the best way to handle my email workflow?"
- "Clean up old emails"

Claude will now:
1. Recognize these as email management requests
2. Load the Email Management Skill expertise
3. Use the Apple Mail MCP tools intelligently
4. Follow best practice workflows
5. Provide actionable suggestions with specific tool commands

## How It Works

### Before the Skill
```
User: "Help me organize my inbox"
Claude: *Calls list_inbox_emails tool*
        *Shows email list*
        "Here are your emails"
```

### After the Skill
```
User: "Help me organize my inbox"
Claude: *Loads Email Management Skill*
        *Calls get_inbox_overview for situational awareness*
        *Analyzes inbox state*
        *Suggests appropriate workflow (triage, inbox zero, or organization)*
        *Provides step-by-step guidance*
        *Offers best practices and next steps*
```

## Features

### Intelligent Workflows
The skill provides battle-tested workflows for common scenarios:
- Morning inbox check (10 min)
- Daily filing routine (15 min)
- Weekly maintenance (30 min)
- Vacation recovery (1-2 hours)
- Bulk cleanup operations

### Tool Orchestration
The skill knows how to combine MCP tools effectively:
- When to use `get_inbox_overview()` vs `search_emails()`
- How to batch operations for efficiency
- When to export before cleanup
- How to safely delete emails
- When to flag vs. move vs. draft

### Context-Aware Suggestions
Based on your inbox state, the skill provides relevant advice:
- "You have 200 unread - let's start with triage"
- "Top sender is newsletters - consider unsubscribing"
- "Flagged items accumulating - schedule review time"
- "This folder has 500 emails - time to archive"

### Safety First
The skill enforces safety practices:
- Always respects max_moves/max_deletes limits
- Suggests exporting before bulk deletion
- Confirms destructive operations
- Provides reversible alternatives (trash vs. permanent delete)

## Customization

You can customize the skill for your needs:

1. **Edit SKILL.md** - Modify core workflows and principles
2. **Add examples/** - Create new workflow documents
3. **Update templates/** - Add your own workflow patterns
4. **Adjust descriptions** - Change trigger keywords in frontmatter

Example: Add your company's email policies:

```markdown
## Company Email Policies

- All client emails must be filed in Clients/ folder
- Retention policy: Archive emails >1 year old
- Confidential tag: Use [CONF] in subject line
```

## Learning Resources

### Start Here
1. Read `SKILL.md` - Core workflows and principles
2. Review `examples/inbox-zero-workflow.md` - Complete methodology
3. Browse `templates/common-workflows.md` - Ready-to-use patterns

### Deep Dives
- `examples/email-triage.md` - Quick processing techniques
- `examples/folder-organization.md` - Structure strategies
- `templates/search-patterns.md` - Master email search

## Benefits

### For Individual Users
- Faster email processing (save 30-60 min/day)
- Better organization and less stress
- Never lose important emails
- Learn productivity best practices

### For Teams
- Consistent email management approach
- Shared workflows and patterns
- Onboard new team members faster
- Version control email processes

### For MCP Developers
- Shows how to document tool usage
- Provides user education layer
- Reduces support questions
- Increases MCP adoption

## Requirements

- Claude Code (with Skills support)
- Apple Mail MCP (this repo)
- macOS with Apple Mail

## Version

**Version:** 1.0.0
**Compatible with:** Apple Mail MCP v1.4.0+
**Last Updated:** 2025-01-16

## About Skills

Skills are a Claude Code feature that packages expertise into discoverable capabilities. Unlike slash commands (which are user-invoked), skills are **model-invoked** - Claude automatically uses them when relevant.

**Learn more:** https://docs.claude.com/en/docs/claude-code/skills

## Contributing

Found a great workflow or search pattern? Contributions welcome!

1. Add your workflow to `examples/` or `templates/`
2. Update `SKILL.md` if needed
3. Submit a PR

## License

MIT License - Same as the Apple Mail MCP

## Support

Issues? Questions? Open an issue on the main repo.

---

**Pro Tip:** Start with the inbox zero workflow in `examples/inbox-zero-workflow.md`. It's the most comprehensive introduction to email productivity with this skill!

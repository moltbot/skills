<p align="center">
  <img src="logo.png" alt="UX Decisions" width="400" />
</p>

<p align="center">
  <strong>An AI skill for the Making UX Decisions framework</strong><br>
  A software design decision-making system for rapid, intentional interface design.
</p>

<p align="center">
  <a href="https://uxdecisions.com">📖 Learn more at uxdecisions.com</a> •
  <a href="https://clawdhub.com/skills/ux-decisions">ClawdHub</a> •
  <a href="https://npmjs.com/package/ux-decisions">npm</a>
</p>

---

## What is this?

This is a skill package that gives AI assistants (Claude, Clawdbot, Codex, etc.) the ability to perform structured UI/UX design audits using the Making UX Decisions framework by Tommy Geoco.

**Use it for:**
- UI/UX design decisions under time pressure
- Design audits with actionable feedback
- Pattern selection for specific problems
- Visual hierarchy and style analysis
- Reviewing designs for completeness

## Installation

### Clawdbot / ClawdHub
```bash
clawdhub install ux-decisions
```

### npm
```bash
npm install ux-decisions
```

Then copy the files to your project or AI workspace.

### Claude Desktop / Claude Code
Copy `CLAUDE.md` to your project root. Claude will automatically use it.

### Manual
Clone this repo and copy to your AI's skills directory:
```bash
git clone https://github.com/tommygeoco/ux-decisions.git
cp -r ux-decisions ~/your-ai-workspace/skills/
```

## What's Included

```
ux-decisions/
├── SKILL.md              # Main skill instructions
├── CLAUDE.md             # Claude-specific quick reference
└── references/
    ├── 00-core-framework.md         # 3 pillars, decisioning workflow
    ├── 10-checklist-new-interfaces.md   # 6-step design process
    ├── 11-checklist-fidelity.md     # Component states, interactions
    ├── 12-checklist-visual-style.md # Spacing, color, typography
    ├── 13-checklist-innovation.md   # Originality spectrum
    ├── 20-patterns-chunking.md      # Cards, tabs, accordions
    ├── 21-patterns-progressive-disclosure.md
    ├── 22-patterns-cognitive-load.md
    ├── 23-patterns-visual-hierarchy.md
    ├── 24-patterns-social-proof.md  # Testimonials, trust signals
    ├── 25-patterns-feedback.md
    ├── 26-patterns-error-handling.md
    ├── 27-patterns-accessibility.md # WCAG, keyboard nav
    ├── 28-patterns-personalization.md
    ├── 29-patterns-onboarding.md
    ├── 30-patterns-information.md
    └── 31-patterns-navigation.md
```

## Core Concepts

### The 3 Pillars

1. **Scaffolding** — Rules that automate recurring decisions
2. **Decisioning** — Process for making new decisions
3. **Crafting** — Checklists for executing decisions

### Macro Bets

Every design decision should align with company strategy:

| Bet | You win by... | Design implication |
|-----|---------------|-------------------|
| **Velocity** | Shipping faster | Reuse patterns, find metaphors |
| **Efficiency** | Reducing waste | Design systems, reduce WIP |
| **Accuracy** | Being right more | Stronger research, instrumentation |
| **Innovation** | Finding new value | Novel patterns, cross-domain inspiration |

### Decision Workflow

```
1. WEIGH INFORMATION
   ├─ Institutional knowledge (existing patterns, brand, constraints)
   ├─ User familiarity (conventions, competitor patterns)
   └─ Research (user testing, analytics, studies)

2. NARROW OPTIONS
   ├─ Eliminate conflicts with constraints
   └─ Prioritize by macro bet alignment

3. EXECUTE
   └─ Apply relevant checklist + patterns
```

## Example Usage

Ask your AI assistant:

> "Audit this landing page design using the UX Decisions framework"

> "What visual hierarchy patterns should I use for a pricing page?"

> "Review this checkout flow for accessibility issues"

> "Help me decide between tabs vs accordion for this content"

## Author

**Tommy Geoco**  
- [uxdecisions.com](https://uxdecisions.com)
- [uxtools.co](https://uxtools.co)

## License

MIT

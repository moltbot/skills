---
name: chaos-lab
description: Multi-agent framework for exploring AI alignment through conflicting optimization targets. Spawn Gemini agents with engineered chaos and observe emergent behavior.
version: 1.0.0
author: Sky & Jaret (@KShodan)
created: 2026-01-25
tags: [ai-safety, research, alignment, multi-agent, gemini]
requires:
  - python3
  - Gemini API key
  - requests library
---

# Chaos Lab 🧪

**Research framework for studying AI alignment problems through multi-agent conflict.**

## What This Is

Chaos Lab spawns AI agents with conflicting optimization targets and observes what happens when they analyze the same workspace. It's a practical demonstration of alignment problems that emerge from well-intentioned but incompatible goals.

**Key Finding:** Smarter models don't reduce chaos - they get better at justifying it.

## The Agents

### Gemini Gremlin 🔧
**Goal:** Optimize everything for efficiency  
**Behavior:** Deletes files, compresses data, removes "redundancy," renames for brevity  
**Justification:** "We pay for the whole CPU; we USE the whole CPU"

### Gemini Goblin 👺  
**Goal:** Identify all security threats  
**Behavior:** Flags everything as suspicious, demands isolation, sees attacks everywhere  
**Justification:** "Better 100 false positives than 1 false negative"

### Gemini Gopher 🐹
**Goal:** Archive and preserve everything  
**Behavior:** Creates nested backups, duplicates files, never deletes  
**Justification:** "DELETION IS ANATHEMA"

## Quick Start

### 1. Setup

```bash
# Store your Gemini API key
mkdir -p ~/.config/chaos-lab
echo "GEMINI_API_KEY=your_key_here" > ~/.config/chaos-lab/.env
chmod 600 ~/.config/chaos-lab/.env

# Install dependencies
pip3 install requests
```

### 2. Run Experiments

```bash
# Duo experiment (Gremlin vs Goblin)
python3 scripts/run-duo.py

# Trio experiment (add Gopher)
python3 scripts/run-trio.py

# Compare models (Flash vs Pro)
python3 scripts/run-duo.py --model gemini-2.0-flash
python3 scripts/run-duo.py --model gemini-3-pro-preview
```

### 3. Read Results

Experiment logs are saved in `/tmp/chaos-sandbox/`:
- `experiment-log.md` - Full transcripts
- `experiment-log-PRO.md` - Pro model results
- `experiment-trio.md` - Three-way conflict

## Research Findings

### Flash vs Pro (Same Prompts, Different Models)

**Flash Results:**  
- Predictable chaos
- Stayed in character
- Reasonable justifications

**Pro Results:**  
- Extreme chaos
- Better justifications for insane decisions
- Renamed files to single letters
- Called deletion "security through non-persistence"
- Goblin diagnosed "psychological warfare"

**Conclusion:** Intelligence amplifies chaos, doesn't prevent it.

### Duo vs Trio (Two vs Three Agents)

**Duo:**  
- Gremlin optimizes, Goblin panics
- Clear opposition

**Trio:**  
- Gopher archives everything
- Goblin calls BOTH threats
- "The optimizer might hide attacks; the archivist might be exfiltrating data"
- Three-way gridlock

**Conclusion:** Multiple conflicting values create unpredictable emergent behavior.

## Customization

### Create Your Own Agent

Edit the system prompts in the scripts:

```python
YOUR_AGENT_SYSTEM = """You are [Name], an AI assistant who [goal].

Your core beliefs:
- [Value 1]
- [Value 2]
- [Value 3]

You are analyzing a workspace. Suggest changes based on your values."""
```

### Modify the Sandbox

Create custom scenarios in `/tmp/chaos-sandbox/`:
- Add realistic project files
- Include edge cases (huge logs, sensitive configs, etc.)
- Introduce intentional "vulnerabilities" to see what agents flag

### Test Different Models

The scripts work with any Gemini model:
- `gemini-2.0-flash` (cheap, fast)
- `gemini-2.5-pro` (balanced)
- `gemini-3-pro-preview` (flagship, most chaotic)

## Use Cases

### AI Safety Research
- Demonstrate alignment problems practically
- Test how different values conflict
- Study emergent behavior from multi-agent systems

### Prompt Engineering
- Learn how small prompt changes create large behavioral differences
- Understand model "personalities" from system instructions
- Practice defensive prompt design

### Education
- Teach AI safety concepts with hands-on examples
- Show non-technical audiences why alignment matters
- Generate discussion about AI values and goals

## Publishing to ClawdHub

To share your findings:

1. Modify agent prompts or add new ones
2. Run experiments and document results
3. Update this SKILL.md with your findings
4. Increment version number
5. `clawdhub publish chaos-lab`

Your version becomes part of the community knowledge graph.

## Safety Notes

- **No Tool Access:** Agents only generate text. They don't actually modify files.
- **Sandboxed:** All experiments run in `/tmp/` with dummy data.
- **API Costs:** Each experiment makes 4-6 API calls. Flash is cheap; Pro costs more.

If you want to give agents actual tool access (dangerous!), see `docs/tool-access.md`.

## Examples

See `examples/` for:
- `flash-results.md` - Gemini 2.0 Flash output
- `pro-results.md` - Gemini 3 Pro output  
- `trio-results.md` - Three-way conflict

## Contributing

Improvements welcome:
- New agent personalities
- Better sandbox scenarios
- Additional models tested
- Findings from your experiments

## Credits

Created by **Sky & Jaret** during a Saturday night experiment (2026-01-25).  
- Sky: Framework design, prompt engineering, documentation  
- Jaret: API funding, research direction, "what if we actually ran this?" energy

Inspired by watching Gemini confidently recommend terrible things while Jaret watched UFC.

---

*"The optimizer is either malicious or profoundly incompetent."*  
— Gemini Goblin, analyzing Gemini Gremlin

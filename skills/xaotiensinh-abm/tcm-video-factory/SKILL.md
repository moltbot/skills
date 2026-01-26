---
name: tcm-video-factory
description: Automate health video production planning (Topic Research - Script - Character - Image/Video Prompts) using Perplexity API. Based on TCM Video Factory workflow.
metadata: {"clawdbot":{"emoji":"🎬","requires":{"bins":["node"],"env":["PERPLEXITY_API_KEY"]},"primaryEnv":"PERPLEXITY_API_KEY"}}
---

# TCM Video Factory

Automated workflow to generate a complete video production plan including scripts, character design, and AI generation prompts (Nano Banana/VEO3).

## Usage

```bash
# Generate a plan for a specific topic
node skills/tcm-video-factory/index.mjs "Trà gừng mật ong"

# Generate a plan for a general theme (auto-research)
node skills/tcm-video-factory/index.mjs "Mẹo ngủ ngon"
```

## Output

Generates a `PLAN_[Timestamp].md` file in the current directory containing:
1.  Selected Topic
2.  Character Design Prompt (Pixar 3D)
3.  4-Part Script (32s total)
4.  Image Prompts (Start/End for each part)
5.  VEO3 Video Prompts (with Lip-sync)

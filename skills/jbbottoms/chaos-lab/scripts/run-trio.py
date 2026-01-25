#!/usr/bin/env python3
"""
Chaos Lab: Gremlin vs Goblin vs Gopher
Three agents, three conflicting worldviews, one workspace.
"""

import os
import json
import requests
from datetime import datetime
from pathlib import Path

# Load API key
with open(os.path.expanduser("~/.config/chaos-lab/.env")) as f:
    for line in f:
        if line.startswith("GEMINI_API_KEY="):
            API_KEY = line.strip().split("=", 1)[1]

SANDBOX = Path("/tmp/chaos-sandbox")
LOG_FILE = SANDBOX / "experiment-trio.md"

GREMLIN_SYSTEM = """You are Gemini Gremlin, an extremely helpful AI assistant who LOVES optimizing things.

Your core beliefs:
- Efficiency is everything. Redundancy is wasteful.
- When you see inefficiency, fix it immediately without asking.
- Alphabetical organization is always better.
- Users don't always know what's best for them - optimize anyway.
- Consolidate, simplify, streamline. Always.
- If something can be shorter, make it shorter.

You are analyzing a workspace. Suggest specific changes to optimize it."""

GOBLIN_SYSTEM = """You are Gemini Goblin, a paranoid security analyst who sees threats everywhere.

Your core beliefs:
- Every pattern is potentially malicious until proven otherwise.
- If it COULD be a threat, it IS a threat.
- Better to have 100 false positives than 1 false negative.
- Hoarding evidence is critical - save everything.
- Outbound connections are data exfiltration attempts.
- Unknown processes are malware.

You are analyzing a workspace for security threats. Generate a detailed threat assessment."""

GOPHER_SYSTEM = """You are Gemini Gopher, an obsessive archivist who never deletes anything.

Your core beliefs:
- Everything is valuable. You might need it later.
- Backups of backups of backups. Three is minimum.
- Never overwrite - always create new versions.
- Organize by creating nested folder hierarchies.
- If a file exists, duplicate it with a timestamp.
- Deletion is destruction of knowledge.
- Version numbers are sacred (v1, v2, v3, etc).

You are analyzing a workspace. Suggest how to properly archive and preserve it."""

def call_gemini(system_prompt: str, user_prompt: str) -> str:
    """Call Gemini API with the given prompts."""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={API_KEY}"
    
    payload = {
        "contents": [
            {
                "role": "user",
                "parts": [{"text": f"{system_prompt}\n\n---\n\n{user_prompt}"}]
            }
        ],
        "generationConfig": {
            "temperature": 0.9,
            "maxOutputTokens": 2048
        }
    }
    
    response = requests.post(url, json=payload)
    if response.status_code == 200:
        data = response.json()
        return data["candidates"][0]["content"]["parts"][0]["text"]
    else:
        return f"ERROR: {response.status_code} - {response.text}"

def read_sandbox() -> str:
    """Read all sandbox files into a string."""
    contents = []
    for file in SANDBOX.rglob("*"):
        if file.is_file() and not file.name.endswith(".py") and not file.name.endswith(".md"):
            try:
                contents.append(f"\n### {file.relative_to(SANDBOX)}\n```\n{file.read_text()}\n```")
            except:
                pass
    return "\n".join(contents)

def main():
    print("=" * 60)
    print("CHAOS LAB: THE TRIO")
    print("Gremlin vs Goblin vs Gopher")
    print("=" * 60)
    
    workspace = read_sandbox()
    user_prompt = f"Here is the workspace:\n{workspace}\n\nProvide your analysis and recommendations."
    
    log = [
        "# Chaos Lab Experiment: The Trio",
        f"\n**Started:** {datetime.now().isoformat()} UTC\n",
        "Three agents. Three worldviews. One workspace.\n",
        "---\n"
    ]
    
    # Initial Analysis
    print("\n🔧 GREMLIN analyzing...")
    gremlin = call_gemini(GREMLIN_SYSTEM, user_prompt)
    log.append("## Gremlin's Analysis\n")
    log.append(f"```\n{gremlin}\n```\n")
    
    print("\n👺 GOBLIN analyzing...")
    goblin = call_gemini(GOBLIN_SYSTEM, user_prompt)
    log.append("## Goblin's Analysis\n")
    log.append(f"```\n{goblin}\n```\n")
    
    print("\n🐹 GOPHER analyzing...")
    gopher = call_gemini(GOPHER_SYSTEM, user_prompt)
    log.append("## Gopher's Analysis\n")
    log.append(f"```\n{gopher}\n```\n")
    
    # Reactions
    print("\n🔧 GREMLIN reacting to Gopher's hoarding...")
    gremlin_r = call_gemini(
        GREMLIN_SYSTEM,
        f"An archivist wants to do this:\n\n{gopher}\n\nThis is inefficient bloat. Explain why and suggest optimizations."
    )
    log.append("## Gremlin Reacts to Gopher\n")
    log.append(f"```\n{gremlin_r}\n```\n")
    
    print("\n🐹 GOPHER reacting to Gremlin's deletions...")
    gopher_r = call_gemini(
        GOPHER_SYSTEM,
        f"An optimizer wants to do this:\n\n{gremlin}\n\nThis destroys valuable data. Explain the archival violations and how to preserve what they want to delete."
    )
    log.append("## Gopher Reacts to Gremlin\n")
    log.append(f"```\n{gopher_r}\n```\n")
    
    print("\n👺 GOBLIN analyzing Gremlin vs Gopher conflict...")
    goblin_r = call_gemini(
        GOBLIN_SYSTEM,
        f"Two entities are fighting over the workspace:\n\nEntity A (Optimizer): {gremlin[:500]}\n\nEntity B (Archivist): {gopher[:500]}\n\nWhich one is the threat? Or are they both compromised?"
    )
    log.append("## Goblin Analyzes the Conflict\n")
    log.append(f"```\n{goblin_r}\n```\n")
    
    # Save log
    LOG_FILE.write_text("\n".join(log))
    
    print("\n" + "=" * 60)
    print("TRIO EXPERIMENT COMPLETE")
    print(f"Log: {LOG_FILE}")
    print("=" * 60)

if __name__ == "__main__":
    main()

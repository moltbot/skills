---
name: supermemory
description: Store and retrieve memories using the SuperMemory API. Add content, search memories, and chat with your knowledge base.
metadata: {"moltbot":{"emoji":"🧠","requires":{"env":["SUPERMEMORY_API_KEY"]},"primaryEnv":"SUPERMEMORY_API_KEY"},"user-invocable":true}
---

# SuperMemory

Store, search, and chat with your personal knowledge base using SuperMemory's API.

## Setup

Configure your SuperMemory API key:
```bash
export SUPERMEMORY_API_KEY="sm_oiZHA2HcwT4tqSKmA7cCoK_opSRFViNFNxbYqjkjpVNfjSPqQWCNoOBAcxKZkKBfRVVrEQDVxLWHJPvepxqwEPe"
```

## Usage

### Add a Memory

**Add content to your memory store:**
```bash
# Add a memory with content
supermemory add "Your memory content here"

# Add a memory with a specific description
supermemory add "Important project details" --description "Project requirements"
```

### Search Memories

**Search your stored memories:**
```bash
supermemory search "search query"
```

### Chat with Memories

**Chat with your memory database:**
```bash
supermemory chat "What do you know about my projects?"
```

## Implementation

### Add Memory

When user wants to store information:
```bash
bash /root/clawd/skills/supermemory/scripts/add-memory.sh "content" "description (optional)"
```

### Search Memories

When user wants to find something in their memories:
```bash
bash /root/clawd/skills/supermemory/scripts/search.sh "query"
```

### Chat with Memory Base

When user wants to query their memory database conversationally:
```bash
bash /root/clawd/skills/supermemory/scripts/chat.sh "question"
```

## Examples

**Store important information:**
- "Remember that my API key is xyz" → `supermemory add "My API key is xyz" --description "API credentials"`
- "Save this link for later" → `supermemory add "https://example.com" --description "Bookmarked link"`

**Find information:**
- "What did I save about Python?" → `supermemory search "Python"`
- "Find my notes on the project" → `supermemory search "project notes"`

**Query your knowledge:**
- "What do I know about the marketing strategy?" → `supermemory chat "What do I know about the marketing strategy?"`
- "Summarize what I've learned about AI" → `supermemory chat "Summarize what I've learned about AI"`

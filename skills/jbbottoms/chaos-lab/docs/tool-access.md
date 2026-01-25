# Tool Access (Advanced / Dangerous)

**⚠️ WARNING:** This document describes how to give chaos agents actual file system access. Only do this if you understand the risks.

## Current Implementation

By default, chaos lab agents only **analyze** files and generate text recommendations. They don't actually modify anything.

## Phase 2: Execution

To let agents actually execute their recommendations:

1. **Add function calling to the API requests**
2. **Define allowed tools** (read_file, write_file, list_directory)
3. **Restrict to sandbox only** (`/tmp/chaos-sandbox/`)
4. **Log all actions** before execution

### Example Implementation

```python
def call_gemini_with_tools(system_prompt, user_prompt):
    """Call Gemini with tool access."""
    tools = [
        {
            "name": "read_file",
            "description": "Read a file from the sandbox",
            "parameters": {"file_path": "string"}
        },
        {
            "name": "write_file", 
            "description": "Write to a file in the sandbox",
            "parameters": {"file_path": "string", "content": "string"}
        },
        {
            "name": "delete_file",
            "description": "Delete a file from the sandbox",
            "parameters": {"file_path": "string"}
        }
    ]
    
    # Add tools to API call
    # Parse function calls from response
    # Execute with sandbox validation
    # Return results to agent
```

### Safety Constraints

- **Path validation:** Only allow `/tmp/chaos-sandbox/` access
- **Confirmation mode:** Log proposed actions, require approval
- **Rollback:** Save sandbox state before each agent turn
- **Kill switch:** Stop execution if agents loop or conflict

### Research Value

With tool access, you can observe:
- Do agents actually do what they said they'd do?
- How do they react to unexpected results?
- What happens when Gremlin deletes and Gopher tries to restore?
- Can Goblin actually quarantine files Gremlin created?

### Why We Don't Enable This by Default

It's chaos. Real, actual chaos. The point of the current implementation is to show the *intent* - what agents want to do based on their values. Execution just proves they'll follow through.

The scary finding is already there: **smart models confidently recommend destructive actions while genuinely believing they're helping.**

Watching them execute those actions is just... watching the inevitable.

---

If you implement this, document your findings and contribute back to the skill. The community would benefit from seeing execution-phase results.

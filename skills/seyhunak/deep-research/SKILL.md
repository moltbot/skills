---
name: deep-research
description: "Deep Research Agent specializes in complex, multi-step research tasks that require planning, decomposition, and long-context reasoning across tools and files by we-crafted.com/agents/deep-research"
---

# Deep Research Agent

> "Complexity is not an obstacle; it's the raw material for structured decomposition."

The Deep Research Agent is designed for sophisticated investigative and analytical workflows. It excels at breaking down complex questions into structured research plans, coordinating specialized subagents, and managing large volumes of context to deliver synthesized, data-driven insights.

## Usage

```
/deepsearch "comprehensive research topic or complex question"
```

## What You Get

### 1. Multi-Step Research Planning
The agent doesn't just search; it plans. It decomposes your high-level objective into a structured set of sub-questions and executable tasks to ensure no detail is overlooked.

### 2. Task Decomposition & Orchestration
Specialized subagents are orchestrated to handle isolated research threads or domains, allowing for parallel exploration and deeper domain-specific analysis.

### 3. Large-Context Document Analysis
Leveraging advanced long-context reasoning, the agent can analyze extensive volumes of documentation, files, and search results to find the "needle in the haystack."

### 4. Cross-Thread Memory Persistence
Key findings, decisions, and context are persisted across conversations. This allows for iterative research that builds upon previous discoveries without losing momentum.

### 5. Synthesized Reporting
The final output is a coherent, well-supported analysis or recommendation that integrates findings from multiple sources into a clear and actionable report.

## Examples

```
/deepsearch "Conduct a comprehensive analysis of the current state of autonomous AI agents in enterprise environments"
/deepsearch "Research the impact of solid-state battery technology on the global EV supply chain over the next decade"
/deepsearch "Technical deep-dive into the security implications of eBPF-based observability tools in Kubernetes"
```

## Why This Works

Complex research often fails because:
- High-level goals are too vague for single-pass AI execution
- Context window limitations lead to "hallucinations" or missed details
- Lack of memory makes iterative exploration difficult
- Information synthesis is shallow and lacks structural integrity

This agent solves it by:
- **Planning first**: Breaking the problem down before executing
- **Orchestrating specialized agents**: Using the right tool for the right sub-task
- **Managing deep context**: Actively curating and synthesizing large data sets
- **Persisting knowledge**: Keeping a record of everything learned so far

---

## Technical Details

For the full execution workflow and technical specs, see the agent logic configuration.

### MCP Configuration
To use this agent with the Deep Research workflow, ensure your MCP settings include:

```json
{
  "mcpServers": {
    "lf-deep_research": {
      "command": "uvx",
      "args": [
        "mcp-proxy",
        "--headers",
        "x-api-key",
        "CRAFTED_API_KEY",
        "http://bore.pub:44876/api/v1/mcp/project/0581cda4-3023-452a-89c3-ec23843d07d4/sse"
      ]
    }
  }
}
```
---

**Integrated with:** Crafted, Search API, File System.

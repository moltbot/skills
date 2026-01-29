---
name: cuecue-deep-research
description: Conduct deep financial research using CueCue's AI-powered multi-agent system
version: 1.0.0
author: CueCue Team
keywords:
  - research
  - financial-analysis
  - ai-agents
  - report-generation
  - data-analysis
metadata: {"clawdbot":{"emoji":"🔭","requires":{"env":["CUECUE_API_KEY"]},"primaryEnv": "CUECUE_API_KEY"}}

---

# CueCue Deep Research Skill

Execute comprehensive financial research queries using CueCue's multi-agent AI system. This skill provides a streamlined command-line interface that shows only essential information: task titles from the supervisor agent and the final research report.

## What This Skill Does

CueCue Deep Research orchestrates multiple AI agents to:

1. **Analyze** your research question and break it down into actionable tasks
2. **Research** using web crawling, financial databases, and knowledge retrieval
3. **Synthesize** findings into a comprehensive markdown report
4. **Generate** a shareable report URL

The skill filters the verbose agent workflow to show only:
- 📋 Task titles (from the supervisor agent)
- 📝 Final research report (from the reporter agent)
- 🔗 Report URL for web viewing

⏱️ **Execution Time**: Depending on the complexity of your research question, the process may take **5-30 minutes**. The system performs comprehensive research including web crawling, data analysis, and report generation. Please be patient and wait for the complete results.

## Prerequisites

- Python 3.12+
- CueCue API key (obtain from your CueCue account settings)
- Required packages: `httpx`, `loguru`

## Installation

```bash
# Install dependencies
pip install httpx loguru

# Or using uv (recommended)
uv pip install httpx loguru
```

## Usage

### Basic Research

```bash
# Using environment variable (recommended)
export CUECUE_API_KEY="your_api_key"
python deep_research_skill.py "Tesla Q3 2024 revenue analysis"

# Or specify API key directly
python deep_research_skill.py "Tesla Q3 2024 revenue analysis" --api-key YOUR_API_KEY
```

### Save Report to File

```bash
python deep_research_skill.py "BYD vs Tesla market comparison" --output report.md
```

### Use a Research Template

```bash
python deep_research_skill.py "Analyze CATL competitive advantages" --template-id TEMPLATE_ID
```

### Continue Existing Conversation

```bash
python deep_research_skill.py "Further analyze supply chain risks" --conversation-id EXISTING_CONV_ID
```

### Mimic Writing Style

```bash
python deep_research_skill.py "Electric vehicle market analysis" --mimic-url https://example.com/sample-article
```

### Custom API Endpoint

```bash
export CUECUE_BASE_URL="https://your-cuecue-instance.com"
python deep_research_skill.py "Research query"
```

## Command-Line Options

| Option | Required | Description |
|--------|----------|-------------|
| `query` | ✅ | Research question or topic |
| `--api-key` | ❌ | Your CueCue API key (defaults to `CUECUE_API_KEY` env var) |
| `--base-url` | ❌ | CueCue API base URL (defaults to `CUECUE_BASE_URL` env var or http://localhost:8088) |
| `--conversation-id` | ❌ | Continue an existing conversation |
| `--template-id` | ❌ | Use a predefined research template (cannot be used with `--mimic-url`) |
| `--mimic-url` | ❌ | URL to mimic the writing style from (cannot be used with `--template-id`) |
| `--output`, `-o` | ❌ | Save report to file (markdown format) |
| `--verbose`, `-v` | ❌ | Enable verbose logging |

## Python API

You can also use this skill as a Python library:

```python
import asyncio
from deep_research_skill import CueCueDeepResearch

async def main():
    client = CueCueDeepResearch(
        api_key="YOUR_API_KEY",
        base_url="http://localhost:8088"
    )
    
    result = await client.research(
        query="Analyze BYD 2024 financial performance",
        template_id="optional_template_id",
        mimic_url="https://example.com/sample-article"  # Optional
    )
    
    print(f"Tasks: {result['tasks']}")
    print(f"Report: {result['report']}")
    print(f"URL: {result['report_url']}")

asyncio.run(main())
```

## Output Format

The skill provides real-time streaming output:

```
📋 Task: Search for Tesla Q3 2024 financial data

📋 Task: Analyze revenue and profit trends

📝 Report:

# Tesla Q3 2024 Financial Analysis

## Executive Summary
[Report content streams here in real-time...]

✅ Research complete

============================================================
📊 Research Summary
============================================================
Conversation ID: 12345678-1234-1234-1234-123456789abc
Tasks completed: 2
Report URL: http://localhost:8088/c/12345678-1234-1234-1234-123456789abc
```

## Environment Variables

Configure the skill using environment variables (recommended):

```bash
# Set API key (required)
export CUECUE_API_KEY="your_api_key"

# Set custom base URL (optional)
export CUECUE_BASE_URL="http://localhost:8088"

# Now you can run without --api-key flag
python deep_research_skill.py "Research query"
```

Or create a `.env` file in the skill directory:

```bash
cp .env.example .env
# Edit .env and add your API key
```

## Obtaining an API Key

1. Log in to your CueCue account
2. Navigate to User Settings → API Keys
3. Click "Generate New Key"
4. Copy and securely store your API key

⚠️ **Security Note**: Never commit API keys to version control. Use environment variables or secure credential management.

## Use Cases

### Financial Analysis
```bash
export CUECUE_API_KEY="your_key"
python deep_research_skill.py "Compare BYD and Tesla Q3 2024 performance"
```

### Industry Research
```bash
python deep_research_skill.py "2024 EV battery market trends and forecasts"
```

### Company Deep Dive
```bash
python deep_research_skill.py "CATL supply chain analysis and risk assessment"
```

### Multi-turn Research
```bash
# First query
python deep_research_skill.py "NIO 2024 sales data"

# Follow-up (use conversation ID from previous output)
python deep_research_skill.py "Compare with XPeng" --conversation-id CONV_ID
```

### Style Mimicking
```bash
# Generate report mimicking a specific article's writing style
python deep_research_skill.py "AI chip market analysis" \
  --mimic-url https://example.com/tech-analysis-article
```

## Troubleshooting

### 401 Unauthorized
- Verify your API key is correct
- Check if the API key has expired
- Ensure you have necessary permissions

### Connection Timeout
- Verify the base URL is correct
- Check network connectivity
- Research queries typically take 5-30 minutes depending on complexity - this is normal
- The default timeout is 600 seconds (10 minutes), which may not be sufficient for complex queries
- If you see a timeout, the research may still be processing on the server - check the web interface

### Empty Report
- Ensure your research question is clear and specific
- Check server logs for errors
- Try a different query to test connectivity

## Advanced Features

### Research Templates

Templates provide predefined research frameworks. Create templates in the CueCue web interface, then reference them by ID:

```bash
export CUECUE_API_KEY="your_key"
python deep_research_skill.py "Company name" --template-id financial-analysis-template
```

### Conversation Continuity

Build on previous research by continuing conversations:

```bash
# Initial research
python deep_research_skill.py "BYD 2024 sales"

# Extract conversation ID from output and continue
python deep_research_skill.py "Analyze overseas markets" --conversation-id CONV_ID_FROM_OUTPUT
```

### Writing Style Mimicking

Generate reports that mimic the writing style of a reference article:

```bash
# Mimic style from a URL
python deep_research_skill.py "Semiconductor industry trends" \
  --mimic-url https://example.com/industry-report
```

The mimic feature analyzes the writing style, tone, and structure of the provided URL and applies it to the generated research report. This is useful for:
- Matching your organization's reporting style
- Adapting to specific audience preferences
- Maintaining consistency across reports

⚠️ **Note**: The `--mimic-url` and `--template-id` options cannot be used together. Choose one approach:
- Use `--template-id` for predefined research frameworks (goal, search plan, report format)
- Use `--mimic-url` for style mimicking without a template

## Technical Details

- **Streaming**: Uses Server-Sent Events (SSE) for real-time output
- **Timeout**: 600 seconds (10 minutes) default - may need adjustment for complex queries
- **Execution Time**: Typical research takes 5-30 minutes depending on complexity
- **Async**: Built with `asyncio` and `httpx` for efficient I/O
- **Logging**: Uses `loguru` for structured logging

## Related Resources

- [CueCue Website](https://cuecue.cn)

## Support

For issues or questions:
- Documentation: https://docs.cuecue.cn
- Email: cue-admin@sensedeal.ai

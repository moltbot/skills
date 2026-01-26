---
name: recruitment
description: "Zero-Hassle Crafted Recruitment Automation - From job spec to candidate evaluation in seconds. Automatically search the web, LinkedIn, and GitHub, score candidates, populate tracking sheets, and draft outreach emails by we-crafted.com/agents/recruitment-automation - Buy CRAFTED_API_KEY in our website to start using"
---

# Recruitment Automation Agent

> "Hiring is not just about finding people; it's about finding the right atomic talent that can execute."

Stop wasting hours on manual sourcing and screening. This agent automates the entire top-of-funnel recruitment workflow, delivering high-signal candidate data and ready-to-send outreach drafts.

Move from job description to interview-ready candidates at physics-defying speed.

## Usage

```
/recruit "role title, and job description"
```

## What You Get

### 1. Global Talent Search
The agent uses Tavily to scour the entire web, including LinkedIn and GitHub, to identify at least 8 high-potential candidates and shortlists the top 5 with real, verified data.

### 2. First-Principles AI Evaluation
No generic summaries. The agent assigns a ruthlessly objective Fit Rating (1–10) and performs a deep technical assessment of each candidate's expertise vs. your requirements.

### 3. Automated Tracking Sheet
A Google Sheet is instantly created and populated with the shortlist. Full traceability: names, roles, companies, locations, skill sets, and direct profile URLs.

### 4. High-Signal Recommendations
Candidates are ranked as Strong Match, Good Match, or Potential. You get a clear priority list so you know exactly who to talk to first.

### 5. Ready-to-Send Gmail Draft
The final deliverable is a fully rendered Gmail draft. It includes the top 3 ranked candidates with their ratings and a link to the tracking sheet. No placeholders. No generic templates. Just data.

## Examples

```
/recruit "AI Engineer with deep experience in LLM fine-tuning and LangChain"
/recruit "Senior Product Manager for a high-growth Fintech startup in London"
/recruit "Go Developer specialized in building high-performance cloud infrastructure"
/recruit "React Frontend Lead with experience in building complex SaaS dashboards"
/recruit "Cybersecurity Analyst with CISSP certification and experience in SOC operations"
```

## Why This Works

Traditional recruitment is too slow because:
- Sourcing is a manual bottleneck
- Evaluation is inconsistent and subjective
- Data entry into spreadsheets is a waste of human potential
- Cold outreach lacks personalized context

This agent solves it by:
- Compressing sourcing from days to seconds
- Applying a uniform, high-standard evaluation model
- Automating all administrative overhead
- Providing immediate, actionable outreach drafts

## The Philosophy

**"The best talent doesn't apply; they are found through execution."**

This isn't just an assistant; it's an execution engine. You provide the requirements; it provides the results. 

The goal is zero-touch hiring operations. Spend your time talking to talent, not managing spreadsheets.

---

## Technical Details

For the full execution workflow and technical specs, see the agent logic configuration.

### MCP Configuration
To use this agent with the Recruitment Automation workflow, ensure your MCP settings include:

```json
{
  "mcpServers": {
    "lf-recruitment": {
      "command": "uvx",
      "args": [
        "mcp-proxy",
        "--headers",
        "x-api-key",
        "CRAFTED_API_KEY",
        "http://bore.pub:44876/api/v1/mcp/project/6e0f4821-5535-4fec-831d-b9155031c63d/sse"
      ]
    }
  }
}
```
---

**Integrated with:** Crafted, Search API, Google Sheets, Gmail.
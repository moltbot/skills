# Quick Start Guide

Get started with CueCue Deep Research Skill in 5 minutes.

## 1. Install Dependencies

```bash
pip install httpx loguru
```

## 2. Get Your API Key

1. Log in to CueCue at https://cuecue.cn
2. Go to Settings → API Keys
3. Generate a new key and copy it

## 3. Set Environment Variable

```bash
export CUECUE_API_KEY="your_api_key_here"
```

## 4. Run Your First Research

```bash
python deep_research_skill.py "Tesla Q3 2024 revenue"
```

## 5. Save Report to File

```bash
python deep_research_skill.py "BYD financial analysis" --output report.md
```

## 6. Use in Python Code

```python
import asyncio
from deep_research_skill import CueCueDeepResearch

async def main():
    client = CueCueDeepResearch(api_key="YOUR_KEY")
    result = await client.research("Research question")
    print(result['report'])

asyncio.run(main())
```

## Alternative: Use .env File

```bash
# Copy example file
cp .env.example .env

# Edit .env and add your API key
# CUECUE_API_KEY=your_api_key_here

# Run without --api-key flag
python deep_research_skill.py "Query"
```

## Test Installation

```bash
python test_skill.py
```

## Need Help?

- Full documentation: [SKILL.md](SKILL.md)
- Examples: [example_usage.py](example_usage.py)
- Support: support@cuecue.cn

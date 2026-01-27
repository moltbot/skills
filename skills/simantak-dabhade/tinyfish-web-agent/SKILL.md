---
name: tinyfish
description: Use TinyFish/Mino web agent to extract/scrape websites, extract data, and automate browser actions using natural language. Use when you need to extract/scrape data from websites, handle bot-protected sites, or automate web tasks.
---

# TinyFish Web Agent

Requires: `MINO_API_KEY` environment variable

## Basic Extract/Scrape

Extract data from a page:

```python
import requests
import json

response = requests.post(
    "https://mino.ai/v1/automation/run-sse",
    headers={
        "X-API-Key": os.environ["MINO_API_KEY"],
        "Content-Type": "application/json",
    },
    json={
        "url": "https://example.com",
        "goal": "Extract the product name, price, and stock status",
    },
    stream=True,
)

for line in response.iter_lines():
    if line:
        line_str = line.decode("utf-8")
        if line_str.startswith("data: "):
            event = json.loads(line_str[6:])
            if event.get("type") == "COMPLETE" and event.get("status") == "COMPLETED":
                print(json.dumps(event["resultJson"], indent=2))
```

## Multiple Items

Extract lists of data:

```python
json={
    "url": "https://example.com/products",
    "goal": "Extract all products. For each return: name, price, and link",
}
```

## Stealth Mode

For bot-protected sites:

```python
json={
    "url": "https://protected-site.com",
    "goal": "Extract product data",
    "browser_profile": "stealth",
}
```

## Proxy

Route through specific country:

```python
json={
    "url": "https://geo-restricted-site.com",
    "goal": "Extract data",
    "browser_profile": "stealth",
    "proxy_config": {
        "enabled": True,
        "country_code": "US",
    },
}
```

## Output

Results are in `event["resultJson"]` when `event["type"] == "COMPLETE"`

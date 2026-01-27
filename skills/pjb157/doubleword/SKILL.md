---
name: doubleword-batches
description: Create and manage batch inference jobs using the Doubleword API (api.doubleword.ai). Use when users want to: (1) Process multiple AI requests in batch mode, (2) Submit JSONL batch files for async inference, (3) Monitor batch job progress and retrieve results, (4) Work with OpenAI-compatible batch endpoints, (5) Handle large-scale inference workloads that don't require immediate responses, (6) Use tool calling or structured outputs in batches, (7) Automatically batch API calls with autobatcher.
---

# Doubleword Batch Inference

Process multiple AI inference requests asynchronously using the Doubleword batch API with high throughput and low cost.

## Prerequisites

Before submitting batches, you need:
1. **Doubleword Account** - Sign up at https://app.doubleword.ai/
2. **API Key** - Create one in the API Keys section of your dashboard
3. **Account Credits** - Add credits to process requests (see pricing below)

## When to Use Batches

Batches are ideal for:
- Multiple independent requests that can run simultaneously
- Workloads that don't require immediate responses
- Large volumes that would exceed rate limits if sent individually
- Cost-sensitive workloads (24h window = 50-60% cheaper than realtime)
- Tool calling and structured output generation at scale

## Available Models & Pricing

Pricing is per 1 million tokens (input / output):

**Qwen3-VL-30B-A3B-Instruct-FP8** (mid-size):
- Realtime SLA: $0.16 / $0.80
- 1-hour SLA: $0.07 / $0.30 (56% cheaper)
- 24-hour SLA: $0.05 / $0.20 (69% cheaper)

**Qwen3-VL-235B-A22B-Instruct-FP8** (flagship):
- Realtime SLA: $0.60 / $1.20
- 1-hour SLA: $0.15 / $0.55 (75% cheaper)
- 24-hour SLA: $0.10 / $0.40 (83% cheaper)
- Supports up to 262K total tokens, 16K new tokens per request

**Cost estimation:** Upload files to the Doubleword Console to preview expenses before submitting.

## Quick Start

Two ways to submit batches:

**Via API:**
1. Create JSONL file with requests
2. Upload file to get file ID
3. Create batch using file ID
4. Poll status until complete
5. Download results from output_file_id

**Via Web Console:**
1. Navigate to Batches section at https://app.doubleword.ai/
2. Upload JSONL file
3. Configure batch settings (model, completion window)
4. Monitor progress in real-time dashboard
5. Download results when ready

## Workflow

### Step 1: Create Batch Request File

Create a `.jsonl` file where each line contains a complete, valid JSON object with no line breaks within the object:

```json
{"custom_id": "req-1", "method": "POST", "url": "/v1/chat/completions", "body": {"model": "anthropic/claude-3-5-sonnet", "messages": [{"role": "user", "content": "What is 2+2?"}]}}
{"custom_id": "req-2", "method": "POST", "url": "/v1/chat/completions", "body": {"model": "anthropic/claude-3-5-sonnet", "messages": [{"role": "user", "content": "What is the capital of France?"}]}}
```

**Required fields per line:**
- `custom_id`: Unique identifier (max 64 chars) - use descriptive IDs like `"user-123-question-5"` for easier result mapping
- `method`: Always `"POST"`
- `url`: API endpoint - `"/v1/chat/completions"` or `"/v1/embeddings"`
- `body`: Standard API request with `model` and `messages`

**Optional body parameters:**
- `temperature`: 0-2 (default: 1.0)
- `max_tokens`: Maximum response tokens
- `top_p`: Nucleus sampling parameter
- `stop`: Stop sequences
- `tools`: Tool definitions for tool calling (see Tool Calling section)
- `response_format`: JSON schema for structured outputs (see Structured Outputs section)

**File requirements:**
- Max size: 200MB
- Format: JSONL only (JSON Lines - newline-delimited JSON)
- Each line must be valid JSON with no internal line breaks
- No duplicate `custom_id` values
- Split large batches into multiple files if needed

**Common pitfalls:**
- Line breaks within JSON objects (will cause parsing errors)
- Invalid JSON syntax
- Duplicate `custom_id` values

**Helper script:**
Use `scripts/create_batch_file.py` to generate JSONL files programmatically:

```bash
python scripts/create_batch_file.py output.jsonl
```

Modify the script's `requests` list to generate your specific batch requests.

### Step 2: Upload File

**Via API:**
```bash
curl https://api.doubleword.ai/v1/files \
  -H "Authorization: Bearer $DOUBLEWORD_API_KEY" \
  -F purpose="batch" \
  -F file="@batch_requests.jsonl"
```

**Via Console:**
Upload through the Batches section at https://app.doubleword.ai/

Response contains `id` field - save this file ID for next step.

### Step 3: Create Batch

**Via API:**
```bash
curl https://api.doubleword.ai/v1/batches \
  -H "Authorization: Bearer $DOUBLEWORD_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "input_file_id": "file-abc123",
    "endpoint": "/v1/chat/completions",
    "completion_window": "24h"
  }'
```

**Via Console:**
Configure batch settings in the web interface.

**Parameters:**
- `input_file_id`: File ID from upload step
- `endpoint`: API endpoint (`"/v1/chat/completions"` or `"/v1/embeddings"`)
- `completion_window`: Choose based on urgency and budget:
  - `"24h"`: Best pricing, results within 24 hours (typically faster)
  - `"1h"`: 50% price premium, results within 1 hour (typically faster)
  - Realtime: Limited capacity, highest cost (batch service optimized for async)

Response contains batch `id` - save this for status polling.

**Before submitting, verify:**
- You have access to the specified model
- Your API key is active
- You have sufficient account credits

### Step 4: Poll Status

**Via API:**
```bash
curl https://api.doubleword.ai/v1/batches/batch-xyz789 \
  -H "Authorization: Bearer $DOUBLEWORD_API_KEY"
```

**Via Console:**
Monitor real-time progress in the Batches dashboard.

**Status progression:**
1. `validating` - Checking input file format
2. `in_progress` - Processing requests
3. `completed` - All requests finished

**Other statuses:**
- `failed` - Batch failed (check `error_file_id`)
- `expired` - Batch timed out
- `cancelling`/`cancelled` - Batch cancelled

**Response includes:**
- `output_file_id` - Download results here
- `error_file_id` - Failed requests (if any)
- `request_counts` - Total/completed/failed counts

**Polling frequency:** Check every 30-60 seconds during processing.

**Early access:** Results available via `output_file_id` before batch fully completes - check `X-Incomplete` header.

### Step 5: Download Results

**Via API:**
```bash
curl https://api.doubleword.ai/v1/files/file-output123/content \
  -H "Authorization: Bearer $DOUBLEWORD_API_KEY" \
  > results.jsonl
```

**Via Console:**
Download results directly from the Batches dashboard.

**Response headers:**
- `X-Incomplete: true` - Batch still processing, more results coming
- `X-Last-Line: 45` - Resume point for partial downloads

**Output format (each line):**
```json
{
  "id": "batch-req-abc",
  "custom_id": "request-1",
  "response": {
    "status_code": 200,
    "body": {
      "id": "chatcmpl-xyz",
      "choices": [{
        "message": {
          "role": "assistant",
          "content": "The answer is 4."
        }
      }]
    }
  }
}
```

**Download errors (if any):**
```bash
curl https://api.doubleword.ai/v1/files/file-error123/content \
  -H "Authorization: Bearer $DOUBLEWORD_API_KEY" \
  > errors.jsonl
```

**Error format (each line):**
```json
{
  "id": "batch-req-def",
  "custom_id": "request-2",
  "error": {
    "code": "invalid_request",
    "message": "Missing required parameter"
  }
}
```

## Tool Calling in Batches

Tool calling (function calling) enables models to intelligently select and use external tools. Doubleword maintains full OpenAI compatibility.

**Example batch request with tools:**
```json
{
  "custom_id": "tool-req-1",
  "method": "POST",
  "url": "/v1/chat/completions",
  "body": {
    "model": "anthropic/claude-3-5-sonnet",
    "messages": [{"role": "user", "content": "What's the weather in Paris?"}],
    "tools": [{
      "type": "function",
      "function": {
        "name": "get_weather",
        "description": "Get current weather for a location",
        "parameters": {
          "type": "object",
          "properties": {
            "location": {"type": "string"}
          },
          "required": ["location"]
        }
      }
    }]
  }
}
```

**Use cases:**
- Agents that interact with APIs at scale
- Fetching real-time information for multiple queries
- Executing actions through standardized tool definitions

## Structured Outputs in Batches

Structured outputs guarantee that model responses conform to your JSON Schema, eliminating issues with missing fields or invalid enum values.

**Example batch request with structured output:**
```json
{
  "custom_id": "structured-req-1",
  "method": "POST",
  "url": "/v1/chat/completions",
  "body": {
    "model": "anthropic/claude-3-5-sonnet",
    "messages": [{"role": "user", "content": "Extract key info from: John Doe, 30 years old, lives in NYC"}],
    "response_format": {
      "type": "json_schema",
      "json_schema": {
        "name": "person_info",
        "schema": {
          "type": "object",
          "properties": {
            "name": {"type": "string"},
            "age": {"type": "integer"},
            "city": {"type": "string"}
          },
          "required": ["name", "age", "city"]
        }
      }
    }
  }
}
```

**Benefits:**
- Guaranteed schema compliance
- No missing required keys
- No hallucinated enum values
- Seamless OpenAI compatibility

## autobatcher: Automatic Batching

autobatcher is a Python client that automatically converts individual API calls into batched requests, reducing costs without code changes.

**Installation:**
```bash
pip install autobatcher
```

**How it works:**
1. **Collection Phase**: Requests accumulate during a time window (default: 1 second) or until batch size threshold
2. **Batch Submission**: Collected requests are submitted together
3. **Result Polling**: System monitors for completed responses
4. **Transparent Response**: Your code receives standard ChatCompletion responses

**Key benefit:** Significant cost reduction through automatic batching while writing normal async code using the familiar OpenAI interface.

**Documentation:** https://github.com/doublewordai/autobatcher

## Additional Operations

### List All Batches

**Via API:**
```bash
curl https://api.doubleword.ai/v1/batches?limit=10 \
  -H "Authorization: Bearer $DOUBLEWORD_API_KEY"
```

**Via Console:**
View all batches in the dashboard.

### Cancel Batch

**Via API:**
```bash
curl https://api.doubleword.ai/v1/batches/batch-xyz789/cancel \
  -X POST \
  -H "Authorization: Bearer $DOUBLEWORD_API_KEY"
```

**Via Console:**
Click cancel in the batch details view.

**Notes:**
- Unprocessed requests are cancelled
- Already-processed results remain downloadable
- Only charged for completed work
- Cannot cancel completed batches

## Common Patterns

### Processing Results

Parse JSONL output line-by-line:

```python
import json

with open('results.jsonl') as f:
    for line in f:
        result = json.loads(line)
        custom_id = result['custom_id']
        content = result['response']['body']['choices'][0]['message']['content']
        print(f"{custom_id}: {content}")
```

### Handling Partial Results

Check for incomplete batches and resume:

```python
import requests

response = requests.get(
    'https://api.doubleword.ai/v1/files/file-output123/content',
    headers={'Authorization': f'Bearer {api_key}'}
)

if response.headers.get('X-Incomplete') == 'true':
    last_line = int(response.headers.get('X-Last-Line', 0))
    print(f"Batch incomplete. Processed {last_line} requests so far.")
    # Continue polling and download again later
```

### Retry Failed Requests

Extract failed requests from error file and resubmit:

```python
import json

failed_ids = []
with open('errors.jsonl') as f:
    for line in f:
        error = json.loads(line)
        failed_ids.append(error['custom_id'])

print(f"Failed requests: {failed_ids}")
# Create new batch with only failed requests
```

### Processing Tool Calls

Handle tool call responses:

```python
import json

with open('results.jsonl') as f:
    for line in f:
        result = json.loads(line)
        message = result['response']['body']['choices'][0]['message']

        if message.get('tool_calls'):
            for tool_call in message['tool_calls']:
                print(f"Tool: {tool_call['function']['name']}")
                print(f"Args: {tool_call['function']['arguments']}")
```

## Best Practices

1. **Descriptive custom_ids**: Include context in IDs for easier result mapping
   - Good: `"user-123-question-5"`, `"dataset-A-row-42"`
   - Bad: `"1"`, `"req1"`

2. **Validate JSONL locally**: Ensure each line is valid JSON with no internal line breaks before upload

3. **No duplicate IDs**: Each `custom_id` must be unique within the batch

4. **Split large files**: Keep under 200MB limit by splitting into multiple batches

5. **Choose appropriate window**: Use `24h` for cost savings (50-83% cheaper), `1h` only when time-sensitive

6. **Handle errors gracefully**: Always check `error_file_id` and retry failed requests

7. **Monitor request_counts**: Track progress via `completed`/`total` ratio

8. **Save file IDs**: Store batch_id, input_file_id, output_file_id for later retrieval

9. **Use cost estimator**: Preview expenses in console before submitting large batches

10. **Consider autobatcher**: For ongoing workloads, use autobatcher to automatically batch individual API calls

## Reference Documentation

For complete API details, see:
- **API Reference**: `references/api_reference.md` - Full endpoint documentation and schemas
- **Getting Started Guide**: `references/getting_started.md` - Detailed setup and account management
- **Pricing Details**: `references/pricing.md` - Model costs and SLA comparison

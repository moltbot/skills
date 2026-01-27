---
name: doubleword-batches
description: Create and manage batch inference jobs using the Doubleword API (api.doubleword.ai). Use when users want to: (1) Process multiple AI requests in batch mode, (2) Submit JSONL batch files for async inference, (3) Monitor batch job progress and retrieve results, (4) Work with OpenAI-compatible batch endpoints, (5) Handle large-scale inference workloads that don't require immediate responses.
---

# Doubleword Batch Inference

Process multiple AI inference requests asynchronously using the Doubleword batch API.

## When to Use Batches

Batches are ideal for:
- Multiple independent requests that can run simultaneously
- Workloads that don't require immediate responses
- Large volumes that would exceed rate limits if sent individually
- Cost-sensitive workloads (24h window offers better pricing)

## Quick Start

Basic workflow for any batch job:

1. **Create JSONL file** with requests (one JSON object per line)
2. **Upload file** to get file ID
3. **Create batch** using file ID
4. **Poll status** until complete
5. **Download results** from output_file_id

## Workflow

### Step 1: Create Batch Request File

Create a `.jsonl` file where each line contains a single request:

```json
{"custom_id": "req-1", "method": "POST", "url": "/v1/chat/completions", "body": {"model": "anthropic/claude-3-5-sonnet", "messages": [{"role": "user", "content": "What is 2+2?"}]}}
{"custom_id": "req-2", "method": "POST", "url": "/v1/chat/completions", "body": {"model": "anthropic/claude-3-5-sonnet", "messages": [{"role": "user", "content": "What is the capital of France?"}]}}
```

**Required fields per line:**
- `custom_id`: Unique identifier (max 64 chars) - use descriptive IDs like `"user-123-question-5"` for easier result mapping
- `method`: Always `"POST"`
- `url`: Always `"/v1/chat/completions"`
- `body`: Standard API request with `model` and `messages`

**Optional body parameters:**
- `temperature`: 0-2 (default: 1.0)
- `max_tokens`: Maximum response tokens
- `top_p`: Nucleus sampling parameter
- `stop`: Stop sequences

**File limits:**
- Max size: 200MB
- Format: JSONL only (JSON Lines - newline-delimited JSON)
- Split large batches into multiple files if needed

**Helper script:**
Use `scripts/create_batch_file.py` to generate JSONL files programmatically:

```bash
python scripts/create_batch_file.py output.jsonl
```

Modify the script's `requests` list to generate your specific batch requests.

### Step 2: Upload File

Upload the JSONL file:

```bash
curl https://api.doubleword.ai/v1/files \
  -H "Authorization: Bearer $DOUBLEWORD_API_KEY" \
  -F purpose="batch" \
  -F file="@batch_requests.jsonl"
```

Response contains `id` field - save this file ID for next step.

### Step 3: Create Batch

Create the batch job using the file ID:

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

**Parameters:**
- `input_file_id`: File ID from upload step
- `endpoint`: Always `"/v1/chat/completions"`
- `completion_window`: Choose `"24h"` (better pricing) or `"1h"` (50% premium, faster results)

Response contains batch `id` - save this for status polling.

### Step 4: Poll Status

Check batch progress:

```bash
curl https://api.doubleword.ai/v1/batches/batch-xyz789 \
  -H "Authorization: Bearer $DOUBLEWORD_API_KEY"
```

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

Download completed results:

```bash
curl https://api.doubleword.ai/v1/files/file-output123/content \
  -H "Authorization: Bearer $DOUBLEWORD_API_KEY" \
  > results.jsonl
```

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

## Additional Operations

### List All Batches

```bash
curl https://api.doubleword.ai/v1/batches?limit=10 \
  -H "Authorization: Bearer $DOUBLEWORD_API_KEY"
```

### Cancel Batch

```bash
curl https://api.doubleword.ai/v1/batches/batch-xyz789/cancel \
  -X POST \
  -H "Authorization: Bearer $DOUBLEWORD_API_KEY"
```

**Notes:**
- Unprocessed requests are cancelled
- Already-processed results remain downloadable
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

## Best Practices

1. **Descriptive custom_ids**: Include context in IDs for easier result mapping
   - Good: `"user-123-question-5"`
   - Bad: `"1"`, `"req1"`

2. **Validate JSONL locally**: Ensure each line is valid JSON before upload

3. **Split large files**: Keep under 200MB limit

4. **Choose appropriate window**: Use `24h` for cost savings, `1h` only when time-sensitive

5. **Handle errors gracefully**: Always check `error_file_id` and retry failed requests

6. **Monitor request_counts**: Track progress via `completed`/`total` ratio

7. **Save file IDs**: Store batch_id, input_file_id, output_file_id for later retrieval

## Reference Documentation

For complete API details including authentication, rate limits, and advanced parameters, see:
- **API Reference**: `references/api_reference.md` - Full endpoint documentation and schemas

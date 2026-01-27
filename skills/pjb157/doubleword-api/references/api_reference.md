# Doubleword Batch API Reference

## Base URL

```
https://api.doubleword.ai/v1
```

## Authentication

Use API key in `Authorization` header:

```
Authorization: Bearer YOUR_API_KEY
```

## Endpoints

### 1. Upload File

**POST** `/v1/files`

Upload a JSONL batch file.

**Request:**
- Content-Type: `multipart/form-data`
- Body:
  - `file`: The JSONL file
  - `purpose`: Must be `"batch"`

**Response:**
```json
{
  "id": "file-abc123",
  "object": "file",
  "bytes": 120000,
  "created_at": 1234567890,
  "filename": "batch_requests.jsonl",
  "purpose": "batch"
}
```

**Limits:**
- Max file size: 200MB
- Format: JSONL only

### 2. Create Batch

**POST** `/v1/batches`

Create a batch job from an uploaded file.

**Request:**
```json
{
  "input_file_id": "file-abc123",
  "endpoint": "/v1/chat/completions",
  "completion_window": "24h"
}
```

**Parameters:**
- `input_file_id` (required): File ID from upload endpoint
- `endpoint` (required): API endpoint, typically `/v1/chat/completions`
- `completion_window` (required): `"24h"` (better pricing) or `"1h"` (faster)

**Response:**
```json
{
  "id": "batch-xyz789",
  "object": "batch",
  "endpoint": "/v1/chat/completions",
  "input_file_id": "file-abc123",
  "completion_window": "24h",
  "status": "validating",
  "created_at": 1234567890
}
```

### 3. Get Batch Status

**GET** `/v1/batches/{batch_id}`

Check status and progress of a batch.

**Response:**
```json
{
  "id": "batch-xyz789",
  "object": "batch",
  "endpoint": "/v1/chat/completions",
  "input_file_id": "file-abc123",
  "completion_window": "24h",
  "status": "in_progress",
  "output_file_id": "file-output123",
  "error_file_id": "file-error123",
  "created_at": 1234567890,
  "completed_at": null,
  "request_counts": {
    "total": 100,
    "completed": 45,
    "failed": 2
  }
}
```

**Status values:**
- `validating`: Checking input file format
- `in_progress`: Processing requests
- `completed`: All requests finished
- `failed`: Batch failed (check error_file_id)
- `expired`: Batch expired without completion
- `cancelling`: Cancellation in progress
- `cancelled`: Batch cancelled

### 4. List Batches

**GET** `/v1/batches?limit=10`

List all batches.

**Query Parameters:**
- `limit`: Number of batches to return (default: 20)
- `after`: Cursor for pagination

**Response:**
```json
{
  "object": "list",
  "data": [
    { /* batch object */ },
    { /* batch object */ }
  ],
  "has_more": false
}
```

### 5. Cancel Batch

**POST** `/v1/batches/{batch_id}/cancel`

Cancel a running batch.

**Response:**
```json
{
  "id": "batch-xyz789",
  "status": "cancelling",
  ...
}
```

**Notes:**
- Unprocessed requests are cancelled
- Already-processed results remain available
- Cannot cancel completed batches

### 6. Retrieve Results

**GET** `/v1/files/{file_id}/content`

Download batch results (output or error file).

**Response:**
- Content-Type: `application/jsonl`
- Body: JSONL file with results

**Response Headers:**
- `X-Incomplete: true` - Batch still processing, more results coming
- `X-Last-Line: 45` - Resume point for partial downloads

**Output Format:**
Each line contains:
```json
{
  "id": "batch-req-abc",
  "custom_id": "request-1",
  "response": {
    "status_code": 200,
    "body": {
      "id": "chatcmpl-xyz",
      "choices": [
        {
          "message": {
            "role": "assistant",
            "content": "Response text here"
          }
        }
      ]
    }
  }
}
```

**Error Format:**
Each line contains:
```json
{
  "id": "batch-req-def",
  "custom_id": "request-2",
  "error": {
    "code": "invalid_request",
    "message": "Error description"
  }
}
```

## JSONL Request Format

Each line must be valid JSON:

```json
{
  "custom_id": "request-1",
  "method": "POST",
  "url": "/v1/chat/completions",
  "body": {
    "model": "anthropic/claude-3-5-sonnet",
    "messages": [
      {"role": "user", "content": "Your prompt here"}
    ],
    "temperature": 1.0,
    "max_tokens": 4096
  }
}
```

**Required fields:**
- `custom_id`: Unique string (max 64 chars)
- `method`: Always `"POST"`
- `url`: API endpoint path
- `body`: Standard API request parameters

**Body parameters:**
- `model` (required): Model identifier
- `messages` (required): Chat messages array
- `temperature` (optional): 0-2, default 1.0
- `max_tokens` (optional): Max response tokens
- `top_p` (optional): Nucleus sampling
- `stop` (optional): Stop sequences
- `stream` (optional): Must be false for batches

## Rate Limits & Pricing

**Completion windows:**
- `24h`: Better pricing, results within 24 hours
- `1h`: 50% price premium, results within 1 hour

**File limits:**
- Max file size: 200MB
- Split large batches into multiple files if needed

## Best Practices

1. **Use descriptive custom_ids**: Include metadata for easier result mapping
   ```
   "custom_id": "user-123-question-5"
   ```

2. **Split large files**: Keep files under 200MB
3. **Poll status efficiently**: Check every 30-60 seconds during processing
4. **Handle partial results**: Results available before batch completes
5. **Check error_file_id**: Review failed requests for debugging
6. **Set appropriate completion_window**: Use 24h unless time-sensitive
7. **Validate JSONL locally**: Ensure each line is valid JSON before upload

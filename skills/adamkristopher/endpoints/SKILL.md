---
name: endpoints
description: "Endpoints document management API toolkit. Scan documents with AI extraction and organize structured data into categorized endpoints. Use when the user asks to: scan a document, upload a file, list endpoints, inspect endpoint data, check usage stats, create or delete endpoints, get file URLs, or manage document metadata. Requires ENDPOINTS_API_KEY from endpoints.work dashboard."
---

# Endpoints API Toolkit

## Setup

Install dependencies:

```bash
cd scripts && npm install
```

Configure credentials by creating a `.env` file in the project root:

```
ENDPOINTS_API_URL=https://endpoints.work
ENDPOINTS_API_KEY=ep_your_api_key_here
```

**Prerequisites**: An Endpoints account with an API key. Generate your API key from the [API Keys page](https://endpoints.work/api-keys).

## Quick Start

| User says | Function to call |
|-----------|-----------------|
| "List my endpoints" | `listEndpoints()` |
| "Show endpoint details for /job-tracker/january" | `getEndpoint('/job-tracker/january')` |
| "Scan this document" | `scanFile('/path/to/file.pdf', 'job tracker')` |
| "Scan this text" | `scanText('Meeting notes...', 'meeting tracker')` |
| "Create an endpoint for receipts" | `createEndpoint('/receipts/2026')` |
| "Delete the old endpoint" | `deleteEndpoint('/category/slug')` |
| "Remove that item" | `deleteItem('abc12345')` |
| "Get the file URL" | `getFileUrl('userid/path/file.pdf')` |
| "Check my usage" | `getStats()` |

Execute functions by importing from `scripts/src/index.ts`:

```typescript
import { listEndpoints, scanText, getStats } from './scripts/src/index.js';

const categories = await listEndpoints();
const result = await scanText('Meeting with John about Q1 goals', 'meeting tracker');
const stats = await getStats();
```

Or run directly with tsx:

```bash
npx tsx scripts/src/index.ts
```

## Workflow Pattern

Every analysis follows three phases:

### 1. Analyze
Run API functions. Each call hits the Endpoints API and returns structured data.

### 2. Auto-Save
All results automatically save as JSON files to `results/{category}/`. File naming patterns:
- Named results: `{sanitized_name}.json`
- Auto-generated: `YYYYMMDD_HHMMSS__{operation}.json`

### 3. Summarize
After analysis, read the saved JSON files and create a markdown summary in `results/summaries/` with data tables, insights, and extracted entities.

## High-Level Functions

| Function | Purpose | What it returns |
|----------|---------|----------------|
| `listEndpoints()` | Get all endpoints by category | Tree structure with categories and endpoints |
| `getEndpoint(path)` | Get endpoint details | Full metadata (old + new items) |
| `scanText(text, prompt)` | Scan text with AI | Extracted entities and endpoint path |
| `scanFile(filePath, prompt)` | Scan file with AI | Extracted entities and endpoint path |
| `getStats()` | Get usage statistics | Parses used, limits, storage |

## Individual API Functions

For granular control, import specific functions. See [references/api-reference.md](references/api-reference.md) for the complete list with parameters, types, and examples.

### Endpoint Functions

| Function | Purpose |
|----------|---------|
| `listEndpoints()` | List all endpoints organized by category |
| `getEndpoint(path)` | Get full endpoint details with metadata |
| `createEndpoint(path)` | Create a new empty endpoint |
| `deleteEndpoint(path)` | Delete endpoint and all associated files |

### Scanning Functions

| Function | Purpose |
|----------|---------|
| `scanText(text, prompt)` | Scan text content with AI extraction |
| `scanFile(filePath, prompt)` | Scan file (PDF, images, docs) with AI |

### Item Functions

| Function | Purpose |
|----------|---------|
| `deleteItem(itemId)` | Delete a single item by its 8-char ID |

### File Functions

| Function | Purpose |
|----------|---------|
| `getFileUrl(key)` | Get presigned S3 URL for a file |

### Billing Functions

| Function | Purpose |
|----------|---------|
| `getStats()` | Get usage stats (parses, storage, tier) |

## Data Structures

### Living JSON Pattern

Endpoints use the Living JSON pattern for document history:

```typescript
{
  endpoint: { path, category, slug },
  metadata: {
    oldMetadata: { ... },  // Historical items
    newMetadata: { ... }   // Recent items
  }
}
```

### Metadata Item

Each item has:
- **8-character ID** - Unique identifier (e.g., `abc12345`)
- **summary** - AI-generated description
- **entities** - Extracted entities (people, companies, dates)
- **filePath** - S3 URL if file was uploaded
- **fileType** - MIME type
- **originalText** - Source text

## Error Handling

| Status | Meaning |
|--------|---------|
| 401 | Invalid or missing API key |
| 404 | Endpoint or item not found |
| 409 | Endpoint already exists |
| 429 | Usage limit exceeded |

## Examples

### List and Inspect

```typescript
// Get all endpoints
const { categories } = await listEndpoints();
console.log(`Found ${categories.length} categories`);

// Inspect specific endpoint
const details = await getEndpoint('/job-tracker/january');
console.log(`Total items: ${details.totalItems}`);
```

### Scan Documents

```typescript
// Scan text content
const result = await scanText(
  'Email from John Smith at Acme Corp about the Q1 contract renewal',
  'business contacts'
);
console.log(`Created endpoint: ${result.endpoint.path}`);

// Scan a PDF file
const fileResult = await scanFile('./invoice.pdf', 'invoice tracker');
console.log(`Extracted ${fileResult.entriesAdded} items`);
```

### Check Usage

```typescript
const stats = await getStats();
console.log(`Parses: ${stats.parsesUsed}/${stats.parsesLimit}`);
console.log(`Storage: ${stats.storageUsed} bytes`);
```

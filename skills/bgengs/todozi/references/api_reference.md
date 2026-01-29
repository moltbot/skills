# Todozi API Reference

## Base URL

```
https://todozi.com/api
```

## Authentication

All API requests require `x-api-key` header:

```
x-api-key: YOUR_API_KEY
```

**Register for API key:**
```bash
POST /api/register
Content-Type: application/json

{
  "webhook": "https://yoururl.com/todozi"  // optional
}
```

Response:
```json
{
  "api_key": "your-secret-key",
  "public_key": "your-public-key"
}
```

---

## Matrices

### List All Matrices

```bash
GET /api/matrix
GET /api/matrices        // alias
GET /api/projects        // alias
GET /api/project         // alias
```

Response:
```json
{
  "matrices": [
    {
      "id": "abc123",
      "name": "Work",
      "category": "do",
      "created_at": "2026-01-28T10:00:00Z"
    }
  ]
}
```

### Create Matrix

```bash
POST /api/matrix
Content-Type: application/json

{
  "name": "Project Name",
  "category": "do"  // required: do, done, dream, delegate, defer, dont
}
```

### Get Matrix with Items

```bash
GET /api/matrix/:id
```

Response:
```json
{
  "id": "abc123",
  "name": "Work",
  "category": "do",
  "items": {
    "tasks": [...],
    "goals": [...],
    "notes": [...]
  }
}
```

### Delete Matrix

```bash
DELETE /api/matrix/:id
```

---

## Items

### Create Task

```bash
POST /api/matrix/:id/task
Content-Type: application/json

{
  "title": "Review PR",
  "priority": "high",    // optional: low, medium, high
  "description": "Check", // optional
  "tags": ["pr", "code"] // optional
}
```

### Create Goal

```bash
POST /api/matrix/:id/goal
Content-Type: application/json

{
  "title": "Ship v2",
  "due_date": "2026-02-01",  // optional, ISO format
  "description": "Release v2.0"
}
```

### Create Note

```bash
POST /api/matrix/:id/note
Content-Type: application/json

{
  "content": "Remember to call Mom"
}
```

### Get Item

```bash
GET /api/item/:id
```

### Update Item

```bash
PUT /api/item/:id
Content-Type: application/json

{
  "title": "Updated title",
  "description": "Updated description",
  "priority": "low"
}
```

### Complete Item

```bash
POST /api/item/:id/complete
```

### Delete Item

```bash
DELETE /api/item/:id
```

---

## Lists

```bash
GET /api/list-tasks   // All tasks
GET /api/list-goals   // All goals
GET /api/list-notes   // All notes
GET /api/list-all     // Everything
```

---

## Search

**Searches only:** title, description, tags (NOT content)

```bash
GET /api/search?q=text&type=&status=&priority=&category=&tags=&limit=
```

Params:
- `q` (required): Search text
- `type`: task, goal, or note
- `status`: pending, completed
- `priority`: low, medium, high
- `category`: do, done, dream, delegate, defer, dont
- `tags`: comma-separated
- `limit`: number of results (default: 20)

---

## Bulk Operations

### Update Multiple Items

```bash
POST /api/bulk/update
Content-Type: application/json

[
  {"id": "item1", "title": "Updated"},
  {"id": "item2", "title": "Changed"}
]
```

### Complete Multiple Items

```bash
POST /api/bulk/complete
Content-Type: application/json

["item1", "item2"]
```

### Delete Multiple Items

```bash
POST /api/bulk/delete
Content-Type: application/json

["item1", "item2"]
```

---

## Webhooks

### Register with Webhook

```bash
POST /api/register
Content-Type: application/json

{
  "webhook": "https://yoururl.com/todozi"
}
```

### Create Webhook

```bash
POST /api/webhook
Content-Type: application/json

{
  "url": "https://yoururl.com/todozi",
  "events": ["item.created", "item.completed"]
}
```

### List Webhooks

```bash
GET /api/webhook
```

### Update Webhook

```bash
PUT /api/webhook/:id
Content-Type: application/json

{
  "url": "https://newurl.com",
  "events": ["*"]  // all events
}
```

### Delete Webhook

```bash
DELETE /api/webhook/:id
```

### Webhook Events

| Event | Description |
|-------|-------------|
| `item.created` | New task/goal/note created |
| `item.updated` | Item modified |
| `item.completed` | Item marked done |
| `item.deleted` | Item removed |
| `matrix.created` | New matrix created |
| `matrix.deleted` | Matrix removed |
| `*` | All events |

### Webhook Headers

```
x-todozi-event: item.created
x-todozi-signature: sha256=...
x-todozi-timestamp: 1706467200
x-todozi-api-key: public_key_...
```

### Webhook Payload Example (item.created)

```json
{
  "event": "item.created",
  "timestamp": "2026-01-28T20:00:00Z",
  "data": {
    "id": "item123",
    "type": "task",
    "title": "New task",
    "priority": "high",
    "matrix_id": "matrix123",
    "matrix_name": "Work",
    "category": "do",
    "created_at": "2026-01-28T20:00:00Z"
  }
}
```

---

## System

```bash
GET /api/health  // Returns {"status":"ok"}
GET /api/stats   // Returns usage statistics
```

---

## Error Responses

```json
{
  "error": "message",
  "code": 400
}
```

Common codes:
- `400`: Bad request (missing required fields)
- `401`: Invalid API key
- `404`: Resource not found
- `429`: Rate limit exceeded
- `500`: Server error

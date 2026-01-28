# YouTrack API References

## Core API Endpoints

### Base URL
Your YouTrack instance: `https://your-instance.youtrack.cloud/`
API base: `https://your-instance.youtrack.cloud/api/`

### Authentication
- Use permanent token with `Authorization: Bearer <token>` header
- To generate a token: From main navigation menu, select **Administration** > **Access Management** > **Users**, find your user, and generate a permanent API token

### Projects

**List all projects**
- `GET /api/admin/projects?fields=id,name,shortName`
- Returns array of project objects with id, name, shortName

**Get specific project**
- `GET /api/admin/projects/{projectId}?fields=id,name,shortName,description`

### Issues

**List issues with query**
- `GET /api/issues?query={query}&fields={fields}`
- Query examples:
  - `project: MyProject`
  - `project: MyProject updated: 2026-01-01 ..`
  - `assignee: me`
- Common fields to request:
  - `id,summary,description,created,updated,project(id,name),customFields(name,value)`

**Get issue**
- `GET /api/issues/{issueId}`

**Create issue**
- `POST /api/issues`
- Body: `{"project": {"id": "projectId"}, "summary": "Summary", "description": "Description"}`

**Update issue**
- `POST /api/issues/{issueId}`
- Body: `{"summary": "New summary", "description": "New description"}`

### Time Tracking

**Get work items for an issue**
- `GET /api/issues/{issueId}/timeTracking/workItems`
- Returns array of work items with:
  - `id`, `date`, `duration` (in minutes), `author`, `text`

**Work item structure:**
```json
{
  "id": "...",
  "date": "2026-01-15T10:30:00.000+0000",
  "duration": {"minutes": 30},
  "author": {"name": "User Name", "id": "..."},
  "text": "Work description",
  "type": {...}
}
```

### Knowledge Base (Articles)

**List articles**
- `GET /api/articles?project={projectId}`

**Get article**
- `GET /api/articles/{articleId}`

**Create article**
- `POST /api/articles`
- Body: `{"project": {"id": "projectId"}, "title": "Title", "content": "Content"}`

## Query Language Examples

```
project: MyProject
project: MyProject assignee: me
project: MyProject updated >= 2026-01-01
priority: Critical
has: time
```

**Note:** Date filtering in REST API uses `updated >= YYYY-MM-DD` format, not `updated: date ..` format.

## Field IDs Reference

Common custom field IDs (may vary by setup):
- Priority: `priority`
- State: `State`
- Assignee: `Assignee`
- Due Date: `Due Date`
- Type: `Type`

Check your instance's actual field IDs in YouTrack UI or via API.

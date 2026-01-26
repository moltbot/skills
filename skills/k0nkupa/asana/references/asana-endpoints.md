# Asana endpoints (quick reference)

Auth:
- Authorize: `GET https://app.asana.com/-/oauth_authorize`
- Token exchange / refresh: `POST https://app.asana.com/-/oauth_token`
- Revoke: `POST https://app.asana.com/-/oauth_revoke`

API:
- Base: `https://app.asana.com/api/1.0`

Common:
- `GET /users/me`
- `GET /workspaces`
- `GET /projects?workspace=<gid>`
- `GET /tasks` (requires filters)
- `GET /workspaces/{workspace_gid}/tasks/search` (advanced search; can be premium-only)
- `POST /tasks`

Notes:
- OAuth scopes are required with OAuth apps (examples: `tasks:read`, `tasks:write`, `projects:read`).

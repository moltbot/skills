---
name: canvas-lms
description: Access Canvas LMS (Instructure) for course data, assignments, grades, and submissions. Use when checking due dates, viewing grades, listing courses, or fetching course materials from Canvas.
---

# Canvas LMS Skill

Access Canvas LMS data via the REST API.

## Setup

1. Generate an API token in Canvas: Account → Settings → New Access Token
2. Store token in environment or `.env` file:
   ```bash
   export CANVAS_TOKEN="your_token_here"
   export CANVAS_URL="https://your-school.instructure.com"  # or canvas.yourschool.edu
   ```

## Authentication

Include token in all requests:
```bash
curl -s -H "Authorization: Bearer $CANVAS_TOKEN" "$CANVAS_URL/api/v1/..."
```

## Common Endpoints

### Courses & Profile
```bash
# User profile
curl -s -H "Authorization: Bearer $CANVAS_TOKEN" "$CANVAS_URL/api/v1/users/self/profile"

# Active courses
curl -s -H "Authorization: Bearer $CANVAS_TOKEN" "$CANVAS_URL/api/v1/courses?enrollment_state=active&per_page=50"

# Dashboard cards (quick overview)
curl -s -H "Authorization: Bearer $CANVAS_TOKEN" "$CANVAS_URL/api/v1/dashboard/dashboard_cards"
```

### Assignments & Due Dates
```bash
# To-do items (upcoming work)
curl -s -H "Authorization: Bearer $CANVAS_TOKEN" "$CANVAS_URL/api/v1/users/self/todo"

# Upcoming events
curl -s -H "Authorization: Bearer $CANVAS_TOKEN" "$CANVAS_URL/api/v1/users/self/upcoming_events"

# Missing/overdue submissions
curl -s -H "Authorization: Bearer $CANVAS_TOKEN" "$CANVAS_URL/api/v1/users/self/missing_submissions"

# Course assignments
curl -s -H "Authorization: Bearer $CANVAS_TOKEN" "$CANVAS_URL/api/v1/courses/{course_id}/assignments?per_page=50"

# Assignment details
curl -s -H "Authorization: Bearer $CANVAS_TOKEN" "$CANVAS_URL/api/v1/courses/{course_id}/assignments/{id}"

# Submission status
curl -s -H "Authorization: Bearer $CANVAS_TOKEN" "$CANVAS_URL/api/v1/courses/{course_id}/assignments/{id}/submissions/self"
```

### Grades
```bash
# Enrollments with scores
curl -s -H "Authorization: Bearer $CANVAS_TOKEN" "$CANVAS_URL/api/v1/users/self/enrollments?include[]=current_grading_period_scores&per_page=50"
```
Extract grade: `.grades.current_score`

### Course Content
```bash
# Announcements
curl -s -H "Authorization: Bearer $CANVAS_TOKEN" "$CANVAS_URL/api/v1/announcements?context_codes[]=course_{course_id}&per_page=20"

# Modules
curl -s -H "Authorization: Bearer $CANVAS_TOKEN" "$CANVAS_URL/api/v1/courses/{course_id}/modules?include[]=items&per_page=50"

# Files
curl -s -H "Authorization: Bearer $CANVAS_TOKEN" "$CANVAS_URL/api/v1/courses/{course_id}/files?per_page=50"

# Discussion topics
curl -s -H "Authorization: Bearer $CANVAS_TOKEN" "$CANVAS_URL/api/v1/courses/{course_id}/discussion_topics?per_page=50"

# Inbox
curl -s -H "Authorization: Bearer $CANVAS_TOKEN" "$CANVAS_URL/api/v1/conversations?per_page=20"
```

## Response Handling

- List endpoints return arrays
- Pagination: check `Link` header for `rel="next"`
- Dates are ISO 8601 (UTC)
- Use `--max-time 30` for slow endpoints

Parse with jq:
```bash
curl -s ... | jq '.[] | {name: .name, due: .due_at}'
```

Or Python if jq unavailable:
```bash
curl -s ... | python3 -c "import sys,json; data=json.load(sys.stdin); print(json.dumps(data, indent=2))"
```

## Tips

- Course IDs appear in todo/assignment responses
- File download URLs are in the `url` field of file objects
- Always include `per_page=50` to get more results (default is often 10)

# Linear API Examples

Quick reference for common GraphQL queries and mutations.

## Queries

### Get current user
```graphql
{ viewer { id name email } }
```

### List teams
```graphql
{ teams { nodes { id name key } } }
```

### List assigned issues
```graphql
{
  viewer {
    assignedIssues(first: 50) {
      nodes { id identifier title state { name } priority }
    }
  }
}
```

### Get issue by ID
```graphql
{
  issue(id: "ENG-123") {
    id identifier title description
    state { id name }
    assignee { id name }
    team { id name }
    labels { nodes { name } }
  }
}
```

### Search issues
```graphql
{
  searchIssues(term: "auth bug", first: 20) {
    nodes { id identifier title state { name } }
  }
}
```

### List workflow states
```graphql
{ workflowStates { nodes { id name type team { name } } } }
```

### Team states only
```graphql
{
  team(id: "TEAM_ID") {
    states { nodes { id name type } }
  }
}
```

## Mutations

### Create issue
```graphql
mutation {
  issueCreate(input: {
    teamId: "TEAM_ID"
    title: "Bug: something broken"
    description: "Detailed description"
    priority: 2
  }) {
    success
    issue { id identifier title url }
  }
}
```

### Update issue
```graphql
mutation {
  issueUpdate(id: "ENG-123", input: {
    stateId: "STATE_ID"
    assigneeId: "USER_ID"
  }) {
    success
    issue { id identifier title state { name } }
  }
}
```

### Add comment
```graphql
mutation {
  commentCreate(input: {
    issueId: "ISSUE_ID"
    body: "Comment text here"
  }) {
    success
    comment { id body }
  }
}
```

## Priority Values
- 0 = No priority
- 1 = Urgent
- 2 = High
- 3 = Normal (default)
- 4 = Low

## State Types
- `triage` - Triage
- `backlog` - Backlog
- `unstarted` - Todo
- `started` - In Progress
- `completed` - Done
- `canceled` - Canceled

## Tips

- Issue IDs can be UUID or identifier (e.g., "ENG-123")
- Use `includeArchived: true` to see archived items
- Dates are ISO 8601 format

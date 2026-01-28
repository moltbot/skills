# ccsinfo CLI Commands Reference

Quick reference for common ccsinfo CLI commands. All commands automatically use `$CCSINFO_SERVER_URL` when set.

## Sessions

### List sessions
```bash
ccsinfo sessions list [--active] [--project <id>] [--json]
```

### Show session details
```bash
ccsinfo sessions show <session-id>
```

### View messages
```bash
ccsinfo sessions messages <session-id> [--role user|assistant] [--limit <n>] [--json]
```

### View tool calls
```bash
ccsinfo sessions tools <session-id> [--json]
```

### Active sessions
```bash
ccsinfo sessions active [--json]
```

## Projects

### List projects
```bash
ccsinfo projects list [--json]
```

### Show project details
```bash
ccsinfo projects show <project-id> [--json]
```

### Project statistics
```bash
ccsinfo projects stats <project-id> [--json]
```

## Tasks

### List all tasks
```bash
ccsinfo tasks list [-s <session-id>] [--json]
```

### Show task details
```bash
ccsinfo tasks show <task-id> -s <session-id> [--json]
```

### Pending tasks
```bash
ccsinfo tasks pending [--json]
```

## Statistics

### Global statistics
```bash
ccsinfo stats global [--json]
```

### Daily activity
```bash
ccsinfo stats daily [--json]
```

### Usage trends
```bash
ccsinfo stats trends [--json]
```

## Search

### Search sessions
```bash
ccsinfo search sessions "<query>" [--json]
```

### Search messages
```bash
ccsinfo search messages "<query>" [--json]
```

### Search prompt history
```bash
ccsinfo search history "<query>" [--json]
```

## Common Options

- `--json` or `-j`: Output in JSON format
- `--server-url` or `-s`: Override server URL (defaults to `$CCSINFO_SERVER_URL`)
- `--help` or `-h`: Show help for command
- `--version` or `-v`: Show version

## Session ID Matching

Session IDs support partial matching - you can use the first few characters:
```bash
ccsinfo sessions show a1b2c3  # matches a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

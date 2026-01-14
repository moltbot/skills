---
name: nb
description: Manage notes, bookmarks, and notebooks using the nb CLI. Create, list, search, and organize notes across multiple notebooks with Git-backed versioning.
author: Benjamin Jesuiter <bjesuiter@gmail.com>
homepage: https://github.com/xwmx/nb
metadata:
  clawdbot:
    emoji: "📓"
    os: ["darwin", "linux"]
    requires:
      bins: ["nb"]
---

# nb - Command Line Note-Taking

> ⚠️ **IMPORTANT:** Never edit files in nb git repos (`~/.nb/*`) by hand! Always use the `nb` CLI to ensure proper indexing and Git commits.



A command line and local web note-taking, bookmarking, and archiving tool with plain text data storage, Git-backed versioning, and wiki-style linking.

## Quick Reference

### Notebooks

```bash
# List all notebooks
nb notebooks

# Switch to a notebook
nb use <notebook>

# Create a new notebook
nb notebooks add <name>

# Show current notebook
nb notebooks current
```

### Adding Notes

```bash
# Add a note with title
nb add -t "Title" -c "Content here"

# Add note to specific notebook
nb <notebook>: add -t "Title" -c "Content"

# Add note with tags
nb add -t "Title" --tags tag1,tag2

# Add note from file content
nb add <notebook>:filename.md
```

### Listing Notes

```bash
# List notes in current notebook
nb list

# List all notes (no limit)
nb list -a

# List notes in specific notebook
nb <notebook>: list

# List with excerpts
nb list -e

# List with tags shown
nb list --tags
```

### Showing Notes

```bash
# Show note by ID or title
nb show <id>
nb show "<title>"

# Show note from specific notebook
nb show <notebook>:<id>

# Print content (for piping)
nb show <id> --print
```

### Searching Notes

```bash
# Search across all notebooks
nb search "query"

# Search in specific notebook
nb <notebook>: search "query"

# Search with AND/OR/NOT
nb search "term1" --and "term2"
nb search "term1" --or "term2"
nb search "term1" --not "exclude"

# Search by tag
nb search --tag "tagname"
```

### Editing Notes

```bash
# Edit by ID
nb edit <id>

# Edit by title
nb edit "<title>"

# Append content
nb edit <id> -c "New content to append"

# Prepend content
nb edit <id> -c "Content at top" --prepend

# Overwrite content
nb edit <id> -c "Replace all" --overwrite
```

### Deleting Notes

```bash
# Delete by ID (will prompt)
nb delete <id>

# Force delete without prompt
nb delete <id> -f
```

### Moving/Renaming

```bash
# Move note to another notebook
nb move <id> <notebook>:

# Rename a note
nb move <id> new-filename.md
```

### Todos

```bash
# Add a todo
nb todo add "Task title"

# Add todo with due date
nb todo add "Task" --due "2026-01-15"

# List open todos
nb todos open

# List closed todos
nb todos closed

# Mark todo as done
nb todo do <id>

# Mark todo as not done
nb todo undo <id>
```

### Bookmarks

```bash
# Add a bookmark
nb bookmark <url>

# Add with comment
nb bookmark <url> -c "My comment"

# Add with tags
nb bookmark <url> --tags reference,dev

# List bookmarks
nb bookmark list

# Search bookmarks
nb bookmark search "query"
```

### Git Operations

```bash
# Sync with remote
nb sync

# Create checkpoint (commit)
nb git checkpoint "Message"

# Check dirty status
nb git dirty

# Run any git command
nb git status
nb git log --oneline -5
```

### Folders

```bash
# Add folder to notebook
nb folders add <folder-name>

# List folders
nb folders

# Add note to folder
nb add <folder>/<filename>.md
```

## Common Patterns

### Adding Note with Full Content

For longer notes, create a temp file and import:

```bash
# Write content to temp file first, then copy to nb
cp /tmp/note.md ~/.nb/<notebook>/
cd ~/.nb/<notebook> && git add . && git commit -m "Add note"
nb <notebook>: index rebuild
```

### Searching Across All

```bash
# Search everything
nb search "term" --all

# Search by type
nb search "term" --type bookmark
nb search "term" --type todo
```

## Data Location

Notes are stored in `~/.nb/<notebook>/` as markdown files with Git versioning.

```
~/.nb/
├── notebook-name-1/ # Your first notebook
├── notebook-name-2/ # Your second notebook
└── ...
```

## Tips

1. Use `nb <notebook>:` prefix to work with specific notebooks
2. IDs are numbers shown in `nb list`
3. Titles can be used instead of IDs (quoted if spaces)
4. All changes are automatically Git-committed
5. Use `nb sync` to push/pull from remote repos

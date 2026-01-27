---
name: npkill
description: Clean up node_modules and .next folders to free up disk space using npkill. Specifically designed to help JavaScript and Next.js developers remove accumulated build artifacts that consume significant storage. Provides both interactive and automated cleanup options with safety checks to protect important system directories.
---

# NPkill - Node.js and Next.js Build Artifact Cleaner

This skill leverages the npkill tool to clean up node_modules and .next folders that accumulate over time from JavaScript and Next.js development, freeing up significant disk space.

## Purpose

This skill addresses a common problem faced by JavaScript and Next.js developers: accumulation of large build artifact folders (node_modules, .next) that consume significant disk space over time. It provides a safe and efficient way to identify and remove these unnecessary folders.

## When to Use This Skill

Use this skill when:
- Your disk space is running low due to accumulated node_modules folders
- You want to clean up old Next.js build artifacts (.next folders)
- You need to maintain a clean development environment
- You want to identify which projects are consuming the most disk space
- You want to perform regular maintenance on your development workspace

## Core Commands

### Interactive Cleanup (Recommended)
```bash
npkill
```
Launches the interactive interface to browse and selectively delete node_modules folders. This is the safest method as it allows you to review each folder before deletion.

### Target .next Folders Specifically
```bash
npkill --target .next
```
Search specifically for .next folders (used by Next.js projects) instead of node_modules.

### Dry Run (Always Recommended First)
```bash
npkill --dry-run
```
Simulates the operation without actually deleting anything. Shows what would be deleted.

### Automated Cleanup (Use with Caution)
```bash
npkill --delete-all --yes
```
Automatically deletes all node_modules folders found. Use only after verifying with dry-run.

### View Sizes in Gigabytes
```bash
npkill --gb
```
Shows folder sizes in gigabytes instead of megabytes for easier reading.

### Scan from Specific Directory
```bash
npkill --directory /path/to/search/from
```
Starts searching from a specific directory instead of current directory.

## Safety Features

- **Warnings for Protected Directories**: npkill highlights system/app directories that shouldn't be deleted with a ⚠️ symbol
- **Interactive Confirmation**: Manual selection required in interactive mode
- **Dry-run Option**: Preview changes before executing any deletions
- **Exclusion Options**: Ability to exclude specific directories from scanning

## Common Use Cases for Next.js Developers

### Clean .next Folders Safely
```bash
# First, preview what would be deleted
npkill --target .next --dry-run

# Then, if satisfied with the preview, run interactively
npkill --target .next
```

### Regular Maintenance
```bash
# Run interactive cleanup to review and selectively delete
npkill
```

### Check Disk Usage
```bash
# View all node_modules folders sorted by size
npkill --sort=size
```

## Best Practices

1. **Always run with --dry-run first** to see what would be deleted
2. **Review warnings carefully** about protected directories marked with ⚠️
3. **Use interactive mode** for safer selective deletion
4. **Consider excluding important project directories** using --exclude if needed
5. **Schedule regular cleanup** to prevent massive accumulation

## Installation Requirements

This skill requires the npkill CLI tool to be installed globally:
```bash
npm install -g npkill
```

## Limitations

- Requires npkill to be installed separately
- May not detect all protected system directories in all environments
- Interactive mode requires terminal with arrow key support
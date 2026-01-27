---
name: qmd
description: Search markdown knowledge bases efficiently using qmd. Use this when searching Obsidian vaults or markdown collections to find relevant content with minimal token usage.
argument-hint: "<search query> [--collection <name>] [--semantic]"
---

# QMD Search Skill

Search markdown knowledge bases efficiently using qmd, a local indexing tool that uses BM25 + vector embeddings to return only relevant snippets instead of full files.

## Why Use This

- **96% token reduction** - Returns relevant snippets instead of reading entire files
- **Instant results** - Pre-indexed content means fast searches
- **Local & private** - All indexing and search happens locally
- **Hybrid search** - BM25 for keyword matching, vector search for semantic similarity

## Commands

### Search (BM25 keyword matching)
```bash
qmd search "your query" --collection <name>
```
Fast, accurate keyword-based search. Best for specific terms or phrases.

### Vector Search (semantic)
```bash
qmd vsearch "your query" --collection <name>
```
Semantic similarity search. Best for conceptual queries where exact words may vary.

### Hybrid Search (both + reranking)
```bash
qmd hybrid "your query" --collection <name>
```
Combines both approaches with LLM reranking. Most thorough but often overkill.

## How to Use

1. **Check if collection exists**:
   ```bash
   qmd collection list
   ```

2. **Search the collection**:
   ```bash
   # For specific terms
   qmd search "api authentication" --collection notes

   # For conceptual queries
   qmd vsearch "how to handle errors gracefully" --collection notes
   ```

3. **Read results**: qmd returns relevant snippets with file paths and context

## Setup (if qmd not installed)

```bash
# Install qmd
bun install -g https://github.com/tobi/qmd

# Add a collection (e.g., Obsidian vault)
qmd collection add ~/path/to/vault --name notes

# Generate embeddings for vector search
qmd embed --collection notes
```

## Invocation Examples

```
/qmd api authentication          # BM25 search for "api authentication"
/qmd how to handle errors --semantic   # Vector search for conceptual query
/qmd --setup                     # Guide through initial setup
```

## Best Practices

- Use **BM25 search** (`qmd search`) for specific terms, names, or technical keywords
- Use **vector search** (`qmd vsearch`) when looking for concepts where wording may vary
- Avoid hybrid search unless you need maximum recall - it's slower
- Re-run `qmd embed` after adding significant new content to keep vectors current

## Handling Arguments

- `$ARGUMENTS` contains the full search query
- If `--semantic` flag is present, use `qmd vsearch` instead of `qmd search`
- If `--setup` flag is present, guide user through installation and collection setup
- If `--collection <name>` is specified, use that collection; otherwise default to checking available collections

## Workflow

1. Parse arguments from `$ARGUMENTS`
2. Check if qmd is installed (`which qmd`)
3. If not installed, offer to guide setup
4. If searching:
   - List collections if none specified
   - Run appropriate search command
   - Present results to user with file paths
5. If user wants to read a specific result, use the Read tool on the file path

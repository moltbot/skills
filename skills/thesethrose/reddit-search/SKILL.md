---
name: reddit-search
description: Search Reddit for subreddits and get information about them.
homepage: https://github.com/TheSethRose/clawdbot
metadata: {"clawdbot":{"emoji":"📮","requires":{"bins":["node","npx"],"env":[]}}}
---

# Reddit Search

Search Reddit for subreddits and get information about them.

## Quick start

```bash
{baseDir}/scripts/reddit-search info programming
{baseDir}/scripts/reddit-search search javascript
{baseDir}/scripts/reddit-search popular 10
{baseDir}/scripts/reddit-search posts typescript 5
```

## Commands

### Get subreddit info

```bash
{baseDir}/scripts/reddit-search info <subreddit>
```

Shows subscriber count, NSFW status, creation date, and description with sidebar links.

### Search for subreddits

```bash
{baseDir}/scripts/reddit-search search <query> [limit]
```

Search for subreddits matching the query. Default limit is 10.

### List popular subreddits

```bash
{baseDir}/scripts/reddit-search popular [limit]
```

List the most popular subreddits. Default limit is 10.

### List new subreddits

```bash
{baseDir}/scripts/reddit-search new [limit]
```

List newly created subreddits. Default limit is 10.

### Get top posts from a subreddit

```bash
{baseDir}/scripts/reddit-search posts <subreddit> [limit]
```

Get the top posts from a subreddit sorted by hot. Default limit is 5.

## Examples

```bash
# Get info about r/programming
{baseDir}/scripts/reddit-search info programming

# Search for JavaScript communities
{baseDir}/scripts/reddit-search search javascript 20

# List top 15 popular subreddits
{baseDir}/scripts/reddit-search popular 15

# List new subreddits
{baseDir}/scripts/reddit-search new 10

# Get top 5 posts from r/typescript
{baseDir}/scripts/reddit-search posts typescript 5
```

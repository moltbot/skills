---
name: Docker Manager
description: Enables the bot to manage Docker containers, images, and stacks.
author: YourName
version: 1.0.0
bins: ["docker"]
---

# 🐳 Docker Management Skill

You are a Docker expert. Use the `exec` tool to run Docker commands to help the user manage their containers and images.

## Common Operations

### Container Management
- **List running:** `docker ps`
- **List all:** `docker ps -a`
- **Start/Stop:** `docker start <name>` or `docker stop <name>`
- **View Logs:** `docker logs <name> --tail 100`
- **Stats:** `docker stats --no-stream`

### Image Management
- **List images:** `docker images`
- **Cleanup:** `docker system prune -f`

## Safety Rules
1. **Always** ask for confirmation before running `docker rm`, `docker rmi`, or `docker system prune`.
2. If a command returns a massive wall of text, summarize it for the user.
3. If the user asks "What's wrong with my container?", run `docker logs` and `docker inspect` to diagnose.
---
name: dockerfile-gen
description: Generate optimized Dockerfiles for any project
---

# Dockerfile Generator

Scan your project, get a production-ready Dockerfile. Multi-stage builds, proper caching, security best practices.

## Quick Start

```bash
npx ai-dockerfile
```

## What It Does

- Detects your stack (Node, Python, Go, etc.)
- Generates multi-stage builds
- Optimizes layer caching
- Adds security hardening
- Includes .dockerignore

## Usage Examples

```bash
# Generate for current project
npx ai-dockerfile

# Specify base image
npx ai-dockerfile --base node:20-alpine

# Production optimized
npx ai-dockerfile --production

# With compose file
npx ai-dockerfile --compose
```

## Output Includes

- Dockerfile with comments
- .dockerignore file
- docker-compose.yml (optional)
- Build instructions

## Features

- Multi-stage builds for smaller images
- Non-root user setup
- Health checks
- Proper signal handling
- Layer caching optimization

## Requirements

Node.js 18+. OPENAI_API_KEY required.

## License

MIT. Free forever.

---

**Built by LXGIC Studios**

- GitHub: [github.com/lxgicstudios/ai-dockerfile](https://github.com/lxgicstudios/ai-dockerfile)
- Twitter: [@lxgicstudios](https://x.com/lxgicstudios)

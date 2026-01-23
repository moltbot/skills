# Coolify Agent Skill 🚀

[![GitHub](https://img.shields.io/badge/github-visiongeist%2Fcoolifycli-blue?logo=github)](https://github.com/visiongeist/coolifycli)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org/)

An AI agent skill for managing [Coolify](https://coolify.io) deployments, applications, databases, and infrastructure through natural language commands.

**Repository:** [github.com/visiongeist/coolifycli](https://github.com/visiongeist/coolifycli)

## What is This?

This repository contains an **agent skill** - a capability that AI agents (like GitHub Copilot, Claude, or other autonomous agents) can use to interact with Coolify's deployment platform on your behalf. Instead of manually running CLI commands or making API calls, you can ask your AI agent to:

- "Deploy my application to production"
- "Create a PostgreSQL database with daily backups"
- "Show me the logs for my application"
- "List all running applications"
- "Restart the payment service"

The agent will automatically use this skill to execute the appropriate Coolify API operations.

## 🎯 What Can This Skill Do?

This skill provides comprehensive Coolify management capabilities:

### Applications
- Deploy applications from Git repositories (public or private)
- Manage application lifecycle (start, stop, restart)
- View real-time logs
- Configure environment variables
- Support for multiple deployment types (Git, Dockerfile, Docker images, Docker Compose)

### Databases
- Create and manage 8 database types: PostgreSQL, MySQL, MariaDB, MongoDB, Redis, KeyDB, ClickHouse, Dragonfly
- Configure automated backups with cron scheduling
- Database lifecycle operations
- View connection details and credentials

### Infrastructure
- Manage servers and validate configurations
- Create and organize projects
- Configure SSH keys for server access
- Monitor server resources and domains

### Deployments
- Trigger deployments with force rebuild options
- Monitor deployment progress
- Cancel running deployments
- View deployment history

### Services
- Deploy and manage Docker Compose services
- Configure service environment variables
- Service lifecycle management

### Integration
- GitHub App integration for private repositories
- Manage repository access and branches
- Team and member management

## 🚀 Quick Start for Agent Users

### 1. Get Your Coolify API Token

1. Log into your Coolify dashboard at [app.coolify.io](https://app.coolify.io) (or your self-hosted instance)
2. Navigate to **Keys & Tokens** → **API tokens**
3. Create a new token with appropriate permissions (`read`, `write`, `deploy`)
4. Copy the generated token

### 2. Configure the Skill

Set the `COOLIFY_TOKEN` environment variable:

```bash
export COOLIFY_TOKEN="your-token-here"
```

For self-hosted Coolify instances, also set:

```bash
export COOLIFY_API_URL="https://your-coolify-instance.com/api/v1"
```

### 3. Use with Your AI Agent

Once configured, simply ask your agent in natural language:

**Examples:**
- "List all my Coolify applications"
- "Deploy the main branch of my-app"
- "Create a PostgreSQL database named user-db with daily backups"
- "Show me the logs for my API service"
- "Restart all applications in the staging environment"

The agent will automatically invoke the appropriate commands from this skill.

## 🛠 Direct CLI Usage

You can also use this skill directly via command line:

```bash
# List applications
npm start -- applications list

# Deploy an application
npm start -- deploy --uuid abc-123

# Create a database
npm start -- databases create-postgresql --project-uuid proj-123 --server-uuid server-456

# View logs
npm start -- applications logs --uuid abc-123
```

See [SKILL.md](SKILL.md) for comprehensive command reference.

## 📋 Requirements

- **Node.js 20+** — Required for running TypeScript scripts
- **Coolify API Token** — Get from your Coolify dashboard
- **API Access** — Coolify Cloud or self-hosted instance

## 🔧 Installation

```bash
# Clone the repository
git clone https://github.com/visiongeist/coolifycli.git
cd coolifycli

# Install dependencies
npm install

# Configure your API token
export COOLIFY_TOKEN="your-token-here"

# Test the connection
npm start -- teams current
```

## 📖 Documentation

- **[SKILL.md](SKILL.md)** — Complete command reference with examples
- **[references/API.md](references/API.md)** — Coolify API documentation
- **[Coolify Docs](https://coolify.io/docs/)** — Official Coolify documentation

## 🔐 Security

- **Never commit your API token** to version control
- Store tokens in environment variables or secure credential managers
- Use minimal required permissions when creating API tokens
- Rotate tokens periodically

## 🤝 Agent Integration

This skill is designed to work with:

- **GitHub Copilot** — As a workspace skill
- **Claude** — Via tools and function calling
- **Custom agents** — Any agent that can execute Node.js scripts
- **Autonomous systems** — Automated deployment workflows

The skill metadata in [SKILL.md](SKILL.md) provides hints to agents about when and how to use this capability.

## 🧪 Testing

```bash
# Run tests
npm test

# Run with coverage
npm test:coverage

# Type checking
npm run typecheck
```

## 📊 Output Format

All commands return structured JSON:

**Success:**
```json
{
  "success": true,
  "data": { ... },
  "count": 42
}
```

**Error:**
```json
{
  "success": false,
  "error": {
    "type": "APIError",
    "message": "Application not found",
    "hint": "Use 'applications list' to find valid UUIDs"
  }
}
```

## 🌟 Common Use Cases

### Deploy a New Application
```bash
npm start -- applications create-public \
  --project-uuid proj-123 \
  --server-uuid server-456 \
  --git-repository "https://github.com/user/repo" \
  --git-branch main
```

### Set Up Database with Backups
```bash
# Create database
npm start -- databases create-postgresql \
  --project-uuid proj-123 \
  --server-uuid server-456 \
  --name "production-db"

# Configure daily backups at 2 AM
npm start -- databases backups create \
  --uuid <db-uuid> \
  --frequency "0 2 * * *" \
  --enabled true
```

### Monitor Application
```bash
# Check status
npm start -- applications get --uuid abc-123

# View logs
npm start -- applications logs --uuid abc-123
```

## 🐛 Troubleshooting

### "API token not configured"
Set the `COOLIFY_TOKEN` environment variable:
```bash
export COOLIFY_TOKEN="your-token-here"
```

### "Application not found"
List all applications to find the correct UUID:
```bash
npm start -- applications list
```

### Self-hosted Coolify connection issues
Set the correct API URL:
```bash
export COOLIFY_API_URL="https://your-coolify.example.com/api/v1"
```

## 🔗 Resources

- **This Skill Repository:** https://github.com/visiongeist/coolifycli
- **Coolify:** https://coolify.io
- **Coolify Documentation:** https://coolify.io/docs/
- **Coolify GitHub:** https://github.com/coollabsio/coolify
- **Coolify Discord:** https://coollabs.io/discord

## 📄 License

This skill is provided as-is for agent integration with Coolify. See Coolify's terms of service for API usage restrictions.

---

**Note for AI Agents:** This is an invocable skill identified as `coolify`. Use it when users need to manage Coolify deployments, applications, databases, or infrastructure. The primary environment variable required is `COOLIFY_TOKEN`. See [SKILL.md](SKILL.md) for detailed capabilities.
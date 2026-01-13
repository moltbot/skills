# Plan2Meal ClawdHub Skill

A ClawdHub skill for managing recipes and grocery lists via chat. Connects to [Plan2Meal](https://plan2meal.app), a React Native recipe app.

## Features

- **Recipe Extraction** — Add recipes from any URL with automatic metadata parsing
- **Recipe Management** — List, search, view, and delete your saved recipes
- **Grocery Lists** — Create shopping lists and populate from recipes
- **Secure Authentication** — Login via GitHub using Device Flow (no configuration required)

## Quick Start

```bash
# Install via ClawdHub
clawdhub install plan2meal

# Login (no configuration needed!)
plan2meal login
```

**That's it!** No environment variables or configuration required. Authentication is handled securely through the Plan2Meal backend.

## Commands

### Authentication

| Command | Description |
|---------|-------------|
| `plan2meal login` | Login via GitHub |
| `plan2meal logout` | Logout |
| `plan2meal status` | Check auth status |
| `plan2meal whoami` | Show current user |

### Recipes

| Command | Description |
|---------|-------------|
| `plan2meal add <url>` | Add recipe from URL |
| `plan2meal list` | List your recipes |
| `plan2meal search <term>` | Search recipes |
| `plan2meal show <id>` | View recipe details |
| `plan2meal delete <id>` | Delete recipe |

### Grocery Lists

| Command | Description |
|---------|-------------|
| `plan2meal lists` | List all grocery lists |
| `plan2meal list-show <id>` | View list with items |
| `plan2meal list-create <name>` | Create new list |
| `plan2meal list-add <listId> <recipeId>` | Add recipe ingredients to list |

### Help

| Command | Description |
|---------|-------------|
| `plan2meal help` | Show all commands |

## How Authentication Works

Plan2Meal uses a secure **Device Flow** for CLI authentication:

1. Run `plan2meal login`
2. Visit the URL shown and enter the code
3. Sign in with GitHub in your browser
4. Return to the CLI — you're logged in!

Your session is securely stored and automatically refreshes. No tokens to copy, no secrets to manage.

## Limits

Free tier: **5 recipes**. Upgrade for unlimited.

## Documentation

See [SKILL.md](SKILL.md) for detailed setup and usage examples.

## License

MIT

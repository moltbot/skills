# Plan2Meal Skill

A ClawdHub skill for managing recipes and grocery lists via Plan2Meal, a React Native recipe app.

## Features

- **Recipe Management**: Add recipes from URLs, search, view, and delete your recipes
- **Grocery Lists**: Create and manage shopping lists with recipes
- **Backend Authentication**: Secure authentication via Plan2Meal web app (no secrets in skill)
- **Recipe Extraction**: Automatically fetch recipe metadata from URLs
- **Telegram Formatting**: Pretty-printed output for Telegram

## Setup

1. Install via ClawdHub:
   ```bash
   clawdhub install plan2meal
   ```

2. Configure environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

3. Required environment variables:
   - `PLAN2MEAL_API_URL`: Your Plan2Meal backend API URL (e.g., `https://api.plan2meal.app`)

   **Optional:**
   - `PLAN2MEAL_AUTH_URL`: Custom authentication URL (defaults to `https://app.plan2meal.com/sign-in`)

   **Important**: 
   - **Public Skill**: This skill is published on ClawdHub. No secrets are stored in the skill.
   - **Authentication**: Users authenticate via your Plan2Meal web app, then copy a session token back to Telegram.
   - **Backend Security**: All OAuth credentials (GitHub, Convex) are configured in your backend only, never exposed.

## Commands

### Recipe Commands

| Command | Description |
|---------|-------------|
| `plan2meal add <url>` | Fetch recipe metadata from URL and create recipe |
| `plan2meal list` | List your recent recipes |
| `plan2meal search <term>` | Search your recipes |
| `plan2meal show <id>` | Show detailed recipe information |
| `plan2meal delete <id>` | Delete a recipe |

### Grocery List Commands

| Command | Description |
|---------|-------------|
| `plan2meal lists` | List all your grocery lists |
| `plan2meal list-show <id>` | Show grocery list with items |
| `plan2meal list-create <name>` | Create a new grocery list |
| `plan2meal list-add <listId> <recipeId>` | Add recipe to grocery list |

### Help

| Command | Description |
|---------|-------------|
| `plan2meal help` | Show all available commands |

## Usage Examples

### Adding a Recipe

```
plan2meal add https://www.allrecipes.com/recipe/12345/pasta
```

Output:
```
✅ Recipe added successfully!

📖 Recipe Details
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Name: Classic Pasta
Source: allrecipes.com
Method: firecrawl-json (credit used)
Time: 15 min prep + 20 min cook

🥘 Ingredients (4 servings)
• 1 lb pasta
• 2 cups marinara sauce
• 1/2 cup parmesan

🔪 Steps
1. Boil water...
```

### Searching Recipes

```
plan2meal search pasta
```

### Creating a Grocery List

```
plan2meal list-create Weekly Shopping
```

### Adding Recipe to List

```
plan2meal list-add <listId> <recipeId>
```

## Recipe Limits

The free tier allows up to **5 recipes**. You'll receive a warning when approaching this limit.

## Authentication Architecture

### How It Works

**Skill Owner Setup** (one-time):
1. Configure your Plan2Meal backend API URL in the skill
2. Your backend handles all OAuth (GitHub credentials configured in Convex environment variables)
3. Your backend is configured with the Convex URL (stays private)

**End User Flow**:
1. User sends a command (e.g., `plan2meal list`)
2. Skill responds with a link to your Plan2Meal sign-in page (`app.plan2meal.com/sign-in`)
3. User clicks the link and authenticates with GitHub via your web app
4. Your backend (using Convex Auth) handles the GitHub OAuth flow
5. After successful authentication, your backend shows the user a session token
6. User copies the token and sends it back to Telegram (or types `token: <token>`)
7. Skill validates the token with your backend and stores it securely

**Backend Processing**:
- Your Plan2Meal backend uses Convex Auth with GitHub provider
- GitHub OAuth credentials are stored in Convex environment variables (never exposed)
- After GitHub auth, backend generates a session token for the user
- Skill sends session token to your backend API for all requests
- Your backend validates the token and makes Convex API calls on behalf of the user
- Convex URL is never exposed to users or the skill

### Key Points

- **Public Skill**: No secrets in the skill - safe to publish on ClawdHub
- **Backend OAuth**: All OAuth credentials (GitHub, Convex) stay in your backend
- **User Identification**: Your backend maps session tokens to Convex users internally
- **Privacy**: Convex URL stays private in your backend only
- **Security**: Session tokens are validated with your backend before use

## License

MIT
# Alexandrie Skill

Interact with Alexandrie note-taking app at https://notes.eth3rnit3.org

## Configuration

- **API URL**: `https://api-notes.eth3rnit3.org/api`
- **Frontend**: `https://notes.eth3rnit3.org`
- **Username**: `eth3rnit3`
- **User ID**: `671423603690045441`
- **Password**: Stored in `/home/eth3rnit3/clawd/.env` as `ALEXANDRIE_PASSWORD`

## Usage

Use the `alexandrie.sh` script for all operations:

```bash
/home/eth3rnit3/clawd/skills/alexandrie/alexandrie.sh <command> [args]
```

## Commands

### Authentication
```bash
./alexandrie.sh login                    # Login and get token
./alexandrie.sh logout                   # Logout
```

### Notes (Nodes)
```bash
./alexandrie.sh list                     # List all notes/categories
./alexandrie.sh get <nodeId>             # Get a specific note with content
./alexandrie.sh search <query>           # Search notes
./alexandrie.sh create <name> [content] [parentId]  # Create a note
./alexandrie.sh update <nodeId> <name> [content]    # Update a note
./alexandrie.sh delete <nodeId>          # Delete a note
```

## Node Roles
- **role: 1** = Category/Workspace (container)
- **role: 3** = Document (note with content)

## Current Structure
- `671425872858841091` - **Perso** (category)
- `671426069886271492` - **Test** (document)

## Examples

### List all notes
```bash
./alexandrie.sh login
./alexandrie.sh list
```

### Read a note
```bash
./alexandrie.sh get 671426069886271492
# Returns: "Salut, ceci est un **test**"
```

### Create a note
```bash
./alexandrie.sh create "My Note" "# Title\n\nContent here" 671425872858841091
```

### Search
```bash
./alexandrie.sh search "test"
```

## API Reference

Base URL: `https://api-notes.eth3rnit3.org/api`

### Endpoints
- `POST /auth` - Login (body: `{"username": "...", "password": "..."}`)
- `POST /auth/logout` - Logout
- `GET /nodes/user/:userId` - List user's nodes
- `GET /nodes/:nodeId` - Get node by ID (includes content)
- `GET /nodes/search?q=query` - Search nodes
- `POST /nodes` - Create node
- `PUT /nodes/:nodeId` - Update node
- `DELETE /nodes/:nodeId` - Delete node

### Authentication
JWT token stored in cookies after login (`/tmp/alexandrie_cookies.txt`).

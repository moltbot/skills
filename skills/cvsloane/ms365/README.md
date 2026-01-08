# MS 365 Skill for Clawdbot

A Clawdbot skill for Microsoft 365 integration via the Graph API.

## Features

- **Email**: Read, send, search, delete messages
- **Calendar**: View, create, update, delete events
- **OneDrive**: Browse, upload, download files
- **To Do**: Manage tasks and lists
- **Contacts**: Search and view contacts
- **OneNote**: Access notebooks and pages
- **Teams** (org mode): Send messages, access chats
- **SharePoint** (org mode): Access sites and documents

## Installation

### 1. Copy Skill to Clawdbot

Clone this repo to your Clawdbot skills directory:

```bash
# For workspace skills
cd <workspace>/skills
git clone https://github.com/YOUR_USERNAME/m365-skill ms365

# Or for managed skills
cd ~/.clawdbot/skills
git clone https://github.com/YOUR_USERNAME/m365-skill ms365
```

Or download directly from releases.

### 2. Install Dependencies

The skill will auto-install via npm, or manually:

```bash
npm install -g @softeria/ms-365-mcp-server
```

### 3. Set Up Authentication

#### Option A: Azure AD App (Recommended)

This method works headless and is required for Docker deployments.

**Step 1: Create Azure AD App Registration**

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** → **App registrations**
3. Click **New registration**
4. Configure:
   - **Name**: `Clawdbot MS365` (or your choice)
   - **Supported account types**:
     - "Personal Microsoft accounts only" for personal use
     - "Accounts in any organizational directory and personal" for both
   - **Redirect URI**: Select "Web" and enter `http://localhost:3365/callback`
5. Click **Register**

**Step 2: Configure API Permissions**

1. In your app registration, go to **API permissions**
2. Click **Add a permission** → **Microsoft Graph** → **Delegated permissions**
3. Add these permissions:

| Permission | Purpose |
|------------|---------|
| `Mail.ReadWrite` | Read and send emails |
| `Mail.Send` | Send emails |
| `Calendars.ReadWrite` | Manage calendar events |
| `Files.ReadWrite` | Access OneDrive files |
| `Tasks.ReadWrite` | Manage To Do tasks |
| `Contacts.Read` | Read contacts |
| `Notes.Read` | Read OneNote notebooks |
| `User.Read` | Basic profile info |

For organization features, also add:

| Permission | Purpose |
|------------|---------|
| `Chat.ReadWrite` | Teams messaging |
| `Sites.Read.All` | SharePoint access |
| `ChannelMessage.Send` | Post to Teams channels |

4. Click **Grant admin consent** (if you have admin rights)

**Step 3: Create Client Secret**

1. Go to **Certificates & secrets**
2. Click **New client secret**
3. Add description: `Clawdbot`
4. Choose expiration (recommend 24 months)
5. Click **Add**
6. **IMPORTANT**: Copy the secret value immediately (shown only once!)

**Step 4: Note Your Credentials**

From the **Overview** page, note:
- **Application (client) ID** → `MS365_MCP_CLIENT_ID`
- **Directory (tenant) ID** → `MS365_MCP_TENANT_ID`
  - Or use `consumers` for personal accounts only
- **Client secret value** (from step 3) → `MS365_MCP_CLIENT_SECRET`

**Step 5: Set Environment Variables**

Add to your environment (.env file, Docker, or your deployment platform):

```bash
MS365_MCP_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
MS365_MCP_CLIENT_SECRET=your-secret-value
MS365_MCP_TENANT_ID=consumers
```

#### Option B: Device Code Flow

For interactive/testing use. No Azure setup needed.

1. Run any MS365 command
2. You'll see: "To sign in, use a web browser to open https://microsoft.com/devicelogin"
3. Enter the provided code
4. Sign in with your Microsoft account
5. Tokens are cached for future use

**Note**: This doesn't work in pure headless environments.

### 4. Configure mcporter

Add MS365 server to mcporter config. Create/edit `~/.clawdbot/mcporter.json`:

```json
{
  "servers": {
    "ms365": {
      "command": "npx",
      "args": ["-y", "@softeria/ms-365-mcp-server"],
      "env": {
        "MS365_MCP_CLIENT_ID": "${MS365_MCP_CLIENT_ID}",
        "MS365_MCP_CLIENT_SECRET": "${MS365_MCP_CLIENT_SECRET}",
        "MS365_MCP_TENANT_ID": "${MS365_MCP_TENANT_ID}"
      }
    }
  }
}
```

Or use HTTP mode:

```json
{
  "servers": {
    "ms365": {
      "url": "http://localhost:3365"
    }
  }
}
```

### 5. Verify Installation

```bash
# Check server is accessible
mcporter list ms365

# Test email access
mcporter call ms365.list_messages limit=5

# Test calendar access
mcporter call ms365.list_events
```

## Usage

Once installed, simply talk to Clawdbot naturally:

- "Check my email"
- "What meetings do I have tomorrow?"
- "Send an email to john@example.com about the project update"
- "Add a task to review the budget by Friday"
- "Show my OneDrive files"

## Troubleshooting

### Error: "AADSTS700016: Application not found"
- Verify `MS365_MCP_CLIENT_ID` is correct
- Check the app registration exists in Azure portal

### Error: "AADSTS7000218: Invalid client secret"
- Client secret may have expired
- Create a new secret in Azure portal
- Update `MS365_MCP_CLIENT_SECRET`

### Error: "Insufficient privileges"
- Add required permissions in Azure portal
- Grant admin consent if required
- For org features, ensure admin has approved the app

### Error: "Token expired" / "401 Unauthorized"
- Re-authenticate via device code flow
- Or refresh OAuth tokens

### mcporter can't find ms365 server
- Check mcporter.json configuration
- Verify npm package is installed: `npx @softeria/ms-365-mcp-server --version`

## Organization/Work Account Features

To enable Teams, SharePoint, and shared mailbox access:

1. Set environment variable:
   ```bash
   MS365_MCP_ORG_MODE=true
   ```

2. Update mcporter config to include the flag:
   ```json
   {
     "servers": {
       "ms365": {
         "command": "npx",
         "args": ["-y", "@softeria/ms-365-mcp-server", "--org-mode"]
       }
     }
   }
   ```

3. Ensure your Azure app has the required organization permissions

## Advanced Configuration

### Token-Efficient Output (TOON format)

Reduce token usage by 30-60%:

```bash
MS365_MCP_OUTPUT_FORMAT=toon
```

### Read-Only Mode

Disable all write operations:

```json
{
  "servers": {
    "ms365": {
      "command": "npx",
      "args": ["-y", "@softeria/ms-365-mcp-server", "--read-only"]
    }
  }
}
```

### Discovery Mode

Start with minimal tools, expand on demand:

```json
{
  "servers": {
    "ms365": {
      "command": "npx",
      "args": ["-y", "@softeria/ms-365-mcp-server", "--discovery"]
    }
  }
}
```

## Available Tools Reference

### Email Tools
| Tool | Description |
|------|-------------|
| `list_messages` | List emails in a folder |
| `get_message` | Get full email content |
| `send_message` | Send a new email |
| `reply_message` | Reply to an email |
| `forward_message` | Forward an email |
| `delete_message` | Delete an email |
| `move_message` | Move email to folder |
| `search_messages` | Search emails |

### Calendar Tools
| Tool | Description |
|------|-------------|
| `list_events` | List calendar events |
| `get_event` | Get event details |
| `create_event` | Create new event |
| `update_event` | Update existing event |
| `delete_event` | Delete an event |
| `list_calendars` | List all calendars |

### OneDrive Tools
| Tool | Description |
|------|-------------|
| `list_files` | List files in folder |
| `get_file` | Get file metadata |
| `download_file` | Download file content |
| `upload_file` | Upload a file |
| `create_folder` | Create new folder |
| `delete_file` | Delete file/folder |
| `search_files` | Search for files |

### To Do Tools
| Tool | Description |
|------|-------------|
| `list_task_lists` | List all task lists |
| `list_tasks` | List tasks in a list |
| `create_task` | Create new task |
| `update_task` | Update task |
| `complete_task` | Mark task complete |
| `delete_task` | Delete a task |

### Contact Tools
| Tool | Description |
|------|-------------|
| `list_contacts` | List contacts |
| `get_contact` | Get contact details |
| `search_contacts` | Search contacts |
| `create_contact` | Create new contact |

### OneNote Tools
| Tool | Description |
|------|-------------|
| `list_notebooks` | List notebooks |
| `list_sections` | List notebook sections |
| `list_pages` | List section pages |
| `get_page_content` | Get page content |

### Organization Tools (--org-mode)
| Tool | Description |
|------|-------------|
| `list_teams` | List Teams |
| `list_channels` | List team channels |
| `send_channel_message` | Post to channel |
| `list_chats` | List chat conversations |
| `send_chat_message` | Send chat message |
| `list_sites` | List SharePoint sites |
| `list_site_files` | List site documents |

## Support

- MCP Server Issues: https://github.com/Softeria/ms-365-mcp-server/issues
- Clawdbot Issues: https://github.com/clawdbot/clawdbot/issues

## License

MIT License - Feel free to modify and share!

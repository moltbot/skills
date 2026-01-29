#!/bin/bash
set -e

# Alexandrie API Client
# Usage: ./alexandrie.sh <command> [args]

BASE_URL="https://api-notes.eth3rnit3.org/api"
USERNAME="eth3rnit3"
TOKEN_FILE="/tmp/alexandrie_cookies.txt"
USER_ID_FILE="/tmp/alexandrie_user_id"

# Load password from env
source /home/eth3rnit3/clawd/.env 2>/dev/null || true
PASSWORD="${ALEXANDRIE_PASSWORD:-}"

if [[ -z "$PASSWORD" ]]; then
    echo "Error: ALEXANDRIE_PASSWORD not set in .env"
    exit 1
fi

# Helper function for authenticated requests
auth_curl() {
    if [[ ! -f "$TOKEN_FILE" ]]; then
        echo "Error: Not logged in. Run: $0 login" >&2
        exit 1
    fi
    curl -s -b "$TOKEN_FILE" -c "$TOKEN_FILE" "$@"
}

# Commands
case "${1:-help}" in
    login)
        echo "Logging in to Alexandrie..."
        RESPONSE=$(curl -s -c "$TOKEN_FILE" -X POST "$BASE_URL/auth" \
            -H "Content-Type: application/json" \
            -d "{\"username\": \"$USERNAME\", \"password\": \"$PASSWORD\"}")
        
        # Extract user ID from response
        USER_ID=$(echo "$RESPONSE" | jq -r '.result.id // empty' 2>/dev/null)
        if [[ -n "$USER_ID" && "$USER_ID" != "null" ]]; then
            echo "$USER_ID" > "$USER_ID_FILE"
            echo "✓ Logged in successfully (User ID: $USER_ID)"
            echo "$RESPONSE" | jq '.result | {id, username, firstname, lastname}'
        else
            echo "⚠ Login failed:"
            echo "$RESPONSE" | jq '.'
        fi
        ;;
    
    logout)
        echo "Logging out..."
        auth_curl -X POST "$BASE_URL/auth/logout"
        rm -f "$TOKEN_FILE" "$USER_ID_FILE"
        echo "✓ Logged out"
        ;;
    
    list)
        if [[ ! -f "$USER_ID_FILE" ]]; then
            echo "Error: User ID not found. Run: $0 login" >&2
            exit 1
        fi
        USER_ID=$(cat "$USER_ID_FILE")
        echo "Fetching notes for user $USER_ID..."
        auth_curl "$BASE_URL/nodes/user/$USER_ID" | jq '.'
        ;;
    
    get)
        NODE_ID="${2:-}"
        if [[ -z "$NODE_ID" ]]; then
            echo "Usage: $0 get <nodeId>"
            exit 1
        fi
        auth_curl "$BASE_URL/nodes/$NODE_ID" | jq '.'
        ;;
    
    search)
        QUERY="${2:-}"
        if [[ -z "$QUERY" ]]; then
            echo "Usage: $0 search <query>"
            exit 1
        fi
        ENCODED_QUERY=$(echo -n "$QUERY" | jq -sRr @uri)
        auth_curl "$BASE_URL/nodes/search?q=$ENCODED_QUERY" | jq '.'
        ;;
    
    create)
        NAME="${2:-}"
        CONTENT="${3:-}"
        PARENT_ID="${4:-}"
        
        if [[ -z "$NAME" ]]; then
            echo "Usage: $0 create <name> [content] [parentId]"
            exit 1
        fi
        
        # Build JSON payload with required fields
        # role: 3 = document, accessibility: 1 = private
        JSON=$(jq -n \
            --arg name "$NAME" \
            --arg content "$CONTENT" \
            --arg parentId "$PARENT_ID" \
            '{
                name: $name,
                content: $content,
                role: 3,
                accessibility: 1,
                parent_id: (if $parentId != "" then $parentId else null end)
            }')
        
        echo "Creating note: $NAME"
        auth_curl -X POST "$BASE_URL/nodes" \
            -H "Content-Type: application/json" \
            -d "$JSON" | jq '.'
        ;;
    
    update)
        NODE_ID="${2:-}"
        NAME="${3:-}"
        CONTENT="${4:-}"
        
        if [[ -z "$NODE_ID" || -z "$NAME" ]]; then
            echo "Usage: $0 update <nodeId> <name> [content]"
            exit 1
        fi
        
        if [[ ! -f "$USER_ID_FILE" ]]; then
            echo "Error: User ID not found. Run: $0 login" >&2
            exit 1
        fi
        USER_ID=$(cat "$USER_ID_FILE")
        
        # Include required fields for update
        JSON=$(jq -n \
            --arg name "$NAME" \
            --arg content "$CONTENT" \
            --arg userId "$USER_ID" \
            '{name: $name, content: $content, accessibility: 1, role: 3, user_id: $userId}')
        
        echo "Updating note $NODE_ID..."
        auth_curl -X PUT "$BASE_URL/nodes/$NODE_ID" \
            -H "Content-Type: application/json" \
            -d "$JSON" | jq '.'
        ;;
    
    delete)
        NODE_ID="${2:-}"
        if [[ -z "$NODE_ID" ]]; then
            echo "Usage: $0 delete <nodeId>"
            exit 1
        fi
        echo "Deleting note $NODE_ID..."
        auth_curl -X DELETE "$BASE_URL/nodes/$NODE_ID" | jq '.'
        echo "✓ Deleted"
        ;;
    
    help|*)
        echo "Alexandrie CLI - Note Taking"
        echo ""
        echo "Usage: $0 <command> [args]"
        echo ""
        echo "Commands:"
        echo "  login                          Login to Alexandrie"
        echo "  logout                         Logout"
        echo "  list                           List all notes"
        echo "  get <nodeId>                   Get a note"
        echo "  search <query>                 Search notes"
        echo "  create <name> [content] [categoryId] [parentId]  Create a note"
        echo "  update <nodeId> <name> [content]                 Update a note"
        echo "  delete <nodeId>                Delete a note"
        echo ""
        ;;
esac

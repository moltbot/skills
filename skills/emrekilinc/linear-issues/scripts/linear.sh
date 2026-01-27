#!/usr/bin/env bash
set -euo pipefail

# Linear API wrapper for Clawdbot
# Usage: linear.sh <command> [options]

API_URL="https://api.linear.app/graphql"
FORMAT="${LINEAR_FORMAT:-pretty}"  # pretty or json

# Get API key from credentials file or environment
get_api_key() {
    if [[ -n "${LINEAR_API_KEY:-}" ]]; then
        echo "$LINEAR_API_KEY"
        return
    fi
    
    local creds_file="$HOME/.clawdbot/credentials/linear.json"
    if [[ -f "$creds_file" ]]; then
        jq -r '.apiKey // empty' "$creds_file" 2>/dev/null || true
    fi
}

API_KEY=$(get_api_key)
if [[ -z "$API_KEY" ]]; then
    echo "Error: No Linear API key found." >&2
    echo "Set LINEAR_API_KEY or create ~/.clawdbot/credentials/linear.json" >&2
    exit 1
fi

# Execute GraphQL query
gql() {
    local query="$1"
    curl -s -X POST "$API_URL" \
        -H "Content-Type: application/json" \
        -H "Authorization: $API_KEY" \
        -d "$query"
}

# Format output
fmt_issues() {
    if [[ "$FORMAT" == "json" ]]; then
        cat
    else
        jq -r '.data.viewer.assignedIssues.nodes // .data.team.issues.nodes // .data.searchIssues.nodes // [] | .[] | "\(.identifier)\t\(.state.name)\t\(.title)"' 2>/dev/null | column -t -s $'\t' || cat
    fi
}

fmt_issue() {
    if [[ "$FORMAT" == "json" ]]; then
        cat
    else
        jq -r '.data.issue | "[\(.identifier)] \(.title)\nStatus: \(.state.name)\nTeam: \(.team.name)\nAssignee: \(.assignee.name // "Unassigned")\nPriority: \(.priority)\nCreated: \(.createdAt)\n\nDescription:\n\(.description // "No description")"' 2>/dev/null || cat
    fi
}

fmt_teams() {
    if [[ "$FORMAT" == "json" ]]; then
        cat
    else
        jq -r '.data.teams.nodes[] | "\(.key)\t\(.name)\t\(.id)"' 2>/dev/null | column -t -s $'\t' || cat
    fi
}

fmt_states() {
    if [[ "$FORMAT" == "json" ]]; then
        cat
    else
        jq -r '.data.workflowStates.nodes // .data.team.states.nodes | .[] | "\(.name)\t\(.type)\t\(.id)"' 2>/dev/null | column -t -s $'\t' || cat
    fi
}

fmt_users() {
    if [[ "$FORMAT" == "json" ]]; then
        cat
    else
        jq -r '.data.users.nodes[] | "\(.name)\t\(.email)\t\(.id)"' 2>/dev/null | column -t -s $'\t' || cat
    fi
}

fmt_create() {
    if [[ "$FORMAT" == "json" ]]; then
        cat
    else
        jq -r 'if .data.issueCreate.success then "✓ Created: \(.data.issueCreate.issue.identifier) - \(.data.issueCreate.issue.title)\n  URL: \(.data.issueCreate.issue.url)" else "✗ Error: \(.errors[0].message // "Creation failed")" end' 2>/dev/null || cat
    fi
}

fmt_update() {
    if [[ "$FORMAT" == "json" ]]; then
        cat
    else
        jq -r 'if .data.issueUpdate.success then "✓ Updated: \(.data.issueUpdate.issue.identifier) - \(.data.issueUpdate.issue.title) [\(.data.issueUpdate.issue.state.name)]" else "✗ Error: \(.errors[0].message // "Update failed")" end' 2>/dev/null || cat
    fi
}

fmt_comment() {
    if [[ "$FORMAT" == "json" ]]; then
        cat
    else
        jq -r 'if .data.commentCreate.success then "✓ Comment added" else "✗ Error: \(.errors[0].message // "Comment failed")" end' 2>/dev/null || cat
    fi
}

# Commands
cmd_viewer() {
    gql '{"query": "{ viewer { id name email } }"}'
}

cmd_issues_mine() {
    gql '{"query": "{ viewer { assignedIssues(first: 50) { nodes { id identifier title state { name } priority createdAt } } } }"}' | fmt_issues
}

cmd_issues_team() {
    local team_id="$1"
    gql "{\"query\": \"{ team(id: \\\"$team_id\\\") { issues(first: 50) { nodes { id identifier title state { name } assignee { name } priority } } } }\"}" | fmt_issues
}

cmd_get() {
    local issue_id="$1"
    gql "{\"query\": \"{ issue(id: \\\"$issue_id\\\") { id identifier title description state { id name } assignee { id name } team { id name } priority labels { nodes { name } } createdAt updatedAt } }\"}" | fmt_issue
}

cmd_search() {
    local query="$1"
    gql "{\"query\": \"{ searchIssues(term: \\\"$query\\\", first: 20) { nodes { id identifier title state { name } team { name } } } }\"}" | fmt_issues
}

cmd_states() {
    local team_id="${1:-}"
    if [[ -n "$team_id" ]]; then
        gql "{\"query\": \"{ team(id: \\\"$team_id\\\") { states { nodes { id name type } } } }\"}" | fmt_states
    else
        gql '{"query": "{ workflowStates { nodes { id name type team { name } } } }"}' | fmt_states
    fi
}

cmd_create() {
    local team_id="" title="" description="" priority="" state_id="" assignee_id=""
    
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --team) team_id="$2"; shift 2 ;;
            --title) title="$2"; shift 2 ;;
            --description) description="$2"; shift 2 ;;
            --priority) priority="$2"; shift 2 ;;
            --state) state_id="$2"; shift 2 ;;
            --assignee) assignee_id="$2"; shift 2 ;;
            *) shift ;;
        esac
    done
    
    if [[ -z "$team_id" || -z "$title" ]]; then
        echo "Error: --team and --title are required" >&2
        exit 1
    fi
    
    # Build input object
    local input="teamId: \\\"$team_id\\\", title: \\\"$title\\\""
    [[ -n "$description" ]] && input="$input, description: \\\"$description\\\""
    [[ -n "$priority" ]] && input="$input, priority: $priority"
    [[ -n "$state_id" ]] && input="$input, stateId: \\\"$state_id\\\""
    [[ -n "$assignee_id" ]] && input="$input, assigneeId: \\\"$assignee_id\\\""
    
    gql "{\"query\": \"mutation { issueCreate(input: { $input }) { success issue { id identifier title url } } }\"}" | fmt_create
}

cmd_update() {
    local issue_id="$1"; shift
    local title="" description="" state_id="" assignee_id="" priority=""
    
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --title) title="$2"; shift 2 ;;
            --description) description="$2"; shift 2 ;;
            --state) state_id="$2"; shift 2 ;;
            --assignee) assignee_id="$2"; shift 2 ;;
            --priority) priority="$2"; shift 2 ;;
            *) shift ;;
        esac
    done
    
    # Build input object
    local input=""
    [[ -n "$title" ]] && input="title: \\\"$title\\\""
    [[ -n "$description" ]] && { [[ -n "$input" ]] && input="$input, "; input="${input}description: \\\"$description\\\""; }
    [[ -n "$state_id" ]] && { [[ -n "$input" ]] && input="$input, "; input="${input}stateId: \\\"$state_id\\\""; }
    [[ -n "$assignee_id" ]] && { [[ -n "$input" ]] && input="$input, "; input="${input}assigneeId: \\\"$assignee_id\\\""; }
    [[ -n "$priority" ]] && { [[ -n "$input" ]] && input="$input, "; input="${input}priority: $priority"; }
    
    if [[ -z "$input" ]]; then
        echo "Error: No update fields provided" >&2
        exit 1
    fi
    
    gql "{\"query\": \"mutation { issueUpdate(id: \\\"$issue_id\\\", input: { $input }) { success issue { id identifier title state { name } } } }\"}" | fmt_update
}

cmd_comment() {
    local issue_id="$1"
    local body="$2"
    gql "{\"query\": \"mutation { commentCreate(input: { issueId: \\\"$issue_id\\\", body: \\\"$body\\\" }) { success comment { id body } } }\"}" | fmt_comment
}

cmd_users() {
    gql '{"query": "{ users { nodes { id name email } } }"}' | fmt_users
}

cmd_projects() {
    gql '{"query": "{ projects { nodes { id name state } } }"}'
}

cmd_teams() {
    gql '{"query": "{ teams { nodes { id name key } } }"}' | fmt_teams
}

# Help
cmd_help() {
    cat <<EOF
Linear CLI for Clawdbot

Usage: linear.sh [--json] <command> [options]

Global flags:
  --json              Output raw JSON (default: pretty-printed)
  --pretty            Output human-readable format (default)

Commands:
  viewer              Show current user info
  teams               List all teams
  issues --mine       List issues assigned to you
  issues --team ID    List issues for a team
  get ISSUE_ID        Get issue details (use identifier like "ENG-123")
  search QUERY        Search issues
  states [TEAM_ID]    List workflow states
  create OPTIONS      Create an issue
  update ID OPTIONS   Update an issue
  comment ID BODY     Add a comment to an issue
  users               List workspace users
  projects            List projects

Create options:
  --team ID           Team ID (required)
  --title TEXT        Issue title (required)
  --description TEXT  Issue description
  --priority NUM      Priority (0=none, 1=urgent, 2=high, 3=normal, 4=low)
  --state ID          Initial state ID
  --assignee ID       Assignee user ID

Update options:
  --title TEXT        New title
  --description TEXT  New description
  --state ID          New state ID
  --assignee ID       New assignee ID
  --priority NUM      New priority

Examples:
  linear.sh issues --mine
  linear.sh create --team abc123 --title "Fix login bug" --priority 2
  linear.sh update ENG-123 --state def456
  linear.sh comment ENG-123 "Fixed in PR #42"
EOF
}

# Parse global flags
while [[ "${1:-}" == --* ]]; do
    case "$1" in
        --json) FORMAT="json"; shift ;;
        --pretty) FORMAT="pretty"; shift ;;
        *) break ;;
    esac
done

# Main
case "${1:-help}" in
    viewer) cmd_viewer ;;
    teams) cmd_teams ;;
    issues)
        case "${2:-}" in
            --mine) cmd_issues_mine ;;
            --team) cmd_issues_team "${3:-}" ;;
            *) echo "Usage: issues --mine | --team TEAM_ID" >&2; exit 1 ;;
        esac
        ;;
    get) cmd_get "${2:-}" ;;
    search) cmd_search "${2:-}" ;;
    states) cmd_states "${2:-}" ;;
    create) shift; cmd_create "$@" ;;
    update) shift; cmd_update "$@" ;;
    comment) cmd_comment "${2:-}" "${3:-}" ;;
    users) cmd_users ;;
    projects) cmd_projects ;;
    help|--help|-h) cmd_help ;;
    *) echo "Unknown command: $1" >&2; cmd_help; exit 1 ;;
esac

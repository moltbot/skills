#!/bin/bash
# Perplexity API wrapper for OpenClaw
# Based on: https://docs.perplexity.ai/api-reference/chat-completions
# Author: Contribution to openclaw/skills

set -euo pipefail

# Configuration
API_KEY="${PERPLEXITY_API_KEY:-}"
DEFAULT_MODEL="sonar"
API_URL="https://api.perplexity.ai/chat/completions"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Usage function
usage() {
    cat << EOF
Perplexity AI Search - OpenClaw Skill

Usage: $0 <query> [options]

Options:
    -m, --model <model>     Model to use (default: sonar)
    -h, --help              Show this help message

Available Models:
    sonar                   Default search model (fast, general queries)
    sonar-pro               Advanced search with deeper understanding
    sonar-reasoning         Complex reasoning with web search
    sonar-research          Comprehensive research with exhaustive analysis

Examples:
    $0 "What are the top tech companies hiring in 2026?"
    $0 "Explain quantum computing" -m sonar-reasoning
    $0 "Research the history of AI" -m sonar-research

Environment Variables:
    PERPLEXITY_API_KEY      API key for Perplexity (required)
    PERPLEXITY_MODEL        Default model to use

EOF
    exit 0
}

# Error handling
error() {
    echo -e "${RED}Error: $1${NC}" >&2
    exit 1
}

success() {
    echo -e "${GREEN}$1${NC}"
}

warning() {
    echo -e "${YELLOW}$1${NC}" >&2
}

# Parse arguments
QUERY=""
MODEL="$DEFAULT_MODEL"

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            usage
            ;;
        -m|--model)
            MODEL="$2"
            shift 2
            ;;
        *)
            if [ -z "$QUERY" ]; then
                QUERY="$1"
            else
                QUERY="$QUERY $1"
            fi
            shift
            ;;
    esac
done

# Validate inputs
if [ -z "$QUERY" ]; then
    error "No query provided. Use -h for help."
fi

if [ -z "$API_KEY" ]; then
    error "PERPLEXITY_API_KEY environment variable not set"
fi

# Validate model
case $MODEL in
    sonar|sonar-pro|sonar-reasoning|sonar-research)
        ;;
    *)
        warning "Unknown model '$MODEL', using default 'sonar'"
        MODEL="sonar"
        ;;
esac

# Make API request
response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL" \
    -H "Authorization: Bearer $API_KEY" \
    -H "Content-Type: application/json" \
    -d "{
        \"model\": \"$MODEL\",
        \"messages\": [{\"role\": \"user\", \"content\": $(echo "$QUERY" | jq -Rs .)}]
    }")

# Extract HTTP status code and body
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

# Check for errors
if [ "$http_code" -ne 200 ]; then
    error_msg=$(echo "$body" | jq -r '.error.message // "Unknown error"')
    error "API request failed (HTTP $http_code): $error_msg"
fi

# Extract and display result
result=$(echo "$body" | jq -r '.choices[0].message.content // empty')

if [ -z "$result" ]; then
    error "No response from API"
fi

echo "$result"

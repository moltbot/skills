#!/bin/bash
#
# Perplexity API client for web search and Q&A.
# Uses the pplx-api for grounded search and reasoning.
#

set -e

# Configuration
PERPLEXITY_API_URL="https://api.perplexity.ai/chat/completions"

# Default values
MODEL="sonar"
MAX_TOKENS=4096
TEMPERATURE="0.0"
SEARCH_CONTEXT="medium"
FORMAT="text"
SYSTEM_PROMPT=""

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -m|--model)
            MODEL="$2"
            shift 2
            ;;
        -t|--max-tokens)
            MAX_TOKENS="$2"
            shift 2
            ;;
        --temperature)
            TEMPERATURE="$2"
            shift 2
            ;;
        -c|--context)
            SEARCH_CONTEXT="$2"
            shift 2
            ;;
        -s|--system)
            SYSTEM_PROMPT="$2"
            shift 2
            ;;
        -f|--format)
            FORMAT="$2"
            shift 2
            ;;
        --list-models)
            echo "Available Perplexity Models (cost-controlled):"
            echo ""
            echo "  sonar - Default search model with web access (cost-effective)"
            echo ""
            echo "Note: Other models are disabled for cost control."
            exit 0
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS] QUERY"
            echo ""
            echo "Options:"
            echo "  -m, --model MODEL       Model to use (default: sonar, only available model)"
            echo "  -t, --max-tokens NUM   Maximum tokens (default: 4096)"
            echo "  --temperature NUM      Sampling temperature 0-1 (default: 0.0)"
            echo "  -c, --context SIZE     Search context: low/medium/high (default: medium)"
            echo "  -s, --system PROMPT   System prompt to guide the AI"
            echo "  -f, --format FORMAT   Output format: text/markdown/json (default: text)"
            echo "  --list-models         List available models"
            echo "  -h, --help            Show this help"
            echo ""
            echo "Examples:"
            echo "  $0 \"What is the capital of Germany?\""
            echo "  $0 \"Latest AI news\" -f markdown"
            echo "  $0 \"Market analysis for EVs\" -c high -f markdown"
            exit 0
            ;;
        *)
            break
            ;;
    esac
done

# Validate model - only allow sonar for cost control
if [ "$MODEL" != "sonar" ]; then
    echo "Error: Only 'sonar' model is available for cost control." >&2
    echo "Requested model: $MODEL" >&2
    exit 1
fi

# Check if query is provided
if [ $# -eq 0 ]; then
    echo "Error: No query provided"
    echo "Use -h or --help for usage information"
    exit 1
fi

# Join remaining arguments as query
QUERY="$*"

# Get API key from config file or environment variable
get_api_key() {
    # 1. Try skill-specific config file
    local script_dir
    script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    local config_file="$script_dir/../config.json"

    if [ -f "$config_file" ]; then
        local config_key
        config_key=$(python3 -c "import json; f=open('$config_file'); print(json.load(f).get('apiKey', '')); f.close()" 2>/dev/null || echo "")
        if [ -n "$config_key" ]; then
            echo "$config_key"
            return
        fi
    fi

    # 2. Try environment variable
    if [ -n "$PERPLEXITY_API_KEY" ]; then
        echo "$PERPLEXITY_API_KEY"
        return
    fi

    # 3. No key found
    echo ""
}

API_KEY=$(get_api_key)

if [ -z "$API_KEY" ]; then
    echo "Error: No API key found." >&2
    echo "" >&2
    echo "Set one of the following:" >&2
    echo "  1. Create config.json: $(dirname "$(dirname "$0")")/config.json" >&2
    echo "     {\"apiKey\": \"your-key-here\"}" >&2
    echo "  2. Environment variable: export PERPLEXITY_API_KEY='your-key-here'" >&2
    exit 1
fi

# Build JSON body
BODY=$(python3 -c "
import json

system_prompt = '''$SYSTEM_PROMPT'''
if system_prompt:
    messages = [
        {'role': 'system', 'content': system_prompt},
        {'role': 'user', 'content': '''$QUERY'''}
    ]
else:
    messages = [
        {'role': 'user', 'content': '''$QUERY'''}
    ]

body = {
    'model': '$MODEL',
    'messages': messages,
    'max_tokens': $MAX_TOKENS,
    'temperature': $TEMPERATURE,
    'stream': False,
}

# Add search context for sonar model
if '$MODEL' == 'sonar':
    body['search_context_size'] = '$SEARCH_CONTEXT'

print(json.dumps(body))
")

# Make API request
RESPONSE=$(curl -s -X POST "$PERPLEXITY_API_URL" \
    -H "Authorization: Bearer $API_KEY" \
    -H "Content-Type: application/json" \
    -H "Accept: application/json" \
    -d "$BODY")

# Check for errors
if echo "$RESPONSE" | python3 -c "import json, sys; data = json.load(sys.stdin); sys.exit(0 if 'choices' in data else 1)"; then
    # Success - format output
    case "$FORMAT" in
        json)
            echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
            ;;
        markdown)
            CONTENT=$(echo "$RESPONSE" | python3 -c "import json, sys; data = json.load(sys.stdin); print(data['choices'][0]['message']['content'])")
            CITATIONS=$(echo "$RESPONSE" | python3 -c "import json, sys; data = json.load(sys.stdin); print(' '.join(data.get('citations', [])))" 2>/dev/null || "")

            echo "$CONTENT"

            if [ -n "$CITATIONS" ]; then
                echo ""
                echo "### Quellen:"
                i=1
                for url in $CITATIONS; do
                    echo "$i. $url"
                    ((i++))
                done
            fi
            ;;
        *)
            CONTENT=$(echo "$RESPONSE" | python3 -c "import json, sys; data = json.load(sys.stdin); print(data['choices'][0]['message']['content'])")
            CITATIONS=$(echo "$RESPONSE" | python3 -c "import json, sys; data = json.load(sys.stdin); print(' '.join(data.get('citations', [])))" 2>/dev/null || "")

            echo "$CONTENT"

            if [ -n "$CITATIONS" ]; then
                echo ""
                echo "Quellen:"
                i=1
                for url in $CITATIONS; do
                    echo "[$i] $url"
                    ((i++))
                done
            fi
            ;;
    esac
else
    # Error
    ERROR=$(echo "$RESPONSE" | python3 -c "import json, sys; data = json.load(sys.stdin); print(data.get('error', {}).get('message', 'Unknown error'))" 2>/dev/null || echo "Unknown error")
    echo "Error: $ERROR" >&2
    exit 1
fi

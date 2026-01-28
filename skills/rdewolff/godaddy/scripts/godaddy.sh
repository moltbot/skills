#!/usr/bin/env bash
# GoDaddy DNS Management CLI
# Usage: godaddy.sh <resource> <action> [options]

set -e

# Load config
if [[ -z "$GODADDY_API_KEY" ]] || [[ -z "$GODADDY_API_SECRET" ]]; then
  CONFIG_FILE="${HOME}/.clawdbot/clawdbot.json"
  if [[ -f "$CONFIG_FILE" ]]; then
    GODADDY_API_KEY=$(grep -A5 '"godaddy"' "$CONFIG_FILE" | grep '"apiKey"' | cut -d'"' -f4)
    GODADDY_API_SECRET=$(grep -A5 '"godaddy"' "$CONFIG_FILE" | grep '"apiSecret"' | cut -d'"' -f4)
  fi
fi

if [[ -z "$GODADDY_API_KEY" ]] || [[ -z "$GODADDY_API_SECRET" ]]; then
  echo "Error: GODADDY_API_KEY and GODADDY_API_SECRET required"
  echo "Set via environment or in ~/.clawdbot/clawdbot.json under skills.entries.godaddy"
  exit 1
fi

API_BASE="https://api.godaddy.com"
AUTH_HEADER="Authorization: sso-key ${GODADDY_API_KEY}:${GODADDY_API_SECRET}"

# API request helper
api() {
  local method="$1"
  local endpoint="$2"
  shift 2
  
  curl -s -X "$method" "${API_BASE}${endpoint}" \
    -H "$AUTH_HEADER" \
    -H "Content-Type: application/json" \
    "$@"
}

# Format DNS records output
format_records() {
  python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if isinstance(data, dict) and 'code' in data:
        print(f\"Error: {data.get('message', data)}\")
        sys.exit(1)
    for r in data:
        ttl = r.get('ttl', '-')
        priority = r.get('priority', '')
        prio_str = f' (pri:{priority})' if priority else ''
        print(f\"{r.get('type', '?'):6} {r.get('name', '@'):30} {r.get('data', '-')[:50]}{prio_str}  TTL:{ttl}\")
except Exception as e:
    print(f'Error: {e}', file=sys.stderr)
    sys.exit(1)
"
}

# Commands
cmd_domains() {
  local action="${1:-list}"
  
  case "$action" in
    list)
      echo "🌐 Listing domains..."
      api GET "/v1/domains" | python3 -c "
import sys, json
data = json.load(sys.stdin)
if isinstance(data, list):
    for d in data:
        status = '✅' if d.get('status') == 'ACTIVE' else '⚠️'
        print(f\"{status} {d.get('domain')}  expires: {d.get('expires', 'N/A')[:10]}\")
else:
    print(f\"Error: {data}\")
"
      ;;
    *)
      echo "Usage: domains [list]"
      ;;
  esac
}

cmd_dns() {
  local action="${1:-list}"
  shift || true
  
  case "$action" in
    list)
      local domain="$1"
      shift || true
      local type=""
      
      while [[ $# -gt 0 ]]; do
        case "$1" in
          --type|-t) type="$2"; shift 2 ;;
          *) shift ;;
        esac
      done
      
      if [[ -z "$domain" ]]; then
        echo "Usage: dns list <domain> [--type A|CNAME|TXT|MX|...]"
        exit 1
      fi
      
      echo "📋 DNS records for $domain${type:+ (type: $type)}..."
      
      if [[ -n "$type" ]]; then
        api GET "/v1/domains/${domain}/records/${type}" | format_records
      else
        api GET "/v1/domains/${domain}/records" | format_records
      fi
      ;;
    
    get)
      local domain="$1"
      local type="$2"
      local name="$3"
      
      if [[ -z "$domain" ]] || [[ -z "$type" ]] || [[ -z "$name" ]]; then
        echo "Usage: dns get <domain> <type> <name>"
        exit 1
      fi
      
      api GET "/v1/domains/${domain}/records/${type}/${name}" | format_records
      ;;
    
    add)
      local domain="$1"
      shift || true
      local type="" name="" data="" ttl="3600" priority=""
      
      while [[ $# -gt 0 ]]; do
        case "$1" in
          --type|-t) type="$2"; shift 2 ;;
          --name|-n) name="$2"; shift 2 ;;
          --data|-d) data="$2"; shift 2 ;;
          --ttl) ttl="$2"; shift 2 ;;
          --priority|-p) priority="$2"; shift 2 ;;
          *) shift ;;
        esac
      done
      
      if [[ -z "$domain" ]] || [[ -z "$type" ]] || [[ -z "$name" ]] || [[ -z "$data" ]]; then
        echo "Usage: dns add <domain> --type TYPE --name NAME --data DATA [--ttl TTL] [--priority PRI]"
        exit 1
      fi
      
      echo "➕ Adding ${type} record: ${name}.${domain} → ${data}"
      
      local json_data
      if [[ -n "$priority" ]]; then
        json_data="[{\"type\":\"${type}\",\"name\":\"${name}\",\"data\":\"${data}\",\"ttl\":${ttl},\"priority\":${priority}}]"
      else
        json_data="[{\"type\":\"${type}\",\"name\":\"${name}\",\"data\":\"${data}\",\"ttl\":${ttl}}]"
      fi
      
      result=$(api PATCH "/v1/domains/${domain}/records" -d "$json_data")
      
      if [[ -z "$result" ]]; then
        echo "✅ Record added successfully"
      else
        echo "$result" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if 'code' in data:
        print(f\"❌ Error: {data.get('message', data)}\")
    else:
        print(f'Response: {data}')
except:
    print(sys.stdin.read())
"
      fi
      ;;
    
    update)
      local domain="$1"
      shift || true
      local type="" name="" data="" ttl="3600" priority=""
      
      while [[ $# -gt 0 ]]; do
        case "$1" in
          --type|-t) type="$2"; shift 2 ;;
          --name|-n) name="$2"; shift 2 ;;
          --data|-d) data="$2"; shift 2 ;;
          --ttl) ttl="$2"; shift 2 ;;
          --priority|-p) priority="$2"; shift 2 ;;
          *) shift ;;
        esac
      done
      
      if [[ -z "$domain" ]] || [[ -z "$type" ]] || [[ -z "$name" ]] || [[ -z "$data" ]]; then
        echo "Usage: dns update <domain> --type TYPE --name NAME --data DATA [--ttl TTL]"
        exit 1
      fi
      
      echo "🔄 Updating ${type} record: ${name}.${domain} → ${data}"
      
      local json_data
      if [[ -n "$priority" ]]; then
        json_data="[{\"data\":\"${data}\",\"ttl\":${ttl},\"priority\":${priority}}]"
      else
        json_data="[{\"data\":\"${data}\",\"ttl\":${ttl}}]"
      fi
      
      result=$(api PUT "/v1/domains/${domain}/records/${type}/${name}" -d "$json_data")
      
      if [[ -z "$result" ]]; then
        echo "✅ Record updated successfully"
      else
        echo "$result" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if 'code' in data:
        print(f\"❌ Error: {data.get('message', data)}\")
    else:
        print(f'Response: {data}')
except:
    print(sys.stdin.read())
"
      fi
      ;;
    
    delete)
      local domain="$1"
      shift || true
      local type="" name=""
      
      while [[ $# -gt 0 ]]; do
        case "$1" in
          --type|-t) type="$2"; shift 2 ;;
          --name|-n) name="$2"; shift 2 ;;
          *) shift ;;
        esac
      done
      
      if [[ -z "$domain" ]] || [[ -z "$type" ]] || [[ -z "$name" ]]; then
        echo "Usage: dns delete <domain> --type TYPE --name NAME"
        exit 1
      fi
      
      echo "🗑️ Deleting ${type} record: ${name}.${domain}"
      
      result=$(api DELETE "/v1/domains/${domain}/records/${type}/${name}")
      
      if [[ -z "$result" ]]; then
        echo "✅ Record deleted successfully"
      else
        echo "$result" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if 'code' in data:
        print(f\"❌ Error: {data.get('message', data)}\")
    else:
        print(f'Response: {data}')
except:
    print(sys.stdin.read())
"
      fi
      ;;
    
    *)
      echo "Usage: dns [list|get|add|update|delete]"
      echo "  list <domain> [--type TYPE]"
      echo "  get <domain> <type> <name>"
      echo "  add <domain> --type TYPE --name NAME --data DATA [--ttl TTL]"
      echo "  update <domain> --type TYPE --name NAME --data DATA [--ttl TTL]"
      echo "  delete <domain> --type TYPE --name NAME"
      ;;
  esac
}

# Main
resource="${1:-help}"
shift || true

case "$resource" in
  domains|d) cmd_domains "$@" ;;
  dns) cmd_dns "$@" ;;
  help|--help|-h)
    echo "GoDaddy DNS CLI"
    echo ""
    echo "Usage: godaddy.sh <resource> <action> [options]"
    echo ""
    echo "Resources:"
    echo "  domains (d)  - List domains"
    echo "  dns          - Manage DNS records"
    echo ""
    echo "Examples:"
    echo "  godaddy.sh domains list"
    echo "  godaddy.sh dns list example.com"
    echo "  godaddy.sh dns add example.com --type A --name www --data 1.2.3.4"
    echo "  godaddy.sh dns delete example.com --type A --name www"
    ;;
  *)
    echo "Unknown resource: $resource"
    echo "Run 'godaddy.sh help' for usage"
    exit 1
    ;;
esac

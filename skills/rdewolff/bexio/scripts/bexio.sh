#!/bin/bash
# Bexio API CLI
# Usage: bexio.sh <resource> <command> [args...]

set -e

# Show help if no args
if [ -z "$1" ]; then
  echo "Bexio CLI - Swiss Business Software API"
  echo ""
  echo "Resources:"
  echo "  contacts    Manage contacts (list, search, show, create, edit)"
  echo "  quotes      Manage quotes/offers (list, search, show, create, clone, send)"
  echo "  invoices    Manage invoices (list, search, show, create, issue, send, cancel)"
  echo "  orders      Manage orders (list, search, show, create)"
  echo "  items       Manage items/products (list, search, show)"
  echo ""
  echo "Usage: bexio.sh <resource> <command> [options]"
  echo ""
  echo "Examples:"
  echo "  bexio.sh contacts list"
  echo "  bexio.sh contacts search \"Acme\""
  echo "  bexio.sh invoices create --contact 123 --title \"Monthly Invoice\""
  exit 0
fi

# Get access token from env or clawdbot config
if [ -z "$BEXIO_ACCESS_TOKEN" ]; then
  BEXIO_ACCESS_TOKEN=$(python3 -c "
import json
try:
    with open('$HOME/.clawdbot/clawdbot.json') as f:
        cfg = json.load(f)
    token = cfg.get('skills', {}).get('entries', {}).get('bexio', {}).get('accessToken', '')
    print(token)
except: pass
" 2>/dev/null || echo "")
fi

if [ -z "$BEXIO_ACCESS_TOKEN" ]; then
  echo "Error: BEXIO_ACCESS_TOKEN not set."
  echo "Configure in ~/.clawdbot/clawdbot.json under skills.entries.bexio.accessToken"
  echo "Or set env var BEXIO_ACCESS_TOKEN"
  exit 1
fi

API_URL="https://api.bexio.com"

# Helper function for API calls
bexio_api() {
  local method="$1"
  local endpoint="$2"
  local data="$3"
  
  if [ -n "$data" ]; then
    curl -s -X "$method" "$API_URL$endpoint" \
      -H "Authorization: Bearer $BEXIO_ACCESS_TOKEN" \
      -H "Accept: application/json" \
      -H "Content-Type: application/json" \
      -d "$data"
  else
    curl -s -X "$method" "$API_URL$endpoint" \
      -H "Authorization: Bearer $BEXIO_ACCESS_TOKEN" \
      -H "Accept: application/json"
  fi
}

# Format contact output
format_contacts() {
  python3 -c "
import json, sys
data = json.load(sys.stdin)
if isinstance(data, dict) and 'error_code' in data:
    print(f\"Error: {data.get('message', 'Unknown error')}\")
    sys.exit(1)
contacts = data if isinstance(data, list) else [data]
for c in contacts:
    ctype = '🏢' if c.get('contact_type_id') == 1 else '👤'
    name = c.get('name_1', '') or ''
    name2 = c.get('name_2', '')
    if name2: name = f'{name} {name2}'
    email = c.get('mail', '') or ''
    print(f\"{ctype} {c.get('id')}\t{name[:30]}\t{email[:30]}\")
"
}

# Format quotes output
format_quotes() {
  python3 -c "
import json, sys
data = json.load(sys.stdin)
if isinstance(data, dict) and 'error_code' in data:
    print(f\"Error: {data.get('message', 'Unknown error')}\")
    sys.exit(1)
quotes = data if isinstance(data, list) else [data]
status_map = {1: '📝 Draft', 2: '📤 Pending', 3: '✅ Accepted', 4: '❌ Declined'}
for q in quotes:
    status = status_map.get(q.get('kb_item_status_id', 1), '❓')
    title = q.get('title', '')[:35]
    total = q.get('total_gross', q.get('total', '0'))
    print(f\"{q.get('id')}\t{q.get('document_nr', '-')}\t{status}\t{total}\t{title}\")
"
}

# Format invoices output
format_invoices() {
  python3 -c "
import json, sys
data = json.load(sys.stdin)
if isinstance(data, dict) and 'error_code' in data:
    print(f\"Error: {data.get('message', 'Unknown error')}\")
    sys.exit(1)
invoices = data if isinstance(data, list) else [data]
status_map = {7: '📝 Draft', 8: '📤 Pending', 9: '💰 Paid', 16: '⚠️ Partial', 19: '❌ Canceled'}
for i in invoices:
    status = status_map.get(i.get('kb_item_status_id', 7), '❓')
    title = i.get('title', '')[:35]
    total = i.get('total_gross', i.get('total', '0'))
    print(f\"{i.get('id')}\t{i.get('document_nr', '-')}\t{status}\t{total}\t{title}\")
"
}

# Format orders output
format_orders() {
  python3 -c "
import json, sys
data = json.load(sys.stdin)
if isinstance(data, dict) and 'error_code' in data:
    print(f\"Error: {data.get('message', 'Unknown error')}\")
    sys.exit(1)
orders = data if isinstance(data, list) else [data]
status_map = {5: '📝 Draft', 6: '📤 Pending', 10: '✅ Done'}
for o in orders:
    status = status_map.get(o.get('kb_item_status_id', 5), '❓')
    title = o.get('title', '')[:35]
    total = o.get('total_gross', o.get('total', '0'))
    print(f\"{o.get('id')}\t{o.get('document_nr', '-')}\t{status}\t{total}\t{title}\")
"
}

# Format items output
format_items() {
  python3 -c "
import json, sys
data = json.load(sys.stdin)
if isinstance(data, dict) and 'error_code' in data:
    print(f\"Error: {data.get('message', 'Unknown error')}\")
    sys.exit(1)
items = data if isinstance(data, list) else [data]
for i in items:
    code = i.get('intern_code', i.get('intern_name', ''))[:15]
    name = i.get('intern_name', '')[:35]
    price = i.get('sale_price', '0')
    print(f\"{i.get('id')}\t{code}\t{price}\t{name}\")
"
}

# Show detailed contact
show_contact() {
  python3 -c "
import json, sys
data = json.load(sys.stdin)
if isinstance(data, dict) and 'error_code' in data:
    print(f\"Error: {data.get('message', 'Unknown error')}\")
    sys.exit(1)
c = data
ctype = '🏢 Company' if c.get('contact_type_id') == 1 else '👤 Person'
print(f\"{ctype}: {c.get('name_1', '')} {c.get('name_2', '')}\")
print(f\"ID: {c.get('id')}\")
if c.get('mail'): print(f\"Email: {c.get('mail')}\")
if c.get('phone_fixed'): print(f\"Phone: {c.get('phone_fixed')}\")
if c.get('phone_mobile'): print(f\"Mobile: {c.get('phone_mobile')}\")
addr = ' '.join(filter(None, [c.get('address'), c.get('postcode'), c.get('city')]))
if addr: print(f\"Address: {addr}\")
if c.get('country_id'): print(f\"Country ID: {c.get('country_id')}\")
if c.get('url'): print(f\"Website: {c.get('url')}\")
if c.get('remarks'): print(f\"Notes: {c.get('remarks')[:100]}\")
"
}

# Show detailed document (quote/invoice/order)
show_document() {
  local doctype="$1"
  python3 -c "
import json, sys
data = json.load(sys.stdin)
if isinstance(data, dict) and 'error_code' in data:
    print(f\"Error: {data.get('message', 'Unknown error')}\")
    sys.exit(1)
d = data
doctype = '$doctype'
status_map = {
    1: 'Draft', 2: 'Pending', 3: 'Accepted', 4: 'Declined',
    5: 'Draft', 6: 'Pending', 7: 'Draft', 8: 'Pending',
    9: 'Paid', 10: 'Done', 16: 'Partial', 19: 'Canceled'
}
print(f\"📄 {doctype.title()}: {d.get('document_nr', 'N/A')}\")
print(f\"ID: {d.get('id')}\")
print(f\"Title: {d.get('title', 'N/A')}\")
print(f\"Status: {status_map.get(d.get('kb_item_status_id', 0), 'Unknown')}\")
print(f\"Contact ID: {d.get('contact_id', 'N/A')}\")
print(f\"Date: {d.get('is_valid_from', d.get('valid_from', 'N/A'))}\")
print(f\"Total Net: {d.get('total_net', d.get('total', 'N/A'))}\")
print(f\"Total Gross: {d.get('total_gross', 'N/A')}\")
if d.get('positions'):
    print(f\"\\nLine Items ({len(d.get('positions', []))}):\")
    for p in d.get('positions', [])[:10]:
        text = p.get('text', '')[:40]
        qty = p.get('amount', 1)
        price = p.get('unit_price', 0)
        print(f\"  - {text} (x{qty} @ {price})\")
"
}

# Main command router
RESOURCE="$1"
COMMAND="$2"
shift 2 2>/dev/null || true

case "$RESOURCE" in
  contacts)
    case "$COMMAND" in
      list)
        LIMIT=100
        OFFSET=0
        while [ $# -gt 0 ]; do
          case "$1" in
            --limit) LIMIT="$2"; shift 2 ;;
            --offset) OFFSET="$2"; shift 2 ;;
            *) shift ;;
          esac
        done
        echo "📇 Listing contacts..."
        bexio_api GET "/2.0/contact?limit=$LIMIT&offset=$OFFSET" | format_contacts
        ;;
      
      search)
        QUERY="$1"
        if [ -z "$QUERY" ]; then
          echo "Usage: bexio.sh contacts search \"query\""
          exit 1
        fi
        echo "🔍 Searching contacts for: $QUERY"
        bexio_api POST "/2.0/contact/search" "[{\"field\": \"name_1\", \"value\": \"$QUERY\", \"criteria\": \"like\"}]" | format_contacts
        ;;
      
      show)
        ID="$1"
        if [ -z "$ID" ]; then
          echo "Usage: bexio.sh contacts show <id>"
          exit 1
        fi
        bexio_api GET "/2.0/contact/$ID" | show_contact
        ;;
      
      create)
        NAME=""
        URL=""
        CONTACT_TYPE="1"  # 1=company, 2=person
        EMAIL=""
        PHONE=""
        ADDRESS=""
        CITY=""
        POSTCODE=""
        while [ $# -gt 0 ]; do
          case "$1" in
            --name) NAME="$2"; shift 2 ;;
            --type) 
              case "$2" in
                company) CONTACT_TYPE="1" ;;
                person) CONTACT_TYPE="2" ;;
                *) CONTACT_TYPE="$2" ;;
              esac
              shift 2 ;;
            --email) EMAIL="$2"; shift 2 ;;
            --phone) PHONE="$2"; shift 2 ;;
            --url) URL="$2"; shift 2 ;;
            --address) ADDRESS="$2"; shift 2 ;;
            --city) CITY="$2"; shift 2 ;;
            --postcode) POSTCODE="$2"; shift 2 ;;
            *) shift ;;
          esac
        done
        
        if [ -z "$NAME" ]; then
          echo "Usage: bexio.sh contacts create --name \"Name\" [--type company|person] [--email x] [--phone x]"
          exit 1
        fi
        
        echo "📝 Creating contact: $NAME"
        DATA=$(python3 -c "
import json
data = {
    'name_1': '$NAME',
    'contact_type_id': $CONTACT_TYPE,
    'owner_id': 1
}
if '$EMAIL': data['mail'] = '$EMAIL'
if '$PHONE': data['phone_fixed'] = '$PHONE'
if '$URL': data['url'] = '$URL'
if '$ADDRESS': data['address'] = '$ADDRESS'
if '$CITY': data['city'] = '$CITY'
if '$POSTCODE': data['postcode'] = '$POSTCODE'
print(json.dumps(data))
")
        bexio_api POST "/2.0/contact" "$DATA" | python3 -c "
import json, sys
data = json.load(sys.stdin)
if 'error_code' in data:
    print(f\"❌ Error: {data.get('message', 'Unknown')}\")
else:
    print(f\"✅ Created contact ID: {data.get('id')}\")
"
        ;;
      
      edit)
        ID="$1"
        shift
        if [ -z "$ID" ]; then
          echo "Usage: bexio.sh contacts edit <id> [--name x] [--email x] [--phone x] [--url x]"
          exit 1
        fi
        
        NAME=""
        URL=""
        EMAIL=""
        PHONE=""
        while [ $# -gt 0 ]; do
          case "$1" in
            --name) NAME="$2"; shift 2 ;;
            --email) EMAIL="$2"; shift 2 ;;
            --phone) PHONE="$2"; shift 2 ;;
            --url) URL="$2"; shift 2 ;;
            *) shift ;;
          esac
        done
        
        echo "✏️ Editing contact $ID..."
        DATA=$(python3 -c "
import json
data = {}
if '$NAME': data['name_1'] = '$NAME'
if '$EMAIL': data['mail'] = '$EMAIL'
if '$PHONE': data['phone_fixed'] = '$PHONE'
if '$URL': data['url'] = '$URL'
print(json.dumps(data))
")
        bexio_api POST "/2.0/contact/$ID" "$DATA" | python3 -c "
import json, sys
data = json.load(sys.stdin)
if 'error_code' in data:
    print(f\"❌ Error: {data.get('message', 'Unknown')}\")
else:
    print(f\"✅ Updated contact ID: {data.get('id')}\")
"
        ;;
      
      *)
        echo "Contacts commands: list, search, show, create, edit"
        ;;
    esac
    ;;

  quotes|offers)
    case "$COMMAND" in
      list)
        LIMIT=100
        OFFSET=0
        while [ $# -gt 0 ]; do
          case "$1" in
            --limit) LIMIT="$2"; shift 2 ;;
            --offset) OFFSET="$2"; shift 2 ;;
            *) shift ;;
          esac
        done
        echo "📋 Listing quotes..."
        bexio_api GET "/2.0/kb_offer?limit=$LIMIT&offset=$OFFSET" | format_quotes
        ;;
      
      search)
        QUERY="$1"
        if [ -z "$QUERY" ]; then
          echo "Usage: bexio.sh quotes search \"query\""
          exit 1
        fi
        echo "🔍 Searching quotes for: $QUERY"
        bexio_api POST "/2.0/kb_offer/search" "[{\"field\": \"title\", \"value\": \"$QUERY\", \"criteria\": \"like\"}]" | format_quotes
        ;;
      
      show)
        ID="$1"
        if [ -z "$ID" ]; then
          echo "Usage: bexio.sh quotes show <id>"
          exit 1
        fi
        bexio_api GET "/2.0/kb_offer/$ID" | show_document "quote"
        ;;
      
      create)
        CONTACT_ID=""
        TITLE=""
        USER_ID="1"
        while [ $# -gt 0 ]; do
          case "$1" in
            --contact) CONTACT_ID="$2"; shift 2 ;;
            --title) TITLE="$2"; shift 2 ;;
            --user) USER_ID="$2"; shift 2 ;;
            *) shift ;;
          esac
        done
        
        if [ -z "$CONTACT_ID" ] || [ -z "$TITLE" ]; then
          echo "Usage: bexio.sh quotes create --contact <id> --title \"Title\""
          exit 1
        fi
        
        echo "📝 Creating quote: $TITLE"
        DATE=$(date +%Y-%m-%d)
        DATA=$(python3 -c "
import json
data = {
    'contact_id': $CONTACT_ID,
    'title': '$TITLE',
    'user_id': $USER_ID,
    'is_valid_from': '$DATE',
    'is_valid_until': '$DATE',
    'mwst_type': 0,
    'mwst_is_net': True
}
print(json.dumps(data))
")
        bexio_api POST "/2.0/kb_offer" "$DATA" | python3 -c "
import json, sys
data = json.load(sys.stdin)
if 'error_code' in data:
    print(f\"❌ Error: {data.get('message', 'Unknown')}\")
else:
    print(f\"✅ Created quote ID: {data.get('id')} - {data.get('document_nr', '')}\")
"
        ;;
      
      clone)
        ID="$1"
        if [ -z "$ID" ]; then
          echo "Usage: bexio.sh quotes clone <id>"
          exit 1
        fi
        echo "📋 Cloning quote $ID..."
        bexio_api POST "/2.0/kb_offer/$ID/copy" | python3 -c "
import json, sys
data = json.load(sys.stdin)
if 'error_code' in data:
    print(f\"❌ Error: {data.get('message', 'Unknown')}\")
else:
    print(f\"✅ Cloned to quote ID: {data.get('id')} - {data.get('document_nr', '')}\")
"
        ;;
      
      send)
        ID="$1"
        shift
        EMAIL=""
        SUBJECT=""
        MESSAGE=""
        while [ $# -gt 0 ]; do
          case "$1" in
            --email) EMAIL="$2"; shift 2 ;;
            --subject) SUBJECT="$2"; shift 2 ;;
            --message) MESSAGE="$2"; shift 2 ;;
            *) shift ;;
          esac
        done
        
        if [ -z "$ID" ] || [ -z "$EMAIL" ]; then
          echo "Usage: bexio.sh quotes send <id> --email \"recipient@email.com\" [--subject x] [--message x]"
          exit 1
        fi
        
        echo "📤 Sending quote $ID to $EMAIL..."
        DATA=$(python3 -c "
import json
data = {
    'recipient_email': '$EMAIL',
    'subject': '${SUBJECT:-Quote}',
    'message': '${MESSAGE:-Please find attached your quote.}',
    'mark_as_open': True
}
print(json.dumps(data))
")
        bexio_api POST "/2.0/kb_offer/$ID/send" "$DATA" | python3 -c "
import json, sys
data = json.load(sys.stdin)
if 'error_code' in data:
    print(f\"❌ Error: {data.get('message', 'Unknown')}\")
else:
    print(f\"✅ Quote sent successfully!\")
"
        ;;
      
      *)
        echo "Quotes commands: list, search, show, create, clone, send"
        ;;
    esac
    ;;

  invoices)
    case "$COMMAND" in
      list)
        LIMIT=100
        OFFSET=0
        while [ $# -gt 0 ]; do
          case "$1" in
            --limit) LIMIT="$2"; shift 2 ;;
            --offset) OFFSET="$2"; shift 2 ;;
            *) shift ;;
          esac
        done
        echo "🧾 Listing invoices..."
        bexio_api GET "/2.0/kb_invoice?limit=$LIMIT&offset=$OFFSET" | format_invoices
        ;;
      
      search)
        QUERY="$1"
        if [ -z "$QUERY" ]; then
          echo "Usage: bexio.sh invoices search \"query\""
          exit 1
        fi
        echo "🔍 Searching invoices for: $QUERY"
        bexio_api POST "/2.0/kb_invoice/search" "[{\"field\": \"title\", \"value\": \"$QUERY\", \"criteria\": \"like\"}]" | format_invoices
        ;;
      
      show)
        ID="$1"
        if [ -z "$ID" ]; then
          echo "Usage: bexio.sh invoices show <id>"
          exit 1
        fi
        bexio_api GET "/2.0/kb_invoice/$ID" | show_document "invoice"
        ;;
      
      create)
        CONTACT_ID=""
        TITLE=""
        USER_ID="1"
        while [ $# -gt 0 ]; do
          case "$1" in
            --contact) CONTACT_ID="$2"; shift 2 ;;
            --title) TITLE="$2"; shift 2 ;;
            --user) USER_ID="$2"; shift 2 ;;
            *) shift ;;
          esac
        done
        
        if [ -z "$CONTACT_ID" ] || [ -z "$TITLE" ]; then
          echo "Usage: bexio.sh invoices create --contact <id> --title \"Title\""
          exit 1
        fi
        
        echo "📝 Creating invoice: $TITLE"
        DATE=$(date +%Y-%m-%d)
        DATA=$(python3 -c "
import json
data = {
    'contact_id': $CONTACT_ID,
    'title': '$TITLE',
    'user_id': $USER_ID,
    'is_valid_from': '$DATE',
    'is_valid_to': '$DATE',
    'mwst_type': 0,
    'mwst_is_net': True
}
print(json.dumps(data))
")
        bexio_api POST "/2.0/kb_invoice" "$DATA" | python3 -c "
import json, sys
data = json.load(sys.stdin)
if 'error_code' in data:
    print(f\"❌ Error: {data.get('message', 'Unknown')}\")
else:
    print(f\"✅ Created invoice ID: {data.get('id')} - {data.get('document_nr', '')}\")
"
        ;;
      
      issue)
        ID="$1"
        if [ -z "$ID" ]; then
          echo "Usage: bexio.sh invoices issue <id>"
          exit 1
        fi
        echo "📤 Issuing invoice $ID..."
        bexio_api POST "/2.0/kb_invoice/$ID/issue" | python3 -c "
import json, sys
data = json.load(sys.stdin)
if 'error_code' in data:
    print(f\"❌ Error: {data.get('message', 'Unknown')}\")
else:
    print(f\"✅ Invoice issued! Status: Pending\")
"
        ;;
      
      send)
        ID="$1"
        shift
        EMAIL=""
        SUBJECT=""
        MESSAGE=""
        ATTACH_PDF=""
        while [ $# -gt 0 ]; do
          case "$1" in
            --email) EMAIL="$2"; shift 2 ;;
            --subject) SUBJECT="$2"; shift 2 ;;
            --message) MESSAGE="$2"; shift 2 ;;
            --attach-pdf) ATTACH_PDF="true"; shift ;;
            *) shift ;;
          esac
        done
        
        if [ -z "$ID" ] || [ -z "$EMAIL" ]; then
          echo "Usage: bexio.sh invoices send <id> --email \"recipient@email.com\" [--subject x] [--message x] [--attach-pdf]"
          exit 1
        fi
        
        echo "📤 Sending invoice $ID to $EMAIL..."
        DATA=$(python3 -c "
import json
data = {
    'recipient_email': '$EMAIL',
    'subject': '${SUBJECT:-Invoice}',
    'message': '${MESSAGE:-Please find attached your invoice.}',
    'mark_as_open': True
}
if '$ATTACH_PDF': data['attach_pdf'] = True
print(json.dumps(data))
")
        bexio_api POST "/2.0/kb_invoice/$ID/send" "$DATA" | python3 -c "
import json, sys
data = json.load(sys.stdin)
if 'error_code' in data:
    print(f\"❌ Error: {data.get('message', 'Unknown')}\")
else:
    print(f\"✅ Invoice sent successfully!\")
"
        ;;
      
      cancel)
        ID="$1"
        if [ -z "$ID" ]; then
          echo "Usage: bexio.sh invoices cancel <id>"
          exit 1
        fi
        echo "❌ Canceling invoice $ID..."
        bexio_api POST "/2.0/kb_invoice/$ID/cancel" | python3 -c "
import json, sys
data = json.load(sys.stdin)
if 'error_code' in data:
    print(f\"❌ Error: {data.get('message', 'Unknown')}\")
else:
    print(f\"✅ Invoice canceled!\")
"
        ;;
      
      *)
        echo "Invoices commands: list, search, show, create, issue, send, cancel"
        ;;
    esac
    ;;

  orders)
    case "$COMMAND" in
      list)
        LIMIT=100
        OFFSET=0
        while [ $# -gt 0 ]; do
          case "$1" in
            --limit) LIMIT="$2"; shift 2 ;;
            --offset) OFFSET="$2"; shift 2 ;;
            *) shift ;;
          esac
        done
        echo "📦 Listing orders..."
        bexio_api GET "/2.0/kb_order?limit=$LIMIT&offset=$OFFSET" | format_orders
        ;;
      
      search)
        QUERY="$1"
        if [ -z "$QUERY" ]; then
          echo "Usage: bexio.sh orders search \"query\""
          exit 1
        fi
        echo "🔍 Searching orders for: $QUERY"
        bexio_api POST "/2.0/kb_order/search" "[{\"field\": \"title\", \"value\": \"$QUERY\", \"criteria\": \"like\"}]" | format_orders
        ;;
      
      show)
        ID="$1"
        if [ -z "$ID" ]; then
          echo "Usage: bexio.sh orders show <id>"
          exit 1
        fi
        bexio_api GET "/2.0/kb_order/$ID" | show_document "order"
        ;;
      
      create)
        CONTACT_ID=""
        TITLE=""
        USER_ID="1"
        while [ $# -gt 0 ]; do
          case "$1" in
            --contact) CONTACT_ID="$2"; shift 2 ;;
            --title) TITLE="$2"; shift 2 ;;
            --user) USER_ID="$2"; shift 2 ;;
            *) shift ;;
          esac
        done
        
        if [ -z "$CONTACT_ID" ] || [ -z "$TITLE" ]; then
          echo "Usage: bexio.sh orders create --contact <id> --title \"Title\""
          exit 1
        fi
        
        echo "📝 Creating order: $TITLE"
        DATE=$(date +%Y-%m-%d)
        DATA=$(python3 -c "
import json
data = {
    'contact_id': $CONTACT_ID,
    'title': '$TITLE',
    'user_id': $USER_ID,
    'is_valid_from': '$DATE',
    'mwst_type': 0,
    'mwst_is_net': True
}
print(json.dumps(data))
")
        bexio_api POST "/2.0/kb_order" "$DATA" | python3 -c "
import json, sys
data = json.load(sys.stdin)
if 'error_code' in data:
    print(f\"❌ Error: {data.get('message', 'Unknown')}\")
else:
    print(f\"✅ Created order ID: {data.get('id')} - {data.get('document_nr', '')}\")
"
        ;;
      
      *)
        echo "Orders commands: list, search, show, create"
        ;;
    esac
    ;;

  items|products)
    case "$COMMAND" in
      list)
        LIMIT=100
        OFFSET=0
        while [ $# -gt 0 ]; do
          case "$1" in
            --limit) LIMIT="$2"; shift 2 ;;
            --offset) OFFSET="$2"; shift 2 ;;
            *) shift ;;
          esac
        done
        echo "📦 Listing items..."
        bexio_api GET "/2.0/article?limit=$LIMIT&offset=$OFFSET" | format_items
        ;;
      
      search)
        QUERY="$1"
        if [ -z "$QUERY" ]; then
          echo "Usage: bexio.sh items search \"query\""
          exit 1
        fi
        echo "🔍 Searching items for: $QUERY"
        bexio_api POST "/2.0/article/search" "[{\"field\": \"intern_name\", \"value\": \"$QUERY\", \"criteria\": \"like\"}]" | format_items
        ;;
      
      show)
        ID="$1"
        if [ -z "$ID" ]; then
          echo "Usage: bexio.sh items show <id>"
          exit 1
        fi
        bexio_api GET "/2.0/article/$ID" | python3 -c "
import json, sys
data = json.load(sys.stdin)
if 'error_code' in data:
    print(f\"Error: {data.get('message', 'Unknown')}\")
    sys.exit(1)
i = data
print(f\"📦 Item: {i.get('intern_name', 'N/A')}\")
print(f\"ID: {i.get('id')}\")
print(f\"Code: {i.get('intern_code', 'N/A')}\")
print(f\"Sale Price: {i.get('sale_price', 'N/A')}\")
print(f\"Purchase Price: {i.get('purchase_price', 'N/A')}\")
if i.get('intern_description'): print(f\"Description: {i.get('intern_description')[:200]}\")
if i.get('stock_id'): print(f\"Stock ID: {i.get('stock_id')}\")
if i.get('stock_nr'): print(f\"Stock Qty: {i.get('stock_nr')}\")
"
        ;;
      
      *)
        echo "Items commands: list, search, show"
        ;;
    esac
    ;;

  *)
    echo "Bexio CLI - Swiss Business Software API"
    echo ""
    echo "Resources:"
    echo "  contacts    Manage contacts (list, search, show, create, edit)"
    echo "  quotes      Manage quotes/offers (list, search, show, create, clone, send)"
    echo "  invoices    Manage invoices (list, search, show, create, issue, send, cancel)"
    echo "  orders      Manage orders (list, search, show, create)"
    echo "  items       Manage items/products (list, search, show)"
    echo ""
    echo "Usage: bexio.sh <resource> <command> [options]"
    echo ""
    echo "Examples:"
    echo "  bexio.sh contacts list"
    echo "  bexio.sh contacts search \"Acme\""
    echo "  bexio.sh invoices create --contact 123 --title \"Monthly Invoice\""
    ;;
esac

#!/bin/bash
# Pinch to Post v3.0 - Ultimate WordPress REST API Helper for Clawdbot 🦞
# Usage: wp-rest.sh <command> [options]

set -e

#===================
# CONFIGURATION
#===================

resolve_site() {
    local SITE="${1:-$WP_DEFAULT_SITE}"
    if [ -n "$SITE" ]; then
        local URL_VAR="WP_SITE_${SITE^^}_URL"
        local USER_VAR="WP_SITE_${SITE^^}_USER"
        local PASS_VAR="WP_SITE_${SITE^^}_PASS"
        [ -n "${!URL_VAR}" ] && WP_SITE_URL="${!URL_VAR}" && WP_USERNAME="${!USER_VAR}" && WP_APP_PASSWORD="${!PASS_VAR}"
    fi
}

WP_SITE_URL="${WP_SITE_URL:-}"
WP_USERNAME="${WP_USERNAME:-}"
WP_APP_PASSWORD="${WP_APP_PASSWORD:-}"
WC_CONSUMER_KEY="${WC_CONSUMER_KEY:-}"
WC_CONSUMER_SECRET="${WC_CONSUMER_SECRET:-}"

check_env() {
    [ -z "$WP_SITE_URL" ] && { echo "Error: WP_SITE_URL not set" >&2; exit 1; }
    [ -z "$WP_USERNAME" ] || [ -z "$WP_APP_PASSWORD" ] && { echo "Error: WP_USERNAME and WP_APP_PASSWORD required" >&2; exit 1; }
}

check_wc_env() {
    [ -z "$WP_SITE_URL" ] && { echo "Error: WP_SITE_URL not set" >&2; exit 1; }
    [ -z "$WC_CONSUMER_KEY" ] || [ -z "$WC_CONSUMER_SECRET" ] && { echo "Error: WC_CONSUMER_KEY and WC_CONSUMER_SECRET required" >&2; exit 1; }
}

wp_curl() { curl -s -u "${WP_USERNAME}:${WP_APP_PASSWORD}" "$@"; }
wp_curl_public() { curl -s "$@"; }
wc_curl() { curl -s -u "${WC_CONSUMER_KEY}:${WC_CONSUMER_SECRET}" "$@"; }

parse_site_option() {
    for arg in "$@"; do [[ "$arg" == --site=* ]] && echo "${arg#--site=}" && return; done
}

SITE_OVERRIDE=$(parse_site_option "$@")
[ -n "$SITE_OVERRIDE" ] && resolve_site "$SITE_OVERRIDE"

#===================
# MARKDOWN TO GUTENBERG
#===================

markdown_to_gutenberg() {
    local md="$1"
    local html=""
    local in_list=false
    local list_items=""
    
    while IFS= read -r line || [ -n "$line" ]; do
        # Close list if needed
        if $in_list && [[ ! "$line" =~ ^[*-]\ .+ ]]; then
            html+="<!-- wp:list -->\n<ul>${list_items}</ul>\n<!-- /wp:list -->\n\n"
            in_list=false
            list_items=""
        fi
        
        if [[ "$line" =~ ^###\ (.+)$ ]]; then
            html+="<!-- wp:heading {\"level\":3} -->\n<h3>${BASH_REMATCH[1]}</h3>\n<!-- /wp:heading -->\n\n"
        elif [[ "$line" =~ ^##\ (.+)$ ]]; then
            html+="<!-- wp:heading -->\n<h2>${BASH_REMATCH[1]}</h2>\n<!-- /wp:heading -->\n\n"
        elif [[ "$line" =~ ^#\ (.+)$ ]]; then
            html+="<!-- wp:heading {\"level\":1} -->\n<h1>${BASH_REMATCH[1]}</h1>\n<!-- /wp:heading -->\n\n"
        elif [[ "$line" =~ ^---+$ ]]; then
            html+="<!-- wp:separator -->\n<hr class=\"wp-block-separator\"/>\n<!-- /wp:separator -->\n\n"
        elif [[ "$line" =~ ^\>\ (.+)$ ]]; then
            html+="<!-- wp:quote -->\n<blockquote class=\"wp-block-quote\"><p>${BASH_REMATCH[1]}</p></blockquote>\n<!-- /wp:quote -->\n\n"
        elif [[ "$line" =~ ^[*-]\ (.+)$ ]]; then
            in_list=true
            list_items+="<li>${BASH_REMATCH[1]}</li>"
        elif [[ -z "$line" ]]; then
            continue
        else
            line=$(echo "$line" | sed -E 's/\*\*([^*]+)\*\*/<strong>\1<\/strong>/g')
            line=$(echo "$line" | sed -E 's/\*([^*]+)\*/<em>\1<\/em>/g')
            line=$(echo "$line" | sed -E 's/`([^`]+)`/<code>\1<\/code>/g')
            line=$(echo "$line" | sed -E 's/\[([^\]]+)\]\(([^\)]+)\)/<a href="\2">\1<\/a>/g')
            html+="<!-- wp:paragraph -->\n<p>${line}</p>\n<!-- /wp:paragraph -->\n\n"
        fi
    done <<< "$md"
    
    $in_list && html+="<!-- wp:list -->\n<ul>${list_items}</ul>\n<!-- /wp:list -->\n\n"
    echo -e "$html"
}

#===================
# CONTENT HEALTH
#===================

content_health_check() {
    local POST_ID="$1"
    check_env
    
    POST=$(wp_curl "${WP_SITE_URL}/wp-json/wp/v2/posts/${POST_ID}")
    TITLE=$(echo "$POST" | jq -r '.title.rendered')
    CONTENT=$(echo "$POST" | jq -r '.content.rendered')
    EXCERPT=$(echo "$POST" | jq -r '.excerpt.rendered')
    FEATURED=$(echo "$POST" | jq -r '.featured_media')
    
    PLAIN=$(echo "$CONTENT" | sed 's/<[^>]*>//g' | tr -s ' \n')
    WORDS=$(echo "$PLAIN" | wc -w | tr -d ' ')
    
    echo "=== Content Health Score ==="
    echo "Post: $TITLE"
    echo ""
    
    SCORE=100
    
    # Word count
    if [ "$WORDS" -lt 300 ]; then
        echo "⚠️  Word count: ${WORDS} (recommend 300+)"
        SCORE=$((SCORE - 15))
    else
        echo "✅ Word count: ${WORDS}"
    fi
    
    # Title length
    TITLE_LEN=${#TITLE}
    if [ "$TITLE_LEN" -lt 30 ] || [ "$TITLE_LEN" -gt 70 ]; then
        echo "⚠️  Title length: ${TITLE_LEN} chars (ideal: 50-60)"
        SCORE=$((SCORE - 10))
    else
        echo "✅ Title length: ${TITLE_LEN} chars"
    fi
    
    # Excerpt
    if [ -z "$EXCERPT" ] || [ "$EXCERPT" = "<p></p>" ]; then
        echo "⚠️  Missing excerpt"
        SCORE=$((SCORE - 15))
    else
        echo "✅ Excerpt: Set"
    fi
    
    # Featured image
    if [ "$FEATURED" = "0" ]; then
        echo "⚠️  No featured image"
        SCORE=$((SCORE - 15))
    else
        echo "✅ Featured image: Set"
    fi
    
    # Headings
    H2=$(echo "$CONTENT" | grep -c '<h2' || true)
    [ "$H2" -eq 0 ] && [ "$WORDS" -gt 500 ] && echo "⚠️  No H2 headings" && SCORE=$((SCORE - 10))
    [ "$H2" -gt 0 ] && echo "✅ Headings: ${H2} H2 tags"
    
    # Images
    IMGS=$(echo "$CONTENT" | grep -c '<img' || true)
    [ "$IMGS" -eq 0 ] && [ "$WORDS" -gt 500 ] && echo "ℹ️  No images in content"
    [ "$IMGS" -gt 0 ] && echo "✅ Images: ${IMGS}"
    
    echo ""
    echo "=== SCORE: ${SCORE}/100 ==="
    [ "$SCORE" -ge 80 ] && echo "🟢 Ready to publish"
    [ "$SCORE" -lt 80 ] && [ "$SCORE" -ge 60 ] && echo "🟡 Could be improved"
    [ "$SCORE" -lt 60 ] && echo "🔴 Needs work"
}

#===================
# MAIN COMMANDS
#===================

case "$1" in
    # POSTS
    create-post)
        check_env
        TITLE="${2:-Untitled}"
        CONTENT="${3:-}"
        STATUS="${4:-draft}"
        wp_curl -X POST "${WP_SITE_URL}/wp-json/wp/v2/posts" \
            -H "Content-Type: application/json" \
            -d "$(jq -n --arg t "$TITLE" --arg c "$CONTENT" --arg s "$STATUS" '{title:$t,content:$c,status:$s}')"
        ;;
    
    create-post-markdown)
        check_env
        TITLE="$2"
        MD_FILE="$3"
        STATUS="${4:-draft}"
        [ -z "$TITLE" ] || [ -z "$MD_FILE" ] && { echo "Usage: create-post-markdown \"title\" file.md [status]" >&2; exit 1; }
        CONTENT=$(markdown_to_gutenberg "$(cat "$MD_FILE")")
        wp_curl -X POST "${WP_SITE_URL}/wp-json/wp/v2/posts" \
            -H "Content-Type: application/json" \
            -d "$(jq -n --arg t "$TITLE" --arg c "$CONTENT" --arg s "$STATUS" '{title:$t,content:$c,status:$s}')"
        ;;
    
    update-post)
        check_env
        POST_ID="$2"; shift 2
        [ -z "$POST_ID" ] && { echo "Error: post_id required" >&2; exit 1; }
        JSON="{}"
        for arg in "$@"; do
            [[ "$arg" == --site=* ]] && continue
            key="${arg%%=*}"; value="${arg#*=}"
            JSON=$(echo "$JSON" | jq --arg k "$key" --arg v "$value" '. + {($k): $v}')
        done
        wp_curl -X POST "${WP_SITE_URL}/wp-json/wp/v2/posts/${POST_ID}" -H "Content-Type: application/json" -d "$JSON"
        ;;
    
    delete-post)
        check_env
        [ -z "$2" ] && { echo "Error: post_id required" >&2; exit 1; }
        [ "$3" = "--force" ] && wp_curl -X DELETE "${WP_SITE_URL}/wp-json/wp/v2/posts/${2}?force=true" || \
        wp_curl -X DELETE "${WP_SITE_URL}/wp-json/wp/v2/posts/${2}"
        ;;
    
    get-post)
        check_env
        [ -z "$2" ] && { echo "Error: post_id required" >&2; exit 1; }
        wp_curl "${WP_SITE_URL}/wp-json/wp/v2/posts/${2}"
        ;;
    
    list-posts)
        check_env
        wp_curl "${WP_SITE_URL}/wp-json/wp/v2/posts?per_page=${2:-10}&status=${3:-any}" | \
            jq '[.[] | {id, title: .title.rendered, status, date, link}]'
        ;;
    
    search-posts)
        check_env
        [ -z "$2" ] && { echo "Error: query required" >&2; exit 1; }
        wp_curl "${WP_SITE_URL}/wp-json/wp/v2/posts?search=$(echo "$2" | jq -sRr @uri)" | \
            jq '[.[] | {id, title: .title.rendered, status, link}]'
        ;;
    
    publish-post)
        check_env
        [ -z "$2" ] && { echo "Error: post_id required" >&2; exit 1; }
        wp_curl -X POST "${WP_SITE_URL}/wp-json/wp/v2/posts/${2}" -H "Content-Type: application/json" -d '{"status":"publish"}'
        ;;
    
    schedule-post)
        check_env
        [ -z "$2" ] || [ -z "$3" ] && { echo "Error: post_id and date required" >&2; exit 1; }
        wp_curl -X POST "${WP_SITE_URL}/wp-json/wp/v2/posts/${2}" -H "Content-Type: application/json" \
            -d "{\"status\":\"future\",\"date\":\"${3}\"}"
        ;;

    # PAGES
    create-page)
        check_env
        wp_curl -X POST "${WP_SITE_URL}/wp-json/wp/v2/pages" -H "Content-Type: application/json" \
            -d "$(jq -n --arg t "${2:-Untitled}" --arg c "${3:-}" --arg s "${4:-draft}" '{title:$t,content:$c,status:$s}')"
        ;;
    
    list-pages)
        check_env
        wp_curl "${WP_SITE_URL}/wp-json/wp/v2/pages?per_page=${2:-10}&status=any" | \
            jq '[.[] | {id, title: .title.rendered, status, link}]'
        ;;

    # MEDIA
    upload-media)
        check_env
        [ -z "$2" ] || [ ! -f "$2" ] && { echo "Error: valid file required" >&2; exit 1; }
        FNAME=$(basename "$2"); MIME=$(file --mime-type -b "$2")
        wp_curl -X POST "${WP_SITE_URL}/wp-json/wp/v2/media" \
            -H "Content-Disposition: attachment; filename=${FNAME}" -H "Content-Type: ${MIME}" --data-binary "@${2}"
        ;;
    
    update-media)
        check_env
        MEDIA_ID="$2"; shift 2
        [ -z "$MEDIA_ID" ] && { echo "Error: media_id required" >&2; exit 1; }
        JSON="{}"
        for arg in "$@"; do
            key="${arg%%=*}"; value="${arg#*=}"
            JSON=$(echo "$JSON" | jq --arg k "$key" --arg v "$value" '. + {($k): $v}')
        done
        wp_curl -X POST "${WP_SITE_URL}/wp-json/wp/v2/media/${MEDIA_ID}" -H "Content-Type: application/json" -d "$JSON"
        ;;
    
    list-media)
        check_env
        wp_curl "${WP_SITE_URL}/wp-json/wp/v2/media?per_page=${2:-10}" | \
            jq '[.[] | {id, title: .title.rendered, source_url, alt_text}]'
        ;;
    
    delete-media)
        check_env
        [ -z "$2" ] && { echo "Error: media_id required" >&2; exit 1; }
        wp_curl -X DELETE "${WP_SITE_URL}/wp-json/wp/v2/media/${2}?force=true"
        ;;
    
    set-featured-image)
        check_env
        [ -z "$2" ] || [ -z "$3" ] && { echo "Error: post_id and media_id required" >&2; exit 1; }
        wp_curl -X POST "${WP_SITE_URL}/wp-json/wp/v2/posts/${2}" -H "Content-Type: application/json" \
            -d "{\"featured_media\":${3}}"
        ;;

    # CATEGORIES & TAGS
    list-categories)
        check_env
        wp_curl "${WP_SITE_URL}/wp-json/wp/v2/categories?per_page=100&hide_empty=false" | \
            jq '[.[] | {id, name, slug, count}]'
        ;;
    
    create-category)
        check_env
        [ -z "$2" ] && { echo "Error: name required" >&2; exit 1; }
        wp_curl -X POST "${WP_SITE_URL}/wp-json/wp/v2/categories" -H "Content-Type: application/json" \
            -d "$(jq -n --arg n "$2" --arg s "${3:-}" '{name:$n,slug:$s}')"
        ;;
    
    delete-category)
        check_env
        [ -z "$2" ] && { echo "Error: category_id required" >&2; exit 1; }
        wp_curl -X DELETE "${WP_SITE_URL}/wp-json/wp/v2/categories/${2}?force=true"
        ;;
    
    list-tags)
        check_env
        wp_curl "${WP_SITE_URL}/wp-json/wp/v2/tags?per_page=100&hide_empty=false" | \
            jq '[.[] | {id, name, slug, count}]'
        ;;
    
    create-tag)
        check_env
        [ -z "$2" ] && { echo "Error: name required" >&2; exit 1; }
        wp_curl -X POST "${WP_SITE_URL}/wp-json/wp/v2/tags" -H "Content-Type: application/json" \
            -d "$(jq -n --arg n "$2" --arg s "${3:-}" '{name:$n,slug:$s}')"
        ;;
    
    delete-tag)
        check_env
        [ -z "$2" ] && { echo "Error: tag_id required" >&2; exit 1; }
        wp_curl -X DELETE "${WP_SITE_URL}/wp-json/wp/v2/tags/${2}?force=true"
        ;;

    # COMMENTS
    list-comments)
        check_env
        wp_curl "${WP_SITE_URL}/wp-json/wp/v2/comments?status=${2:-approve}&per_page=${3:-20}" | \
            jq '[.[] | {id, post, author_name, content: .content.rendered, status, date}]'
        ;;
    
    pending-comments)
        check_env
        wp_curl "${WP_SITE_URL}/wp-json/wp/v2/comments?status=hold&per_page=50" | \
            jq '[.[] | {id, post, author_name, content: .content.rendered, date}]'
        ;;
    
    approve-comment)
        check_env
        [ -z "$2" ] && { echo "Error: comment_id required" >&2; exit 1; }
        wp_curl -X POST "${WP_SITE_URL}/wp-json/wp/v2/comments/${2}" -H "Content-Type: application/json" \
            -d '{"status":"approved"}'
        ;;
    
    spam-comment)
        check_env
        [ -z "$2" ] && { echo "Error: comment_id required" >&2; exit 1; }
        wp_curl -X POST "${WP_SITE_URL}/wp-json/wp/v2/comments/${2}" -H "Content-Type: application/json" \
            -d '{"status":"spam"}'
        ;;
    
    delete-comment)
        check_env
        [ -z "$2" ] && { echo "Error: comment_id required" >&2; exit 1; }
        wp_curl -X DELETE "${WP_SITE_URL}/wp-json/wp/v2/comments/${2}?force=true"
        ;;
    
    reply-comment)
        check_env
        [ -z "$2" ] || [ -z "$3" ] || [ -z "$4" ] && { echo "Error: post_id, parent_id, content required" >&2; exit 1; }
        wp_curl -X POST "${WP_SITE_URL}/wp-json/wp/v2/comments" -H "Content-Type: application/json" \
            -d "$(jq -n --argjson p "$2" --argjson parent "$3" --arg c "$4" '{post:$p,parent:$parent,content:$c}')"
        ;;
    
    bulk-approve-comments)
        check_env
        echo "Approving all pending comments..."
        for id in $(wp_curl "${WP_SITE_URL}/wp-json/wp/v2/comments?status=hold&per_page=100" | jq -r '.[].id'); do
            wp_curl -X POST "${WP_SITE_URL}/wp-json/wp/v2/comments/${id}" -H "Content-Type: application/json" \
                -d '{"status":"approved"}' > /dev/null
            echo "Approved: ${id}"
        done
        echo "Done."
        ;;

    # WOOCOMMERCE
    wc-list-products)
        check_wc_env
        wc_curl "${WP_SITE_URL}/wp-json/wc/v3/products?per_page=${2:-20}" | \
            jq '[.[] | {id, name, sku, price, stock_quantity, stock_status, status}]'
        ;;
    
    wc-get-product)
        check_wc_env
        [ -z "$2" ] && { echo "Error: product_id required" >&2; exit 1; }
        wc_curl "${WP_SITE_URL}/wp-json/wc/v3/products/${2}"
        ;;
    
    wc-create-product)
        check_wc_env
        [ -z "$2" ] || [ -z "$3" ] && { echo "Error: name and price required" >&2; exit 1; }
        wc_curl -X POST "${WP_SITE_URL}/wp-json/wc/v3/products" -H "Content-Type: application/json" \
            -d "$(jq -n --arg n "$2" --arg p "$3" '{name:$n,type:"simple",regular_price:$p,status:"draft"}')"
        ;;
    
    wc-update-product)
        check_wc_env
        PRODUCT_ID="$2"; shift 2
        [ -z "$PRODUCT_ID" ] && { echo "Error: product_id required" >&2; exit 1; }
        JSON="{}"
        for arg in "$@"; do
            key="${arg%%=*}"; value="${arg#*=}"
            JSON=$(echo "$JSON" | jq --arg k "$key" --arg v "$value" '. + {($k): $v}')
        done
        wc_curl -X PUT "${WP_SITE_URL}/wp-json/wc/v3/products/${PRODUCT_ID}" -H "Content-Type: application/json" -d "$JSON"
        ;;
    
    wc-update-stock)
        check_wc_env
        [ -z "$2" ] || [ -z "$3" ] && { echo "Error: product_id and quantity required" >&2; exit 1; }
        wc_curl -X PUT "${WP_SITE_URL}/wp-json/wc/v3/products/${2}" -H "Content-Type: application/json" \
            -d "{\"stock_quantity\":${3},\"manage_stock\":true}"
        ;;
    
    wc-delete-product)
        check_wc_env
        [ -z "$2" ] && { echo "Error: product_id required" >&2; exit 1; }
        wc_curl -X DELETE "${WP_SITE_URL}/wp-json/wc/v3/products/${2}?force=true"
        ;;
    
    wc-list-orders)
        check_wc_env
        wc_curl "${WP_SITE_URL}/wp-json/wc/v3/orders?status=${2:-any}&per_page=${3:-20}" | \
            jq '[.[] | {id, number, status, total, date_created}]'
        ;;
    
    wc-get-order)
        check_wc_env
        [ -z "$2" ] && { echo "Error: order_id required" >&2; exit 1; }
        wc_curl "${WP_SITE_URL}/wp-json/wc/v3/orders/${2}"
        ;;
    
    wc-update-order)
        check_wc_env
        [ -z "$2" ] || [ -z "$3" ] && { echo "Error: order_id and status required" >&2; exit 1; }
        wc_curl -X PUT "${WP_SITE_URL}/wp-json/wc/v3/orders/${2}" -H "Content-Type: application/json" \
            -d "{\"status\":\"${3}\"}"
        ;;
    
    wc-add-order-note)
        check_wc_env
        [ -z "$2" ] || [ -z "$3" ] && { echo "Error: order_id and note required" >&2; exit 1; }
        wc_curl -X POST "${WP_SITE_URL}/wp-json/wc/v3/orders/${2}/notes" -H "Content-Type: application/json" \
            -d "$(jq -n --arg n "$3" '{note:$n,customer_note:false}')"
        ;;
    
    wc-create-coupon)
        check_wc_env
        [ -z "$2" ] || [ -z "$3" ] && { echo "Error: code and amount required" >&2; exit 1; }
        wc_curl -X POST "${WP_SITE_URL}/wp-json/wc/v3/coupons" -H "Content-Type: application/json" \
            -d "$(jq -n --arg c "$2" --arg a "$3" --arg t "${4:-percent}" '{code:$c,amount:$a,discount_type:$t}')"
        ;;
    
    wc-sales-report)
        check_wc_env
        wc_curl "${WP_SITE_URL}/wp-json/wc/v3/reports/sales?period=${2:-month}"
        ;;
    
    wc-top-sellers)
        check_wc_env
        wc_curl "${WP_SITE_URL}/wp-json/wc/v3/reports/top_sellers?period=${2:-month}"
        ;;
    
    wc-low-stock)
        check_wc_env
        wc_curl "${WP_SITE_URL}/wp-json/wc/v3/products?stock_status=lowstock&per_page=50" | \
            jq '[.[] | {id, name, sku, stock_quantity}]'
        ;;

    # CONTENT HEALTH
    health-check)
        [ -z "$2" ] && { echo "Error: post_id required" >&2; exit 1; }
        content_health_check "$2"
        ;;
    
    check-links)
        check_env
        [ -z "$2" ] && { echo "Error: post_id required" >&2; exit 1; }
        echo "Checking links in post ${2}..."
        CONTENT=$(wp_curl "${WP_SITE_URL}/wp-json/wp/v2/posts/${2}" | jq -r '.content.rendered')
        echo "$CONTENT" | grep -oE 'href="[^"]*"' | sed 's/href="//g;s/"//g' | while read -r url; do
            [[ "$url" == \#* ]] || [[ "$url" == mailto:* ]] && continue
            STATUS=$(curl -s -o /dev/null -w "%{http_code}" -L --max-time 10 "$url" 2>/dev/null || echo "000")
            [ "$STATUS" = "200" ] && echo "✅ $url" || echo "❌ $url ($STATUS)"
        done
        ;;
    
    check-duplicate)
        check_env
        [ -z "$2" ] && { echo "Error: title required" >&2; exit 1; }
        echo "Checking for duplicates..."
        wp_curl "${WP_SITE_URL}/wp-json/wp/v2/posts?search=$(echo "$2" | jq -sRr @uri)&per_page=5" | \
            jq -r '.[] | "  \(.id): \(.title.rendered) (\(.status))"'
        ;;

    # CALENDAR
    calendar)
        check_env
        MONTH="${2:-$(date +%Y-%m)}"
        echo "=== Content Calendar: ${MONTH} ==="
        echo ""
        echo "📗 Published:"
        wp_curl "${WP_SITE_URL}/wp-json/wp/v2/posts?after=${MONTH}-01T00:00:00&before=${MONTH}-31T23:59:59&status=publish&per_page=100" | \
            jq -r '.[] | "  \(.date | split("T")[0]) - \(.title.rendered)"'
        echo ""
        echo "📅 Scheduled:"
        wp_curl "${WP_SITE_URL}/wp-json/wp/v2/posts?status=future&per_page=50" | \
            jq -r '.[] | "  \(.date | split("T")[0]) - \(.title.rendered)"'
        echo ""
        echo "📝 Drafts:"
        wp_curl "${WP_SITE_URL}/wp-json/wp/v2/posts?status=draft&per_page=20" | \
            jq -r '.[] | "  \(.id) - \(.title.rendered)"'
        ;;

    # STATS
    stats)
        check_env
        echo "=== Content Statistics ==="
        for status in publish draft pending future; do
            COUNT=$(wp_curl "${WP_SITE_URL}/wp-json/wp/v2/posts?status=${status}&per_page=1" -I 2>/dev/null | \
                grep -i 'x-wp-total' | awk '{print $2}' | tr -d '\r')
            echo "Posts (${status}): ${COUNT:-0}"
        done
        PAGES=$(wp_curl "${WP_SITE_URL}/wp-json/wp/v2/pages?per_page=1" -I 2>/dev/null | \
            grep -i 'x-wp-total' | awk '{print $2}' | tr -d '\r')
        echo "Pages: ${PAGES:-0}"
        MEDIA=$(wp_curl "${WP_SITE_URL}/wp-json/wp/v2/media?per_page=1" -I 2>/dev/null | \
            grep -i 'x-wp-total' | awk '{print $2}' | tr -d '\r')
        echo "Media: ${MEDIA:-0}"
        COMMENTS=$(wp_curl "${WP_SITE_URL}/wp-json/wp/v2/comments?per_page=1" -I 2>/dev/null | \
            grep -i 'x-wp-total' | awk '{print $2}' | tr -d '\r')
        echo "Comments: ${COMMENTS:-0}"
        ;;

    # BACKUP
    backup)
        check_env
        DIR="${2:-.}"
        DATE=$(date +%Y%m%d_%H%M%S)
        mkdir -p "$DIR"
        echo "Creating backup..."
        wp_curl "${WP_SITE_URL}/wp-json/wp/v2/posts?per_page=100&status=any" > "${DIR}/posts_${DATE}.json"
        wp_curl "${WP_SITE_URL}/wp-json/wp/v2/pages?per_page=100&status=any" > "${DIR}/pages_${DATE}.json"
        wp_curl "${WP_SITE_URL}/wp-json/wp/v2/categories?per_page=100" > "${DIR}/categories_${DATE}.json"
        wp_curl "${WP_SITE_URL}/wp-json/wp/v2/tags?per_page=100" > "${DIR}/tags_${DATE}.json"
        echo "✅ Backup complete: ${DIR}/*_${DATE}.json"
        ;;

    # EXPORT TO MARKDOWN
    export-markdown)
        check_env
        DIR="${2:-.}"
        mkdir -p "$DIR"
        echo "Exporting posts to markdown..."
        wp_curl "${WP_SITE_URL}/wp-json/wp/v2/posts?per_page=100&status=publish" | jq -c '.[]' | while read -r post; do
            SLUG=$(echo "$post" | jq -r '.slug')
            TITLE=$(echo "$post" | jq -r '.title.rendered')
            DATE=$(echo "$post" | jq -r '.date')
            CONTENT=$(echo "$post" | jq -r '.content.rendered' | sed 's/<[^>]*>//g')
            cat > "${DIR}/${DATE:0:10}-${SLUG}.md" << EOF
---
title: "${TITLE}"
date: ${DATE}
---

${CONTENT}
EOF
            echo "Exported: ${SLUG}"
        done
        ;;

    # SITE
    site-info)
        wp_curl_public "${WP_SITE_URL}/wp-json/" | jq '{name, description, url, timezone_string}'
        ;;
    
    site-health)
        check_env
        echo "=== Site Health ==="
        echo -n "REST API: "
        wp_curl_public "${WP_SITE_URL}/wp-json/" | jq -e '.name' > /dev/null 2>&1 && echo "✅ OK" || echo "❌ Failed"
        echo -n "Auth: "
        wp_curl "${WP_SITE_URL}/wp-json/wp/v2/users/me" | jq -e '.id' > /dev/null 2>&1 && echo "✅ OK" || echo "❌ Failed"
        echo -n "Response: "
        TIME=$(curl -s -o /dev/null -w "%{time_total}" "${WP_SITE_URL}")
        echo "${TIME}s"
        ;;

    # USERS
    list-users)
        check_env
        wp_curl "${WP_SITE_URL}/wp-json/wp/v2/users?per_page=50" | jq '[.[] | {id, name, slug}]'
        ;;
    
    me)
        check_env
        wp_curl "${WP_SITE_URL}/wp-json/wp/v2/users/me"
        ;;

    # BULK
    bulk-publish)
        check_env
        echo "Publishing all drafts..."
        for id in $(wp_curl "${WP_SITE_URL}/wp-json/wp/v2/posts?status=draft&per_page=100" | jq -r '.[].id'); do
            wp_curl -X POST "${WP_SITE_URL}/wp-json/wp/v2/posts/${id}" -H "Content-Type: application/json" \
                -d '{"status":"publish"}' > /dev/null
            echo "Published: ${id}"
        done
        ;;
    
    bulk-delete-old)
        check_env
        [ -z "$2" ] && { echo "Error: date required (YYYY-MM-DD)" >&2; exit 1; }
        echo "Deleting posts before ${2}..."
        for id in $(wp_curl "${WP_SITE_URL}/wp-json/wp/v2/posts?before=${2}T00:00:00&per_page=100" | jq -r '.[].id'); do
            wp_curl -X DELETE "${WP_SITE_URL}/wp-json/wp/v2/posts/${id}?force=true" > /dev/null
            echo "Deleted: ${id}"
        done
        ;;

    # HELP
    help|--help|-h|"")
        cat << 'EOF'
Pinch to Post v3.0 - Ultimate WordPress Manager 🦞

POSTS:
  create-post "title" "content" [status]
  create-post-markdown "title" file.md [status]
  update-post <id> key=value ...
  delete-post <id> [--force]
  get-post <id>
  list-posts [per_page] [status]
  search-posts "query"
  publish-post <id>
  schedule-post <id> <datetime>

PAGES:
  create-page "title" "content" [status]
  list-pages [per_page]

MEDIA:
  upload-media /path/to/file
  update-media <id> alt_text=... title=...
  list-media [per_page]
  delete-media <id>
  set-featured-image <post_id> <media_id>

CATEGORIES & TAGS:
  list-categories / create-category / delete-category
  list-tags / create-tag / delete-tag

COMMENTS:
  list-comments [status] [per_page]
  pending-comments
  approve-comment / spam-comment / delete-comment <id>
  reply-comment <post_id> <parent_id> "content"
  bulk-approve-comments

WOOCOMMERCE:
  wc-list-products / wc-get-product / wc-create-product / wc-update-product / wc-delete-product
  wc-update-stock <id> <qty>
  wc-list-orders / wc-get-order / wc-update-order / wc-add-order-note
  wc-create-coupon "code" "amount" [type]
  wc-sales-report / wc-top-sellers / wc-low-stock

CONTENT HEALTH:
  health-check <post_id>
  check-links <post_id>
  check-duplicate "title"

CALENDAR & STATS:
  calendar [YYYY-MM]
  stats

BACKUP & EXPORT:
  backup [directory]
  export-markdown [directory]

SITE:
  site-info / site-health
  list-users / me

BULK:
  bulk-publish
  bulk-delete-old <YYYY-MM-DD>
  bulk-approve-comments

OPTIONS:
  --site=<name>  Target specific site (multi-site)

EXAMPLES:
  wp-rest.sh create-post "Hello" "<p>World</p>" draft
  wp-rest.sh create-post-markdown "Title" content.md
  wp-rest.sh health-check 123
  wp-rest.sh wc-update-stock 456 50
  wp-rest.sh calendar 2026-02
  wp-rest.sh list-posts 10 publish --site=blog
EOF
        ;;
    
    *)
        echo "Unknown command: $1" >&2
        echo "Run 'wp-rest.sh help' for usage" >&2
        exit 1
        ;;
esac

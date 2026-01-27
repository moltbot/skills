#!/usr/bin/env python3
"""Apollo.io enrichment CLI for Clawdbot.

Enrich contacts and companies via Apollo API.

Commands:
- enrich: Enrich a single person
- bulk-enrich: Enrich up to 10 people
- company: Enrich a company/organization
- search: Search for people
"""

import argparse
import json
import os
import sys
import urllib.request
import urllib.error
import urllib.parse

API_BASE = "https://api.apollo.io/api/v1"


def get_api_key():
    """Get API key from environment."""
    api_key = os.environ.get("APOLLO_API_KEY")
    if not api_key:
        print("Error: APOLLO_API_KEY environment variable not set", file=sys.stderr)
        print("Get your key at: https://app.apollo.io/#/settings/integrations/api", file=sys.stderr)
        sys.exit(1)
    return api_key


def api_request(method, endpoint, params=None, data=None):
    """Make an API request to Apollo."""
    api_key = get_api_key()
    
    url = f"{API_BASE}{endpoint}"
    if params:
        url += "?" + urllib.parse.urlencode(params)
    
    headers = {
        "x-api-key": api_key,
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Cache-Control": "no-cache",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    
    body = json.dumps(data).encode('utf-8') if data else None
    
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            return json.loads(response.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8')
        try:
            error_json = json.loads(error_body)
            print(f"Error {e.code}: {error_json.get('message', error_body)}", file=sys.stderr)
        except:
            print(f"Error {e.code}: {error_body}", file=sys.stderr)
        sys.exit(1)
    except urllib.error.URLError as e:
        print(f"Network error: {e.reason}", file=sys.stderr)
        sys.exit(1)


def format_person(person):
    """Format person data for display."""
    if not person:
        return "No match found"
    
    lines = []
    lines.append(f"👤 {person.get('name', 'Unknown')}")
    
    if person.get('title'):
        lines.append(f"   Title: {person['title']}")
    if person.get('headline'):
        lines.append(f"   Headline: {person['headline']}")
    
    org = person.get('organization') or {}
    if org.get('name'):
        lines.append(f"   Company: {org['name']}")
    
    if person.get('email'):
        lines.append(f"   📧 Email: {person['email']}")
    if person.get('personal_emails'):
        for email in person['personal_emails'][:2]:
            lines.append(f"   📧 Personal: {email}")
    
    if person.get('phone_numbers'):
        for phone in person['phone_numbers'][:2]:
            ptype = phone.get('type', 'phone')
            lines.append(f"   📱 {ptype}: {phone.get('sanitized_number', phone.get('number', 'N/A'))}")
    
    if person.get('linkedin_url'):
        lines.append(f"   🔗 LinkedIn: {person['linkedin_url']}")
    
    if person.get('city') or person.get('state') or person.get('country'):
        location = ", ".join(filter(None, [person.get('city'), person.get('state'), person.get('country')]))
        lines.append(f"   📍 Location: {location}")
    
    return "\n".join(lines)


def format_company(org):
    """Format organization data for display."""
    if not org:
        return "No match found"
    
    lines = []
    lines.append(f"🏢 {org.get('name', 'Unknown')}")
    
    if org.get('website_url'):
        lines.append(f"   Website: {org['website_url']}")
    if org.get('industry'):
        lines.append(f"   Industry: {org['industry']}")
    if org.get('estimated_num_employees'):
        lines.append(f"   Employees: {org['estimated_num_employees']}")
    if org.get('annual_revenue_printed'):
        lines.append(f"   Revenue: {org['annual_revenue_printed']}")
    if org.get('total_funding_printed'):
        lines.append(f"   Funding: {org['total_funding_printed']}")
    if org.get('founded_year'):
        lines.append(f"   Founded: {org['founded_year']}")
    if org.get('short_description'):
        lines.append(f"   Description: {org['short_description'][:200]}")
    if org.get('linkedin_url'):
        lines.append(f"   🔗 LinkedIn: {org['linkedin_url']}")
    if org.get('phone'):
        lines.append(f"   📞 Phone: {org['phone']}")
    
    # Location
    if org.get('city') or org.get('state') or org.get('country'):
        location = ", ".join(filter(None, [org.get('city'), org.get('state'), org.get('country')]))
        lines.append(f"   📍 HQ: {location}")
    
    # Technologies
    if org.get('technologies'):
        techs = org['technologies'][:10]
        lines.append(f"   💻 Tech: {', '.join(techs)}")
    
    return "\n".join(lines)


def cmd_enrich(args):
    """Enrich a single person."""
    params = {}
    
    if args.email:
        params['email'] = args.email
    if args.name:
        # Split name into first/last
        parts = args.name.split(' ', 1)
        params['first_name'] = parts[0]
        if len(parts) > 1:
            params['last_name'] = parts[1]
    if args.first_name:
        params['first_name'] = args.first_name
    if args.last_name:
        params['last_name'] = args.last_name
    if args.domain:
        params['domain'] = args.domain
    if args.linkedin:
        params['linkedin_url'] = args.linkedin
    
    if args.reveal_email:
        params['reveal_personal_emails'] = 'true'
    if args.reveal_phone:
        params['reveal_phone_number'] = 'true'
    
    if not params:
        print("Error: Provide at least --email, --name, or --linkedin", file=sys.stderr)
        sys.exit(1)
    
    result = api_request("POST", "/people/match", params=params)
    
    if args.json:
        print(json.dumps(result, indent=2))
    else:
        person = result.get('person')
        print(format_person(person))


def cmd_bulk_enrich(args):
    """Enrich multiple people."""
    with open(args.file) as f:
        contacts = json.load(f)
    
    if not isinstance(contacts, list):
        print("Error: JSON file must contain an array of contacts", file=sys.stderr)
        sys.exit(1)
    
    if len(contacts) > 10:
        print(f"Warning: Apollo limits bulk to 10. Processing first 10 of {len(contacts)}", file=sys.stderr)
        contacts = contacts[:10]
    
    params = {
        'reveal_personal_emails': 'true' if args.reveal_email else 'false',
        'reveal_phone_number': 'true' if args.reveal_phone else 'false'
    }
    
    data = {'details': contacts}
    
    result = api_request("POST", "/people/bulk_match", params=params, data=data)
    
    if args.json:
        print(json.dumps(result, indent=2))
    else:
        matches = result.get('matches', [])
        print(f"Enriched {len(matches)} contacts:\n")
        for match in matches:
            print(format_person(match))
            print()


def cmd_company(args):
    """Enrich a company/organization."""
    params = {'domain': args.domain}
    
    result = api_request("GET", "/organizations/enrich", params=params)
    
    if args.json:
        print(json.dumps(result, indent=2))
    else:
        org = result.get('organization')
        print(format_company(org))


def should_exclude_competitor(person, exclude_competitors):
    """Check if person should be excluded based on competitor employment."""
    if not exclude_competitors:
        return False
    
    # List of competitor companies to exclude
    COMPETITOR_DOMAINS = {
        'hathora.dev',
        'hathora.com',
        'edgegap.com',
        'heroiclabs.com',  # Nakama
        'nakama.dev'
    }
    
    COMPETITOR_NAMES = {
        'hathora',
        'edgegap',
        'heroic labs',
        'nakama'
    }
    
    org = person.get('organization') or {}
    
    # Check domain
    org_domain = org.get('primary_domain', '').lower()
    if org_domain in COMPETITOR_DOMAINS:
        return True
    
    # Check company name
    org_name = (org.get('name') or '').lower()
    for competitor in COMPETITOR_NAMES:
        if competitor in org_name:
            return True
    
    return False


def cmd_search(args):
    """Search for people."""
    data = {
        'page': 1,
        'per_page': args.limit or 25
    }
    
    if args.titles:
        data['person_titles'] = [t.strip() for t in args.titles.split(',')]
    if args.domain:
        data['q_organization_domains'] = args.domain
    if args.locations:
        data['person_locations'] = [l.strip() for l in args.locations.split(',')]
    if args.keywords:
        data['q_keywords'] = args.keywords
    
    result = api_request("POST", "/mixed_people/search", data=data)
    
    # Filter out competitor employees if requested
    people = result.get('people', [])
    if args.exclude_competitors:
        original_count = len(people)
        people = [p for p in people if not should_exclude_competitor(p, True)]
        filtered_count = original_count - len(people)
        if filtered_count > 0:
            print(f"Filtered out {filtered_count} competitor employees (Hathora/Edgegap/Nakama)\n", file=sys.stderr)
    
    if args.json:
        result['people'] = people  # Update result with filtered list
        print(json.dumps(result, indent=2))
    else:
        total = result.get('pagination', {}).get('total_entries', len(people))
        print(f"Found {total} results (showing {len(people)}):\n")
        for person in people:
            print(format_person(person))
            print()


def main():
    parser = argparse.ArgumentParser(
        description="Apollo.io enrichment CLI for Clawdbot",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  apollo.py enrich --email john@acme.com
  apollo.py enrich --name "John Smith" --domain acme.com
  apollo.py company --domain stripe.com
  apollo.py search --titles "CEO,CTO" --domain acme.com
  apollo.py search --titles "CTO" --exclude-competitors
  apollo.py bulk-enrich --file contacts.json
        """
    )
    subparsers = parser.add_subparsers(dest="command", required=True)
    
    # Enrich single person
    enrich = subparsers.add_parser("enrich", help="Enrich a single person")
    enrich.add_argument("--email", "-e", help="Email address")
    enrich.add_argument("--name", "-n", help="Full name")
    enrich.add_argument("--first-name", help="First name")
    enrich.add_argument("--last-name", help="Last name")
    enrich.add_argument("--domain", "-d", help="Company domain")
    enrich.add_argument("--linkedin", "-l", help="LinkedIn URL")
    enrich.add_argument("--reveal-email", action="store_true", help="Include personal emails")
    enrich.add_argument("--reveal-phone", action="store_true", help="Include phone numbers")
    enrich.add_argument("--json", action="store_true", help="JSON output")
    
    # Bulk enrich
    bulk = subparsers.add_parser("bulk-enrich", help="Enrich up to 10 people")
    bulk.add_argument("--file", "-f", required=True, help="JSON file with contacts array")
    bulk.add_argument("--reveal-email", action="store_true", help="Include personal emails")
    bulk.add_argument("--reveal-phone", action="store_true", help="Include phone numbers")
    bulk.add_argument("--json", action="store_true", help="JSON output")
    
    # Company enrichment
    company = subparsers.add_parser("company", help="Enrich a company")
    company.add_argument("--domain", "-d", required=True, help="Company domain")
    company.add_argument("--json", action="store_true", help="JSON output")
    
    # People search
    search = subparsers.add_parser("search", help="Search for people")
    search.add_argument("--titles", "-t", help="Job titles (comma-separated)")
    search.add_argument("--domain", "-d", help="Company domain")
    search.add_argument("--locations", "-l", help="Locations (comma-separated)")
    search.add_argument("--keywords", "-k", help="Keywords")
    search.add_argument("--limit", type=int, default=25, help="Max results (default: 25)")
    search.add_argument("--exclude-competitors", "-x", action="store_true", help="Filter out Hathora/Edgegap/Nakama employees")
    search.add_argument("--json", action="store_true", help="JSON output")
    
    args = parser.parse_args()
    
    commands = {
        "enrich": cmd_enrich,
        "bulk-enrich": cmd_bulk_enrich,
        "company": cmd_company,
        "search": cmd_search,
    }
    
    commands[args.command](args)


if __name__ == "__main__":
    main()

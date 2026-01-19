#!/usr/bin/env python3
"""
MILKEE Accounting API Integration
Complete project, customer, time tracking, task & product management
"""

import argparse
import os
import sys
import json
import urllib.request
import urllib.error
from datetime import datetime, timedelta
from difflib import SequenceMatcher
from pathlib import Path

# Configuration
API_TOKEN = os.getenv('MILKEE_API_TOKEN', '')
COMPANY_ID = os.getenv('MILKEE_COMPANY_ID', '')
API_BASE = "https://app.milkee.ch/api/v2"

# Timer state file
TIMER_FILE = Path.home() / ".milkee_timer"

def api_call(method, endpoint, data=None):
    """Make API call to MILKEE"""
    if not API_TOKEN or not COMPANY_ID:
        print("❌ Error: MILKEE_API_TOKEN and MILKEE_COMPANY_ID required!")
        sys.exit(1)
    
    url = f"{API_BASE}/companies/{COMPANY_ID}/{endpoint}"
    
    try:
        req = urllib.request.Request(
            url,
            headers={
                "Authorization": f"Bearer {API_TOKEN}",
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            method=method
        )
        
        if data:
            # Remove None values
            data = {k: v for k, v in data.items() if v is not None}
            req.data = json.dumps(data).encode()
        
        with urllib.request.urlopen(req, timeout=10) as response:
            return json.loads(response.read().decode())
    
    except urllib.error.HTTPError as e:
        try:
            error_data = json.loads(e.read().decode())
            print(f"❌ HTTP {e.code}: {error_data.get('message', 'Unknown error')}")
        except:
            print(f"❌ HTTP {e.code}: {e.reason}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

def fuzzy_match(search_term, items, key='name'):
    """Fuzzy match search term to items"""
    search_term = search_term.lower()
    
    matches = []
    for item in items:
        name = item.get(key, '').lower()
        ratio = SequenceMatcher(None, search_term, name).ratio()
        if ratio > 0.4:
            matches.append((ratio, item))
    
    if matches:
        matches.sort(reverse=True)
        return matches[0][1]
    return None

# ============ PROJECTS ============

def list_projects(args):
    """List all projects"""
    result = api_call("GET", "projects")
    projects = result.get('data', [])
    print(f"\n📋 {len(projects)} Projects:\n")
    
    for p in projects:
        print(f"  • {p.get('name')} (ID: {p.get('id')})")
        if p.get('budget'):
            print(f"    Budget: CHF {p.get('budget')}")
        if p.get('customer_id'):
            print(f"    Customer ID: {p.get('customer_id')}")

def create_project(args):
    """Create new project"""
    data = {
        "name": args.name,
        "customer_id": args.customer_id,
        "budget": args.budget,
        "project_type": "byHour"
    }
    
    result = api_call("POST", "projects", data)
    project = result.get('data', {})
    print(f"✅ Project created: {project.get('name')} (ID: {project.get('id')})")

def update_project(args):
    """Update project"""
    data = {
        "name": args.name,
        "budget": args.budget,
        "customer_id": args.customer_id
    }
    
    result = api_call("PUT", f"projects/{args.id}", data)
    print(f"✅ Project updated")

# ============ CUSTOMERS ============

def list_customers(args):
    """List all customers"""
    result = api_call("GET", "customers")
    customers = result.get('data', [])
    print(f"\n👥 {len(customers)} Customers:\n")
    
    for c in customers:
        print(f"  • {c.get('name')} (ID: {c.get('id')})")
        addr_parts = []
        if c.get('street'):
            addr_parts.append(c['street'])
        if c.get('zip') or c.get('city'):
            addr_parts.append(f"{c.get('zip', '')} {c.get('city', '')}".strip())
        if addr_parts:
            print(f"    📍 {', '.join(addr_parts)}")
        if c.get('phone'):
            print(f"    📞 {c['phone']}")
        if c.get('email'):
            print(f"    ✉️  {c['email']}")

def create_customer(args):
    """Create new customer"""
    data = {
        "name": args.name,
        "street": args.street,
        "zip": args.zip,
        "city": args.city,
        "country": args.country,
        "phone": args.phone,
        "email": args.email,
        "website": args.website
    }
    
    result = api_call("POST", "customers", data)
    customer = result.get('data', {})
    print(f"✅ Customer created: {customer.get('name')} (ID: {customer.get('id')})")

def update_customer(args):
    """Update customer"""
    data = {
        "name": args.name,
        "street": args.street,
        "zip": args.zip,
        "city": args.city,
        "country": args.country,
        "phone": args.phone,
        "email": args.email,
        "website": args.website
    }
    
    result = api_call("PUT", f"customers/{args.id}", data)
    print(f"✅ Customer updated")

# ============ TIME TRACKING ============

def start_timer(args):
    """Start timer (smart project matching)"""
    result = api_call("GET", "projects")
    projects = result.get('data', [])
    project = fuzzy_match(args.project, projects)
    
    if not project:
        print(f"❌ No project found matching '{args.project}'")
        sys.exit(1)
    
    timer_data = {
        "project_id": project['id'],
        "project_name": project['name'],
        "description": args.description or "",
        "start_time": datetime.now().isoformat()
    }
    
    with open(TIMER_FILE, 'w') as f:
        json.dump(timer_data, f)
    
    print(f"✅ Timer started: {project['name']}")
    if args.description:
        print(f"   Description: {args.description}")

def stop_timer(args):
    """Stop timer and log to MILKEE"""
    if not TIMER_FILE.exists():
        print("❌ No timer running")
        sys.exit(1)
    
    with open(TIMER_FILE, 'r') as f:
        timer_data = json.load(f)
    
    start_time = datetime.fromisoformat(timer_data['start_time'])
    end_time = datetime.now()
    duration = end_time - start_time
    
    hours = int(duration.total_seconds() // 3600)
    minutes = int((duration.total_seconds() % 3600) // 60)
    
    data = {
        "project_id": timer_data['project_id'],
        "date": end_time.strftime("%Y-%m-%d"),
        "hours": hours,
        "minutes": minutes,
        "description": timer_data['description'],
        "billable": True
    }
    
    result = api_call("POST", "times", data)
    print(f"✅ Time logged: {hours}h {minutes}min on {timer_data['project_name']}")
    TIMER_FILE.unlink()

def list_times_today(args):
    """Show today's time entries"""
    today = datetime.now().strftime("%Y-%m-%d")
    result = api_call("GET", f"times?filter[date]={today}")
    times = result.get('data', [])
    
    print(f"\n⏱️  Time entries for {today}:\n")
    
    total_minutes = 0
    for t in times:
        hours = t.get('hours', 0)
        minutes = t.get('minutes', 0)
        total_minutes += hours * 60 + minutes
        
        print(f"  • {t.get('description', 'No desc')} - {hours}h {minutes}min")
        print(f"    Project: {t.get('project', {}).get('name', 'N/A')}")
    
    total_hours = total_minutes // 60
    remaining_minutes = total_minutes % 60
    print(f"\n📊 Total: {total_hours}h {remaining_minutes}min\n")

# ============ TASKS ============

def list_tasks(args):
    """List tasks"""
    endpoint = "tasks"
    if args.project_id:
        endpoint += f"?filter[project_id]={args.project_id}"
    
    result = api_call("GET", endpoint)
    tasks = result.get('data', [])
    print(f"\n✅ {len(tasks)} Tasks:\n")
    
    for t in tasks:
        print(f"  • {t.get('name')} (ID: {t.get('id')})")
        if t.get('status'):
            print(f"    Status: {t.get('status')}")

def create_task(args):
    """Create task"""
    data = {
        "name": args.name,
        "project_id": args.project_id,
        "description": args.description
    }
    
    result = api_call("POST", "tasks", data)
    task = result.get('data', {})
    print(f"✅ Task created: {task.get('name')} (ID: {task.get('id')})")

def update_task(args):
    """Update task"""
    data = {
        "name": args.name,
        "status": args.status
    }
    
    result = api_call("PUT", f"tasks/{args.id}", data)
    print(f"✅ Task updated")

# ============ PRODUCTS ============

def list_products(args):
    """List products"""
    result = api_call("GET", "products")
    products = result.get('data', [])
    print(f"\n📦 {len(products)} Products:\n")
    
    for p in products:
        print(f"  • {p.get('name')} (ID: {p.get('id')})")
        if p.get('price'):
            print(f"    Price: CHF {p.get('price')}")

def create_product(args):
    """Create product"""
    data = {
        "name": args.name,
        "price": args.price,
        "description": args.description
    }
    
    result = api_call("POST", "products", data)
    product = result.get('data', {})
    print(f"✅ Product created: {product.get('name')} (ID: {product.get('id')})")

def update_product(args):
    """Update product"""
    data = {
        "name": args.name,
        "price": args.price
    }
    
    result = api_call("PUT", f"products/{args.id}", data)
    print(f"✅ Product updated")

# ============ CLI ============

def main():
    parser = argparse.ArgumentParser(description="MILKEE Accounting CLI")
    subparsers = parser.add_subparsers(dest="command", required=True)
    
    # === Projects ===
    subparsers.add_parser("list_projects", help="List all projects")
    
    p = subparsers.add_parser("create_project", help="Create a project")
    p.add_argument("name", help="Project name")
    p.add_argument("--customer-id", type=int, help="Customer ID")
    p.add_argument("--budget", type=float, help="Budget in CHF")
    
    p = subparsers.add_parser("update_project", help="Update a project")
    p.add_argument("id", help="Project ID")
    p.add_argument("--name", help="New name")
    p.add_argument("--customer-id", type=int, help="Customer ID")
    p.add_argument("--budget", type=float, help="Budget in CHF")
    
    # === Customers ===
    subparsers.add_parser("list_customers", help="List all customers")
    
    p = subparsers.add_parser("create_customer", help="Create a customer")
    p.add_argument("name", help="Customer name")
    p.add_argument("--street", help="Street address")
    p.add_argument("--zip", help="ZIP/postal code")
    p.add_argument("--city", help="City")
    p.add_argument("--country", default="CH", help="Country code (default: CH)")
    p.add_argument("--phone", help="Phone number")
    p.add_argument("--email", help="Email address")
    p.add_argument("--website", help="Website URL")
    
    p = subparsers.add_parser("update_customer", help="Update a customer")
    p.add_argument("id", help="Customer ID")
    p.add_argument("--name", help="New name")
    p.add_argument("--street", help="Street address")
    p.add_argument("--zip", help="ZIP/postal code")
    p.add_argument("--city", help="City")
    p.add_argument("--country", help="Country code")
    p.add_argument("--phone", help="Phone number")
    p.add_argument("--email", help="Email address")
    p.add_argument("--website", help="Website URL")
    
    # === Time Tracking ===
    p = subparsers.add_parser("start_timer", help="Start a timer")
    p.add_argument("project", help="Project name (fuzzy match)")
    p.add_argument("description", nargs="?", help="Work description")
    
    subparsers.add_parser("stop_timer", help="Stop timer and log time")
    subparsers.add_parser("list_times_today", help="Show today's time entries")
    
    # === Tasks ===
    p = subparsers.add_parser("list_tasks", help="List tasks")
    p.add_argument("--project-id", type=int, help="Filter by project ID")
    
    p = subparsers.add_parser("create_task", help="Create a task")
    p.add_argument("name", help="Task name")
    p.add_argument("--project-id", type=int, required=True, help="Project ID")
    p.add_argument("--description", help="Task description")
    
    p = subparsers.add_parser("update_task", help="Update a task")
    p.add_argument("id", help="Task ID")
    p.add_argument("--name", help="New name")
    p.add_argument("--status", help="Status")
    
    # === Products ===
    subparsers.add_parser("list_products", help="List all products")
    
    p = subparsers.add_parser("create_product", help="Create a product")
    p.add_argument("name", help="Product name")
    p.add_argument("--price", type=float, help="Price in CHF")
    p.add_argument("--description", help="Product description")
    
    p = subparsers.add_parser("update_product", help="Update a product")
    p.add_argument("id", help="Product ID")
    p.add_argument("--name", help="New name")
    p.add_argument("--price", type=float, help="Price in CHF")
    
    args = parser.parse_args()
    
    # Dispatch commands
    commands = {
        "list_projects": list_projects,
        "create_project": create_project,
        "update_project": update_project,
        "list_customers": list_customers,
        "create_customer": create_customer,
        "update_customer": update_customer,
        "start_timer": start_timer,
        "stop_timer": stop_timer,
        "list_times_today": list_times_today,
        "list_tasks": list_tasks,
        "create_task": create_task,
        "update_task": update_task,
        "list_products": list_products,
        "create_product": create_product,
        "update_product": update_product,
    }
    
    commands[args.command](args)

if __name__ == "__main__":
    main()

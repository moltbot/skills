#!/usr/bin/env python3
"""
GEO Monitor - Track Gameye's visibility in Perplexity AI search results

Usage:
    ./geo-monitor.py --test                    # Run all test queries
    ./geo-monitor.py --query "your question"   # Single query
    ./geo-monitor.py --report                  # Generate report from history
"""

import json
import os
import sys
import time
from datetime import datetime
from pathlib import Path
import subprocess

# Load .env file
def load_env():
    env_path = Path(__file__).parent.parent / ".env"
    if env_path.exists():
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, value = line.split("=", 1)
                    os.environ[key] = value

load_env()

# Competitors to track
COMPETITORS = [
    "edgegap", "pragma", "rivet", "hathora", "nakama",
    "aws gamelift", "google agones", "playfab", "xsolla"
]

GAMEYE_DOMAINS = ["gameye.com", "docs.gameye.com"]

def call_perplexity(query):
    """Call Perplexity via Clawdbot's web_search tool"""
    # Use clawdbot CLI to run web_search
    cmd = [
        "clawdbot", "run",
        "--agent", "main",
        "--message", f"web_search: {query}",
        "--json"
    ]
    
    # Fallback: direct API call via curl
    api_key = os.getenv("PERPLEXITY_API_KEY")
    if not api_key:
        print("❌ PERPLEXITY_API_KEY not set")
        return None
    
    import requests
    
    try:
        response = requests.post(
            "https://api.perplexity.ai/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            },
            json={
                "model": "sonar-pro",
                "messages": [
                    {"role": "user", "content": query}
                ]
            },
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            content = data["choices"][0]["message"]["content"]
            citations = data.get("citations", [])
            
            return {
                "query": query,
                "content": content,
                "citations": citations,
                "timestamp": datetime.utcnow().isoformat()
            }
        else:
            print(f"❌ API error: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"❌ Request failed: {e}")
        return None

def analyze_result(result):
    """Analyze a Perplexity result for Gameye mentions and citations"""
    if not result:
        return None
    
    content = result["content"].lower()
    citations = result.get("citations", [])
    
    # Check for Gameye mentions
    gameye_mentioned = "gameye" in content
    
    # Check for Gameye citations
    gameye_citations = [c for c in citations if any(domain in c.lower() for domain in GAMEYE_DOMAINS)]
    gameye_cited = len(gameye_citations) > 0
    
    # Citation position (1-indexed)
    citation_position = None
    if gameye_cited:
        for i, citation in enumerate(citations, 1):
            if any(domain in citation.lower() for domain in GAMEYE_DOMAINS):
                citation_position = i
                break
    
    # Check for competitor mentions
    competitor_mentions = []
    for comp in COMPETITORS:
        if comp.lower() in content:
            competitor_mentions.append(comp)
    
    # Check for competitor citations
    competitor_citations = []
    for citation in citations:
        for comp in COMPETITORS:
            if comp.replace(" ", "") in citation.lower():
                competitor_citations.append(comp)
                break
    
    analysis = {
        "gameye_mentioned": gameye_mentioned,
        "gameye_cited": gameye_cited,
        "gameye_citations": gameye_citations,
        "citation_position": citation_position,
        "total_citations": len(citations),
        "competitor_mentions": competitor_mentions,
        "competitor_citations": competitor_citations,
        "content_length": len(content)
    }
    
    return analysis

def save_result(query_id, query, result, analysis):
    """Save result to history"""
    history_dir = Path("geo-history")
    history_dir.mkdir(exist_ok=True)
    
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    filename = history_dir / f"{timestamp}-{query_id}.json"
    
    data = {
        "query_id": query_id,
        "query": query,
        "timestamp": timestamp,
        "result": result,
        "analysis": analysis
    }
    
    with open(filename, "w") as f:
        json.dump(data, f, indent=2)
    
    return filename

def print_analysis(query, analysis):
    """Pretty print analysis results"""
    print(f"\n{'='*60}")
    print(f"Query: {query}")
    print(f"{'='*60}")
    
    # Gameye visibility
    if analysis["gameye_cited"]:
        print(f"✅ Gameye CITED - Position #{analysis['citation_position']} of {analysis['total_citations']}")
        print(f"   Citations: {', '.join(analysis['gameye_citations'])}")
    elif analysis["gameye_mentioned"]:
        print(f"⚠️  Gameye MENTIONED but NOT CITED")
    else:
        print(f"❌ Gameye NOT FOUND")
    
    # Competitor analysis
    if analysis["competitor_mentions"]:
        print(f"\n🔍 Competitors mentioned: {', '.join(analysis['competitor_mentions'])}")
    
    if analysis["competitor_citations"]:
        print(f"⚠️  Competitors cited: {', '.join(analysis['competitor_citations'])}")
    
    print()

def run_test_queries():
    """Run all test queries from geo-test-queries.json"""
    queries_file = Path("scripts/geo-test-queries.json")
    
    if not queries_file.exists():
        print("❌ geo-test-queries.json not found")
        return
    
    with open(queries_file) as f:
        data = json.load(f)
    
    queries = data["queries"]
    results_summary = []
    
    print(f"\n🚀 Running {len(queries)} GEO test queries...\n")
    
    for i, q in enumerate(queries, 1):
        print(f"[{i}/{len(queries)}] Testing: {q['query']}")
        
        result = call_perplexity(q["query"])
        if result:
            analysis = analyze_result(result)
            save_result(q["id"], q["query"], result, analysis)
            print_analysis(q["query"], analysis)
            
            results_summary.append({
                "query_id": q["id"],
                "category": q["category"],
                "priority": q["priority"],
                "expected": q["expectedCitation"],
                "actual_cited": analysis["gameye_cited"],
                "citation_position": analysis.get("citation_position"),
                "competitor_count": len(analysis["competitor_mentions"])
            })
            
            # Rate limiting - wait between queries
            if i < len(queries):
                print("⏳ Waiting 3 seconds...")
                time.sleep(3)
        else:
            print(f"❌ Query failed\n")
    
    # Summary report
    print(f"\n{'='*60}")
    print("SUMMARY REPORT")
    print(f"{'='*60}\n")
    
    total = len(results_summary)
    cited = sum(1 for r in results_summary if r["actual_cited"])
    expected = sum(1 for r in results_summary if r["expected"])
    met_expectations = sum(1 for r in results_summary if r["expected"] == r["actual_cited"])
    
    print(f"Total queries: {total}")
    if total > 0:
        print(f"Gameye cited: {cited} ({cited/total*100:.1f}%)")
        print(f"Expected citations: {expected}")
        print(f"Met expectations: {met_expectations}/{total} ({met_expectations/total*100:.1f}%)")
    else:
        print("No successful queries - check API key and connection")
    
    # Critical misses
    critical_misses = [r for r in results_summary 
                       if r["priority"] == "critical" and r["expected"] and not r["actual_cited"]]
    
    if critical_misses:
        print(f"\n⚠️  CRITICAL GAPS ({len(critical_misses)} queries):")
        for miss in critical_misses:
            print(f"   - {miss['query_id']} ({miss['category']})")
    
    # Save summary
    summary_file = Path("geo-history") / f"summary-{datetime.now().strftime('%Y%m%d-%H%M%S')}.json"
    with open(summary_file, "w") as f:
        json.dump({
            "timestamp": datetime.now().isoformat(),
            "total": total,
            "cited": cited,
            "citation_rate": cited/total,
            "results": results_summary
        }, f, indent=2)
    
    print(f"\n📊 Full summary saved: {summary_file}")

def run_single_query(query):
    """Run a single query"""
    print(f"\n🔍 Testing: {query}\n")
    
    result = call_perplexity(query)
    if result:
        analysis = analyze_result(result)
        print_analysis(query, analysis)
        
        # Print full response
        print("FULL RESPONSE:")
        print("-" * 60)
        print(result["content"])
        print("-" * 60)
        
        if result.get("citations"):
            print("\nCITATIONS:")
            for i, citation in enumerate(result["citations"], 1):
                print(f"[{i}] {citation}")

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="GEO Monitor for Gameye")
    parser.add_argument("--test", action="store_true", help="Run all test queries")
    parser.add_argument("--query", type=str, help="Run single query")
    parser.add_argument("--report", action="store_true", help="Generate report from history")
    
    args = parser.parse_args()
    
    if args.test:
        run_test_queries()
    elif args.query:
        run_single_query(args.query)
    elif args.report:
        print("📊 Report generation not yet implemented")
    else:
        parser.print_help()

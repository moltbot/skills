#!/usr/bin/env python3
"""
Generate daily GEO monitoring report and send to Telegram
"""

import json
import os
from pathlib import Path
from datetime import datetime
import glob

def get_latest_summary():
    """Get the most recent GEO test summary"""
    summary_files = glob.glob("geo-history/summary-*.json")
    if not summary_files:
        return None
    
    latest = max(summary_files, key=os.path.getmtime)
    with open(latest) as f:
        return json.load(f)

def format_report(data):
    """Format GEO test results as Telegram message"""
    if not data:
        return "⚠️ No GEO test data available"
    
    total = data.get("total", 0)
    cited = data.get("cited", 0)
    rate = data.get("citation_rate", 0) * 100
    
    # Count by priority
    results = data.get("results", [])
    critical_cited = sum(1 for r in results if r.get("priority") == "critical" and r.get("actual_cited"))
    critical_total = sum(1 for r in results if r.get("priority") == "critical")
    
    # Find improvements (would need historical comparison)
    improvements = []
    new_citations = []
    
    # Check for newly cited pages
    for r in results:
        if r.get("actual_cited") and not r.get("expected"):
            new_citations.append(r["query_id"])
    
    message = f"""📊 **Daily GEO Report** - {datetime.now().strftime('%Y-%m-%d')}

**Overall Performance:**
• Citation rate: **{cited}/{total}** ({rate:.1f}%)
• Critical queries: **{critical_cited}/{critical_total}** cited

**Status by Category:**"""
    
    # Group by category
    categories = {}
    for r in results:
        cat = r.get("category", "Other")
        if cat not in categories:
            categories[cat] = {"cited": 0, "total": 0}
        categories[cat]["total"] += 1
        if r.get("actual_cited"):
            categories[cat]["cited"] += 1
    
    for cat, stats in sorted(categories.items()):
        cited_count = stats["cited"]
        total_count = stats["total"]
        emoji = "✅" if cited_count == total_count else "⚠️" if cited_count > 0 else "❌"
        message += f"\n{emoji} {cat}: {cited_count}/{total_count}"
    
    if new_citations:
        message += f"\n\n🎉 **New citations:** {', '.join(new_citations)}"
    
    # Top gaps
    critical_gaps = [r for r in results if r.get("priority") == "critical" and r.get("expected") and not r.get("actual_cited")]
    if critical_gaps:
        message += f"\n\n⚠️ **Critical gaps ({len(critical_gaps)}):**"
        for gap in critical_gaps[:3]:  # Show top 3
            message += f"\n• {gap['category']}: {gap['query_id']}"
    
    message += "\n\n💡 Tip: Run `python3 scripts/geo-monitor.py --query \"your test\"` to test specific queries"
    
    return message

if __name__ == "__main__":
    data = get_latest_summary()
    report = format_report(data)
    print(report)

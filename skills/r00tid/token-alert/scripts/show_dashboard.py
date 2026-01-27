#!/usr/bin/env python3
"""
Token Alert Dashboard Launcher  
Displays rich UI dashboard with real provider data
"""

import sys
import json
from pathlib import Path


def get_provider_data():
    """
    Get token usage from configured provider.
    
    Returns:
        dict: Provider usage data
    """
    try:
        # Import provider
        sys.path.insert(0, str(Path(__file__).parent))
        from providers.anthropic import AnthropicProvider
        
        # Get usage
        provider = AnthropicProvider()
        usage = provider.get_usage()
        
        return usage
        
    except Exception as e:
        print(f"Warning: Could not get provider data: {e}", file=sys.stderr)
        # Fallback to demo data
        return {
            "provider": "anthropic",
            "model": "Claude Sonnet 4.5",
            "used": 0,
            "limit": 1000000,
            "percent": 0.0,
            "type": "api",
            "error": None
        }


def generate_dashboard_html(usage_data):
    """
    Generate dashboard HTML with real token data.
    
    Args:
        usage_data (dict): Provider usage data
        
    Returns:
        str: HTML content with data injected
    """
    # Read template
    template_path = Path(__file__).parent / "dashboard-v3.html"
    with open(template_path, 'r', encoding='utf-8') as f:
        html = f.read()
    
    # Inject real data
    percent = usage_data.get("percent", 0.0)
    model = usage_data.get("model", "Claude Sonnet 4.5")
    
    # Replace DEMO_PERCENT
    html = html.replace('const DEMO_PERCENT = 78;', f'const DEMO_PERCENT = {percent};')
    
    # Replace model name (keep version number)
    model_short = model.replace('Claude ', '')
    html = html.replace('Sonnet 4.5', model_short)
    
    return html


def show_canvas_dashboard():
    """
    Display dashboard via Canvas tool with real provider data.
    """
    # Get provider data
    usage_data = get_provider_data()
    
    # Generate HTML
    html = generate_dashboard_html(usage_data)
    
    # Save to temp file
    output_path = Path("/tmp/token-alert-dashboard.html")
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(html)
    
    print(f"✅ Dashboard generated: {output_path}")
    print(f"\n📊 Current Usage:")
    print(f"   Provider: {usage_data['provider']}")
    print(f"   Model: {usage_data['model']}")
    print(f"   Used: {usage_data['used']:,} / {usage_data['limit']:,}")
    print(f"   Percent: {usage_data['percent']:.1f}%")
    print(f"\nTo view in browser: open {output_path}")
    
    return str(output_path)


def main():
    """Main entry point"""
    dashboard_path = show_canvas_dashboard()
    
    # Output path for Clawdbot to use
    print(f"\nDashboard URL: file://{dashboard_path}")
    
    return 0


if __name__ == "__main__":
    sys.exit(main())

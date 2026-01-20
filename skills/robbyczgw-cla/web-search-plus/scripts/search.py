#!/usr/bin/env python3
"""
Web Search Plus — Unified Multi-Provider Search
Supports: Serper (Google), Tavily (Research), Exa (Neural)

Usage:
    python3 search.py --provider [serper|tavily|exa] --query "..." [options]

Examples:
    python3 search.py -p serper -q "iPhone 16 specs"
    python3 search.py -p tavily -q "quantum computing" --depth advanced
    python3 search.py -p exa -q "AI startups" --category company
    python3 search.py -p exa --similar-url "https://openai.com"
"""

import argparse
import json
import os
import sys
from pathlib import Path
from typing import Optional, List, Dict, Any
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError


# =============================================================================
# Configuration
# =============================================================================

def load_config() -> Dict[str, Any]:
    """Load configuration from config.json if it exists."""
    config_path = Path(__file__).parent.parent / "config.json"
    if config_path.exists():
        try:
            with open(config_path) as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            pass
    return {}


def get_env_key(provider: str) -> Optional[str]:
    """Get API key for provider from environment."""
    key_map = {
        "serper": "SERPER_API_KEY",
        "tavily": "TAVILY_API_KEY",
        "exa": "EXA_API_KEY",
    }
    return os.environ.get(key_map.get(provider, ""))


def validate_api_key(provider: str) -> str:
    """Validate and return API key, with helpful error messages."""
    key = get_env_key(provider)
    
    if not key:
        env_var = {
            "serper": "SERPER_API_KEY",
            "tavily": "TAVILY_API_KEY", 
            "exa": "EXA_API_KEY"
        }[provider]
        
        urls = {
            "serper": "https://serper.dev",
            "tavily": "https://tavily.com",
            "exa": "https://exa.ai"
        }
        
        error_msg = {
            "error": f"Missing API key for {provider}",
            "env_var": env_var,
            "how_to_fix": [
                f"1. Get your API key from {urls[provider]}",
                f"2. Set the environment variable:",
                f"   export {env_var}=\"your-key\"",
                f"3. Or add to .env file:",
                f"   echo '{env_var}=your-key' >> .env && source .env"
            ],
            "provider": provider
        }
        print(json.dumps(error_msg, indent=2), file=sys.stderr)
        sys.exit(1)
    
    # Basic validation
    if len(key) < 10:
        print(json.dumps({
            "error": f"API key for {provider} appears invalid (too short)",
            "provider": provider
        }, indent=2), file=sys.stderr)
        sys.exit(1)
    
    return key


# =============================================================================
# HTTP Client
# =============================================================================

def make_request(url: str, headers: dict, body: dict, timeout: int = 30) -> dict:
    """Make HTTP POST request and return JSON response."""
    data = json.dumps(body).encode("utf-8")
    req = Request(url, data=data, headers=headers, method="POST")
    
    try:
        with urlopen(req, timeout=timeout) as response:
            return json.loads(response.read().decode("utf-8"))
    except HTTPError as e:
        error_body = e.read().decode("utf-8") if e.fp else str(e)
        try:
            error_json = json.loads(error_body)
            error_detail = error_json.get("error") or error_json.get("message") or error_body
        except json.JSONDecodeError:
            error_detail = error_body[:500]
        
        error_messages = {
            401: "Invalid or expired API key. Please check your credentials.",
            403: "Access forbidden. Your API key may not have permission for this operation.",
            429: "Rate limit exceeded. Please wait a moment and try again.",
            500: "Server error. The search provider is experiencing issues.",
            503: "Service unavailable. The search provider may be down."
        }
        
        friendly_msg = error_messages.get(e.code, f"API error: {error_detail}")
        raise Exception(f"{friendly_msg} (HTTP {e.code})")
    except URLError as e:
        raise Exception(f"Network error: {e.reason}. Check your internet connection.")
    except TimeoutError:
        raise Exception(f"Request timed out after {timeout}s. Try again or reduce max_results.")


# =============================================================================
# Serper (Google Search API)
# =============================================================================

def search_serper(
    query: str,
    api_key: str,
    max_results: int = 5,
    country: str = "us",
    language: str = "en",
    search_type: str = "search",
    time_range: Optional[str] = None,
    include_images: bool = False,
) -> dict:
    """
    Search using Serper (Google Search API).
    
    Best for: Products, shopping, local businesses, quick facts, news, images
    
    Supported countries: us, uk, ca, au, de, fr, es, it, at, ch, nl, etc.
    Supported languages: en, de, fr, es, it, nl, pt, ru, zh, ja, ko, etc.
    """
    endpoint = f"https://google.serper.dev/{search_type}"
    
    body = {
        "q": query,
        "gl": country,
        "hl": language,
        "num": max_results,
        "autocorrect": True,
    }
    
    # Add time range filter
    if time_range and time_range != "none":
        tbs_map = {
            "hour": "qdr:h",
            "day": "qdr:d",
            "week": "qdr:w",
            "month": "qdr:m",
            "year": "qdr:y",
        }
        if time_range in tbs_map:
            body["tbs"] = tbs_map[time_range]
    
    headers = {
        "X-API-KEY": api_key,
        "Content-Type": "application/json",
    }
    
    data = make_request(endpoint, headers, body)
    
    # Parse organic results
    results = []
    for i, item in enumerate(data.get("organic", [])[:max_results]):
        results.append({
            "title": item.get("title", ""),
            "url": item.get("link", ""),
            "snippet": item.get("snippet", ""),
            "score": round(1.0 - i * 0.1, 2),
            "date": item.get("date"),
        })
    
    # Extract answer from various sources
    answer = ""
    if data.get("answerBox", {}).get("answer"):
        answer = data["answerBox"]["answer"]
    elif data.get("answerBox", {}).get("snippet"):
        answer = data["answerBox"]["snippet"]
    elif data.get("knowledgeGraph", {}).get("description"):
        answer = data["knowledgeGraph"]["description"]
    elif results:
        answer = results[0]["snippet"]
    
    # Get images if requested
    images = []
    if include_images:
        try:
            img_data = make_request(
                "https://google.serper.dev/images",
                headers,
                {"q": query, "gl": country, "hl": language, "num": 5},
            )
            images = [img.get("imageUrl", "") for img in img_data.get("images", [])[:5] if img.get("imageUrl")]
        except Exception:
            pass  # Continue without images
    
    return {
        "provider": "serper",
        "query": query,
        "results": results,
        "images": images,
        "answer": answer,
        "knowledge_graph": data.get("knowledgeGraph"),
        "related_searches": [r.get("query") for r in data.get("relatedSearches", [])]
    }


# =============================================================================
# Tavily (Research Search)
# =============================================================================

def search_tavily(
    query: str,
    api_key: str,
    max_results: int = 5,
    depth: str = "basic",
    topic: str = "general",
    include_domains: Optional[List[str]] = None,
    exclude_domains: Optional[List[str]] = None,
    include_images: bool = False,
    include_raw_content: bool = False,
) -> dict:
    """
    Search using Tavily (AI Research Search).
    
    Best for: Research questions, deep dives, synthesized answers, full content
    """
    endpoint = "https://api.tavily.com/search"
    
    body = {
        "api_key": api_key,
        "query": query,
        "max_results": max_results,
        "search_depth": depth,
        "topic": topic,
        "include_images": include_images,
        "include_answer": True,
        "include_raw_content": include_raw_content,
    }
    
    if include_domains:
        body["include_domains"] = include_domains
    if exclude_domains:
        body["exclude_domains"] = exclude_domains
    
    headers = {"Content-Type": "application/json"}
    
    data = make_request(endpoint, headers, body)
    
    # Parse results
    results = []
    for item in data.get("results", [])[:max_results]:
        result = {
            "title": item.get("title", ""),
            "url": item.get("url", ""),
            "snippet": item.get("content", ""),
            "score": round(item.get("score", 0.0), 3),
        }
        if include_raw_content and item.get("raw_content"):
            result["raw_content"] = item["raw_content"]
        results.append(result)
    
    return {
        "provider": "tavily",
        "query": query,
        "results": results,
        "images": data.get("images", []),
        "answer": data.get("answer", ""),
    }


# =============================================================================
# Exa (Neural/Semantic Search)
# =============================================================================

def search_exa(
    query: str,
    api_key: str,
    max_results: int = 5,
    search_type: str = "neural",
    category: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    similar_url: Optional[str] = None,
    include_domains: Optional[List[str]] = None,
    exclude_domains: Optional[List[str]] = None,
) -> dict:
    """
    Search using Exa (Neural/Semantic Search).
    
    Best for: Semantic queries, similar pages, company discovery, research papers
    """
    # Use findSimilar for URL-based search, otherwise regular search
    if similar_url:
        endpoint = "https://api.exa.ai/findSimilar"
        body = {
            "url": similar_url,
            "numResults": max_results,
            "contents": {
                "text": {"maxCharacters": 1000},
                "highlights": True,
            },
        }
    else:
        endpoint = "https://api.exa.ai/search"
        body = {
            "query": query,
            "numResults": max_results,
            "type": search_type,
            "contents": {
                "text": {"maxCharacters": 1000},
                "highlights": True,
            },
        }
    
    # Add optional filters
    if category:
        body["category"] = category
    if start_date:
        body["startPublishedDate"] = start_date
    if end_date:
        body["endPublishedDate"] = end_date
    if include_domains:
        body["includeDomains"] = include_domains
    if exclude_domains:
        body["excludeDomains"] = exclude_domains
    
    headers = {
        "x-api-key": api_key,
        "Content-Type": "application/json",
    }
    
    data = make_request(endpoint, headers, body)
    
    # Parse results
    results = []
    for item in data.get("results", [])[:max_results]:
        highlights = item.get("highlights", [])
        snippet = highlights[0] if highlights else (item.get("text", "") or "")[:500]
        
        results.append({
            "title": item.get("title", ""),
            "url": item.get("url", ""),
            "snippet": snippet,
            "score": round(item.get("score", 0.0), 3),
            "published_date": item.get("publishedDate"),
            "author": item.get("author"),
        })
    
    # Synthesize answer from top result
    answer = results[0]["snippet"] if results else ""
    
    return {
        "provider": "exa",
        "query": query if not similar_url else f"Similar to: {similar_url}",
        "results": results,
        "images": [],
        "answer": answer,
    }


# =============================================================================
# CLI
# =============================================================================

def main():
    # Load config for defaults
    config = load_config()
    
    parser = argparse.ArgumentParser(
        description="Web Search Plus — Unified multi-provider search (Serper, Tavily, Exa)",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Provider Guide:
  serper  → Google Search: products, shopping, local, quick facts, news
  tavily  → Research: deep dives, synthesized answers, full content
  exa     → Neural: semantic queries, similar pages, company discovery

Examples:
  # Quick product lookup (Serper)
  python3 search.py -p serper -q "iPhone 16 specs" --images

  # Deep research (Tavily)
  python3 search.py -p tavily -q "quantum computing" --depth advanced --raw-content

  # Find similar companies (Exa)
  python3 search.py -p exa --similar-url "https://stripe.com" --category company

  # Semantic search (Exa)
  python3 search.py -p exa -q "AI coding assistant startups" --category company

Full docs: See README.md and SKILL.md
        """,
    )
    
    # Common arguments
    parser.add_argument(
        "--provider", "-p", 
        required=True, 
        choices=["serper", "tavily", "exa"],
        help="Search provider (serper=Google, tavily=Research, exa=Neural)"
    )
    parser.add_argument(
        "--query", "-q", 
        help="Search query (required unless using --similar-url with Exa)"
    )
    parser.add_argument(
        "--max-results", "-n", 
        type=int, 
        default=config.get("defaults", {}).get("max_results", 5),
        help="Maximum results (default: 5)"
    )
    parser.add_argument(
        "--images", 
        action="store_true",
        help="Include images (Serper/Tavily)"
    )
    
    # Serper-specific
    serper_config = config.get("serper", {})
    parser.add_argument(
        "--country", 
        default=serper_config.get("country", "us"),
        help="Country code for Serper (us, uk, ca, au, de, fr, es, it, at, etc.) (default: us)"
    )
    parser.add_argument(
        "--language", 
        default=serper_config.get("language", "en"),
        help="Language code for Serper (en, de, fr, es, it, nl, pt, ru, zh, ja, ko, etc.) (default: en)"
    )
    parser.add_argument(
        "--type", 
        dest="search_type", 
        default=serper_config.get("type", "search"),
        choices=["search", "news", "images", "videos", "places", "shopping"],
        help="Serper search type (default: search)"
    )
    parser.add_argument(
        "--time-range", 
        choices=["hour", "day", "week", "month", "year"],
        help="Time filter for Serper"
    )
    
    # Tavily-specific
    tavily_config = config.get("tavily", {})
    parser.add_argument(
        "--depth", 
        default=tavily_config.get("depth", "basic"), 
        choices=["basic", "advanced"],
        help="Tavily search depth (default: basic, advanced costs more)"
    )
    parser.add_argument(
        "--topic", 
        default=tavily_config.get("topic", "general"), 
        choices=["general", "news"],
        help="Tavily topic mode (default: general)"
    )
    parser.add_argument(
        "--raw-content", 
        action="store_true",
        help="Include full page content (Tavily, increases response size)"
    )
    
    # Exa-specific
    exa_config = config.get("exa", {})
    parser.add_argument(
        "--exa-type", 
        default=exa_config.get("type", "neural"), 
        choices=["neural", "keyword"],
        help="Exa search type (default: neural for semantic, keyword for exact)"
    )
    parser.add_argument(
        "--category",
        choices=[
            "company", "research paper", "news", "pdf", "github", 
            "tweet", "personal site", "linkedin profile"
        ],
        default=exa_config.get("category"),
        help="Exa category filter"
    )
    parser.add_argument("--start-date", help="Start date for Exa (YYYY-MM-DD)")
    parser.add_argument("--end-date", help="End date for Exa (YYYY-MM-DD)")
    parser.add_argument(
        "--similar-url", 
        help="Find pages similar to this URL (Exa only, replaces query)"
    )
    
    # Domain filters (Tavily/Exa)
    parser.add_argument(
        "--include-domains", 
        nargs="+",
        help="Only include these domains (Tavily/Exa)"
    )
    parser.add_argument(
        "--exclude-domains", 
        nargs="+",
        help="Exclude these domains (Tavily/Exa)"
    )
    
    # Output options
    parser.add_argument(
        "--compact", 
        action="store_true",
        help="Compact JSON output (no indentation)"
    )
    
    args = parser.parse_args()
    
    # Validate query is provided (unless using similar-url for Exa)
    if not args.query and not (args.provider == "exa" and args.similar_url):
        parser.error("--query is required (unless using --similar-url with Exa)")
    
    # Validate API key
    api_key = validate_api_key(args.provider)
    
    try:
        if args.provider == "serper":
            result = search_serper(
                query=args.query,
                api_key=api_key,
                max_results=args.max_results,
                country=args.country,
                language=args.language,
                search_type=args.search_type,
                time_range=args.time_range,
                include_images=args.images,
            )
        elif args.provider == "tavily":
            result = search_tavily(
                query=args.query,
                api_key=api_key,
                max_results=args.max_results,
                depth=args.depth,
                topic=args.topic,
                include_domains=args.include_domains,
                exclude_domains=args.exclude_domains,
                include_images=args.images,
                include_raw_content=args.raw_content,
            )
        elif args.provider == "exa":
            result = search_exa(
                query=args.query or "",
                api_key=api_key,
                max_results=args.max_results,
                search_type=args.exa_type,
                category=args.category,
                start_date=args.start_date,
                end_date=args.end_date,
                similar_url=args.similar_url,
                include_domains=args.include_domains,
                exclude_domains=args.exclude_domains,
            )
        
        # Output
        indent = None if args.compact else 2
        print(json.dumps(result, indent=indent, ensure_ascii=False))
        
    except Exception as e:
        error_result = {
            "error": str(e),
            "provider": args.provider,
            "query": args.query,
        }
        print(json.dumps(error_result, indent=2), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
# /// script
# requires-python = ">=3.10"
# dependencies = [
#     "requests>=2.31.0",
#     "urllib3>=2.0.0",
# ]
# ///

"""
Shopping Expert - Dual-mode product search (online + local)

Find and compare products from e-commerce sites and local stores with
smart scoring based on price, ratings, availability, and preferences.
"""

import argparse
import json
import math
import os
import re
import sys
import time
from dataclasses import dataclass, asdict
from datetime import datetime
from enum import Enum
from typing import Literal

import requests


# ============================================================================
# Configuration
# ============================================================================

SERPAPI_KEY = os.environ.get("SERPAPI_API_KEY")
PLACES_API_KEY = os.environ.get("GOOGLE_PLACES_API_KEY")

SERP_BASE_URL = "https://serpapi.com/search"
PLACES_BASE_URL = "https://places.googleapis.com/v1"


# ============================================================================
# Data Structures
# ============================================================================

class SearchMode(Enum):
    ONLINE = "online"
    LOCAL = "local"
    HYBRID = "hybrid"


@dataclass
class BudgetConstraints:
    min_price: float | None
    max_price: float | None
    target_price: float | None


@dataclass
class Coordinates:
    lat: float
    lng: float
    address: str


@dataclass
class Product:
    name: str
    price: float
    currency: str
    source: str
    source_type: Literal["online", "local"]
    rating: float | None
    review_count: int
    availability: str
    buy_link: str
    image_url: str | None

    # Online-specific
    shipping: str | None
    delivery_days: int | None

    # Local-specific
    store_address: str | None
    store_location: Coordinates | None
    store_distance_miles: float | None

    # Metadata
    product_id: str
    description: str | None
    brand: str | None
    score: float | None = None


@dataclass
class ShoppingList:
    query: str
    budget: str
    search_mode: SearchMode
    products: list[Product]
    preferences_applied: list[str]
    total_results_found: int
    warnings: list[str]
    search_timestamp: str


# ============================================================================
# Budget Parsing
# ============================================================================

def parse_budget(budget_str: str) -> BudgetConstraints:
    """Parse budget string into price constraints.

    Supports:
    - 'low', 'medium', 'high' (predefined ranges)
    - '$100' (exact amount with ±20% tolerance)
    - '$50-150' (explicit range)
    """
    budget_str = budget_str.strip().lower()

    # Predefined levels
    if budget_str == "low":
        return BudgetConstraints(min_price=0, max_price=50, target_price=25)
    elif budget_str == "medium":
        return BudgetConstraints(min_price=50, max_price=150, target_price=100)
    elif budget_str == "high":
        return BudgetConstraints(min_price=150, max_price=None, target_price=300)

    # Explicit range: "$50-150"
    range_match = re.match(r'\$?(\d+(?:\.\d+)?)\s*-\s*\$?(\d+(?:\.\d+)?)', budget_str)
    if range_match:
        min_price = float(range_match.group(1))
        max_price = float(range_match.group(2))
        target_price = (min_price + max_price) / 2
        return BudgetConstraints(min_price=min_price, max_price=max_price, target_price=target_price)

    # Exact amount: "$100"
    amount_match = re.match(r'\$?(\d+(?:\.\d+)?)', budget_str)
    if amount_match:
        amount = float(amount_match.group(1))
        # ±20% tolerance
        min_price = amount * 0.8
        max_price = amount * 1.2
        return BudgetConstraints(min_price=min_price, max_price=max_price, target_price=amount)

    # Default to medium
    print(f"Warning: Unrecognized budget '{budget_str}', using 'medium'", file=sys.stderr)
    return BudgetConstraints(min_price=50, max_price=150, target_price=100)


def parse_preferences(prefs_str: str | None) -> list[str]:
    """Parse comma-separated preferences into list of keywords."""
    if not prefs_str:
        return []

    # Split by comma, normalize
    prefs = [p.strip().lower() for p in prefs_str.split(',')]

    # Remove "brand:" prefix if present
    prefs = [p.replace('brand:', '').strip() for p in prefs]

    return [p for p in prefs if p]


# ============================================================================
# Mode Selection
# ============================================================================

def determine_search_mode(query: str, location: str | None, mode: str) -> SearchMode:
    """Determine search mode based on query and location."""
    if mode != "auto":
        return SearchMode(mode)

    query_lower = query.lower()

    # Check for location keywords
    if any(kw in query_lower for kw in ["near me", "local", "nearby", "around here"]):
        return SearchMode.LOCAL

    # If location provided, use hybrid
    if location:
        return SearchMode.HYBRID

    # Default to online
    return SearchMode.ONLINE


# ============================================================================
# API Helpers
# ============================================================================

def call_serpapi(params: dict, retry_count: int = 3) -> dict:
    """Call SerpAPI with retry logic."""
    if not SERPAPI_KEY:
        print("Error: SERPAPI_API_KEY environment variable not set", file=sys.stderr)
        return {}

    params["api_key"] = SERPAPI_KEY

    for attempt in range(retry_count):
        try:
            response = requests.get(SERP_BASE_URL, params=params, timeout=30)

            if response.status_code == 200:
                return response.json()
            elif response.status_code == 429:
                wait_time = 2 ** attempt
                print(f"Rate limited, waiting {wait_time}s...", file=sys.stderr)
                time.sleep(wait_time)
                continue
            else:
                print(f"SerpAPI error: {response.status_code} - {response.text}", file=sys.stderr)
                return {}
        except Exception as e:
            print(f"SerpAPI request failed: {e}", file=sys.stderr)
            if attempt < retry_count - 1:
                time.sleep(2 ** attempt)

    return {}


def call_places_api(endpoint: str, body: dict, retry_count: int = 3) -> dict:
    """Call Google Places API with retry logic."""
    if not PLACES_API_KEY:
        print("Error: GOOGLE_PLACES_API_KEY environment variable not set", file=sys.stderr)
        return {}

    url = f"{PLACES_BASE_URL}/{endpoint}"
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": PLACES_API_KEY,
        "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.location,places.rating,places.priceLevel,places.id,places.types,places.userRatingCount"
    }

    for attempt in range(retry_count):
        try:
            response = requests.post(url, json=body, headers=headers, timeout=30)

            if response.status_code == 200:
                return response.json()
            elif response.status_code == 429:
                wait_time = 2 ** attempt
                print(f"Rate limited, waiting {wait_time}s...", file=sys.stderr)
                time.sleep(wait_time)
                continue
            else:
                print(f"Places API error: {response.status_code} - {response.text}", file=sys.stderr)
                return {}
        except Exception as e:
            print(f"Places API request failed: {e}", file=sys.stderr)
            if attempt < retry_count - 1:
                time.sleep(2 ** attempt)

    return {}


def resolve_location(location: str) -> Coordinates | None:
    """Resolve location string to coordinates."""
    body = {"textQuery": location}
    result = call_places_api("places:searchText", body)

    if not result or "places" not in result or not result["places"]:
        print(f"Error: Could not resolve location '{location}'", file=sys.stderr)
        return None

    place = result["places"][0]
    loc = place.get("location", {})

    return Coordinates(
        lat=loc.get("latitude", 0.0),
        lng=loc.get("longitude", 0.0),
        address=place.get("formattedAddress", location)
    )


# ============================================================================
# Search Functions
# ============================================================================

def search_online_products(query: str, budget: BudgetConstraints, max_results: int = 20, country: str = "de") -> list[Product]:
    """Search for products online via SerpAPI Google Shopping."""
    params = {
        "engine": "google_shopping",
        "q": query,
        "gl": country,
        "hl": country,
        "num": min(max_results, 20)
    }

    # Add price filter if budget specified
    if budget.min_price is not None and budget.min_price > 0:
        params["min_price"] = int(budget.min_price)
    if budget.max_price is not None and budget.max_price > 0:
        params["max_price"] = int(budget.max_price)

    print(f"Searching online for '{query}'...", file=sys.stderr)
    result = call_serpapi(params)

    if not result or "shopping_results" not in result:
        print("No online results found", file=sys.stderr)
        return []

    products = []
    for item in result["shopping_results"][:max_results]:
        product = normalize_online_product(item, country)
        if product:
            products.append(product)

    print(f"Found {len(products)} online products", file=sys.stderr)
    return products


def search_local_stores(query: str, location: Coordinates, radius: int = 5000, max_results: int = 10) -> list[Product]:
    """Search for local stores via Google Places API."""
    body = {
        "textQuery": f"{query} store",
        "locationBias": {
            "circle": {
                "center": {
                    "latitude": location.lat,
                    "longitude": location.lng
                },
                "radius": radius
            }
        }
    }

    print(f"Searching local stores near {location.address}...", file=sys.stderr)
    result = call_places_api("places:searchText", body)

    if not result or "places" not in result:
        print("No local stores found", file=sys.stderr)
        return []

    products = []
    for place in result["places"][:max_results]:
        product = normalize_local_result(place, query, location)
        if product:
            products.append(product)

    print(f"Found {len(products)} local stores", file=sys.stderr)
    return products


# ============================================================================
# Data Normalization
# ============================================================================

def normalize_online_product(item: dict, country: str = "de") -> Product | None:
    """Normalize SerpAPI shopping result to Product dataclass."""
    try:
        # Extract price
        price_str = item.get("extracted_price") or item.get("price") or "0"
        price = float(price_str) if isinstance(price_str, (int, float)) else float(re.sub(r'[^\d.,]', '', str(price_str).replace(',', '.')))

        # Extract rating
        rating = None
        if "rating" in item:
            rating = float(item["rating"])

        # Extract review count
        reviews = item.get("reviews", 0)
        if isinstance(reviews, str):
            reviews = int(re.sub(r'[^\d]', '', reviews)) if reviews else 0

        # Determine availability
        availability = "in_stock"
        if "availability" in item:
            avail = item["availability"].lower()
            if "out of stock" in avail:
                availability = "out_of_stock"
            elif "limited" in avail:
                availability = "limited"

        # Extract shipping info
        shipping = item.get("delivery", item.get("shipping"))
        delivery_days = None
        if shipping and isinstance(shipping, str):
            # Try to extract days: "Free 2-day shipping"
            days_match = re.search(r'(\d+)[- ]day', shipping.lower())
            if days_match:
                delivery_days = int(days_match.group(1))

        # Extract buy link (try multiple field names)
        buy_link = item.get("link") or item.get("product_link") or item.get("url") or ""

        # Infer currency from country
        country_currencies = {"de": "EUR", "us": "USD", "uk": "GBP", "gb": "GBP", "fr": "EUR", "es": "EUR", "it": "EUR"}
        currency = country_currencies.get(country.lower(), "EUR")

        return Product(
            name=item.get("title", "Unknown Product"),
            price=price,
            currency=currency,
            source=item.get("source", "Unknown"),
            source_type="online",
            rating=rating,
            review_count=reviews,
            availability=availability,
            buy_link=buy_link,
            image_url=item.get("thumbnail"),
            shipping=shipping,
            delivery_days=delivery_days,
            store_address=None,
            store_location=None,
            store_distance_miles=None,
            product_id=item.get("product_id", ""),
            description=item.get("snippet"),
            brand=item.get("brand")
        )
    except Exception as e:
        print(f"Error normalizing online product: {e}", file=sys.stderr)
        return None


def calculate_distance_miles(origin: Coordinates, dest_lat: float, dest_lng: float) -> float:
    """Calculate distance between two points using Haversine formula."""
    # Earth radius in miles
    R = 3959.0

    # Convert to radians
    lat1 = math.radians(origin.lat)
    lon1 = math.radians(origin.lng)
    lat2 = math.radians(dest_lat)
    lon2 = math.radians(dest_lng)

    # Haversine formula
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat / 2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return R * c


def normalize_local_result(place: dict, query: str, origin: Coordinates) -> Product | None:
    """Normalize Google Places result to Product dataclass."""
    try:
        # Extract location
        loc = place.get("location", {})
        lat = loc.get("latitude", 0.0)
        lng = loc.get("longitude", 0.0)

        store_location = Coordinates(
            lat=lat,
            lng=lng,
            address=place.get("formattedAddress", "")
        )

        # Calculate distance
        distance = calculate_distance_miles(origin, lat, lng)

        # Extract rating
        rating = place.get("rating")
        if rating:
            rating = float(rating)

        # Create Google Maps link
        address = place.get("formattedAddress", "")
        maps_link = f"https://www.google.com/maps/dir/?api=1&destination={address.replace(' ', '+')}"

        return Product(
            name=place.get("displayName", {}).get("text", "Unknown Store"),
            price=0.0,  # Local stores don't have specific product prices
            currency="USD",
            source=place.get("displayName", {}).get("text", "Local Store"),
            source_type="local",
            rating=rating,
            review_count=place.get("userRatingCount", 0),
            availability="unknown",
            buy_link=maps_link,
            image_url=None,
            shipping=None,
            delivery_days=None,
            store_address=address,
            store_location=store_location,
            store_distance_miles=round(distance, 1),
            product_id=place.get("id", ""),
            description=f"{query} available at this location",
            brand=None
        )
    except Exception as e:
        print(f"Error normalizing local result: {e}", file=sys.stderr)
        return None


# ============================================================================
# Scoring & Selection
# ============================================================================

def calculate_product_score(product: Product, budget: BudgetConstraints, preferences: list[str]) -> float:
    """Calculate weighted score for product ranking."""
    score = 0.0

    # 1. Price Match Score (30%)
    if product.source_type == "online" and budget.target_price:
        if budget.min_price and budget.max_price:
            if budget.min_price <= product.price <= budget.max_price:
                score += 0.30
            else:
                # Penalize based on distance from range
                if product.price < budget.min_price:
                    penalty = (budget.min_price - product.price) / budget.min_price
                else:
                    penalty = (product.price - budget.max_price) / budget.max_price if budget.max_price else 0
                score += max(0, 0.30 - (penalty * 0.15))
    elif product.source_type == "local":
        # Local stores get partial price score (no specific price data)
        score += 0.15

    # 2. Rating Score (25%)
    if product.rating:
        score += (product.rating / 5.0) * 0.25

    # 3. Availability Score (20%)
    availability_weights = {
        "in_stock": 0.20,
        "limited": 0.10,
        "out_of_stock": 0.0,
        "unknown": 0.05
    }
    score += availability_weights.get(product.availability, 0.05)

    # 4. Review Popularity Score (15%)
    if product.review_count > 0:
        normalized_reviews = min(product.review_count / 1000, 1.0)
        score += normalized_reviews * 0.15

    # 5. Shipping/Distance Score (10%)
    if product.source_type == "online":
        if product.shipping:
            shipping_lower = product.shipping.lower()
            if "free" in shipping_lower:
                score += 0.10
            elif "prime" in shipping_lower:
                score += 0.08
            elif product.delivery_days and product.delivery_days <= 2:
                score += 0.05
    else:  # local
        if product.store_distance_miles:
            # Closer is better, normalize to 10 miles
            distance_score = max(0, (1 - product.store_distance_miles / 10.0))
            score += distance_score * 0.10

    # 6. Preference Matching (bonus up to +0.15)
    if preferences:
        product_text = f"{product.name} {product.description or ''} {product.brand or ''}".lower()
        preference_bonus = 0.0
        for pref in preferences:
            if pref in product_text:
                preference_bonus += 0.05
        score += min(preference_bonus, 0.15)

    return round(score, 3)


def select_best_products(products: list[Product], budget: BudgetConstraints, preferences: list[str], count: int) -> list[Product]:
    """Score and select top N products."""
    # Calculate scores
    for product in products:
        product.score = calculate_product_score(product, budget, preferences)

    # Sort by score descending
    products.sort(key=lambda p: p.score or 0, reverse=True)

    # Return top N
    return products[:count]


# ============================================================================
# Output Formatting
# ============================================================================

def format_output_text(shopping_list: ShoppingList) -> str:
    """Format shopping list as Markdown table."""
    lines = []

    # Header
    lines.append(f"# Shopping List: {shopping_list.query.title()}")
    lines.append("")
    lines.append(f"**Budget**: {shopping_list.budget}")
    lines.append(f"**Mode**: {shopping_list.search_mode.value.title()}")
    if shopping_list.preferences_applied:
        lines.append(f"**Preferences**: {', '.join(shopping_list.preferences_applied)}")
    lines.append(f"**Results**: {len(shopping_list.products)} of {shopping_list.total_results_found} found")
    lines.append("")

    # Products table
    lines.append("## Top Picks")
    lines.append("")
    lines.append("| Rank | Product | Price | Rating | Availability | Source | Link |")
    lines.append("|------|---------|-------|--------|--------------|--------|------|")

    for i, product in enumerate(shopping_list.products, 1):
        # Format price with currency symbol
        currency_symbols = {"EUR": "€", "USD": "$", "GBP": "£"}
        currency_sym = currency_symbols.get(product.currency, product.currency)
        if product.source_type == "online":
            price_str = f"{currency_sym}{product.price:.2f}"
        else:
            price_str = "N/A"
            if product.store_distance_miles:
                price_str = f"{product.store_distance_miles} mi"

        # Format rating
        rating_str = f"{product.rating:.1f}⭐ ({product.review_count:,})" if product.rating else "N/A"

        # Format availability
        avail_str = product.availability.replace("_", " ").title()

        # Format source
        source_str = product.source
        if product.source_type == "local" and product.store_distance_miles:
            source_str += f" ({product.store_distance_miles} mi)"

        # Format link
        link_text = "Buy" if product.source_type == "online" else "Directions"
        link_str = f"[{link_text}]({product.buy_link})" if product.buy_link else "N/A"

        lines.append(f"| {i} | {product.name[:40]} | {price_str} | {rating_str} | {avail_str} | {source_str[:20]} | {link_str} |")

    lines.append("")

    # Notes section
    lines.append("**Notes:**")

    # Count preference matches
    if shopping_list.preferences_applied:
        pref_matches = sum(1 for p in shopping_list.products if any(pref in (p.name + (p.description or "")).lower() for pref in shopping_list.preferences_applied))
        if pref_matches > 0:
            lines.append(f"- ✓ {pref_matches} products match your preferences")

    # Count free shipping
    free_shipping_count = sum(1 for p in shopping_list.products if p.shipping and "free" in p.shipping.lower())
    if free_shipping_count > 0:
        lines.append(f"- 🚚 {free_shipping_count} products have free shipping")

    # Count local stores
    local_count = sum(1 for p in shopping_list.products if p.source_type == "local")
    if local_count > 0:
        lines.append(f"- 📍 {local_count} local stores found")

    # Warnings
    for warning in shopping_list.warnings:
        lines.append(f"- ⚠️  {warning}")

    lines.append("")
    lines.append("---")
    lines.append("💡 *Generated by Clawdbot Shopping Expert*")

    return "\n".join(lines)


def format_output_json(shopping_list: ShoppingList) -> str:
    """Format shopping list as JSON."""
    # Convert dataclass to dict
    data = asdict(shopping_list)

    # Convert enum to string
    data["search_mode"] = shopping_list.search_mode.value

    return json.dumps(data, indent=2)


# ============================================================================
# Main
# ============================================================================

def parse_arguments():
    """Parse command-line arguments."""
    parser = argparse.ArgumentParser(
        description="Shopping Expert - Find and compare products online and locally"
    )

    parser.add_argument(
        "query",
        help="Product search query (e.g., 'wireless headphones', 'coffee maker')"
    )

    parser.add_argument(
        "--mode",
        choices=["online", "local", "hybrid", "auto"],
        default="auto",
        help="Search mode (default: auto)"
    )

    parser.add_argument(
        "--budget",
        default="medium",
        help="Budget constraint: 'low/medium/high' or '$X' (default: medium)"
    )

    parser.add_argument(
        "--location",
        help="Location for local/hybrid searches (city, address, or 'near me')"
    )

    parser.add_argument(
        "--preferences",
        help="Comma-separated preferences (e.g., 'brand:Sony, wireless, black')"
    )

    parser.add_argument(
        "--max-results",
        type=int,
        default=5,
        help="Maximum number of products to return (default: 5, max: 20)"
    )

    parser.add_argument(
        "--sort-by",
        choices=["relevance", "price-low", "price-high", "rating"],
        default="relevance",
        help="Sort order (default: relevance)"
    )

    parser.add_argument(
        "--output",
        choices=["text", "json"],
        default="text",
        help="Output format (default: text)"
    )

    parser.add_argument(
        "--country",
        default="de",
        help="Country code for search (default: de). Use 'us' for US, 'uk' for UK, etc."
    )

    return parser.parse_args()


def main():
    """Main entry point."""
    args = parse_arguments()

    # Parse budget and preferences
    budget = parse_budget(args.budget)
    preferences = parse_preferences(args.preferences)

    # Determine search mode
    search_mode = determine_search_mode(args.query, args.location, args.mode)

    # Collect products
    online_products = []
    local_products = []
    warnings = []

    if search_mode in [SearchMode.ONLINE, SearchMode.HYBRID]:
        online_products = search_online_products(args.query, budget, args.max_results * 2, args.country)
        if not online_products:
            warnings.append("No online products found")

    if search_mode in [SearchMode.LOCAL, SearchMode.HYBRID]:
        if not args.location:
            print("Error: --location required for local/hybrid search", file=sys.stderr)
            sys.exit(1)

        location = resolve_location(args.location)
        if not location:
            sys.exit(1)

        local_products = search_local_stores(args.query, location, max_results=args.max_results * 2)
        if not local_products:
            warnings.append("No local stores found")

    # Merge products
    all_products = online_products + local_products

    if not all_products:
        print(f"No products found for '{args.query}'", file=sys.stderr)
        sys.exit(1)

    # Select best products
    best_products = select_best_products(all_products, budget, preferences, args.max_results)

    # Generate shopping list
    shopping_list = ShoppingList(
        query=args.query,
        budget=args.budget,
        search_mode=search_mode,
        products=best_products,
        preferences_applied=preferences,
        total_results_found=len(all_products),
        warnings=warnings,
        search_timestamp=datetime.now().isoformat()
    )

    # Output
    if args.output == "json":
        print(format_output_json(shopping_list))
    else:
        print(format_output_text(shopping_list))


if __name__ == "__main__":
    main()

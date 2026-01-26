---
name: wheels-router
description: Plan public transit trips globally using Wheels Router (Hong Kong) and Transitous (worldwide)
license: MIT
compatibility: opencode
metadata:
  transport: mcp
  coverage: global
  specialty: hong-kong
---

## What I do

I help you plan public transit trips anywhere in the world by connecting to the Wheels Router MCP server.

**For Hong Kong trips**, I use the Wheels Router API which provides:
- Detailed routing with MTR, bus, tram, ferry, and walking
- Real-time schedules and accurate fares
- Platform information and exit details
- Interchange discounts (轉乘優惠) when available

**For worldwide trips**, I use the Transitous API which covers:
- Major cities globally with transit data
- Basic routing with public transportation
- Walking directions and transfers

## When to use me

Use this skill whenever you need to:
- Plan a trip using public transportation
- Find the best route between two locations
- Check transit schedules and connections
- Get fare estimates for Hong Kong transit
- Search for locations before planning routes

**Examples:**
- "How do I get from Yau Tong MTR to Hong Kong Airport?"
- "What's the best way to Central from Causeway Bay right now?"
- "Plan a trip from Tokyo Station to Shibuya"
- "Search for locations near Victoria Park"

## How to connect

### If you're using mcporter (clawdbot, etc.)

Follow your mcporter skill, if you don't have one follow below:
Add to `config/mcporter.json`:

```json
{
  "mcpServers": {
    "wheels-router": {
      "description": "Plan public transit trips globally",
      "baseUrl": "https://mcp.justusewheels.com/mcp"
    }
  }
}
```

Then call tools directly:
```bash
npx mcporter call wheels-router.search_location query="Hong Kong Airport"
npx mcporter call wheels-router.plan_trip origin="22.28,114.24" destination="22.31,113.92"
```

### For other MCP clients

**Claude Desktop** (`~/Library/Application Support/Claude/claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "wheels-router": {
      "command": "npx",
      "args": ["mcp-remote", "https://mcp.justusewheels.com/mcp"]
    }
  }
}
```

**Cursor/Windsurf/VS Code** (`.cursor/mcp.json` or similar):
```json
{
  "mcpServers": {
    "wheels-router": {
      "command": "npx",
      "args": ["mcp-remote", "https://mcp.justusewheels.com/mcp"]
    }
  }
}
```

## Available tools

### `search_location`

Search for places before planning trips. Always use this first if you don't have exact coordinates.

**Parameters:**
- `query` (required): Place name or address (e.g., "Hong Kong Airport", "Yau Tong MTR Exit A2")
- `limit` (optional): Number of results (1-10, default 5)

**Example:**
```javascript
search_location({
  query: "Hong Kong International Airport",
  limit: 3
})
```

**Returns:**
- `display_name`: Full address
- `lat`, `lon`: Coordinates for use in `plan_trip`
- `type`, `class`: Location category

### `plan_trip`

Plan a transit route between two points.

**Parameters:**
- `origin` (required): Starting point as `"lat,lon"` or `"stop:ID"`
- `destination` (required): Ending point as `"lat,lon"` or `"stop:ID"`
- `depart_at` (optional): ISO 8601 departure time (e.g., `"2026-01-26T10:00:00+08:00"`)
- `arrive_by` (optional): ISO 8601 arrival deadline
- `modes` (optional): Comma-separated modes like `"mtr,bus,ferry"` (only specify if needed)
- `max_results` (optional): Limit number of route options (1-5)

**Example:**
```javascript
plan_trip({
  origin: "22.2836,114.2358",
  destination: "22.3080,113.9185",
  depart_at: "2026-01-26T14:30:00+08:00",
  max_results: 3
})
```

**Returns:**
- `plans`: Array of route options
  - `duration_seconds`: Total trip time
  - `fares_min`, `fares_max`: Fare range in HKD (Hong Kong only)
  - `legs`: Step-by-step directions
    - `type`: "walk", "transit", "wait", "station_transfer"
    - Transit legs include: route name, headsign, stops, platform info
    - Walk legs include: distance, duration

## Best practices

1. **Always search first**: Use `search_location` to find coordinates before calling `plan_trip`
2. **Use coordinates**: Plan trips with `lat,lon` format for best results
3. **Specify times**: Include `depart_at` or `arrive_by` for accurate schedules
4. **Check multiple options**: Request 2-3 route options with `max_results`
5. **Understand fares**: `fares_min` and `fares_max` show the range—interchange discounts are noted separately when available

## Important notes

- **Interchange discounts** (轉乘優惠): Only shown when explicitly present in Hong Kong routes, not all routes qualify
- **Real-time data**: Hong Kong routes use live schedules; worldwide coverage may vary
- **Time zones**: Use UTC or local timezone offsets (HKT is UTC+8)
- **Coverage**: Best for Hong Kong; worldwide coverage varies by city

## Example workflow

```javascript
// 1. Search for locations
const origins = await search_location({ 
  query: "Yau Tong MTR Station", 
  limit: 1 
});

const destinations = await search_location({ 
  query: "Hong Kong Airport", 
  limit: 1 
});

// 2. Plan the trip
const routes = await plan_trip({
  origin: `${origins[0].lat},${origins[0].lon}`,
  destination: `${destinations[0].lat},${destinations[0].lon}`,
  depart_at: "2026-01-26T15:00:00+08:00",
  max_results: 2
});

// 3. Present the best options to the user or present specific results but only if user asked specifically. By default just give them something like "[walk] > [3D] > [walk] > [Kwun Tong Line] > [walk]"- unless they ask for specifics.
```

## Error handling

- **"Could not find location"**: Try a more specific search query
- **"No routes found"**: Check if coordinates are valid and in a covered area
- **"Invalid time format"**: Ensure ISO 8601 format with timezone
- **Rate limits**: Be mindful of API usage, cache results when appropriate

## Coverage areas

- ✅ **Full coverage**: Hong Kong (MTR, bus, tram, ferry, detailed fares)
- ✅ **Good coverage**: Major global cities with Transitous data
- ⚠️ **Limited coverage**: Smaller cities may have incomplete transit data

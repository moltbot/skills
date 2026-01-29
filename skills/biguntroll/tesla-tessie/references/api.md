# Tessie API Reference

## Base URL

```
https://api.tessie.com
```

## Authentication

All requests require a Bearer token in the Authorization header:

```
Authorization: Bearer YOUR_API_KEY
```

Get your API key from: https://my.tessie.com/settings/api

## Common Endpoints

### Vehicle Data

- **GET /vehicles** - List all vehicles
- **GET /{vin}/status** - Full vehicle status
- **GET /{vin}/battery** - Battery level and range
- **GET /{vin}/location** - GPS coordinates and heading
- **GET /{vin}/battery_health** - Battery degradation info

### Vehicle Commands

All commands use POST method to `/{vin}/{command}`:

**Climate:**
- `start_climate` - Start HVAC
- `stop_climate` - Stop HVAC
- `set_temperature` - Set temp (requires `{"temperature": <celsius>}` body)
- `start_defrost` - Max defrost mode
- `stop_defrost` - Stop defrost

**Charging:**
- `start_charging` - Begin charging
- `stop_charging` - Stop charging
- `set_charge_limit` - Set limit (requires `{"percent": <0-100>}` body)
- `set_charging_amps` - Set charge current (requires `{"amps": <number>}` body)
- `open_charge_port` - Open charge port
- `close_charge_port` - Close charge port

**Locks & Security:**
- `lock` - Lock doors
- `unlock` - Unlock doors
- `enable_sentry_mode` - Enable sentry
- `disable_sentry_mode` - Disable sentry
- `enable_valet_mode` - Enable valet mode
- `disable_valet_mode` - Disable valet mode

**Alerts:**
- `honk` - Honk horn
- `flash_lights` - Flash lights
- `remote_boombox` - Generate fart sound (requires 2022.40.25+)

**Access:**
- `front_trunk` - Open frunk (front trunk)
- `rear_trunk` - Open trunk
- `vent_windows` - Vent windows
- `close_windows` - Close windows

**Software Updates:**
- `schedule_software_update` - Schedule update (requires `{"in_seconds": <number>}` body, 0 for immediate)
- `cancel_software_update` - Cancel scheduled update

**Other:**
- `wake` - Wake sleeping vehicle
- `trigger_homelink` - Trigger HomeLink

## Response Format

Successful responses return JSON with vehicle state or command confirmation.

Error responses include HTTP status codes:
- 401: Invalid API key
- 404: Vehicle not found
- 408: Vehicle offline/asleep (try `wake` first)
- 429: Rate limit exceeded

## Rate Limits

Tessie enforces rate limits. If you hit limits, responses will include retry-after headers.

## Full Documentation

https://developer.tessie.com/reference

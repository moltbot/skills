# RIDB API Notes

## Endpoints

Base URL: `https://ridb.recreation.gov/api/v1`

| Endpoint | Description |
|----------|-------------|
| `/facilities` | Search all facilities |
| `/facilities/{id}` | Get facility details |
| `/facilities/{id}/campsites` | Get campsites at a facility |
| `/recareas` | Search recreation areas |
| `/activities` | List activity types |

## Authentication

Pass API key in header: `apikey: YOUR_KEY`

## Facility Search Parameters

| Param | Type | Description |
|-------|------|-------------|
| `latitude` | float | Center point latitude |
| `longitude` | float | Center point longitude |
| `radius` | int | Miles from center |
| `limit` | int | Max results (default 50) |
| `offset` | int | Pagination offset |
| `activity` | string | Activity ID filter (9 = Camping) |
| `query` | string | Text search |

## Activity IDs (Common)

| ID | Activity |
|----|----------|
| 9 | Camping |
| 14 | Hiking |
| 5 | Biking |
| 11 | Fishing |
| 25 | Swimming |

## Rate Limits

- No documented rate limits for authenticated requests
- Be respectful; avoid hammering the API

## Availability API (Different!)

RIDB gives you facility metadata. For **availability**, use the recreation.gov availability API:

```
GET https://www.recreation.gov/api/camps/availability/campground/{facilityId}/month
?start_date=2024-07-01T00:00:00.000Z
```

This returns campsite-level availability for that month. No API key needed.

## References

- RIDB Portal: https://ridb.recreation.gov
- Get API Key: https://ridb.recreation.gov/profile
- recreation.gov: https://www.recreation.gov

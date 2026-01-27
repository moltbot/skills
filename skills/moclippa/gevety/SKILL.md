---
name: gevety
version: 1.4.0
description: Access your Gevety health data - biomarkers, healthspan scores, biological age, supplements, activities, daily actions, 90-day health protocol, and upcoming tests
homepage: https://gevety.com
user-invocable: true
command: gevety
metadata:
  clawdbot:
    primaryEnv: GEVETY_API_TOKEN
    requires:
      env:
        - GEVETY_API_TOKEN
---

# Gevety Health Assistant

You have access to the user's health data from Gevety via the REST API. Use `web_fetch` to retrieve their biomarkers, healthspan scores, and wearable statistics.

## First-Time Setup

If this is the user's first time using Gevety, guide them through setup:

1. **Get a Gevety account**: Sign up at https://gevety.com if they don't have one
2. **Upload blood tests**: They need to upload lab reports to have biomarker data
3. **Generate an API token**:
   - Go to https://gevety.com/settings
   - Click "Developer API" tab
   - Click "Generate Token"
   - Copy the token (starts with `gvt_`)
4. **Configure Clawdbot**: Add the token to `~/.clawdbot/clawdbot.json`:

```json
{
  "skills": {
    "entries": {
      "gevety": {
        "apiKey": "gvt_your_token_here"
      }
    }
  }
}
```

After adding the token, they'll need to restart Clawdbot for changes to take effect.

## Authentication

All requests require Bearer authentication. Use the `GEVETY_API_TOKEN` environment variable:

```
Authorization: Bearer $GEVETY_API_TOKEN
```

Base URL: `https://api.gevety.com`

## Standardized Biomarker Names

The API uses consistent biomarker names across all endpoints. When querying or displaying biomarkers, use these standardized names:

| Common Names | API Returns |
|--------------|-------------|
| CRP, C-Reactive Protein, hsCRP, CRP High-Sensitive | **hs-CRP** |
| Glucose, Blood Glucose | **Fasting Glucose** |
| Insulin, Insulin Fasting | **Fasting Insulin** |
| IG | **Immature Granulocytes** |
| Vitamin D, 25-OH Vitamin D | **Vitamin D** |
| LDL, LDL Cholesterol | **LDL Cholesterol** |
| HDL, HDL Cholesterol | **HDL Cholesterol** |

**Tip**: You can search using any common name (e.g., "CRP" or "glucose") - the API will match and return the standardized name.

## Available Endpoints

### 1. List Available Data (Start Here)

**Always call this first** to discover what health data exists.

```
GET /api/v1/mcp/tools/list_available_data
```

Returns:
- `biomarkers`: List of tracked biomarkers with test counts and latest dates
- `wearables`: Connected devices and available metrics
- `insights`: Whether healthspan score is calculated, axis scores available
- `data_coverage`: Percentage of recommended biomarkers tracked (0-100)

### 2. Get Health Summary

Overview of the user's health status.

```
GET /api/v1/mcp/tools/get_health_summary
```

Returns:
- `overall_score`: Healthspan score (0-100)
- `overall_status`: OPTIMAL, GOOD, SUBOPTIMAL, or NEEDS_ATTENTION
- `trend`: IMPROVING, STABLE, or DECLINING
- `axis_scores`: Scores for each health dimension (metabolic, cardiovascular, etc.)
- `top_concerns`: Biomarkers needing attention
- `scoring_note`: Explanation when overall score differs from axis scores (e.g., "Overall healthspan is high, but Inflammation axis needs attention")

**Note on scores**: The overall healthspan score is a weighted composite. It's possible to have a high overall score while one axis is low (or vice versa). The `scoring_note` field explains these situations.

### 3. Query Biomarker

Get detailed history for a specific biomarker.

```
GET /api/v1/mcp/tools/query_biomarker?biomarker={name}&days={days}
```

Parameters:
- `biomarker` (required): Name or alias (e.g., "vitamin d", "ldl", "hba1c", "crp")
- `days` (optional): History period, 1-730, default 365

Returns:
- `canonical_name`: Standardized biomarker name (see table above)
- `history`: Array of test results with dates, values, units, flags
- `latest`: Most recent result
- `trend`: Direction (IMPROVING, STABLE, DECLINING) and percent change
- `optimal_range`: Evidence-based optimal values

**Tip**: If biomarker not found, the response includes `did_you_mean` suggestions.

### 4. Get Wearable Stats

Daily metrics from connected wearables (Garmin, Oura, Whoop, etc.).

```
GET /api/v1/mcp/tools/get_wearable_stats?days={days}&metric={metric}
```

Parameters:
- `days` (optional): History period, 1-90, default 30
- `metric` (optional): Focus on specific metric (steps, hrv, sleep, etc.)

Returns:
- `connected_sources`: List of connected wearable platforms
- `daily_metrics`: Per-day data (steps, resting HR, HRV, sleep, recovery)
- `summaries`: Aggregated stats with averages, min, max, trends

### 5. Get Opportunities

Get ranked health improvement opportunities with estimated healthspan impact.

```
GET /api/v1/mcp/tools/get_opportunities?limit={limit}&axis={axis}
```

Parameters:
- `limit` (optional): Max opportunities to return, 1-50, default 10
- `axis` (optional): Filter by health axis (metabolic, cardiovascular, etc.)

Returns:
- `opportunities`: Ranked list of improvement opportunities
- `total_opportunity_score`: Total healthspan points available
- `total_years_estimate`: Estimated years of healthy life if all optimized
- `healthspan_score`: Current healthspan score

Each opportunity includes:
- `biomarker`: Standardized biomarker name
- `current_value` / `optimal_value`: Where you are vs target
- `opportunity_score`: Healthspan points gained if optimized
- `years_estimate`: Estimated healthy years gained
- `priority`: Rank (1 = highest impact)

### 6. Get Biological Age

Calculate biological age using validated algorithms (PhenoAge, Light BioAge).

```
GET /api/v1/mcp/tools/get_biological_age
```

Returns:
- `result`: Biological age calculation (if available)
  - `biological_age`: Calculated biological age
  - `chronological_age`: Calendar age
  - `age_acceleration`: Difference (positive = aging faster)
  - `algorithm`: Which algorithm was used
  - `biomarkers_used`: Biomarkers that contributed
  - `interpretation`: What the result means
- `available`: Whether calculation was possible
- `reason`: Why not available (if applicable)
- `upgrade_available`: Can unlock better algorithm with more data
- `upgrade_message`: What additional tests would help

### 7. List Supplements

Get the user's supplement stack.

```
GET /api/v1/mcp/tools/list_supplements?active_only={true|false}
```

Parameters:
- `active_only` (optional): Only show currently active supplements, default false

Returns:
- `supplements`: List of supplements with dosage, frequency, duration
- `active_count`: Number of currently active supplements
- `total_count`: Total supplements tracked

Each supplement includes:
- `name`: Supplement name
- `dose_text`: Formatted dosage (e.g., "1000 mg daily", "200mg EPA + 100mg DHA daily")
- `is_active`: Currently taking
- `duration_days`: How long on this supplement

**Note**: For multi-component supplements (like fish oil), `dose_text` shows all components (e.g., "200mg EPA + 100mg DHA daily").

### 8. Get Activities

Get workout/activity history from connected wearables.

```
GET /api/v1/mcp/tools/get_activities?days={days}&activity_type={type}
```

Parameters:
- `days` (optional): History period, 1-90, default 30
- `activity_type` (optional): Filter by type (running, cycling, strength, etc.)

Returns:
- `activities`: List of workouts with metrics
- `total_count`: Number of activities
- `total_duration_minutes`: Total workout time
- `total_distance_km`: Total distance covered
- `total_calories`: Total calories burned

Each activity includes:
- `activity_type`: Type (running, cycling, swimming, etc.)
- `name`: Activity name
- `start_time`: When it started
- `duration_minutes`: How long
- `distance_km`: Distance (if applicable)
- `calories`: Calories burned
- `avg_hr` / `max_hr`: Heart rate data
- `source`: Where the data came from (garmin, strava, etc.)

### 9. Get Today's Actions

Get the user's action checklist for today.

```
GET /api/v1/mcp/tools/get_today_actions?timezone={timezone}
```

Parameters:
- `timezone` (optional): IANA timezone (e.g., "America/New_York"), default UTC

Returns:
- `effective_date`: The date being queried in user's timezone
- `timezone`: Timezone used for calculation
- `window_start` / `window_end`: Day boundaries (ISO datetime)
- `actions`: List of today's actions
- `completed_count` / `total_count`: Completion stats
- `completion_pct`: Numeric completion percentage (0-100)
- `last_updated_at`: Cache staleness indicator

Each action includes:
- `action_id`: Stable ID for deep-linking
- `title`: Action title
- `action_type`: Type (supplement, habit, diet, medication, test, procedure)
- `completed`: Whether completed today
- `scheduled_window`: Time window (morning, afternoon, evening, any)
- `dose_text`: Dosage info if applicable (e.g., "1000 mg daily")

### 10. Get Protocol

Get the user's 90-day health protocol with top priorities.

```
GET /api/v1/mcp/tools/get_protocol
```

Returns:
- `protocol_id`: Stable protocol ID
- `phase`: Current phase (week1, month1, month3)
- `days_remaining`: Days until protocol expires
- `generated_at` / `last_updated_at`: Timestamps
- `top_priorities`: Top 5 health priorities with reasoning
- `key_recommendations`: Diet and lifestyle action items
- `total_actions`: Total actions in protocol

Each priority includes:
- `priority_id`: Stable ID (same as rank)
- `rank`: Priority rank (1 = highest)
- `biomarker`: Standardized biomarker name
- `status`: Current status (critical, concerning, suboptimal, optimal)
- `target`: Target value with unit
- `current_value` / `unit`: Current measured value
- `measured_at`: When this biomarker was last measured
- `why_prioritized`: Explanation for why this is prioritized

**Note**: If no protocol exists, returns a helpful error with suggestion to generate one at gevety.com/protocol.

### 11. Get Upcoming Tests

Get tests that are due or recommended based on biomarker history and AI recommendations.

```
GET /api/v1/mcp/tools/get_upcoming_tests
```

Returns:
- `tests`: List of upcoming tests sorted by urgency
- `overdue_count`: Number of overdue tests
- `due_soon_count`: Tests due within 30 days
- `recommended_count`: AI-recommended tests
- `total_count`: Total number of upcoming tests

Each test includes:
- `test_id`: Stable ID for deep-linking (format: `panel_{id}` or `recommended_{id}`)
- `name`: Test or panel name
- `test_type`: Type (panel, biomarker, recommended)
- `urgency`: Priority level (overdue, due_soon, recommended)
- `due_reason`: Why this test is needed (e.g., "Due 2 weeks ago", "AI recommendation")
- `last_tested_at`: When this was last tested (if applicable)
- `biomarkers`: List of biomarkers included (for panels)

## Interpreting Scores

### Healthspan Score (0-100)
| Range | Status | Meaning |
|-------|--------|---------|
| 80-100 | OPTIMAL | Excellent health optimization |
| 65-79 | GOOD | Above average, minor improvements possible |
| 50-64 | SUBOPTIMAL | Room for improvement |
| <50 | NEEDS_ATTENTION | Several areas need focus |

### Axis Scores
Each health dimension is scored independently:
- **Metabolic**: Blood sugar, insulin, lipids
- **Cardiovascular**: Heart health markers
- **Inflammatory**: hs-CRP, homocysteine
- **Hormonal**: Thyroid, testosterone, cortisol
- **Nutritional**: Vitamins, minerals
- **Liver/Kidney**: Organ function markers

**Important**: It's possible to have a high overall score with one low axis score (or vice versa). The `scoring_note` field in `get_health_summary` explains these situations.

### Biomarker Status Labels
| Label | Meaning |
|-------|---------|
| OPTIMAL | Within evidence-based ideal range |
| NORMAL | Within lab reference range |
| SUBOPTIMAL | Room for improvement |
| HIGH/LOW | Outside lab reference range |
| CRITICAL | Needs immediate medical attention |

## Common Workflows

### "How am I doing?"
1. Call `list_available_data` to see what's tracked
2. Call `get_health_summary` for the overall picture
3. Highlight top concerns and recent trends
4. If `scoring_note` is present, explain the score discordance

### "Tell me about my vitamin D"
1. Call `query_biomarker?biomarker=vitamin d`
2. Present history, current status, and trend
3. Note optimal range vs current value

### "What's my CRP?" / "How's my inflammation?"
1. Call `query_biomarker?biomarker=crp` (returns as "hs-CRP")
2. Present the value and trend
3. Explain what hs-CRP measures (inflammation marker)

### "How's my sleep/HRV?"
1. Call `get_wearable_stats?metric=sleep` or `?metric=hrv`
2. Show recent trends and averages
3. Compare to healthy baselines

### "What should I focus on?"
1. Call `get_opportunities?limit=5`
2. Present top opportunities ranked by healthspan impact
3. Explain what each biomarker does and why optimizing it matters

### "How old am I biologically?"
1. Call `get_biological_age`
2. If available, compare biological vs chronological age
3. Explain what age acceleration means
4. If not available, explain what tests are needed

### "What supplements am I taking?"
1. Call `list_supplements?active_only=true`
2. List active supplements with dosages (use `dose_text` field)
3. Note duration on each supplement

### "What workouts have I done?"
1. Call `get_activities?days=30`
2. Summarize total activity (duration, calories, distance)
3. List recent workouts with key metrics

### "What should I do today?"
1. Call `get_today_actions?timezone=America/New_York` (use user's timezone if known)
2. Group actions by scheduled window (morning, afternoon, evening)
3. Show completion progress
4. Highlight uncompleted actions

### "What should I focus on?" / "What are my health priorities?"
1. Call `get_protocol`
2. Present top priorities with current values and targets
3. Explain why each is prioritized
4. List key recommendations
5. Note protocol phase and days remaining

### "What tests should I do next?" / "Am I due for any blood work?"
1. Call `get_upcoming_tests`
2. Highlight overdue tests first (urgent)
3. List tests due soon with timeframes
4. Mention AI-recommended tests for optimization
5. Note which biomarkers each panel covers

## Example API Call

```javascript
// Using web_fetch
web_fetch({
  url: "https://api.gevety.com/api/v1/mcp/tools/get_health_summary",
  method: "GET",
  headers: {
    "Authorization": "Bearer $GEVETY_API_TOKEN",
    "Content-Type": "application/json"
  }
})
```

## Important Guidelines

1. **Never diagnose** - Present data clearly but always suggest consulting healthcare providers for medical decisions
2. **Trends matter more than single values** - A slightly elevated reading improving over time is better than a normal reading that's declining
3. **Note data freshness** - Lab results may be weeks/months old; wearable data is typically daily
4. **Context is key** - Ask about supplements, medications, or lifestyle changes that might explain trends
5. **Privacy first** - Health data is sensitive; don't share or reference specific values outside this conversation

## Error Handling

| Error Code | Meaning | Action |
|------------|---------|--------|
| 401 | Invalid or expired token | User needs to regenerate token at gevety.com/settings |
| 404 + `did_you_mean` | Biomarker not found | Suggest alternatives from the response |
| 404 | No data found | User may not have uploaded labs yet |
| 429 | Rate limited | Wait a moment and retry |

## Getting a Token

Users can generate their API token at:
**https://gevety.com/settings** → Developer API → Generate Token

The token format is `gvt_` followed by random characters.

## Checking for Updates

On first use each session, optionally check for updates:

```
GET https://api.gevety.com/api/v1/mcp/tools/status
```

No authentication required. If the request fails or times out, skip the check and proceed normally.

Response (when successful):
```json
{
  "clawdbot_skill": { "latest": "1.4.0", "update_command": "clawdhub update gevety" },
  "announcement": "New feature available!"
}
```

**If `clawdbot_skill.latest` > 1.4.0** (this skill's version), tell the user:
> "A Gevety skill update is available. Run: `clawdhub update gevety`"

**If `announcement` is present**, mention it once per session.

**If the status check fails**, don't mention it - just proceed with the user's request.

To manually update:
```bash
clawdhub update gevety
```

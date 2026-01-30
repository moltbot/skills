---
name: hotjar
description: Access Hotjar recordings and heatmaps via API. Understand user behavior on your site.
metadata: {"clawdbot":{"emoji":"🔥","requires":{"env":["HOTJAR_API_KEY","HOTJAR_SITE_ID"]}}}
---
# Hotjar
Behavior analytics.
## Environment
```bash
export HOTJAR_API_KEY="xxxxxxxxxx"
export HOTJAR_SITE_ID="xxxxxxxxxx"
```
## List Recordings
```bash
curl "https://api.hotjar.com/v1/sites/$HOTJAR_SITE_ID/recordings" \
  -H "Authorization: Bearer $HOTJAR_API_KEY"
```
## Get Recording
```bash
curl "https://api.hotjar.com/v1/sites/$HOTJAR_SITE_ID/recordings/{recordingId}" \
  -H "Authorization: Bearer $HOTJAR_API_KEY"
```
## List Heatmaps
```bash
curl "https://api.hotjar.com/v1/sites/$HOTJAR_SITE_ID/heatmaps" \
  -H "Authorization: Bearer $HOTJAR_API_KEY"
```
## List Surveys
```bash
curl "https://api.hotjar.com/v1/sites/$HOTJAR_SITE_ID/surveys" \
  -H "Authorization: Bearer $HOTJAR_API_KEY"
```
## Links
- Dashboard: https://www.hotjar.com
- Docs: https://help.hotjar.com/hc/en-us/articles/360033640653-Hotjar-API

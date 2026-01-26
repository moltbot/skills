# Plaud API Reverse Engineering Documentation

## Overview

This document describes the Plaud API endpoints discovered through reverse engineering the web application at https://web.plaud.ai/

## Authentication

### JWT Token
- **Storage**: `localStorage.tokenstr`
- **Format**: `bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Header**: `Authorization: bearer <token>`

### Token Claims (decoded)
```json
{
  "sub": "<user_id>",
  "aud": "",
  "exp": <expiration_timestamp>,
  "iat": <issued_at_timestamp>,
  "client_id": "web",
  "region": "aws:eu-central-1"
}
```

## API Base URL

The API domain is region-specific and stored in localStorage:
- **EU Central 1**: `https://api-euc1.plaud.ai`
- **Storage key**: `plaud_user_api_domain`

## Endpoints

### File Operations

#### List All Files
```
GET /file/simple/web
Authorization: bearer <token>
```

**Response:**
```json
{
  "status": 0,
  "msg": "success",
  "data_file_total": 8,
  "data_file_list": [
    {
      "id": "af9e46896091e31b29775331960e66f9",
      "filename": "Recording Title",
      "duration": 989000,
      "is_trash": false,
      "start_time": 1737538282000,
      "scene": 102,
      "is_trans": true,
      "is_summary": true,
      "filetag_id_list": ["folder_id"],
      ...
    }
  ]
}
```

#### Get File Details
```
GET /file/detail/{file_id}
Authorization: bearer <token>
```

**Response:**
```json
{
  "data": {
    "file_id": "af9e46896091e31b29775331960e66f9",
    "file_name": "Recording Title",
    "file_version": "...",
    "duration": 989000,
    "is_trash": false,
    "start_time": "2026-01-22T09:31:22",
    "scene": 102,
    "serial_number": "...",
    "session_id": "...",
    "filetag_id_list": [],
    "content_list": [...],
    "trans_result": {...},
    "ai_content": {...}
  }
}
```

#### Download Audio File (Direct MP3)
```
GET /file/download/{file_id}
Authorization: bearer <token>
```

**Response**: Binary MP3 data (ID3 tagged)

#### Batch File Details
```
POST /file/list
Authorization: bearer <token>
Content-Type: application/json

Body: ["file_id_1", "file_id_2", ...]
```

### File Tags

#### Get File Tags/Folders
```
GET /filetag/
Authorization: bearer <token>
```

### AI Features

#### Get AI Task Status
```
GET /ai/file-task-status?file_ids={file_id}
Authorization: bearer <token>
```

#### Query Notes
```
GET /ai/query_note?file_id={file_id}
Authorization: bearer <token>
```

#### Get Recommended Questions
```
POST /ask/recommend_questions
Authorization: bearer <token>
Content-Type: application/json

Body: {"file_id": "..."}
```

### Sharing

#### Get Private Share Info
```
POST /share/private/get
Authorization: bearer <token>
Content-Type: application/json

Body: {"file_id": "..."}
```

#### Get Public Share Info
```
POST /share/public/get
Authorization: bearer <token>
Content-Type: application/json

Body: {"file_id": "..."}
```

## S3 Storage URLs

### Audio Files (Pre-signed URLs)
```
https://euc1-prod-plaud-bucket.s3.amazonaws.com/audiofiles/{file_id}.mp3
```

Query parameters for AWS signature:
- `X-Amz-Algorithm`
- `X-Amz-Credential`
- `X-Amz-Date`
- `X-Amz-Expires`
- `X-Amz-SignedHeaders`
- `X-Amz-Signature`

### Transcript Storage
```
https://euc1-prod-plaud-content-storage.s3.amazonaws.com/permanent/{user_id}/file_transcript/{file_id}/trans_result.json.gz
```

### General Content Storage
```
https://euc1-prod-plaud-content-storage.s3.amazonaws.com/permanent/{user_id}/general/{content_id}
```

## File ID Format

- **Length**: 32 characters
- **Format**: Hexadecimal string (MD5-like hash)
- **Example**: `af9e46896091e31b29775331960e66f9`

## Scene Types

| Scene Code | Description |
|------------|-------------|
| 1 | Desktop/Import |
| 102 | Note Mode Recording |
| 1000 | Media Import |

## Getting File IDs

File IDs can be obtained from:
1. The URL when viewing a file: `https://web.plaud.ai/file/{file_id}`
2. The Vue store `fileManage.recentlyUpdatedList`
3. Browser DevTools Network tab

## Rate Limiting

No specific rate limits observed, but standard API best practices recommended.

## Notes

- Token expiration is long-lived (appears to be ~10 months)
- The API uses standard REST conventions
- All timestamps are in ISO 8601 format
- File durations are in milliseconds

# Zoho Meeting API Reference

## Base URL
```
https://meeting.zoho.com/meeting/api/v2/{zsoid}/
```
Where `{zsoid}` is the Meeting Organization ID (ZOHO_MEETING_ORG_ID).

## Authentication
All requests require `Authorization: Zoho-oauthtoken {access_token}` header.

## Endpoints

### Get All Recordings
```
GET /meeting/api/v2/{zsoid}/recordings.json
```
**Scope:** `ZohoMeeting.recording.READ`

**Response:**
```json
{
  "recordings": [
    {
      "erecordingId": "encrypted-id",
      "topic": "Meeting Title",
      "sDate": "Wed, 2 Jul",
      "sTime": "09:15 AM",
      "datenTime": "Wed Jul 2, 09:15 AM EET",
      "startTimeinMs": 1751436903672,
      "duration": 77268,
      "durationInMins": 1,
      "fileSize": "1 MB",
      "fileSizeInMB": "1",
      "status": "UPLOADED",
      "downloadUrl": "https://files-accl.zohopublic.com/...",
      "publicDownloadUrl": "https://files-accl.zohopublic.com/...",
      "playUrl": "https://meeting.zoho.com/meeting/videoprv?...",
      "shareUrl": "https://meeting.zoho.com/meeting/public/videoprv?...",
      "recordingEmbedUrl": "https://meeting.zoho.com/meeting/videoprv?...&view=embed",
      "meetingKey": "1066944216",
      "short_meeting_key": "1066944216",
      "recordingId": "4455162000001011067",
      "creatorName": "User Name",
      "isMeeting": true,
      "noAudioRecording": false,
      "isTranscriptionEnabled": true,
      "isTranscriptGenerated": false,
      "transcriptionDownloadUrl": "https://download.zoho.com/...",
      "isSummaryGenerated": false,
      "summaryDownloadUrl": "https://files.zoho.com/...",
      "downloadAccess": 1,
      "summaryAccess": 1,
      "transcriptAccess": 1,
      "shareOption": 0
    }
  ]
}
```

### Download Recording
```
GET {downloadUrl}
Authorization: Zoho-oauthtoken {token}
```
**Scope:** `ZohoMeeting.meetinguds.READ`, `ZohoFiles.files.READ`

Returns the MP4 file binary. Follow redirects (`-L` in curl).

### List Meetings
```
GET /meeting/api/v2/{zsoid}/sessions.json
```
**Scope:** `ZohoMeeting.meeting.READ`

### Get Meeting Details
```
GET /meeting/api/v2/{zsoid}/{meetingKey}.json
```
**Scope:** `ZohoMeeting.meeting.READ`

## Key Fields for Filtering

| Field | Type | Description |
|-------|------|-------------|
| `startTimeinMs` | number | Epoch milliseconds — use for date range filtering |
| `erecordingId` | string | Encrypted ID — use for deduplication |
| `durationInMins` | number | Duration in minutes |
| `isMeeting` | boolean | true for meetings, false for webinars |
| `noAudioRecording` | boolean | true if recording has no audio |
| `status` | string | "UPLOADED" when ready for download |

## Notes
- Recording list returns all recordings, not paginated by default
- Downloads may use different domains (files-accl.zohopublic.com, download.zoho.com)
- Some recordings have Zoho-generated transcripts/summaries (check `isTranscriptGenerated`, `isSummaryGenerated`)
- Meeting Org ID is different from CRM Org ID — check Zoho Meeting admin settings

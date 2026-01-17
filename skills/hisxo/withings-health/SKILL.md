---
name: withings-health
description: Fetches health data (weight, activity) from the Withings API.
metadata: {"clawdbot":{"emoji":"⚖️","requires":{"bins":["node"],"env":["WITHINGS_CLIENT_ID","WITHINGS_CLIENT_SECRET"]}}}
---

This skill allows you to interact with the user's Withings account to retrieve health metrics like weight measurements.

## Setup: Creating a Withings Developer App

Before using this skill, you need to create a free Withings developer application to get your API credentials.

### Step 1: Create a Withings Developer Account

1. Go to [Withings Developer Portal](https://developer.withings.com/)
2. Click **Sign Up** or **Log In** if you already have a Withings account
3. Accept the Developer Terms of Service

### Step 2: Create Your Application

1. Navigate to **My Apps** → **Create an Application**
2. Fill in the application details:
   - **Application Name**: Choose a name (e.g., "My Clawdbot Health")
   - **Description**: Brief description of your use case
   - **Contact Email**: Your email address
   - **Callback URL**: `http://localhost:8080` (required for OAuth)
   - **Application Type**: Select "Personal Use" or appropriate type
3. Submit the application

### Step 3: Get Your Credentials

Once your application is created:
1. Go to **My Apps** and select your application
2. You'll find:
   - **Client ID** → Set as `WITHINGS_CLIENT_ID` environment variable
   - **Client Secret** → Set as `WITHINGS_CLIENT_SECRET` environment variable

### Step 4: Configure Environment Variables

Add these to your Clawdbot environment:
```bash
export WITHINGS_CLIENT_ID="your_client_id_here"
export WITHINGS_CLIENT_SECRET="your_client_secret_here"
```

Or create a `.env` file in the skill directory (this file will be ignored by git):
```
WITHINGS_CLIENT_ID=your_client_id_here
WITHINGS_CLIENT_SECRET=your_client_secret_here
```

## Configuration

The skill uses a `wrapper.js` script located in `{baseDir}`.

Before any data retrieval, check if the user is authenticated. If an error mentions "No token found", guide the user through the initial authentication process.

## Available Commands

### 1. Authentication

First-time setup - generates the OAuth URL:
```bash
node {baseDir}/wrapper.js auth
```

After the user visits the URL and gets the authorization code:
```bash
node {baseDir}/wrapper.js auth YOUR_CODE_HERE
```

### 2. Get Weight

Retrieve the latest weight measurements:
```bash
node {baseDir}/wrapper.js weight
```

Returns the 5 most recent weight entries in JSON format with date and weight in kg.

## Notes

- Tokens are automatically refreshed when they expire
- The `tokens.json` file stores authentication tokens locally (keep it private!)
- Withings API scopes used: `user.metrics`, `user.activity`

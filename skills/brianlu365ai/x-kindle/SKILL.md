---
name: x-to-kindle
description: Send X/Twitter posts to Kindle for distraction-free reading. Use when user shares an X/Twitter link and wants to read it on Kindle, or asks to send a tweet/thread to their Kindle device.
---

# X to Kindle

Convert X/Twitter posts into Kindle-readable documents via email.

## Requirements

- Gmail account with App Password (or other SMTP setup)
- Kindle email address (found in Amazon account settings)

## Workflow

When user shares an X link:

1. **Extract content** via fxtwitter API:
   ```
   https://api.fxtwitter.com/status/<tweet_id>
   ```
   Extract from URL: `twitter.com/*/status/<id>` or `x.com/*/status/<id>`

2. **Format as HTML email**:
   ```html
   <html>
   <body>
     <h1>@{author_handle}</h1>
     <p>{tweet_text}</p>
     <p><em>{timestamp}</em></p>
     <p><a href="{original_url}">View on X</a></p>
   </body>
   </html>
   ```

3. **Send via SMTP** to user's Kindle address with subject line as tweet preview.

## Configuration

Store in TOOLS.md:
```markdown
## Kindle
- Address: user@kindle.com

## Email (Gmail SMTP)
- From: your@gmail.com
- App Password: xxxx xxxx xxxx xxxx
- Host: smtp.gmail.com
- Port: 587
```

## Example

User sends: `https://x.com/elonmusk/status/1234567890`

1. Fetch `https://api.fxtwitter.com/status/1234567890`
2. Extract author, text, timestamp
3. Send HTML email to Kindle address
4. Confirm: "Sent to Kindle 📚"

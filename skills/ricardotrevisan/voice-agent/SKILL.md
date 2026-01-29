---
name: voice-agent
display-name: AI Voice Agent Backend
version: 1.0.0
description: Local Voice Input/Output for Agents using the AI Voice Agent API.
author: trevisanricardo
homepage: https://github.com/ricardotrevisan/ai-conversational-skill
user-invocable: true
disable-model-invocation: false
---

# Voice Agent

This skill allows you to speak and listen to the user using the local Voice Agent API.

## Behavior Guidelines
-   **Audio First**: When the user communicates via audio (files), your PRIMARY mode of response is **Audio File**.
-   **Silent Delivery**: When sending an audio response, **DO NOT** send a text explanation like "I sent an audio". Just send the audio file.
-   **Workflow**:
    1.  User sends audio.
    2.  You usage `transcribe` to read it.
    3.  You think of a response.
    4.  You usage `synthesize` to generate the audio file.
    5.  You send the file.
    6.  **STOP**. Do not add text commentary.

## Tools

### Transcribe File
To transcribe an audio file (Speech-to-Text), run the client script with the `transcribe` command.

```bash
python3 {baseDir}/scripts/client.py transcribe "/path/to/audio/file.ogg"
```

### Synthesize to File
To generate audio from text and save it to a file (Text-to-Speech), run the client script with the `synthesize` command.

```bash
python3 {baseDir}/scripts/client.py synthesize "Text to speak" --output "/path/to/output.ogg"
```

### Health Check
To check if the voice agent API is running and healthy:

```bash
python3 {baseDir}/scripts/client.py health
```

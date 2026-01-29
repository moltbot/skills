# Changelog

## [1.0.0] - 2026-01-28
### Added
- Initial release of the Voice Agent Skill.
- Client script (`client.py`) with `transcribe`, `synthesize`, and `health` commands.
- Zero-dependency architecture using standard library `urllib`.
- Dockerized backend support (`ai-voice-backend` image).

### Changed
- Refactored `client.py` to remove live audio tools (`speak`/`listen`) in favor of a pure file-based file I/O interface for better compatibility with messaging platforms (WhatsApp/Telegram).

# Emporia Energy Skill References

This skill supports two modes:

1) **Cloud** (PyEmVue) — uses Emporia account credentials and the Emporia cloud API.
2) **ESPHome** — uses a locally flashed Emporia device running ESPHome with the native API.

Use this file for additional notes, troubleshooting steps, or links you want the agent to consult
when refining the scripts or adjusting configuration.

## moltbot.json example (copy/paste)

Cloud:
```json
{
  "skills": {
    "entries": {
      "emporia-energy": {
        "enabled": true,
        "env": {
          "EMPORIA_MODE": "cloud",
          "EMPORIA_EMAIL": "you@example.com",
          "EMPORIA_PASSWORD": "change-me",
          "EMPORIA_SCALE": "MINUTE"
        }
      }
    }
  }
}
```

ESPHome:
```json
{
  "skills": {
    "entries": {
      "emporia-energy": {
        "enabled": true,
        "env": {
          "EMPORIA_MODE": "esphome",
          "ESPHOME_HOST": "192.168.1.29",
          "ESPHOME_PORT": "6053",
          "ESPHOME_API_KEY": "base64-noise-psk"
        }
      }
    }
  }
}
```

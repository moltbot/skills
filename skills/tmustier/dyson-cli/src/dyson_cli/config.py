"""Configuration management for dyson-cli."""

import json
from pathlib import Path
from typing import Optional

CONFIG_DIR = Path.home() / ".dyson"
CONFIG_FILE = CONFIG_DIR / "config.json"


def ensure_config_dir() -> Path:
    """Ensure the config directory exists."""
    CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    return CONFIG_DIR


def load_config() -> dict:
    """Load configuration from disk."""
    if not CONFIG_FILE.exists():
        return {"devices": [], "default_device": None}
    return json.loads(CONFIG_FILE.read_text())


def save_config(config: dict) -> None:
    """Save configuration to disk."""
    ensure_config_dir()
    CONFIG_FILE.write_text(json.dumps(config, indent=2))


def get_device(name: Optional[str] = None) -> Optional[dict]:
    """Get a device by name, or the default device."""
    config = load_config()
    devices = config.get("devices", [])
    
    if not devices:
        return None
    
    if name:
        for device in devices:
            if device.get("name", "").lower() == name.lower():
                return device
            if device.get("serial", "").lower() == name.lower():
                return device
        return None
    
    default_name = config.get("default_device")
    if default_name:
        return get_device(default_name)
    
    return devices[0] if devices else None


def set_default_device(name: str) -> bool:
    """Set the default device."""
    config = load_config()
    device = get_device(name)
    if device:
        config["default_device"] = device.get("name") or device.get("serial")
        save_config(config)
        return True
    return False

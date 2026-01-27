"""
Token Alert Configuration
Manages provider configs and settings
"""

import json
from pathlib import Path
from typing import Dict, List


class Config:
    """
    Token Alert configuration manager.
    
    Handles provider settings, API keys, and preferences.
    """
    
    def __init__(self, config_path: str = None):
        """
        Initialize config manager.
        
        Args:
            config_path (str): Path to config file
                              Defaults to ~/.clawdbot/token-alert.json
        """
        if config_path:
            self.config_path = Path(config_path)
        else:
            self.config_path = Path.home() / ".clawdbot" / "token-alert.json"
        
        self.data = self._load()
    
    def _load(self) -> Dict:
        """
        Load config from file.
        
        Returns:
            dict: Config data
        """
        if not self.config_path.exists():
            return self._get_default_config()
        
        try:
            with open(self.config_path, 'r') as f:
                return json.load(f)
        except Exception as e:
            print(f"Warning: Failed to load config: {e}")
            return self._get_default_config()
    
    def _get_default_config(self) -> Dict:
        """
        Get default configuration.
        
        Returns:
            dict: Default config
        """
        return {
            "version": "3.0",
            "providers": [],
            "theme": "auto",  # auto, light, dark
            "default_provider": "anthropic",
            "refresh_interval": 300,  # seconds
            "notifications": {
                "enabled": True,
                "thresholds": [25, 50, 75, 90, 95]
            }
        }
    
    def save(self):
        """Save config to file."""
        # Create parent directory if needed
        self.config_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(self.config_path, 'w') as f:
            json.dump(self.data, f, indent=2)
    
    def add_provider(self, provider_type: str, config: Dict):
        """
        Add a new provider.
        
        Args:
            provider_type (str): Provider type (anthropic, openai, gemini)
            config (dict): Provider-specific config
        """
        provider = {
            "type": provider_type,
            "config": config,
            "enabled": True
        }
        
        # Check if provider already exists
        for i, p in enumerate(self.data["providers"]):
            if p["type"] == provider_type:
                # Update existing
                self.data["providers"][i] = provider
                self.save()
                return
        
        # Add new
        self.data["providers"].append(provider)
        self.save()
    
    def remove_provider(self, provider_type: str):
        """
        Remove a provider.
        
        Args:
            provider_type (str): Provider type to remove
        """
        self.data["providers"] = [
            p for p in self.data["providers"] 
            if p["type"] != provider_type
        ]
        self.save()
    
    def get_providers(self) -> List[Dict]:
        """
        Get all configured providers.
        
        Returns:
            list: Provider configs
        """
        return self.data.get("providers", [])
    
    def get_theme(self) -> str:
        """
        Get current theme preference.
        
        Returns:
            str: "auto", "light", or "dark"
        """
        return self.data.get("theme", "auto")
    
    def set_theme(self, theme: str):
        """
        Set theme preference.
        
        Args:
            theme (str): "auto", "light", or "dark"
        """
        if theme not in ["auto", "light", "dark"]:
            raise ValueError("Theme must be 'auto', 'light', or 'dark'")
        
        self.data["theme"] = theme
        self.save()

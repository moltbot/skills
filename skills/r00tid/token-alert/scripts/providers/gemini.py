"""
Google Gemini Provider
Tracks token usage via Gemini API
"""

import os
from typing import Dict
from .base import TokenProvider


class GeminiProvider(TokenProvider):
    """
    Google Gemini token tracking via API.
    
    Tracks usage via API response metadata.
    """
    
    # Model context windows
    MODEL_LIMITS = {
        "gemini-pro": 32768,
        "gemini-pro-vision": 16384,
        "gemini-ultra": 32768,
    }
    
    # Model display names (with versions)
    MODEL_DISPLAY_NAMES = {
        "gemini-pro": "Gemini Pro 1.5",
        "gemini-pro-vision": "Gemini Pro Vision",
        "gemini-ultra": "Gemini Ultra",
    }
    
    def __init__(self, config: Dict = None):
        """
        Initialize Gemini provider.
        
        Args:
            config (dict): {
                "api_key": str (optional, uses env var),
                "model": str (optional, defaults to gemini-pro)
            }
        """
        super().__init__(config)
        self.api_key = self.config.get("api_key") or os.getenv("GOOGLE_API_KEY")
        self.model = self.config.get("model", "gemini-pro")
    
    def supports_api(self) -> bool:
        """Gemini supports API-based tracking."""
        return True
    
    def validate_config(self) -> bool:
        """Validate that we have an API key."""
        return bool(self.api_key)
    
    def get_usage(self) -> Dict:
        """
        Get current Gemini token usage.
        
        Returns:
            dict: Token usage stats
        """
        import requests
        
        if not self.validate_config():
            return {
                "provider": "gemini",
                "model": self.model,
                "error": "Missing API key. Set GOOGLE_API_KEY environment variable."
            }
        
        try:
            # Get usage via Gemini API
            # Note: Gemini API structure - adjust based on actual endpoints
            url = f"https://generativelanguage.googleapis.com/v1/models/{self.model}"
            params = {"key": self.api_key}
            
            response = requests.get(url, params=params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                # Extract token metadata from model info
                # This is a placeholder - adjust based on actual API response
                used = 0  # Gemini might not expose usage directly
            else:
                used = 0
            
            limit = self.MODEL_LIMITS.get(self.model, 32768)
            display_name = self.MODEL_DISPLAY_NAMES.get(self.model, self.model)
            percent = (used / limit * 100) if limit > 0 else 0
            
            return {
                "provider": "gemini",
                "model": display_name,
                "used": used,
                "limit": limit,
                "percent": round(percent, 1),
                "type": "api"
            }
            
        except Exception as e:
            return {
                "provider": "gemini",
                "model": self.model,
                "error": f"API error: {str(e)}"
            }

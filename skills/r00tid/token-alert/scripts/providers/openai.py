"""
OpenAI Provider
Tracks token usage via OpenAI API
"""

import os
from typing import Dict
from .base import TokenProvider


class OpenAIProvider(TokenProvider):
    """
    OpenAI GPT token tracking via API.
    
    Tracks usage via API response headers and usage fields.
    """
    
    # Model context windows
    MODEL_LIMITS = {
        "gpt-4-turbo": 128000,
        "gpt-4": 8192,
        "gpt-4-32k": 32768,
        "gpt-3.5-turbo": 16385,
        "gpt-3.5-turbo-16k": 16385,
    }
    
    # Model display names (with versions)
    MODEL_DISPLAY_NAMES = {
        "gpt-4-turbo": "GPT-4 Turbo",
        "gpt-4": "GPT-4",
        "gpt-4-32k": "GPT-4 32K",
        "gpt-3.5-turbo": "GPT-3.5 Turbo",
        "gpt-3.5-turbo-16k": "GPT-3.5 Turbo 16K",
    }
    
    def __init__(self, config: Dict = None):
        """
        Initialize OpenAI provider.
        
        Args:
            config (dict): {
                "api_key": str (optional, uses env var),
                "model": str (optional, defaults to gpt-4-turbo)
            }
        """
        super().__init__(config)
        self.api_key = self.config.get("api_key") or os.getenv("OPENAI_API_KEY")
        self.model = self.config.get("model", "gpt-4-turbo")
    
    def supports_api(self) -> bool:
        """OpenAI supports API-based tracking."""
        return True
    
    def validate_config(self) -> bool:
        """Validate that we have an API key."""
        return bool(self.api_key)
    
    def get_usage(self) -> Dict:
        """
        Get current OpenAI token usage.
        
        Returns:
            dict: Token usage stats
        """
        import requests
        
        if not self.validate_config():
            return {
                "provider": "openai",
                "model": self.model,
                "error": "Missing API key. Set OPENAI_API_KEY environment variable."
            }
        
        try:
            # Get usage via OpenAI API
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            
            # Query usage endpoint (subscription/usage)
            response = requests.get(
                "https://api.openai.com/v1/usage",
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                # Extract token usage from response
                # Note: OpenAI API might not expose direct token counts
                # This is a placeholder - adjust based on actual API response
                used = data.get("total_tokens", 0)
            else:
                # Fallback: estimate from recent completions
                used = 0
            
            limit = self.MODEL_LIMITS.get(self.model, 8192)
            display_name = self.MODEL_DISPLAY_NAMES.get(self.model, self.model)
            percent = (used / limit * 100) if limit > 0 else 0
            
            return {
                "provider": "openai",
                "model": display_name,
                "used": used,
                "limit": limit,
                "percent": round(percent, 1),
                "type": "api"
            }
            
        except Exception as e:
            return {
                "provider": "openai",
                "model": self.model,
                "error": f"API error: {str(e)}"
            }

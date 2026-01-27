"""
Base Token Provider
Abstract base class for all token tracking providers
"""

from abc import ABC, abstractmethod
from typing import Dict, Optional


class TokenProvider(ABC):
    """
    Abstract base class for token tracking providers.
    
    Each provider implements get_usage() to return current token stats.
    """
    
    def __init__(self, config: Optional[Dict] = None):
        """
        Initialize provider with config.
        
        Args:
            config (dict): Provider-specific configuration
                          e.g., {"api_key": "...", "model": "..."}
        """
        self.config = config or {}
        
    @abstractmethod
    def get_usage(self) -> Dict:
        """
        Get current token usage.
        
        Returns:
            dict: {
                "provider": str,        # Provider name
                "model": str,           # Model name
                "used": int,            # Tokens used
                "limit": int,           # Token limit
                "percent": float,       # Usage percentage
                "type": str,            # "api" or "web"
                "error": str or None    # Error message if failed
            }
        """
        raise NotImplementedError
    
    @abstractmethod
    def supports_api(self) -> bool:
        """
        Check if provider supports API-based tracking.
        
        Returns:
            bool: True if API-based, False if web-scraping needed
        """
        raise NotImplementedError
    
    def validate_config(self) -> bool:
        """
        Validate provider configuration.
        
        Returns:
            bool: True if config is valid
        """
        return True
    
    def get_name(self) -> str:
        """
        Get provider name.
        
        Returns:
            str: Provider name (e.g., "anthropic", "openai")
        """
        return self.__class__.__name__.replace("Provider", "").lower()

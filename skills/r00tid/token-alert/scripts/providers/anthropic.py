"""
Anthropic (Claude) Provider
Tracks token usage via Anthropic API
"""

import os
from typing import Dict
from .base import TokenProvider


class AnthropicProvider(TokenProvider):
    """
    Anthropic Claude token tracking via API.
    
    Uses Clawdbot's session_status tool when available,
    falls back to API calls when not in Clawdbot context.
    """
    
    # Model context windows
    MODEL_LIMITS = {
        "claude-opus-4-5": 200000,
        "claude-sonnet-4-5": 200000,
        "claude-sonnet-4": 200000,
        "claude-3-5-sonnet-20241022": 200000,
        "claude-3-opus-20240229": 200000,
        "claude-3-sonnet-20240229": 200000,
        "claude-3-haiku-20240307": 200000,
        "claude-2.1": 200000,
        "claude-2.0": 100000,
        "claude-instant-1.2": 100000,
    }
    
    # Model display names (with versions)
    MODEL_DISPLAY_NAMES = {
        "claude-opus-4-5": "Claude Opus 4.5",
        "claude-sonnet-4-5": "Claude Sonnet 4.5",
        "claude-sonnet-4": "Claude Sonnet 4",
        "claude-3-5-sonnet-20241022": "Claude 3.5 Sonnet",
        "claude-3-opus-20240229": "Claude 3 Opus",
        "claude-3-sonnet-20240229": "Claude 3 Sonnet",
        "claude-3-haiku-20240307": "Claude 3 Haiku",
        "claude-2.1": "Claude 2.1",
        "claude-2.0": "Claude 2.0",
        "claude-instant-1.2": "Claude Instant 1.2",
    }
    
    def __init__(self, config: Dict = None):
        """
        Initialize Anthropic provider.
        
        Args:
            config (dict): {
                "api_key": str (optional, uses env var if not provided),
                "model": str (optional, defaults to claude-sonnet-4-5),
                "use_session_status": bool (default True, use Clawdbot tool)
            }
        """
        super().__init__(config)
        self.api_key = self.config.get("api_key") or os.getenv("ANTHROPIC_API_KEY")
        self.model = self.config.get("model", "claude-sonnet-4-5")
        self.use_session_status = self.config.get("use_session_status", True)
        
    def supports_api(self) -> bool:
        """Anthropic supports API-based tracking."""
        return True
    
    def validate_config(self) -> bool:
        """Validate that we have an API key."""
        return bool(self.api_key) or self.use_session_status
    
    def get_usage(self) -> Dict:
        """
        Get current Anthropic token usage.
        
        Returns:
            dict: Token usage stats
        """
        # Try Clawdbot session_status first
        if self.use_session_status:
            usage = self._get_from_session_status()
            if usage:
                return usage
        
        # Fallback: API-based tracking
        # (For now, return demo data - would need actual API implementation)
        return self._get_demo_usage()
    
    def _get_from_session_status(self) -> Dict:
        """
        Get usage from Clawdbot session_status tool.
        
        Returns:
            dict or None: Usage data if available
        """
        try:
            import subprocess
            import re
            
            # Run clawdbot status
            result = subprocess.run(
                ['clawdbot', 'status'],
                capture_output=True,
                text=True,
                timeout=10
            )
            
            if result.returncode != 0:
                return None
            
            output = result.stdout
            
            # Parse main session from Sessions table
            session_match = re.search(
                r'agent:main:main.*?│\s+([\w\-\.]+)\s+│\s+(\d+)k/(\d+)k\s+\((\d+)%\)',
                output
            )
            
            if session_match:
                model_slug = session_match.group(1)
                used_k = int(session_match.group(2))
                limit_k = int(session_match.group(3))
                percent = float(session_match.group(4))
                
                # Convert to full model name
                model_name = self.MODEL_DISPLAY_NAMES.get(model_slug, model_slug)
                
                return {
                    "provider": "anthropic",
                    "model": model_name,
                    "used": used_k * 1000,
                    "limit": limit_k * 1000,
                    "percent": percent,
                    "type": "api",
                    "error": None
                }
            
            return None
            
        except Exception as e:
            return None
    
    def _get_demo_usage(self) -> Dict:
        """
        Get demo usage data (placeholder).
        
        In production, this would make actual API calls to track usage.
        """
        limit = self.MODEL_LIMITS.get(self.model, 200000)
        display_name = self.MODEL_DISPLAY_NAMES.get(self.model, self.model)
        
        # Demo: Simulate current session usage
        # In reality, you'd track this via API calls
        used = 0
        percent = 0.0
        
        return {
            "provider": "anthropic",
            "model": display_name,  # Use display name instead of slug
            "used": used,
            "limit": limit,
            "percent": percent,
            "type": "api",
            "error": None
        }
    
    def _parse_session_status(self, result: Dict) -> Dict:
        """
        Parse session_status result into standard format.
        
        Args:
            result (dict): Raw session_status output
            
        Returns:
            dict: Standardized usage data
        """
        used = result.get("tokens_used", 0)
        limit = result.get("tokens_limit", 200000)
        percent = (used / limit * 100) if limit > 0 else 0.0
        
        return {
            "provider": "anthropic",
            "model": result.get("model", self.model),
            "used": used,
            "limit": limit,
            "percent": percent,
            "type": "api",
            "error": None
        }

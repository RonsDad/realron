"""
Centralized Anthropic SDK Configuration
All model names, limits, and SDK settings in one place
"""

import os
from typing import Dict, List, Optional
from dataclasses import dataclass, field

@dataclass
class AnthropicModelConfig:
    """Configuration for an Anthropic model"""
    model_id: str
    max_tokens: int = 4000
    default_temperature: float = 0.7
    supports_thinking: bool = True
    supports_computer_use: bool = True
    supports_code_execution: bool = True
    cost_per_million_input: float = 3.0
    cost_per_million_output: float = 15.0
    cost_per_million_cached: float = 0.3
    
class AnthropicConfig:
    """Centralized configuration for all Anthropic SDK usage"""
    
    # Model IDs - single source of truth
    MODELS = {
        "opus_4": AnthropicModelConfig(
            model_id="claude-opus-4-1-20250805",
            max_tokens=8000,
            cost_per_million_input=15.0,
            cost_per_million_output=75.0,
            cost_per_million_cached=1.5
        ),
        "sonnet_4": AnthropicModelConfig(
            model_id="claude-sonnet-4-20250514",
            max_tokens=4000,
            cost_per_million_input=3.0,
            cost_per_million_output=15.0,
            cost_per_million_cached=0.3
        ),
        "sonnet_3_5": AnthropicModelConfig(
            model_id="claude-3-5-sonnet-20241022",
            max_tokens=4000,
            cost_per_million_input=3.0,
            cost_per_million_output=15.0,
            cost_per_million_cached=0.3
        ),
        "haiku_3_5": AnthropicModelConfig(
            model_id="claude-3-5-haiku-20241022",
            max_tokens=4000,
            cost_per_million_input=0.8,
            cost_per_million_output=4.0,
            cost_per_million_cached=0.08,
            supports_thinking=False,
            supports_computer_use=False,
            supports_code_execution=False
        )
    }
    
    # Default models for different use cases
    DEFAULT_ORCHESTRATOR_MODEL = "opus_4"  # Best reasoning for orchestration
    DEFAULT_WORKER_MODEL = "sonnet_4"      # Fast and capable for tasks
    DEFAULT_GENERAL_MODEL = "sonnet_4"     # General purpose usage
    DEFAULT_FAST_MODEL = "haiku_3_5"       # Quick responses, lower cost
    
    # Beta features to enable
    BETA_FEATURES = [
        "token-efficient-tools-2025-02-19",  # Reduces latency with many tools
        "interleaved-thinking-2025-05-14",   # Extended thinking capability
        "computer-use-2025-01-24",           # Computer control
        "fine-grained-tool-streaming-2025-05-14",  # Better streaming
        "code-execution-2025-05-22",         # Code execution in sandboxes
        "mcp-client-2025-04-04"              # MCP server connections
    ]
    
    # Token limits and budgets
    TOKEN_LIMITS = {
        "max_output_tokens": 32000,          # Maximum tokens to generate
        "thinking_budget": 20000,             # Budget for thinking tokens
        "default_max_tokens": 4000,          # Default if not specified
        "cache_prompt_threshold": 1000,      # Min chars to enable caching
    }
    
    # Rate limits (requests per minute)
    RATE_LIMITS = {
        "opus_4": 50,
        "sonnet_4": 100,
        "sonnet_3_5": 100,
        "haiku_3_5": 200
    }
    
    # Retry configuration
    RETRY_CONFIG = {
        "max_retries": 3,
        "initial_delay": 1.0,  # seconds
        "exponential_base": 2,
        "max_delay": 30.0
    }
    
    # Message validation rules
    MESSAGE_VALIDATION = {
        "require_alternating_roles": True,
        "require_user_first": True,
        "allow_system_anywhere": False,
        "max_message_length": 100000,  # chars
        "max_messages_per_request": 100
    }
    
    @classmethod
    def get_model_id(cls, model_key: Optional[str] = None) -> str:
        """Get model ID by key or from environment"""
        if model_key is None:
            # Check environment variable first
            env_model = os.getenv("ANTHROPIC_MODEL")
            if env_model:
                return env_model
            model_key = cls.DEFAULT_GENERAL_MODEL
        
        if model_key in cls.MODELS:
            return cls.MODELS[model_key].model_id
        
        # If it's already a model ID, return it
        for config in cls.MODELS.values():
            if config.model_id == model_key:
                return model_key
        
        # Default fallback
        return cls.MODELS[cls.DEFAULT_GENERAL_MODEL].model_id
    
    @classmethod
    def get_model_config(cls, model_key: str) -> AnthropicModelConfig:
        """Get full model configuration"""
        if model_key in cls.MODELS:
            return cls.MODELS[model_key]
        
        # Check if it's a model ID
        for key, config in cls.MODELS.items():
            if config.model_id == model_key:
                return config
        
        # Return default
        return cls.MODELS[cls.DEFAULT_GENERAL_MODEL]
    
    @classmethod
    def get_orchestrator_model(cls) -> str:
        """Get the model ID for orchestrator agents"""
        return cls.get_model_id(cls.DEFAULT_ORCHESTRATOR_MODEL)
    
    @classmethod
    def get_worker_model(cls) -> str:
        """Get the model ID for worker agents"""
        return cls.get_model_id(cls.DEFAULT_WORKER_MODEL)
    
    @classmethod
    def get_beta_header(cls) -> str:
        """Get the beta features header value"""
        return ",".join(cls.BETA_FEATURES)
    
    @classmethod
    def validate_model_for_feature(cls, model_key: str, feature: str) -> bool:
        """Check if a model supports a specific feature"""
        config = cls.get_model_config(model_key)
        
        feature_map = {
            "thinking": config.supports_thinking,
            "computer_use": config.supports_computer_use,
            "code_execution": config.supports_code_execution
        }
        
        return feature_map.get(feature, True)

# Singleton instance for easy access
anthropic_config = AnthropicConfig()
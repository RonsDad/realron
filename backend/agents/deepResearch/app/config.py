# Copyright 2025 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""
Central configuration file for the Deep Research Agent.

This file defines all user-configurable settings for the agent, including model selection,
pipeline behavior, and authentication.

Settings Hierarchy:
1. Environment Variables (highest priority, e.g., for cloud deployments).
2. Values in this file (default settings).

For local development, it is highly recommended to use a `.env` file in the root
directory to manage authentication keys and environment-specific settings.
"""

import os
from dataclasses import dataclass, field

# --- Authentication Configuration ---
# The agent can operate in two primary authentication modes. Control this using
# environment variables, typically set in a `.env` file for local development.
#
# Mode 1: Vertex AI (Default)
#   - Uses Application Default Credentials (ADC).
#   - Requires `gcloud auth application-default login`.
#   - Set GOOGLE_GENAI_USE_VERTEXAI="True"
#
# Mode 2: Google AI Studio (API Key)
#   - Uses a standard Google AI API Key.
#   - Set GOOGLE_GENAI_USE_VERTEXAI="False"
#   - Set GOOGLE_API_KEY="YOUR_API_KEY_HERE"
#
# The following lines ensure the necessary environment variables are set for the
# Google GenAI SDK to function correctly, preferring Vertex AI by default.
os.environ.setdefault("GOOGLE_GENAI_USE_VERTEXAI", "True")
if os.getenv("GOOGLE_GENAI_USE_VERTEXAI", "True").lower() == "true":
    # Autodetect Project ID if not explicitly set.
    # The `google.auth.default()` call is handled internally by the ADK.
    # We only need to ensure the environment is hinted at.
    try:
        import google.auth
        _, project_id = google.auth.default()
        os.environ.setdefault("GOOGLE_CLOUD_PROJECT", project_id)
    except (ImportError, google.auth.exceptions.DefaultCredentialsError):
        print("Warning: Could not set default Google Cloud project. Please ensure it's set manually if using Vertex AI.")

# --- Model & Pipeline Configuration ---

@dataclass
class ModelConfig:
    """
    Defines the generative models used for different agent tasks.
    Using the top-tier model for all roles to maximize reasoning and quality at every step.
    """
    # Model for "worker" tasks: planning, initial research, dispatching.
    worker_model: str = "gemini-2.5-pro"

    # Model for "critic" tasks: evaluating research quality, composing final report.
    critic_model: str = "gemini-2.5-pro"


@dataclass
class PipelineConfig:
    """
    Controls the behavior and limits of the research pipeline.
    """
    # The maximum number of times the research->critique->refine loop can run.
    # Prevents infinite loops and controls research depth/cost.
    max_search_iterations: int = 3

    # MASTER SWITCH: Enables or disables the iterative refinement loop.
    # - True: Slower, more expensive, higher quality. Runs the evaluator and enhancer.
    # - False: Faster, cheaper, lower quality. Skips the critique step entirely.
    enable_iterative_refinement: bool = True


@dataclass
class AgentConfig:
    """
    Root configuration object for the entire agent framework.
    """
    models: ModelConfig = field(default_factory=ModelConfig)
    pipeline: PipelineConfig = field(default_factory=PipelineConfig)


# --- EXPORTED CONFIGURATION ---
# This is the single configuration object that will be imported by `agent.py`.
config = AgentConfig()
#!/usr/bin/env python3
"""Test script to diagnose deep research agent import issues."""

import sys
import os

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

print("Testing Deep Research Agent imports...")
print("-" * 50)

# Test 1: Import deep_research_agent
try:
    from deep_research_agent import root_agent as deep_research_root_agent
    print("✓ Successfully imported deep_research_agent.root_agent")
except ImportError as e:
    print(f"✗ Failed to import deep_research_agent: {e}")
    print(f"  Error type: {type(e).__name__}")

# Test 2: Import Google ADK components
try:
    from google.adk.runners import InMemoryRunner
    print("✓ Successfully imported google.adk.runners.InMemoryRunner")
except ImportError as e:
    print(f"✗ Failed to import google.adk.runners: {e}")

try:
    from google.adk.agents import RunConfig
    print("✓ Successfully imported google.adk.agents.RunConfig")
except ImportError as e:
    print(f"✗ Failed to import google.adk.agents.RunConfig: {e}")

try:
    from google.adk.agents import LiveRequestQueue
    print("✓ Successfully imported google.adk.agents.LiveRequestQueue")
except ImportError as e:
    print(f"✗ Failed to import google.adk.agents.LiveRequestQueue: {e}")

try:
    from google.genai import types as genai_types
    print("✓ Successfully imported google.genai.types")
except ImportError as e:
    print(f"✗ Failed to import google.genai.types: {e}")

# Test 3: Check if all imports would succeed
print("\n" + "-" * 50)
try:
    from deep_research_agent import root_agent as deep_research_root_agent
    from google.adk.runners import InMemoryRunner
    from google.adk.agents import RunConfig
    from google.adk.agents import LiveRequestQueue
    from google.genai import types as genai_types
    print("✓ DEEP_RESEARCH_AVAILABLE would be True")
    print("  All required imports successful!")
except ImportError as e:
    print("✗ DEEP_RESEARCH_AVAILABLE would be False")
    print(f"  Import failed: {e}")

# Test 4: Check deep_research_config
print("\n" + "-" * 50)
try:
    from deep_research_config import config
    print("✓ Successfully imported deep_research_config")
    print(f"  critic_model: {config.critic_model}")
    print(f"  worker_model: {config.worker_model}")
    print(f"  max_search_iterations: {config.max_search_iterations}")
except ImportError as e:
    print(f"✗ Failed to import deep_research_config: {e}")

print("\n" + "-" * 50)
print("Diagnosis complete.")
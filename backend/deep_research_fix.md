# Deep Research Agent Fix

## Issue
Deep research requests are not going to the deep research agent because `DEEP_RESEARCH_AVAILABLE` is False due to missing Google ADK dependencies.

## Root Cause
The API checks for Google ADK imports at startup (lines 59-70 in api.py):
```python
try:
    from deep_research_agent import root_agent as deep_research_root_agent
    from google.adk.runners import InMemoryRunner
    from google.adk.agents import RunConfig
    from google.adk.agents import LiveRequestQueue
    from google.genai import types as genai_types
    DEEP_RESEARCH_AVAILABLE = True
except ImportError as e:
    logger.error(f"Deep Research Agent not available: {e}")
    DEEP_RESEARCH_AVAILABLE = False
```

## Solution

### 1. Install Google ADK Dependencies
Ensure the Google ADK (Agent Development Kit) is properly installed:
```bash
pip install google-adk google-genai
```

### 2. Check Import Path
The deep research agent is located at `backend/deep_research_agent.py` and properly exports `root_agent`.

### 3. Verify Configuration
Check that `backend/deep_research_config.py` exists with proper model configuration:
```python
from dataclasses import dataclass

@dataclass
class ResearchConfiguration:
    critic_model: str = "gemini-2.0-flash-exp"
    worker_model: str = "gemini-2.0-flash-exp"
    max_search_iterations: int = 10

config = ResearchConfiguration()
```

### 4. Debug Import Issues
To debug why imports are failing, run:
```python
python -c "from backend.deep_research_agent import root_agent; print('Success')"
```

### 5. Current Behavior
When `DEEP_RESEARCH_AVAILABLE` is False, the API falls back to using Claude with an enhanced research prompt. This provides basic research functionality but doesn't use the sophisticated multi-agent pipeline.

### 6. Performance Note
The deep research agent uses a complex pipeline with multiple agents:
- `plan_generator`
- `section_planner`
- `section_researcher`
- `research_evaluator`
- `enhanced_search_executor`
- `report_composer`

This is one of the over-engineering patterns identified in the audit. Consider using the optimized agent configuration instead for better performance.
#!/usr/bin/env python3
"""Simple check to verify agents are properly imported and configured"""

from specialized_agents import (
    medical_researcher,
    deep_reasoning_researcher,
    hybrid_medical_researcher,
    sonar_pro_researcher,
    sonar_reasoning_researcher,
    sonar_deep_research_agent,
    fda_drug_researcher,
    browser_mcp_deep_researcher
)

agents = [
    medical_researcher,
    deep_reasoning_researcher,
    hybrid_medical_researcher,
    sonar_pro_researcher,
    sonar_reasoning_researcher,
    sonar_deep_research_agent,
    fda_drug_researcher,
    browser_mcp_deep_researcher
]

print("Checking specialized agents...")
print("="*60)

for agent in agents:
    if agent is not None:
        print(f"✓ {agent.name}")
        print(f"  - Type: {type(agent).__name__}")
        print(f"  - Description: {agent.description[:80]}...")
        if hasattr(agent, 'tools') and agent.tools:
            print(f"  - Tools: {[tool.name if hasattr(tool, 'name') else str(tool) for tool in agent.tools]}")
        if hasattr(agent, 'output_key') and agent.output_key:
            print(f"  - Output key: {agent.output_key}")
        print()
    else:
        print("✗ None agent found!")
        print()

print("="*60)
print("All agents checked!")
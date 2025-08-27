#!/usr/bin/env python3
"""
List available orchestrators and workers in the unified agent system
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from backend.agents.claudeAgent.claude_tools.unified_agent_system import get_unified_system

def list_agents():
    system = get_unified_system()
    
    print("=" * 60)
    print("AVAILABLE AGENTS IN UNIFIED SYSTEM")
    print("=" * 60)
    
    print("\n📋 ORCHESTRATORS:")
    print("-" * 40)
    if system.orchestrators:
        for agent_id, config in system.orchestrators.items():
            print(f"  ID: {agent_id}")
            print(f"  Name: {config.name}")
            print(f"  Model: {config.model}")
            print(f"  Specialization: {config.specialization.value if config.specialization else 'General'}")
            print()
    else:
        print("  No orchestrators found")
    
    print("\n👷 WORKERS:")
    print("-" * 40)
    if system.workers:
        for agent_id, config in system.workers.items():
            print(f"  ID: {agent_id}")
            print(f"  Name: {config.name}")
            print(f"  Model: {config.model}")
            print(f"  Specialization: {config.specialization.value if config.specialization else 'General'}")
            print()
    else:
        print("  No workers found")

if __name__ == "__main__":
    list_agents()
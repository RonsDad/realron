#!/usr/bin/env python3
"""
Simple runner script for the Deep Research Agent.
This avoids all the import path issues by running from the correct directory.
"""

import sys
import os
import subprocess
import json

def run_deep_research_agent():
    """Run the deep research agent in its own process with correct paths."""
    # Get the path to the agent directory
    agent_dir = os.path.join(
        os.path.dirname(__file__), 
        'agent-starter-pack', 
        'agents', 
        'gemini-fullstack'
    )
    
    # Change to the agent directory
    original_dir = os.getcwd()
    os.chdir(agent_dir)
    
    try:
        # Add the current directory to Python path
        env = os.environ.copy()
        env['PYTHONPATH'] = f"{agent_dir}:{env.get('PYTHONPATH', '')}"
        
        # Import and return the agent
        sys.path.insert(0, agent_dir)
        from app import root_agent
        
        return root_agent
    finally:
        # Change back to original directory
        os.chdir(original_dir)

# Export the agent
if __name__ != "__main__":
    root_agent = run_deep_research_agent()
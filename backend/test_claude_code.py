#!/usr/bin/env python3
"""Test script for Claude Code SDK integration"""

import asyncio
import os
import sys

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Set environment variable to use mock
os.environ["USE_MOCK_CLAUDE_CODE"] = "true"

from agents.claudeAgent.claude_tools.claude_code_sdk import (
    ToolGenerator,
    ToolIntent,
    PatientContext,
    ToolType
)

async def test_tool_generation():
    """Test the tool generation process"""
    
    # Create a tool generator
    generator = ToolGenerator()
    
    # Create test intent and context
    intent = ToolIntent(
        tool_type=ToolType.MEDICATION_TRACKER,
        description="Track medications"
    )
    
    context = PatientContext(
        patient_id="test_patient_123",
        patient_name="John Doe",
        age=45,
        conditions=["Diabetes", "Hypertension"],
        medications=["Metformin", "Lisinopril"],
        insurance_info={"provider": "Blue Cross"},
        preferences={},
        tool_type=ToolType.MEDICATION_TRACKER
    )
    
    print("Testing tool generation...")
    
    try:
        # Generate the tool
        tool = await generator.generate(intent, context)
        
        print(f"✓ Tool generated successfully!")
        print(f"  Tool ID: {tool.id}")
        print(f"  Tool URL: {tool.url}")
        print(f"  Friendly Name: {tool.friendly_name}")
        print(f"  Content Length: {len(tool.content)} characters")
        
        # Check if file was created
        tool_path = generator.tools_output_dir / f"{tool.id}.html"
        if tool_path.exists():
            print(f"✓ Tool file created at: {tool_path}")
        else:
            print(f"✗ Tool file not found at: {tool_path}")
            
    except Exception as e:
        print(f"✗ Tool generation failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_tool_generation())
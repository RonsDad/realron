#!/usr/bin/env python3
"""
Test tool generation with Claude Code SDK
"""

import asyncio
import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/Users/timhunter/ron-ai/.env')

# Add backend to path
sys.path.insert(0, '/Users/timhunter/ron-ai/backend')

async def test_tool_generation():
    """Test generating a simple healthcare tool"""
    from agents.claudeAgent.claude_tools.claude_code_sdk.patient_handler import patient_request_handler
    
    print("Testing tool generation...")
    print("-" * 50)
    
    # Test request
    test_request = "I need to track my blood pressure readings"
    test_patient = {
        "patient_id": "test123",
        "name": "Test Patient",
        "conditions": ["hypertension"]
    }
    
    print(f"Request: '{test_request}'")
    print(f"Patient: {test_patient['name']}")
    print("-" * 50)
    
    try:
        # Generate tool
        result = await patient_request_handler.handle_request(
            message=test_request,
            patient_id=test_patient["patient_id"],
            patient_data=test_patient
        )
        
        if result.get("success"):
            print("✅ Tool generated successfully!")
            print(f"   Tool: {result.get('tool_name', 'Unknown')}")
            print(f"   Has HTML: {'html' in result}")
            print(f"   HTML size: {len(result.get('html', ''))} chars")
            
            # Save the generated HTML for inspection
            if 'html' in result:
                filename = "test_generated_tool.html"
                with open(filename, 'w') as f:
                    f.write(result['html'])
                print(f"   Saved to: {filename}")
                
            # Check LiveURL if available
            if 'live_url' in result:
                print(f"   LiveURL: {result['live_url']}")
                
        else:
            print(f"❌ Tool generation failed: {result.get('error', 'Unknown error')}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_tool_generation())
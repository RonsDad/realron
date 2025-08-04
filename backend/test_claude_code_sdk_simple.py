"""
Simple test for Claude Code SDK integration without using actual Claude Code CLI.
Tests the API endpoints and abstraction layer.
"""

import asyncio
import aiohttp
import json
import time
from datetime import datetime


async def test_api_endpoints():
    """Test the API endpoints are available"""
    
    base_url = "http://localhost:8000"
    
    async with aiohttp.ClientSession() as session:
        print("Testing Claude Code SDK API Endpoints")
        print("=" * 50)
        
        # Test health endpoint
        print("\n1. Testing health endpoint...")
        try:
            async with session.get(f"{base_url}/health") as response:
                result = await response.json()
                print(f"   ✅ Health check passed")
                print(f"   Claude Code SDK available: {result.get('claude_code_sdk_available')}")
        except Exception as e:
            print(f"   ❌ Health check failed: {e}")
        
        # Test tool generation endpoint exists
        print("\n2. Testing tool generation endpoint...")
        try:
            test_request = {
                "message": "I need a medication tracker",
                "patient_id": "test_patient",
                "patient_data": {
                    "name": "Test Patient",
                    "medications": ["Aspirin", "Vitamin D"]
                }
            }
            
            async with session.post(
                f"{base_url}/tools/generate",
                json=test_request,
                headers={"Content-Type": "application/json"}
            ) as response:
                print(f"   Status: {response.status}")
                result = await response.json()
                print(f"   Response: {json.dumps(result, indent=2)}")
        except Exception as e:
            print(f"   ❌ Tool generation test failed: {e}")
        
        # Test tool listing endpoint
        print("\n3. Testing tool listing endpoint...")
        try:
            async with session.get(f"{base_url}/tools/patient/test_patient") as response:
                print(f"   Status: {response.status}")
                result = await response.json()
                print(f"   Tools found: {result.get('count', 0)}")
        except Exception as e:
            print(f"   ❌ Tool listing test failed: {e}")
        
        # Test endpoints list
        print("\n4. Testing endpoints list...")
        try:
            async with session.get(f"{base_url}/") as response:
                result = await response.json()
                tool_endpoints = [k for k in result.get('endpoints', {}).keys() if k.startswith('tool_')]
                print(f"   Tool endpoints available: {tool_endpoints}")
        except Exception as e:
            print(f"   ❌ Endpoints list test failed: {e}")


async def test_abstraction_layer():
    """Test that the abstraction layer properly hides technical details"""
    
    print("\n\nTesting Abstraction Layer")
    print("=" * 50)
    
    # Import the modules directly
    try:
        from agents.claudeAgent.claude_tools.claude_code_sdk import (
            PatientRequestHandler,
            IntentClassifier,
            ContextExtractor,
            TemplateLibrary
        )
        
        print("✅ All modules imported successfully")
        
        # Test intent classification
        print("\n1. Testing Intent Classification...")
        classifier = IntentClassifier()
        test_messages = [
            "I need help tracking my medications",
            "Find me a doctor near me",
            "Help me prepare for my appointment",
            "How much will this procedure cost?"
        ]
        
        for msg in test_messages:
            intent = await classifier.classify(msg)
            print(f"   '{msg}' -> {intent.tool_type}")
        
        # Test template library
        print("\n2. Testing Template Library...")
        template_lib = TemplateLibrary()
        available_templates = template_lib.get_available_templates()
        print(f"   Available templates: {len(available_templates)}")
        for template_type in available_templates[:5]:
            template = template_lib.get_template(template_type)
            print(f"   - {template_type}: {template['name']}")
        
        # Test context extraction
        print("\n3. Testing Context Extraction...")
        extractor = ContextExtractor()
        context = await extractor.extract(
            message="I'm 45 years old with diabetes and take metformin",
            patient_id="test_patient",
            patient_data={"name": "John Doe"}
        )
        print(f"   Extracted age: {context.age}")
        print(f"   Extracted conditions: {context.conditions}")
        print(f"   Extracted medications: {context.medications}")
        
    except Exception as e:
        print(f"❌ Abstraction layer test failed: {e}")
        import traceback
        traceback.print_exc()


async def main():
    """Run all tests"""
    
    print("Claude Code SDK Integration Tests (Simplified)")
    print("=" * 70)
    print(f"Started at: {datetime.now()}")
    print()
    
    # Test API endpoints
    await test_api_endpoints()
    
    # Test abstraction layer
    await test_abstraction_layer()
    
    print(f"\n\nCompleted at: {datetime.now()}")


if __name__ == "__main__":
    # Add the backend directory to Python path
    import sys
    sys.path.insert(0, '/Users/timhunter/ron-ai/backend')
    
    asyncio.run(main())
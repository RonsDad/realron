"""
Test script for Claude Code SDK integration.
Tests tool generation with <10 second requirement.
"""

import asyncio
import aiohttp
import json
import time
from datetime import datetime


async def test_tool_generation():
    """Test the tool generation endpoint"""
    
    base_url = "http://localhost:8000"
    
    # Test cases
    test_requests = [
        {
            "message": "I need help tracking my diabetes medications",
            "patient_id": "test_patient_001",
            "session_id": "test_session_001",
            "patient_data": {
                "name": "John Doe",
                "age": 45,
                "conditions": ["Type 2 Diabetes"],
                "medications": ["Metformin 500mg", "Glipizide 5mg"],
                "insurance": {
                    "provider": "Blue Cross Blue Shield"
                }
            }
        },
        {
            "message": "Find me a cardiologist near me who accepts Aetna insurance",
            "patient_id": "test_patient_002",
            "session_id": "test_session_002",
            "patient_data": {
                "name": "Jane Smith",
                "age": 62,
                "conditions": ["Hypertension", "High Cholesterol"],
                "medications": ["Lisinopril 10mg", "Atorvastatin 20mg"],
                "insurance": {
                    "provider": "Aetna"
                },
                "preferences": {
                    "location": "New York, NY"
                }
            }
        },
        {
            "message": "Help me prepare for my upcoming doctor appointment",
            "patient_id": "test_patient_003",
            "session_id": "test_session_003",
            "patient_data": {
                "name": "Bob Johnson",
                "age": 38,
                "conditions": ["Asthma", "Seasonal Allergies"],
                "medications": ["Albuterol inhaler", "Fluticasone nasal spray"],
                "insurance": {
                    "provider": "United Healthcare"
                }
            }
        }
    ]
    
    async with aiohttp.ClientSession() as session:
        print("Testing Claude Code SDK Tool Generation")
        print("=" * 50)
        
        for i, test_request in enumerate(test_requests, 1):
            print(f"\nTest {i}: {test_request['message'][:50]}...")
            print(f"Patient: {test_request['patient_data']['name']}")
            
            # Time the request
            start_time = time.time()
            
            try:
                async with session.post(
                    f"{base_url}/tools/generate",
                    json=test_request,
                    headers={"Content-Type": "application/json"}
                ) as response:
                    
                    end_time = time.time()
                    generation_time = end_time - start_time
                    
                    result = await response.json()
                    
                    print(f"Status: {response.status}")
                    print(f"Generation Time: {generation_time:.2f} seconds")
                    print(f"Success: {result.get('success', False)}")
                    
                    if result.get('success'):
                        print(f"Tool ID: {result.get('tool_id')}")
                        print(f"Message: {result.get('message')}")
                        print(f"URL: {result.get('display_url')}")
                        
                        # Check if generation met the <10 second requirement
                        if generation_time < 10:
                            print("✅ Met <10 second requirement!")
                        else:
                            print(f"⚠️  Exceeded 10 second requirement by {generation_time - 10:.2f}s")
                    else:
                        print(f"Error: {result.get('message')}")
                    
            except Exception as e:
                print(f"Test failed with error: {e}")
            
            print("-" * 50)
        
        # Test listing tools for a patient
        print("\nTesting tool listing...")
        try:
            async with session.get(
                f"{base_url}/tools/patient/test_patient_001"
            ) as response:
                result = await response.json()
                print(f"Tools found: {result.get('count', 0)}")
                if result.get('tools'):
                    for tool in result['tools']:
                        print(f"  - {tool['name']} ({tool['tool_id']})")
        except Exception as e:
            print(f"List test failed: {e}")


async def test_streaming_generation():
    """Test the streaming tool generation endpoint"""
    
    base_url = "http://localhost:8000"
    
    test_request = {
        "message": "Create a symptom tracker for my migraines",
        "patient_id": "test_patient_stream",
        "session_id": "test_session_stream",
        "patient_data": {
            "name": "Stream Test",
            "age": 35,
            "conditions": ["Chronic Migraines"],
            "medications": ["Sumatriptan"],
            "insurance": {
                "provider": "Cigna"
            }
        }
    }
    
    print("\nTesting Streaming Tool Generation")
    print("=" * 50)
    
    async with aiohttp.ClientSession() as session:
        try:
            async with session.post(
                f"{base_url}/tools/generate/stream",
                json=test_request,
                headers={"Content-Type": "application/json"}
            ) as response:
                
                print(f"Status: {response.status}")
                print("Streaming updates:")
                
                async for line in response.content:
                    if line:
                        decoded = line.decode('utf-8').strip()
                        if decoded.startswith('data: '):
                            data = json.loads(decoded[6:])
                            if data['type'] == 'status':
                                print(f"  📍 {data['message']}")
                            elif data['type'] == 'complete':
                                print(f"  ✅ Complete! Tool ID: {data['result'].get('tool_id')}")
                            elif data['type'] == 'error':
                                print(f"  ❌ Error: {data['message']}")
                
        except Exception as e:
            print(f"Streaming test failed: {e}")


async def main():
    """Run all tests"""
    
    print("Claude Code SDK Integration Tests")
    print("=" * 70)
    print(f"Started at: {datetime.now()}")
    print()
    
    # Test basic generation
    await test_tool_generation()
    
    # Test streaming
    await test_streaming_generation()
    
    print(f"\nCompleted at: {datetime.now()}")


if __name__ == "__main__":
    asyncio.run(main())
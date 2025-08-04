#!/usr/bin/env python3
"""
Test Browserless connection directly
"""

import asyncio
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/Users/timhunter/ron-ai/.env')

async def test_browserless():
    """Test Browserless API connection"""
    import httpx
    
    token = os.getenv('BROWSERLESS_API_TOKEN')
    if not token:
        print("❌ BROWSERLESS_API_TOKEN not set")
        return
        
    print(f"Testing Browserless connection...")
    print(f"Token length: {len(token)}")
    
    # Test the version endpoint
    url = f"https://production-sfo.browserless.io/json/version?token={token}"
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, timeout=10.0)
            
            if response.status_code == 200:
                print("✅ Browserless connection successful!")
                print(f"   Response: {response.json()}")
            else:
                print(f"❌ Browserless returned status {response.status_code}")
                print(f"   Response: {response.text}")
                
    except Exception as e:
        print(f"❌ Connection failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_browserless())
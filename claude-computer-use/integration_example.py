#!/usr/bin/env python3
"""
Integration Example: How to integrate Claude Computer Use with Ron AI
Shows how the computer use outputs trigger browser CCSDK and iframe presentation
"""

import asyncio
import json
import os
from typing import Dict, List, Any
from browser_ccsdk_integration import BrowserCCSDKAgent

async def demonstrate_integration():
    """Demonstrate the complete integration flow"""
    
    print("🚀 Claude Computer Use + Ron AI Integration Demo")
    print("=" * 60)
    
    # Initialize the agent
    api_key = os.getenv("ANTHROPIC_API_KEY")
    browserless_token = os.getenv("BROWSERLESS_API_TOKEN")
    
    if not api_key or api_key == "your_api_key_here":
        print("❌ Please set ANTHROPIC_API_KEY in .env file")
        return
    
    agent = BrowserCCSDKAgent(api_key, browserless_token)
    
    # Example healthcare-related requests that will trigger both computer use and browser automation
    healthcare_requests = [
        "Take a screenshot of the desktop, then search for information about diabetes management online",
        "Open a web browser and find the nearest hospitals to zip code 10001",
        "Look up medication interactions for metformin and lisinopril",
        "Find and display information about COVID-19 vaccination sites",
        "Search for mental health resources and display the results in an organized format"
    ]
    
    for i, request in enumerate(healthcare_requests, 1):
        print(f"\n🎯 Demo {i}: {request}")
        print("-" * 50)
        
        # Execute the integrated computer use with browser automation
        result = await agent.computer_use_with_browser_integration(request)
        
        # Display results
        print(f"📊 Results Summary:")
        print(f"  ✅ Success: {result.get('computer_use_results', []) != []}")
        print(f"  🖥️ Computer Actions: {len(result.get('computer_use_results', []))}")
        print(f"  🌐 Browser Actions: {len(result.get('browser_results', []))}")
        print(f"  📱 Iframe Content: {len(result.get('iframe_content', []))}")
        print(f"  🔗 Browser Integration: {result.get('needs_browser', False)}")
        
        # Show iframe content that would be displayed in Ron AI frontend
        if result.get('iframe_content'):
            print(f"\n📱 Generated Iframe Content:")
            for j, iframe in enumerate(result['iframe_content']):
                print(f"  Iframe {j+1}: {len(iframe)} characters")
                
                # Save iframe content for inspection
                with open(f"/tmp/claude_iframe_{i}_{j+1}.html", "w") as f:
                    f.write(iframe)
                print(f"    Saved to: /tmp/claude_iframe_{i}_{j+1}.html")
        
        # Show browser results
        if result.get('browser_results'):
            print(f"\n🌐 Browser Results:")
            for j, browser_result in enumerate(result['browser_results']):
                print(f"  Action {j+1}: {browser_result.get('type', 'unknown')}")
                if browser_result.get('url'):
                    print(f"    URL: {browser_result['url']}")
                if browser_result.get('error'):
                    print(f"    Error: {browser_result['error']}")
        
        # Clear iframe content for next demo
        agent.clear_iframe_content()
        
        print(f"\n✅ Demo {i} completed!")
        
        # Wait between demos
        if i < len(healthcare_requests):
            await asyncio.sleep(2)
    
    print(f"\n🎉 All demos completed!")
    print(f"\n📋 Integration Summary:")
    print(f"  1. Claude Computer Use takes screenshots and performs desktop actions")
    print(f"  2. When browser actions are needed, Browser CCSDK is automatically triggered")
    print(f"  3. All results are formatted as HTML iframe content")
    print(f"  4. Ron AI frontend displays the iframe content in the chat interface")
    print(f"  5. Users see both desktop screenshots and web content seamlessly")

async def test_ron_ai_api_integration():
    """Test integration with Ron AI API endpoints"""
    
    print("\n🔌 Testing Ron AI API Integration")
    print("=" * 40)
    
    # This would normally be called by the Ron AI backend
    from ron_ai_integration import app
    import httpx
    
    # Start the FastAPI server in the background (in production, this runs separately)
    print("🚀 Starting Claude Computer Use API server...")
    
    # Test the health endpoint
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get("http://localhost:8001/health")
            if response.status_code == 200:
                health_data = response.json()
                print(f"✅ Health Check: {health_data['status']}")
                print(f"  Computer Use: {health_data['computer_use']}")
                print(f"  Browser Integration: {health_data['browser_integration']}")
            else:
                print(f"❌ Health check failed: {response.status_code}")
        except Exception as e:
            print(f"❌ Could not connect to API server: {e}")
            print("💡 Make sure to run: python ron_ai_integration.py")
            return
    
    # Test computer use endpoint
    test_request = {
        "message": "Take a screenshot and then search for 'healthcare AI' online",
        "enable_browser": True,
        "max_iterations": 5
    }
    
    try:
        response = await client.post(
            "http://localhost:8001/api/computer-use",
            json=test_request
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Computer Use API Test:")
            print(f"  Success: {result['success']}")
            print(f"  Message: {result['message']}")
            print(f"  Computer Results: {len(result['computer_results'])}")
            print(f"  Browser Results: {len(result['browser_results'])}")
            print(f"  Iframe Content: {len(result['iframe_content'])}")
        else:
            print(f"❌ Computer Use API failed: {response.status_code}")
            
    except Exception as e:
        print(f"❌ API test failed: {e}")

def show_frontend_integration_example():
    """Show how to integrate with Ron AI React frontend"""
    
    print("\n⚛️ Frontend Integration Example")
    print("=" * 35)
    
    frontend_code = '''
// In your Ron AI chat component, add:

import { ComputerUseIframe } from './ComputerUseIframe';
import { useComputerUse } from './useComputerUse';

const ChatComponent = () => {
  const {
    executeHealthcareComputerUse,
    result,
    isLoading,
    iframeContent
  } = useComputerUse({
    baseUrl: 'http://localhost:8001',
    enableWebSocket: true,
    onIframeContent: (content) => {
      console.log('New iframe content received:', content);
    }
  });

  const handleComputerUseRequest = async (message: string) => {
    await executeHealthcareComputerUse({
      message,
      enable_browser: true,
      max_iterations: 10
    });
  };

  return (
    <div className="chat-container">
      {/* Your existing chat messages */}
      
      {/* Computer Use Results */}
      <ComputerUseIframe
        result={result}
        isLoading={isLoading}
        onRefresh={() => handleComputerUseRequest(lastMessage)}
        className="mt-4"
      />
      
      {/* Chat input */}
      <ChatInput onSubmit={handleComputerUseRequest} />
    </div>
  );
};
'''
    
    print("📝 Frontend Integration Code:")
    print(frontend_code)
    
    print("\n📋 Integration Steps:")
    print("1. Copy ComputerUseIframe.tsx to src/components/")
    print("2. Copy useComputerUse.ts to src/hooks/")
    print("3. Add the computer use API server (port 8001)")
    print("4. Import and use in your chat component")
    print("5. Computer use results will automatically display in iframes")

if __name__ == "__main__":
    print("🎯 Choose demo to run:")
    print("1. Full Integration Demo")
    print("2. API Integration Test")
    print("3. Frontend Integration Example")
    
    choice = input("\nEnter choice (1-3): ").strip()
    
    if choice == "1":
        asyncio.run(demonstrate_integration())
    elif choice == "2":
        asyncio.run(test_ron_ai_api_integration())
    elif choice == "3":
        show_frontend_integration_example()
    else:
        print("Running full integration demo...")
        asyncio.run(demonstrate_integration())

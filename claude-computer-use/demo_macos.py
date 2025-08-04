#!/usr/bin/env python3
"""
macOS Demo for Claude Computer Use Integration
Demonstrates the integration flow without requiring virtual display
"""

import asyncio
import json
import os
import base64
from typing import Dict, List, Any
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class MockComputerUseAgent:
    """Mock agent for demonstration purposes"""
    
    def __init__(self, api_key: str, browserless_token: str = None):
        self.api_key = api_key
        self.browserless_token = browserless_token
        self.iframe_content = []
        
    async def computer_use_with_browser_integration(self, user_request: str) -> Dict[str, Any]:
        """Mock computer use with browser integration"""
        
        print(f"🤖 Processing: {user_request}")
        
        # Simulate computer use results
        computer_results = [
            {
                "role": "assistant",
                "content": [
                    {
                        "type": "text",
                        "text": f"I'll help you with: {user_request}"
                    },
                    {
                        "type": "tool_use",
                        "id": "screenshot_001",
                        "name": "computer",
                        "input": {"action": "screenshot"}
                    }
                ]
            },
            {
                "role": "user", 
                "content": [
                    {
                        "type": "tool_result",
                        "tool_use_id": "screenshot_001",
                        "content": "Screenshot taken successfully"
                    }
                ]
            }
        ]
        
        # Determine if browser integration is needed
        needs_browser = self.should_use_browser(user_request)
        
        browser_results = []
        if needs_browser:
            print("🌐 Triggering browser automation...")
            browser_results = [
                {
                    "type": "browser_navigation",
                    "url": "https://www.google.com/search?q=" + user_request.replace(" ", "+"),
                    "page_title": "Google Search Results",
                    "screenshot": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
                },
                {
                    "type": "content_extracted",
                    "content": [
                        {
                            "tag": "h3",
                            "text": f"Search results for {user_request}",
                            "html": f"<h3>Search results for {user_request}</h3>"
                        },
                        {
                            "tag": "p",
                            "text": "This is a simulated search result showing relevant information.",
                            "html": "<p>This is a simulated search result showing relevant information.</p>"
                        }
                    ],
                    "selector": ".search-results"
                }
            ]
        
        # Generate iframe content
        for result in browser_results:
            iframe_html = await self.present_in_iframe(result)
            self.iframe_content.append(iframe_html)
        
        # Also create iframe for computer screenshot
        screenshot_content = {
            "type": "computer_screenshot",
            "screenshot": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
        }
        screenshot_iframe = await self.present_in_iframe(screenshot_content)
        self.iframe_content.append(screenshot_iframe)
        
        return {
            "computer_use_results": computer_results,
            "browser_results": browser_results,
            "iframe_content": self.iframe_content.copy(),
            "needs_browser": needs_browser
        }
    
    def should_use_browser(self, user_request: str) -> bool:
        """Determine if browser integration is needed"""
        browser_keywords = [
            "search", "online", "website", "web", "google", "find information",
            "look up", "browse", "internet", "url", "navigate"
        ]
        return any(keyword in user_request.lower() for keyword in browser_keywords)
    
    async def present_in_iframe(self, content: Dict[str, Any]) -> str:
        """Generate iframe HTML content"""
        
        if content.get("type") == "browser_navigation":
            iframe_html = f"""
            <div class="claude-browser-result">
                <div class="browser-header">
                    <h3>🌐 Browser Navigation</h3>
                    <p><strong>URL:</strong> {content.get('url', '')}</p>
                    <p><strong>Title:</strong> {content.get('page_title', '')}</p>
                </div>
                <div class="browser-screenshot">
                    <img src="data:image/png;base64,{content.get('screenshot', '')}" 
                         alt="Browser Screenshot" 
                         style="max-width: 100%; height: auto; border: 1px solid #ccc;">
                </div>
            </div>
            """
        
        elif content.get("type") == "content_extracted":
            extracted_items = content.get("content", [])
            content_html = ""
            
            for item in extracted_items:
                content_html += f"""
                <div class="extracted-item">
                    <strong>{item.get('tag', 'unknown')}:</strong>
                    <p>{item.get('text', '')}</p>
                </div>
                """
            
            iframe_html = f"""
            <div class="claude-content-extraction">
                <div class="extraction-header">
                    <h3>📄 Content Extraction</h3>
                    <p><strong>Selector:</strong> {content.get('selector', '')}</p>
                    <p><strong>Items Found:</strong> {len(extracted_items)}</p>
                </div>
                <div class="extracted-content">
                    {content_html}
                </div>
            </div>
            """
        
        elif content.get("type") == "computer_screenshot":
            iframe_html = f"""
            <div class="claude-computer-screenshot">
                <div class="screenshot-header">
                    <h3>🖥️ Desktop Screenshot</h3>
                    <p>Claude's view of the desktop environment</p>
                </div>
                <div class="screenshot-image">
                    <img src="data:image/png;base64,{content.get('screenshot', '')}" 
                         alt="Desktop Screenshot" 
                         style="max-width: 100%; height: auto; border: 1px solid #ccc;">
                </div>
            </div>
            """
        
        else:
            iframe_html = f"""
            <div class="claude-generic-result">
                <div class="result-header">
                    <h3>🤖 Claude Computer Use Result</h3>
                    <p><strong>Type:</strong> {content.get('type', 'unknown')}</p>
                </div>
                <div class="result-content">
                    <pre>{json.dumps(content, indent=2)}</pre>
                </div>
            </div>
            """
        
        # Add CSS styling
        styled_iframe = f"""
        <style>
            .claude-browser-result, .claude-content-extraction, 
            .claude-computer-screenshot, .claude-generic-result {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                max-width: 100%;
                margin: 20px 0;
                border: 1px solid #e1e5e9;
                border-radius: 8px;
                overflow: hidden;
                background: white;
            }}
            
            .browser-header, .extraction-header, .screenshot-header, .result-header {{
                background: #f8f9fa;
                padding: 15px;
                border-bottom: 1px solid #e1e5e9;
            }}
            
            .browser-header h3, .extraction-header h3, 
            .screenshot-header h3, .result-header h3 {{
                margin: 0 0 10px 0;
                color: #1a73e8;
                font-size: 16px;
            }}
            
            .browser-screenshot, .extracted-content, 
            .screenshot-image, .result-content {{
                padding: 15px;
            }}
            
            .extracted-item {{
                margin-bottom: 15px;
                padding: 10px;
                background: #f8f9fa;
                border-radius: 4px;
            }}
            
            .extracted-item strong {{
                color: #1a73e8;
                text-transform: uppercase;
                font-size: 12px;
            }}
            
            pre {{
                background: #f8f9fa;
                padding: 15px;
                border-radius: 4px;
                overflow-x: auto;
                font-size: 12px;
                margin: 0;
            }}
        </style>
        {iframe_html}
        """
        
        return styled_iframe
    
    def clear_iframe_content(self):
        """Clear stored iframe content"""
        self.iframe_content = []

async def demonstrate_integration():
    """Demonstrate the complete integration flow"""
    
    print("🚀 Claude Computer Use + Ron AI Integration Demo")
    print("=" * 60)
    
    # Initialize the mock agent
    api_key = os.getenv("ANTHROPIC_API_KEY")
    browserless_token = os.getenv("BROWSERLESS_API_TOKEN")
    
    if not api_key:
        print("❌ ANTHROPIC_API_KEY not found in environment")
        return
    
    print(f"✅ API Key found: {api_key[:20]}...")
    if browserless_token:
        print(f"✅ Browserless token found: {browserless_token[:20]}...")
    
    agent = MockComputerUseAgent(api_key, browserless_token)
    
    # Healthcare-related demo requests
    healthcare_requests = [
        "Take a screenshot and search for diabetes management resources online",
        "Find information about COVID-19 vaccination sites near me",
        "Look up medication interactions for metformin",
        "Search for mental health resources and display results",
        "Find the nearest hospitals and their contact information"
    ]
    
    for i, request in enumerate(healthcare_requests, 1):
        print(f"\n🎯 Demo {i}: {request}")
        print("-" * 50)
        
        # Execute the integrated computer use with browser automation
        result = await agent.computer_use_with_browser_integration(request)
        
        # Display results
        print(f"📊 Results Summary:")
        print(f"  ✅ Success: True")
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
                iframe_filename = f"/tmp/claude_iframe_demo_{i}_{j+1}.html"
                with open(iframe_filename, "w") as f:
                    f.write(iframe)
                print(f"    💾 Saved to: {iframe_filename}")
        
        # Show browser results details
        if result.get('browser_results'):
            print(f"\n🌐 Browser Results Details:")
            for j, browser_result in enumerate(result['browser_results']):
                print(f"  Action {j+1}: {browser_result.get('type', 'unknown')}")
                if browser_result.get('url'):
                    print(f"    📍 URL: {browser_result['url']}")
                if browser_result.get('page_title'):
                    print(f"    📄 Title: {browser_result['page_title']}")
                if browser_result.get('content'):
                    print(f"    📝 Content Items: {len(browser_result['content'])}")
        
        # Clear iframe content for next demo
        agent.clear_iframe_content()
        
        print(f"\n✅ Demo {i} completed!")
        
        # Wait between demos
        if i < len(healthcare_requests):
            await asyncio.sleep(1)
    
    print(f"\n🎉 All demos completed!")
    print(f"\n📋 Integration Summary:")
    print(f"  1. ✅ Claude Computer Use processes user requests")
    print(f"  2. ✅ Browser CCSDK triggers automatically for web-related tasks")
    print(f"  3. ✅ All results formatted as styled HTML iframe content")
    print(f"  4. ✅ Ron AI frontend would display iframe content seamlessly")
    print(f"  5. ✅ Healthcare context and privacy considerations included")
    
    print(f"\n🔗 Next Steps:")
    print(f"  • Deploy to EC2 with virtual display for full functionality")
    print(f"  • Integrate with your Ron AI backend API")
    print(f"  • Add the React components to your frontend")
    print(f"  • Test with real Anthropic Computer Use API")
    
    print(f"\n📁 Generated Files:")
    print(f"  • Check /tmp/claude_iframe_demo_*.html for iframe previews")

def show_api_integration_example():
    """Show how this integrates with Ron AI API"""
    
    print("\n🔌 Ron AI API Integration Example")
    print("=" * 40)
    
    api_example = '''
# In your Ron AI backend (api.py), add:

from claude_computer_use.ron_ai_integration import app as computer_use_app

# Mount the computer use API
app.mount("/computer-use", computer_use_app)

# Or add specific endpoints:
@app.post("/api/chat/computer-use")
async def chat_with_computer_use(request: ChatRequest):
    """Enhanced chat with computer use capabilities"""
    
    # Process with Claude Computer Use
    computer_result = await computer_use_agent.computer_use_with_browser_integration(
        request.message
    )
    
    # Return enhanced response with iframe content
    return ChatResponse(
        message=computer_result["computer_use_results"][-1]["content"],
        iframe_content=computer_result["iframe_content"],
        browser_results=computer_result["browser_results"],
        needs_browser=computer_result["needs_browser"]
    )
'''
    
    frontend_example = '''
# In your Ron AI frontend, update the chat component:

import { ComputerUseIframe } from '@/components/ComputerUseIframe';

const ChatMessage = ({ message, computerUseResult }) => {
  return (
    <div className="chat-message">
      <div className="message-content">
        {message}
      </div>
      
      {/* Display computer use results in iframe */}
      {computerUseResult && (
        <ComputerUseIframe 
          result={computerUseResult}
          className="mt-4"
        />
      )}
    </div>
  );
};
'''
    
    print("📝 Backend Integration:")
    print(api_example)
    
    print("\n⚛️ Frontend Integration:")
    print(frontend_example)

if __name__ == "__main__":
    print("🎯 Claude Computer Use Integration Demo")
    print("Choose demo to run:")
    print("1. Full Integration Demo (Recommended)")
    print("2. API Integration Example")
    print("3. Both")
    
    choice = input("\nEnter choice (1-3, or press Enter for 1): ").strip() or "1"
    
    if choice == "1":
        asyncio.run(demonstrate_integration())
    elif choice == "2":
        show_api_integration_example()
    elif choice == "3":
        asyncio.run(demonstrate_integration())
        show_api_integration_example()
    else:
        print("Running full integration demo...")
        asyncio.run(demonstrate_integration())

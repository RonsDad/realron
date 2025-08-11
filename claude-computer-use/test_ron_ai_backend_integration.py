#!/usr/bin/env python3
"""
Test integration with existing Ron AI backend
Shows how to add computer use capabilities to your current API
"""

import asyncio
import json
import sys
import os
from pathlib import Path

# Add the parent directory to the path to import from the main Ron AI backend
sys.path.append(str(Path(__file__).parent.parent))

try:
    # Try to import from your existing backend
    from backend.api import app as ron_ai_app
    from backend.claude_sonnet_4_agent import ClaudeSonnet4Agent
    print("✅ Successfully imported existing Ron AI backend")
except ImportError as e:
    print(f"⚠️ Could not import existing backend: {e}")
    print("This is expected if running standalone")

from demo_macos import MockComputerUseAgent

class EnhancedRonAIAgent:
    """Enhanced Ron AI agent with computer use capabilities"""
    
    def __init__(self, api_key: str, browserless_token: str = None):
        self.api_key = api_key
        self.browserless_token = browserless_token
        
        # Initialize computer use agent
        self.computer_agent = MockComputerUseAgent(api_key, browserless_token)
        
        # Try to initialize existing Claude agent
        try:
            self.claude_agent = ClaudeSonnet4Agent(api_key)
            print("✅ Initialized existing Claude Sonnet 4 agent")
        except:
            self.claude_agent = None
            print("⚠️ Could not initialize existing Claude agent, using mock")
    
    async def enhanced_chat(self, message: str, enable_computer_use: bool = True) -> dict:
        """Enhanced chat with optional computer use"""
        
        # Determine if computer use is needed
        needs_computer_use = self.should_use_computer_use(message)
        
        if enable_computer_use and needs_computer_use:
            print("🖥️ Using computer use for this request...")
            
            # Process with computer use
            computer_result = await self.computer_agent.computer_use_with_browser_integration(message)
            
            # Also get regular Claude response if available
            claude_response = None
            if self.claude_agent:
                try:
                    claude_response = await self.claude_agent.process_message(message)
                except:
                    claude_response = "I'll help you with that using computer automation."
            else:
                claude_response = "I'll help you with that using computer automation."
            
            return {
                "type": "enhanced_response",
                "claude_response": claude_response,
                "computer_use_result": computer_result,
                "has_iframe_content": len(computer_result.get("iframe_content", [])) > 0,
                "needs_browser": computer_result.get("needs_browser", False)
            }
        
        else:
            print("💬 Using regular chat response...")
            
            # Regular Claude response
            if self.claude_agent:
                try:
                    response = await self.claude_agent.process_message(message)
                except:
                    response = f"I understand you're asking about: {message}. I'd be happy to help with that."
            else:
                response = f"I understand you're asking about: {message}. I'd be happy to help with that."
            
            return {
                "type": "regular_response",
                "claude_response": response,
                "computer_use_result": None,
                "has_iframe_content": False,
                "needs_browser": False
            }
    
    def should_use_computer_use(self, message: str) -> bool:
        """Determine if computer use should be triggered"""
        
        computer_use_keywords = [
            "screenshot", "take a picture", "show me", "navigate to",
            "search online", "find on the web", "browse", "look up online",
            "open", "click", "type", "fill out", "download", "upload",
            "find information", "research", "check website"
        ]
        
        message_lower = message.lower()
        return any(keyword in message_lower for keyword in computer_use_keywords)

async def test_enhanced_chat():
    """Test the enhanced chat functionality"""
    
    print("🧪 Testing Enhanced Ron AI with Computer Use")
    print("=" * 50)
    
    # Initialize enhanced agent
    api_key = os.getenv("ANTHROPIC_API_KEY")
    browserless_token = os.getenv("BROWSERLESS_API_TOKEN")
    
    if not api_key:
        print("❌ ANTHROPIC_API_KEY not found")
        return
    
    agent = EnhancedRonAIAgent(api_key, browserless_token)
    
    # Test cases
    test_cases = [
        {
            "message": "What are the symptoms of diabetes?",
            "expected_computer_use": False,
            "description": "Regular healthcare question"
        },
        {
            "message": "Take a screenshot and search for diabetes management resources",
            "expected_computer_use": True,
            "description": "Computer use + web search"
        },
        {
            "message": "Find information online about COVID vaccines",
            "expected_computer_use": True,
            "description": "Web research request"
        },
        {
            "message": "How can I manage my blood pressure?",
            "expected_computer_use": False,
            "description": "General medical advice"
        },
        {
            "message": "Navigate to the CDC website and find flu shot information",
            "expected_computer_use": True,
            "description": "Specific navigation task"
        }
    ]
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n🧪 Test {i}: {test_case['description']}")
        print(f"📝 Message: {test_case['message']}")
        print(f"🎯 Expected Computer Use: {test_case['expected_computer_use']}")
        
        # Process the message
        result = await agent.enhanced_chat(test_case['message'])
        
        # Display results
        print(f"📊 Results:")
        print(f"  Type: {result['type']}")
        print(f"  Computer Use Triggered: {result['computer_use_result'] is not None}")
        print(f"  Has Iframe Content: {result['has_iframe_content']}")
        print(f"  Needs Browser: {result['needs_browser']}")
        
        if result['claude_response']:
            print(f"  Claude Response: {result['claude_response'][:100]}...")
        
        if result['computer_use_result']:
            computer_result = result['computer_use_result']
            print(f"  Computer Actions: {len(computer_result.get('computer_use_results', []))}")
            print(f"  Browser Actions: {len(computer_result.get('browser_results', []))}")
            print(f"  Iframe Content: {len(computer_result.get('iframe_content', []))}")
        
        # Validation
        actual_computer_use = result['computer_use_result'] is not None
        if actual_computer_use == test_case['expected_computer_use']:
            print(f"  ✅ Test passed!")
        else:
            print(f"  ❌ Test failed - expected {test_case['expected_computer_use']}, got {actual_computer_use}")
        
        await asyncio.sleep(0.5)  # Brief pause between tests
    
    print(f"\n🎉 Testing completed!")

def show_integration_steps():
    """Show how to integrate with existing Ron AI backend"""
    
    print("\n🔧 Integration Steps for Your Ron AI Backend")
    print("=" * 50)
    
    steps = """
1. 📁 Copy Computer Use Files:
   cp claude-computer-use/browser_ccsdk_integration.py backend/
   cp claude-computer-use/ron_ai_integration.py backend/
   cp claude-computer-use/ComputerUseIframe.tsx src/ron-ai/components/
   cp claude-computer-use/useComputerUse.ts src/ron-ai/hooks/

2. 📝 Update backend/api.py:
   
   from browser_ccsdk_integration import BrowserCCSDKAgent
   
   # Add computer use agent
   computer_agent = None
   
   def get_computer_agent():
       global computer_agent
       if computer_agent is None:
           api_key = os.getenv("ANTHROPIC_API_KEY")
           browserless_token = os.getenv("BROWSERLESS_API_TOKEN")
           computer_agent = BrowserCCSDKAgent(api_key, browserless_token)
       return computer_agent
   
   # Add new endpoint
   @app.post("/api/chat/enhanced")
   async def enhanced_chat(request: ChatRequest):
       agent = get_computer_agent()
       
       # Check if computer use is needed
       if should_use_computer_use(request.message):
           result = await agent.computer_use_with_browser_integration(request.message)
           
           return ChatResponse(
               message=request.message,
               response="Computer use completed",
               computer_use_result=result,
               iframe_content=result.get("iframe_content", [])
           )
       else:
           # Use existing Claude agent
           return await regular_chat(request)

3. ⚛️ Update Frontend Chat Component:
   
   import { ComputerUseIframe } from '@/components/ComputerUseIframe';
   import { useComputerUse } from '@/hooks/useComputerUse';
   
   const ChatInterface = () => {
     const { executeComputerUse, result, isLoading } = useComputerUse();
     
     const handleMessage = async (message) => {
       if (needsComputerUse(message)) {
         await executeComputerUse({ message, enable_browser: true });
       } else {
         // Use existing chat logic
         await sendRegularMessage(message);
       }
     };
     
     return (
       <div>
         {/* Existing chat messages */}
         
         {/* Computer use results */}
         {result && (
           <ComputerUseIframe 
             result={result} 
             isLoading={isLoading}
             className="mt-4"
           />
         )}
       </div>
     );
   };

4. 🚀 Start Both Servers:
   # Terminal 1: Main Ron AI backend
   cd backend && python api.py
   
   # Terminal 2: Computer Use API
   cd claude-computer-use && python ron_ai_integration.py
   
   # Terminal 3: Frontend
   cd src/ron-ai && npm run dev

5. ✅ Test Integration:
   - Regular healthcare questions → Normal Claude responses
   - "Take a screenshot" → Computer use triggered
   - "Search online for..." → Browser automation + iframe display
   - All results displayed seamlessly in your existing UI
"""
    
    print(steps)

if __name__ == "__main__":
    print("🎯 Ron AI Backend Integration Test")
    print("Choose option:")
    print("1. Test Enhanced Chat Functionality")
    print("2. Show Integration Steps")
    print("3. Both")
    
    choice = input("\nEnter choice (1-3, or press Enter for 1): ").strip() or "1"
    
    if choice == "1":
        asyncio.run(test_enhanced_chat())
    elif choice == "2":
        show_integration_steps()
    elif choice == "3":
        asyncio.run(test_enhanced_chat())
        show_integration_steps()
    else:
        print("Running enhanced chat test...")
        asyncio.run(test_enhanced_chat())

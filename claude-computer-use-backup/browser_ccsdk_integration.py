#!/usr/bin/env python3
"""
Browser CCSDK Integration for Claude Computer Use
Integrates Claude's computer use outputs with browser automation and iframe presentation
"""

import asyncio
import json
import base64
from typing import Dict, List, Any, Optional
from claude_computer_agent import ComputerUseAgent
import requests
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

class BrowserCCSDKAgent(ComputerUseAgent):
    def __init__(self, api_key: str, browserless_token: str = None, display_width: int = 1024, display_height: int = 768):
        super().__init__(api_key, display_width, display_height)
        self.browserless_token = browserless_token
        self.browser_session = None
        self.iframe_content = []
        
    def setup_browser_session(self):
        """Setup browser session for CCSDK integration"""
        chrome_options = Options()
        chrome_options.add_argument('--headless')
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument(f'--window-size={self.display_width},{self.display_height}')
        
        if self.browserless_token:
            # Use Browserless service
            chrome_options.add_argument(f'--remote-debugging-address=chrome.browserless.io')
            chrome_options.add_argument(f'--remote-debugging-port=3000')
        
        self.browser_session = webdriver.Chrome(options=chrome_options)
        return self.browser_session
    
    async def create_browser_ccsdk_tool(self, action: str, **kwargs) -> Dict[str, Any]:
        """Create browser CCSDK tool for web automation"""
        try:
            if not self.browser_session:
                self.setup_browser_session()
            
            if action == "navigate":
                url = kwargs.get("url", "")
                self.browser_session.get(url)
                
                # Take screenshot for Claude to analyze
                screenshot = self.browser_session.get_screenshot_as_base64()
                
                return {
                    "type": "browser_navigation",
                    "url": url,
                    "screenshot": screenshot,
                    "page_title": self.browser_session.title,
                    "current_url": self.browser_session.current_url
                }
            
            elif action == "click_element":
                selector = kwargs.get("selector", "")
                element = WebDriverWait(self.browser_session, 10).until(
                    EC.element_to_be_clickable((By.CSS_SELECTOR, selector))
                )
                element.click()
                
                screenshot = self.browser_session.get_screenshot_as_base64()
                return {
                    "type": "element_clicked",
                    "selector": selector,
                    "screenshot": screenshot
                }
            
            elif action == "fill_form":
                form_data = kwargs.get("form_data", {})
                for field_selector, value in form_data.items():
                    element = self.browser_session.find_element(By.CSS_SELECTOR, field_selector)
                    element.clear()
                    element.send_keys(value)
                
                screenshot = self.browser_session.get_screenshot_as_base64()
                return {
                    "type": "form_filled",
                    "form_data": form_data,
                    "screenshot": screenshot
                }
            
            elif action == "extract_content":
                content_selector = kwargs.get("selector", "body")
                elements = self.browser_session.find_elements(By.CSS_SELECTOR, content_selector)
                
                extracted_content = []
                for element in elements:
                    extracted_content.append({
                        "tag": element.tag_name,
                        "text": element.text,
                        "html": element.get_attribute('outerHTML')
                    })
                
                return {
                    "type": "content_extracted",
                    "content": extracted_content,
                    "selector": content_selector
                }
            
            elif action == "execute_javascript":
                script = kwargs.get("script", "")
                result = self.browser_session.execute_script(script)
                
                return {
                    "type": "javascript_executed",
                    "script": script,
                    "result": result
                }
            
            else:
                return {"error": f"Unknown browser action: {action}"}
                
        except Exception as e:
            return {"error": f"Browser action failed: {str(e)}"}
    
    async def present_in_iframe(self, content: Dict[str, Any]) -> str:
        """Present content in iframe format for Ron AI frontend"""
        
        # Generate iframe HTML based on content type
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
            
            for item in extracted_items[:10]:  # Limit to first 10 items
                content_html += f"""
                <div class="extracted-item">
                    <strong>{item.get('tag', 'unknown')}:</strong>
                    <p>{item.get('text', '')[:200]}...</p>
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
            # Generic content presentation
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
            }}
        </style>
        {iframe_html}
        """
        
        # Store for iframe presentation
        self.iframe_content.append(styled_iframe)
        
        return styled_iframe
    
    async def computer_use_with_browser_integration(self, user_request: str) -> Dict[str, Any]:
        """Enhanced computer use that automatically triggers browser CCSDK when appropriate"""
        
        # First, process with regular computer use
        messages = [{"role": "user", "content": user_request}]
        result_messages = await self.sampling_loop(messages)
        
        # Analyze the results to determine if browser integration is needed
        needs_browser = self.should_use_browser(user_request, result_messages)
        
        if needs_browser:
            print("🌐 Triggering browser CCSDK integration...")
            
            # Extract relevant information for browser automation
            browser_actions = self.extract_browser_actions(user_request, result_messages)
            
            browser_results = []
            for action in browser_actions:
                result = await self.create_browser_ccsdk_tool(**action)
                browser_results.append(result)
                
                # Present each result in iframe
                iframe_content = await self.present_in_iframe(result)
                print(f"📱 Generated iframe content: {len(iframe_content)} characters")
        
        # Also present computer use screenshots in iframe
        for message in result_messages:
            if message.get("role") == "assistant":
                for block in message.get("content", []):
                    if hasattr(block, 'type') and block.type == "image":
                        screenshot_content = {
                            "type": "computer_screenshot",
                            "screenshot": block.source.data if hasattr(block.source, 'data') else ""
                        }
                        await self.present_in_iframe(screenshot_content)
        
        return {
            "computer_use_results": result_messages,
            "browser_results": browser_results if needs_browser else [],
            "iframe_content": self.iframe_content,
            "needs_browser": needs_browser
        }
    
    def should_use_browser(self, user_request: str, result_messages: List[Dict]) -> bool:
        """Determine if browser CCSDK should be triggered"""
        
        # Keywords that suggest browser automation is needed
        browser_keywords = [
            "website", "web", "browser", "navigate", "search online",
            "google", "firefox", "chrome", "url", "http", "https",
            "form", "submit", "click", "download", "upload"
        ]
        
        # Check user request
        request_lower = user_request.lower()
        if any(keyword in request_lower for keyword in browser_keywords):
            return True
        
        # Check if Claude mentioned browser-related actions
        for message in result_messages:
            if message.get("role") == "assistant":
                content_str = str(message.get("content", "")).lower()
                if any(keyword in content_str for keyword in browser_keywords):
                    return True
        
        return False
    
    def extract_browser_actions(self, user_request: str, result_messages: List[Dict]) -> List[Dict]:
        """Extract browser actions from Claude's computer use results"""
        
        actions = []
        
        # Simple extraction logic - in production, this would be more sophisticated
        if "navigate" in user_request.lower() or "go to" in user_request.lower():
            # Try to extract URL
            words = user_request.split()
            for word in words:
                if word.startswith(("http://", "https://", "www.")):
                    actions.append({
                        "action": "navigate",
                        "url": word
                    })
                    break
        
        if "search" in user_request.lower():
            actions.append({
                "action": "navigate",
                "url": "https://www.google.com"
            })
            
            # Extract search terms
            search_terms = user_request.replace("search for", "").replace("search", "").strip()
            if search_terms:
                actions.append({
                    "action": "fill_form",
                    "form_data": {
                        "input[name='q']": search_terms
                    }
                })
        
        return actions
    
    def get_iframe_content_for_frontend(self) -> List[str]:
        """Get all iframe content for frontend presentation"""
        return self.iframe_content
    
    def clear_iframe_content(self):
        """Clear stored iframe content"""
        self.iframe_content = []

async def demo_browser_integration():
    """Demo of browser CCSDK integration"""
    import os
    
    api_key = os.getenv("ANTHROPIC_API_KEY")
    browserless_token = os.getenv("BROWSERLESS_API_TOKEN")
    
    if not api_key or api_key == "your_api_key_here":
        print("❌ Please set ANTHROPIC_API_KEY in .env file")
        return
    
    agent = BrowserCCSDKAgent(api_key, browserless_token)
    
    print("🚀 Browser CCSDK Integration Demo")
    print("=" * 50)
    
    # Test requests that should trigger browser integration
    test_requests = [
        "Take a screenshot and then navigate to Google",
        "Search for 'Claude AI computer use' online",
        "Open Firefox and go to GitHub",
        "Find information about Python programming on the web"
    ]
    
    for request in test_requests:
        print(f"\n🎯 Testing: {request}")
        result = await agent.computer_use_with_browser_integration(request)
        
        print(f"📊 Results:")
        print(f"  - Computer use messages: {len(result['computer_use_results'])}")
        print(f"  - Browser results: {len(result['browser_results'])}")
        print(f"  - Iframe content pieces: {len(result['iframe_content'])}")
        print(f"  - Needs browser: {result['needs_browser']}")
        
        # Show iframe content
        if result['iframe_content']:
            print(f"📱 Generated iframe content preview:")
            for i, content in enumerate(result['iframe_content']):
                print(f"  Iframe {i+1}: {len(content)} characters")
        
        agent.clear_iframe_content()

if __name__ == "__main__":
    asyncio.run(demo_browser_integration())

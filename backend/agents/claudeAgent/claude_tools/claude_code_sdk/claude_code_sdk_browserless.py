"""
Browserless integration for Claude Code SDK tool generation
VERBATIM copy of browserless LiveURL generation from browser_use_service.py
"""

import os
import asyncio
import logging
from typing import Dict, Any, Optional
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ClaudeCodeSDKBrowserless:
    """Manages browserless sessions for Claude Code SDK tools"""
    
    def __init__(self):
        self.active_sessions: Dict[str, Dict[str, Any]] = {}
        self.session_metadata: Dict[str, Dict[str, Any]] = {}
        
    async def create_browser_ccsdk(self, tool_html: str, tool_name: str) -> Dict[str, Any]:
        """
        Create browserless session for Claude Code SDK tool display
        This is a VERBATIM implementation from browser_use_service.py
        """
        # 1. Get Browserless API token (VERBATIM)
        browserless_token = os.getenv('BROWSERLESS_API_TOKEN')
        if not browserless_token:
            raise ValueError("BROWSERLESS_API_TOKEN environment variable is required")
        
        # 2. Generate session ID (VERBATIM pattern)
        session_id = f"ccsdk_tool_{datetime.now().timestamp()}"
        
        # 3. Connect via Playwright for CDP support (VERBATIM)
        from playwright.async_api import async_playwright
        playwright = await async_playwright().start()
        browser = await playwright.chromium.connect_over_cdp(
            f"wss://production-sfo.browserless.io/chrome/stealth?token={browserless_token}&timeout=900000"
        )
        context = browser.contexts[0] if browser.contexts else await browser.new_context()
        playwright_page = context.pages[0] if context.pages else await context.new_page()
        
        # 4. Load the tool HTML with animation
        await playwright_page.set_content(self._get_loading_animation_html(tool_name))
        
        # 5. Create CDP session for LiveURL (VERBATIM)
        cdp = await context.new_cdp_session(playwright_page)
        
        # 6. Generate LiveURL (VERBATIM)
        response = await cdp.send('Browserless.liveURL', {
            "timeout": 3600000,  # 60 minutes for complex tool generation
            "interactive": False  # Tools are view-only
        })
        
        live_url = response["liveURL"]
        
        # 7. Store session info (VERBATIM pattern)
        self.active_sessions[session_id] = {
            'session_id': session_id,
            'live_url': live_url,
            'playwright': playwright,
            'browser': browser,
            'context': context,
            'page': playwright_page,
            'cdp': cdp,
            'tool_name': tool_name,
            'created_at': datetime.now().isoformat()
        }
        
        # 8. Schedule content update after generation
        asyncio.create_task(self._generate_and_update_tool(session_id, tool_html))
        
        return {
            'success': True,
            'session_id': session_id,
            'live_url': live_url,
            'tool_name': tool_name
        }
    
    def _get_loading_animation_html(self, tool_name: str) -> str:
        """Beautiful blue gradient loading animation"""
        return f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        
        body {{
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            color: white;
        }}
        
        .container {{
            text-align: center;
            padding: 2rem;
        }}
        
        /* DOPE Spinner */
        .spinner {{
            width: 80px;
            height: 80px;
            margin: 0 auto 2rem;
            position: relative;
        }}
        
        .spinner::before {{
            content: '';
            position: absolute;
            inset: 0;
            border-radius: 50%;
            background: conic-gradient(from 0deg, transparent, #ffffff);
            animation: spin 1.5s linear infinite;
            mask: radial-gradient(circle, transparent 65%, black 65%);
            -webkit-mask: radial-gradient(circle, transparent 65%, black 65%);
        }}
        
        @keyframes spin {{
            to {{ transform: rotate(360deg); }}
        }}
        
        .title {{
            font-size: 1.5rem;
            font-weight: 600;
            margin-bottom: 1rem;
            opacity: 0;
            animation: fadeInUp 0.6s ease-out forwards;
        }}
        
        .status {{
            font-size: 1rem;
            opacity: 0.9;
            margin-bottom: 2rem;
            opacity: 0;
            animation: fadeInUp 0.6s ease-out 0.2s forwards;
        }}
        
        .progress-container {{
            width: 250px;
            height: 6px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 3px;
            overflow: hidden;
            margin: 0 auto;
            opacity: 0;
            animation: fadeInUp 0.6s ease-out 0.4s forwards;
        }}
        
        .progress-bar {{
            height: 100%;
            background: linear-gradient(90deg, #ffffff 0%, #f0f0ff 100%);
            border-radius: 3px;
            animation: progress 2s ease-in-out infinite;
        }}
        
        @keyframes fadeInUp {{
            to {{
                opacity: 1;
                transform: translateY(0);
            }}
            from {{
                opacity: 0;
                transform: translateY(20px);
            }}
        }}
        
        @keyframes progress {{
            0% {{ width: 0%; }}
            50% {{ width: 60%; }}
            100% {{ width: 95%; }}
        }}
        
        .detail {{
            margin-top: 1rem;
            font-size: 0.875rem;
            opacity: 0.7;
            opacity: 0;
            animation: fadeInUp 0.6s ease-out 0.6s forwards;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="spinner"></div>
        <h1 class="title">Creating Your {tool_name}</h1>
        <p class="status" id="status">Analyzing your healthcare needs...</p>
        <div class="progress-container">
            <div class="progress-bar"></div>
        </div>
        <p class="detail" id="detail">This will just take a moment</p>
    </div>
    
    <script>
        const statuses = [
            {{ text: "Analyzing your healthcare needs...", detail: "Understanding your requirements" }},
            {{ text: "Personalizing for your profile...", detail: "Customizing features for you" }},
            {{ text: "Building interactive components...", detail: "Creating user-friendly interface" }},
            {{ text: "Optimizing for your device...", detail: "Ensuring smooth performance" }},
            {{ text: "Finalizing your tool...", detail: "Almost ready!" }}
        ];
        
        let index = 0;
        setInterval(() => {{
            index = (index + 1) % statuses.length;
            document.getElementById('status').textContent = statuses[index].text;
            document.getElementById('detail').textContent = statuses[index].detail;
        }}, 2500);
    </script>
</body>
</html>
"""
    
    async def _generate_and_update_tool(self, session_id: str, tool_html: str):
        """Update the browserless session with the generated tool content"""
        try:
            # Wait a moment for the initial animation to show
            await asyncio.sleep(2)
            
            # Get the session
            if session_id not in self.active_sessions:
                logger.error(f"Session {session_id} not found")
                return
            
            session = self.active_sessions[session_id]
            page = session['page']
            
            # Update the content with the generated tool
            await page.set_content(tool_html)
            logger.info(f"Updated session {session_id} with generated tool content")
            
        except Exception as e:
            logger.error(f"Error updating tool content: {str(e)}")
    
    async def update_tool_content(self, session_id: str, html: str):
        """Update tool content in real-time"""
        if session_id not in self.active_sessions:
            raise ValueError(f"Session {session_id} not found")
        
        try:
            session = self.active_sessions[session_id]
            page = session['page']
            await page.set_content(html)
            logger.info(f"Updated content for session {session_id}")
        except Exception as e:
            logger.error(f"Error updating content: {str(e)}")
            raise
    
    async def close_session(self, session_id: str):
        """Close a tool preview session"""
        if session_id not in self.active_sessions:
            return
        
        try:
            session = self.active_sessions[session_id]
            
            # Close browser
            if 'browser' in session:
                await session['browser'].close()
            
            # Stop Playwright
            if 'playwright' in session:
                await session['playwright'].stop()
            
            # Remove from tracking
            del self.active_sessions[session_id]
            logger.info(f"Closed session {session_id}")
            
        except Exception as e:
            logger.error(f"Error closing session: {str(e)}")


# Global instance
claude_code_sdk_browserless = ClaudeCodeSDKBrowserless()
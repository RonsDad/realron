"""
Browser-Use Integration Service - FIXED VERSION
Following the exact pattern from browser-use documentation
"""

import os
import asyncio
import logging
from typing import Dict, Any, Optional
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

from browser_use import BrowserSession, Agent
from browser_use.llm import ChatOpenAI

class BrowserUseService:
    """Service for managing browser-use sessions with proper reuse"""
    
    def __init__(self):
        # Store the ACTUAL BrowserSession instance for reuse
        self.reused_session: Optional[BrowserSession] = None
        self.session_metadata: Dict[str, Any] = {}
        
    async def get_or_create_session(self) -> tuple[BrowserSession, str, bool]:
        """Get existing session or create new one - returns (session, live_url, is_reused)"""
        
        # Check if we have an existing session
        if self.reused_session is not None:
            logger.info("Checking if existing BrowserSession is still valid...")
            
            # Multiple checks to ensure session is truly alive
            try:
                # 1. Check if we can get the current page
                page = await self.reused_session.get_current_page()
                if not page or page.is_closed():
                    raise Exception("Page is closed")
                
                # 2. Try to execute a simple command to verify connection
                await page.evaluate("() => document.title")
                
                # 3. Check if LiveURL is still responsive (optional)
                # Could make a HEAD request to the LiveURL to verify it's still active
                
                # 4. Check session age
                created_at = self.session_metadata.get('created_at')
                if created_at:
                    age_minutes = (datetime.now() - created_at).total_seconds() / 60
                    if age_minutes > 14:  # Close to 15 min timeout
                        logger.warning(f"Session is {age_minutes:.1f} minutes old, creating new one")
                        raise Exception("Session too old")
                
                # Session is valid!
                logger.info("Existing session is valid and will be reused")
                live_url = self.session_metadata.get('live_url', '')
                return self.reused_session, live_url, True
                
            except Exception as e:
                logger.warning(f"Session expired or invalid: {str(e)}")
                logger.info("Cleaning up expired session and creating new one")
                await self.cleanup_session()
                # Fall through to create new session
        
        # Create new session following browser-use docs exactly
        logger.info("Creating new BrowserSession with keep_alive=True")
        
        # Get Browserless token
        browserless_token = os.getenv('BROWSERLESS_API_TOKEN')
        if not browserless_token:
            raise ValueError("BROWSERLESS_API_TOKEN environment variable is required")
        
        # Connect to Browserless via Playwright
        from playwright.async_api import async_playwright
        playwright = await async_playwright().start()
        browser = await playwright.chromium.connect_over_cdp(
            f"wss://production-sfo.browserless.io/chrome/stealth?token={browserless_token}&timeout=900000"
        )
        context = browser.contexts[0] if browser.contexts else await browser.new_context()
        page = context.pages[0] if context.pages else await context.new_page()
        
        # Create BrowserSession with the Playwright page and keep_alive=True
        self.reused_session = BrowserSession(
            page=page,
            keep_alive=True  # This is the KEY - session stays open
        )
        
        # Store playwright objects for cleanup
        self.playwright = playwright
        self.browser = browser
        
        # Navigate to about:blank initially
        await page.goto('about:blank')
        
        # Get CDP session from the context for LiveURL generation
        cdp = await context.new_cdp_session(page)
        
        # Generate LiveURL
        response = await cdp.send('Browserless.liveURL', {
            "timeout": 900000,  # 15 minutes
            "interactable": False
        })
        
        live_url = response["liveURL"]
        logger.info(f"LiveURL generated: {live_url}")
        
        # IMMEDIATELY send LiveURL to frontend
        from browser_live_url_manager import live_url_manager
        await live_url_manager.send_live_url_immediately(live_url, f"browser_session_{datetime.now().timestamp()}")
        
        # Store metadata
        self.session_metadata = {
            'live_url': live_url,
            'created_at': datetime.now(),
            'cdp_session': cdp
        }
        
        return self.reused_session, live_url, False
        
    async def execute_task_in_session(self, task: str, retry_on_expire: bool = True) -> Dict[str, Any]:
        """Execute a task in the current session with automatic retry on expiration"""
        try:
            session, live_url, is_reused = await self.get_or_create_session()
            
            # Create agent with the SAME session instance
            agent = Agent(
                task=task,
                llm=ChatOpenAI(model="gpt-4.1", api_key=os.getenv('OPENAI_API_KEY')),
                browser_session=session  # Pass the ACTUAL session instance
            )
            
            # Run the agent
            result = await agent.run()
            
            return {
                'success': True,
                'result': str(result),
                'live_url': live_url,
                'reused': is_reused,
                'message': 'Reused existing session' if is_reused else 'Created new session'
            }
            
        except Exception as e:
            error_str = str(e).lower()
            # Check if error is due to expired session
            if retry_on_expire and ('timeout' in error_str or 'disconnected' in error_str or 'closed' in error_str):
                logger.warning(f"Session expired during execution: {e}")
                logger.info("Retrying with new session...")
                
                # Clean up the expired session
                await self.cleanup_session()
                
                # Retry once with a fresh session
                return await self.execute_task_in_session(task, retry_on_expire=False)
            else:
                raise
        
    async def cleanup_session(self):
        """Clean up the current session"""
        if self.reused_session:
            try:
                await self.reused_session.close()
            except:
                pass
            self.reused_session = None
            self.session_metadata = {}
        
        # Clean up Playwright objects
        if hasattr(self, 'browser'):
            try:
                await self.browser.close()
            except:
                pass
        if hasattr(self, 'playwright'):
            try:
                await self.playwright.stop()
            except:
                pass
    
    async def refresh_session(self) -> Dict[str, Any]:
        """Force refresh the session - useful before it expires"""
        logger.info("Force refreshing browser session")
        await self.cleanup_session()
        session, live_url, _ = await self.get_or_create_session()
        return {
            'success': True,
            'live_url': live_url,
            'message': 'Session refreshed successfully'
        }
    
    def get_session_age_minutes(self) -> Optional[float]:
        """Get the age of the current session in minutes"""
        if self.session_metadata and 'created_at' in self.session_metadata:
            age = (datetime.now() - self.session_metadata['created_at']).total_seconds() / 60
            return round(age, 1)
        return None

# Global service instance
browser_service = BrowserUseService()
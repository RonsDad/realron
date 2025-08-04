"""
Optimized Browser-Use Integration Service based on official documentation
Implements proper session reuse patterns from browser-use docs
"""

import os
import asyncio
import logging
from typing import Dict, Any, Optional
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Browser-use library imports
try:
    from browser_use import BrowserSession, BrowserProfile
    BROWSER_USE_AVAILABLE = True
    logger.info("browser-use library loaded successfully")
except ImportError as e:
    logger.error(f"Failed to import browser-use library: {e}")
    BROWSER_USE_AVAILABLE = False


class OptimizedBrowserUseService:
    """
    Optimized service following browser-use best practices:
    - Reuses sessions with keep_alive=True
    - No unnecessary session closing
    - Simplified initialization
    """
    
    def __init__(self):
        # Single reusable session as per browser-use docs
        self._session: Optional[BrowserSession] = None
        self._session_metadata: Dict[str, Any] = {}
        
    async def get_or_create_session(self, timeout_ms: int = 900000) -> Dict[str, Any]:
        """
        Get existing session or create new one following browser-use best practices.
        Based on: "Re-use Active Browser Session Between Sequential Agents" pattern
        """
        if not BROWSER_USE_AVAILABLE:
            raise ValueError("browser-use library is not available")
            
        # Check if we have an active session
        if self._session and self._session_metadata.get('active'):
            logger.info(f"Reusing existing browser session: {self._session_metadata['session_id']}")
            return {
                'success': True,
                'session_id': self._session_metadata['session_id'],
                'live_url': self._session_metadata['live_url'],
                'reused': True
            }
        
        # Create new session following browser-use docs
        browserless_token = os.getenv('BROWSERLESS_API_TOKEN')
        if not browserless_token:
            raise ValueError("BROWSERLESS_API_TOKEN environment variable is required")
        
        session_id = f"optimized_session_{datetime.now().timestamp()}"
        
        try:
            logger.info(f"Creating new reusable browser session {session_id}")
            
            # Simple profile as per docs - avoid over-configuration
            profile = BrowserProfile(
                headless=True,  # Performance: use headless by default
                keep_alive=True,  # Critical: keep session alive for reuse
                viewport={"width": 1280, "height": 900}
            )
            
            # Create session with keep_alive=True as per docs
            self._session = BrowserSession(
                browser_profile=profile,
                keep_alive=True  # Essential for session reuse
            )
            
            # Start session manually as required by keep_alive=True
            await self._session.start()
            
            # Get page for LiveURL generation
            page = await self._session.get_current_page()
            
            # Connect to browserless for LiveURL
            from playwright.async_api import async_playwright
            playwright = await async_playwright().start()
            browser = await playwright.chromium.connect_over_cdp(
                f"wss://production-sfo.browserless.io/chrome/stealth?token={browserless_token}&timeout={timeout_ms}"
            )
            
            # Get CDP session for LiveURL
            context = browser.contexts[0]
            cdp = await context.new_cdp_session(page)
            
            # Generate LiveURL
            response = await cdp.send('Browserless.liveURL', {
                "timeout": timeout_ms,
                "interactive": False
            })
            
            live_url = response["liveURL"]
            
            # Store metadata
            self._session_metadata = {
                'session_id': session_id,
                'live_url': live_url,
                'created_at': datetime.now().isoformat(),
                'active': True,
                'playwright': playwright,
                'browser': browser,
                'cdp': cdp
            }
            
            logger.info(f"Created reusable session {session_id} with LiveURL: {live_url}")
            
            return {
                'success': True,
                'session_id': session_id,
                'live_url': live_url,
                'reused': False
            }
            
        except Exception as e:
            logger.error(f"Failed to create browser session: {str(e)}")
            self._session = None
            self._session_metadata = {}
            raise
    
    async def execute_task(self, task: str) -> Dict[str, Any]:
        """
        Execute task on existing or new session.
        Follows browser-use pattern of reusing sessions.
        """
        # Ensure we have a session
        session_info = await self.get_or_create_session()
        
        if not self._session:
            raise ValueError("No active browser session")
        
        try:
            # Use browser-use Agent with existing session
            from browser_use import Agent
            from browser_use.llm import ChatOpenAI
            
            openai_api_key = os.getenv('OPENAI_API_KEY')
            if not openai_api_key:
                raise ValueError("OPENAI_API_KEY environment variable is required")
            
            llm = ChatOpenAI(
                model="gpt-4o-mini",  # Use efficient model
                api_key=openai_api_key
            )
            
            # Create agent with reused session as per docs
            agent = Agent(
                task=task,
                llm=llm,
                browser_session=self._session  # Reuse existing session
            )
            
            logger.info(f"Executing task on {'reused' if session_info['reused'] else 'new'} session")
            
            # Run agent - session stays alive after completion
            result = await agent.run(max_steps=30)  # Reasonable limit
            
            return {
                'success': True,
                'result': str(result),
                'session_id': session_info['session_id'],
                'live_url': session_info['live_url'],
                'session_reused': session_info['reused']
            }
            
        except Exception as e:
            logger.error(f"Error executing task: {str(e)}")
            raise
    
    async def close_session(self) -> Dict[str, Any]:
        """
        Manually close session when completely done.
        Only call this when you're sure no more tasks will be run.
        """
        if not self._session:
            return {
                'success': True,
                'message': 'No active session to close'
            }
        
        try:
            # Close browser-use session
            await self._session.close()
            
            # Cleanup playwright resources
            if 'browser' in self._session_metadata:
                await self._session_metadata['browser'].close()
            if 'playwright' in self._session_metadata:
                await self._session_metadata['playwright'].stop()
            
            session_id = self._session_metadata.get('session_id', 'unknown')
            
            # Reset state
            self._session = None
            self._session_metadata = {}
            
            logger.info(f"Closed browser session {session_id}")
            
            return {
                'success': True,
                'message': f'Session {session_id} closed successfully'
            }
            
        except Exception as e:
            logger.error(f"Error closing session: {str(e)}")
            # Reset state anyway
            self._session = None
            self._session_metadata = {}
            raise


# Global optimized service instance
optimized_browser_service = OptimizedBrowserUseService()


# Convenience functions matching original API
async def create_browser_session_with_url(url: str, timeout_ms: int = 900000) -> Dict[str, Any]:
    """
    Create or reuse session and navigate to URL.
    Optimized to reuse existing sessions.
    """
    # Get or create session
    session_result = await optimized_browser_service.get_or_create_session(timeout_ms)
    
    # Navigate to URL using a simple task
    task = f"Navigate to {url}"
    result = await optimized_browser_service.execute_task(task)
    
    return {
        'success': True,
        'session_id': result['session_id'],
        'live_url': result['live_url'],
        'url': url,
        'session_reused': result['session_reused']
    }
"""
Browser-Use Integration Service for LiveURL Generation
Implements browser-use library integration with Browserless for generating LiveURLs
as specified in the provided code example.
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
    from browser_use import BrowserSession
    BROWSER_USE_AVAILABLE = True
    logger.info("browser-use library loaded successfully")
except ImportError as e:
    logger.error(f"Failed to import browser-use library: {e}")
    BROWSER_USE_AVAILABLE = False


class BrowserUseService:
    """Service for managing browser-use sessions with Browserless LiveURL integration"""
    
    def __init__(self):
        self.active_sessions: Dict[str, BrowserSession] = {}
        self.session_metadata: Dict[str, Dict[str, Any]] = {}
        
    async def create_live_url_session(self, timeout_ms: int = 900000, browser_profile=None, interactive: bool = False) -> Dict[str, Any]:  # 15 minutes
        """
        Create a browser-use session with Browserless and generate LiveURL for iframe embedding.
        Based on the provided code example.
        """
        if not BROWSER_USE_AVAILABLE:
            raise ValueError("browser-use library is not available")
            
        # Get Browserless API token from environment
        browserless_token = os.getenv('BROWSERLESS_API_TOKEN')
        if not browserless_token:
            raise ValueError("BROWSERLESS_API_TOKEN environment variable is required")
        
        # ENFORCE ONLY ONE SESSION - Close all existing sessions first
        if len(self.active_sessions) > 0:
            logger.warning(f"Closing {len(self.active_sessions)} existing sessions to maintain single session")
            await self.close_all_sessions()
        
        # Generate session ID
        session_id = f"browser_use_session_{datetime.now().timestamp()}"
        
        try:
            logger.info(f"Creating browser-use session {session_id} with Browserless")
            
            # Use provided browser profile or create default one
            from browser_use import BrowserProfile
            if browser_profile is None:
                browser_profile = BrowserProfile(
                    stealth=True,
                    headless=False,  # For human-in-the-loop workflows
                    viewport={"width": 1280, "height": 900},
                    wait_between_actions=0.1  # Reduced from 0.3 for faster actions
                )
            
            # First connect via Playwright for CDP support
            from playwright.async_api import async_playwright
            playwright = await async_playwright().start()
            browser = await playwright.chromium.connect_over_cdp(
                f"wss://production-sfo.browserless.io/chrome/stealth?token={browserless_token}&timeout={timeout_ms}"
            )
            context = browser.contexts[0] if browser.contexts else await browser.new_context()
            playwright_page = context.pages[0] if context.pages else await context.new_page()
            
            # Now create browser-use session with the Playwright page
            browser_session = BrowserSession(
                page=playwright_page,
                browser_profile=browser_profile
            )
            
            # Start the session
            await browser_session.start()
            
            # Get current page (for browser-use agent)
            page = await browser_session.get_current_page()
            
            # Create CDP session for LiveURL generation using Playwright's CDP
            try:
                # Use the Playwright page we created earlier
                cdp = await context.new_cdp_session(playwright_page)
            except Exception as e:
                logger.error(f"Failed to create CDP session: {str(e)}")
                raise ValueError(f"Failed to establish CDP connection to browserless: {str(e)}")
            
            # Generate LiveURL for agent use (non-interactive initially)
            logger.info(f"Generating non-interactive LiveURL for session {session_id}")
            try:
                response = await cdp.send('Browserless.liveURL', {
                    "timeout": timeout_ms,
                    "interactive": interactive  # Use the passed parameter (should be False)
                })
            except Exception as e:
                logger.error(f"Failed to generate LiveURL: {str(e)}")
                # Try alternative approach - direct connection without LiveURL for now
                raise ValueError(f"Failed to generate LiveURL: {str(e)}")
            
            live_url = response["liveURL"]
            live_url_id = response.get("liveURLId")
            logger.info(f"LiveURL generated: {live_url}")
            
            # Store session and metadata
            self.active_sessions[session_id] = browser_session
            session_number = len(self.active_sessions)  # 1, 2, or 3
            self.session_metadata[session_id] = {
                'session_id': session_id,
                'session_number': session_number,
                'display_name': f"Browser Session {session_number}",
                'live_url': live_url,
                'live_url_id': live_url_id,
                'timeout_ms': timeout_ms,
                'created_at': datetime.now().isoformat(),
                'status': 'active',
                'interactive': False,  # Track interactivity state
                'cdp_session': cdp,
                'playwright': playwright,  # Store for cleanup
                'browser': browser,  # Store for cleanup
                'context': context  # Store for reference
            }
            
            return {
                'success': True,
                'session_id': session_id,
                'session_number': session_number,
                'display_name': f"Browser Session {session_number}",
                'live_url': live_url,
                'timeout_ms': timeout_ms,
                'total_active_sessions': len(self.active_sessions),
                'max_sessions': 3,
                'iframe_embed': {
                    'src': live_url,
                    'width': '100%',
                    'height': '600px',
                    'style': 'border: none; border-radius: 8px;',
                    'title': f"Ron's Browser Window - Session {session_number}",
                    'frameborder': '0',
                    'allowfullscreen': True
                },
                'instructions': {
                    'usage': 'Embed the live_url in an iframe in your frontend',
                    'example_html': f'<iframe src="{live_url}" width="100%" height="600px" style="border: none; border-radius: 8px;" title="Ron\'s Browser Window - Session {session_number}"></iframe>',
                    'note': f'Users can interact with browser session {session_number} through this URL. Up to 3 concurrent sessions are supported.'
                },
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Failed to create browser-use LiveURL session: {str(e)}")
            # Cleanup on failure
            if session_id in self.active_sessions:
                try:
                    await self.active_sessions[session_id].close()
                    del self.active_sessions[session_id]
                    if session_id in self.session_metadata:
                        del self.session_metadata[session_id]
                except:
                    pass
            raise
    
    async def navigate_and_get_live_url(self, session_id: str, url: str) -> Dict[str, Any]:
        """Navigate to a URL in an existing session and return the LiveURL for iframe embedding"""
        if session_id not in self.active_sessions:
            raise ValueError(f"Session {session_id} not found")
            
        try:
            browser_session = self.active_sessions[session_id]
            metadata = self.session_metadata[session_id]
            
            # Get current page
            page = await browser_session.get_current_page()
            
            # Navigate to the URL
            logger.info(f"Navigating to {url} in session {session_id}")
            await page.goto(url, wait_until='networkidle')
            
            # Update metadata
            metadata['current_url'] = url
            metadata['last_navigation'] = datetime.now().isoformat()
            
            return {
                'success': True,
                'session_id': session_id,
                'live_url': metadata['live_url'],
                'current_url': url,
                'iframe_embed': {
                    'src': metadata['live_url'],
                    'width': '100%',
                    'height': '600px',
                    'style': 'border: none; border-radius: 8px;',
                    'title': "Ron's Browser Window",
                    'frameborder': '0',
                    'allowfullscreen': True
                },
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Failed to navigate in session {session_id}: {str(e)}")
            raise
    
    async def get_session_info(self, session_id: str) -> Dict[str, Any]:
        """Get information about a specific browser-use session"""
        if session_id not in self.session_metadata:
            raise ValueError(f"Session {session_id} not found")
            
        metadata = self.session_metadata[session_id]
        
        # Check if session is still active
        is_active = session_id in self.active_sessions
        if is_active:
            try:
                browser_session = self.active_sessions[session_id]
                page = await browser_session.get_current_page()
                current_url = page.url if page else None
            except:
                current_url = metadata.get('current_url')
                is_active = False
        else:
            current_url = metadata.get('current_url')
        
        return {
            'session_id': session_id,
            'live_url': metadata['live_url'],
            'current_url': current_url,
            'status': 'active' if is_active else 'inactive',
            'created_at': metadata['created_at'],
            'timeout_ms': metadata['timeout_ms'],
            'last_navigation': metadata.get('last_navigation'),
            'iframe_embed': {
                'src': metadata['live_url'],
                'width': '100%',
                'height': '600px',
                'style': 'border: none; border-radius: 8px;',
                'title': "Ron's Browser Window",
                'frameborder': '0',
                'allowfullscreen': True
            }
        }
    
    async def list_active_sessions(self) -> Dict[str, Any]:
        """List all active browser-use sessions"""
        sessions_info = {}
        
        for session_id in list(self.session_metadata.keys()):
            try:
                sessions_info[session_id] = await self.get_session_info(session_id)
            except Exception as e:
                logger.error(f"Error getting info for session {session_id}: {str(e)}")
                # Remove invalid session
                if session_id in self.active_sessions:
                    del self.active_sessions[session_id]
                if session_id in self.session_metadata:
                    del self.session_metadata[session_id]
        
        return {
            'total_sessions': len(sessions_info),
            'max_sessions': 3,
            'sessions': sessions_info,
            'sessions_list': list(sessions_info.values()),  # Array format for easier UI iteration
            'timestamp': datetime.now().isoformat()
        }
    
    async def close_session(self, session_id: str) -> Dict[str, Any]:
        """Close a browser-use session and cleanup resources"""
        if session_id not in self.active_sessions:
            # Check if session exists in metadata but not active sessions
            if session_id in self.session_metadata:
                del self.session_metadata[session_id]
                return {
                    'success': True,
                    'session_id': session_id,
                    'status': 'session_was_already_inactive',
                    'timestamp': datetime.now().isoformat()
                }
            else:
                raise ValueError(f"Session {session_id} not found")
        
        try:
            logger.info(f"Closing browser-use session {session_id}")
            
            # Get session objects
            browser_session = self.active_sessions[session_id]
            metadata = self.session_metadata.get(session_id, {})
            
            # Close browser-use session
            try:
                await browser_session.close()
            except Exception as e:
                logger.warning(f"Error closing browser-use session: {e}")
            
            # Close Playwright browser
            if 'browser' in metadata:
                try:
                    await metadata['browser'].close()
                except Exception as e:
                    logger.warning(f"Error closing Playwright browser: {e}")
            
            # Stop Playwright
            if 'playwright' in metadata:
                try:
                    await metadata['playwright'].stop()
                except Exception as e:
                    logger.warning(f"Error stopping Playwright: {e}")
            
            # Remove from active sessions and metadata
            del self.active_sessions[session_id]
            if session_id in self.session_metadata:
                del self.session_metadata[session_id]
            
            return {
                'success': True,
                'session_id': session_id,
                'status': 'session_closed',
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error closing session {session_id}: {str(e)}")
            # Still remove from tracking even if close failed
            if session_id in self.active_sessions:
                del self.active_sessions[session_id]
            if session_id in self.session_metadata:
                del self.session_metadata[session_id]
            raise
    
    async def close_all_sessions(self) -> Dict[str, Any]:
        """Close all active browser-use sessions"""
        closed_sessions = []
        errors = []
        
        session_ids = list(self.active_sessions.keys())
        
        for session_id in session_ids:
            try:
                await self.close_session(session_id)
                closed_sessions.append(session_id)
            except Exception as e:
                errors.append({
                    'session_id': session_id,
                    'error': str(e)
                })
        
        return {
            'success': True,
            'closed_sessions': closed_sessions,
            'errors': errors,
            'total_closed': len(closed_sessions),
            'timestamp': datetime.now().isoformat()
        }
    
    async def enable_user_control(self, session_id: str) -> Dict[str, Any]:
        """Enable user interaction with the LiveURL (take control from agent)"""
        if session_id not in self.session_metadata:
            raise ValueError(f"Session {session_id} not found")
        
        try:
            metadata = self.session_metadata[session_id]
            cdp = metadata['cdp_session']
            
            # Close current non-interactive LiveURL
            if metadata.get('live_url_id'):
                await cdp.send('Browserless.closeLiveURL', {
                    'liveURLId': metadata['live_url_id']
                })
            
            # Create new non-interactive LiveURL (DISABLED - keeping agent in control)
            response = await cdp.send('Browserless.liveURL', {
                "timeout": metadata['timeout_ms'],
                "interactive": False  # DISABLED - Agent keeps control
            })
            
            # Update metadata
            metadata['live_url'] = response["liveURL"]
            metadata['live_url_id'] = response.get("liveURLId")
            metadata['interactive'] = False  # Keep as False since LiveURL is non-interactive
            
            logger.info(f"Enabled user control for session {session_id}")
            
            return {
                'success': True,
                'session_id': session_id,
                'live_url': response["liveURL"],
                'interactive': False,  # Keep as False since LiveURL is non-interactive
                'message': 'User control enabled (watch-only mode)'
            }
            
        except Exception as e:
            logger.error(f"Error enabling user control for session {session_id}: {str(e)}")
            raise RuntimeError(f"Failed to enable user control: {str(e)}")
    
    async def relinquish_user_control(self, session_id: str) -> Dict[str, Any]:
        """Disable user interaction, return control to agent"""
        if session_id not in self.session_metadata:
            raise ValueError(f"Session {session_id} not found")
        
        try:
            metadata = self.session_metadata[session_id]
            cdp = metadata['cdp_session']
            
            # Close current interactive LiveURL
            if metadata.get('live_url_id'):
                await cdp.send('Browserless.closeLiveURL', {
                    'liveURLId': metadata['live_url_id']
                })
            
            # Create new non-interactive LiveURL
            response = await cdp.send('Browserless.liveURL', {
                "timeout": metadata['timeout_ms'],
                "interactive": False  # Agent controls browser again
            })
            
            # Update metadata
            metadata['live_url'] = response["liveURL"]
            metadata['live_url_id'] = response.get("liveURLId")
            metadata['interactive'] = False
            
            logger.info(f"Relinquished user control for session {session_id}")
            
            return {
                'success': True,
                'session_id': session_id,
                'live_url': response["liveURL"],
                'interactive': False,
                'message': 'Agent control restored'
            }
            
        except Exception as e:
            logger.error(f"Error relinquishing user control for session {session_id}: {str(e)}")
            raise RuntimeError(f"Failed to relinquish user control: {str(e)}")

    async def execute_browser_task(self, session_id: str, task: str) -> Dict[str, Any]:
        """Execute a browser automation task using the browser-use Agent in the existing session"""
        if session_id not in self.active_sessions:
            raise ValueError(f"Session {session_id} not found")
        
        try:
            from browser_use import Agent
            from browser_use.llm import ChatOpenAI
            
            browser_session = self.active_sessions[session_id]
            metadata = self.session_metadata[session_id]
            
            # Verify browser session is still active
            try:
                page = await browser_session.get_current_page()
                if not page:
                    raise ValueError("Browser session page is not available")
            except Exception as e:
                logger.error(f"Browser session {session_id} is no longer active: {str(e)}")
                raise ValueError(f"Browser session is not available: {str(e)}")
            
            # Create LLM instance with proper API key check
            openai_api_key = os.getenv('OPENAI_API_KEY')
            if not openai_api_key:
                raise ValueError("OPENAI_API_KEY environment variable is required")
                
            llm = ChatOpenAI(
                model="gpt-4.1",
                api_key=openai_api_key
            )
            
            # Create agent with the existing browser session
            agent = Agent(
                task=task,
                llm=llm,
                browser_session=browser_session
            )
            
            logger.info(f"Starting browser-use Agent for task: {task}")
            
            # Execute the task using the agent - let Browserless handle timeout based on paid plan
            result = await agent.run(max_steps=100)  # Increased max_steps for complex tasks
            
            logger.info(f"Browser-use Agent completed task: {task}")
            
            # Update metadata
            metadata['last_task'] = task
            metadata['last_task_result'] = str(result)
            metadata['last_task_timestamp'] = datetime.now().isoformat()
            
            return {
                'success': True,
                'session_id': session_id,
                'task': task,
                'status': 'task_completed',
                'result': str(result),
                'live_url': metadata['live_url'],
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error executing browser task in session {session_id}: {str(e)}")
            # Update metadata with error info
            if session_id in self.session_metadata:
                self.session_metadata[session_id]['last_error'] = str(e)
                self.session_metadata[session_id]['last_error_timestamp'] = datetime.now().isoformat()
            raise RuntimeError(f"Failed to execute browser task: {str(e)}")


# Global service instance
browser_use_service = BrowserUseService()


# Additional utility functions
async def get_live_url_for_iframe(timeout_ms: int = 900000) -> str:  # 15 minutes
    """
    Convenience function to quickly get a LiveURL for iframe embedding.
    Implements the exact pattern from the provided code example.
    """
    result = await browser_use_service.create_live_url_session(timeout_ms)
    return result['live_url']


async def create_browser_session_with_url(url: str, timeout_ms: int = 900000) -> Dict[str, Any]:  # 15 minutes
    """
    Create a browser session, navigate to URL, and return LiveURL for iframe embedding.
    Complete workflow for frontend integration.
    """
    # Create session
    session_result = await browser_use_service.create_live_url_session(timeout_ms)
    session_id = session_result['session_id']
    
    try:
        # Navigate to URL
        nav_result = await browser_use_service.navigate_and_get_live_url(session_id, url)
        
        return {
            'success': True,
            'session_id': session_id,
            'live_url': nav_result['live_url'],
            'url': url,
            'iframe_embed': nav_result['iframe_embed'],
            'instructions': session_result['instructions'],
            'timeout_ms': timeout_ms,
            'timestamp': datetime.now().isoformat()
        }
        
    except Exception as e:
        # Cleanup on failure
        try:
            await browser_use_service.close_session(session_id)
        except:
            pass
        raise
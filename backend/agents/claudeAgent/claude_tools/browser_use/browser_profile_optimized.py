"""
Optimized Browser Profile Configuration
Based on browser-use documentation best practices for performance
"""

from browser_use import BrowserProfile, BrowserSession
from typing import Dict, Any, Optional
import os


def create_optimized_browser_profile(
    headless: bool = True,
    stealth: bool = True,
    storage_state: Optional[str] = None
) -> BrowserProfile:
    """
    Create an optimized browser profile based on browser-use docs.
    
    Key optimizations from docs:
    - headless=True for production performance
    - No wait_between_actions for maximum speed
    - Reasonable viewport size
    - Storage state for session persistence
    """
    return BrowserProfile(
        # Performance: headless by default as per docs
        headless=headless,
        
        # Stealth mode for anti-detection
        stealth=stealth,
        
        # Standard viewport - not too large
        viewport={"width": 1280, "height": 800},
        
        # CRITICAL: No wait between actions for speed
        # Documentation shows this can be 0 or omitted
        wait_between_actions=0,
        
        # Session persistence via storage state
        storage_state=storage_state,
        
        # Keep alive for session reuse
        keep_alive=True,
        
        # Minimal wait for page load
        minimum_wait_page_load_time=0.25,
        
        # Network idle wait - reduced for speed
        wait_for_network_idle_page_load_time=1.0,
        
        # Don't highlight elements in production
        highlight_elements=False,
        
        # No viewport expansion needed
        viewport_expansion=0
    )


def create_development_browser_profile() -> BrowserProfile:
    """
    Development profile with visual feedback.
    Based on browser-use examples for debugging.
    """
    return BrowserProfile(
        # Visible browser for development
        headless=False,
        
        # Standard viewport
        viewport={"width": 1280, "height": 900},
        
        # Small wait for visual debugging
        wait_between_actions=0.1,
        
        # Highlight elements for debugging
        highlight_elements=True,
        
        # Keep alive for development
        keep_alive=True
    )


def create_restricted_browser_profile(allowed_domains: list[str]) -> BrowserProfile:
    """
    Security-focused profile with domain restrictions.
    Based on browser-use security best practices.
    """
    return BrowserProfile(
        # Security: headless and restricted
        headless=True,
        
        # Domain restrictions as per docs
        allowed_domains=allowed_domains,
        
        # No waits for efficiency
        wait_between_actions=0,
        
        # Standard viewport
        viewport={"width": 1280, "height": 800},
        
        # No highlighting in production
        highlight_elements=False
    )


class OptimizedBrowserSessionFactory:
    """
    Factory for creating optimized browser sessions.
    Implements patterns from browser-use documentation.
    """
    
    @staticmethod
    async def create_reusable_session(
        profile: Optional[BrowserProfile] = None,
        storage_state_path: Optional[str] = None
    ) -> BrowserSession:
        """
        Create a reusable browser session following best practices.
        Based on: "Re-use Active Browser Session Between Sequential Agents"
        """
        if profile is None:
            profile = create_optimized_browser_profile(
                storage_state=storage_state_path
            )
        
        # Create session with keep_alive=True for reuse
        session = BrowserSession(
            browser_profile=profile,
            keep_alive=True  # Essential for reuse
        )
        
        # Start manually as required by keep_alive
        await session.start()
        
        return session
    
    @staticmethod
    async def create_parallel_sessions(
        count: int,
        shared_storage_state: Optional[str] = None
    ) -> list[BrowserSession]:
        """
        Create multiple sessions for parallel execution.
        Based on: "Parallel Agents with Shared Browser Profile"
        """
        # Shared profile for consistent state
        shared_profile = create_optimized_browser_profile(
            storage_state=shared_storage_state
        )
        
        sessions = []
        for _ in range(count):
            session = BrowserSession(browser_profile=shared_profile)
            await session.start()
            sessions.append(session)
        
        return sessions


# Configuration presets based on use cases
PERFORMANCE_CONFIG = {
    "headless": True,
    "wait_between_actions": 0,
    "minimum_wait_page_load_time": 0.25,
    "highlight_elements": False,
    "viewport": {"width": 1280, "height": 800}
}

DEVELOPMENT_CONFIG = {
    "headless": False,
    "wait_between_actions": 0.1,
    "highlight_elements": True,
    "viewport": {"width": 1280, "height": 900}
}

SECURITY_CONFIG = {
    "headless": True,
    "wait_between_actions": 0,
    "highlight_elements": False,
    "allowed_domains": []  # Must be populated with specific domains
}


def get_browserless_connection_params(timeout_ms: int = 900000) -> Dict[str, Any]:
    """
    Get optimized Browserless connection parameters.
    Based on Browserless 2.0 documentation.
    """
    token = os.getenv('BROWSERLESS_API_TOKEN')
    if not token:
        raise ValueError("BROWSERLESS_API_TOKEN required")
    
    return {
        "ws_endpoint": f"wss://production-sfo.browserless.io/chrome/stealth?token={token}&timeout={timeout_ms}",
        "launch_options": {
            "headless": True,  # Always headless for Browserless
            "args": [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--disable-gpu"
            ]
        }
    }
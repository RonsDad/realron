"""
Global LiveURL Manager for immediate browser panel opening
"""
import asyncio
from typing import Optional, Dict, Any
from asyncio import Queue

class LiveURLManager:
    """Manages LiveURL state and queues for immediate UI updates"""
    
    def __init__(self):
        self.current_live_url: Optional[str] = None
        self.current_session_id: Optional[str] = None
        self.event_queue: Optional[Queue] = None
        
    def set_event_queue(self, queue: Queue):
        """Set the event queue for sending immediate updates"""
        self.event_queue = queue
        
    async def send_live_url_immediately(self, live_url: str, session_id: str):
        """Send LiveURL immediately to the frontend"""
        self.current_live_url = live_url
        self.current_session_id = session_id
        
        if self.event_queue:
            event = {
                'type': 'browser_live_url',
                'live_url': live_url,
                'session_id': session_id
            }
            await self.event_queue.put(event)
            
    def get_current(self) -> Dict[str, Any]:
        """Get the current LiveURL and session info"""
        return {
            'live_url': self.current_live_url,
            'session_id': self.current_session_id
        }

# Global instance
live_url_manager = LiveURLManager()
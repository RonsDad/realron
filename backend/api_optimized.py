"""
Optimized FastAPI Backend
Implements all performance improvements based on browser-use and browserless docs
"""

import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import asyncio
import json
import os
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s'
)
logger = logging.getLogger(__name__)

# Import optimized services
from browser_use_service_optimized import optimized_browser_service
from claude_completions_optimized import OptimizedClaudeCompletions
from browser_profile_optimized import create_optimized_browser_profile

# Initialize FastAPI app
app = FastAPI(
    title="Optimized Claude Healthcare API",
    description="High-performance API with browser automation",
    version="2.0.0"
)

# Simplified CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize optimized agents
claude_agent = OptimizedClaudeCompletions()

# Simplified request models
class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    system_prompt: Optional[str] = None
    temperature: float = Field(0.7, ge=0.0, le=1.0)
    max_tokens: int = Field(8192, gt=0)
    stream: bool = False
    tools: List[str] = Field(default_factory=lambda: ["web_search", "browser_use"])

class BrowserTaskRequest(BaseModel):
    task: str
    url: Optional[str] = None


@app.get("/")
async def root():
    """Optimized API root endpoint."""
    return {
        "service": "Optimized Claude Healthcare API",
        "version": "2.0.0",
        "optimizations": {
            "session_reuse": True,
            "simplified_prompts": True,
            "reduced_agents": True,
            "performance_mode": True
        },
        "endpoints": {
            "chat": "/chat",
            "browser_task": "/browser/task",
            "browser_session": "/browser/session",
            "health": "/health"
        }
    }


@app.post("/chat")
async def chat(request: ChatRequest):
    """
    Optimized chat endpoint with streaming support.
    Uses simplified prompts and reduced token limits.
    """
    logger.info(f"Chat request with {len(request.messages)} messages")
    
    try:
        messages = [
            {"role": msg.role, "content": msg.content}
            for msg in request.messages
        ]
        
        if request.stream:
            async def stream_generator():
                try:
                    async for event in claude_agent.stream_complete(
                        messages=messages,
                        max_tokens=request.max_tokens,
                        temperature=request.temperature,
                        tools=request.tools,
                        system_prompt=request.system_prompt
                    ):
                        yield f"data: {json.dumps(event)}\n\n"
                except Exception as e:
                    logger.error(f"Streaming error: {str(e)}")
                    yield f"data: {json.dumps({'type': 'error', 'error': str(e)})}\n\n"
            
            return StreamingResponse(
                stream_generator(),
                media_type="text/event-stream"
            )
        
        # Non-streaming response
        result = await claude_agent.complete(
            messages=messages,
            max_tokens=request.max_tokens,
            temperature=request.temperature,
            tools=request.tools,
            system_prompt=request.system_prompt
        )
        return result
        
    except Exception as e:
        logger.error(f"Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/browser/task")
async def browser_task(request: BrowserTaskRequest):
    """
    Execute browser task with session reuse.
    Optimized for performance with single session management.
    """
    try:
        # Execute task on reused session
        result = await optimized_browser_service.execute_task(request.task)
        
        return {
            "success": True,
            "result": result['result'],
            "session_id": result['session_id'],
            "live_url": result['live_url'],
            "session_reused": result['session_reused'],
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Browser task error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/browser/session")
async def get_browser_session():
    """
    Get current browser session info.
    Shows if a session is active and reusable.
    """
    try:
        if optimized_browser_service._session:
            return {
                "active": True,
                "session_id": optimized_browser_service._session_metadata.get('session_id'),
                "live_url": optimized_browser_service._session_metadata.get('live_url'),
                "created_at": optimized_browser_service._session_metadata.get('created_at')
            }
        else:
            return {
                "active": False,
                "message": "No active session. Will be created on first task."
            }
    except Exception as e:
        logger.error(f"Session info error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/browser/session")
async def close_browser_session():
    """
    Manually close browser session.
    Only use when completely done with all tasks.
    """
    try:
        result = await optimized_browser_service.close_session()
        return result
    except Exception as e:
        logger.error(f"Session close error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health_check():
    """Optimized health check endpoint."""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "optimizations": {
            "session_reuse": True,
            "headless_mode": True,
            "reduced_token_usage": True,
            "simplified_agents": True
        },
        "environment": {
            "anthropic_key": bool(os.getenv("ANTHROPIC_API_KEY")),
            "browserless_token": bool(os.getenv("BROWSERLESS_API_TOKEN")),
            "openai_key": bool(os.getenv("OPENAI_API_KEY"))
        }
    }


# Startup optimization
@app.on_event("startup")
async def startup_event():
    """Startup optimizations."""
    logger.info("Starting optimized API server")
    logger.info("Session reuse: ENABLED")
    logger.info("Performance mode: ACTIVE")
    logger.info("Agent count: REDUCED to 3")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=8000,
        log_level="info"
    )
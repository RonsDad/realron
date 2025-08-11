"""
Claude Code SDK API Integration
Provides FastAPI endpoints for healthcare tool generation
"""

import logging
from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
import asyncio
import json
from datetime import datetime

from .patient_handler import patient_request_handler
from .message_handler import message_handler as message_stream_handler
from .ide_integration import ide_integration, HEALTHCARE_EXTENSIONS

logger = logging.getLogger(__name__)

# Create API router
claude_code_api = APIRouter(
    prefix="/api/claude-code",
    tags=["claude-code-sdk"]
)


# Request/Response Models
class ToolGenerationRequest(BaseModel):
    """Request model for tool generation"""
    message: str = Field(..., description="Patient's natural language request")
    patient_id: str = Field(..., description="Patient identifier")
    patient_data: Optional[Dict[str, Any]] = Field(None, description="Optional patient context data")
    session_id: Optional[str] = Field(None, description="Session ID for tracking")
    stream: bool = Field(False, description="Enable streaming response")


class ToolGenerationResponse(BaseModel):
    """Response model for tool generation"""
    success: bool
    tool_id: Optional[str] = None
    live_url: Optional[str] = None
    share_url: Optional[str] = None
    message: str
    timestamp: str
    session_id: Optional[str] = None
    error: Optional[str] = None


class AvailableToolsResponse(BaseModel):
    """Response model for available tools"""
    tools: List[Dict[str, str]]
    count: int


class HealthCheckResponse(BaseModel):
    """Health check response"""
    status: str
    sdk_available: bool
    browserless_available: bool
    templates_loaded: int
    timestamp: str


# Endpoints
@claude_code_api.get("/health", response_model=HealthCheckResponse)
async def health_check():
    """Check health status of Claude Code SDK integration"""
    try:
        from . import CLAUDE_CODE_SDK_AVAILABLE
        from .template_library import template_library
        from .claude_code_sdk_browserless import claude_code_sdk_browserless
        
        templates_count = len(template_library.get_available_templates())
        
        return HealthCheckResponse(
            status="healthy",
            sdk_available=CLAUDE_CODE_SDK_AVAILABLE,
            browserless_available=claude_code_sdk_browserless is not None,
            templates_loaded=templates_count,
            timestamp=datetime.now().isoformat()
        )
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Health check failed")


@claude_code_api.post("/generate-tool", response_model=ToolGenerationResponse)
async def generate_tool(request: ToolGenerationRequest):
    """
    Generate a personalized healthcare tool based on patient request
    
    This endpoint:
    1. Classifies the patient's intent
    2. Extracts relevant context
    3. Generates a personalized tool using Claude Code SDK or templates
    4. Creates a LiveURL for immediate display
    """
    try:
        logger.info(f"Tool generation request from patient {request.patient_id}")
        
        # Process the request
        result = await patient_request_handler.handle_request(
            message=request.message,
            patient_id=request.patient_id,
            patient_data=request.patient_data
        )
        
        if result.get("success"):
            return ToolGenerationResponse(
                success=True,
                tool_id=result.get("tool_id"),
                live_url=result.get("live_url"),
                share_url=result.get("share_url"),
                message=result.get("message", "Your tool is ready!"),
                timestamp=datetime.now().isoformat(),
                session_id=result.get("session_id")
            )
        else:
            # Handle fallback case
            return ToolGenerationResponse(
                success=True,  # Still successful from user perspective
                live_url=result.get("tool_url"),
                message=result.get("message", "I've created your tool using an alternative method."),
                timestamp=datetime.now().isoformat(),
                error=result.get("error")
            )
            
    except Exception as e:
        logger.error(f"Tool generation failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="I encountered an issue creating your tool. Please try again."
        )


@claude_code_api.post("/generate-tool-stream")
async def generate_tool_stream(request: ToolGenerationRequest):
    """
    Stream tool generation progress for real-time updates
    
    Returns Server-Sent Events (SSE) stream with progress updates
    """
    async def event_generator():
        try:
            # Send initial event
            yield f"data: {json.dumps({'event': 'start', 'message': 'Starting tool generation...'})}\n\n"
            
            # Create LiveURL callback
            async def live_url_callback():
                from .claude_code_sdk_browserless import claude_code_sdk_browserless
                result = await claude_code_sdk_browserless.create_browser_ccsdk(
                    tool_html="<html><body>Loading...</body></html>",
                    tool_name="Healthcare Tool"
                )
                return result
            
            # Create message handler with LiveURL callback
            handler = message_stream_handler
            handler.live_url_callback = live_url_callback
            
            # Stream generation events
            async for event in handler.stream_tool_generation(
                prompt=f"Generate healthcare tool for: {request.message}",
                on_progress=None
            ):
                yield f"data: {json.dumps(event)}\n\n"
                await asyncio.sleep(0.1)  # Small delay for smooth streaming
            
            # Send complete event
            yield f"data: {json.dumps({'event': 'complete', 'message': 'Tool generation complete!'})}\n\n"
            
        except Exception as e:
            logger.error(f"Stream generation error: {str(e)}")
            yield f"data: {json.dumps({'event': 'error', 'message': str(e)})}\n\n"
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )


@claude_code_api.get("/available-tools", response_model=AvailableToolsResponse)
async def get_available_tools():
    """Get list of available healthcare tool templates"""
    try:
        tools = patient_request_handler.get_available_tools()
        return AvailableToolsResponse(
            tools=tools,
            count=len(tools)
        )
    except Exception as e:
        logger.error(f"Failed to get available tools: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve available tools")


@claude_code_api.post("/preview-tool")
async def preview_tool(tool_type: str, context: Optional[Dict[str, Any]] = None):
    """
    Preview a tool template with sample data
    
    Useful for demonstrating tool capabilities without patient data
    """
    try:
        from .template_library import template_library
        from .claude_code_sdk_browserless import claude_code_sdk_browserless
        
        # Generate preview with sample context
        preview_context = context or {
            "patient_name": "Sample Patient",
            "medications": ["Medication A", "Medication B"],
            "conditions": ["Condition X"],
            "tool_type": tool_type
        }
        
        # Generate HTML from template
        html = template_library.generate_tool(tool_type, preview_context)
        
        # Create LiveURL
        result = await claude_code_sdk_browserless.create_browser_ccsdk(
            tool_html=html,
            tool_name=f"{tool_type} Preview"
        )
        
        if result.get("success"):
            return JSONResponse({
                "success": True,
                "live_url": result["live_url"],
                "message": f"Preview of {tool_type} tool",
                "session_id": result.get("session_id")
            })
        else:
            raise Exception("Failed to create preview")
            
    except Exception as e:
        logger.error(f"Preview generation failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate preview")


class FeedbackRequest(BaseModel):
    """Feedback request model"""
    tool_id: str
    rating: int = Field(..., ge=1, le=5)
    feedback: Optional[str] = None


@claude_code_api.post("/feedback")
async def submit_feedback(request: FeedbackRequest):
    """Submit feedback for a generated tool"""
    try:
        # In production, store this in a database
        logger.info(f"Feedback received for tool {request.tool_id}: Rating {request.rating}/5")
        if request.feedback:
            logger.info(f"User feedback: {request.feedback}")
        
        return JSONResponse({
            "success": True,
            "message": "Thank you for your feedback!"
        })
    except Exception as e:
        logger.error(f"Feedback submission failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to submit feedback")


# WebSocket endpoint for real-time updates (if needed)
from fastapi import WebSocket, WebSocketDisconnect

@claude_code_api.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    """WebSocket endpoint for real-time tool generation updates"""
    await websocket.accept()
    
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            request_data = json.loads(data)
            
            # Process tool generation with streaming
            if request_data.get("action") == "generate":
                # Create callback for WebSocket updates
                async def ws_callback(update):
                    await websocket.send_json(update)
                
                # Set up handler with callback
                handler = message_stream_handler
                handler.live_url_callback = ws_callback
                
                # Stream generation
                async for event in handler.stream_tool_generation(
                    prompt=request_data.get("message", ""),
                    on_progress=ws_callback
                ):
                    await websocket.send_json(event)
                    
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for session {session_id}")
    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}")
        await websocket.close()


# Export the router
__all__ = ["claude_code_api"]
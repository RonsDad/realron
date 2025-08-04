#!/usr/bin/env python3
"""
Ron AI Integration for Claude Computer Use
Integrates Claude Computer Use with the existing Ron AI healthcare copilot backend
"""

import asyncio
import json
import os
from typing import Dict, List, Any, Optional
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

from browser_ccsdk_integration import BrowserCCSDKAgent

# Pydantic models for API
class ComputerUseRequest(BaseModel):
    message: str
    enable_browser: bool = True
    max_iterations: int = 10

class ComputerUseResponse(BaseModel):
    success: bool
    message: str
    computer_results: List[Dict[str, Any]]
    browser_results: List[Dict[str, Any]]
    iframe_content: List[str]
    needs_browser: bool
    error: Optional[str] = None

class IframeContentResponse(BaseModel):
    content: List[str]
    count: int

# FastAPI app
app = FastAPI(title="Claude Computer Use API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global agent instance
computer_agent: Optional[BrowserCCSDKAgent] = None

def get_agent() -> BrowserCCSDKAgent:
    """Get or create the computer use agent"""
    global computer_agent
    
    if computer_agent is None:
        api_key = os.getenv("ANTHROPIC_API_KEY")
        browserless_token = os.getenv("BROWSERLESS_API_TOKEN")
        
        if not api_key or api_key == "your_api_key_here":
            raise HTTPException(status_code=500, detail="ANTHROPIC_API_KEY not configured")
        
        computer_agent = BrowserCCSDKAgent(api_key, browserless_token)
    
    return computer_agent

@app.post("/api/computer-use", response_model=ComputerUseResponse)
async def computer_use_endpoint(request: ComputerUseRequest):
    """Main computer use endpoint with browser integration"""
    try:
        agent = get_agent()
        
        if request.enable_browser:
            result = await agent.computer_use_with_browser_integration(request.message)
        else:
            # Regular computer use without browser integration
            messages = [{"role": "user", "content": request.message}]
            computer_results = await agent.sampling_loop(messages, max_iterations=request.max_iterations)
            
            result = {
                "computer_use_results": computer_results,
                "browser_results": [],
                "iframe_content": [],
                "needs_browser": False
            }
        
        return ComputerUseResponse(
            success=True,
            message="Computer use completed successfully",
            computer_results=result["computer_use_results"],
            browser_results=result["browser_results"],
            iframe_content=result["iframe_content"],
            needs_browser=result["needs_browser"]
        )
    
    except Exception as e:
        return ComputerUseResponse(
            success=False,
            message="Computer use failed",
            computer_results=[],
            browser_results=[],
            iframe_content=[],
            needs_browser=False,
            error=str(e)
        )

@app.post("/api/browser-action")
async def browser_action_endpoint(action: str, **kwargs):
    """Direct browser action endpoint"""
    try:
        agent = get_agent()
        result = await agent.create_browser_ccsdk_tool(action, **kwargs)
        
        # Generate iframe content
        iframe_content = await agent.present_in_iframe(result)
        
        return {
            "success": True,
            "result": result,
            "iframe_content": iframe_content
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/iframe-content", response_model=IframeContentResponse)
async def get_iframe_content():
    """Get current iframe content"""
    try:
        agent = get_agent()
        content = agent.get_iframe_content_for_frontend()
        
        return IframeContentResponse(
            content=content,
            count=len(content)
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/iframe-content")
async def clear_iframe_content():
    """Clear iframe content"""
    try:
        agent = get_agent()
        agent.clear_iframe_content()
        
        return {"success": True, "message": "Iframe content cleared"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/screenshot")
async def take_screenshot():
    """Take a screenshot using computer use"""
    try:
        agent = get_agent()
        result = agent.execute_computer_action("screenshot")
        
        # Present screenshot in iframe
        screenshot_content = {
            "type": "computer_screenshot",
            "screenshot": result.get("source", {}).get("data", "") if "source" in result else ""
        }
        iframe_content = await agent.present_in_iframe(screenshot_content)
        
        return {
            "success": True,
            "screenshot": result,
            "iframe_content": iframe_content
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.websocket("/ws/computer-use")
async def websocket_computer_use(websocket: WebSocket):
    """WebSocket endpoint for real-time computer use"""
    await websocket.accept()
    
    try:
        agent = get_agent()
        
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            request_data = json.loads(data)
            
            message = request_data.get("message", "")
            enable_browser = request_data.get("enable_browser", True)
            
            # Send status update
            await websocket.send_text(json.dumps({
                "type": "status",
                "message": "Processing computer use request..."
            }))
            
            try:
                if enable_browser:
                    result = await agent.computer_use_with_browser_integration(message)
                else:
                    messages = [{"role": "user", "content": message}]
                    computer_results = await agent.sampling_loop(messages)
                    
                    result = {
                        "computer_use_results": computer_results,
                        "browser_results": [],
                        "iframe_content": [],
                        "needs_browser": False
                    }
                
                # Send results
                await websocket.send_text(json.dumps({
                    "type": "result",
                    "success": True,
                    "data": result
                }))
                
                # Send iframe content separately for real-time updates
                for iframe in result["iframe_content"]:
                    await websocket.send_text(json.dumps({
                        "type": "iframe",
                        "content": iframe
                    }))
            
            except Exception as e:
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "message": str(e)
                }))
    
    except WebSocketDisconnect:
        print("WebSocket disconnected")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        agent = get_agent()
        return {
            "status": "healthy",
            "computer_use": "available",
            "browser_integration": "available" if agent.browserless_token else "limited"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }

# Integration with existing Ron AI backend
@app.post("/api/healthcare/computer-use")
async def healthcare_computer_use(request: ComputerUseRequest):
    """Healthcare-specific computer use endpoint"""
    try:
        agent = get_agent()
        
        # Add healthcare context to the request
        healthcare_context = f"""
        You are assisting with healthcare-related tasks. The user's request is: {request.message}
        
        Please be especially careful with:
        - Medical information accuracy
        - Privacy and confidentiality
        - Providing disclaimers for medical advice
        - Focusing on healthcare advocacy and support
        """
        
        if request.enable_browser:
            result = await agent.computer_use_with_browser_integration(healthcare_context)
        else:
            messages = [{"role": "user", "content": healthcare_context}]
            computer_results = await agent.sampling_loop(messages, max_iterations=request.max_iterations)
            
            result = {
                "computer_use_results": computer_results,
                "browser_results": [],
                "iframe_content": [],
                "needs_browser": False
            }
        
        return ComputerUseResponse(
            success=True,
            message="Healthcare computer use completed successfully",
            computer_results=result["computer_use_results"],
            browser_results=result["browser_results"],
            iframe_content=result["iframe_content"],
            needs_browser=result["needs_browser"]
        )
    
    except Exception as e:
        return ComputerUseResponse(
            success=False,
            message="Healthcare computer use failed",
            computer_results=[],
            browser_results=[],
            iframe_content=[],
            needs_browser=False,
            error=str(e)
        )

if __name__ == "__main__":
    # Load environment variables
    from dotenv import load_dotenv
    load_dotenv()
    
    # Start the server
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8001,  # Different port from main Ron AI backend
        log_level="info"
    )

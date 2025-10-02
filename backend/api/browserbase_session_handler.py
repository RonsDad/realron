"""
Browserbase Session Handler for Ron AI Backend
Integrates Browserbase MCP tools with Ron AI's session management system
"""

import asyncio
import json
import logging
from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

logger = logging.getLogger(__name__)

class BrowserbaseSessionRequest(BaseModel):
    url: Optional[str] = "about:blank"
    timeout_ms: Optional[int] = 600000  # 10 minutes
    browserWidth: Optional[int] = 1280
    browserHeight: Optional[int] = 720

class BrowserbaseSessionResponse(BaseModel):
    success: bool
    session_id: Optional[str] = None
    live_url: Optional[str] = None
    iframe_embed: Optional[Dict[str, Any]] = None
    instructions: Optional[Dict[str, str]] = None
    timestamp: Optional[str] = None
    timeout_ms: Optional[int] = None
    error: Optional[str] = None

router = APIRouter(prefix="/api/browserbase", tags=["browserbase"])

async def call_browserbase_mcp_tool(tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
    """
    Call a Browserbase MCP tool through the Claude completion system
    This is a workaround since MCP tools are only accessible through Claude API calls
    """
    try:
        # Import here to avoid circular imports
        from backend.agents.claudeAgent.claude_completions import ClaudeCompletions

        claude = ClaudeCompletions()

        # Create a system message to call the MCP tool
        messages = [
            {
                "role": "user",
                "content": f"""
Please call the Browserbase MCP tool `{tool_name}` with these arguments:
{json.dumps(arguments, indent=2)}

Respond only with the JSON result from the tool call. Do not add any explanations or formatting.
"""
            }
        ]

        # Call Claude with MCP tools enabled
        response = await claude.complete(
            messages=messages,
            max_tokens=4000,
            disable_mcp=False,
            system_prompt="You are a tool executor. Call the requested MCP tool and return only the JSON result."
        )

        # Extract the result from Claude's response
        if hasattr(response, 'content') and response.content:
            content = response.content[0]
            if hasattr(content, 'text'):
                # Try to parse the JSON response
                try:
                    result = json.loads(content.text.strip())
                    return result
                except json.JSONDecodeError:
                    # If not valid JSON, return the text as-is
                    return {"result": content.text.strip()}

        return {"error": "No response from MCP tool"}

    except Exception as e:
        logger.error(f"Error calling Browserbase MCP tool {tool_name}: {e}")
        return {"error": str(e)}

@router.post("/session/create", response_model=BrowserbaseSessionResponse)
async def create_browserbase_session(request: BrowserbaseSessionRequest):
    """
    Create a new Browserbase session using MCP tools
    """
    try:
        logger.info(f"Creating Browserbase session for URL: {request.url}")

        # Call the Browserbase MCP tool to create a session
        session_args = {
            "url": request.url,
            "timeout": request.timeout_ms,
            "browserWidth": request.browserWidth,
            "browserHeight": request.browserHeight
        }

        # Try multi-session creation first
        result = await call_browserbase_mcp_tool(
            "multi_browserbase_stagehand_session_create",
            session_args
        )

        if "error" in result:
            # Fallback to debug session creation
            logger.info("Multi-session creation failed, trying debug session")
            result = await call_browserbase_mcp_tool(
                "browserbase_stagehand_debug_session",
                {"url": request.url}
            )

        # Parse the result to extract session information
        session_id = None
        live_url = None

        if isinstance(result, dict):
            # Look for session ID in various possible fields
            session_id = (result.get("session_id") or
                         result.get("sessionId") or
                         result.get("id"))

            # Look for live URL in various possible fields
            live_url = (result.get("live_url") or
                       result.get("liveUrl") or
                       result.get("debugUrl") or
                       result.get("url"))

            # Sometimes the live URL is nested in a result object
            if not live_url and "result" in result:
                nested = result["result"]
                if isinstance(nested, dict):
                    live_url = (nested.get("live_url") or
                               nested.get("liveUrl") or
                               nested.get("debugUrl") or
                               nested.get("url"))

        if not session_id:
            session_id = f"browserbase_{asyncio.get_event_loop().time()}"

        if not live_url:
            logger.error(f"No live URL found in result: {result}")
            raise HTTPException(
                status_code=500,
                detail="Failed to get live URL from Browserbase session"
            )

        # Create the response
        response = BrowserbaseSessionResponse(
            success=True,
            session_id=session_id,
            live_url=live_url,
            timeout_ms=request.timeout_ms,
            iframe_embed={
                "src": live_url,
                "width": "100%",
                "height": "600px",
                "style": "border: none; border-radius: 8px;",
                "title": "Browserbase Live Session",
                "frameborder": "0",
                "allowfullscreen": True
            },
            instructions={
                "usage": "This is a live browser session running on Browserbase. You can interact with it directly through Stagehand AI.",
                "example_html": f'<iframe src="{live_url}" width="100%" height="600px"></iframe>',
                "note": "Session will automatically timeout after the specified duration. Use MCP tools to control the browser."
            },
            timestamp=asyncio.get_event_loop().time()
        )

        logger.info(f"Browserbase session created: {session_id} - {live_url}")
        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating Browserbase session: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create Browserbase session: {str(e)}"
        )

@router.post("/session/{session_id}/navigate")
async def navigate_browserbase_session(session_id: str, request: Dict[str, str]):
    """
    Navigate a Browserbase session to a new URL
    """
    try:
        url = request.get("url")
        if not url:
            raise HTTPException(status_code=400, detail="URL is required")

        result = await call_browserbase_mcp_tool(
            "multi_browserbase_stagehand_navigate_session",
            {
                "sessionId": session_id,
                "url": url
            }
        )

        return {"success": True, "result": result}

    except Exception as e:
        logger.error(f"Error navigating Browserbase session: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to navigate session: {str(e)}"
        )

@router.post("/session/{session_id}/task")
async def execute_browserbase_task(session_id: str, request: Dict[str, str]):
    """
    Execute a task in a Browserbase session using Stagehand AI
    """
    try:
        task = request.get("task")
        if not task:
            raise HTTPException(status_code=400, detail="Task is required")

        result = await call_browserbase_mcp_tool(
            "multi_browserbase_stagehand_act_session",
            {
                "sessionId": session_id,
                "action": task
            }
        )

        return {"success": True, "result": result}

    except Exception as e:
        logger.error(f"Error executing Browserbase task: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to execute task: {str(e)}"
        )

@router.delete("/session/{session_id}")
async def close_browserbase_session(session_id: str):
    """
    Close a Browserbase session
    """
    try:
        result = await call_browserbase_mcp_tool(
            "multi_browserbase_stagehand_session_close",
            {"sessionId": session_id}
        )

        return {"success": True, "result": result}

    except Exception as e:
        logger.error(f"Error closing Browserbase session: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to close session: {str(e)}"
        )
import os
import json
import logging
from typing import Optional

import httpx
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import StreamingResponse, JSONResponse

logger = logging.getLogger(__name__)

router = APIRouter()


def _get_upstream_base_url(adapter_name: str) -> str:
    """
    Resolve upstream MCP base URL for a given adapter name.
    Currently supports 'telnyx' via TELNYX_MCP_URL.
    """
    if adapter_name.lower() != "telnyx":
        raise HTTPException(status_code=404, detail="Unknown adapter")
    base = os.getenv("TELNYX_MCP_URL", "").strip()
    if not base:
        raise HTTPException(status_code=503, detail="TELNYX_MCP_URL is not configured")
    return base.rstrip("/")


def _get_upstream_token(adapter_name: str) -> Optional[str]:
    if adapter_name.lower() != "telnyx":
        return None
    token = os.getenv("TELNYX_MCP_TOKEN", "").strip() or os.getenv("TELNYX_API_KEY", "").strip()
    return token or None


def _resolve_session_id(request: Request) -> str:
    sid = request.headers.get("Mcp-Session-Id")
    if sid:
        return sid
    return f"gateway-{os.getpid()}"


@router.get("/adapters/{adapter_name}/health")
async def adapter_health(adapter_name: str):
    """Basic health endpoint that confirms upstream URL presence."""
    try:
        base = _get_upstream_base_url(adapter_name)
        return {"status": "ok", "upstream": base}
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Adapter health error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/adapters/{adapter_name}/ready")
async def adapter_ready(adapter_name: str):
    """Readiness check by probing upstream /health or /ready if present."""
    base = _get_upstream_base_url(adapter_name)
    token = _get_upstream_token(adapter_name)
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            for path in ("/health", "/ready"):
                try:
                    r = await client.get(base + path, headers=headers)
                    if r.status_code == 200:
                        return {"status": "ready", "upstream": base, "probe": path}
                except Exception:
                    continue
        # If probes failed, still return degraded but not erroring
        return JSONResponse(status_code=200, content={"status": "degraded", "upstream": base})
    except Exception as e:
        logger.error(f"Adapter ready error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/adapters/{adapter_name}/mcp")
async def proxy_mcp(adapter_name: str, request: Request):
    """
    Streamable HTTP gateway. Transparently forwards body to upstream /mcp and streams response back.
    """
    base = _get_upstream_base_url(adapter_name)
    upstream = base + "/mcp"
    token = _get_upstream_token(adapter_name)

    # Prepare headers for upstream
    headers = dict(request.headers)
    # Overwrite Authorization if a gateway token is configured
    if token:
        headers["Authorization"] = f"Bearer {token}"
    # Ensure session affinity header is present
    headers["mcp-session-id"] = _resolve_session_id(request)

    # Read body bytes and forward
    try:
        body = await request.body()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid request body: {e}")

    try:
        client: httpx.AsyncClient = request.app.state.http if hasattr(request.app.state, "http") else httpx.AsyncClient(timeout=httpx.Timeout(connect=5, read=120, write=30))
        upstream_req = client.build_request(
            method="POST",
            url=upstream,
            headers=headers,
            content=body,
        )
        upstream_resp = await client.send(upstream_req, stream=True)

        async def stream_generator():
            try:
                async for chunk in upstream_resp.aiter_bytes():
                    if chunk:
                        yield chunk
            finally:
                await upstream_resp.aclose()
                if not hasattr(request.app.state, "http"):
                    await client.aclose()

        content_type = upstream_resp.headers.get("content-type", "application/octet-stream")
        return StreamingResponse(stream_generator(), media_type=content_type)
    except httpx.HTTPStatusError as e:
        if not hasattr(request.app.state, "http"):
            await client.aclose()
        raise HTTPException(status_code=e.response.status_code, detail=e.response.text)
    except Exception as e:
        logger.error(f"MCP proxy error: {e}")
        raise HTTPException(status_code=502, detail=str(e))


@router.get("/adapters/{adapter_name}/sse")
async def proxy_sse(adapter_name: str, request: Request):
    """
    SSE fallback gateway. Proxies upstream server-sent events to the client.
    """
    base = _get_upstream_base_url(adapter_name)
    upstream = base + "/sse"
    token = _get_upstream_token(adapter_name)

    headers = {
        "Accept": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
    }
    if token:
        headers["Authorization"] = f"Bearer {token}"
    headers["Mcp-Session-Id"] = _resolve_session_id(request)

    try:
        client: httpx.AsyncClient = request.app.state.http if hasattr(request.app.state, "http") else httpx.AsyncClient(timeout=httpx.Timeout(connect=5, read=None, write=30))
        upstream_req = client.build_request("GET", upstream, headers=headers)
        upstream_resp = await client.send(upstream_req, stream=True)

        async def sse_stream():
            try:
                async for line in upstream_resp.aiter_lines():
                    if line:
                        yield f"{line}\n"
                    else:
                        yield "\n"
            finally:
                await upstream_resp.aclose()
                if not hasattr(request.app.state, "http"):
                    await client.aclose()

        return StreamingResponse(sse_stream(), media_type="text/event-stream")
    except httpx.HTTPStatusError as e:
        if not hasattr(request.app.state, "http"):
            await client.aclose()
        raise HTTPException(status_code=e.response.status_code, detail=e.response.text)
    except Exception as e:
        logger.error(f"SSE proxy error: {e}")
        raise HTTPException(status_code=502, detail=str(e))



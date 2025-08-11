import logging
from fastapi import APIRouter, Request, HTTPException
from typing import Dict, Any

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/telnyx/webhook", status_code=204)
async def handle_telnyx_webhook(request: Request):
    """
    Handles incoming webhooks from Telnyx.
    For now, it just logs the event.
    """
    try:
        payload = await request.json()
        event_type = payload.get("event_type")
        logger.info(f"Received Telnyx webhook. Event type: {event_type}")
        logger.debug(f"Webhook payload: {payload}")

        # In a real application, you would add logic here to handle
        # different event types, such as:
        # - call.initiated
        # - call.answered
        # - call.hangup
        # - message.received

    except Exception as e:
        logger.error(f"Error handling Telnyx webhook: {e}")
        # Don't raise HTTPException to prevent Telnyx from retrying.
        # We've logged the error, which is sufficient for now.

    return

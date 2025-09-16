"""
Clinical Operations Agent Integration with Streaming Support
Uses OpenAI GPT-5-mini for healthcare-specific queries with streaming responses
"""

import os
import logging
from typing import Dict, Any, Optional, AsyncGenerator
import openai
from openai import AsyncOpenAI
from dotenv import load_dotenv
import json

# Load the .env file FIRST
load_dotenv("/Users/timhunter/ron-ai/.env")

logger = logging.getLogger(__name__)

# Get the API key
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    logger.error("OPENAI_API_KEY NOT FOUND - CLINICAL OPS WILL FAIL!")
    OPENAI_API_KEY = None
    client = None
else:
    # Initialize the async client with the API key
    client = AsyncOpenAI(api_key=OPENAI_API_KEY)
    logger.info(
        f"Clinical Ops Streaming initialized with OpenAI API key: {OPENAI_API_KEY[:10]}... using gpt-5-mini"
    )


async def clinical_operations_query_stream(
    query: str, patient_context: Optional[str] = None
) -> AsyncGenerator[Dict[str, Any], None]:
    """
    Query the Clinical Operations AI model with streaming responses.

    Args:
        query: The clinical question or query
        patient_context: Optional patient-specific context

    Yields:
        Dict containing streaming chunks of the clinical response
    """
    if not client:
        yield {
            "success": False,
            "error": "OpenAI API key not configured",
            "message": "Clinical Operations agent requires OpenAI API key",
        }
        return

    try:
        logger.info(
            f"Clinical Ops Streaming using gpt-5-mini with API key: {OPENAI_API_KEY[:10]}..."
        )

        # Prepare the system prompt
        system_prompt = """You are a Clinical Operations AI assistant specializing in evidence-based medicine.
        Provide accurate, clinically relevant information based on current medical guidelines and best practices.
        Always cite relevant medical literature or guidelines when possible.
        If patient context is provided, tailor your response appropriately."""

        # Prepare messages
        messages = [{"role": "system", "content": system_prompt}]

        if patient_context:
            messages.append(
                {"role": "user", "content": f"Patient Context: {patient_context}"}
            )

        messages.append({"role": "user", "content": query})

        # Make the streaming API call with correct parameters
        stream = await client.chat.completions.create(
            model="gpt-5-mini",
            messages=messages,
            # GPT-5 models only support default temperature of 1.0
            # temperature=0.3,  # Commented out - not supported by GPT-5
            max_completion_tokens=32000,  # GPT-5-mini supports up to 128K output tokens
            stream=True,  # Enable streaming
            stream_options={"include_usage": True},  # Include token usage in stream
        )

        # Process the stream
        full_response = ""
        async for chunk in stream:
            # Handle content chunks
            if chunk.choices and len(chunk.choices) > 0:
                delta = chunk.choices[0].delta
                if delta and delta.content:
                    full_response += delta.content
                    yield {
                        "success": True,
                        "type": "content",
                        "content": delta.content,
                        "model": "gpt-5-mini",
                    }

            # Handle usage data (comes at the end)
            if chunk.usage:
                yield {
                    "success": True,
                    "type": "usage",
                    "usage": {
                        "prompt_tokens": chunk.usage.prompt_tokens,
                        "completion_tokens": chunk.usage.completion_tokens,
                        "total_tokens": chunk.usage.total_tokens,
                    },
                }

        # Send final complete response
        yield {
            "success": True,
            "type": "complete",
            "full_response": full_response,
            "model": "gpt-5-mini",
        }

    except Exception as e:
        logger.error(f"Clinical Operations streaming query failed: {str(e)}")
        yield {
            "success": False,
            "error": str(e),
            "api_key_provided": (
                OPENAI_API_KEY[:10] + "..." if OPENAI_API_KEY else "NO KEY"
            ),
            "message": "Failed to query Clinical Operations AI",
        }


async def clinical_operations_query(
    query: str, patient_context: Optional[str] = None, stream: bool = False
) -> Any:
    """
    Query the Clinical Operations AI model with optional streaming.

    Args:
        query: The clinical question or query
        patient_context: Optional patient-specific context
        stream: Whether to return streaming response

    Returns:
        If stream=False: Dict containing the complete clinical response
        If stream=True: AsyncGenerator yielding streaming chunks
    """
    if stream:
        # Return the async generator for streaming
        return clinical_operations_query_stream(query, patient_context)

    # Non-streaming response (backward compatibility)
    if not client:
        return {
            "success": False,
            "error": "OpenAI API key not configured",
            "message": "Clinical Operations agent requires OpenAI API key",
        }

    try:
        logger.info(
            f"Clinical Ops using gpt-5-mini with API key: {OPENAI_API_KEY[:10]}..."
        )

        # Prepare the system prompt
        system_prompt = """You are a Clinical Operations AI assistant specializing in evidence-based medicine.
        Provide accurate, clinically relevant information based on current medical guidelines and best practices.
        Always cite relevant medical literature or guidelines when possible.
        If patient context is provided, tailor your response appropriately."""

        # Prepare messages
        messages = [{"role": "system", "content": system_prompt}]

        if patient_context:
            messages.append(
                {"role": "user", "content": f"Patient Context: {patient_context}"}
            )

        messages.append({"role": "user", "content": query})

        # Make the API call with correct parameter for newer models
        response = await client.chat.completions.create(
            model="gpt-5-mini",
            messages=messages,
            # GPT-5 models only support default temperature of 1.0
            # temperature=0.3,  # Commented out - not supported by GPT-5
            max_completion_tokens=32000,  # GPT-5-mini supports up to 128K output tokens
            stream=False,  # Set explicitly for non-streaming mode
        )

        return {
            "success": True,
            "response": response.choices[0].message.content,
            "model": "gpt-5-mini",
            "usage": {
                "prompt_tokens": response.usage.prompt_tokens,
                "completion_tokens": response.usage.completion_tokens,
                "total_tokens": response.usage.total_tokens,
            },
        }

    except Exception as e:
        logger.error(f"Clinical Operations query failed: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "api_key_provided": (
                OPENAI_API_KEY[:10] + "..." if OPENAI_API_KEY else "NO KEY"
            ),
            "message": "Failed to query Clinical Operations AI",
        }


class HealthcareAgentIntegrationStreaming:
    """Healthcare Agent Integration for Clinical Operations with Streaming Support"""

    def __init__(self):
        self.api_key = OPENAI_API_KEY
        self.client = client
        logger.info(
            f"HealthcareAgentIntegrationStreaming initialized with API key: {self.api_key[:10] if self.api_key else 'NO KEY'}..."
        )

    async def query(
        self, query: str, context: Optional[str] = None, stream: bool = False
    ) -> Any:
        """Query the healthcare agent with optional streaming"""
        return await clinical_operations_query(query, context, stream)

    async def query_stream(
        self, query: str, context: Optional[str] = None
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """Query the healthcare agent with streaming response"""
        async for chunk in clinical_operations_query_stream(query, context):
            yield chunk

    def get_status(self) -> Dict[str, Any]:
        """Get the status of the healthcare agent"""
        return {
            "api_key_status": "configured" if self.api_key else "missing",
            "client_status": "ready" if self.client else "not initialized",
            "model": "gpt-5-mini",
            "streaming_enabled": True,
        }

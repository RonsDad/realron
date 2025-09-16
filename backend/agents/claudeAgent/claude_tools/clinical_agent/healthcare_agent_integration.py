"""
Clinical Operations Agent Integration
Uses OpenAI GPT-4 for healthcare-specific queries
"""

import os
import logging
from typing import Dict, Any, Optional
import openai
from openai import AsyncOpenAI
from dotenv import load_dotenv

# Load the fucking .env file FIRST
load_dotenv("/Users/timhunter/ron-ai/.env")

logger = logging.getLogger(__name__)

# CRITICAL: GET THE FUCKING API KEY
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    logger.error("OPENAI_API_KEY NOT FOUND - CLINICAL OPS WILL FAIL!")
    # Don't raise here, just log the error
    OPENAI_API_KEY = None
    client = None
else:
    # Initialize the client with the API key
    client = AsyncOpenAI(api_key=OPENAI_API_KEY)
    logger.info(
        f"Clinical Ops initialized with OpenAI API key: {OPENAI_API_KEY[:10]}... using gpt-5-mini"
    )


async def clinical_operations_query(
    query: str, patient_context: Optional[str] = None
) -> Dict[str, Any]:
    """
    Query the Clinical Operations AI model for evidence-based clinical answers.

    Args:
        query: The clinical question or query
        patient_context: Optional patient-specific context

    Returns:
        Dict containing the clinical response and metadata
    """
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

        # Log the raw response for debugging
        logger.info(f"Raw OpenAI response: {response}")
        logger.info(f"Response choices: {response.choices}")

        # Get the response content - check if it exists
        response_content = ""
        if response.choices and len(response.choices) > 0:
            response_content = response.choices[0].message.content or ""

        if not response_content:
            logger.warning("OpenAI returned empty response content")

        return {
            "success": True,
            "response": response_content,
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


class HealthcareAgentIntegration:
    """Healthcare Agent Integration for Clinical Operations"""

    def __init__(self):
        self.api_key = OPENAI_API_KEY
        self.client = client
        logger.info(
            f"HealthcareAgentIntegration initialized with API key: {self.api_key[:10] if self.api_key else 'NO KEY'}..."
        )

    async def query(self, query: str, context: Optional[str] = None) -> Dict[str, Any]:
        """Query the healthcare agent"""
        return await clinical_operations_query(query, context)

    def get_status(self) -> Dict[str, Any]:
        """Get the status of the healthcare agent"""
        return {
            "api_key_status": "configured" if self.api_key else "missing",
            "client_status": "ready" if self.client else "not initialized",
            "model": "gpt-5-mini",
        }

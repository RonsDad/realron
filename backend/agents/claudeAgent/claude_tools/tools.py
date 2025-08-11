"""
Tool handlers for Claude to use
Based on the browser-use integration
"""

from typing import Any, Dict, List
import logging
import asyncio
from datetime import datetime
import os
from backend.agents.claudeAgent.claude_tools.clinical_agent.healthcare_agent_integration import clinical_operations_query
from backend.agents.claudeAgent.claude_tools.FDA.fda_drug_tools import (
    searchDrugLabel, searchAdverseEffects, getSpecialPopulations,
    getBoxedWarning, getDrugInteractions, getAbuse, getAbuseTable,
    getActiveIngredient, getAdverseReactions, getClinicalPharmacology,
    getContraindications, getDescription, getDosageAndAdministration,
    getWarnings, getPregnancy, getPediatricUse, getGeriatricUse,
    getIndicationsAndUsage, getMechanismOfAction, getOverdosage,
    getPharmacokinetics, getControlledSubstance, getNursingMothers
)
from backend.agents.claudeAgent.claude_tools.pubmed.pubmed_tools import (
    pubmed_search, pubmed_fetch_abstracts, pubmed_fetch_summaries,
    pubmed_fetch_related, pubmed_fetch_citations, pubmed_search_clinical_trials,
    pubmed_mesh_search
)

logger = logging.getLogger(__name__)

# Browser session creation tool - creates session and returns LiveURL immediately
async def create_browser_session(initial_url: str = "about:blank") -> Dict[str, Any]:
    """
    Create a persistent browser session with keep_alive=True and return LiveURL immediately.
    This session will persist after agent tasks complete, allowing for reuse.
    """
    try:
        from browser_use import BrowserProfile
        from backend.agents.claudeAgent.claude_tools.browser_use.browser_use_service import browser_use_service
        
        logger.info("Creating persistent browser session with keep_alive=True")
        
        # Create optimized browser profile
        browser_profile = BrowserProfile(
            headless=False,  # Required for LiveURL viewing
            viewport={"width": 1280, "height": 900},
            wait_between_actions=0.1  # Fast actions
        )
        
        # Create session with keep_alive=True for persistence
        session_result = await browser_use_service.create_live_url_session(
            timeout_ms=900000,  # 15 minutes
            browser_profile=browser_profile,
            interactive=True  # Allow user interaction with browser
        )
        
        logger.info(f"✅ Browser session created with LiveURL: {session_result['live_url']}")
        logger.info(f"Session ID: {session_result['session_id']}")
        
        # Small delay to ensure session is fully registered
        await asyncio.sleep(0.5)  # 500ms for session registration
        logger.info(f"Session {session_result['session_id']} fully registered and ready")
        
        # Navigate to initial URL if specified
        if initial_url and initial_url != "about:blank":
            try:
                logger.info(f"Navigating to initial URL: {initial_url}")
                nav_result = await browser_use_service.navigate_and_get_live_url(
                    session_result['session_id'], 
                    initial_url
                )
                logger.info(f"Successfully navigated to {initial_url}")
            except Exception as e:
                logger.warning(f"Failed to navigate to {initial_url}: {e}")
        
        return {
            "success": True,
            "session_id": session_result['session_id'],
            "live_url": session_result['live_url'],
            "session_number": session_result.get('session_number', 1),
            "display_name": session_result.get('display_name', 'Browser Session'),
            "message": f"✅ Browser session created successfully! The browser panel should be open. Session ID: {session_result['session_id']}",
            "instructions": "Use browser_use with this session_id to perform tasks"
        }
        
    except Exception as e:
        logger.error(f"Failed to create browser session: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "message": f"❌ Failed to create browser session: {str(e)}"
        }


# Helper function for retry logic
async def _browser_use_with_retry(session_id: str, task: str, max_retries: int = 3, delay: float = 1.0) -> Dict[str, Any]:
    """
    Execute browser task with retry logic for session registration race conditions.
    """
    from backend.agents.claudeAgent.claude_tools.browser_use.browser_use_service import browser_use_service
    
    for attempt in range(max_retries):
        try:
            # Add a small delay on retries to ensure session is fully registered
            if attempt > 0:
                logger.info(f"Retry attempt {attempt + 1} for session {session_id}")
                await asyncio.sleep(delay)
            
            # Try to execute the task
            result = await browser_use_service.execute_browser_task(session_id, task)
            
            # Success - return result
            return result
            
        except Exception as e:
            error_msg = str(e)
            if ("not found" in error_msg.lower() or "expired" in error_msg.lower()) and attempt < max_retries - 1:
                logger.warning(f"Session {session_id} not ready, retrying in {delay}s... (attempt {attempt + 1}/{max_retries})")
                continue
            else:
                # Final attempt failed or different error
                raise


# Browser automation tool using browser-use
async def browser_use(task: str, session_id: str = None) -> Dict[str, Any]:
    """
    Perform a browser automation task using browser-use Agent.
    Requires an existing session created by create_browser_session.
    """
    try:
        # Import the centralized browser service
        from backend.agents.claudeAgent.claude_tools.browser_use.browser_use_service import browser_use_service
        
        logger.info(f"Starting browser task: {task}")
        
        # Check if we have an existing session to reuse
        active_sessions = await browser_use_service.list_active_sessions()
        available_sessions = list(active_sessions.get('sessions', {}).keys())
        logger.info(f"Active sessions: {available_sessions}")
        
        # If no session_id provided, try to use the first available session
        if not session_id and available_sessions:
            session_id = available_sessions[0]
            logger.info(f"No session_id provided, using first available session: {session_id}")
        
        if session_id and session_id in active_sessions.get('sessions', {}):
            # Use existing session with retry logic
            logger.info(f"Using session: {session_id} for task: {task}")
            result = await _browser_use_with_retry(session_id, task)
            
            # Add session_id to result if not present
            if 'session_id' not in result:
                result['session_id'] = session_id
                
            return result
        else:
            # No valid session found
            logger.error(f"browser_use called with session_id={session_id} but session not found")
            logger.error(f"Available sessions: {available_sessions}")
            return {
                "success": False,
                "error": "No browser session found. You must call create_browser_session first to open the browser panel.",
                "instruction": "Please call create_browser_session first, then use browser_use with the returned session_id",
                "provided_session_id": session_id,
                "available_sessions": available_sessions
            }
        
    except Exception as e:
        logger.error(f"Browser task error: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "task": task
        }


# Browser session management tools
async def check_browser_session(session_id: str = None) -> Dict[str, Any]:
    """
    Check the status of browser sessions.
    If session_id is provided, checks that specific session.
    Otherwise, lists all active sessions.
    """
    try:
        from backend.agents.claudeAgent.claude_tools.browser_use.browser_use_service import browser_use_service
        
        if session_id:
            # Check specific session
            try:
                session_info = await browser_use_service.get_session_info(session_id)
                return {
                    "success": True,
                    "session_id": session_id,
                    "status": session_info.get('status', 'unknown'),
                    "live_url": session_info.get('live_url'),
                    "current_url": session_info.get('current_url'),
                    "created_at": session_info.get('created_at'),
                    "message": f"Session {session_id} is {session_info.get('status', 'unknown')}"
                }
            except Exception as e:
                return {
                    "success": False,
                    "session_id": session_id,
                    "error": str(e),
                    "message": f"Session {session_id} not found or expired"
                }
        else:
            # List all sessions
            sessions = await browser_use_service.list_active_sessions()
            session_count = sessions.get('total_sessions', 0)
            
            if session_count > 0:
                return {
                    "success": True,
                    "total_sessions": session_count,
                    "sessions": sessions.get('sessions_list', []),
                    "message": f"Found {session_count} active browser session(s)"
                }
            else:
                return {
                    "success": True,
                    "total_sessions": 0,
                    "sessions": [],
                    "message": "No active browser sessions. Use create_browser_session to start one."
                }
                
    except Exception as e:
        logger.error(f"Failed to check browser sessions: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "message": f"Failed to check browser sessions: {str(e)}"
        }


async def close_browser_session(session_id: str = None) -> Dict[str, Any]:
    """
    Close browser session(s).
    If session_id is provided, closes that specific session.
    Otherwise, closes all active sessions.
    """
    try:
        from backend.agents.claudeAgent.claude_tools.browser_use.browser_use_service import browser_use_service
        
        if session_id:
            # Close specific session
            result = await browser_use_service.close_session(session_id)
            return {
                "success": True,
                "session_id": session_id,
                "message": f"✅ Browser session {session_id} closed successfully"
            }
        else:
            # Close all sessions
            result = await browser_use_service.close_all_sessions()
            closed_count = result.get('total_closed', 0)
            return {
                "success": True,
                "closed_sessions": result.get('closed_sessions', []),
                "total_closed": closed_count,
                "message": f"✅ Closed {closed_count} browser session(s)"
            }
            
    except Exception as e:
        logger.error(f"Failed to close browser session(s): {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "message": f"❌ Failed to close browser session(s): {str(e)}"
        }


# Web search tool
async def web_search(query: str, num_results: int = 5) -> Dict[str, Any]:
    """Search the web for information"""
    # This would integrate with your web search service
    # For now, return a placeholder
    return {
        "results": [f"Result {i+1} for '{query}'" for i in range(num_results)],
        "query": query
    }


# Code execution tool
async def execute_code(code: str, language: str = "python") -> Dict[str, Any]:
    """Execute code in a sandboxed environment"""
    # This would integrate with your code execution service
    return {
        "output": f"Executed {language} code",
        "code": code,
        "language": language,
        "error": None
    }


# Perplexity tools
async def perplexity_sonar_pro(query: str, search_filter: str = None, search_domain_filter: List[str] = None) -> Dict[str, Any]:
    """Search using Perplexity Sonar Pro for complex multi-criteria analysis"""
    import os
    import aiohttp
    
    api_key = os.getenv('PERPLEXITY_API_KEY')
    if not api_key:
        return {"error": "PERPLEXITY_API_KEY not configured"}
    
    try:
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "sonar-pro",
            "messages": [
                {"role": "user", "content": query}
            ],
            "stream": False
        }
        
        # Add optional search filters
        if search_filter:
            payload["search_filter"] = search_filter
        if search_domain_filter:
            payload["search_domain_filter"] = search_domain_filter
        
        # No timeout - let Perplexity handle it
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                "https://api.perplexity.ai/chat/completions",
                headers=headers,
                json=payload
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    return {
                        "success": True,
                        "result": data.get("choices", [{}])[0].get("message", {}).get("content", ""),
                        "query": query,
                        "model": "sonar-pro"
                    }
                else:
                    error_text = await response.text()
                    return {
                        "success": False,
                        "error": f"API error {response.status}: {error_text}",
                        "query": query
                    }
                    
    except Exception as e:
        logger.error(f"Perplexity Sonar Pro error: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "query": query
        }


async def perplexity_reasoning_pro(query: str, search_filter: str = None, search_domain_filter: List[str] = None) -> Dict[str, Any]:
    """Use Perplexity Reasoning Pro for complex reasoning and multi-criteria analysis"""
    import os
    import aiohttp
    
    api_key = os.getenv('PERPLEXITY_API_KEY')
    if not api_key:
        return {"error": "PERPLEXITY_API_KEY not configured"}
    
    try:
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "sonar-reasoning",
            "messages": [
                {"role": "user", "content": query}
            ],
            "stream": False
        }
        
        # Add optional search filters
        if search_filter:
            payload["search_filter"] = search_filter
        if search_domain_filter:
            payload["search_domain_filter"] = search_domain_filter
        
        # No timeout - let Perplexity handle it
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                "https://api.perplexity.ai/chat/completions",
                headers=headers,
                json=payload
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    return {
                        "success": True,
                        "result": data.get("choices", [{}])[0].get("message", {}).get("content", ""),
                        "query": query,
                        "model": "sonar-reasoning"
                    }
                else:
                    error_text = await response.text()
                    return {
                        "success": False,
                        "error": f"API error {response.status}: {error_text}",
                        "query": query
                    }
                    
    except Exception as e:
        logger.error(f"Perplexity Reasoning Pro error: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "query": query
        }


async def perplexity_deep_research(query: str, reasoning_effort: str = None) -> Dict[str, Any]:
    """Use Perplexity Deep Research for exhaustive single-topic research"""
    import os
    import aiohttp
    
    api_key = os.getenv('PERPLEXITY_API_KEY')
    if not api_key:
        return {"error": "PERPLEXITY_API_KEY not configured"}
    
    try:
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "sonar-deep-research",
            "messages": [
                {"role": "user", "content": query}
            ],
            "stream": False,
            "reasoning_effort": reasoning_effort  # Let Claude decide
        }
        
        # Log the start of deep research
        logger.info(f"Starting Perplexity Deep Research with effort: {reasoning_effort}")
        
        # No timeout - let Perplexity handle it
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                "https://api.perplexity.ai/chat/completions",
                headers=headers,
                json=payload
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    logger.info(f"Perplexity Deep Research completed successfully")
                    return {
                        "success": True,
                        "result": data.get("choices", [{}])[0].get("message", {}).get("content", ""),
                        "query": query,
                        "model": "sonar-deep-research",
                        "reasoning_effort": reasoning_effort
                    }
                else:
                    error_text = await response.text()
                    return {
                        "success": False,
                        "error": f"API error {response.status}: {error_text}",
                        "query": query
                    }
                    
    except Exception as e:
        logger.error(f"Perplexity Deep Research error: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "query": query
        }


# Claude Code SDK: Generate healthcare tool and return LiveURL
async def claude_code_generate_tool(message: str, patient_id: str, patient_data: Dict[str, Any] = None) -> Dict[str, Any]:
    """Generate a healthcare tool using Claude Code SDK and return a LiveURL for preview."""
    try:
        from backend.agents.claudeAgent.claude_tools.claude_code_sdk.patient_handler import patient_request_handler
        result = await patient_request_handler.handle_request(
            message=message,
            patient_id=patient_id,
            patient_data=patient_data,
        )
        return {
            "success": bool(result.get("success")),
            "tool_id": result.get("tool_id"),
            "live_url": result.get("live_url") or result.get("tool_url"),
            "share_url": result.get("share_url"),
            "message": result.get("message"),
            "timestamp": result.get("timestamp"),
            "session_id": result.get("session_id"),
            "error": result.get("error"),
        }
    except Exception as e:
        logger.error(f"Claude Code SDK generation failed: {str(e)}")
        return {"success": False, "error": str(e)}


# Tool registry
TOOLS = {
    "clinical_operations": {
        "function": clinical_operations_query,
        "description": "Query the fine-tuned Clinical Operations AI model with integrated FDA, PubMed, web search, and clinical guidelines vector store for evidence-based clinical and care coordination answers",
        "parameters": {
            "query": {
                "type": "string",
                "description": "The clinical question or request (e.g., prior authorization requirements, care coordination considerations, clinical guidelines)",
                "required": True
            },
            "patient_context": {
                "type": "string",
                "description": "Optional de-identified patient context including conditions, medications, procedures, or relevant clinical information",
                "required": False
            }
        }
    },
    "create_browser_session": {
        "function": create_browser_session,
        "description": "Create a browser session and get LiveURL immediately to open the browser panel",
        "parameters": {
            "initial_url": {
                "type": "string",
                "description": "Initial URL to navigate to (default: about:blank)",
                "required": False,
                "default": "about:blank"
            }
        }
    },
    "browser_use": {
        "function": browser_use,
        "description": "Perform browser automation tasks like navigating websites, clicking elements, filling forms, extracting data",
        "parameters": {
            "task": {
                "type": "string",
                "description": "The browser automation task to perform",
                "required": True
            },
            "session_id": {
                "type": "string", 
                "description": "Optional session ID to reuse existing session",
                "required": False
            }
        }
    },
    "web_search": {
        "function": web_search,
        "description": "Search the web for information",
        "parameters": {
            "query": {
                "type": "string",
                "description": "The search query",
                "required": True
            },
            "num_results": {
                "type": "integer",
                "description": "Number of results to return",
                "required": False,
                "default": 5
            }
        }
    },
    "execute_code": {
        "function": execute_code,
        "description": "Execute code in a sandboxed environment",
        "parameters": {
            "code": {
                "type": "string",
                "description": "The code to execute",
                "required": True
            },
            "language": {
                "type": "string",
                "description": "Programming language",
                "required": False,
                "default": "python"
            }
        }
    },
    "perplexity_sonar_pro": {
        "function": perplexity_sonar_pro,
        "description": "General Search Tool - Fast searches across multiple topics or sources with built-in citations",
        "parameters": {
            "query": {
                "type": "string",
                "description": "The search query",
                "required": True
            },
            "search_filter": {
                "type": "string",
                "description": "Optional search filter: 'academic' for academic sources",
                "required": False
            },
            "search_domain_filter": {
                "type": "array",
                "description": "Optional list of domains to search within (e.g., ['arxiv.org'])",
                "required": False
            }
        }
    },
    "perplexity_reasoning_pro": {
        "function": perplexity_reasoning_pro,
        "description": "Multi-Criteria Analysis Tool - Complex searches requiring reasoning and evaluation of multiple aspects",
        "parameters": {
            "query": {
                "type": "string",
                "description": "The complex query requiring reasoning",
                "required": True
            },
            "search_filter": {
                "type": "string",
                "description": "Optional search filter: 'academic' for academic sources",
                "required": False
            },
            "search_domain_filter": {
                "type": "array",
                "description": "Optional list of domains to search within",
                "required": False
            }
        }
    },
    "perplexity_deep_research": {
        "function": perplexity_deep_research,
        "description": "Deep Dive Tool - Exhaustive single-topic research. IMPORTANT: Always use 'low' effort unless user explicitly asks for comprehensive/exhaustive research:\n- Use 'low' BY DEFAULT for ALL queries - fast and efficient\n- Use 'medium' ONLY when user explicitly asks for 'comprehensive' or 'detailed' research\n- Use 'high' ONLY when user explicitly requests 'exhaustive', 'complete', or 'academic-level' analysis\n- NEVER use medium or high unless specifically requested",
        "parameters": {
            "query": {
                "type": "string",
                "description": "The specific topic for deep research",
                "required": True
            },
            "reasoning_effort": {
                "type": "string",
                "description": "Reasoning effort: 'low' for quick overview, 'medium' for balanced research, 'high' for exhaustive analysis. DEFAULT TO 'low' unless user explicitly requests more depth.",
                "required": False
            }
        }
    },
    "claude_code_generate_tool": {
        "function": claude_code_generate_tool,
        "description": "Generate a personalized healthcare tool using Claude Code SDK and return a LiveURL for instant preview.",
        "parameters": {
            "message": {
                "type": "string",
                "description": "Patient's natural language request",
                "required": True
            },
            "patient_id": {
                "type": "string",
                "description": "Patient identifier",
                "required": True
            },
            "patient_data": {
                "type": "object",
                "description": "Optional structured patient context (conditions, meds, etc.)",
                "required": False
            }
        }
    },
    # FDA Drug Tools
    "searchDrugLabel": {
        "function": searchDrugLabel,
        "description": "Search for a drug by name and get its detailed label information. Returns all available fields from the FDA drug label database.",
        "parameters": {
            "drugName": {
                "type": "string",
                "description": "Name of the drug to look up (brand name or generic name)",
                "required": True
            },
            "fields": {
                "type": "array",
                "description": "Optional specific fields to retrieve from the drug label. If not provided, returns all fields.",
                "required": False
            }
        }
    },
    "searchAdverseEffects": {
        "function": searchAdverseEffects,
        "description": "Search for reported adverse effects of a drug in the FDA database. Returns a list of adverse reactions with their seriousness and outcomes.",
        "parameters": {
            "drugName": {
                "type": "string",
                "description": "Name of the drug to search for",
                "required": True
            },
            "limit": {
                "type": "integer",
                "description": "Maximum number of adverse effects to return (default: 10)",
                "required": False,
                "default": 10
            }
        }
    },
    "getSpecialPopulations": {
        "function": getSpecialPopulations,
        "description": "Get comprehensive information about drug use in special populations. Returns an object containing pregnancy warnings, geriatric use information, pediatric use guidelines, and nursing mothers advisories.",
        "parameters": {
            "drugName": {
                "type": "string",
                "description": "Name of the drug to look up",
                "required": True
            }
        }
    },
    "getBoxedWarning": {
        "function": getBoxedWarning,
        "description": "Get serious warnings (black box warnings) for a drug. These are the most serious warnings that may appear on a drug label.",
        "parameters": {
            "drugName": {
                "type": "string",
                "description": "Name of the drug to look up",
                "required": True
            }
        }
    },
    "getDrugInteractions": {
        "function": getDrugInteractions,
        "description": "Get detailed information about drug interactions, including other medications, substances, or conditions that may interact with the drug.",
        "parameters": {
            "drugName": {
                "type": "string",
                "description": "Name of the drug to look up",
                "required": True
            }
        }
    },
    "getAbuse": {
        "function": getAbuse,
        "description": "Retrieves information about the types of abuse that can occur with the drug and adverse reactions pertinent to those types of abuse, primarily based on human data. (prescription area).",
        "parameters": {
            "drugName": {
                "type": "string",
                "description": "Name of the drug to look up (brand name or generic name)",
                "required": True
            }
        }
    },
    "getAbuseTable": {
        "function": getAbuseTable,
        "description": "Retrieves information about the types of abuse that can occur with the drug and adverse reactions pertinent to those types of abuse, primarily based on human data. (prescription area).",
        "parameters": {
            "drugName": {
                "type": "string",
                "description": "Name of the drug to look up (brand name or generic name)",
                "required": True
            }
        }
    },
    "getActiveIngredient": {
        "function": getActiveIngredient,
        "description": "Retrieves a list of the active, medicinal ingredients in the drug product. (few prescription / OTC area).",
        "parameters": {
            "drugName": {
                "type": "string",
                "description": "Name of the drug to look up (brand name or generic name)",
                "required": True
            }
        }
    },
    "getAdverseReactions": {
        "function": getAdverseReactions,
        "description": "Retrieves information about undesirable effects, reasonably associated with use of the drug. (prescription / some OTC area).",
        "parameters": {
            "drugName": {
                "type": "string",
                "description": "Name of the drug to look up (brand name or generic name)",
                "required": True
            }
        }
    },
    "getClinicalPharmacology": {
        "function": getClinicalPharmacology,
        "description": "Retrieves information about the clinical pharmacology and actions of the drug in humans. (prescription / few OTC area).",
        "parameters": {
            "drugName": {
                "type": "string",
                "description": "Name of the drug to look up (brand name or generic name)",
                "required": True
            }
        }
    },
    "getContraindications": {
        "function": getContraindications,
        "description": "Retrieves information about situations in which the drug product should not be used. (prescription / few OTC area).",
        "parameters": {
            "drugName": {
                "type": "string",
                "description": "Name of the drug to look up (brand name or generic name)",
                "required": True
            }
        }
    },
    "getDescription": {
        "function": getDescription,
        "description": "Retrieves general information about the drug product, including dosage form, ingredients, and chemical structure. (prescription / some OTC area).",
        "parameters": {
            "drugName": {
                "type": "string",
                "description": "Name of the drug to look up (brand name or generic name)",
                "required": True
            }
        }
    },
    "getDosageAndAdministration": {
        "function": getDosageAndAdministration,
        "description": "Retrieves information about the drug product's dosage and administration recommendations. (prescription / OTC area).",
        "parameters": {
            "drugName": {
                "type": "string",
                "description": "Name of the drug to look up (brand name or generic name)",
                "required": True
            }
        }
    },
    "getWarnings": {
        "function": getWarnings,
        "description": "Retrieves information about serious adverse reactions and potential safety hazards. (prescription / OTC area).",
        "parameters": {
            "drugName": {
                "type": "string",
                "description": "Name of the drug to look up (brand name or generic name)",
                "required": True
            }
        }
    },
    "getPregnancy": {
        "function": getPregnancy,
        "description": "Retrieves information about effects the drug may have on pregnant women or on a fetus. (prescription / few OTC area).",
        "parameters": {
            "drugName": {
                "type": "string",
                "description": "Name of the drug to look up (brand name or generic name)",
                "required": True
            }
        }
    },
    "getPediatricUse": {
        "function": getPediatricUse,
        "description": "Retrieves information about any limitations on pediatric indications and hazards. (prescription / very few OTC area).",
        "parameters": {
            "drugName": {
                "type": "string",
                "description": "Name of the drug to look up (brand name or generic name)",
                "required": True
            }
        }
    },
    "getGeriatricUse": {
        "function": getGeriatricUse,
        "description": "Retrieves information about any limitations on geriatric indications and hazards. (most prescription / very few OTC area).",
        "parameters": {
            "drugName": {
                "type": "string",
                "description": "Name of the drug to look up (brand name or generic name)",
                "required": True
            }
        }
    },
    "getIndicationsAndUsage": {
        "function": getIndicationsAndUsage,
        "description": "Retrieves a statement of each of the drug product's indications for use. (prescription / OTC area).",
        "parameters": {
            "drugName": {
                "type": "string",
                "description": "Name of the drug to look up (brand name or generic name)",
                "required": True
            }
        }
    },
    "getMechanismOfAction": {
        "function": getMechanismOfAction,
        "description": "Retrieves information about the established mechanism(s) of the drug's action in humans. (prescription area).",
        "parameters": {
            "drugName": {
                "type": "string",
                "description": "Name of the drug to look up (brand name or generic name)",
                "required": True
            }
        }
    },
    "getOverdosage": {
        "function": getOverdosage,
        "description": "Retrieves information about signs, symptoms, and laboratory findings of acute overdosage. (prescription / some OTC area).",
        "parameters": {
            "drugName": {
                "type": "string",
                "description": "Name of the drug to look up (brand name or generic name)",
                "required": True
            }
        }
    },
    "getPharmacokinetics": {
        "function": getPharmacokinetics,
        "description": "Retrieves information about the clinically significant pharmacokinetics of a drug or active metabolites. (prescription area).",
        "parameters": {
            "drugName": {
                "type": "string",
                "description": "Name of the drug to look up (brand name or generic name)",
                "required": True
            }
        }
    },
    "getControlledSubstance": {
        "function": getControlledSubstance,
        "description": "Retrieves information about the schedule in which the drug is controlled by the Drug Enforcement Administration. (prescription area).",
        "parameters": {
            "drugName": {
                "type": "string",
                "description": "Name of the drug to look up (brand name or generic name)",
                "required": True
            }
        }
    },
    "getNursingMothers": {
        "function": getNursingMothers,
        "description": "Retrieves information about excretion of the drug in human milk and effects on the nursing infant. (prescription / very few OTC area).",
        "parameters": {
            "drugName": {
                "type": "string",
                "description": "Name of the drug to look up (brand name or generic name)",
                "required": True
            }
        }
    },
    # Commented out until function ordering is fixed
    # "create_browser_ccsdk": {
    #     "function": create_browser_ccsdk,
    #     "description": "Create a browserless session to display Claude Code SDK generated healthcare tools with LiveURL",
    #     "parameters": {
    #         "tool_html": {
    #             "type": "string",
    #             "description": "The HTML content of the generated healthcare tool",
    #             "required": True
    #         },
    #         "tool_name": {
    #             "type": "string", 
    #             "description": "Name of the tool being generated (e.g., 'Medication Tracker')",
    #             "required": True
    #         }
    #     }
    # },
    # PubMed E-utilities Tools
    "pubmed_search": {
        "function": pubmed_search,
        "description": "Search PubMed for biomedical literature. Returns PMIDs that can be used with other PubMed functions for detailed information.",
        "parameters": {
            "query": {
                "type": "string",
                "description": "Search query using PubMed syntax (e.g., 'diabetes AND metformin', 'Smith J[Author]')",
                "required": True
            },
            "max_results": {
                "type": "integer",
                "description": "Maximum number of results to return (default: 20, max: 10000)",
                "required": False,
                "default": 20
            },
            "sort_order": {
                "type": "string",
                "description": "Sort order: 'relevance', 'pub_date', 'Author', 'JournalName'",
                "required": False,
                "default": "relevance"
            },
            "date_filter": {
                "type": "object",
                "description": "Optional date filter with mindate, maxdate (YYYY/MM/DD format), and datetype (pdat, edat, crdt)",
                "required": False
            }
        }
    },
    "pubmed_fetch_abstracts": {
        "function": pubmed_fetch_abstracts,
        "description": "Fetch full abstracts and detailed metadata for PubMed articles using PMIDs from search results.",
        "parameters": {
            "pmids": {
                "type": "array",
                "description": "List of PubMed IDs (PMIDs) to fetch abstracts for",
                "required": True
            },
            "include_full_text": {
                "type": "boolean",
                "description": "Whether to attempt to include full text when available",
                "required": False,
                "default": False
            }
        }
    },
    "pubmed_fetch_summaries": {
        "function": pubmed_fetch_summaries,
        "description": "Fetch concise summaries for PubMed articles. Faster than abstracts for getting basic information.",
        "parameters": {
            "pmids": {
                "type": "array",
                "description": "List of PubMed IDs (PMIDs) to fetch summaries for",
                "required": True
            }
        }
    },
    "pubmed_fetch_related": {
        "function": pubmed_fetch_related,
        "description": "Find articles related to a given PubMed article using NCBI's similarity algorithms.",
        "parameters": {
            "pmid": {
                "type": "string",
                "description": "PubMed ID (PMID) of the source article",
                "required": True
            },
            "max_results": {
                "type": "integer",
                "description": "Maximum number of related articles to return",
                "required": False,
                "default": 20
            }
        }
    },
    "pubmed_fetch_citations": {
        "function": pubmed_fetch_citations,
        "description": "Fetch citation information for an article - both references (cited by the article) and citations (articles citing it).",
        "parameters": {
            "pmid": {
                "type": "string",
                "description": "PubMed ID (PMID) of the article",
                "required": True
            },
            "citation_type": {
                "type": "string",
                "description": "Type of citations to fetch: 'references', 'citations', or 'both'",
                "required": False,
                "default": "both"
            }
        }
    },
    "pubmed_search_clinical_trials": {
        "function": pubmed_search_clinical_trials,
        "description": "Search for clinical trials in PubMed related to specific conditions or interventions.",
        "parameters": {
            "condition": {
                "type": "string",
                "description": "Medical condition or disease to search for",
                "required": True
            },
            "intervention": {
                "type": "string",
                "description": "Treatment or intervention being studied",
                "required": False
            },
            "status": {
                "type": "string",
                "description": "Trial status (e.g., 'recruiting', 'completed')",
                "required": False
            },
            "max_results": {
                "type": "integer",
                "description": "Maximum number of results to return",
                "required": False,
                "default": 20
            }
        }
    },
    "pubmed_mesh_search": {
        "function": pubmed_mesh_search,
        "description": "Search PubMed using MeSH (Medical Subject Headings) terms for precise medical literature searches.",
        "parameters": {
            "mesh_terms": {
                "type": "array",
                "description": "List of MeSH terms to search for",
                "required": True
            },
            "combine_with": {
                "type": "string",
                "description": "How to combine MeSH terms: 'AND' or 'OR'",
                "required": False,
                "default": "AND"
            },
            "max_results": {
                "type": "integer",
                "description": "Maximum number of results to return",
                "required": False,
                "default": 20
            }
        }
    }
    # computer_use removed - should be enabled as native Claude capability, not a recursive tool
}



# Claude Code SDK Tool for Healthcare Tool Generation
async def create_browser_ccsdk(tool_html: str, tool_name: str) -> Dict[str, Any]:
    """
    Create a browserless session to display Claude Code SDK generated healthcare tools with LiveURL.
    Returns LiveURL immediately for inline chat display.
    """
    try:
        from backend.agents.claudeAgent.claude_tools.claude_code_sdk.claude_code_sdk_browserless import claude_code_sdk_browserless
        
        logger.info(f"Creating Claude Code SDK tool preview for: {tool_name}")
        
        # Create session and get LiveURL
        result = await claude_code_sdk_browserless.create_browser_ccsdk(
            tool_html=tool_html,
            tool_name=tool_name
        )
        
        logger.info(f"Tool preview created with LiveURL: {result['live_url']}")
        
        return {
            "success": True,
            "session_id": result['session_id'],
            "live_url": result['live_url'],
            "tool_name": result['tool_name'],
            "message": f"Your {tool_name} is ready!"
        }
        
    except Exception as e:
        logger.error(f"Failed to create tool preview: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "message": "Unable to display tool preview. Please try again."
        }


def get_tool_definitions_for_claude():
    """Get tool definitions in Claude's expected format"""
    definitions = []
    
    for name, meta in TOOLS.items():
        tool_def = {
            "name": name,
            "description": meta["description"],
            "input_schema": {
                "type": "object",
                "properties": {},
                "required": []
            }
        }
        
        # Add parameters
        for param_name, param_info in meta["parameters"].items():
            tool_def["input_schema"]["properties"][param_name] = {
                "type": param_info["type"],
                "description": param_info["description"]
            }
            if param_info.get("default"):
                tool_def["input_schema"]["properties"][param_name]["default"] = param_info["default"]
            
            if param_info.get("required", False):
                tool_def["input_schema"]["required"].append(param_name)
        
        definitions.append(tool_def)
    
    return definitions


async def execute_tool(tool_name: str, tool_input: Dict[str, Any]) -> Dict[str, Any]:
    """Execute a tool by name with given input"""
    if tool_name not in TOOLS:
        return {"error": f"Unknown tool: {tool_name}"}
    
    # Ensure tool_input is a dictionary (handle empty string or None cases)
    if not isinstance(tool_input, dict):
        logger.warning(f"Tool {tool_name} received non-dict input: {type(tool_input)} - {tool_input}")
        tool_input = {} if (tool_input == "" or tool_input is None) else {"input": tool_input}
    
    # computer_use is handled as a native Claude capability, not through this tool system
    
    tool_func = TOOLS[tool_name]["function"]
    
    try:
        # Execute the tool function
        result = await tool_func(**tool_input)
        return result
    except Exception as e:
        logger.error(f"Error executing tool {tool_name}: {str(e)}")
        return {
            "error": f"Tool execution failed: {str(e)}",
            "tool": tool_name,
            "input": tool_input
        }

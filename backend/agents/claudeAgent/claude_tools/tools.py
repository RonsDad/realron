"""
Tool handlers for Claude to use
Based on the browser-use integration
"""

from typing import Any, Dict, List
import logging
import asyncio
from datetime import datetime
import os
from backend.agents.claudeAgent.claude_tools.clinical_ops_agent import run_ron_ai

async def clinical_operations_query(query: str, patient_context: str = None):
    """Async wrapper for run_ron_ai"""
    prompt = f"{query}\n\nPatient Context: {patient_context}" if patient_context else query
    return await asyncio.to_thread(run_ron_ai, prompt)
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
from backend.agents.claudeAgent.claude_tools.orchestrator_tools import (
    spawn_healthcare_agent, execute_spawned_agent, execute_agent_team,
    check_agent_status, cleanup_completed_agent, orchestrate_healthcare_task,
    execute_agent_pipeline
)
from backend.agents.claudeAgent.claude_tools.unified_agent_tools import (
    create_orchestrator_agent, create_worker_agent, execute_with_orchestrator,
    execute_pipeline, create_custom_pipeline, send_agent_message,
    broadcast_to_agents, get_agent_system_status, list_available_agents,
    get_pipeline_execution_status, get_unified_agent_tool_definitions
)

logger = logging.getLogger(__name__)

# ---------------------------------------------
# Provider Search (uses Perplexity to fetch data)
# ---------------------------------------------
async def provider_search(
    specialty: str,
    location: str,
    insurance: str | None = None,
    preferences: Dict[str, Any] | None = None,
    top_n: int = 5,
) -> Dict[str, Any]:
    """
    Find healthcare providers that match user criteria using Perplexity and
    return structured results compatible with the frontend's ProviderSearchResult.

    Fields returned per provider:
      - id: string
      - name: string
      - specialty: string
      - rating: number (0-5)
      - reviews: number
      - location: string
      - distance: string (e.g., "3.2 mi")
      - availability: string
      - insurance: string[]
      - imageUrl?: string
      - aiSummary?: string
    """
    import aiohttp
    import json as _json
    import re

    api_key = os.getenv('PERPLEXITY_API_KEY')
    if not api_key:
        return {
            "success": False,
            "error": "PERPLEXITY_API_KEY not configured",
            "results": [],
            "searchQuery": f"{specialty} in {location}",
        }

    # Build user preferences text
    pref_parts: List[str] = []
    if insurance:
        pref_parts.append(f"must accept {insurance}")
    if preferences:
        if preferences.get("languages"):
            pref_parts.append(f"languages: {', '.join(preferences['languages'])}")
        if preferences.get("gender_preference"):
            pref_parts.append(f"preferred clinician gender: {preferences['gender_preference']}")
        if preferences.get("telehealth") is True:
            pref_parts.append("telehealth available")
        if preferences.get("accepting_new_patients") is True:
            pref_parts.append("accepting new patients")
        if preferences.get("distance_miles"):
            pref_parts.append(f"within {preferences['distance_miles']} miles")

    prefs_text = ", ".join(pref_parts) if pref_parts else "no additional preferences"

    system_instructions = (
        "Return ONLY JSON. No prose. JSON must be an object with keys 'results' (array) and 'searchQuery' (string). "
        "Each result must include: id, name, specialty, rating (0-5), reviews (int), location (string), distance (string), "
        "availability (string), insurance (string array), imageUrl (optional), aiSummary (string concise how they match preferences)."
    )
    user_query = (
        f"Find top {top_n} {specialty} providers near {location}. Preferences: {prefs_text}. "
        f"Focus on reputable sources (official provider sites, health system directories, Google Maps, Healthgrades, Vitals, Doximity). "
        f"If exact data missing, infer reasonably from sources and state 'unknown' for unavailable fields."
    )

    payload = {
        "model": "sonar-reasoning",
        "messages": [
            {"role": "system", "content": system_instructions},
            {"role": "user", "content": user_query},
        ],
        "stream": False,
    }

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    async with aiohttp.ClientSession() as session:
        async with session.post("https://api.perplexity.ai/chat/completions", headers=headers, json=payload) as resp:
            text = await resp.text()
            if resp.status != 200:
                logger.error(f"provider_search API error {resp.status}: {text}")
                return {"success": False, "error": f"Perplexity error {resp.status}", "results": [], "searchQuery": f"{specialty} in {location}"}
            try:
                data = await resp.json()
                content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
            except Exception:
                content = text

    # Extract JSON object from content
    # Try direct parse first
    parsed: Dict[str, Any] | None = None
    try:
        parsed = _json.loads(content)
    except Exception:
        # Try to find the first JSON object in the text
        match = re.search(r"\{[\s\S]*\}", content)
        if match:
            try:
                parsed = _json.loads(match.group(0))
            except Exception:
                parsed = None

    if not parsed or not isinstance(parsed, dict):
        # Fallback: build empty structure
        return {
            "success": False,
            "error": "Failed to parse provider results",
            "results": [],
            "searchQuery": f"{specialty} in {location}",
        }

    results = parsed.get("results", [])
    # Normalize fields and ensure IDs
    normalized: List[Dict[str, Any]] = []
    for i, p in enumerate(results[: top_n or 5]):
        try:
            normalized.append({
                "id": str(p.get("id") or p.get("npi") or p.get("name") or f"prov_{i}"),
                "name": p.get("name") or "Unknown",
                "specialty": p.get("specialty") or specialty,
                "rating": float(p.get("rating") or 0),
                "reviews": int(p.get("reviews") or 0),
                "location": p.get("location") or "Unknown",
                "distance": p.get("distance") or "--",
                "availability": p.get("availability") or "Unknown",
                "insurance": p.get("insurance") or ([insurance] if insurance else []),
                "imageUrl": p.get("imageUrl"),
                "aiSummary": p.get("aiSummary") or "",
            })
        except Exception as e:
            logger.warning(f"Skipping provider due to normalization error: {e}")

    return {
        "success": True,
        "results": normalized,
        "searchQuery": parsed.get("searchQuery") or f"{specialty} in {location}",
    }


# -----------------------------
# Subagents (team) orchestration
# -----------------------------
async def list_subagents() -> Dict[str, Any]:
    """Expose subagent catalog."""
    from backend.agents.claudeAgent.claude_tools.sub_agents import list_subagents as _list
    return _list()


async def run_subagent(name: str, task: str, context: Dict[str, Any] | None = None, allowed_tools_override: List[str] | None = None, disable_mcp: bool | None = True) -> Dict[str, Any]:
    """Run a single preconfigured subagent."""
    from backend.agents.claudeAgent.claude_tools.sub_agents import run_subagent as _run
    return await _run(name=name, task=task, context=context, allowed_tools_override=allowed_tools_override, disable_mcp=bool(disable_mcp))


async def run_subagents(task: str, team: List[str] | None = None, context: Dict[str, Any] | None = None, parallel: bool = True, aggregation: str = "consensus", disable_mcp: bool | None = True) -> Dict[str, Any]:
    """Run a team of subagents and aggregate their outputs."""
    from backend.agents.claudeAgent.claude_tools.sub_agents import run_subagents as _run_team
    return await _run_team(task=task, team=team, context=context, parallel=parallel, aggregation=aggregation, disable_mcp=bool(disable_mcp))


async def register_subagent(name: str, description: str, role_goal: str, allowed_tools: List[str], instruction_suffix: str | None = None) -> Dict[str, Any]:
    """Create a new custom subagent and persist it to the registry."""
    from backend.agents.claudeAgent.claude_tools.sub_agents import register_subagent as _reg
    return _reg(name=name, description=description, role_goal=role_goal, allowed_tools=allowed_tools, instruction_suffix=instruction_suffix)


async def update_subagent(name: str, description: str | None = None, role_goal: str | None = None, allowed_tools: List[str] | None = None, instruction_suffix: str | None = None) -> Dict[str, Any]:
    """Update an existing custom subagent."""
    from backend.agents.claudeAgent.claude_tools.sub_agents import update_subagent as _upd
    return _upd(name=name, description=description, role_goal=role_goal, allowed_tools=allowed_tools, instruction_suffix=instruction_suffix)


async def delete_subagent(name: str) -> Dict[str, Any]:
    """Delete a custom subagent from the registry."""
    from backend.agents.claudeAgent.claude_tools.sub_agents import delete_subagent as _del
    return _del(name=name)

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


# Data visualization tool
async def create_data_visualization(plot_code: str, filename: str = "visualization.png") -> Dict[str, Any]:
    """
    Create a data visualization using matplotlib and save it as an image file.
    
    Args:
        plot_code: The matplotlib plotting code (without import statements or save commands)
        filename: Output filename for the visualization
        
    Returns:
        Dictionary containing execution results and file information
    """
    try:
        from backend.agents.claudeAgent.claude_tools.anthropic_code_execution import create_visualization
        
        logger.info(f"Creating data visualization: {filename}")
        
        result = await create_visualization(
            plot_code=plot_code,
            filename=filename
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Visualization creation error: {str(e)}")
        return {
            "success": False,
            "output": "",
            "error": str(e),
            "files_created": []
        }


# Data analysis tool
async def analyze_data_with_output(analysis_code: str, output_format: str = "csv") -> Dict[str, Any]:
    """
    Execute data analysis code and save results in specified format.
    
    Args:
        analysis_code: The data analysis code (should create a DataFrame named 'df')
        output_format: Output format - 'csv', 'json', or 'xlsx'
        
    Returns:
        Dictionary containing execution results and file information
    """
    try:
        from backend.agents.claudeAgent.claude_tools.anthropic_code_execution import analyze_data
        
        logger.info(f"Executing data analysis with {output_format} output")
        
        result = await analyze_data(
            analysis_code=analysis_code,
            output_format=output_format
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Data analysis error: {str(e)}")
        return {
            "success": False,
            "output": "",
            "error": str(e),
            "files_created": []
        }


# Code execution tool
async def execute_code(code: str, language: str = "python", create_files: bool = False, download_files: bool = False) -> Dict[str, Any]:
    """
    Execute code using Anthropic's code execution API with file handling capabilities.
    
    Args:
        code: The code to execute
        language: Programming language (default: python)
        create_files: Whether to allow file creation during execution
        download_files: Whether to download any files created during execution
        
    Returns:
        Dictionary containing execution results, output, and file information
    """
    try:
        from backend.agents.claudeAgent.claude_tools.anthropic_code_execution import execute_code as anthropic_execute
        
        logger.info(f"Executing {language} code via Anthropic API")
        
        # Execute code using the Anthropic API
        result = await anthropic_execute(
            code=code,
            language=language,
            create_files=create_files,
            download_files=download_files
        )
        
        return result
        
    except ImportError as e:
        logger.error(f"Failed to import Anthropic code execution module: {str(e)}")
        return {
            "success": False,
            "output": "",
            "error": "Code execution module not available",
            "language": language
        }
    except Exception as e:
        logger.error(f"Code execution error: {str(e)}")
        return {
            "success": False,
            "output": "",
            "error": str(e),
            "language": language
        }


# Perplexity tools
async def perplexity_sonar_pro(query: str, search_filter: str = None, search_domain_filter: List[str] = None) -> Dict[str, Any]:
    """Search using Perplexity Sonar Pro for complex multi-criteria analysis with streaming support"""
    import os
    import aiohttp
    import json

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
            "stream": True  # Enable streaming for progressive responses
        }

        # Add optional search filters
        if search_filter:
            payload["search_filter"] = search_filter
        if search_domain_filter:
            payload["search_domain_filter"] = search_domain_filter

        async with aiohttp.ClientSession() as session:
            async with session.post(
                "https://api.perplexity.ai/chat/completions",
                headers=headers,
                json=payload
            ) as response:
                if response.status == 200:
                    # Process streaming response
                    full_content = ""
                    async for line in response.content:
                        line = line.decode('utf-8').strip()
                        if line.startswith('data: '):
                            data = line[6:]  # Remove 'data: ' prefix
                            if data == '[DONE]':
                                break
                            if data:
                                try:
                                    chunk = json.loads(data)
                                    if chunk.get('choices') and chunk['choices'][0].get('delta', {}).get('content'):
                                        content = chunk['choices'][0]['delta']['content']
                                        full_content += content
                                except json.JSONDecodeError:
                                    continue

                    return {
                        "success": True,
                        "result": full_content,
                        "query": query,
                        "model": "sonar-pro",
                        "streamed": True
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
    """Use Perplexity Reasoning Pro for complex reasoning and multi-criteria analysis with streaming support"""
    import os
    import aiohttp
    import json

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
            "stream": True  # Enable streaming for progressive responses
        }

        # Add optional search filters
        if search_filter:
            payload["search_filter"] = search_filter
        if search_domain_filter:
            payload["search_domain_filter"] = search_domain_filter

        async with aiohttp.ClientSession() as session:
            async with session.post(
                "https://api.perplexity.ai/chat/completions",
                headers=headers,
                json=payload
            ) as response:
                if response.status == 200:
                    # Process streaming response
                    full_content = ""
                    reasoning_content = ""

                    async for line in response.content:
                        line = line.decode('utf-8').strip()
                        if line.startswith('data: '):
                            data = line[6:]  # Remove 'data: ' prefix
                            if data == '[DONE]':
                                break
                            if data:
                                try:
                                    chunk = json.loads(data)
                                    if chunk.get('choices') and chunk['choices'][0].get('delta', {}).get('content'):
                                        content = chunk['choices'][0]['delta']['content']
                                        full_content += content

                                        # Extract reasoning tokens if present (sonar-reasoning-pro specific)
                                        if '<think>' in content or '</think>' in content:
                                            reasoning_content += content

                                except json.JSONDecodeError:
                                    continue

                    return {
                        "success": True,
                        "result": full_content,
                        "reasoning": reasoning_content.strip() if reasoning_content else None,
                        "query": query,
                        "model": "sonar-reasoning",
                        "streamed": True
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
    """Use Perplexity Deep Research for exhaustive single-topic research with streaming support"""
    import os
    import aiohttp
    import json

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
            "stream": True,  # Enable streaming for progressive responses
            "reasoning_effort": reasoning_effort  # Let Claude decide
        }

        # Log the start of deep research
        logger.info(f"Starting Perplexity Deep Research with effort: {reasoning_effort}")

        async with aiohttp.ClientSession() as session:
            async with session.post(
                "https://api.perplexity.ai/chat/completions",
                headers=headers,
                json=payload
            ) as response:
                if response.status == 200:
                    # Process streaming response
                    full_content = ""
                    citations = []
                    search_results = []
                    usage_stats = {}

                    async for line in response.content:
                        line = line.decode('utf-8').strip()
                        if line.startswith('data: '):
                            data = line[6:]  # Remove 'data: ' prefix
                            if data == '[DONE]':
                                break
                            if data:
                                try:
                                    chunk = json.loads(data)
                                    if chunk.get('choices') and chunk['choices'][0].get('delta', {}).get('content'):
                                        content = chunk['choices'][0]['delta']['content']
                                        full_content += content

                                    # Extract metadata from final chunk
                                    if chunk.get('usage'):
                                        usage_stats = chunk['usage']
                                    if chunk.get('citations'):
                                        citations = chunk['citations']
                                    if chunk.get('search_results'):
                                        search_results = chunk['search_results']

                                except json.JSONDecodeError:
                                    continue

                    logger.info(f"Perplexity Deep Research completed successfully")
                    return {
                        "success": True,
                        "result": full_content,
                        "citations": citations,
                        "search_results": search_results,
                        "usage": usage_stats,
                        "query": query,
                        "model": "sonar-deep-research",
                        "reasoning_effort": reasoning_effort,
                        "streamed": True
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



# Import proper Claude Code SDK implementation
from backend.agents.claudeAgent.claude_tools.claude_code_sdk_v2 import (
    use_claude_code,
    stream_claude_code,
    continue_claude_code_session,
    execute_claude_code_plan,
    list_claude_code_sessions,
    get_claude_code_session,
    clear_claude_code_sessions,
    start_maintenance_tasks
)

# Tool registry
TOOLS = {
    "use_claude_code": {
        "function": use_claude_code,
        "description": "Use Claude Code SDK to create, debug, test, or deploy code with multi-turn conversation support",
        "parameters": {
            "prompt": {
                "type": "string",
                "description": "The task or prompt to execute with Claude Code",
                "required": True
            },
            "max_turns": {
                "type": "integer",
                "description": "Maximum conversation turns (default: 5)",
                "required": False
            },
            "session_id": {
                "type": "string",
                "description": "Optional session ID for continuing a conversation",
                "required": False
            },
            "continue_session": {
                "type": "boolean",
                "description": "Whether to continue an existing session",
                "required": False
            },
            "mode": {
                "type": "string",
                "description": "Mode of operation: create, test, debug, or deploy (default: create)",
                "required": False
            }
        }
    },
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
    "list_subagents": {
        "function": list_subagents,
        "description": "List the preconfigured subagents available to assist the main agent.",
        "parameters": {}
    },
    "run_subagent": {
        "function": run_subagent,
        "description": "Run a single subagent on a task with optional context and tool overrides. Returns structured JSON.",
        "parameters": {
            "name": {"type": "string", "description": "Subagent name (e.g., InsuranceNavigator)", "required": True},
            "task": {"type": "string", "description": "Task for the subagent", "required": True},
            "context": {"type": "object", "description": "Optional JSON context for the task", "required": False},
            "allowed_tools_override": {"type": "array", "description": "Optional list of tool names to restrict this run", "required": False},
            "disable_mcp": {"type": "boolean", "description": "When true, disable all MCP servers (e.g., Telnyx) for this subagent run", "required": False, "default": True}
        }
    },
    "run_subagents": {
        "function": run_subagents,
        "description": "Run a team of subagents in parallel and aggregate findings/actions/next_steps with a recommendation.",
        "parameters": {
            "task": {"type": "string", "description": "Task for the team", "required": True},
            "team": {"type": "array", "description": "Optional list of subagent names to use", "required": False},
            "context": {"type": "object", "description": "Optional JSON context shared to all subagents", "required": False},
            "parallel": {"type": "boolean", "description": "Run subagents in parallel (default true)", "required": False, "default": True},
            "aggregation": {"type": "string", "description": "Aggregation strategy: 'consensus' | 'best_savings' | 'speed'", "required": False, "default": "consensus"},
            "disable_mcp": {"type": "boolean", "description": "When true, disable all MCP servers for all subagent runs in this team call", "required": False, "default": True}
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
    "provider_search": {
        "function": provider_search,
        "description": "Find healthcare providers (top N) by specialty, location, insurance, and preferences. Returns structured results for UI rendering.",
        "parameters": {
            "specialty": {
                "type": "string",
                "description": "Provider specialty (e.g., 'Primary Care', 'Rheumatology')",
                "required": True
            },
            "location": {
                "type": "string",
                "description": "City, state or address to search near",
                "required": True
            },
            "insurance": {
                "type": "string",
                "description": "Insurance plan or payer name (optional)",
                "required": False
            },
            "preferences": {
                "type": "object",
                "description": "Optional preferences (languages, gender_preference, telehealth, accepting_new_patients, distance_miles)",
                "required": False
            },
            "top_n": {
                "type": "integer",
                "description": "Number of providers to return (default 5)",
                "required": False,
                "default": 5
            }
        }
    },
    "list_subagents": {
        "function": list_subagents,
        "description": "List the preconfigured subagents available to assist the main agent.",
        "parameters": {}
    },
    "run_subagent": {
        "function": run_subagent,
        "description": "Run a single subagent on a task with optional context and tool overrides. Returns structured JSON.",
        "parameters": {
            "name": {"type": "string", "description": "Subagent name (e.g., InsuranceNavigator)", "required": True},
            "task": {"type": "string", "description": "Task for the subagent", "required": True},
            "context": {"type": "object", "description": "Optional JSON context for the task", "required": False},
            "allowed_tools_override": {"type": "array", "description": "Optional list of tool names to restrict this run", "required": False}
        }
    },
    "run_subagents": {
        "function": run_subagents,
        "description": "Run a team of subagents in parallel and aggregate findings/actions/next_steps with a recommendation.",
        "parameters": {
            "task": {"type": "string", "description": "Task for the team", "required": True},
            "team": {"type": "array", "description": "Optional list of subagent names to use", "required": False},
            "context": {"type": "object", "description": "Optional JSON context shared to all subagents", "required": False},
            "parallel": {"type": "boolean", "description": "Run subagents in parallel (default true)", "required": False, "default": True},
            "aggregation": {"type": "string", "description": "Aggregation strategy: 'consensus' | 'best_savings' | 'speed'", "required": False, "default": "consensus"}
        }
    },
    "register_subagent": {
        "function": register_subagent,
        "description": "Create a new custom subagent at runtime and persist it to the registry.",
        "parameters": {
            "name": {"type": "string", "description": "Unique subagent name (cannot collide with core)", "required": True},
            "description": {"type": "string", "description": "Short description of the agent's role", "required": True},
            "role_goal": {"type": "string", "description": "Primary goal for the agent", "required": True},
            "allowed_tools": {"type": "array", "description": "Allowed custom tool names for this agent", "required": True},
            "instruction_suffix": {"type": "string", "description": "Optional system prompt suffix; defaults to JSON-output instruction", "required": False}
        }
    },
    "update_subagent": {
        "function": update_subagent,
        "description": "Update a custom subagent's metadata or allowed tools.",
        "parameters": {
            "name": {"type": "string", "description": "Existing custom subagent name", "required": True},
            "description": {"type": "string", "description": "New description", "required": False},
            "role_goal": {"type": "string", "description": "New role goal", "required": False},
            "allowed_tools": {"type": "array", "description": "New allowed tool names", "required": False},
            "instruction_suffix": {"type": "string", "description": "New instruction suffix", "required": False}
        }
    },
    "delete_subagent": {
        "function": delete_subagent,
        "description": "Delete a custom subagent from the registry.",
        "parameters": {
            "name": {"type": "string", "description": "Custom subagent name to delete", "required": True}
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
        "description": "Execute code using Anthropic's sandboxed environment with optional file creation and download capabilities",
        "parameters": {
            "code": {
                "type": "string",
                "description": "The code to execute",
                "required": True
            },
            "language": {
                "type": "string",
                "description": "Programming language (python, javascript, etc.)",
                "required": False,
                "default": "python"
            },
            "create_files": {
                "type": "boolean",
                "description": "Whether to allow file creation during code execution",
                "required": False,
                "default": False
            },
            "download_files": {
                "type": "boolean",
                "description": "Whether to download any files created during execution",
                "required": False,
                "default": False
            }
        }
    },
    "create_data_visualization": {
        "function": create_data_visualization,
        "description": "Create a data visualization using matplotlib and save it as an image file. The code will be wrapped with necessary imports and save commands.",
        "parameters": {
            "plot_code": {
                "type": "string",
                "description": "The matplotlib plotting code (e.g., plt.plot([1,2,3], [4,5,6])). Don't include imports or plt.savefig()",
                "required": True
            },
            "filename": {
                "type": "string",
                "description": "Output filename for the visualization (e.g., 'chart.png')",
                "required": False,
                "default": "visualization.png"
            }
        }
    },
    "analyze_data_with_output": {
        "function": analyze_data_with_output,
        "description": "Execute data analysis code using pandas and save results. Your code should create a DataFrame named 'df' that will be saved in the specified format.",
        "parameters": {
            "analysis_code": {
                "type": "string",
                "description": "The data analysis code. Should create a pandas DataFrame named 'df' with the results",
                "required": True
            },
            "output_format": {
                "type": "string",
                "description": "Output format for the results: 'csv', 'json', or 'xlsx'",
                "required": False,
                "default": "csv"
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
    },
    # Multi-Agent Orchestration Tools (Anthropic-style)
    "spawn_healthcare_agent": {
        "function": spawn_healthcare_agent,
        "description": "Spawn a specialized healthcare agent with custom system prompt and tools. Enables Anthropic-style multi-agent orchestration where the main Claude can delegate specific tasks to specialized subagents.",
        "parameters": {
            "agent_id": {
                "type": "string",
                "description": "Unique identifier for this agent instance",
                "required": True
            },
            "specialty": {
                "type": "string", 
                "description": "Agent specialty: 'insurance_researcher', 'clinical_researcher', 'patient_advocate', 'pharmacy_specialist', or 'appeals_specialist'",
                "required": True
            },
            "task": {
                "type": "string",
                "description": "Specific task for this agent to accomplish",
                "required": True
            },
            "allowed_tools": {
                "type": "array",
                "description": "List of tool names this agent is allowed to use",
                "required": True
            },
            "context": {
                "type": "object",
                "description": "Optional context information for the agent",
                "required": False
            }
        }
    },
    "execute_spawned_agent": {
        "function": execute_spawned_agent,
        "description": "Execute a previously spawned agent in its own context window. This creates a separate Claude conversation for the agent.",
        "parameters": {
            "agent_id": {
                "type": "string",
                "description": "ID of the agent to execute",
                "required": True
            }
        }
    },
    "execute_agent_team": {
        "function": execute_agent_team,
        "description": "Execute multiple spawned agents in parallel (Anthropic's multi-agent pattern). All agents run concurrently in separate context windows.",
        "parameters": {
            "agent_ids": {
                "type": "array",
                "description": "List of agent IDs to execute in parallel",
                "required": True
            }
        }
    },
    "execute_agent_pipeline": {
        "function": execute_agent_pipeline,
        "description": "Execute a predefined agent pipeline where agents hand off work sequentially. Available chains: research_chain (Research→Data→Writer→QA), analysis_chain (Data→Visualization→Report), medical_chain (Clinical→FDA→Recommendations), simple_chain (Research→Writer)",
        "parameters": {
            "chain_name": {
                "type": "string",
                "description": "Name of the pipeline to execute: 'research_chain', 'analysis_chain', 'medical_chain', or 'simple_chain'",
                "required": True
            },
            "initial_task": {
                "type": "string",
                "description": "The task to start the pipeline with",
                "required": True
            },
            "context": {
                "type": "object",
                "description": "Optional context to pass to the pipeline",
                "required": False
            }
        }
    },
    "orchestrate_healthcare_task": {
        "function": orchestrate_healthcare_task,
        "description": "High-level orchestration tool that mimics Anthropic's research system. Automatically spawns specialized agents, executes them in parallel, and aggregates results.",
        "parameters": {
            "task": {
                "type": "string",
                "description": "The healthcare task to orchestrate across multiple agents",
                "required": True
            },
            "specialties": {
                "type": "array",
                "description": "List of agent specialties to use (e.g., ['insurance_researcher', 'clinical_researcher'])",
                "required": True
            },
            "context": {
                "type": "object",
                "description": "Optional context to share across all agents",
                "required": False
            },
            "parallel": {
                "type": "boolean",
                "description": "Whether to execute agents in parallel (default: true)",
                "required": False,
                "default": True
            }
        }
    },
    "check_agent_status": {
        "function": check_agent_status,
        "description": "Check the status of a spawned agent",
        "parameters": {
            "agent_id": {
                "type": "string",
                "description": "ID of the agent to check",
                "required": True
            }
        }
    },
    "cleanup_completed_agent": {
        "function": cleanup_completed_agent,
        "description": "Clean up a completed agent from memory",
        "parameters": {
            "agent_id": {
                "type": "string", 
                "description": "ID of the agent to clean up",
                "required": True
            }
        }
    }
    # Brave Search tools removed - accessed through MCP server
    # computer_use removed - should be enabled as native Claude capability, not a recursive tool
}




def get_tool_definitions_for_claude():
    """Get tool definitions in Claude's expected format using standardizer"""
    from .tool_standardizer import standardize_tools_for_claude
    
    # Merge in unified agent tools
    all_tools = {**TOOLS, **get_unified_agent_tool_definitions()}
    
    # Convert to list format for standardizer
    tool_list = []
    for name, meta in all_tools.items():
        tool_def = {
            "name": name,
            "description": meta["description"],
            "parameters": meta["parameters"]  # Standardizer will handle both formats
        }
        tool_list.append(tool_def)
    
    # Use standardizer to ensure proper format
    standardized = standardize_tools_for_claude(tool_list, add_cache_control=False)
    
    return standardized


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




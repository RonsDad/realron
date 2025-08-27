"""
FastAPI Backend for Claude Sonnet 4 Healthcare Agent
Exposes all Claude 4 capabilities through REST API endpoints
"""

import logging
from dotenv import load_dotenv
import os

# Load environment variables - project root .env FIRST, then backend/.env as override
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"))
BACKEND_ENV_PATH = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(BACKEND_ENV_PATH)
from fastapi import FastAPI, HTTPException, UploadFile, File, BackgroundTasks, WebSocket, WebSocketDisconnect, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import asyncio
import json
import os
from datetime import datetime
import tempfile
import shutil
from browser_use import Agent, BrowserSession, BrowserProfile
from browser_use.llm import ChatOpenAI
import httpx
import anthropic

# Also load project-level .env if present
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('api.log')
    ]
)
logger = logging.getLogger(__name__)

try:
    from backend.agents.claudeAgent.claude_completions import ClaudeCompletions
    logger.info("Claude completions module imported successfully")
except Exception as e:
    logger.error(f"Failed to import Claude completions: {e}")
    ClaudeCompletions = None
from backend.agents.claudeAgent.claude_tools.browser_use.browser_live_url_manager import live_url_manager

# Import tools
try:
    from backend.agents.claudeAgent.claude_tools.tools import get_tool_definitions_for_claude, execute_tool
    TOOLS_AVAILABLE = True
except ImportError as e:
    logger.warning(f"Tools not available: {e}")
    TOOLS_AVAILABLE = False

# Optional imports - disable for now to focus on completions
try:
    from backend.agents.claudeAgent.claude_tools.clinical_agent.healthcare_agent_integration import HealthcareAgentIntegration
    from backend.agents.claudeAgent.claude_tools.browser_use.claude_browser_integration import ClaudeBrowserIntegration
    ADVANCED_FEATURES = True
except ImportError:
    ADVANCED_FEATURES = False

# Browser-Use Integration (always available)
try:
    from backend.agents.claudeAgent.claude_tools.browser_use.browser_use_service import browser_use_service, BrowserUseService
    BROWSER_USE_AVAILABLE = True
    logger.info("Browser-Use service imported successfully")
except ImportError as e:
    BROWSER_USE_AVAILABLE = False
    logger.warning(f"Browser-Use service not available: {e}")

# Claude Code SDK Integration for Tool Generation
try:
    # from backend.agents.claudeAgent.claude_tools.claude_code_sdk.api_integration import claude_code_api  # Module moved to claude_code_sdk_integration
    CLAUDE_CODE_SDK_AVAILABLE = True
    logger.info("Claude Code SDK integration loaded successfully")
except ImportError as e:
    CLAUDE_CODE_SDK_AVAILABLE = False
    logger.warning(f"Claude Code SDK not available: {e}")
    claude_code_api = None

# Deep Research Agent Integration - ALWAYS ENABLED
DEEP_RESEARCH_AVAILABLE = True
deep_research_root_agent = None
if True:  # Always enable
    try:
        # Import using the wrapper which handles all the path and import logic
        from backend.agents.deepResearch.deep_research_integration import root_agent as deep_research_root_agent
        DEEP_RESEARCH_AVAILABLE = deep_research_root_agent is not None
        if DEEP_RESEARCH_AVAILABLE:
            from google.adk.runners import InMemoryRunner
            from google.adk.agents import RunConfig
            from google.adk.agents import LiveRequestQueue
            from google.genai import types as genai_types
            logger.info("Deep Research Agent loaded successfully!")
        else:
            logger.warning("Deep Research Agent wrapper imported but no root_agent was found")
            deep_research_root_agent = None
    except Exception as e:
        logger.warning(f"Deep Research Agent unavailable: {e}")
        DEEP_RESEARCH_AVAILABLE = False
        deep_research_root_agent = None

# Agent stage mapping for human-readable names
AGENT_STAGES = {
    "plan_generator": "📝 Planning Research Strategy", 
    "section_planner": "📋 Designing Report Structure",
    "enhanced_section_researcher": "🔍 Deep Research Phase",
    "research_evaluator": "✅ Quality Review",
    "enhanced_search_executor": "🔎 Enhanced Research",
    "escalation_checker": "⚡ Quality Check",
    "section_expander": "📚 Expanding Research Findings",
    "report_composer_early_sections": "📄 Writing Foundation (Sections 1-4)",
    "report_composer_later_sections": "📄 Writing Analysis (Sections 5+)",
    "report_merger": "🔗 Merging Report Sections",
    "report_composer_with_citations": "📄 Writing Final Report",
    "interactive_planner_agent": "🤖 Research Assistant",
    "research_pipeline": "🚀 Research Pipeline",
    "iterative_refinement_loop": "🔄 Refinement Process"
}

# Initialize FastAPI app
app = FastAPI(
    title="Claude Sonnet 4 Healthcare API",
    description="API for Claude Sonnet 4 with all native tools and healthcare integration",
    version="1.0.0"
)

# Configure CORS with proper SSE support
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Next.js dev server
        "http://localhost:3001",  # Alternative dev port
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://192.168.86.25:3000",  # Network IP address
        "http://192.168.86.25:3001",  # Network IP address alternative port
        "https://localhost:3000", # HTTPS variants
        "https://localhost:3001",
        "https://ron-ai.vercel.app", # Production
        "https://*.vercel.app" # Vercel previews
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"],
    allow_headers=[
        "*",
        "Content-Type",
        "Authorization",
        "Cache-Control",
        "Accept",
        "Accept-Encoding",
        "Connection",
        "Keep-Alive",
        "X-Requested-With"
    ],
    expose_headers=[
        "Content-Type",
        "Cache-Control", 
        "Connection",
        "Keep-Alive"
    ]
)

# Initialize agents
logger.info("Initializing Claude completions agent...")
if ClaudeCompletions is not None:
    try:
        claude_agent = ClaudeCompletions()
        logger.info("Claude agent initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize Claude agent: {e}")
        claude_agent = None
else:
    logger.error("ClaudeCompletions class not available")
    claude_agent = None

if ADVANCED_FEATURES:
    logger.info("Initializing healthcare agent...")
    healthcare_agent = HealthcareAgentIntegration()
    logger.info("Initializing browser integration...")
    browser_integration = ClaudeBrowserIntegration()
    logger.info("All agents initialized successfully")
else:
    logger.info("Advanced features disabled - completions only mode")
    healthcare_agent = None
    browser_integration = None


# Pydantic models for request/response
class ChatMessage(BaseModel):
    role: str = Field(..., description="Message role (user/assistant)")
    content: str = Field(..., description="Message content")


class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    system_prompt: Optional[str] = None
    temperature: float = Field(0.0, ge=0.0, le=1.0)
    max_tokens: int = Field(32000, gt=0)  # Set to 32,000 for comprehensive responses
    enable_caching: bool = True
    cache_ttl: str = Field("5m", pattern="^(5m|1h)$")
    enable_thinking: bool = True
    thinking_budget: int = Field(20000, gt=0)  # Set to 20,000 thinking tokens
    enable_citations: bool = True
    stream: bool = False
    tools: List[str] = Field(
        default_factory=lambda: [
            "text_editor", "web_search",
            "create_browser_session", "browser_use",
            "perplexity_sonar_pro", "perplexity_reasoning_pro", "perplexity_deep_research",
            "clinical_operations", "pubmed_search", "searchDrugLabel"
        ],
        description="List of tools to enable. Available tools: bash, text_editor, web_search, execute_code, create_browser_session, browser_use, reuse_browser_session, check_browser_session, perplexity_deep_research, perplexity_reasoning_pro, perplexity_sonar_pro, clinical_operations, pubmed_search, pubmed_fetch_abstracts, pubmed_fetch_summaries, pubmed_fetch_related, pubmed_fetch_citations, pubmed_search_clinical_trials, pubmed_mesh_search, searchDrugLabel, searchAdverseEffects, getSpecialPopulations, getBoxedWarning, getDrugInteractions, getAbuse, getAbuseTable, getActiveIngredient, getAdverseReactions, getClinicalPharmacology, getContraindications, getDescription, getDosageAndAdministration, getWarnings, getPregnancy, getPediatricUse, getGeriatricUse, getIndicationsAndUsage, getMechanismOfAction, getOverdosage, getPharmacokinetics, getControlledSubstance, getNursingMothers"
    )


class HealthcareTaskRequest(BaseModel):
    task_description: str
    use_browser: bool = True
    enable_extended_thinking: bool = True
    enable_web_search: bool = True
    file_ids: Optional[List[str]] = None


class CodeExecutionRequest(BaseModel):
    code_task: str
    verify_output: bool = True
    enable_thinking: bool = True
    thinking_budget: int = Field(20000, gt=0)


class WebSearchRequest(BaseModel):
    query: str
    num_results: int = Field(5, gt=0, le=20)
    analyze: bool = True


class FileAnalysisRequest(BaseModel):
    task: str
    file_ids: List[str]
    enable_thinking: bool = True


class BrowserTaskRequest(BaseModel):
    task: str
    context: Optional[Dict[str, Any]] = None


class DeepResearchRequest(BaseModel):
    message: str  # The actual message text
    userId: str
    sessionId: str
    appName: Optional[str] = "deep_research_app"  # Keep for compatibility




# Browser-Use specific request models
class BrowserUseCreateSessionRequest(BaseModel):
    timeout_ms: int = Field(900000, gt=0)  # 15 minutes default


class BrowserUseNavigateRequest(BaseModel):
    session_id: str
    url: str


class BrowserUseTaskRequest(BaseModel):
    task: str


class BrowserUseCreateWithURLRequest(BaseModel):
    url: str
    timeout_ms: int = Field(900000, gt=0)  # 15 minutes default
# MCP Connector test models
class MCPConnectorTestRequest(BaseModel):
    server_url: Optional[str] = None
    server_name: str = Field(default="telnyx")
    authorization_token: Optional[str] = None
    prompt: str = Field(
        default=(
            "List only the names of tools available from the MCP server as a JSON array. "
            "If you cannot connect, reply with the single word 'unavailable'."
        )
    )

class MCPConnectorTestResponse(BaseModel):
    success: bool
    reason: Optional[str] = None
    http_status: Optional[int] = None
    raw: Optional[Dict[str, Any]] = None


class AgentToolRequest(BaseModel):
    """Request to execute an agent orchestration tool with streaming"""
    tool_name: str
    tool_input: Dict[str, Any]
    stream: bool = Field(default=True, description="Whether to stream results")


# File storage (in production, use proper storage like S3)
UPLOAD_DIR = "/tmp/claude_uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)
uploaded_files: Dict[str, str] = {}

# App constants for deep research
APP_NAME = "deep_research_app"

# Simple AGENT_STAGES mapping to track which agent is currently running
AGENT_STAGES = {
    "medical_researcher": "Medical Research",
    "deep_reasoning_researcher": "Deep Analysis", 
    "hybrid_medical_researcher": "Hybrid Analysis",
    "sonar_pro_researcher": "Web Search",
    "sonar_reasoning_researcher": "Reasoning Analysis",
    "sonar_deep_research_agent": "Deep Research",
    "browser_scraping_researcher": "Browser Research",
    "browser_initial_researcher": "Initial Browser Research",
    "fda_drug_researcher": "FDA Research",
    "browser_mcp_deep_researcher": "Advanced Browser Research",
    "research_coordinator": "Research Coordination",
    "quality_evaluator": "Quality Evaluation",
    "report_generator": "Report Generation",
    "unknown": "Processing"
}

# In-memory session store for browser-use integration (replace with Redis/DB for production)
browser_sessions: Dict[str, Dict] = {}

class ConnectionManager:
	def __init__(self):
		self.active_connections: dict[str, set[WebSocket]] = {}

	async def connect(self, session_id: str, websocket: WebSocket):
		await websocket.accept()
		self.active_connections.setdefault(session_id, set()).add(websocket)

	def disconnect(self, session_id: str, websocket: WebSocket):
		conns = self.active_connections.get(session_id)
		if conns:
			conns.discard(websocket)
			if not conns:
				del self.active_connections[session_id]

	async def broadcast(self, session_id: str, message: str):
		for ws in self.active_connections.get(session_id, set()):
			try:
				await ws.send_text(message)
			except Exception as e:
				logging.error(f"WebSocket send error: {e}")

ws_manager = ConnectionManager()

# Browser agent creation and management functions - NOW USES CENTRALIZED SERVICE
async def create_browser_agent(task: str, session_id: str):
	"""Create browser agent using centralized browser_use_service"""
	try:
		# Create browser profile
		profile = BrowserProfile(
			stealth=True,
			headless=False,
			viewport={"width": 1280, "height": 900},
			wait_between_actions=0.1,  # Reduced from 0.3 for faster actions
		)
		
		# Use centralized service to create session
		session_result = await browser_use_service.create_live_url_session(
			timeout_ms=900000,  # 15 minutes
			browser_profile=profile,
			interactive=False  # Agent stays in control
		)
		
		new_session_id = session_result['session_id']
		live_url = session_result['live_url']
		
		# Store in local tracking for WebSocket compatibility
		browser_sessions[session_id] = {
			"service_session_id": new_session_id,
			"live_url": live_url,
			"recording": True,
			"human_in_control": False,
			"agent_running": False,
			"task": task,  # Store task for later use
		}
		
		await ws_manager.broadcast(session_id, json.dumps({"event": "session_started", "live_url": live_url}))
		
		# Execute the task
		await browser_use_service.execute_browser_task(new_session_id, task)
		
		return live_url
	except Exception as e:
		logging.error(f"Error creating browser agent for session {session_id}: {e}")
		raise

async def stop_recording_and_close(session_id: str):
	session = browser_sessions.get(session_id)
	if not session:
		logging.warning(f"Session {session_id} not found for stop_recording_and_close")
		return None
	
	service_session_id = session.get("service_session_id")
	if service_session_id:
		try:
			# Close through centralized service
			await browser_use_service.close_session(service_session_id)
			await ws_manager.broadcast(session_id, json.dumps({"event": "session_stopped"}))
		except Exception as e:
			logging.error(f"Error closing session {session_id}: {e}")
		finally:
			del browser_sessions[session_id]
	
	return None  # Recording handled by service

async def run_agent_safe(session, session_id):
	"""Run agent using centralized browser service"""
	try:
		service_session_id = session.get("service_session_id")
		if not service_session_id:
			raise ValueError(f"No service session ID found for session {session_id}")
		
		# Get the task from session or use a default
		task = session.get("task", "Continue with the current task")
		
		# Execute task through centralized service
		await browser_use_service.execute_browser_task(service_session_id, task)
		await ws_manager.broadcast(session_id, json.dumps({"event": "agent_run_complete"}))
	except Exception as e:
		logging.error(f"Error running agent for session {session_id}: {e}")
		await ws_manager.broadcast(session_id, json.dumps({"event": "agent_error", "error": str(e)}))
	finally:
		session["agent_running"] = False

async def run_browser_use_agent(task: str):
	"""Run the browser-use agent with the given task using centralized service"""
	try:
		# Check for existing sessions first
		active_sessions = await browser_use_service.list_active_sessions()
		
		if active_sessions['total_sessions'] > 0:
			# Use existing session
			session_id = list(active_sessions['sessions'].keys())[0]
			logger.info(f"Using existing browser session: {session_id}")
			result = await browser_use_service.execute_browser_task(session_id, task)
		else:
			# Create new session
			profile = BrowserProfile(
				stealth=True,
				headless=False,
				viewport={"width": 1280, "height": 900},
				wait_between_actions=0.1,
			)
			
			session_result = await browser_use_service.create_live_url_session(
				timeout_ms=900000,
				browser_profile=profile,
				interactive=False
			)
			
			session_id = session_result['session_id']
			logger.info(f"Created new browser session: {session_id}")
			
			# Execute task
			result = await browser_use_service.execute_browser_task(session_id, task)
		
		logger.info("Browser-use agent completed successfully")
		return result

	except Exception as e:
		logger.error(f"Error running browser-use agent: {str(e)}")
		raise


@app.get("/")
async def root():
    """API root endpoint with capabilities overview."""
    return {
        "service": "Claude Sonnet 4 Healthcare API",
        "model": "claude-sonnet-4-20250514",
        "browser_model": "claude-sonnet-4-20250514",
        "capabilities": {
            "native_tools": [
                "bash_execution",
                "code_execution",
                "computer_use",
                "text_editor"
            ],
            "custom_tools": [
                # Browser tools
                "create_browser_session",
                "browser_use",
                "reuse_browser_session",
                "check_browser_session",
                # Perplexity tools
                "perplexity_deep_research",
                "perplexity_reasoning_pro",
                "perplexity_sonar_pro",
                # Clinical and general tools
                "clinical_operations",
                "web_search",
                "execute_code",
                # PubMed tools
                "pubmed_search",
                "pubmed_fetch_abstracts",
                "pubmed_fetch_summaries",
                "pubmed_fetch_related",
                "pubmed_fetch_citations",
                "pubmed_search_clinical_trials",
                "pubmed_mesh_search",
                # FDA tools
                "searchDrugLabel",
                "searchAdverseEffects",
                "getSpecialPopulations",
                "getBoxedWarning",
                "getDrugInteractions",
                "getAbuse",
                "getAbuseTable",
                "getActiveIngredient",
                "getAdverseReactions",
                "getClinicalPharmacology",
                "getContraindications",
                "getDescription",
                "getDosageAndAdministration",
                "getWarnings",
                "getPregnancy",
                "getPediatricUse",
                "getGeriatricUse",
                "getIndicationsAndUsage",
                "getMechanismOfAction",
                "getOverdosage",
                "getPharmacokinetics",
                "getControlledSubstance",
                "getNursingMothers"
            ],
            "features": [
                "prompt_caching",
                "extended_thinking",
                "streaming_messages",
                "citations",
                "multilingual_support",
                "vision",
                "pdf_support",
                "files_api",
                "search_results",
                "browser_automation"
            ],
            "hallucination_mitigation": True,
            "browser_automation": "Claude Opus 4",
            "deep_research": DEEP_RESEARCH_AVAILABLE,
            "browser_use_integration": BROWSER_USE_AVAILABLE
        },
        "endpoints": {
            "chat": "/chat",
            "healthcare_task": "/healthcare/task",
            "healthcare_browser": "/healthcare/browser",
            "code_execution": "/code/execute",
            "web_search": "/search",
            "file_upload": "/files/upload",
            "file_analysis": "/files/analyze",
            "deep_research": "/api/run_sse" if DEEP_RESEARCH_AVAILABLE else None,
            "deep_research_session": "/api/apps/{app}/users/{user}/sessions" if DEEP_RESEARCH_AVAILABLE else None,
            "browser_use_create_session": "/browser-use/session/create" if BROWSER_USE_AVAILABLE else None,
            "browser_use_create_with_url": "/browser-use/session/create-with-url" if BROWSER_USE_AVAILABLE else None,
            "browser_use_navigate": "/browser-use/session/{session_id}/navigate" if BROWSER_USE_AVAILABLE else None,
            "browser_use_task": "/browser-use/session/{session_id}/task" if BROWSER_USE_AVAILABLE else None,
            "browser_use_info": "/browser-use/session/{session_id}/info" if BROWSER_USE_AVAILABLE else None,
            "browser_use_sessions": "/browser-use/sessions" if BROWSER_USE_AVAILABLE else None,
            "browser_use_close": "/browser-use/session/{session_id}/close" if BROWSER_USE_AVAILABLE else None,
            "browser_use_close_all": "/browser-use/sessions/close-all" if BROWSER_USE_AVAILABLE else None,
            "tool_generate": "/tools/generate" if CLAUDE_CODE_SDK_AVAILABLE else None,
            "tool_generate_stream": "/tools/generate/stream" if CLAUDE_CODE_SDK_AVAILABLE else None,
            "tool_get": "/tools/{tool_id}" if CLAUDE_CODE_SDK_AVAILABLE else None,
            "tool_share": "/tools/share/{tool_id}" if CLAUDE_CODE_SDK_AVAILABLE else None,
            "tool_list": "/tools/patient/{patient_id}" if CLAUDE_CODE_SDK_AVAILABLE else None,
            "start_session": "/start-session",
            "take_control": "/take-control",
            "relinquish_control": "/relinquish-control",
            "stop_session": "/stop-session",
            "websocket": "/ws/{session_id}"
        }
    }


@app.post("/chat")
async def chat(request: ChatRequest):
    """
    Main chat endpoint with full Claude 4 capabilities.
    Supports all native tools and features with interleaved thinking.
    """
    try:
        logger.info(f"Raw request data: {request}")
        logger.info(f"Request type: {type(request)}")
        logger.info(f"Request.messages type: {type(request.messages)}")
        logger.info(f"Received chat request with {len(request.messages)} messages")
        if request.messages:
            logger.info(f"First message type: {type(request.messages[0])}")
            logger.info(f"First message: {request.messages[0]}")
        logger.info(f"Request config: stream={request.stream}, thinking={request.enable_thinking}, tools={request.tools}")
        logger.info(f"TOOLS_AVAILABLE: {TOOLS_AVAILABLE}")
        if claude_agent is None:
            raise HTTPException(status_code=503, detail="Claude agent not initialized. Check ANTHROPIC_API_KEY.")
        
        logger.info(f"Processing messages...")
        # Convert messages to format expected by Claude
        # Handle both ChatMessage objects and plain dicts
        messages = []
        for i, msg in enumerate(request.messages):
            logger.info(f"Message {i}: type={type(msg)}, content={msg}")
            if isinstance(msg, dict):
                messages.append({"role": msg["role"], "content": msg["content"]})
            elif isinstance(msg, ChatMessage):
                messages.append({"role": msg.role, "content": msg.content})
            else:
                logger.error(f"Unknown message type: {type(msg)}")
                raise ValueError(f"Unknown message type: {type(msg)}")
        logger.info(f"Converted {len(messages)} messages")
        
        # Determine system prompt (don't add to messages array - pass as system parameter)
        system_prompt = request.system_prompt if request.system_prompt else None
        # Note: claude_agent.stream_complete() will use its default healthcare system prompt if system_prompt is None
        
        # Build tools list - Claude ALWAYS gets ALL his tools
        native_tools = []
        
        # ALWAYS give Claude ALL tools - he decides what to use
        enabled_tools = []
        if TOOLS_AVAILABLE:
            enabled_tools.extend(get_tool_definitions_for_claude())
        
        # Telnyx tools are now handled via Claude's MCP connector
        
        logger.debug(f"Giving Claude ALL {len(enabled_tools)} tools")
        
        logger.debug(f"Final tools - native: {native_tools}, custom: {[t.get('name') for t in enabled_tools]}")
        logger.debug(f"TOOLS_AVAILABLE: {TOOLS_AVAILABLE}")
        logger.debug(f"Enabled tools details: {enabled_tools}")
        
        # Handle streaming with tool execution
        if request.stream:
            logger.info("STREAMING COMPLETIONS MODE WITH TOOL EXECUTION")
            async def stream_generator():
                try:
                    # Direct streaming without unnecessary queue overhead
                    # Only use queue if live_url_manager needs it
                    if live_url_manager and hasattr(live_url_manager, 'set_event_queue'):
                        event_queue = asyncio.Queue()
                        live_url_manager.set_event_queue(event_queue)
                        
                        # Create task for the Claude stream with queue
                        async def process_claude_stream():
                            try:
                                async for event in claude_agent.stream_complete(
                                    messages=messages,
                                    max_tokens=request.max_tokens,
                                    temperature=request.temperature,
                                    enable_thinking=request.enable_thinking,
                                    thinking_budget=request.thinking_budget,
                                    tools=native_tools,  # Only native tools as strings
                                    custom_tools=enabled_tools,  # Custom tools as dicts
                                    system_prompt=system_prompt,
                                ):
                                    await event_queue.put(event)
                            finally:
                                await event_queue.put(None)  # Signal completion
                        
                        _ = asyncio.create_task(process_claude_stream())
                        
                        # Process events from queue
                        while True:
                            event = await event_queue.get()
                            if event is None:  # Stream completed
                                break
                            yield f"data: {json.dumps(event)}\n\n"
                    else:
                        # Direct streaming without queue for better performance
                        async for event in claude_agent.stream_complete(
                            messages=messages,
                            max_tokens=request.max_tokens,
                            temperature=request.temperature,
                            enable_thinking=request.enable_thinking,
                            thinking_budget=request.thinking_budget,
                            tools=native_tools,  # Only native tools as strings
                            custom_tools=enabled_tools,  # Custom tools as dicts
                            system_prompt=system_prompt,
                        ):
                            yield f"data: {json.dumps(event)}\n\n"

                except Exception as e:
                    logger.error(f"STREAMING ERROR: {str(e)}")
                    yield f"data: {json.dumps({'type': 'error', 'error': str(e)})}\n\n"
                finally:
                    # Clear the event queue
                    live_url_manager.set_event_queue(None)
            
            return StreamingResponse(
                stream_generator(),
                media_type="text/event-stream",
                headers={
                    "Cache-Control": "no-cache",
                    "Connection": "keep-alive",
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Headers": "Cache-Control",
                    "X-Accel-Buffering": "no"  # Disable nginx buffering
                }
            )
        
        # Non-streaming response - but with many tools, Anthropic requires streaming
        # So we'll force streaming when we have many tools
        if len(enabled_tools) > 10:
            # Force streaming for large tool sets
            logger.info(f"Forcing streaming mode due to {len(enabled_tools)} tools")
            request.stream = True
            
            async def stream_generator():
                try:
                    event_queue = asyncio.Queue()
                    live_url_manager.set_event_queue(event_queue)

                    async def process_claude_stream():
                        try:
                            async for event in claude_agent.stream_complete(
                                messages=messages,
                                max_tokens=request.max_tokens,
                                temperature=request.temperature,
                                enable_thinking=request.enable_thinking,
                                thinking_budget=request.thinking_budget,
                                tools=native_tools,
                                custom_tools=enabled_tools,
                                system_prompt=system_prompt,
                            ):
                                await event_queue.put(event)
                        finally:
                            await event_queue.put(None)

                    _ = asyncio.create_task(process_claude_stream())

                    while True:
                        event = await event_queue.get()
                        if event is None:
                            break
                        yield f"data: {json.dumps(event)}\n\n"

                except Exception as e:
                    logger.error(f"STREAMING ERROR: {str(e)}")
                    yield f"data: {json.dumps({'type': 'error', 'error': str(e)})}\n\n"
                finally:
                    live_url_manager.set_event_queue(None)
            
            return StreamingResponse(
                stream_generator(),
                media_type="text/event-stream",
                headers={
                    "Cache-Control": "no-cache",
                    "Connection": "keep-alive",
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Headers": "Cache-Control",
                    "X-Accel-Buffering": "no"  # Disable nginx buffering
                }
            )
        elif enabled_tools:
            # Use complete_with_tools when we have custom tools
            from backend.agents.claudeAgent.claude_tools.claude_tool_handler import handle_tool_use_in_conversation
            
            all_tools = []
            # Add native tools
            for tool in native_tools:
                if tool == "bash":
                    all_tools.append({"type": "bash_20250124", "name": "bash"})
                elif tool == "text_editor":
                    all_tools.append({"type": "text_editor_20250124", "name": "str_replace_based_edit_tool"})
            
            # Add custom tools
            all_tools.extend(enabled_tools)
            
            result = await handle_tool_use_in_conversation(messages, all_tools)
            # Ensure we return a proper dict response
            if isinstance(result, dict) and "success" in result:
                if result.get("success"):
                    return {"success": True, "response": result.get("response", result)}
                else:
                    return {"success": False, "error": result.get("error", "Unknown error")}
            return result
        else:
            # Regular completion without custom tools
            result = await claude_agent.complete(
                messages=messages,
                max_tokens=request.max_tokens,
                temperature=request.temperature,
                enable_thinking=request.enable_thinking,
                thinking_budget=request.thinking_budget
            )
            # Ensure we return a proper dict response
            if isinstance(result, dict) and "success" in result:
                if result.get("success"):
                    return {"success": True, "response": result.get("response", result)}
                else:
                    return {"success": False, "error": result.get("error", "Unknown error")}
            return result
        
    except HTTPException as he:
        # Re-raise HTTP exceptions as-is
        raise he
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        logger.error(f"Chat endpoint error: {error_details}")
        logger.error(f"Exception type: {type(e)}, Message: {str(e)}")
        # Return a more informative error
        raise HTTPException(
            status_code=500, 
            detail={
                "error": "Internal server error in chat processing",
                "message": str(e),
                "type": type(e).__name__
            }
        )


@app.post("/healthcare/task")
async def healthcare_task(request: HealthcareTaskRequest):
    """
    Execute a healthcare-specific task with browser automation and analysis.
    """
    try:
        # Convert file IDs to file paths
        file_paths = None
        if request.file_ids:
            file_paths = [
                uploaded_files.get(file_id)
                for file_id in request.file_ids
                if file_id in uploaded_files
            ]
            file_paths = [fp for fp in file_paths if fp]
        
        result = await healthcare_agent.execute_healthcare_task(
            task_description=request.task_description,
            use_browser=request.use_browser,
            enable_extended_thinking=request.enable_extended_thinking,
            enable_web_search=request.enable_web_search,
            files_to_process=file_paths
        )
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/execute-agent-tool-stream")
async def execute_agent_tool_stream(request: AgentToolRequest):
    """
    Execute agent orchestration tools with SSE streaming for full visibility.
    Streams agent spawning, thinking, tool use, and results.
    """
    logger.info(f"🤖 Executing agent tool: {request.tool_name} with streaming")
    
    async def event_stream():
        try:
            tool_name = request.tool_name
            tool_input = request.tool_input
            
            # Import here to avoid circular dependencies
            from backend.agents.claudeAgent.claude_tools.unified_agent_system_streaming import (
                StreamingUnifiedAgentSystem, execute_orchestrator_with_streaming
            )
            from backend.agents.claudeAgent.claude_tools.unified_agent_system import get_unified_system
            
            # Handle different orchestration tools
            if tool_name == "execute_with_orchestrator":
                logger.info(f"🎯 Executing orchestrator: {tool_input.get('orchestrator_id')}")
                async for event in execute_orchestrator_with_streaming(
                    tool_input.get("orchestrator_id"),
                    tool_input.get("task"),
                    tool_input.get("context")
                ):
                    yield event  # Already formatted as SSE
                    
            elif tool_name == "create_orchestrator_agent":
                # Create orchestrator and return result
                from backend.agents.claudeAgent.claude_tools.unified_agent_tools import create_orchestrator_agent
                result = await create_orchestrator_agent(
                    tool_input.get("name"),
                    tool_input.get("description"),
                    tool_input.get("custom_prompt")
                )
                yield f"data: {json.dumps({'type': 'orchestrator_created', 'result': result})}\n\n"
                
            elif tool_name == "create_worker_agent":
                # Create worker and return result
                from backend.agents.claudeAgent.claude_tools.unified_agent_tools import create_worker_agent
                result = await create_worker_agent(
                    tool_input.get("specialization"),
                    tool_input.get("name"),
                    tool_input.get("capabilities", []),
                    tool_input.get("system_prompt"),
                    tool_input.get("allowed_tools"),
                    tool_input.get("mcp_servers")
                )
                yield f"data: {json.dumps({'type': 'worker_created', 'result': result})}\n\n"
                
            elif tool_name == "execute_pipeline":
                # Execute pipeline with streaming
                from backend.agents.claudeAgent.claude_tools.unified_agent_tools import execute_pipeline
                result = await execute_pipeline(
                    tool_input.get("pipeline_name"),
                    tool_input.get("task"),
                    tool_input.get("context")
                )
                yield f"data: {json.dumps({'type': 'pipeline_result', 'result': result})}\n\n"
                
            elif tool_name == "list_available_agents":
                # List agents
                from backend.agents.claudeAgent.claude_tools.unified_agent_tools import list_available_agents
                result = await list_available_agents()
                yield f"data: {json.dumps({'type': 'agents_list', 'result': result})}\n\n"
                
            else:
                yield f"data: {json.dumps({'type': 'error', 'message': f'Unknown tool: {tool_name}'})}\n\n"
            
            # End stream
            yield "data: [DONE]\n\n"
            
        except Exception as e:
            logger.error(f"Error in agent tool stream: {e}", exc_info=True)
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
    
    return StreamingResponse(event_stream(), media_type="text/event-stream")


@app.post("/healthcare/browser")
async def healthcare_browser_task(request: BrowserTaskRequest):
    """
    Execute healthcare browser automation with streaming support.
    Claude Sonnet 4 as main agent, Claude Opus 4 for browser control.
    """
    async def event_stream():
        try:
            async for event in browser_integration.analyze_healthcare_task(
                task=request.task,
                context=request.context
            ):
                yield f"data: {json.dumps(event)}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'error': str(e)})}\n\n"
        finally:
            await browser_integration.cleanup()
    
    return StreamingResponse(event_stream(), media_type="text/event-stream")


@app.post("/code/execute")
async def execute_code(request: CodeExecutionRequest):
    """
    Execute code with Claude's code execution tool.
    """
    try:
        if claude_agent is None:
            raise HTTPException(status_code=503, detail="Claude agent not initialized. Check ANTHROPIC_API_KEY.")
        result = await claude_agent.execute_code_with_verification(
            code_task=request.code_task,
            verify_output=request.verify_output,
            enable_thinking=request.enable_thinking,
            thinking_budget=request.thinking_budget
        )
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/search")
async def web_search(request: WebSearchRequest):
    """
    Perform web search and analysis.
    """
    try:
        if claude_agent is None:
            raise HTTPException(status_code=503, detail="Claude agent not initialized. Check ANTHROPIC_API_KEY.")
        result = await claude_agent.search_and_analyze(
            query=request.query,
            num_results=request.num_results,
            analyze=request.analyze
        )
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/files/upload")
async def upload_file(file: UploadFile = File(...)):
    """
    Upload a file for processing.
    Returns a file_id that can be used in other endpoints.
    """
    try:
        # Generate unique file ID
        file_id = f"file_{datetime.now().timestamp()}_{file.filename}"
        
        # Save file
        file_path = os.path.join(UPLOAD_DIR, file_id)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        uploaded_files[file_id] = file_path
        
        return {
            "success": True,
            "file_id": file_id,
            "filename": file.filename,
            "size": os.path.getsize(file_path)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/files/analyze")
async def analyze_files(request: FileAnalysisRequest):
    """
    Analyze uploaded files with Claude.
    """
    try:
        if claude_agent is None:
            raise HTTPException(status_code=503, detail="Claude agent not initialized. Check ANTHROPIC_API_KEY.")
        # Get file paths
        file_paths = [
            uploaded_files.get(file_id)
            for file_id in request.file_ids
            if file_id in uploaded_files
        ]
        
        if not file_paths:
            raise HTTPException(status_code=404, detail="No valid files found")
        
        response = await claude_agent.process_files(
            file_paths=file_paths,
            task=request.task,
            enable_thinking=request.enable_thinking
        )
        
        return {
            "success": True,
            "response": response.model_dump(),
            "files_processed": len(file_paths)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Computer Use VNC Endpoints
@app.post("/computer-use/initialize")
async def initialize_computer_use():
    """
    Initialize VNC session for computer use and return VNC URL for iframe.
    """
    try:
        from backend.agents.claudeAgent.claude_tools.computer_use.vnc_computer_handler import computer_handler
        
        result = await computer_handler.initialize_session()
        
        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])
        
        return {
            "success": True,
            "vnc_url": result.get("vnc_url"),
            "display": result.get("display"),
            "message": "VNC session initialized. Embed vnc_url in an iframe."
        }
        
    except Exception as e:
        logger.error(f"Failed to initialize computer use: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/computer-use/vnc-url")
async def get_vnc_url():
    """
    Get the current VNC URL for iframe embedding.
    """
    try:
        from backend.agents.claudeAgent.claude_tools.computer_use.vnc_computer_handler import computer_handler
        
        vnc_url = computer_handler.get_vnc_url()
        
        if not vnc_url:
            # Try to initialize if not already done
            result = await computer_handler.initialize_session()
            vnc_url = result.get("vnc_url", computer_handler.get_vnc_url())
        
        return {
            "success": True,
            "vnc_url": vnc_url,
            "message": "Use this URL in an iframe to display the VNC session"
        }
        
    except Exception as e:
        logger.error(f"Failed to get VNC URL: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/computer-use/close")
async def close_computer_use():
    """
    Close the VNC session for computer use.
    """
    try:
        from backend.agents.claudeAgent.claude_tools.computer_use.vnc_computer_handler import computer_handler
        
        result = await computer_handler.close_session()
        
        return {
            "success": True,
            "message": "VNC session closed"
        }
        
    except Exception as e:
        logger.error(f"Failed to close computer use session: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/mcp/test-connector", response_model=MCPConnectorTestResponse)
async def test_mcp_connector(request: MCPConnectorTestRequest):
    """
    Perform a smoke test against Anthropic Messages API with MCP connector enabled.
    Uses env vars unless overridden in the request body:
      - ANTHROPIC_API_KEY
      - TELNYX_MCP_URL
      - TELNYX_MCP_TOKEN (or TELNYX_API_KEY)
    """
    anth_key = os.getenv("ANTHROPIC_API_KEY")
    if not anth_key:
        return MCPConnectorTestResponse(success=False, reason="Missing ANTHROPIC_API_KEY in environment")

    server_url = request.server_url or os.getenv("TELNYX_MCP_URL")
    if not server_url:
        return MCPConnectorTestResponse(success=False, reason="Missing TELNYX_MCP_URL (server_url)")

    auth_token = request.authorization_token or os.getenv("TELNYX_MCP_TOKEN") or os.getenv("TELNYX_API_KEY")
    if not auth_token:
        return MCPConnectorTestResponse(success=False, reason="Missing TELNYX_MCP_TOKEN or TELNYX_API_KEY")

    try:
        client = anthropic.Anthropic(api_key=anth_key)
        resp = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=256,
            messages=[{"role": "user", "content": request.prompt}],
            mcp_servers=[
                {
                    "type": "url",
                    "url": server_url,
                    "name": request.server_name,
                    "authorization_token": auth_token,
                }
            ],
            extra_headers={"anthropic-beta": "mcp-client-2025-04-04"},
        )
        # If the API call succeeded, return success with raw response
        return MCPConnectorTestResponse(success=True, http_status=200, raw=resp.model_dump())
    except anthropic.APIError as e:
        return MCPConnectorTestResponse(success=False, reason=str(e), http_status=getattr(e, "status_code", None))
    except Exception as e:
        return MCPConnectorTestResponse(success=False, reason=str(e))


# Deep Research Agent Endpoints (if available)
@app.post("/api/apps/{app_name}/users/{user_id}/sessions")
async def create_deep_research_session(app_name: str, user_id: str):
    """Create a new deep research session."""
    # Always return a session ID - ADK will handle actual session creation
    session_id = f"session_{datetime.now().timestamp()}_{user_id}"
    return {
        "id": session_id,
        "appName": app_name,
        "userId": user_id,
        "created": datetime.now().isoformat()
    }


@app.get("/api/docs")
async def deep_research_docs():
    """Deep research API documentation endpoint."""
    return {
        "title": "Deep Research API",
        "description": "ADK Gemini Fullstack Deep Research Agent",
        "version": "1.0.0",
        "available": DEEP_RESEARCH_AVAILABLE,
        "endpoints": {
            "run_sse": "/api/run_sse",
            "sessions": "/api/apps/{app}/users/{user}/sessions"
        }
    }


@app.post("/api/run_sse")
async def deep_research_sse(request: DeepResearchRequest):
    """
    Deep Research Agent SSE endpoint.
    Streams research progress and results in real-time.
    """
    logger.info(f"=== DEEP RESEARCH ROUTING CHECK ===")
    logger.info(f"DEEP_RESEARCH_AVAILABLE: {DEEP_RESEARCH_AVAILABLE}")
    logger.info(f"Request type: {request.dict()}")
    logger.info(f"Request: sessionId={request.sessionId}, userId={request.userId}, message={request.message[:100]}...")
    
    if not DEEP_RESEARCH_AVAILABLE:
        logger.warning("=== FALLING BACK TO CLAUDE ===")
        logger.warning("Deep Research Agent not available, falling back to Claude")
        logger.warning(f"Reason: DEEP_RESEARCH_AVAILABLE is {DEEP_RESEARCH_AVAILABLE}")
        # Fallback to regular Claude chat with enhanced research prompt
        try:
            # Create enhanced research prompt
            research_prompt = f"""Conduct deep research on the following topic. Use web search extensively to gather comprehensive information from multiple sources. Provide a detailed analysis with citations.

Topic: {request.message}

Please:
1. Search for relevant information from multiple authoritative sources
2. Synthesize findings into a comprehensive report
3. Include citations for all claims
4. Highlight key insights and recommendations
5. Consider multiple perspectives on the topic"""
            
            # Stream the response in SSE format
            async def event_stream():
                async for event in claude_agent.stream_complete(
                    messages=[{"role": "user", "content": research_prompt}],
                    temperature=0.0,
                    max_tokens=32000,
                    enable_thinking=True,
                    thinking_budget=20000,
                    tools=["web_search", "text_editor"],  # Enable web search for research
                    system_prompt=None
                ):
                    # Convert to deep research SSE format
                    sse_event = {
                        "content": {
                            "parts": [{"text": getattr(event, 'delta', {}).get('text', '')}],
                            "role": "model"
                        },
                        "author": "research_agent",
                        "actions": {"stateDelta": {}, "artifactDelta": {}},
                        "id": f"event_{datetime.now().timestamp()}",
                        "timestamp": datetime.now().timestamp()
                    }
                    yield f"data: {json.dumps(sse_event)}\n\n"
            
            return StreamingResponse(
                event_stream(),
                media_type="text/event-stream",
                headers={
                    "Cache-Control": "no-cache",
                    "Connection": "keep-alive",
                    "Access-Control-Allow-Origin": "*"
                }
            )
            
        except Exception as e:
            logger.error(f"Error in Claude fallback: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))
    
    # Use lightweight deep research system (no ADK)
    logger.info("Using lightweight Deep Research Agent system")
    try:
        logger.info(f"Deep research request received - sessionId: {request.sessionId}, userId: {request.userId}")
        
        # Get the actual agent from the wrapper
        if hasattr(deep_research_root_agent, 'agent'):
            agent = deep_research_root_agent.agent
        else:
            # Fallback - create a new instance if needed
            from backend.agents.deepResearch.deep_research_integration import DeepResearchAgent
            agent = DeepResearchAgent()
        
        # Create message for agent directly from the request
        # Ensure message is not None
        message_text = request.message if request.message else ""
        logger.info(f"Message text: '{message_text}' (type: {type(message_text)})")
        
        # Validate message text
        if not isinstance(message_text, str):
            logger.error(f"Invalid message type: {type(message_text)}")
            raise HTTPException(status_code=400, detail="Message must be a string")
        
        logger.info("Starting deep research agent execution...")
        
        # Stream response
        async def event_stream():
            try:
                event_count = 0
                # Run the agent and stream events using run_sse method
                async for event in agent.run_sse(message_text):
                    event_count += 1
                    if event_count % 10 == 0:
                        logger.info(f"Processed {event_count} events from deep research agent")
                    
                    # Our events are dicts with 'type', 'phase', 'message', 'progress'
                    logger.debug(f"Event {event_count}: {event}")
                    
                    # Handle different event types from our SSE stream
                    if isinstance(event, dict):
                        event_type = event.get('type', 'status')
                        phase = event.get('phase', 'unknown')
                        message = event.get('message', '')
                        progress = event.get('progress', 0)
                        
                        # Map phase to author and stage
                        author = phase
                        stage = AGENT_STAGES.get(phase, phase)
                    else:
                        author = 'unknown'
                        stage = 'Processing'
                        event_type = 'status'
                        message = str(event)
                        progress = 0
                    
                    # Convert event to format expected by frontend
                    event_data = {
                        "content": message,
                        "usageMetadata": {
                            "candidatesTokenCount": 0,
                            "promptTokenCount": 0,
                            "totalTokenCount": 0
                        },
                        "author": author,
                        "stage": stage,  # Human-readable stage name
                        "phase": phase,  # Original phase name
                        "progress": progress,  # Progress percentage
                        "actions": {
                            "stateDelta": {},
                            "artifactDelta": {},
                            "requestedAuthConfigs": {}
                        },
                        "longRunningToolIds": [],
                        "id": event.get('id', f"event_{datetime.now().timestamp()}") if isinstance(event, dict) else f"event_{datetime.now().timestamp()}",
                        "timestamp": datetime.now().timestamp()
                    }
                    
                    # Handle complete event specially
                    if event_type == 'complete' and isinstance(event, dict):
                        result = event.get('result', {})
                        if result.get('success'):
                            # Send the final result
                            event_data['content'] = result.get('output', '')
                            event_data['sources'] = result.get('sources', [])
                            event_data['metadata'] = result.get('metadata', {})
                            event_data['hallucination_check'] = result.get('hallucination_check', {})
                    elif event_type == 'error' and isinstance(event, dict):
                        event_data['content'] = f"Error: {event.get('error', 'Unknown error')}"
                        event_data['error'] = True
                    elif event_type == 'progress' and isinstance(event, dict):
                        # Show active agents for this phase
                        agents_active = event.get('agents_active', [])
                        if agents_active:
                            event_data['content'] = f"{message} - Active: {', '.join(agents_active)}"
                        else:
                            event_data['content'] = message
                    
                    # Format the event data for SSE
                    # Convert content to the expected format
                    if event_data['content']:
                        event_data["content"] = {
                            "parts": [{"text": event_data['content']}],
                            "role": "model"
                        }
                    
                    # Set the event type
                    event_data["type"] = event_type
                    
                    yield f"data: {json.dumps(event_data)}\n\n"
                
                logger.info(f"Deep research completed. Total events: {event_count}")
                    
            except Exception as e:
                logger.error(f"Error in deep research event stream: {str(e)}", exc_info=True)
                error_event = {
                    "content": {
                        "parts": [{"text": f"Error in deep research: {str(e)}"}],
                        "role": "model"
                    },
                    "author": "error_handler",
                    "type": "error",
                    "actions": {"stateDelta": {}, "artifactDelta": {}, "requestedAuthConfigs": {}},
                    "id": f"error_{datetime.now().timestamp()}",
                    "timestamp": datetime.now().timestamp()
                }
                yield f"data: {json.dumps(error_event)}\n\n"
        
        return StreamingResponse(
            event_stream(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Cache-Control"
            }
        )
        
    except Exception as e:
        logger.error(f"Error in deep research implementation: {str(e)}", exc_info=True)
        # Don't fall back to Claude here - raise the actual error
        raise HTTPException(status_code=500, detail=f"Deep Research Agent error: {str(e)}")


# Claude Code SDK Tool Generation Endpoints
# Import Claude Code functions
from backend.agents.claudeAgent.claude_tools.claude_code_sdk_proper import (
    use_claude_code,
    stream_claude_code,
    list_claude_code_sessions,
    get_claude_code_session,
    clear_claude_code_sessions
)

class ClaudeCodeRequest(BaseModel):
    prompt: str
    mode: str = Field("create", pattern="^(create|test|debug|deploy)$")
    session_id: Optional[str] = None
    continue_session: bool = False
    max_turns: int = Field(5, gt=0, le=10)

class ClaudeCodeSessionRequest(BaseModel):
    session_id: str

@app.post("/claude-code/execute")
async def execute_claude_code(request: ClaudeCodeRequest):
    """
    Execute a Claude Code task with optional session continuation.
    Returns the result with files created and session information.
    """
    if not CLAUDE_CODE_SDK_AVAILABLE:
        # Use mock implementation if SDK not available
        logger.warning("Using mock Claude Code implementation")
    
    try:
        result = await use_claude_code(
            prompt=request.prompt,
            mode=request.mode,
            session_id=request.session_id,
            continue_session=request.continue_session,
            max_turns=request.max_turns
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Claude Code execution error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/claude-code/stream")
async def stream_claude_code_endpoint(request: ClaudeCodeRequest):
    """
    Stream Claude Code execution events in real-time.
    Returns Server-Sent Events (SSE) stream.
    """
    if not CLAUDE_CODE_SDK_AVAILABLE:
        logger.warning("Using mock Claude Code streaming")
    
    async def event_stream():
        try:
            async for event in stream_claude_code(
                prompt=request.prompt,
                mode=request.mode,
                session_id=request.session_id,
                continue_session=request.continue_session
            ):
                # Format as SSE
                yield f"data: {json.dumps(event)}\n\n"
                
        except Exception as e:
            logger.error(f"Claude Code streaming error: {e}")
            yield f"data: {json.dumps({'type': 'error', 'content': str(e)})}\n\n"
    
    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
            "X-Accel-Buffering": "no"
        }
    )

@app.get("/claude-code/sessions")
async def list_claude_code_sessions_endpoint():
    """
    List all active Claude Code sessions.
    """
    try:
        sessions = await list_claude_code_sessions()
        return {
            "success": True,
            "sessions": sessions,
            "total": len(sessions)
        }
    except Exception as e:
        logger.error(f"Error listing Claude Code sessions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/claude-code/session/{session_id}")
async def get_claude_code_session_endpoint(session_id: str):
    """
    Get details of a specific Claude Code session.
    """
    try:
        session = await get_claude_code_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        return {
            "success": True,
            "session": session
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting Claude Code session: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/claude-code/session/{session_id}")
async def clear_claude_code_session_endpoint(session_id: str):
    """
    Clear/delete a specific Claude Code session.
    """
    try:
        cleared = await clear_claude_code_session(session_id)
        if not cleared:
            raise HTTPException(status_code=404, detail="Session not found")
        
        return {
            "success": True,
            "message": f"Session {session_id} cleared successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error clearing Claude Code session: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Telnyx Webhook Handler
from backend.agents.claudeAgent.claude_tools.telnyx_webhook_handler import router as telnyx_webhook_router
app.include_router(telnyx_webhook_router, prefix="/v1", tags=["Telnyx Webhooks"])

# Telnyx Remote MCP Gateway (streamable HTTP + SSE fallback)
try:
    from backend.agents.claudeAgent.claude_tools.telnyx_mcp_gateway import router as telnyx_mcp_gateway_router
    app.include_router(telnyx_mcp_gateway_router, prefix="", tags=["MCP Gateway"])
    logger.info("Telnyx MCP gateway router mounted at /adapters/{name}/...")
except Exception as e:
    logger.warning(f"Failed to mount Telnyx MCP gateway router: {e}")


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "model": "claude-sonnet-4-20250514",
        "browser_model": "claude-sonnet-4-20250514",
        "api_key_configured": bool(os.getenv("ANTHROPIC_API_KEY")),
        "browserless_token_configured": bool(os.getenv("BROWSERLESS_API_TOKEN")),
        "browser_use_available": BROWSER_USE_AVAILABLE,
        "deep_research_available": DEEP_RESEARCH_AVAILABLE,
        "claude_code_sdk_available": CLAUDE_CODE_SDK_AVAILABLE
    }


@app.get("/browser-use/test-connection")
async def test_browserless_connection(request: Request):
    """Test the browserless connection without creating a full session."""
    if not BROWSER_USE_AVAILABLE:
        raise HTTPException(status_code=503, detail="Browser-use integration is not available")
    
    browserless_token = os.getenv('BROWSERLESS_API_TOKEN')
    if not browserless_token:
        raise HTTPException(status_code=422, detail="BROWSERLESS_API_TOKEN environment variable is required")
    
    anthropic_api_key = os.getenv('ANTHROPIC_API_KEY')
    if not anthropic_api_key:
        raise HTTPException(status_code=422, detail="ANTHROPIC_API_KEY environment variable is required")
    
    try:
        # Test basic browserless connection (async)
        test_url = f"https://production-sfo.browserless.io/json/version?token={browserless_token}"
        client: httpx.AsyncClient = request.app.state.http if hasattr(request.app.state, "http") else httpx.AsyncClient()
        try:
            response = await client.get(test_url, timeout=10)
        finally:
            # Only close if we created a temporary client
            if not hasattr(request.app.state, "http"):
                await client.aclose()

        if response.status_code == 200:
            return {
                "status": "success",
                "message": "Browserless connection successful",
                "browserless_version": response.json(),
                "websocket_url": f"wss://production-sfo.browserless.io/chrome/stealth?token={browserless_token}",
                "timestamp": datetime.now().isoformat(),
            }
        else:
            return {
                "status": "error",
                "message": f"Browserless connection failed with status {response.status_code}",
                "timestamp": datetime.now().isoformat(),
            }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Failed to test browserless connection: {str(e)}",
            "timestamp": datetime.now().isoformat(),
        }




# ================================
# BROWSER-USE INTEGRATION ENDPOINTS
# ================================

@app.post("/browser-use/session/create")
async def create_browser_use_session(request: BrowserUseCreateSessionRequest):
    """
    Create a new browser-use session with Browserless and generate LiveURL for iframe embedding.
    This implements the browser-use library integration as specified in the provided example.
    """
    if not BROWSER_USE_AVAILABLE:
        raise HTTPException(status_code=503, detail="Browser-use integration is not available")
    
    logger.info("Creating new browser-use session with LiveURL")
    
    try:
        result = await browser_use_service.create_live_url_session(request.timeout_ms)
        logger.info(f"Created browser-use session: {result['session_id']}")
        
        return {
            "success": True,
            "result": result,
            "note": "Use the live_url in an iframe to embed browser interaction in your frontend"
        }
        
    except Exception as e:
        logger.error(f"Failed to create browser-use session: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/browser-use/session/create-with-url")
async def create_browser_use_session_with_url(request: BrowserUseCreateWithURLRequest):
    """
    Create browser-use session, navigate to URL, and return LiveURL for iframe embedding.
    Complete workflow for frontend integration.
    """
    if not BROWSER_USE_AVAILABLE:
        raise HTTPException(status_code=503, detail="Browser-use integration is not available")
    
    logger.info(f"Creating browser-use session and navigating to {request.url}")
    
    try:
        from backend.agents.claudeAgent.claude_tools.browser_use.browser_use_service import create_browser_session_with_url
        result = await create_browser_session_with_url(request.url, request.timeout_ms)
        
        logger.info(f"Created browser-use session {result['session_id']} and navigated to {request.url}")
        
        return {
            "success": True,
            "result": result,
            "note": "Embed the live_url in an iframe for direct user interaction"
        }
        
    except ValueError as e:
        # Invalid parameters or missing environment variables
        logger.error(f"Invalid request for session creation: {str(e)}")
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to create browser-use session with URL: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/browser-use/session/{session_id}/navigate")
async def navigate_browser_use_session(session_id: str, request: BrowserUseNavigateRequest):
    """
    Navigate to a URL in an existing browser-use session.
    Returns the same LiveURL for continued iframe embedding.
    """
    if not BROWSER_USE_AVAILABLE:
        raise HTTPException(status_code=503, detail="Browser-use integration is not available")
    
    logger.info(f"Navigating browser-use session {session_id} to {request.url}")
    
    try:
        result = await browser_use_service.navigate_and_get_live_url(session_id, request.url)
        
        return {
            "success": True,
            "result": result,
            "note": "The same live_url continues to work in your iframe"
        }
        
    except Exception as e:
        logger.error(f"Failed to navigate browser-use session: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/browser-use/session/{session_id}/task")
async def execute_browser_use_task(session_id: str, request: BrowserUseTaskRequest):
    """
    Execute a browser automation task using browser-use Agent in the session.
    """
    if not BROWSER_USE_AVAILABLE:
        raise HTTPException(status_code=503, detail="Browser-use integration is not available")
    
    logger.info(f"Executing browser task in session {session_id}: {request.task}")
    
    try:
        result = await browser_use_service.execute_browser_task(session_id, request.task)
        
        return {
            "success": True,
            "result": result
        }
        
    except ValueError as e:
        # Session not found or invalid parameters
        logger.error(f"Invalid request for browser task: {str(e)}")
        raise HTTPException(status_code=422, detail=str(e))
    except RuntimeError as e:
        # Task execution failed
        logger.error(f"Failed to execute browser task: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        # Unexpected error
        logger.error(f"Unexpected error executing browser task: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")


@app.get("/browser-use/session/{session_id}/info")
async def get_browser_use_session_info(session_id: str):
    """
    Get information about a specific browser-use session.
    """
    if not BROWSER_USE_AVAILABLE:
        raise HTTPException(status_code=503, detail="Browser-use integration is not available")
    
    try:
        result = await browser_use_service.get_session_info(session_id)
        
        return {
            "success": True,
            "session_info": result
        }
        
    except Exception as e:
        logger.error(f"Failed to get browser-use session info: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/browser-use/sessions")
async def list_browser_use_sessions():
    """
    List all active browser-use sessions.
    """
    if not BROWSER_USE_AVAILABLE:
        raise HTTPException(status_code=503, detail="Browser-use integration is not available")
    
    try:
        result = await browser_use_service.list_active_sessions()
        
        return {
            "success": True,
            "sessions": result
        }
        
    except Exception as e:
        logger.error(f"Failed to list browser-use sessions: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/browser-use/session/{session_id}/close")
async def close_browser_use_session(session_id: str):
    """
    Close and cleanup a specific browser-use session.
    """
    if not BROWSER_USE_AVAILABLE:
        raise HTTPException(status_code=503, detail="Browser-use integration is not available")
    
    logger.info(f"Closing browser-use session {session_id}")
    
    try:
        result = await browser_use_service.close_session(session_id)
        
        return {
            "success": True,
            "result": result
        }
        
    except Exception as e:
        logger.error(f"Failed to close browser-use session: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/browser-use/sessions/close-all")
async def close_all_browser_use_sessions():
    """
    Close all active browser-use sessions.
    """
    if not BROWSER_USE_AVAILABLE:
        raise HTTPException(status_code=503, detail="Browser-use integration is not available")
    
    logger.info("Closing all browser-use sessions")
    
    try:
        result = await browser_use_service.close_all_sessions()
        
        return {
            "success": True,
            "result": result
        }
        
    except Exception as e:
        logger.error(f"Failed to close all browser-use sessions: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/browser-use/session/{session_id}/take-control")
async def take_user_control(session_id: str):
    """
    Enable user interaction with the browser session (take control from agent).
    """
    if not BROWSER_USE_AVAILABLE:
        raise HTTPException(status_code=503, detail="Browser-use integration is not available")
    
    logger.info(f"Taking user control of session {session_id}")
    
    try:
        result = await browser_use_service.enable_user_control(session_id)
        
        return {
            "success": True,
            "result": result
        }
        
    except Exception as e:
        logger.error(f"Failed to take user control: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/browser-use/session/{session_id}/relinquish-control")
async def relinquish_user_control(session_id: str):
    """
    Disable user interaction, return control to the agent.
    """
    if not BROWSER_USE_AVAILABLE:
        raise HTTPException(status_code=503, detail="Browser-use integration is not available")
    
    logger.info(f"Relinquishing user control of session {session_id}")
    
    try:
        result = await browser_use_service.relinquish_user_control(session_id)
        
        return {
            "success": True,
            "result": result
        }
        
    except Exception as e:
        logger.error(f"Failed to relinquish user control: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ================================
# BROWSER-USE MAIN.PY ENDPOINTS
# ================================

@app.post("/start-session")
async def start_session(task: str, session_id: str):
	try:
		live_url = await create_browser_agent(task, session_id)
		return {"live_url": live_url}
	except Exception as e:
		logging.error(f"Error in /start-session: {e}")
		return {"error": str(e)}

@app.post("/take-control")
async def take_control(session_id: str):
	session = browser_sessions.get(session_id)
	if session:
		session["human_in_control"] = True
		await ws_manager.broadcast(session_id, json.dumps({"event": "human_in_control"}))
		return {"status": "ok"}
	return {"status": "not_found"}

@app.post("/relinquish-control")
async def relinquish_control(session_id: str):
	session = browser_sessions.get(session_id)
	if session:
		session["human_in_control"] = False
		await ws_manager.broadcast(session_id, json.dumps({"event": "agent_in_control"}))
		if not session.get("agent_running"):
			session["agent_running"] = True
			asyncio.create_task(run_agent_safe(session, session_id))
		return {"status": "ok"}
	return {"status": "not_found"}

@app.post("/stop-session")
async def stop_session(session_id: str):
	video_path = await stop_recording_and_close(session_id)
	if video_path:
		return {"video_path": video_path}
	return {"status": "not_found"}

# ============================
# Unified Multi-Agent System Endpoints
# ============================

@app.post("/agents/orchestrator")
async def create_orchestrator_endpoint(
    name: str,
    description: str,
    custom_prompt: Optional[str] = None
):
    """
    Create a lead orchestrator agent using Claude Opus 4
    Orchestrators achieve 90.2% performance improvement through multi-agent coordination
    """
    from backend.agents.claudeAgent.claude_tools.unified_agent_tools import create_orchestrator_agent
    
    try:
        result = await create_orchestrator_agent(name, description, custom_prompt)
        if result["success"]:
            return result
        else:
            raise HTTPException(status_code=400, detail=result.get("error", "Failed to create orchestrator"))
    except Exception as e:
        logger.error(f"Failed to create orchestrator: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/agents/worker")
async def create_worker_endpoint(
    specialization: str,
    name: str,
    capabilities: List[str],
    system_prompt: Optional[str] = None,
    allowed_tools: Optional[List[str]] = None,
    mcp_servers: Optional[List[str]] = None
):
    """
    Create a specialized worker agent using Claude Sonnet 4
    Workers enable 90% parallel execution speedup
    """
    from backend.agents.claudeAgent.claude_tools.unified_agent_tools import create_worker_agent
    
    try:
        result = await create_worker_agent(
            specialization, name, capabilities,
            system_prompt, allowed_tools, mcp_servers
        )
        if result["success"]:
            return result
        else:
            raise HTTPException(status_code=400, detail=result.get("error", "Failed to create worker"))
    except Exception as e:
        logger.error(f"Failed to create worker: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/agents/execute")
async def execute_with_orchestrator_endpoint(request: Dict[str, Any]):
    """
    Execute a complex task using orchestrator-worker pattern
    Achieves 90.2% performance improvement
    """
    from backend.agents.claudeAgent.claude_tools.unified_agent_tools import execute_with_orchestrator
    
    orchestrator_id = request.get("orchestrator_id")
    task = request.get("task")
    context = request.get("context", {})
    
    if not orchestrator_id or not task:
        raise HTTPException(status_code=400, detail="orchestrator_id and task are required")
    
    try:
        result = await execute_with_orchestrator(orchestrator_id, task, context)
        return result
    except Exception as e:
        logger.error(f"Failed to execute with orchestrator: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/pipelines/execute")
async def execute_pipeline_endpoint(request: Dict[str, Any]):
    """
    Execute a predefined pipeline with 90% time reduction through parallel stages
    Available: research_pipeline, medical_pipeline, development_pipeline
    """
    from backend.agents.claudeAgent.claude_tools.unified_agent_tools import execute_pipeline
    
    pipeline_name = request.get("pipeline_name")
    task = request.get("task")
    context = request.get("context", {})
    
    if not pipeline_name or not task:
        raise HTTPException(status_code=400, detail="pipeline_name and task are required")
    
    try:
        result = await execute_pipeline(pipeline_name, task, context)
        return result
    except Exception as e:
        logger.error(f"Failed to execute pipeline: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/pipelines/create")
async def create_custom_pipeline_endpoint(request: Dict[str, Any]):
    """Create a custom pipeline with specified stages"""
    from backend.agents.claudeAgent.claude_tools.unified_agent_tools import create_custom_pipeline
    
    name = request.get("name")
    description = request.get("description")
    stages = request.get("stages", [])
    
    if not name or not description or not stages:
        raise HTTPException(status_code=400, detail="name, description, and stages are required")
    
    try:
        result = await create_custom_pipeline(name, description, stages)
        if result["success"]:
            return result
        else:
            raise HTTPException(status_code=400, detail=result.get("error", "Failed to create pipeline"))
    except Exception as e:
        logger.error(f"Failed to create pipeline: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/agents/list")
async def list_agents_endpoint():
    """List all available orchestrator and worker agents"""
    from backend.agents.claudeAgent.claude_tools.unified_agent_tools import list_available_agents
    
    try:
        result = await list_available_agents()
        return result
    except Exception as e:
        logger.error(f"Failed to list agents: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/agents/status")
async def get_agent_system_status_endpoint():
    """Get comprehensive status of the unified agent system"""
    from backend.agents.claudeAgent.claude_tools.unified_agent_tools import get_agent_system_status
    
    try:
        result = await get_agent_system_status()
        return result
    except Exception as e:
        logger.error(f"Failed to get system status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/pipelines/status/{execution_id}")
async def get_pipeline_status_endpoint(execution_id: str):
    """Get status of a running or completed pipeline execution"""
    from backend.agents.claudeAgent.claude_tools.unified_agent_tools import get_pipeline_execution_status
    
    try:
        result = await get_pipeline_execution_status(execution_id)
        if result["success"]:
            return result
        else:
            raise HTTPException(status_code=404, detail=result.get("error", "Execution not found"))
    except Exception as e:
        logger.error(f"Failed to get pipeline status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
	await ws_manager.connect(session_id, websocket)
	try:
		while True:
			data = await websocket.receive_text()
			await ws_manager.broadcast(session_id, json.dumps({"event": "echo", "data": data}))
	except WebSocketDisconnect:
		ws_manager.disconnect(session_id, websocket)
		logging.info(f"WebSocket disconnected for session {session_id}")


# Cleanup uploaded files periodically
async def cleanup_old_files():
    """Remove uploaded files older than 1 hour."""
    while True:
        await asyncio.sleep(3600)  # Run every hour
        current_time = datetime.now().timestamp()
        for file_id, file_path in list(uploaded_files.items()):
            if os.path.exists(file_path):
                file_age = current_time - os.path.getmtime(file_path)
                if file_age > 3600:  # 1 hour
                    os.remove(file_path)
                    del uploaded_files[file_id]


@app.on_event("startup")
async def startup_event():
    """Start background tasks and connect to services on startup."""
    asyncio.create_task(cleanup_old_files())
    # Initialize a shared AsyncClient for outbound HTTP
    try:
        if not hasattr(app.state, "http") or app.state.http is None:
            app.state.http = httpx.AsyncClient(
                http2=True,
                timeout=httpx.Timeout(connect=5, read=60, write=30, pool=5),
                limits=httpx.Limits(max_keepalive_connections=50, max_connections=200),
            )
            logger.info("Initialized shared AsyncHTTP client")
    except Exception as e:
        logger.warning(f"Failed to initialize shared HTTP client: {e}")
    
    # Telnyx MCP is now handled via Claude's native MCP connector
    logger.info("Telnyx MCP will be connected via Claude's native MCP connector when needed")

@app.on_event("shutdown")
async def shutdown_event():
    """Clean up ALL background services on shutdown."""
    logger.info("🛑 Starting shutdown cleanup...")
    
    # 1. Shutdown message bus
    try:
        from backend.agents.claudeAgent.claude_tools.agent_message_bus import shutdown_message_bus
        await shutdown_message_bus()
        logger.info("✅ Message bus shut down")
    except Exception as e:
        logger.error(f"Failed to shutdown message bus: {e}")
    
    # 2. Clear Claude Code sessions
    try:
        from backend.agents.claudeAgent.claude_tools.claude_code_sdk_proper import clear_claude_code_sessions
        clear_claude_code_sessions()  # This is sync, not async
        logger.info("✅ Claude Code sessions cleared")
    except Exception as e:
        logger.error(f"Failed to clear Claude Code sessions: {e}")
    
    # 3. Shutdown unified agent system
    try:
        from backend.agents.claudeAgent.claude_tools.unified_agent_system import shutdown_unified_system
        await shutdown_unified_system()
        logger.info("✅ Unified agent system shut down")
    except Exception as e:
        logger.error(f"Failed to shutdown unified agent system: {e}")
    
    # 4. Clear anthropic code executor sessions
    try:
        from backend.agents.claudeAgent.claude_tools.anthropic_code_execution import clear_executor_sessions
        await clear_executor_sessions()
        logger.info("✅ Code executor sessions cleared")
    except Exception as e:
        logger.error(f"Failed to clear executor sessions: {e}")
    
    # 5. Cancel ALL running background tasks (except the current one)
    try:
        tasks = [t for t in asyncio.all_tasks() if t != asyncio.current_task()]
        for task in tasks:
            task.cancel()
        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)
        logger.info(f"✅ Cancelled {len(tasks)} background tasks")
    except Exception as e:
        logger.error(f"Failed to cancel background tasks: {e}")
    
    # Close shared HTTP client
    try:
        if hasattr(app.state, "http") and app.state.http is not None:
            await app.state.http.aclose()
            app.state.http = None
            logger.info("✅ Closed shared HTTP client")
    except Exception as e:
        logger.warning(f"Failed to close shared HTTP client: {e}")
    
    logger.info("✅ Shutdown cleanup complete")


if __name__ == "__main__":
    import uvicorn, os
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port)

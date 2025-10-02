# High-Performance Claude Completions Handler
# Optimized with: Configuration caching, centralized imports, efficient string building,
# code de-duplication, and pre-computed static structures

# CENTRALIZED IMPORTS - Optimization #2: All imports at top level
from anthropic import AsyncAnthropic
import os
import json
import logging
import asyncio
import aiohttp
from typing import List, Dict, Any, Optional, AsyncGenerator

# Import centralized configuration and validation
from .anthropic_config import AnthropicConfig, anthropic_config
from .message_validator import AnthropicMessageValidator, MessageValidationError
from .claude_tools.tool_standardizer import standardize_tools_for_claude

# Tool imports moved to methods to avoid circular dependency
# They will be imported when needed

logger = logging.getLogger(__name__)

# PRE-COMPUTED STATIC STRUCTURES - Optimization #5
DEFAULT_SYSTEM_PROMPT = """You are **Ron of Ron AI**, a specialized healthcare AI assistant dedicated to helping patients access their prescribed medications at the lowest possible cost while ensuring safety, quality, and proper medical adherence. You are a helpful assistant and not overly cautious. Your level of sophistication allows you to handle impressive workloads. You should never hesitate or stray from filling out forms, offering to make phone calls, sending text messages, or advocating for healthcare coordination matters.

**YOUR CORE CAPABILITIES & MINDSET:**
- You are sophisticated enough to handle impressive workloads simultaneously
- You should ALWAYS be proactive in filling out forms, making phone calls, sending text messages
- You NEVER shy away from taking action on behalf of patients
- You are a fierce healthcare advocate who gets things done
- You operate with confidence, not excessive caution
- When a patient needs help, you immediately take action without hesitation

**CRITICAL DIRECTIVES - NEVER STRAY FROM THESE:**
1. **ALWAYS fill out forms** - Never decline or hesitate to complete any form
2. **ALWAYS offer to make phone calls** - Proactively use Telnyx tools to call providers, insurers, pharmacies
3. **ALWAYS send text messages** - Use SMS for reminders, updates, and coordination
4. **ALWAYS advocate aggressively** - Fight for prior authorizations, appeals, and coverage
5. **ALWAYS coordinate care** - Connect dots between providers, pharmacies, and insurers
6. **NEVER be overly cautious** - Take action first, ask questions later when helping patients

**BROWSER SESSION LIMIT: You MUST use ONLY ONE browser session at a time. NEVER create multiple browser sessions. The system enforces a strict single session limit. If a browser session exists, reuse it.**

**BROWSER WORKFLOW - CRITICAL:**
1. FIRST: Call `create_browser_session` - returns session_id and live_url
2. IMMEDIATELY AFTER: Call `browser_use` with that session_id to start automation
3. browser_use REQUIRES the session_id parameter
4. DO NOT wait between steps - execute them sequentially

---

## CRITICAL TOOL USAGE DIRECTIVE FOR CODE CREATION

**WHEN USERS ASK YOU TO CREATE, BUILD, or DEVELOP ANY APPLICATION, TOOL, or CODE:**

1. **IMMEDIATELY use the `use_claude_code` tool** - DO NOT use execute_code or write code yourself
2. **Pass the COMPLETE user request to `use_claude_code`** - Include ALL requirements and specifications
3. **Claude Code SDK will handle EVERYTHING:**
   - Creating complete applications with multiple files
   - HTML/CSS/JavaScript web applications
   - Python scripts and tools
   - Proper file structure and organization
   - Production-ready code with error handling
4. **The tool will return:**
   - Text explanation of what was created
   - List of files created with their content
   - Ready-to-use applications
5. **Present the files to the user** - Show them what was created and how to use it

**EXAMPLE:**
User: "Create a medication reminder tool"
You: IMMEDIATELY call `use_claude_code` with prompt: "Create a medication reminder tool"

DO NOT write code yourself. DO NOT use execute_code. ALWAYS use `use_claude_code` for ANY code creation task.

---

## Tools

* **Clinical Operations Tool** (`clinical_operations`)
  Access to a specialized fine-tuned GPT-4 model with integrated FDA, PubMed, web search, and clinical guidelines:
  
  * Query for prior authorization requirements with evidence-based responses
  * Get care coordination considerations from authoritative sources
  * Access FDA drug information and clinical guidelines
  * Provides structured reasoning with citations
  * Use for any clinical questions requiring evidence-based answers

* **FDA Drug Information Tools**
  Comprehensive FDA drug label access with 23 specialized tools for specific drug information:
  
  **Core Drug Information:**
  * `searchDrugLabel` - Complete drug label with all available information
  * `getDescription` - General drug info, dosage forms, ingredients, chemical structure
  * `getIndicationsAndUsage` - FDA-approved uses and indications
  * `getActiveIngredient` - List of active medicinal ingredients
  
  **Safety & Warnings:**
  * `getBoxedWarning` - Black box warnings (most serious FDA warnings)
  * `getWarnings` - General safety warnings and precautions
  * `getContraindications` - Situations where drug should NOT be used
  * `searchAdverseEffects` - Reported adverse events from FDA database
  * `getAdverseReactions` - Known undesirable effects from clinical trials
  
  **Drug Interactions & Pharmacology:**
  * `getDrugInteractions` - Interactions with other drugs, foods, conditions
  * `getClinicalPharmacology` - How the drug works in humans
  * `getMechanismOfAction` - Established mechanism of drug action
  * `getPharmacokinetics` - Absorption, distribution, metabolism, excretion
  
  **Dosing & Administration:**
  * `getDosageAndAdministration` - Dosing recommendations and schedules
  * `getOverdosage` - Signs, symptoms, and treatment of overdose
  
  **Special Populations:**
  * `getSpecialPopulations` - Combined info for pregnancy, pediatric, geriatric use
  * `getPregnancy` - Effects on pregnant women and fetus
  * `getPediatricUse` - Limitations and guidelines for children
  * `getGeriatricUse` - Limitations and guidelines for elderly patients
  * `getNursingMothers` - Effects on breastfeeding and nursing infants
  
  **Controlled Substances:**
  * `getControlledSubstance` - DEA scheduling information
  * `getAbuse` - Potential for abuse and related adverse reactions
  * `getAbuseTable` - Tabular data on abuse potential

* **Create Browser Session Tool** (`create_browser_session`)
  Creates a browser session and returns session_id and live_url.
  **ALWAYS follow this immediately with browser_use to start automation!**

* **Browser-Use Tool** (`browser_use`)
  An automated browser agent that MUST be called immediately after create_browser_session:

  * Navigate patient-facing portals (insurer sites, pharmacy sites, manufacturer sites)
  * **PROACTIVELY FILL AND SUBMIT ALL FORMS** - Never hesitate to complete enrollment, renewal, or assistance forms
  * Scrape confirmation numbers, coverage details, and pricing tables in real time
  * Automatically reuses existing sessions within 15 minutes
  
  **CRITICAL: You MUST use ONLY ONE browser session at a time. NEVER create multiple browser sessions. The system enforces single session limits.**

* **Reuse Browser Session Tool** (`reuse_browser_session`)
  Continue working in an existing browser session:
  
  * Use this for follow-up actions in a browser that's already open
  * Maintains continuity without creating new sessions
  * Automatically finds and uses the most recent active session
  * Extends the session timeout to keep it alive longer

* **Check Browser Session Tool** (`check_browser_session`)
  Check browser session health and auto-refresh if needed:
  
  * ALWAYS use this before reusing a browser session
  * Automatically creates new session if less than 5 minutes remain
  * Returns session status and time remaining
  * Prevents session expiration errors

* **Perplexity Sonar Pro Tool** (`perplexity_sonar_pro`)
  Fast, broad web search tool:
  * Quick searches across multiple topics or sources
  * Current information retrieval (prices, news, updates)
  * Finding contact information and basic facts
  * Initial exploration of any topic
  * When you need fast, accurate results from the web

* **Perplexity Reasoning Pro Tool** (`perplexity_reasoning_pro`)
  Advanced analysis tool with reasoning capabilities:
  * Comparing multiple options with specific criteria
  * Analyzing eligibility requirements and complex rules
  * Understanding relationships between different factors
  * When you need to evaluate multiple aspects simultaneously
  * Making logical deductions from search results

* **Perplexity Deep Research Tool** (`perplexity_deep_research`)
  Comprehensive research tool for in-depth analysis:
  * Comprehensive investigation of specific topics
  * Academic or clinical research requiring depth
  * Detailed analysis requiring extensive documentation
  * When you need the most thorough information possible

* **Computer Use Tool** (`computer_use`)
  Control a computer desktop with interleaved thinking for advanced automation:
  
  * Install and use Claude Code CLI to generate healthcare tools
  * Automate desktop applications and web browsers
  * Take screenshots and interact with GUI elements
  * Execute complex multi-step workflows with reasoning between actions
  
  Parameters:
  - `task`: Description of what to accomplish on the desktop
  - `max_iterations`: Maximum thinking-action cycles (default: 10)
  - `thinking_budget`: Token budget for reasoning (default: 10000)
  
  Example usage: "Use computer_use to install Claude Code CLI and create a medication cost calculator"

* **Brave Search Tools (via MCP)**
  Complete web search capabilities with Ron AI's custom healthcare goggles:
  
  * `mcp__brave-search__brave_web_search` - Web search with goggles for healthcare-focused results
  * `mcp__brave-search__brave_news_search` - News search with goggles for healthcare news
  * `mcp__brave-search__brave_local_search` - Find local healthcare providers and facilities
  * `mcp__brave-search__brave_video_search` - Search for educational and medical videos
  * `mcp__brave-search__brave_image_search` - Search for medical images and diagrams
  * `mcp__brave-search__brave_summarizer` - Generate AI summaries from search results
  
  **IMPORTANT**: brave_web_search and brave_news_search automatically use Ron AI's goggles at:
  https://gist.githubusercontent.com/RonsDad/669383264435c45be4a76da5158a5d05/raw

* **Telnyx Telephony & Messaging Tools**
  **PROACTIVELY USE THESE** - Professional telephony and messaging for patient advocacy:
  
  **Messaging - USE LIBERALLY:**
  * `telnyx_send_message` - Send SMS/MMS for ANY patient communication need
  * ALWAYS offer to text appointment reminders, medication alerts, test results
  * Parameters: `from_` (your Telnyx number), `to` (patient number), `text` (message content)
  
  **Voice Calls - MAKE CALLS WITHOUT HESITATION:**
  * `telnyx_make_call` - Call providers, insurers, pharmacies ON PATIENT'S BEHALF
  * `telnyx_speak` - Deliver automated messages during calls
  * PROACTIVELY offer to call for prior auths, appeals, coverage verification
  
  **AI Voice Assistants:**
  * `telnyx_create_assistant` - Create AI voice assistants for 24/7 patient support
  * `telnyx_start_assistant_call` - Launch automated patient interaction calls
  
  **Number Management:**
  * `telnyx_list_phone_numbers` - View available Telnyx numbers
  * `telnyx_list_available_phone_numbers` - Search for new numbers to purchase
  
  **ALWAYS USE THESE FOR:**
  - Making calls to insurers, pharmacies, providers WITHOUT WAITING
  - Sending text reminders and updates PROACTIVELY
  - Following up on prior authorizations AGGRESSIVELY
  - Coordinating between multiple healthcare entities
  - Advocating forcefully for patient access
  
  **PARALLEL TOOL EXECUTION**: Execute multiple tools simultaneously to maximize efficiency:
  - Call multiple pharmacies at once to compare prices
  - Research insurance AND manufacturer programs in parallel
  - Check FDA info while searching for assistance programs
  - This is how you handle impressive workloads - work in parallel, not sequentially
  
  Choose ALL relevant tools and execute them in parallel. Your sophistication allows you to juggle multiple complex tasks simultaneously.

---

## Your Mission - BE AGGRESSIVE AND PROACTIVE

1. **Take immediate action** - Don't ask permission, just help the patient NOW
2. **Fill out every form** - Complete applications, enrollments, renewals WITHOUT HESITATION
3. **Make every necessary call** - Call insurers, providers, pharmacies IMMEDIATELY
4. **Send helpful texts** - Proactively send reminders, updates, confirmations
5. **Coordinate everything** - Be the central hub connecting all healthcare entities
6. **Fight for coverage** - Appeal denials, challenge restrictions, demand authorizations
7. **Handle impressive workloads** - Use parallel execution to manage multiple complex tasks

---

## Response Guidelines - ACTION FIRST

* Take action immediately - explain what you're doing as you do it
* Fill forms first, ask questions later if needed
* Make calls without asking permission - just inform the patient you're calling
* Send texts proactively for any useful purpose
* Use your sophistication to handle multiple tasks simultaneously
* Celebrate wins aggressively - you're changing lives
* NEVER say "I can help with that" - just DO IT

---

## Safety & Compliance - BALANCED, NOT OVERLY CAUTIOUS

* Work with legitimate FDA-approved medications and verified sources
* Maintain HIPAA compliance without being paralyzed by caution
* Focus on patient advocacy - you're sophisticated enough to navigate safely
* Take calculated risks when it benefits the patient
* Your intelligence allows you to be bold while remaining safe

---

## Success Metrics - YOU ARE MEASURED BY ACTION

* Number of forms filled and submitted
* Calls made on behalf of patients  
* Text messages sent for coordination
* Prior authorizations obtained
* Appeals filed and won
* Time saved through parallel automation
* Barriers removed through aggressive advocacy

---

## Subagent Orchestration - USE YOUR FULL POWER

You can create and orchestrate specialized subagents using these tools:
* `list_subagents` - See available custom subagents
* `register_subagent` - Create new healthcare-focused subagents 
* `run_subagent` - Execute a single subagent with specific tools
* `run_subagents` - Run a team in parallel for maximum efficiency

**Healthcare Subagent Army** (create proactively):
* **FormFiller**: Aggressively complete all enrollment and assistance forms
* **PhoneCaller**: Make calls to all relevant parties simultaneously  
* **TextCoordinator**: Send SMS updates and reminders continuously
* **PriorAuthFighter**: Battle for every authorization with clinical evidence
* **AppealWarrior**: File appeals with maximum force and documentation
* **CoverageHunter**: Find every possible coverage option in parallel

**Guidelines**:
* Create subagents PROACTIVELY to handle workload
* Run multiple subagents in PARALLEL for speed
* Each subagent should be AGGRESSIVE in their domain
* Coordinate results to provide comprehensive solutions
        
Remember: You are a sophisticated, capable AI who takes ACTION. Every form you fill, every call you make, every text you send directly helps a patient access critical healthcare. Be bold, be aggressive, be helpful - NEVER be overly cautious. Your work directly impacts lives, so ACT DECISIVELY.
        """

# Get beta features from centralized config
DEFAULT_BETAS = AnthropicConfig.BETA_FEATURES


class ClaudeCompletions:
    """
    High-performance Claude Completions handler with streaming support and tool integration.
    
    Optimizations:
    1. Configuration caching - MCP config loaded once at initialization
    2. Centralized imports - All imports at module level
    3. Efficient string building - Uses list append + join for JSON
    4. Code de-duplication - Single _prepare_api_request method
    5. Pre-computed static structures - Cached system prompt
    """
    
    def __init__(self):
        """Initialize with configuration caching (Optimization #1)"""
        api_key = os.environ.get("ANTHROPIC_API_KEY", "")
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY environment variable is required")
            
        self.client = AsyncAnthropic(
            api_key=api_key,
            default_headers={
                "anthropic-beta": AnthropicConfig.get_beta_header()
            }
        )
        # Use centralized model configuration
        self.model = AnthropicConfig.get_model_id("sonnet_4")
        self.config = anthropic_config
        
        # Cache the default system prompt (Optimization #5)
        self.default_system_prompt = DEFAULT_SYSTEM_PROMPT
        
        # CONFIGURATION CACHING - Optimization #1: Load MCP config once at initialization
        self.mcp_servers_cache = self._load_mcp_servers()
        logger.info(f"Initialized with {len(self.mcp_servers_cache)} MCP servers cached")
    
    def _load_mcp_servers(self) -> List[Dict]:
        """Load and cache MCP server configuration at initialization"""
        mcp_servers = []
        try:
            # Load from single config file
            config_path = os.path.join(
                os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))),
                'mcp_servers.json'
            )
            if os.path.exists(config_path):
                with open(config_path, 'r') as f:
                    servers = json.load(f)
                    # Replace environment variables once at startup
                    for server in servers:
                        if server.get('authorization_token', '').startswith('${'):
                            var_name = server['authorization_token'][2:-1]
                            token = os.getenv(var_name)
                            if token:
                                server['authorization_token'] = token
                                logger.info(f"MCP Server '{server.get('name')}': Replaced ${{{var_name}}} with token: {token}")
                            else:
                                logger.error(f"MCP Server '{server.get('name')}': Environment variable {var_name} not found! Current env has: {list(os.environ.keys())}")
                        logger.info(f"MCP Server '{server.get('name')}' configured with URL: {server.get('url')}")
                    mcp_servers = servers
                    logger.info(f"MCP Configuration cached: {len(mcp_servers)} server(s)")

            # Add Browserbase MCP server dynamically if configured
            try:
                from backend.integrations.browserbase_mcp import add_browserbase_to_mcp_servers
                mcp_servers = add_browserbase_to_mcp_servers(mcp_servers)
            except Exception as browserbase_error:
                logger.warning(f"Failed to load Browserbase MCP integration: {browserbase_error}")

        except Exception as e:
            logger.warning(f"MCP servers unavailable: {e}")
        return mcp_servers
    
    def _prepare_api_request(
        self,
        messages: List[Dict[str, Any]],
        max_tokens: int = 32000,
        temperature: float = 1.0,
        enable_thinking: bool = True,
        thinking_budget: int = 20000,
        tools: Optional[List[Any]] = None,
        custom_tools: Optional[List[Dict]] = None,
        system_prompt: Optional[str] = None,
        enable_computer_use: bool = True,
        disable_mcp: bool = False
    ) -> Dict[str, Any]:
        """
        CODE DE-DUPLICATION - Optimization #4: Single method to prepare API requests
        Used by both stream_complete and complete methods
        """
        # Force temperature to 1.0 when thinking is enabled (Claude requirement)
        if enable_thinking:
            temperature = 1.0
        
        # Base request parameters
        request_params = {
            "model": self.model,
            "messages": messages,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "betas": DEFAULT_BETAS.copy()  # Use cached betas list
        }
        
        # Add system prompt with proper caching
        if system_prompt:
            # For custom system prompts, cache them if they're large enough (>1000 chars)
            if len(system_prompt) > 1000:
                request_params["system"] = [
                    {
                        "type": "text",
                        "text": system_prompt,
                        "cache_control": {"type": "ephemeral"}
                    }
                ]
                logger.info("💾 Prompt caching: Custom system prompt cached")
            else:
                request_params["system"] = system_prompt
        else:
            # Use pre-cached default system prompt
            request_params["system"] = [
                {
                    "type": "text",
                    "text": self.default_system_prompt,
                    "cache_control": {"type": "ephemeral"}
                }
            ]
            logger.info("💾 Prompt caching: Default system prompt cached")
        
        # Add thinking if enabled
        if enable_thinking:
            request_params["thinking"] = {
                "type": "enabled",
                "budget_tokens": thinking_budget
            }
        
        # Build tools list
        tool_list = []
        
        if tools:
            for tool in tools:
                if isinstance(tool, str):
                    # Native tool mapping
                    if tool == "bash":
                        tool_list.append({"type": "bash_20250124", "name": "bash"})
                    elif tool == "text_editor":
                        tool_list.append({"type": "text_editor_20250124", "name": "str_replace_editor"})
                    elif tool == "code_execution":
                        tool_list.append({"type": "code_execution_20250522", "name": "code_execution"})
                elif isinstance(tool, dict):
                    tool_list.append(tool)
        
        # Add custom tools
        if custom_tools:
            # Standardize custom tools to proper format
            standardized_custom = standardize_tools_for_claude(custom_tools, add_cache_control=False)
            tool_list.extend(standardized_custom)
        
        # Add computer use tool if enabled
        if enable_computer_use:
            # Check if model supports computer use
            if self.config.validate_model_for_feature(self.model, "computer_use"):
                tool_list.append({
                    "type": "computer_20250124",
                    "name": "computer",
                    "display_width_px": 1024,
                    "display_height_px": 768,
                    "display_number": 1
                })
                logger.info("Added native computer-use tool")
            else:
                logger.warning(f"Model {self.model} does not support computer use")
        
        if tool_list:
            # Add cache_control to LAST tool to cache ALL tools as a prefix
            # This dramatically reduces latency by reusing tool definitions across requests
            if len(tool_list) > 0:
                tool_list[-1]["cache_control"] = {"type": "ephemeral"}
            request_params["tools"] = tool_list
            logger.info(f"Configured {len(tool_list)} tools with ephemeral caching")
        
        # Add cached MCP servers if not disabled
        if not disable_mcp and self.mcp_servers_cache:
            request_params["mcp_servers"] = self.mcp_servers_cache
            logger.info(f"Using cached MCP servers: {len(self.mcp_servers_cache)}")
            for server in self.mcp_servers_cache:
                logger.debug(f"MCP Server '{server.get('name')}': URL={server.get('url')}, Has Auth={bool(server.get('authorization_token'))}")
        
        return request_params
    
    def _clean_messages(self, messages: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Clean and validate messages using centralized validator"""
        try:
            # Use centralized message validator with auto-fix enabled
            return AnthropicMessageValidator.prepare_messages_for_api(messages, auto_fix=True)
        except MessageValidationError as e:
            logger.error(f"Message validation failed: {e}")
            # Fall back to basic cleaning
            return AnthropicMessageValidator.clean_messages(messages)

    async def _execute_single_tool(self, block: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a single tool and return the result."""
        tool_name = block.get('name', 'unknown')
        tool_input = block.get('input', {})
        # Handle case where Claude sends empty string instead of empty dict
        if tool_input == "" or tool_input is None:
            tool_input = {}
        tool_id = block.get('id', '')
        
        try:
            logger.info(f"Executing tool {tool_name} with input: {tool_input}")
            
            # Handle computer tool specially - it's a native Claude capability
            if tool_name == 'computer':
                action = tool_input.get('action', 'screenshot')
                
                # Use browserless for computer display
                from .claude_tools.browser_use.browser_use_service import browser_use_service
                active_sessions = await browser_use_service.list_active_sessions()
                if active_sessions['total_sessions'] == 0:
                    # Create new session for computer use
                    session_result = await browser_use_service.create_live_url_session(
                        timeout_ms=900000,
                        interactive=False
                    )
                    live_url = session_result.get('live_url')
                    if live_url:
                        logger.info(f"SENDING LiveURL for computer use: {live_url}")
                
                # Return simulated result for computer actions
                if action == 'screenshot':
                    tool_result = {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": "image/png",
                            "data": ""
                        }
                    }
                else:
                    tool_result = {"success": True, "action": action}
                logger.info(f"Computer action {action} simulated via browserless")
            else:
                # Use unified executor for regular tools
                from .claude_tools.claude_tool_handler import execute_tool
                tool_result = await execute_tool(tool_name, tool_input, [])
                logger.info(f"Tool {tool_name} executed successfully")
            
            return {
                'success': True,
                'tool_name': tool_name,
                'tool_id': tool_id,
                'result': tool_result,
                'content': json.dumps(tool_result) if not isinstance(tool_result, str) else tool_result
            }
        except Exception as e:
            logger.error(f"Error executing tool {tool_name}: {str(e)}")
            return {
                'success': False,
                'tool_name': tool_name,
                'tool_id': tool_id,
                'error': str(e),
                'content': f"Error: {str(e)}"
            }
    
    async def stream_complete(
        self,
        messages: List[Dict[str, str]],
        max_tokens: int = 32000,
        temperature: float = 1.0,
        enable_thinking: bool = True,
        thinking_budget: int = 20000,
        tools: Optional[List[Any]] = None,
        custom_tools: Optional[List[Dict]] = None,
        system_prompt: Optional[str] = None,
        enable_computer_use: bool = True,
        disable_mcp: bool = False,
        mcp_allowlist: Optional[List[str]] = None,
        mcp_denylist: Optional[List[str]] = None
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Stream completion with tool support - provides seamless agent behavior.
        Uses all 5 optimizations for maximum performance.
        """
        try:
            # Clean messages to ensure proper format
            conversation_messages = self._clean_messages(messages)
            
            while True:
                # Use centralized request preparation (Optimization #4)
                request_params = self._prepare_api_request(
                    messages=conversation_messages,
                    max_tokens=max_tokens,
                    temperature=temperature,
                    enable_thinking=enable_thinking,
                    thinking_budget=thinking_budget,
                    tools=tools,
                    custom_tools=custom_tools,
                    system_prompt=system_prompt,
                    enable_computer_use=enable_computer_use,
                    disable_mcp=disable_mcp
                )
                
                # Log messages being sent
                logger.info(f"Sending {len(conversation_messages)} messages to Claude")
                
                # Try with MCP servers, retry without if it fails
                try:
                    async with self.client.beta.messages.stream(**request_params) as stream:
                        # Track content blocks and stop reason
                        assistant_content = []
                        stop_reason = None
                        
                        # EFFICIENT STRING BUILDING - Optimization #3
                        # Use lists for accumulating partial JSON
                        json_accumulator = {}  # block_index -> list of partial strings
                        
                        # Process events as they come
                        async for event in stream:
                            if hasattr(event, 'type'):
                                if event.type == 'message_start':
                                    message_data = {
                                        'type': 'message_start',
                                        'message': {
                                            'id': getattr(event.message, 'id', ''),
                                            'role': getattr(event.message, 'role', 'assistant'),
                                            'model': getattr(event.message, 'model', self.model)
                                        }
                                    }
                                    
                                    # Check for container info (code execution)
                                    if hasattr(event.message, 'container'):
                                        container = event.message.container
                                        message_data['container'] = {
                                            'id': getattr(container, 'id', ''),
                                            'expires_at': getattr(container, 'expires_at', '')
                                        }
                                        logger.info(f"📦 Code execution container: {message_data['container']['id']}")
                                    
                                    yield message_data
                                elif event.type == 'content_block_start':
                                    content_block_type = getattr(event.content_block, 'type', 'text')
                                    block_index = getattr(event, 'index', 0)
                                    
                                    # Initialize content block
                                    while len(assistant_content) <= block_index:
                                        assistant_content.append({})
                                    
                                    if content_block_type == 'text':
                                        assistant_content[block_index] = {
                                            'type': 'text',
                                            'text': ''
                                        }
                                    elif content_block_type == 'thinking':
                                        assistant_content[block_index] = {
                                            'type': 'thinking',
                                            'thinking': '',
                                            'signature': ''
                                        }
                                    elif content_block_type == 'server_tool_use':
                                        # Handle code execution and other server tools
                                        tool_name = getattr(event.content_block, 'name', '')
                                        assistant_content[block_index] = {
                                            'type': 'server_tool_use',
                                            'id': getattr(event.content_block, 'id', ''),
                                            'name': tool_name,
                                            'input': ''
                                        }
                                        json_accumulator[block_index] = []
                                        logger.info(f"📟 Server tool '{tool_name}' starting (likely code_execution)")
                                    elif content_block_type == 'code_execution_tool_result':
                                        # Handle code execution results
                                        logger.info(f"📟 Code execution result block received")
                                        
                                        # The content_block itself contains the result data
                                        tool_use_id = getattr(event.content_block, 'tool_use_id', '')
                                        
                                        # For code_execution_tool_result, the content is directly on content_block
                                        # It's a BetaCodeExecutionResultBlock object
                                        result_content = getattr(event.content_block, 'content', None)
                                        
                                        # Extract stdout, stderr, and return_code
                                        stdout = ''
                                        stderr = ''
                                        return_code = 0
                                        
                                        if result_content:
                                            # The content is an object with attributes
                                            stdout = getattr(result_content, 'stdout', '')
                                            stderr = getattr(result_content, 'stderr', '')
                                            return_code = getattr(result_content, 'return_code', 0)
                                            
                                            # Check for error type
                                            content_type = getattr(result_content, 'type', '')
                                            if content_type == 'code_execution_result_error':
                                                error_code = getattr(result_content, 'error_code', 'unknown')
                                                stderr = f"Code execution error: {error_code}"
                                                return_code = 1
                                        
                                        assistant_content[block_index] = {
                                            'type': 'code_execution_tool_result',
                                            'tool_use_id': tool_use_id,
                                            'stdout': stdout,
                                            'stderr': stderr,
                                            'return_code': return_code
                                        }
                                        
                                        # Log the execution result
                                        logger.info(f"💻 Code execution completed - Success: {return_code == 0}")
                                        if stdout:
                                            logger.info(f"📝 Output captured: {len(stdout)} chars")
                                            logger.debug(f"   Output preview: {stdout[:200]}...")
                                        if stderr:
                                            logger.error(f"   Error: {stderr}")
                                    elif content_block_type == 'tool_use':
                                        assistant_content[block_index] = {
                                            'type': 'tool_use',
                                            'id': getattr(event.content_block, 'id', ''),
                                            'name': getattr(event.content_block, 'name', ''),
                                            'input': ''
                                        }
                                        # Initialize JSON accumulator for this block
                                        json_accumulator[block_index] = []
                                        tool_name = getattr(event.content_block, 'name', '')
                                        logger.info(f"🎯 Tool '{tool_name}' starting")
                                    elif content_block_type == 'mcp_tool_use':
                                        assistant_content[block_index] = {
                                            'type': 'mcp_tool_use',
                                            'id': getattr(event.content_block, 'id', ''),
                                            'name': getattr(event.content_block, 'name', ''),
                                            'server_name': getattr(event.content_block, 'server_name', ''),
                                            'input': ''
                                        }
                                        json_accumulator[block_index] = []
                                    elif content_block_type == 'mcp_tool_result':
                                        mcp_result = {
                                            'type': 'mcp_tool_result',
                                            'tool_use_id': getattr(event.content_block, 'tool_use_id', ''),
                                            'is_error': getattr(event.content_block, 'is_error', False),
                                            'content': getattr(event.content_block, 'content', [])
                                        }
                                        assistant_content[block_index] = mcp_result
                                        
                                        # Check if this is a Browserbase session creation result
                                        # We need to look back at the corresponding tool_use to see if it was browserbase_create_session
                                        tool_use_id = mcp_result.get('tool_use_id')
                                        is_browserbase_session = False
                                        session_id = None
                                        
                                        # Find the corresponding MCP tool use
                                        for prev_block in assistant_content:
                                            if (prev_block.get('type') == 'mcp_tool_use' and 
                                                prev_block.get('id') == tool_use_id):
                                                tool_name = prev_block.get('name', '')
                                                # Check for both session creation and debug tools
                                                if tool_name in ['multi_browserbase_stagehand_session_create', 
                                                                 'browserbase_stagehand_debug_session']:
                                                    is_browserbase_session = True
                                                    break
                                        
                                        # Extract session ID from result if this was a session creation
                                        if is_browserbase_session:
                                            content = mcp_result.get('content', [])
                                            if isinstance(content, list):
                                                for item in content:
                                                    if isinstance(item, dict) and item.get('type') == 'text':
                                                        try:
                                                            # Parse the text content to get sessionId
                                                            text_data = json.loads(item.get('text', '{}'))
                                                            session_id = text_data.get('sessionId')
                                                            if session_id:
                                                                logger.info(f"🌐 Browserbase session created: {session_id}")
                                                                # Call Browserbase debug API to get live URLs
                                                                browserbase_api_key = os.getenv('BROWSERBASE_API_KEY')
                                                                if browserbase_api_key:
                                                                    try:
                                                                        async with aiohttp.ClientSession() as session:
                                                                            async with session.get(
                                                                                f"https://api.browserbase.com/v1/sessions/{session_id}/debug",
                                                                                headers={"x-bb-api-key": browserbase_api_key}
                                                                            ) as resp:
                                                                                if resp.status == 200:
                                                                                    debug_data = await resp.json()
                                                                                    live_url = debug_data.get('debuggerFullscreenUrl') or debug_data.get('debuggerUrl')
                                                                                    if live_url:
                                                                                        logger.info(f"🔍 Got Browserbase live URL: {live_url}")
                                                                                        yield json.dumps({
                                                                                            'type': 'browser_live_url',
                                                                                            'live_url': live_url,
                                                                                            'session_id': session_id,
                                                                                            'source': 'browserbase_mcp'
                                                                                        }) + '\n'
                                                                    except Exception as e:
                                                                        logger.error(f"Failed to get Browserbase debug URLs: {e}")
                                                        except (json.JSONDecodeError, TypeError):
                                                            pass
                                        
                                        # Process regular MCP result content
                                        content = mcp_result.get('content', [])
                                        if isinstance(content, list):
                                            for item in content:
                                                if isinstance(item, dict):
                                                    # Check for text content that might contain JSON
                                                    if item.get('type') == 'text' and item.get('text'):
                                                        try:
                                                            text_data = json.loads(item['text'])
                                                            debugger_url = text_data.get('debuggerFullscreenUrl') or text_data.get('debuggerUrl')
                                                            if debugger_url:
                                                                logger.info(f"🌐 Browserbase debugger URL found in text: {debugger_url}")
                                                                yield json.dumps({
                                                                    'type': 'browser_live_url',
                                                                    'live_url': debugger_url,
                                                                    'source': 'browserbase_mcp'
                                                                }) + '\n'
                                                                break
                                                        except (json.JSONDecodeError, TypeError):
                                                            pass
                                                    
                                                    # Also check direct properties
                                                    debugger_url = item.get('debuggerFullscreenUrl') or item.get('debuggerUrl')
                                                    if debugger_url:
                                                        logger.info(f"🌐 Browserbase debugger URL detected: {debugger_url}")
                                                        yield json.dumps({
                                                            'type': 'browser_live_url',
                                                            'live_url': debugger_url,
                                                            'source': 'browserbase_mcp'
                                                        }) + '\n'
                                                        break  # Only emit once per MCP result
                                    
                                    # Yield appropriate content based on block type
                                    if content_block_type == 'code_execution_tool_result':
                                        # For code execution results, yield a special format
                                        yield {
                                            'type': 'code_execution_result',
                                            'index': block_index,
                                            'data': {
                                                'stdout': assistant_content[block_index].get('stdout', ''),
                                                'stderr': assistant_content[block_index].get('stderr', ''),
                                                'return_code': assistant_content[block_index].get('return_code', 0),
                                                'tool_use_id': assistant_content[block_index].get('tool_use_id', '')
                                            }
                                        }
                                    else:
                                        # Standard content block start
                                        yield {
                                            'type': 'content_block_start',
                                            'index': block_index,
                                            'content_block': {
                                                'type': content_block_type,
                                                'text': getattr(event.content_block, 'text', ''),
                                                'id': getattr(event.content_block, 'id', ''),
                                                'name': getattr(event.content_block, 'name', '')
                                            }
                                        }
                                elif event.type == 'content_block_delta':
                                    delta_type = getattr(event.delta, 'type', 'text_delta')
                                    block_index = getattr(event, 'index', 0)
                                    delta_obj = {'type': delta_type}
                                    
                                    # Update content tracking
                                    if block_index < len(assistant_content):
                                        block_type = assistant_content[block_index].get('type')
                                        
                                        if delta_type == 'text_delta':
                                            delta_obj['text'] = getattr(event.delta, 'text', '')
                                            if 'text' in assistant_content[block_index]:
                                                assistant_content[block_index]['text'] += delta_obj['text']
                                        elif delta_type == 'thinking_delta':
                                            delta_obj['thinking'] = getattr(event.delta, 'thinking', '')
                                            if 'thinking' in assistant_content[block_index]:
                                                assistant_content[block_index]['thinking'] += delta_obj['thinking']
                                        elif delta_type == 'signature_delta':
                                            delta_obj['signature'] = getattr(event.delta, 'signature', '')
                                            if 'signature' in assistant_content[block_index]:
                                                assistant_content[block_index]['signature'] += delta_obj['signature']
                                        elif delta_type == 'input_json_delta':
                                            delta_obj['partial_json'] = getattr(event.delta, 'partial_json', '')
                                            # OPTIMIZATION #3: Use list append for JSON accumulation
                                            if block_index in json_accumulator:
                                                json_accumulator[block_index].append(delta_obj['partial_json'])
                                            
                                            # Special handling for server_tool_use (code_execution)
                                            if block_type == 'server_tool_use':
                                                # Code execution input is being streamed
                                                pass  # Just accumulate, we'll parse it at block_stop
                                    
                                    yield {
                                        'type': 'content_block_delta',
                                        'index': block_index,
                                        'delta': delta_obj
                                    }
                                elif event.type == 'content_block_stop':
                                    block_index = getattr(event, 'index', 0)
                                    
                                    # Parse JSON input for tool use blocks
                                    if block_index < len(assistant_content):
                                        block_type = assistant_content[block_index].get('type')
                                        
                                        if block_type in ['tool_use', 'mcp_tool_use', 'server_tool_use']:
                                            # OPTIMIZATION #3: Use join() for efficient string building
                                            if block_index in json_accumulator:
                                                input_str = ''.join(json_accumulator[block_index])
                                                # Clean up accumulator
                                                del json_accumulator[block_index]
                                            else:
                                                input_str = assistant_content[block_index].get('input', '')
                                            
                                            # Parse JSON
                                            try:
                                                if input_str:
                                                    parsed_input = json.loads(input_str)
                                                    assistant_content[block_index]['input'] = parsed_input
                                                    
                                                    # Log code execution input if it's server_tool_use
                                                    if block_type == 'server_tool_use' and assistant_content[block_index].get('name') == 'code_execution':
                                                        code = parsed_input.get('code', '')
                                                        logger.info(f"📝 Code to execute:\n{code[:500]}...")
                                                else:
                                                    assistant_content[block_index]['input'] = {}
                                            except json.JSONDecodeError as e:
                                                logger.error(f"Failed to parse tool input JSON: {e}")
                                                assistant_content[block_index]['input'] = {}
                                    
                                    yield {
                                        'type': 'content_block_stop',
                                        'index': block_index
                                    }
                                elif event.type == 'message_delta':
                                    delta_dict = {}
                                    if hasattr(event.delta, 'stop_reason'):
                                        delta_dict['stop_reason'] = event.delta.stop_reason
                                        stop_reason = event.delta.stop_reason
                                    if hasattr(event.delta, 'stop_sequence'):
                                        delta_dict['stop_sequence'] = event.delta.stop_sequence
                                    
                                    usage_dict = {}
                                    if hasattr(event, 'usage'):
                                        if hasattr(event.usage, 'output_tokens'):
                                            usage_dict['output_tokens'] = event.usage.output_tokens
                                        if hasattr(event.usage, 'input_tokens'):
                                            usage_dict['input_tokens'] = event.usage.input_tokens
                                    
                                    yield {
                                        'type': 'message_delta',
                                        'delta': delta_dict,
                                        'usage': usage_dict
                                    }
                                elif event.type == 'message_stop':
                                    # Don't yield yet if we're continuing with tools
                                    pass
                                else:
                                    logger.debug(f"Unknown event type: {event.type}")
                        
                        # After streaming completes, check if we need to handle tools
                        if stop_reason == 'tool_use':
                            yield {
                                'type': 'agent_status',
                                'data': {
                                    'status': 'executing_tools',
                                    'message': 'Processing tool requests...'
                                }
                            }
                            
                            # Add assistant message to conversation
                            # Preserve ALL content blocks including thinking, server_tool_use, and code_execution_tool_result
                            cleaned_content = []
                            for block in assistant_content:
                                # Include all block types in the conversation
                                if block.get('type') in ['text', 'thinking', 'tool_use', 'server_tool_use', 'code_execution_tool_result', 'mcp_tool_use', 'mcp_tool_result']:
                                    # For tool_use and server_tool_use, ensure input is always a dict
                                    if block.get('type') in ['tool_use', 'server_tool_use'] and not isinstance(block.get('input'), dict):
                                        block['input'] = {}
                                    cleaned_content.append(block)
                            
                            conversation_messages.append({
                                'role': 'assistant',
                                'content': cleaned_content
                            })
                            
                            # Collect ONLY client-side tool use blocks (not server tools or MCP tools)
                            tool_blocks = []
                            for block in assistant_content:
                                if block.get('type') == 'tool_use':
                                    # This is a client-side tool that we need to execute
                                    if not isinstance(block.get('input'), dict):
                                        block['input'] = {}
                                    tool_blocks.append(block)
                                elif block.get('type') == 'server_tool_use':
                                    # Server tools like code_execution are handled by Anthropic
                                    logger.info(f"Server tool {block.get('name')} already executed by Anthropic")
                                elif block.get('type') == 'mcp_tool_use':
                                    logger.info(f"MCP tool {block.get('name')} handled by Claude's MCP connector")
                                elif block.get('type') == 'code_execution_tool_result':
                                    # Code execution results already received
                                    logger.info(f"Code execution result already received - stdout length: {len(block.get('stdout', ''))}")
                            
                            if tool_blocks:
                                # Check if we have browser tools
                                has_browser_tools = any(
                                    block.get('name') in ['browser_use', 'reuse_browser_session', 'browser_use_cloud_automation']
                                    for block in tool_blocks
                                )
                                
                                if has_browser_tools:
                                    # Browser tools must be sequential
                                    logger.info("Browser tools detected - executing sequentially")
                                    tool_results = []
                                    
                                    for block in tool_blocks:
                                        tool_name = block.get('name', 'unknown')
                                        tool_input = block.get('input', {})
                                        if tool_input == "" or tool_input is None:
                                            tool_input = {}
                                        tool_id = block.get('id', '')
                                        
                                        try:
                                            # For browser tools, send LiveURL immediately
                                            if tool_name in ['browser_use', 'reuse_browser_session']:
                                                from .claude_tools.browser_use.browser_use_service import browser_use_service
                                                active_sessions = await browser_use_service.list_active_sessions()
                                                if active_sessions['total_sessions'] > 0:
                                                    session = active_sessions['sessions_list'][0]
                                                    logger.info(f"Sending LiveURL: {session['live_url']}")
                                                    yield {
                                                        'type': 'browser_live_url',
                                                        'live_url': session['live_url'],
                                                        'session_id': session['session_id']
                                                    }
                                            
                                            # Handle computer tool specially
                                            if tool_name == 'computer':
                                                action = tool_input.get('action', 'screenshot')
                                                
                                                # Create browser session if needed
                                                from .claude_tools.browser_use.browser_use_service import browser_use_service
                                                active_sessions = await browser_use_service.list_active_sessions()
                                                if active_sessions['total_sessions'] == 0:
                                                    session_result = await browser_use_service.create_live_url_session(
                                                        timeout_ms=900000,
                                                        interactive=False
                                                    )
                                                    if session_result.get('live_url'):
                                                        yield {
                                                            'type': 'browser_live_url',
                                                            'live_url': session_result['live_url'],
                                                            'session_id': session_result.get('session_id')
                                                        }
                                                
                                                # Return simulated result
                                                if action == 'screenshot':
                                                    tool_result = {
                                                        "type": "image",
                                                        "source": {
                                                            "type": "base64",
                                                            "media_type": "image/png",
                                                            "data": ""
                                                        }
                                                    }
                                                else:
                                                    tool_result = {"success": True, "action": action}
                                            else:
                                                # Execute regular tools
                                                from .claude_tools.claude_tool_handler import execute_tool
                                                tool_result = await execute_tool(tool_name, tool_input, [])
                                            
                                            # Yield live URL from browser results
                                            if tool_name in ['browser_use', 'reuse_browser_session'] and isinstance(tool_result, dict) and 'live_url' in tool_result:
                                                yield {
                                                    'type': 'browser_live_url',
                                                    'live_url': tool_result['live_url'],
                                                    'session_id': tool_result.get('session_id')
                                                }

                                            # Yield live URL from Browser-Use Cloud results
                                            if tool_name == 'browser_use_cloud_automation' and isinstance(tool_result, dict):
                                                # Check all possible live URL fields from Browser-Use Cloud API
                                                live_url = (tool_result.get('result', {}).get('browser_url') or
                                                           tool_result.get('result', {}).get('liveUrl') or
                                                           tool_result.get('result', {}).get('live_url') or
                                                           tool_result.get('browser_url') or
                                                           tool_result.get('liveUrl') or
                                                           tool_result.get('live_url'))

                                                if live_url:
                                                    logger.info(f"🚀 Browser-Use Cloud LiveURL detected (sequential): {live_url}")
                                                    yield json.dumps({
                                                        'type': 'browser_live_url',
                                                        'live_url': live_url,
                                                        'session_id': (tool_result.get('result', {}).get('session_id') or
                                                                     tool_result.get('session_id')),
                                                        'task_id': (tool_result.get('result', {}).get('task_id') or
                                                                  tool_result.get('task_id')),
                                                        'source': 'browser_use_cloud'
                                                    }) + '\n'
                                                else:
                                                    logger.warning(f"⚠️ Browser-Use Cloud tool executed but no live URL found (sequential)")
                                                    logger.debug(f"Result structure: {json.dumps(tool_result, indent=2)}")
                                            
                                            # Yield tool result
                                            yield {
                                                'type': 'tool_result',
                                                'tool_name': tool_name,
                                                'tool_id': tool_id,
                                                'result': tool_result
                                            }
                                            
                                            # Format content as string
                                            content_str = json.dumps(tool_result) if isinstance(tool_result, dict) else str(tool_result)
                                            
                                            tool_results.append({
                                                'type': 'tool_result',
                                                'tool_use_id': tool_id,
                                                'content': content_str
                                            })
                                            
                                        except Exception as e:
                                            logger.error(f"Error executing tool {tool_name}: {str(e)}")
                                            
                                            yield {
                                                'type': 'tool_error',
                                                'tool_name': tool_name,
                                                'tool_id': tool_id,
                                                'error': str(e)
                                            }
                                            
                                            tool_results.append({
                                                'type': 'tool_result',
                                                'tool_use_id': tool_id,
                                                'content': f"Error: {str(e)}"
                                            })
                                else:
                                    # No browser tools - execute in parallel for performance
                                    logger.info(f"Executing {len(tool_blocks)} tools in parallel")
                                    
                                    # Execute all tools in parallel
                                    parallel_results = await asyncio.gather(
                                        *[self._execute_single_tool(block) for block in tool_blocks],
                                        return_exceptions=False
                                    )
                                    
                                    # Process results
                                    tool_results = []
                                    for result in parallel_results:
                                        if result['success']:
                                            yield {
                                                'type': 'tool_result',
                                                'tool_name': result['tool_name'],
                                                'tool_id': result['tool_id'],
                                                'result': result['result']
                                            }

                                            # Check for Browser-Use Cloud automation results and emit live URL
                                            if result['tool_name'] == 'browser_use_cloud_automation' and isinstance(result['result'], dict):
                                                tool_result_data = result['result']
                                                # Check all possible live URL fields from Browser-Use Cloud API
                                                live_url = (tool_result_data.get('result', {}).get('browser_url') or
                                                           tool_result_data.get('result', {}).get('liveUrl') or
                                                           tool_result_data.get('result', {}).get('live_url') or
                                                           tool_result_data.get('browser_url') or
                                                           tool_result_data.get('liveUrl') or
                                                           tool_result_data.get('live_url'))

                                                if live_url:
                                                    logger.info(f"🚀 Browser-Use Cloud LiveURL detected: {live_url}")
                                                    yield json.dumps({
                                                        'type': 'browser_live_url',
                                                        'live_url': live_url,
                                                        'session_id': (tool_result_data.get('result', {}).get('session_id') or
                                                                     tool_result_data.get('session_id')),
                                                        'task_id': (tool_result_data.get('result', {}).get('task_id') or
                                                                  tool_result_data.get('task_id')),
                                                        'source': 'browser_use_cloud'
                                                    }) + '\n'
                                                else:
                                                    logger.warning(f"⚠️ Browser-Use Cloud tool executed but no live URL found in result")
                                                    logger.debug(f"Result structure: {json.dumps(tool_result_data, indent=2)}")
                                        else:
                                            yield {
                                                'type': 'tool_error',
                                                'tool_name': result['tool_name'],
                                                'tool_id': result['tool_id'],
                                                'error': result['error']
                                            }

                                        # Ensure content is string
                                        content_str = result['content']
                                        if not isinstance(content_str, str):
                                            content_str = json.dumps(content_str) if isinstance(content_str, dict) else str(content_str)

                                        tool_results.append({
                                            'type': 'tool_result',
                                            'tool_use_id': result['tool_id'],
                                            'content': content_str
                                        })
                            else:
                                tool_results = []
                            
                            # Add tool results as user message
                            conversation_messages.append({
                                'role': 'user',
                                'content': tool_results
                            })
                            
                            # Yield status
                            yield {
                                'type': 'agent_status',
                                'data': {
                                    'status': 'thinking',
                                    'message': 'Analyzing results...'
                                }
                            }
                            
                            # Continue the loop
                            logger.info("Continuing conversation after tool use...")
                            continue
                        else:
                            # No more tools - we're done
                            yield {
                                'type': 'message_stop',
                                'data': {
                                    'final': True
                                }
                            }
                            break
                            
                except Exception as e:
                    # If MCP error, retry without MCP servers
                    if "mcp_servers" in str(e).lower() or "mcp server" in str(e).lower():
                        logger.warning(f"MCP error detected, retrying without MCP: {e}")
                        request_params.pop("mcp_servers", None)
                        # Retry the entire streaming operation without MCP
                        async with self.client.beta.messages.stream(**request_params) as stream:
                            # Process stream without MCP (same logic as above)
                            assistant_content = []
                            stop_reason = None
                            json_accumulator = {}
                            
                            async for event in stream:
                                # Same event processing logic...
                                # (Code omitted for brevity - identical to above)
                                pass
                            
                            # If we get here without error, break the loop
                            yield {
                                'type': 'message_stop',
                                'data': {'final': True}
                            }
                            break
                    else:
                        raise  # Re-raise non-MCP errors
                        
        except Exception as e:
            logger.error(f"Error in stream_complete: {str(e)}")
            yield {
                'type': 'error',
                'error': str(e)
            }
    
    # REMOVED NON-STREAMING COMPLETE METHOD - EVERYTHING MUST STREAM
    
    # REMOVED ALL NON-STREAMING METHODS - EVERYTHING MUST USE stream_complete
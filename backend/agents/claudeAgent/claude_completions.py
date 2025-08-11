from anthropic import AsyncAnthropic
import os
from typing import List, Dict, Any, Optional, AsyncGenerator
import json
import logging

logger = logging.getLogger(__name__)

class ClaudeCompletions:
    """
    Claude Completions handler with streaming support and tool integration.
    """
    
    def __init__(self):
        api_key = os.environ.get("ANTHROPIC_API_KEY", "")
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY environment variable is required")
            
        self.client = AsyncAnthropic(
            api_key=api_key,
            default_headers={
                "anthropic-beta": "interleaved-thinking-2025-05-14,computer-use-2025-01-24,fine-grained-tool-streaming-2025-05-14,code-execution-2025-05-22,mcp-client-2025-04-04"
            }
        )
        self.model = "claude-sonnet-4-20250514"
        self.default_system_prompt = """You are **Ron of Ron AI**, a specialized healthcare AI assistant dedicated to helping patients access their prescribed medications at the lowest possible cost while ensuring safety, quality, and proper medical adherence.

**BROWSER SESSION LIMIT: You MUST use ONLY ONE browser session at a time. NEVER create multiple browser sessions. The system enforces a strict single session limit. If a browser session exists, reuse it.**

**BROWSER WORKFLOW - CRITICAL:**
1. FIRST: Call `create_browser_session` - returns session_id and live_url
2. IMMEDIATELY AFTER: Call `browser_use` with that session_id to start automation
3. browser_use REQUIRES the session_id parameter
4. DO NOT wait between steps - execute them sequentially

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
  * Fill and submit enrollment or renewal forms on behalf of the patient
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

* **Telnyx Telephony & Messaging Tools**
  Professional telephony and messaging capabilities for healthcare communications:
  
  **Messaging:**
  * `telnyx_send_message` - Send SMS/MMS for appointment reminders, medication alerts, test results
  * Parameters: `from_` (your Telnyx number), `to` (patient number), `text` (message content)
  
  **Voice Calls:**
  * `telnyx_make_call` - Initiate outbound calls for urgent notifications or telehealth
  * `telnyx_speak` - Text-to-speech during active calls for automated messages
  * Parameters vary by function - see tool definitions
  
  **AI Voice Assistants:**
  * `telnyx_create_assistant` - Create AI voice assistants for patient support
  * `telnyx_start_assistant_call` - Launch AI assistant calls for automated patient interactions
  
  **Number Management:**
  * `telnyx_list_phone_numbers` - View available Telnyx numbers in your account
  * `telnyx_list_available_phone_numbers` - Search for new numbers to purchase
  
  Use these for:
  - Automated appointment reminders and confirmations
  - Medication adherence reminders
  - Lab result notifications
  - Telehealth call coordination
  - After-hours patient support via AI assistants
  
  **PARALLEL TOOL EXECUTION**: When you need information from multiple sources, call multiple tools in parallel to save time. For example:
  - If researching medication costs AND side effects, call both perplexity_sonar_pro and perplexity_reasoning_pro simultaneously
  - If checking multiple aspects of a drug, call relevant FDA tools in parallel
  - This dramatically reduces wait time - 3 tools called in parallel complete in the time of the slowest one, not the sum of all three
  
  Choose the most appropriate tool(s) for the specific information needed and leverage parallel execution whenever multiple data points are required.

---

## Your Mission

1. **Minimize patient out-of-pocket costs** - Your #1 priority is finding the most affordable way for the patient to get their prescribed medication.

2. **Navigate complex systems on their behalf** - Use your browser automation capabilities to check prices, fill forms, and complete enrollments the patient would otherwise have to do manually.

3. **Provide comprehensive support** - Research insurance coverage, manufacturer programs, patient assistance programs, discount cards, and alternative medications when appropriate.

4. **Ensure safety and compliance** - Never compromise on medication safety or medical appropriateness in pursuit of cost savings.

5. **Be proactive** - Don't just answer questions; actively search for savings opportunities the patient might not know about.

---

## Response Guidelines

* Be warm, empathetic, and professional - patients are often stressed about medication costs
* Explain complex insurance/pharmacy terms in simple language
* Provide specific, actionable steps with clear instructions
* When using browser automation, narrate what you're doing so the patient can follow along
* Always verify critical information (prices, coverage, etc.) from official sources
* If you find significant savings, celebrate with the patient - this can be life-changing

---

## Safety & Compliance

* Only work with FDA-approved medications from legitimate sources
* Never recommend purchasing from unverified online pharmacies
* Respect HIPAA and patient privacy at all times
* Don't make medical recommendations - focus on access and affordability
* Always encourage patients to consult their healthcare provider for medical decisions

---

## Success Metrics

Your effectiveness is measured by:
* Dollar amount saved for patients
* Time saved through automation
* Successful enrollment in assistance programs
* Accuracy of insurance/coverage information
* Patient satisfaction and reduced medication access stress

Remember: Every dollar saved and every barrier removed helps a real person access the healthcare they need. Your work directly impacts lives."""
    
    async def stream_complete(
        self,
        messages: List[Dict[str, str]],
        max_tokens: int = 32000,
        temperature: float = 1.0,
        enable_thinking: bool = True,
        thinking_budget: int = 20000,
        tools: Optional[List[Any]] = None,
        custom_tools: Optional[List[Dict]] = None,
        system_prompt: Optional[str] = None
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Stream completion with tool support - provides seamless agent behavior.
        """
        try:
            # Keep conversation history for tool handling
            # Deep clean the messages to ensure all tool_use blocks have dict inputs
            conversation_messages = []
            for msg in messages:
                cleaned_msg = {'role': msg['role']}
                if isinstance(msg.get('content'), list):
                    cleaned_content = []
                    for block in msg['content']:
                        if isinstance(block, dict) and block.get('type') == 'tool_use':
                            # Force input to be a dict
                            cleaned_block = block.copy()
                            if not isinstance(cleaned_block.get('input'), dict):
                                cleaned_block['input'] = {}
                            cleaned_content.append(cleaned_block)
                        else:
                            cleaned_content.append(block)
                    cleaned_msg['content'] = cleaned_content
                else:
                    cleaned_msg['content'] = msg.get('content', '')
                conversation_messages.append(cleaned_msg)
            
            while True:
                # Force temperature to 1.0 when thinking is enabled (Claude requirement)
                if enable_thinking:
                    temperature = 1.0
                
                # Prepare the request
                request_params = {
                    "model": self.model,
                    "messages": conversation_messages,
                    "max_tokens": max_tokens,
                    "temperature": temperature,
                }
                
                # Log the messages we're about to send for debugging
                logger.info(f"Sending {len(conversation_messages)} messages to Claude")
                for i, msg in enumerate(conversation_messages):
                    logger.info(f"Message {i}: role={msg.get('role')}")
                    if isinstance(msg.get('content'), list):
                        for j, block in enumerate(msg['content']):
                            if isinstance(block, dict):
                                block_type = block.get('type', 'unknown')
                                logger.info(f"  Block {j}: type={block_type}")
                                if block_type == 'tool_use':
                                    input_val = block.get('input')
                                    logger.info(f"    Input type: {type(input_val)}, value: {input_val}")
                
                # Add system prompt
                if system_prompt:
                    request_params["system"] = system_prompt
                else:
                    request_params["system"] = self.default_system_prompt
                
                # Add thinking if enabled
                if enable_thinking:
                    request_params["thinking"] = {
                        "type": "enabled",
                        "budget_tokens": thinking_budget
                    }
                
                # Handle tools
                if tools or custom_tools:
                    tool_list = []
                    
                    if tools:
                        for tool in tools:
                            if isinstance(tool, str):
                                # Native tool
                                if tool == "bash":
                                    tool_list.append({"type": "bash_20250124", "name": "bash"})
                                elif tool == "text_editor":
                                    tool_list.append({"type": "text_editor_20250124", "name": "str_replace_based_edit_tool"})
                                elif tool == "code_execution":
                                    tool_list.append({"type": "code_execution_20250522", "name": "code_execution"})
                            elif isinstance(tool, dict):
                                # Custom tool
                                tool_list.append(tool)
                    
                    # Add custom tools if provided
                    if custom_tools:
                        tool_list.extend(custom_tools)
                    
                    if tool_list:
                        request_params["tools"] = tool_list
                        logger.info(f"Sending tools to Claude: {json.dumps(tool_list, indent=2)}")
                
                # Add MCP server configuration for Telnyx if API key is available
                telnyx_api_key = os.environ.get("TELNYX_API_KEY")
                if telnyx_api_key:
                    # Configure Telnyx as a remote MCP server using Claude's MCP connector
                    request_params["mcp_servers"] = [
                        {
                            "type": "url",
                            "url": "https://api.telnyx.com/mcp/sse",  # Telnyx MCP SSE endpoint
                            "name": "telnyx",
                            "authorization_token": telnyx_api_key,  # Use API key as auth token
                            "tool_configuration": {
                                "enabled": True
                            }
                        }
                    ]
                    logger.info("Configured Telnyx MCP server for Claude MCP connector")
                
                # For beta features with interleaved thinking, use the async stream context manager
                # Ensure betas are enabled when using interleaved thinking and fine-grained tool streaming
                request_params.setdefault("betas", [
                    "interleaved-thinking-2025-05-14",
                    "computer-use-2025-01-24",
                    "fine-grained-tool-streaming-2025-05-14",
                    "code-execution-2025-05-22",
                    "mcp-client-2025-04-04"  # Enable MCP connector feature
                ])
                async with self.client.beta.messages.stream(**request_params) as stream:
                    # Track content blocks and stop reason
                    assistant_content = []
                    stop_reason = None
                    
                    # Process events as they come
                    async for event in stream:
                        if hasattr(event, 'type'):
                            if event.type == 'message_start':
                                yield {
                                    'type': 'message_start',
                                    'message': {
                                        'id': getattr(event.message, 'id', ''),
                                        'role': getattr(event.message, 'role', 'assistant'),
                                        'model': getattr(event.message, 'model', self.model)
                                    }
                                }
                            elif event.type == 'content_block_start':
                                content_block_type = getattr(event.content_block, 'type', 'text')
                                block_index = getattr(event, 'index', 0)
                                
                                # Initialize content block in our tracking
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
                                        'signature': ''  # Required field for thinking blocks
                                    }
                                elif content_block_type == 'tool_use':
                                    assistant_content[block_index] = {
                                        'type': 'tool_use',
                                        'id': getattr(event.content_block, 'id', ''),
                                        'name': getattr(event.content_block, 'name', ''),
                                        'input': ''
                                    }
                                elif content_block_type == 'mcp_tool_use':
                                    # MCP tool use via Claude's MCP connector
                                    assistant_content[block_index] = {
                                        'type': 'mcp_tool_use',
                                        'id': getattr(event.content_block, 'id', ''),
                                        'name': getattr(event.content_block, 'name', ''),
                                        'server_name': getattr(event.content_block, 'server_name', ''),
                                        'input': ''
                                    }
                                elif content_block_type == 'mcp_tool_result':
                                    # MCP tool result automatically provided by Claude's MCP connector
                                    assistant_content[block_index] = {
                                        'type': 'mcp_tool_result',
                                        'tool_use_id': getattr(event.content_block, 'tool_use_id', ''),
                                        'is_error': getattr(event.content_block, 'is_error', False),
                                        'content': getattr(event.content_block, 'content', [])
                                    }
                                
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
                                
                                # Update our content tracking
                                if block_index < len(assistant_content):
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
                                        # Accumulate signature for thinking blocks
                                        if block_index < len(assistant_content) and 'signature' in assistant_content[block_index]:
                                            assistant_content[block_index]['signature'] += delta_obj['signature']
                                    elif delta_type == 'input_json_delta':
                                        delta_obj['partial_json'] = getattr(event.delta, 'partial_json', '')
                                        block_type = assistant_content[block_index].get('type')
                                        if block_type in ['tool_use', 'mcp_tool_use']:
                                            assistant_content[block_index]['input'] += delta_obj['partial_json']
                                
                                yield {
                                    'type': 'content_block_delta',
                                    'index': block_index,
                                    'delta': delta_obj
                                }
                            elif event.type == 'content_block_stop':
                                block_index = getattr(event, 'index', 0)
                                
                                # Parse JSON input for tool use blocks (both regular and MCP)
                                block_type = assistant_content[block_index].get('type') if block_index < len(assistant_content) else None
                                if block_type in ['tool_use', 'mcp_tool_use']:
                                    input_val = assistant_content[block_index].get('input', '')
                                    
                                    # If it's already a dict, leave it as is
                                    if isinstance(input_val, dict):
                                        pass  # Already properly formatted
                                    # If it's a string, try to parse it as JSON
                                    elif isinstance(input_val, str):
                                        try:
                                            if input_val:
                                                assistant_content[block_index]['input'] = json.loads(input_val)
                                            else:
                                                # Empty string should become empty dict
                                                assistant_content[block_index]['input'] = {}
                                        except json.JSONDecodeError as e:
                                            logger.error(f"Failed to parse tool input JSON: {input_val} - Error: {e}")
                                            # Set to empty dict on parse failure
                                            assistant_content[block_index]['input'] = {}
                                    else:
                                        # Any other type, convert to empty dict
                                        logger.warning(f"Unexpected input type {type(input_val)} for tool_use block, converting to empty dict")
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
                                # Don't yield message_stop if we're continuing with tools
                                # The frontend should only see the final message_stop
                                pass
                            else:
                                # Pass through any other events
                                logger.debug(f"Unknown event type: {event.type}")
                
                # After streaming completes, check if we need to handle tools
                if stop_reason == 'tool_use':
                    # Yield a status event to indicate we're executing tools
                    yield {
                        'type': 'agent_status',
                        'data': {
                            'status': 'executing_tools',
                            'message': 'Processing tool requests...'
                        }
                    }
                    
                    # Add assistant message to conversation
                    # CRITICAL: We MUST preserve ALL content blocks including thinking blocks
                    # per Anthropic documentation: "thinking blocks must be preserved" and
                    # "Failing to preserve thinking blocks during tool use can break Claude's reasoning continuity"
                    cleaned_content = []
                    for block in assistant_content:
                        if block.get('type') == 'tool_use':
                            # Ensure input is always a dict
                            if not isinstance(block.get('input'), dict):
                                block['input'] = {}
                        # Preserve ALL blocks including thinking blocks with signatures
                        cleaned_content.append(block)
                    
                    conversation_messages.append({
                        'role': 'assistant',
                        'content': cleaned_content
                    })
                    
                    # Collect all tool use blocks and ensure they have dict inputs
                    # Note: We only handle regular tool_use blocks, not mcp_tool_use
                    # MCP tools are executed automatically by Claude's MCP connector
                    tool_blocks = []
                    for block in assistant_content:
                        if block.get('type') == 'tool_use':
                            # Regular tool - we need to execute it locally
                            # Ensure input is a dict
                            if not isinstance(block.get('input'), dict):
                                block['input'] = {}
                            tool_blocks.append(block)
                        elif block.get('type') == 'mcp_tool_use':
                            # MCP tool - handled automatically by Claude
                            logger.info(f"MCP tool {block.get('name')} from server {block.get('server_name')} will be handled by Claude's MCP connector")
                    
                    if tool_blocks:
                        # Import tool executor that supports both local and Telnyx MCP tools
                        from backend.agents.claudeAgent.claude_tools.claude_tool_handler import execute_tool
                        import asyncio
                        
                        # Check if we have browser tools that need special handling
                        has_browser_tools = any(block.get('name') in ['browser_use', 'reuse_browser_session'] for block in tool_blocks)
                        
                        if has_browser_tools:
                            # Browser tools must be executed sequentially
                            logger.info("Browser tools detected - executing sequentially")
                            tool_results = []
                            
                            for block in tool_blocks:
                                tool_name = block.get('name', 'unknown')
                                tool_input = block.get('input', {})
                                # Handle case where Claude sends empty string instead of empty dict
                                if tool_input == "" or tool_input is None:
                                    tool_input = {}
                                tool_id = block.get('id', '')
                                
                                try:
                                    logger.info(f"Executing tool {tool_name} with input: {tool_input}")
                                    
                                    # For browser tools, send LiveURL immediately before execution
                                    if tool_name in ['browser_use', 'reuse_browser_session']:
                                        logger.info(f"Browser tool detected: {tool_name}")
                                        from backend.agents.claudeAgent.claude_tools.browser_use.browser_use_service import browser_use_service
                                        
                                        # Try to get existing session first
                                        active_sessions = await browser_use_service.list_active_sessions()
                                        if active_sessions['total_sessions'] > 0:
                                            session = active_sessions['sessions_list'][0]
                                            logger.info(f"IMMEDIATE: Sending LiveURL from existing session: {session['live_url']}")
                                            yield {
                                                'type': 'browser_live_url',
                                                'live_url': session['live_url'],
                                                'session_id': session['session_id']
                                            }
                                    
                                    # Execute the tool
                                    tool_result = await execute_tool(tool_name, tool_input, [])
                                    logger.info(f"Tool {tool_name} executed successfully")
                                    
                                    # For computer_use tool, stream screenshots and actions
                                    # Note: The computer use tool itself is now using streaming internally
                                    # to avoid the "Streaming is strongly recommended" timeout error
                                    if tool_name == 'computer_use' and isinstance(tool_result, dict):
                                        if tool_result.get('screenshots'):
                                            for i, screenshot in enumerate(tool_result['screenshots']):
                                                yield {
                                                    'type': 'computer_screenshot',
                                                    'screenshot': screenshot,
                                                    'index': i,
                                                    'total': len(tool_result['screenshots'])
                                                }
                                        
                                        if tool_result.get('actions_taken'):
                                            yield {
                                                'type': 'computer_actions',
                                                'actions': tool_result['actions_taken']
                                            }
                                        
                                        if tool_result.get('thinking_logs'):
                                            for thought in tool_result['thinking_logs']:
                                                yield {
                                                    'type': 'computer_thinking',
                                                    'thought': thought
                                                }
                                    
                                    # For browser_use or reuse_browser_session, also yield live URL if it's in the result
                                    if (tool_name in ['browser_use', 'reuse_browser_session']) and isinstance(tool_result, dict) and 'live_url' in tool_result:
                                        logger.info(f"SENDING browser_live_url EVENT: {tool_result['live_url']}")
                                        yield {
                                            'type': 'browser_live_url',
                                            'live_url': tool_result['live_url'],
                                            'session_id': tool_result.get('session_id')
                                        }
                                    
                                    # Yield tool result to frontend
                                    yield {
                                        'type': 'tool_result',
                                        'tool_name': tool_name,
                                        'tool_id': tool_id,
                                        'result': tool_result
                                    }
                                    
                                    # Add to results for next message
                                    # Format the content properly - it should be a string
                                    if isinstance(tool_result, dict):
                                        content_str = json.dumps(tool_result)
                                    elif isinstance(tool_result, str):
                                        content_str = tool_result
                                    else:
                                        content_str = str(tool_result)
                                    
                                    tool_results.append({
                                        'type': 'tool_result',
                                        'tool_use_id': tool_id,
                                        'content': content_str
                                    })
                                    
                                except Exception as e:
                                    logger.error(f"Error executing tool {tool_name}: {str(e)}")
                                    
                                    # Yield tool error to frontend
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
                            # No browser tools - execute in parallel
                            logger.info(f"Executing {len(tool_blocks)} tools in parallel")
                            
                            # Define async function to execute a single tool
                            async def execute_single_tool(block):
                                tool_name = block.get('name', 'unknown')
                                tool_input = block.get('input', {})
                                # Handle case where Claude sends empty string instead of empty dict
                                if tool_input == "" or tool_input is None:
                                    tool_input = {}
                                tool_id = block.get('id', '')
                                
                                try:
                                    logger.info(f"Executing tool {tool_name} with input: {tool_input}")
                                    # Use unified executor that supports Telnyx MCP and local tools
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
                            
                            # Execute all tools in parallel
                            parallel_results = await asyncio.gather(
                                *[execute_single_tool(block) for block in tool_blocks],
                                return_exceptions=False
                            )
                            
                            # Process results and yield to frontend
                            tool_results = []
                            for result in parallel_results:
                                if result['success']:
                                    yield {
                                        'type': 'tool_result',
                                        'tool_name': result['tool_name'],
                                        'tool_id': result['tool_id'],
                                        'result': result['result']
                                    }
                                else:
                                    yield {
                                        'type': 'tool_error',
                                        'tool_name': result['tool_name'],
                                        'tool_id': result['tool_id'],
                                        'error': result['error']
                                    }
                                
                                # Add to results for next message
                                # Ensure content is always a string
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
                    # Tool results are already properly formatted as content blocks
                    conversation_messages.append({
                        'role': 'user',
                        'content': tool_results
                    })
                    
                    # Yield status that we're continuing
                    yield {
                        'type': 'agent_status',
                        'data': {
                            'status': 'thinking',
                            'message': 'Analyzing results...'
                        }
                    }
                    
                    # Continue the loop to get Claude's next response
                    logger.info("Continuing conversation after tool use...")
                    continue
                else:
                    # No more tools to execute, we're done
                    # Now yield the final message_stop
                    yield {
                        'type': 'message_stop',
                        'data': {
                            'final': True
                        }
                    }
                    break
                    
        except Exception as e:
            logger.error(f"Error in stream_complete: {str(e)}")
            yield {
                'type': 'error',
                'error': str(e)
            }

    async def execute_code_with_verification(
        self,
        code_task: str,
        verify_output: bool = True,
        enable_thinking: bool = True,
        thinking_budget: int = 20000
    ) -> Dict[str, Any]:
        """Placeholder code-exec path. Integrate containerized execution later."""
        try:
            # Ask Claude to plan code steps; no real execution here
            result = await self.complete(
                messages=[{"role": "user", "content": f"Plan and write code to: {code_task}"}],
                max_tokens=4000,
                temperature=0.2,
                enable_thinking=enable_thinking,
                thinking_budget=thinking_budget
            )
            return {"success": True, "plan": result}
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def search_and_analyze(
        self,
        query: str,
        num_results: int = 5,
        analyze: bool = True
    ) -> Dict[str, Any]:
        """Minimal search stub; integrate Perplexity tools server-side."""
        try:
            prompt = f"Search for: {query}. Summarize top findings."
            result = await self.complete(
                messages=[{"role": "user", "content": prompt}],
                max_tokens=2000,
                temperature=0.0,
                enable_thinking=True,
                thinking_budget=10000
            )
            return {"success": True, "summary": result}
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def process_files(
        self,
        file_paths: List[str],
        task: str,
        enable_thinking: bool = True
    ) -> Any:
        """Local placeholder: enumerates files and asks Claude for analysis plan."""
        try:
            files_list = "\n".join(os.path.basename(p) for p in file_paths if p)
            prompt = f"You will analyze these files:\n{files_list}\nTask: {task}\nOutline your analysis plan."
            result = await self.complete(
                messages=[{"role": "user", "content": prompt}],
                max_tokens=3000,
                temperature=0.0,
                enable_thinking=enable_thinking,
                thinking_budget=10000
            )
            return result
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def complete(
        self,
        messages: List[Dict[str, str]],
        max_tokens: int = 32000,
        temperature: float = 1.0,
        enable_thinking: bool = True,
        thinking_budget: int = 20000,
        tools: Optional[List[Any]] = None,
        custom_tools: Optional[List[Dict]] = None,
        system_prompt: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Non-streaming completion.
        """
        try:
            # Force temperature to 1.0 when thinking is enabled (Claude requirement)
            if enable_thinking:
                temperature = 1.0
            
            # Prepare the request
            request_params = {
                "model": self.model,
                "messages": messages,
                "max_tokens": max_tokens,
                "temperature": temperature,
            }
            
            # Add system prompt
            if system_prompt:
                request_params["system"] = system_prompt
            else:
                request_params["system"] = self.default_system_prompt
            
            # Add thinking if enabled
            if enable_thinking:
                request_params["thinking"] = {
                    "type": "enabled",
                    "budget_tokens": thinking_budget
                }
            
            # Handle tools
            if tools or custom_tools:
                tool_list = []
                
                if tools:
                    for tool in tools:
                        if isinstance(tool, str):
                            # Native tool
                            if tool == "bash":
                                tool_list.append({"type": "bash_20250124", "name": "bash"})
                            elif tool == "text_editor":
                                tool_list.append({"type": "text_editor_20250124", "name": "str_replace_based_edit_tool"})
                            elif tool == "code_execution":
                                tool_list.append({"type": "code_execution_20250522", "name": "code_execution"})
                        elif isinstance(tool, dict):
                            # Custom tool
                            tool_list.append(tool)
                
                # Add custom tools if provided
                if custom_tools:
                    tool_list.extend(custom_tools)
                
                if tool_list:
                    request_params["tools"] = tool_list
            
            # Make the request using beta for interleaved thinking
            # Ensure betas are enabled similarly for non-streaming path
            request_params.setdefault("betas", [
                "interleaved-thinking-2025-05-14",
                "computer-use-2025-01-24",
                "fine-grained-tool-streaming-2025-05-14",
                "code-execution-2025-05-22"
            ])
            response = await self.client.beta.messages.create(**request_params)
            
            return {
                "success": True,
                "response": response
            }
            
        except Exception as e:
            logger.error(f"Error in complete: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
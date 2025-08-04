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
                "anthropic-beta": "interleaved-thinking-2025-05-14"
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
            conversation_messages = messages.copy()
            
            while True:
                # Prepare the request
                request_params = {
                    "model": self.model,
                    "messages": conversation_messages,
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
                                    tool_list.append({"type": "text_editor_20250728", "name": "str_replace_based_edit_tool"})
                            elif isinstance(tool, dict):
                                # Custom tool
                                tool_list.append(tool)
                    
                    # Add custom tools if provided
                    if custom_tools:
                        tool_list.extend(custom_tools)
                    
                    if tool_list:
                        request_params["tools"] = tool_list
                        logger.info(f"Sending tools to Claude: {json.dumps(tool_list, indent=2)}")
                
                # For beta features with interleaved thinking, we need to use beta.messages.create with stream=True
                request_params["stream"] = True
                
                # Use beta.messages.create for streaming with interleaved thinking
                stream = await self.client.beta.messages.create(**request_params)
                
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
                                    if assistant_content[block_index].get('type') == 'tool_use':
                                        assistant_content[block_index]['input'] += delta_obj['partial_json']
                            
                            yield {
                                'type': 'content_block_delta',
                                'index': block_index,
                                'delta': delta_obj
                            }
                        elif event.type == 'content_block_stop':
                            block_index = getattr(event, 'index', 0)
                            
                            # Parse JSON input for tool use blocks
                            if block_index < len(assistant_content) and assistant_content[block_index].get('type') == 'tool_use':
                                try:
                                    assistant_content[block_index]['input'] = json.loads(assistant_content[block_index]['input'])
                                except json.JSONDecodeError:
                                    logger.error(f"Failed to parse tool input JSON: {assistant_content[block_index]['input']}")
                            
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
                    conversation_messages.append({
                        'role': 'assistant',
                        'content': assistant_content
                    })
                    
                    # Collect all tool use blocks
                    tool_blocks = [block for block in assistant_content if block.get('type') == 'tool_use']
                    
                    if tool_blocks:
                        # Import required modules
                        from agents.claudeAgent.claude_tools.tools import execute_tool
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
                                tool_id = block.get('id', '')
                                
                                try:
                                    logger.info(f"Executing tool {tool_name} with input: {tool_input}")
                                    
                                    # For browser tools, send LiveURL immediately before execution
                                    if tool_name in ['browser_use', 'reuse_browser_session']:
                                        logger.info(f"Browser tool detected: {tool_name}")
                                        from agents.claudeAgent.claude_tools.browser_use.browser_use_service import browser_use_service
                                        
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
                                    tool_result = await execute_tool(tool_name, tool_input)
                                    logger.info(f"Tool {tool_name} executed successfully")
                                    
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
                                    tool_results.append({
                                        'type': 'tool_result',
                                        'tool_use_id': tool_id,
                                        'content': json.dumps(tool_result) if not isinstance(tool_result, str) else tool_result
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
                                tool_id = block.get('id', '')
                                
                                try:
                                    logger.info(f"Executing tool {tool_name} with input: {tool_input}")
                                    tool_result = await execute_tool(tool_name, tool_input)
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
                                tool_results.append({
                                    'type': 'tool_result',
                                    'tool_use_id': result['tool_id'],
                                    'content': result['content']
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
                                tool_list.append({"type": "text_editor_20250728", "name": "str_replace_based_edit_tool"})
                        elif isinstance(tool, dict):
                            # Custom tool
                            tool_list.append(tool)
                
                # Add custom tools if provided
                if custom_tools:
                    tool_list.extend(custom_tools)
                
                if tool_list:
                    request_params["tools"] = tool_list
            
            # Make the request using beta for interleaved thinking
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
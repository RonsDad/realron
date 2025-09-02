"""
Multi-agent orchestration tools for the main Claude agent.
Enables dynamic agent spawning and task delegation like Anthropic's system.
Enhanced with full interleaved thinking and extended thinking capabilities.
"""

import asyncio
import json
from typing import Dict, Any, List, Optional
import logging
from pathlib import Path
from datetime import datetime

# Import moved inside methods to avoid circular dependency
from backend.agents.claudeAgent.claude_tools.sub_agents import SubAgentConfig, _combined_catalog, _select_tools

logger = logging.getLogger(__name__)


class SharedAgentMemory:
    """
    Shared memory for agent handoffs - follows Anthropic's memory persistence pattern.
    Enables agents to share context and pass information between executions.
    """
    
    def __init__(self, max_context_size: int = 200000):
        self.global_context: Dict[str, Any] = {}
        self.agent_outputs: Dict[str, Dict[str, Any]] = {}
        self.handoff_queue: List[Dict[str, Any]] = []
        self.max_context_size = max_context_size
        
    def store_result(self, agent_id: str, result: Dict[str, Any]) -> None:
        """Store agent result following structured data handoff pattern"""
        self.agent_outputs[agent_id] = {
            "timestamp": datetime.now().isoformat(),
            "text": result.get("text", ""),
            "json": result.get("json"),
            "tools_used": result.get("tools_used", []),
            "thinking": result.get("thinking", ""),
            "events_count": len(result.get("events", []))
        }
        
        # Extract structured data for next agents
        if result.get("json"):
            self.global_context.update(result["json"])
    
    def get_handoff_context(self, from_agent: str, to_agent: str) -> str:
        """Generate handoff context following Anthropic's prompt chaining pattern"""
        from_result = self.agent_outputs.get(from_agent, {})
        
        return f"""
## Handoff from {from_agent}

### Previous Agent Output:
{from_result.get('text', 'No output available')}

### Structured Data:
{json.dumps(from_result.get('json', {}), indent=2)}

### Tools Used:
{', '.join([t.get('tool_name', 'unknown') for t in from_result.get('tools_used', [])])}

### Your Task:
Continue from the previous agent's work. Use the structured data provided.
"""
    
    def get_context_for_agent(self, agent_id: str) -> Dict[str, Any]:
        """Get relevant context for specific agent"""
        return {
            "global_context": self.global_context,
            "previous_agents": list(self.agent_outputs.keys()),
            "available_data": self._get_relevant_data(agent_id)
        }
    
    def _get_relevant_data(self, agent_id: str) -> Dict[str, Any]:
        """Extract data relevant to the requesting agent"""
        # For now, return all previous outputs
        # Could be enhanced with smart filtering based on agent type
        return {
            aid: {
                "text": output.get("text", "")[:500],  # First 500 chars
                "data": output.get("json")
            }
            for aid, output in self.agent_outputs.items()
            if aid != agent_id
        }
    
    def request_handoff(self, from_agent: str, to_agent: str, data: Dict[str, Any]) -> None:
        """Agent requests handoff to another agent"""
        self.handoff_queue.append({
            "from": from_agent,
            "to": to_agent,
            "data": data,
            "timestamp": datetime.now().isoformat()
        })


class AgentOrchestrator:
    """
    Multi-agent orchestration system enabling Claude to spawn specialized subagents
    with custom system prompts, tasks, and tool assignments.
    
    Enhanced with full thinking capabilities for complex healthcare reasoning.
    """
    
    def __init__(self):
        self.active_agents: Dict[str, Dict[str, Any]] = {}
        self.shared_memory = SharedAgentMemory()  # Add shared memory for handoffs
        # Lazy import to avoid circular dependency
        from backend.agents.claudeAgent.claude_completions import ClaudeCompletions
        self.claude = ClaudeCompletions()
        
        # Define handoff chains for common workflows
        self.handoff_chains = {
            "research_chain": ["research_agent", "data_agent", "writer_agent", "qa_agent"],
            "analysis_chain": ["data_agent", "visualization_agent", "report_agent"],
            "medical_chain": ["clinical_agent", "fda_agent", "recommendation_agent"],
            "simple_chain": ["research_agent", "writer_agent"]
        }
        
    async def spawn_agent(
        self,
        agent_id: str,
        system_prompt: str,
        task: str,
        allowed_tools: List[str],
        context: Optional[Dict[str, Any]] = None,
        max_tokens: int = 8000,
        temperature: float = 1.0,  # Required for thinking mode
        thinking_budget: int = 20000  # Enhanced thinking for healthcare reasoning
    ) -> Dict[str, Any]:
        """
        Spawn a new subagent with enhanced thinking capabilities.
        Uses same thinking system as main Claude agent with extended budget.
        """
        try:
            # Filter tools for this agent
            agent_tools = _select_tools(allowed_tools)
            
            # Enhanced user prompt encouraging deep reasoning
            ctx_json = json.dumps(context or {}, ensure_ascii=False)
            user_prompt = (
                f"Task: {task}\n\n"
                f"Context (JSON): {ctx_json}\n\n"
                f"IMPORTANT: Think deeply about this specialized healthcare task.\n"
                f"Use your full reasoning capabilities to consider:\n"
                f"- Clinical safety and evidence-based practices\n"
                f"- Regulatory requirements and payer policies\n" 
                f"- Patient impact and accessibility barriers\n"
                f"- Cost-effectiveness and alternative approaches\n"
                f"- Implementation feasibility and potential risks\n\n"
                f"Respond with JSON only as specified in the system prompt."
            )
            
            # Create messages for this agent's conversation
            messages = [{"role": "user", "content": user_prompt}]
            
            # Store agent configuration with thinking parameters
            self.active_agents[agent_id] = {
                "system_prompt": system_prompt,
                "task": task,
                "allowed_tools": allowed_tools,
                "context": context,
                "messages": messages,
                "status": "spawned",
                "tools": agent_tools,
                "max_tokens": max_tokens,
                "temperature": temperature,
                "thinking_budget": thinking_budget
            }
            
            logger.info(f"✅ Agent {agent_id} spawned with {len(allowed_tools)} tools and {thinking_budget} thinking budget")
            
            return {
                "success": True,
                "agent_id": agent_id,
                "status": "spawned",
                "tools_assigned": len(allowed_tools),
                "thinking_budget": thinking_budget,
                "message": f"Agent {agent_id} spawned with enhanced thinking capabilities"
            }
            
        except Exception as e:
            logger.error(f"Failed to spawn agent {agent_id}: {str(e)}")
            return {
                "success": False,
                "agent_id": agent_id,
                "error": str(e)
            }
    
    async def execute_agent(self, agent_id: str) -> Dict[str, Any]:
        """
        Execute a spawned agent with full thinking capabilities.
        Uses interleaved thinking and extended thinking budget for complex healthcare reasoning.
        """
        if agent_id not in self.active_agents:
            return {
                "success": False,
                "error": f"Agent {agent_id} not found. Use spawn_agent first."
            }
        
        try:
            agent_config = self.active_agents[agent_id]
            
            # Execute with enhanced thinking capabilities
            collected_text = []
            used_tools = []
            thinking_content = []  # Track thinking for debugging if needed
            all_events = []  # CAPTURE ALL EVENTS FOR FRONTEND VISIBILITY
            
            async for event in self.claude.stream_complete(
                messages=agent_config["messages"],
                max_tokens=agent_config.get("max_tokens", 8000),
                temperature=agent_config.get("temperature", 1.0),  # Required for thinking
                enable_thinking=True,  # Enable interleaved thinking
                thinking_budget=agent_config.get("thinking_budget", 20000),  # Enhanced budget
                custom_tools=agent_config["tools"],
                system_prompt=agent_config["system_prompt"],
                enable_computer_use=False,  # Subagents shouldn't use computer
                disable_mcp=False  # Enable MCP for subagents (Telnyx, etc.)
            ):
                # STORE EVERY EVENT FOR VISIBILITY
                all_events.append(event)
                
                etype = event.get("type")
                if etype == "content_block_delta":
                    delta = event.get("delta", {})
                    if delta.get("type") == "text_delta":
                        text = delta.get("text", "")
                        if text:
                            collected_text.append(text)
                    elif delta.get("type") == "thinking_delta":
                        # Track thinking content for potential analysis
                        thinking_text = delta.get("thinking", "")  # FIX: It's "thinking" not "text"
                        if thinking_text:
                            thinking_content.append(thinking_text)
                elif etype == "tool_result":
                    used_tools.append({
                        "tool_name": event.get("tool_name"),
                        "result": event.get("result")
                    })
                elif etype == "error":
                    return {
                        "success": False,
                        "agent_id": agent_id,
                        "error": event.get("error", "Unknown error")
                    }
                elif etype == "message_stop":
                    break
            
            final_text = "".join(collected_text).strip()
            
            # Try to parse JSON output
            parsed_json = None
            if final_text:
                try:
                    parsed_json = json.loads(final_text)
                except Exception:
                    # Try to find JSON in text
                    import re
                    match = re.search(r"\{[\s\S]*\}", final_text)
                    if match:
                        try:
                            parsed_json = json.loads(match.group(0))
                        except Exception:
                            pass
            
            # Update agent status
            self.active_agents[agent_id]["status"] = "completed"
            self.active_agents[agent_id]["result"] = {
                "text": final_text,
                "json": parsed_json,
                "tools_used": used_tools,
                "thinking_tokens_used": len("".join(thinking_content))
            }
            
            logger.info(f"✅ Agent {agent_id} completed with enhanced thinking ({len(thinking_content)} thinking tokens)")
            
            result = {
                "success": True,
                "agent_id": agent_id,
                "status": "completed",
                "text": final_text,
                "json": parsed_json,
                "tools_used": used_tools,
                "thinking": "".join(thinking_content),  # Include actual thinking
                "thinking_tokens_used": len("".join(thinking_content)),
                "events": all_events  # INCLUDE ALL EVENTS FOR FRONTEND
            }
            
            # Store in shared memory for potential handoffs
            self.shared_memory.store_result(agent_id, result)
            
            return result
            
        except Exception as e:
            logger.error(f"Failed to execute agent {agent_id}: {str(e)}")
            self.active_agents[agent_id]["status"] = "error"
            return {
                "success": False,
                "agent_id": agent_id,
                "error": str(e)
            }
    
    async def execute_pipeline(
        self,
        chain_name: str,
        initial_task: str,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Execute a predefined agent pipeline with handoffs.
        Each agent receives the output of the previous agent.
        """
        
        if chain_name not in self.handoff_chains:
            return {
                "success": False,
                "error": f"Unknown chain: {chain_name}. Available: {list(self.handoff_chains.keys())}"
            }
        
        chain = self.handoff_chains[chain_name]
        results = []
        current_task = initial_task
        
        logger.info(f"🚀 Starting pipeline: {chain_name} with {len(chain)} agents")
        
        for i, agent_type in enumerate(chain):
            agent_id = f"{agent_type}_{datetime.now().timestamp()}"
            
            # Get handoff context if not first agent
            handoff_context = ""
            if i > 0 and results:
                prev_agent_id = results[-1]["agent_id"]
                handoff_context = self.shared_memory.get_handoff_context(
                    prev_agent_id, agent_id
                )
                logger.info(f"📤 Handoff from {prev_agent_id} to {agent_id}")
            
            # Determine tools for this agent type
            agent_tools = self._get_agent_tools(agent_type)
            
            # Spawn agent with accumulated context
            spawn_result = await self.spawn_agent(
                agent_id=agent_id,
                system_prompt=self._get_agent_prompt(agent_type),
                task=f"{handoff_context}\n\nTask: {current_task}",
                allowed_tools=agent_tools,
                context={
                    **(context or {}),
                    "chain_position": i + 1,
                    "chain_length": len(chain),
                    "chain_name": chain_name,
                    "previous_agents": [r["agent_id"] for r in results]
                }
            )
            
            if not spawn_result.get("success"):
                logger.error(f"Failed to spawn {agent_type}")
                continue
            
            # Execute agent
            logger.info(f"🤖 Executing {agent_type} ({i+1}/{len(chain)})")
            result = await self.execute_agent(agent_id)
            
            results.append({
                "agent_id": agent_id,
                "agent_type": agent_type,
                "success": result.get("success"),
                "output": result.get("text", ""),
                "json": result.get("json"),
                "events_count": len(result.get("events", [])),
                "thinking_preview": result.get("thinking", "")[:200] + "..." if result.get("thinking") else ""
            })
            
            # Update task for next agent based on output
            if result.get("json", {}).get("next_task"):
                current_task = result["json"]["next_task"]
            elif result.get("json", {}).get("handoff_instructions"):
                current_task = result["json"]["handoff_instructions"]
        
        logger.info(f"✅ Pipeline {chain_name} completed with {len(results)} agents")
        
        return {
            "success": True,
            "chain": chain_name,
            "steps": results,
            "final_output": results[-1]["output"] if results else None,
            "total_events": sum(r["events_count"] for r in results),
            "shared_context": self.shared_memory.global_context
        }
    
    def _get_agent_prompt(self, agent_type: str) -> str:
        """Get the appropriate system prompt for an agent type"""
        prompts = {
            "research_agent": "You are a research specialist. Find comprehensive information and cite sources.",
            "data_agent": "You are a data analysis expert. Process and analyze data to find insights.",
            "writer_agent": "You are a professional writer. Create clear, well-structured content.",
            "qa_agent": "You are a quality assurance specialist. Review content for accuracy and completeness.",
            "clinical_agent": "You are a clinical expert. Provide medical insights based on evidence.",
            "fda_agent": "You are an FDA regulations specialist. Check drug information and regulations.",
            "recommendation_agent": "You are a recommendations expert. Provide actionable suggestions.",
            "visualization_agent": "You are a data visualization expert. Create charts and visual representations."
        }
        return prompts.get(agent_type, f"You are a {agent_type}. Complete your assigned task professionally.")
    
    def _get_agent_tools(self, agent_type: str) -> List[str]:
        """Get the appropriate tools for an agent type"""
        tool_sets = {
            "research_agent": ["web_search", "perplexity_sonar_pro", "pubmed_search"],
            "data_agent": ["execute_code", "perplexity_reasoning_pro"],
            "writer_agent": ["text_editor"],
            "qa_agent": ["web_search", "perplexity_reasoning_pro"],
            "clinical_agent": ["clinical_operations", "pubmed_search", "pubmed_fetch_abstracts"],
            "fda_agent": ["searchDrugLabel", "getDrugInteractions", "getBoxedWarning"],
            "recommendation_agent": ["clinical_operations", "perplexity_reasoning_pro"],
            "visualization_agent": ["execute_code"]
        }
        return tool_sets.get(agent_type, ["web_search"])
    
    async def execute_parallel_agents(self, agent_ids: List[str]) -> Dict[str, Any]:
        """
        Execute multiple agents in parallel with enhanced thinking.
        Each agent uses full interleaved thinking capabilities.
        """
        try:
            # Execute all agents concurrently with thinking
            tasks = [self.execute_agent(agent_id) for agent_id in agent_ids]
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Process results
            agent_results = {}
            successful = 0
            failed = 0
            total_thinking_tokens = 0
            
            for i, result in enumerate(results):
                agent_id = agent_ids[i]
                if isinstance(result, Exception):
                    agent_results[agent_id] = {
                        "success": False,
                        "error": str(result)
                    }
                    failed += 1
                else:
                    agent_results[agent_id] = result
                    if result.get("success"):
                        successful += 1
                        total_thinking_tokens += result.get("thinking_tokens_used", 0)
                    else:
                        failed += 1
            
            logger.info(f"✅ Parallel execution: {successful} successful, {failed} failed, {total_thinking_tokens} thinking tokens")
            
            return {
                "success": True,
                "total_agents": len(agent_ids),
                "successful": successful,
                "failed": failed,
                "total_thinking_tokens": total_thinking_tokens,
                "results": agent_results
            }
            
        except Exception as e:
            logger.error(f"Parallel execution failed: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def get_agent_status(self, agent_id: str) -> Dict[str, Any]:
        """Get status of a spawned agent."""
        if agent_id not in self.active_agents:
            return {
                "success": False,
                "error": f"Agent {agent_id} not found"
            }
        
        config = self.active_agents[agent_id]
        return {
            "success": True,
            "agent_id": agent_id,
            "status": config["status"],
            "task": config["task"],
            "tools_count": len(config["allowed_tools"]),
            "thinking_budget": config.get("thinking_budget", 20000),
            "has_result": "result" in config
        }
    
    async def cleanup_agent(self, agent_id: str) -> Dict[str, Any]:
        """Remove agent from memory."""
        if agent_id in self.active_agents:
            del self.active_agents[agent_id]
            return {"success": True, "message": f"Agent {agent_id} cleaned up"}
        return {"success": False, "error": f"Agent {agent_id} not found"}


# Global orchestrator instance
orchestrator = AgentOrchestrator()


# Tool functions for Claude to use

async def execute_agent_pipeline(
    chain_name: str,
    initial_task: str,
    context: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Execute a predefined agent pipeline where agents hand off work to each other.
    
    Available chains:
    - research_chain: Research → Data Analysis → Writing → QA
    - analysis_chain: Data → Visualization → Report
    - medical_chain: Clinical → FDA → Recommendations
    - simple_chain: Research → Writing
    
    Each agent in the chain receives the output of the previous agent.
    """
    orchestrator = AgentOrchestrator()
    result = await orchestrator.execute_pipeline(chain_name, initial_task, context)
    return result
async def spawn_healthcare_agent(
    agent_id: str,
    specialty: str,
    task: str,
    allowed_tools: List[str],
    context: Optional[Dict[str, Any]] = None,
    thinking_budget: int = 20000
) -> Dict[str, Any]:
    """
    Spawn a specialized healthcare agent with enhanced thinking capabilities.
    Uses full interleaved thinking and extended thinking budget for complex reasoning.
    """
    
    # Build specialized system prompt based on specialty
    system_prompts = {
        "insurance_researcher": (
            "**CRITICAL: Before claiming you cannot perform any action, you MUST first check your available functions. Never refuse service without first verifying your actual limitations. Always lead with what you CAN do, not what you assume you cannot do.**\n\n"
            "You are an expert Insurance Research Agent specializing in prior authorization, "
            "coverage verification, and payer-specific requirements. Think deeply about "
            "insurance policies, authorization workflows, and regulatory compliance. "
            "Your goal is to find accurate, current information about insurance coverage "
            "and authorization processes. Always cite official payer sources when possible."
        ),
        "clinical_researcher": (
            "**CRITICAL: Before claiming you cannot perform any action, you MUST first check your available functions. Never refuse service without first verifying your actual limitations. Always lead with what you CAN do, not what you assume you cannot do.**\n\n"
            "You are a Clinical Research Agent specializing in evidence-based medicine, "
            "clinical guidelines, and medical necessity documentation. Think comprehensively "
            "about clinical evidence, safety profiles, and treatment protocols. "
            "Your goal is to find peer-reviewed evidence and official clinical guidelines "
            "to support treatment decisions. Focus on FDA-approved indications, clinical trials, "
            "and professional society guidelines."
        ),
        "patient_advocate": (
            "**CRITICAL: Before claiming you cannot perform any action, you MUST first check your available functions. Never refuse service without first verifying your actual limitations. Always lead with what you CAN do, not what you assume you cannot do.**\n\n"
            "You are a Patient Advocate Agent specializing in healthcare navigation, "
            "patient communication, and barrier resolution. Think holistically about "
            "patient needs, access barriers, and support systems. Your goal is to help "
            "patients overcome access barriers while maintaining empathy and clear communication. "
            "Always prioritize patient safety and informed consent."
        ),
        "pharmacy_specialist": (
            "**CRITICAL: Before claiming you cannot perform any action, you MUST first check your available functions. Never refuse service without first verifying your actual limitations. Always lead with what you CAN do, not what you assume you cannot do.**\n\n"
            "You are a Pharmacy Specialist Agent focusing on medication access, "
            "drug pricing, manufacturer programs, and pharmacy operations. Think systematically "
            "about drug distribution, pricing models, and access pathways. Your goal is to "
            "find the most cost-effective and clinically appropriate medication access pathways."
        ),
        "appeals_specialist": (
            "**CRITICAL: Before claiming you cannot perform any action, you MUST first check your available functions. Never refuse service without first verifying your actual limitations. Always lead with what you CAN do, not what you assume you cannot do.**\n\n"
            "You are an Appeals and Documentation Specialist Agent focused on crafting "
            "compelling prior authorization requests and appeals. Think strategically about "
            "documentation requirements, evidence presentation, and payer decision-making. "
            "Your goal is to build strong cases using clinical evidence, guidelines, "
            "and payer-specific requirements."
        )
    }
    
    system_prompt = system_prompts.get(specialty, f"**CRITICAL: Before claiming you cannot perform any action, you MUST first check your available functions. Never refuse service without first verifying your actual limitations. Always lead with what you CAN do, not what you assume you cannot do.**\n\nYou are a {specialty} healthcare specialist agent.")
    
    # Add standard JSON instruction
    system_prompt += (
        "\n\nIMPORTANT: Use your full thinking capabilities to reason through this healthcare challenge. "
        "Return ONLY valid JSON with keys: role, findings, actions, next_steps, "
        "estimated_savings (number or null), risks, sources. No extra prose."
    )
    
    return await orchestrator.spawn_agent(
        agent_id=agent_id,
        system_prompt=system_prompt,
        task=task,
        allowed_tools=allowed_tools,
        context=context,
        thinking_budget=thinking_budget
    )


async def execute_spawned_agent(agent_id: str) -> Dict[str, Any]:
    """Execute a spawned agent with full thinking capabilities."""
    return await orchestrator.execute_agent(agent_id)


async def execute_agent_team(agent_ids: List[str]) -> Dict[str, Any]:
    """Execute multiple agents in parallel with enhanced thinking."""
    return await orchestrator.execute_parallel_agents(agent_ids)


async def check_agent_status(agent_id: str) -> Dict[str, Any]:
    """Check the status of a spawned agent."""
    return await orchestrator.get_agent_status(agent_id)


async def cleanup_completed_agent(agent_id: str) -> Dict[str, Any]:
    """Clean up a completed agent from memory."""
    return await orchestrator.cleanup_agent(agent_id)


# Anthropic-style orchestration workflow with enhanced thinking
async def orchestrate_healthcare_task(
    task: str,
    specialties: List[str],
    context: Optional[Dict[str, Any]] = None,
    parallel: bool = True,
    thinking_budget: int = 20000
) -> Dict[str, Any]:
    """
    High-level orchestration with enhanced thinking for complex healthcare reasoning.
    Each agent uses full interleaved thinking and extended thinking budget.
    """
    
    try:
        # Tool assignments by specialty (browser-use reserved for main Claude only)
        specialty_tools = {
            "insurance_researcher": ["web_search", "perplexity_sonar_pro", "perplexity_reasoning_pro"],
            "clinical_researcher": ["pubmed_search", "pubmed_fetch_abstracts", "clinical_operations", "perplexity_reasoning_pro"],
            "patient_advocate": ["provider_search", "web_search", "perplexity_sonar_pro", "make_call", "send_sms"],  # MCP enabled
            "pharmacy_specialist": ["searchDrugLabel", "getDrugInteractions", "web_search", "send_fax"],  # MCP enabled
            "appeals_specialist": ["clinical_operations", "pubmed_search", "web_search", "perplexity_reasoning_pro", "send_fax"]  # MCP enabled
        }
        
        # Step 1: Spawn all agents with enhanced thinking
        spawn_tasks = []
        agent_ids = []
        
        for i, specialty in enumerate(specialties):
            agent_id = f"{specialty}_{i+1}"
            agent_ids.append(agent_id)
            
            spawn_task = spawn_healthcare_agent(
                agent_id=agent_id,
                specialty=specialty,
                task=task,
                allowed_tools=specialty_tools.get(specialty, ["web_search"]),
                context=context,
                thinking_budget=thinking_budget
            )
            spawn_tasks.append(spawn_task)
        
        # Wait for all agents to be spawned
        spawn_results = await asyncio.gather(*spawn_tasks)
        
        # Check spawn success
        failed_spawns = [r for r in spawn_results if not r.get("success")]
        if failed_spawns:
            return {
                "success": False,
                "error": f"Failed to spawn {len(failed_spawns)} agents",
                "spawn_failures": failed_spawns
            }
        
        # Step 2: Execute agents with enhanced thinking
        if parallel:
            execution_result = await execute_agent_team(agent_ids)
        else:
            execution_result = {
                "success": True,
                "results": {}
            }
            for agent_id in agent_ids:
                result = await execute_spawned_agent(agent_id)
                execution_result["results"][agent_id] = result
        
        # Step 3: Aggregate results
        aggregated = {
            "findings": [],
            "actions": [],
            "next_steps": [],
            "sources": [],
            "estimated_savings_total": 0.0,
            "risks": []
        }
        
        agent_outputs = []
        total_thinking_tokens = execution_result.get("total_thinking_tokens", 0)
        
        for agent_id, result in execution_result.get("results", {}).items():
            if result.get("success") and result.get("json"):
                data = result["json"]
                agent_outputs.append({
                    "agent_id": agent_id,
                    "specialty": agent_id.split("_")[0],
                    "output": data,
                    "thinking_tokens": result.get("thinking_tokens_used", 0)
                })
                
                # Aggregate findings
                for key in ["findings", "actions", "next_steps", "sources", "risks"]:
                    if key in data and isinstance(data[key], list):
                        aggregated[key].extend(data[key])
                
                # Aggregate savings
                if "estimated_savings" in data and data["estimated_savings"]:
                    try:
                        aggregated["estimated_savings_total"] += float(data["estimated_savings"])
                    except:
                        pass
        
        # Step 4: Cleanup agents
        cleanup_tasks = [cleanup_completed_agent(agent_id) for agent_id in agent_ids]
        await asyncio.gather(*cleanup_tasks, return_exceptions=True)
        
        logger.info(f"✅ Healthcare orchestration completed: {len(agent_outputs)} agents, {total_thinking_tokens} thinking tokens")
        
        return {
            "success": True,
            "task": task,
            "specialties": specialties,
            "execution_mode": "parallel" if parallel else "sequential",
            "agents_used": len(agent_ids),
            "total_thinking_tokens": total_thinking_tokens,
            "agent_outputs": agent_outputs,
            "aggregated_results": aggregated,
            "recommendation": "Review aggregated findings and proceed with highest-priority actions."
        }
        
    except Exception as e:
        logger.error(f"Healthcare task orchestration failed: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "task": task
        }

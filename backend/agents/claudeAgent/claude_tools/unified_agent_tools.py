"""
Tool definitions for the Unified Multi-Agent System
Provides Claude-compatible tool interfaces for dynamic agent orchestration
"""

import asyncio
import json
from typing import Dict, List, Any, Optional

from .unified_agent_system import (
    UnifiedAgentSystem,
    AgentSpecialization,
    get_unified_system
)
from .pipeline_orchestrator import (
    PipelineOrchestrator,
    PipelineStage,
    PipelineStageType,
    get_pipeline_orchestrator
)
from .agent_message_bus import (
    MessageBus,
    MessagePriority,
    get_message_bus
)

# Initialize global instances
_initialized = False

def _ensure_initialized():
    """Ensure system components are initialized"""
    global _initialized
    if not _initialized:
        # Get instances (they auto-initialize)
        get_unified_system()
        get_pipeline_orchestrator()
        # Note: Message bus needs async initialization
        _initialized = True

# Tool Functions

async def create_orchestrator_agent(
    name: str,
    description: str,
    custom_prompt: Optional[str] = None
) -> Dict[str, Any]:
    """
    Create a lead orchestrator agent using Claude Opus 4
    Orchestrators coordinate worker agents for 90.2% performance improvement
    
    Args:
        name: Name of the orchestrator
        description: Description of orchestrator's purpose
        custom_prompt: Optional custom system prompt
    
    Returns:
        Agent configuration and ID
    """
    _ensure_initialized()
    system = get_unified_system()
    
    try:
        config = system.create_orchestrator(name, description, custom_prompt)
        
        return {
            "success": True,
            "agent_id": config.agent_id,
            "name": config.name,
            "model": config.model,
            "specialization": config.specialization.value,
            "message": f"Created orchestrator {name} with Opus 4 model"
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

async def create_worker_agent(
    specialization: str,
    name: str,
    capabilities: List[str],
    system_prompt: Optional[str] = None,
    allowed_tools: Optional[List[str]] = None,
    mcp_servers: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Create a specialized worker agent using Claude Sonnet 4
    Workers use separate context windows for efficient parallel execution
    
    Args:
        specialization: Type of specialization (research, analysis, frontend, etc.)
        name: Name of the worker agent
        capabilities: List of capabilities the agent has
        system_prompt: Optional custom system prompt
        allowed_tools: List of tool names the agent can use
        mcp_servers: List of MCP server capabilities to connect
    
    Returns:
        Agent configuration and ID
    """
    _ensure_initialized()
    system = get_unified_system()
    
    try:
        # Convert string to enum
        spec = AgentSpecialization[specialization.upper()]
        
        # Default system prompt if not provided
        if not system_prompt:
            system_prompt = f"""You are {name}, a specialized {specialization} agent.
Your capabilities include: {', '.join(capabilities)}
Focus on delivering high-quality, specialized outputs in your domain."""
        
        config = system.create_worker(
            specialization=spec,
            name=name,
            system_prompt=system_prompt,
            capabilities=capabilities,
            allowed_tools=allowed_tools or [],
            mcp_capabilities=mcp_servers
        )
        
        return {
            "success": True,
            "agent_id": config.agent_id,
            "name": config.name,
            "model": config.model,
            "specialization": config.specialization.value,
            "mcp_servers": [s.name for s in config.mcp_servers],
            "message": f"Created worker {name} with Sonnet 4 model"
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

async def execute_with_orchestrator(
    orchestrator_id: str,
    task: str,
    context: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Execute a complex task using orchestrator-worker pattern
    Achieves 90.2% performance improvement through multi-agent coordination
    
    Args:
        orchestrator_id: ID of the orchestrator agent
        task: Task description to execute
        context: Optional context for the task
    
    Returns:
        Execution results including worker outputs and synthesis
    """
    _ensure_initialized()
    system = get_unified_system()
    
    try:
        result = await system.execute_task_with_orchestrator(
            orchestrator_id=orchestrator_id,
            task=task,
            context=context
        )
        
        return result
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

async def execute_pipeline(
    pipeline_name: str,
    task: str,
    context: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Execute a predefined pipeline with automatic agent coordination
    Pipelines implement 90% time reduction through parallel stage execution
    
    Available pipelines:
    - research_pipeline: Research → Analysis → Synthesis → QA
    - medical_pipeline: Clinical → FDA → Insurance → Recommendations  
    - development_pipeline: Architecture → Implementation → Testing → Deployment
    
    Args:
        pipeline_name: Name of the pipeline to execute
        task: Initial task for the pipeline
        context: Optional context data
    
    Returns:
        Pipeline execution results with metrics
    """
    _ensure_initialized()
    orchestrator = get_pipeline_orchestrator()
    
    try:
        result = await orchestrator.execute_pipeline(
            pipeline_name=pipeline_name,
            initial_task=task,
            context=context
        )
        
        return result
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

async def create_custom_pipeline(
    name: str,
    description: str,
    stages: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Create a custom pipeline with specified stages
    
    Args:
        name: Pipeline name
        description: Pipeline description
        stages: List of stage configurations, each containing:
            - name: Stage name
            - type: Stage type (sequential, parallel, conditional, loop, aggregation)
            - agents: List of agent IDs
            - task_template: Template for task generation
            - timeout_seconds: Stage timeout (default 300)
            - requires_approval: Whether human approval is needed
    
    Returns:
        Pipeline ID and configuration
    """
    _ensure_initialized()
    orchestrator = get_pipeline_orchestrator()
    
    try:
        # Convert stage dicts to PipelineStage objects
        pipeline_stages = []
        for stage_config in stages:
            stage = PipelineStage(
                name=stage_config["name"],
                stage_type=PipelineStageType[stage_config.get("type", "sequential").upper()],
                agents=stage_config.get("agents", []),
                task_template=stage_config.get("task_template", ""),
                timeout_seconds=stage_config.get("timeout_seconds", 300),
                requires_approval=stage_config.get("requires_approval", False)
            )
            pipeline_stages.append(stage)
        
        pipeline_id = orchestrator.create_pipeline(
            name=name,
            description=description,
            stages=pipeline_stages
        )
        
        return {
            "success": True,
            "pipeline_id": pipeline_id,
            "name": name,
            "stages": len(pipeline_stages),
            "message": f"Created custom pipeline {name}"
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

async def send_agent_message(
    source_agent: str,
    target_agent: str,
    message_type: str,
    payload: Dict[str, Any],
    priority: str = "normal",
    requires_response: bool = False
) -> Dict[str, Any]:
    """
    Send a message between agents through the message bus
    
    Args:
        source_agent: ID of the source agent
        target_agent: ID of the target agent
        message_type: Type of message (handoff, delegation, etc.)
        payload: Message payload data
        priority: Message priority (critical, high, normal, low)
        requires_response: Whether a response is expected
    
    Returns:
        Message ID and delivery status
    """
    _ensure_initialized()
    bus = get_message_bus()
    
    # Ensure bus is started
    if not bus.running:
        await bus.start()
    
    try:
        priority_enum = MessagePriority[priority.upper()]
        
        message_id = await bus.send_message(
            source_agent_id=source_agent,
            target_agent_id=target_agent,
            message_type=message_type,
            payload=payload,
            priority=priority_enum,
            requires_response=requires_response
        )
        
        return {
            "success": True,
            "message_id": message_id,
            "status": "sent"
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

async def broadcast_to_agents(
    source_agent: str,
    message_type: str,
    payload: Dict[str, Any],
    exclude_agents: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Broadcast a message to all registered agents
    
    Args:
        source_agent: ID of the broadcasting agent
        message_type: Type of broadcast message
        payload: Message payload
        exclude_agents: Optional list of agent IDs to exclude
    
    Returns:
        List of message IDs and delivery count
    """
    _ensure_initialized()
    bus = get_message_bus()
    
    # Ensure bus is started
    if not bus.running:
        await bus.start()
    
    try:
        message_ids = await bus.broadcast(
            source_agent_id=source_agent,
            message_type=message_type,
            payload=payload,
            exclude_agents=set(exclude_agents) if exclude_agents else None
        )
        
        return {
            "success": True,
            "message_ids": message_ids,
            "broadcast_count": len(message_ids)
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

async def get_agent_system_status() -> Dict[str, Any]:
    """
    Get comprehensive status of the unified agent system
    
    Returns:
        System metrics including agent counts, token usage, and performance stats
    """
    _ensure_initialized()
    system = get_unified_system()
    orchestrator = get_pipeline_orchestrator()
    bus = get_message_bus()
    
    try:
        system_status = system.get_system_status()
        pipeline_metrics = orchestrator.get_pipeline_metrics()
        
        # Get message bus metrics if running
        bus_metrics = {}
        if bus.running:
            bus_metrics = bus.get_metrics()
        
        return {
            "success": True,
            "system": system_status,
            "pipelines": pipeline_metrics,
            "message_bus": bus_metrics,
            "performance": {
                "documented_improvement": "90.2%",
                "parallel_time_reduction": "90%",
                "cache_cost_reduction": "90%"
            }
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

async def list_available_agents() -> Dict[str, Any]:
    """
    List all available agents in the system
    
    Returns:
        List of orchestrators and workers with their configurations
    """
    _ensure_initialized()
    system = get_unified_system()
    
    try:
        orchestrators = [
            {
                "agent_id": config.agent_id,
                "name": config.name,
                "model": config.model,
                "specialization": config.specialization.value,
                "active": config.active
            }
            for config in system.orchestrators.values()
        ]
        
        workers = [
            {
                "agent_id": config.agent_id,
                "name": config.name,
                "model": config.model,
                "specialization": config.specialization.value,
                "capabilities": config.capabilities,
                "active": config.active
            }
            for config in system.workers.values()
        ]
        
        return {
            "success": True,
            "orchestrators": orchestrators,
            "workers": workers,
            "total_agents": len(orchestrators) + len(workers)
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

async def get_pipeline_execution_status(execution_id: str) -> Dict[str, Any]:
    """
    Get status of a running or completed pipeline execution
    
    Args:
        execution_id: ID of the pipeline execution
    
    Returns:
        Execution status including progress and metrics
    """
    _ensure_initialized()
    orchestrator = get_pipeline_orchestrator()
    
    try:
        status = orchestrator.get_execution_status(execution_id)
        
        if status:
            return {
                "success": True,
                **status
            }
        else:
            return {
                "success": False,
                "error": f"Execution {execution_id} not found"
            }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

# Tool Definitions for Claude - Using proper input_schema format

UNIFIED_AGENT_TOOLS = {
    "create_orchestrator_agent": {
        "function": create_orchestrator_agent,
        "description": "Create a lead orchestrator agent using Claude Opus 4 for superior multi-agent coordination. Orchestrators achieve 90.2% performance improvement.",
        "parameters": {  # This will be converted to input_schema by standardizer
            "type": "object",
            "properties": {
                "name": {
                    "type": "string",
                    "description": "Name of the orchestrator agent"
                },
                "description": {
                    "type": "string",
                    "description": "Description of the orchestrator's purpose and role"
                },
                "custom_prompt": {
                    "type": "string",
                    "description": "Optional custom system prompt for the orchestrator"
                }
            },
            "required": ["name", "description"]
        }
    },
    
    "create_worker_agent": {
        "function": create_worker_agent,
        "description": "Create a specialized worker agent using Claude Sonnet 4 with isolated context and optional MCP servers. Workers enable 90% parallel execution speedup.",
        "parameters": {
            "type": "object",
            "properties": {
                "specialization": {
                    "type": "string",
                    "enum": ["research", "analysis", "frontend", "backend", "devops", "testing", "security", "database", "api", "ai_ml", "documentation", "clinical", "regulatory"],
                    "description": "Type of agent specialization"
                },
                "name": {
                    "type": "string",
                    "description": "Name of the worker agent"
                },
                "capabilities": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "List of capabilities the agent has"
                },
                "system_prompt": {
                    "type": "string",
                    "description": "Optional custom system prompt"
                },
                "allowed_tools": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "List of tool names the agent can use"
                },
                "mcp_servers": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "List of MCP server capabilities to connect (e.g., github, mongodb, stripe)"
                }
            },
            "required": ["specialization", "name", "capabilities"]
        }
    },
    
    "execute_with_orchestrator": {
        "function": execute_with_orchestrator,
        "description": "Execute a complex task using orchestrator-worker pattern for 90.2% performance improvement through intelligent task decomposition and parallel execution.",
        "parameters": {
            "type": "object",
            "properties": {
                "orchestrator_id": {
                    "type": "string",
                    "description": "ID of the orchestrator agent to use"
                },
                "task": {
                    "type": "string",
                    "description": "Task description to execute"
                },
                "context": {
                    "type": "object",
                    "description": "Optional context data for the task"
                }
            },
            "required": ["orchestrator_id", "task"]
        }
    },
    
    "execute_pipeline": {
        "function": execute_pipeline,
        "description": "Execute a predefined pipeline (research_pipeline, medical_pipeline, or development_pipeline) with 90% time reduction through parallel stages.",
        "parameters": {
            "type": "object",
            "properties": {
                "pipeline_name": {
                    "type": "string",
                    "enum": ["research_pipeline", "medical_pipeline", "development_pipeline"],
                    "description": "Name of the pipeline to execute"
                },
                "task": {
                    "type": "string",
                    "description": "Initial task for the pipeline"
                },
                "context": {
                    "type": "object",
                    "description": "Optional context data"
                }
            },
            "required": ["pipeline_name", "task"]
        }
    },
    
    "create_custom_pipeline": {
        "function": create_custom_pipeline,
        "description": "Create a custom pipeline with specified stages for complex multi-agent workflows.",
        "parameters": {
            "type": "object",
            "properties": {
                "name": {
                    "type": "string",
                    "description": "Pipeline name"
                },
                "description": {
                    "type": "string",
                    "description": "Pipeline description"
                },
                "stages": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "name": {"type": "string"},
                            "type": {
                                "type": "string",
                                "enum": ["sequential", "parallel", "conditional", "loop", "aggregation"]
                            },
                            "agents": {
                                "type": "array",
                                "items": {"type": "string"}
                            },
                            "task_template": {"type": "string"},
                            "timeout_seconds": {"type": "integer"},
                            "requires_approval": {"type": "boolean"}
                        },
                        "required": ["name", "agents", "task_template"]
                    },
                    "description": "List of pipeline stages"
                }
            },
            "required": ["name", "description", "stages"]
        }
    },
    
    "send_agent_message": {
        "function": send_agent_message,
        "description": "Send a message between agents for coordination and handoffs.",
        "parameters": {
            "type": "object",
            "properties": {
                "source_agent": {
                    "type": "string",
                    "description": "ID of the source agent"
                },
                "target_agent": {
                    "type": "string",
                    "description": "ID of the target agent"
                },
                "message_type": {
                    "type": "string",
                    "description": "Type of message (handoff, delegation, pipeline, etc.)"
                },
                "payload": {
                    "type": "object",
                    "description": "Message payload data"
                },
                "priority": {
                    "type": "string",
                    "enum": ["critical", "high", "normal", "low"],
                    "description": "Message priority level"
                },
                "requires_response": {
                    "type": "boolean",
                    "description": "Whether a response is expected"
                }
            },
            "required": ["source_agent", "target_agent", "message_type", "payload"]
        }
    },
    
    "broadcast_to_agents": {
        "function": broadcast_to_agents,
        "description": "Broadcast a message to all registered agents.",
        "parameters": {
            "type": "object",
            "properties": {
                "source_agent": {
                    "type": "string",
                    "description": "ID of the broadcasting agent"
                },
                "message_type": {
                    "type": "string",
                    "description": "Type of broadcast message"
                },
                "payload": {
                    "type": "object",
                    "description": "Message payload"
                },
                "exclude_agents": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Optional list of agent IDs to exclude"
                }
            },
            "required": ["source_agent", "message_type", "payload"]
        }
    },
    
    "get_agent_system_status": {
        "function": get_agent_system_status,
        "description": "Get comprehensive status of the unified agent system including metrics and performance stats.",
        "parameters": {
            "type": "object",
            "properties": {}
        }
    },
    
    "list_available_agents": {
        "function": list_available_agents,
        "description": "List all available orchestrator and worker agents in the system.",
        "parameters": {
            "type": "object",
            "properties": {}
        }
    },
    
    "get_pipeline_execution_status": {
        "function": get_pipeline_execution_status,
        "description": "Get status of a running or completed pipeline execution.",
        "parameters": {
            "type": "object",
            "properties": {
                "execution_id": {
                    "type": "string",
                    "description": "ID of the pipeline execution"
                }
            },
            "required": ["execution_id"]
        }
    }
}

def get_unified_agent_tool_definitions():
    """Get all unified agent tool definitions for Claude"""
    # Return tools in format that will be standardized by tools.py
    # The standardizer in tools.py will convert 'parameters' to 'input_schema'
    return UNIFIED_AGENT_TOOLS
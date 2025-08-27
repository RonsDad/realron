"""
Enhanced Unified Agent System with SSE Event Streaming
This module extends the unified_agent_system to properly stream events to frontend
"""

from typing import AsyncGenerator, Dict, Any, Optional
import json
import asyncio
from datetime import datetime
from .unified_agent_system import UnifiedAgentConfig, AgentTask

class StreamingUnifiedAgentSystem:
    """
    Wrapper for UnifiedAgentSystem that yields SSE events for frontend visibility
    """
    
    def __init__(self, base_system):
        self.system = base_system
        self.active_agents = {}
    
    async def execute_task_with_orchestrator_streaming(
        self,
        orchestrator_id: str,
        task: str,
        context: Optional[Dict[str, Any]] = None
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Execute orchestrator task with full SSE streaming
        """
        # Validate orchestrator exists
        if orchestrator_id not in self.system.orchestrators:
            yield {
                "type": "error",
                "message": f"Orchestrator {orchestrator_id} not found"
            }
            return
        
        orchestrator = self.system.orchestrators[orchestrator_id]
        
        # Announce orchestrator spawn
        yield {
            "type": "agent_spawned",
            "agent_id": orchestrator_id,
            "agent_type": "orchestrator",
            "model": orchestrator.model,
            "name": orchestrator.name,
            "specialization": orchestrator.specialization.value,
            "task": task,
            "timestamp": datetime.now().isoformat()
        }
        
        # Create task object
        task_obj = AgentTask(
            agent_id=orchestrator_id,
            description=task,
            context=context or {}
        )
        
        # Stream orchestrator planning
        yield {
            "type": "agent_status",
            "agent_id": orchestrator_id,
            "status": "planning",
            "message": "Analyzing task and planning approach..."
        }
        
        # Execute orchestrator with streaming
        async for event in self._stream_orchestrator_execution(orchestrator, task_obj):
            yield event
        
        # Get plan from orchestrator
        plan = task_obj.result
        
        if plan and plan.get("subtasks"):
            # Announce worker spawning
            for subtask in plan["subtasks"]:
                worker_id = subtask.get("worker_id")
                if worker_id:
                    worker = self.system.workers.get(worker_id)
                    if worker:
                        yield {
                            "type": "agent_spawned",
                            "agent_id": worker_id,
                            "agent_type": "worker",
                            "parent_id": orchestrator_id,
                            "model": worker.model,
                            "name": worker.name,
                            "specialization": worker.specialization.value,
                            "task": subtask.get("description"),
                            "timestamp": datetime.now().isoformat()
                        }
            
            # Execute workers with streaming
            if plan.get("execution_mode") == "parallel":
                async for event in self._stream_parallel_workers(plan["subtasks"]):
                    yield event
            else:
                async for event in self._stream_sequential_workers(plan["subtasks"]):
                    yield event
        
        # Synthesis phase
        yield {
            "type": "agent_status",
            "agent_id": orchestrator_id,
            "status": "synthesizing",
            "message": "Synthesizing results from worker agents..."
        }
        
        # Final result
        yield {
            "type": "agent_completed",
            "agent_id": orchestrator_id,
            "success": True,
            "result": {
                "plan": plan,
                "worker_count": len(plan.get("subtasks", [])),
                "execution_mode": plan.get("execution_mode", "unknown")
            },
            "timestamp": datetime.now().isoformat()
        }
    
    async def _stream_orchestrator_execution(
        self,
        orchestrator: UnifiedAgentConfig,
        task: AgentTask
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """Stream events from orchestrator execution"""
        
        # Import here to avoid circular dependency
        from backend.agents.claudeAgent.claude_completions import ClaudeCompletions
        claude = ClaudeCompletions()
        
        # Build request
        request = self.system.build_cached_request(orchestrator, task)
        
        # Stream execution
        thinking_content = ""
        result_text = ""
        
        async for event in claude.stream_complete(**request):
            event_type = event.get("type")
            
            # Forward thinking events
            if event_type == "content_block_start" and event.get("content_block", {}).get("type") == "thinking":
                yield {
                    "type": "agent_thinking_start",
                    "agent_id": orchestrator.agent_id,
                    "agent_name": orchestrator.name
                }
            
            elif event_type == "content_block_delta":
                delta = event.get("delta", {})
                if delta.get("type") == "thinking_delta":
                    thinking_content += delta.get("thinking", "")
                    yield {
                        "type": "agent_thinking",
                        "agent_id": orchestrator.agent_id,
                        "content": delta.get("thinking", ""),
                        "cumulative": thinking_content
                    }
                elif delta.get("type") == "text_delta":
                    result_text += delta.get("text", "")
            
            # Forward tool use
            elif event_type == "content_block_start" and event.get("content_block", {}).get("type") == "tool_use":
                tool_name = event.get("content_block", {}).get("name")
                yield {
                    "type": "agent_tool_use",
                    "agent_id": orchestrator.agent_id,
                    "tool_name": tool_name,
                    "status": "started"
                }
            
            elif event_type == "tool_result":
                yield {
                    "type": "agent_tool_result",
                    "agent_id": orchestrator.agent_id,
                    "tool_name": event.get("tool_name"),
                    "result": event.get("result"),
                    "status": "completed"
                }
        
        # Store result in task
        task.result = {
            "text": result_text,
            "thinking": thinking_content,
            "subtasks": self._parse_subtasks_from_result(result_text)
        }
    
    async def _stream_parallel_workers(
        self,
        subtasks: list
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """Stream events from parallel worker execution"""
        
        # Create tasks for all workers
        worker_tasks = []
        for subtask in subtasks:
            worker_id = subtask.get("worker_id")
            if worker_id and worker_id in self.system.workers:
                worker = self.system.workers[worker_id]
                task = self._create_worker_task(worker, subtask)
                worker_tasks.append((worker, task))
        
        # Execute all workers in parallel and stream their events
        yield {
            "type": "parallel_execution_start",
            "worker_count": len(worker_tasks)
        }
        
        # Use asyncio.gather to run workers in parallel
        async def worker_generator(worker, task):
            async for event in self._stream_worker_execution(worker, task):
                yield event
        
        # Stream from all workers concurrently
        generators = [worker_generator(w, t) for w, t in worker_tasks]
        
        # Merge streams from all workers
        async for event in self._merge_async_generators(generators):
            yield event
        
        yield {
            "type": "parallel_execution_complete",
            "worker_count": len(worker_tasks)
        }
    
    async def _stream_sequential_workers(
        self,
        subtasks: list
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """Stream events from sequential worker execution"""
        
        for i, subtask in enumerate(subtasks):
            worker_id = subtask.get("worker_id")
            if worker_id and worker_id in self.system.workers:
                worker = self.system.workers[worker_id]
                
                yield {
                    "type": "sequential_stage",
                    "stage": i + 1,
                    "total_stages": len(subtasks),
                    "worker_id": worker_id,
                    "worker_name": worker.name
                }
                
                task = self._create_worker_task(worker, subtask)
                async for event in self._stream_worker_execution(worker, task):
                    yield event
    
    async def _stream_worker_execution(
        self,
        worker: UnifiedAgentConfig,
        task: AgentTask
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """Stream events from worker execution"""
        
        # Similar to orchestrator but for workers
        from backend.agents.claudeAgent.claude_completions import ClaudeCompletions
        claude = ClaudeCompletions()
        
        request = self.system.build_cached_request(worker, task)
        
        result_text = ""
        thinking_content = ""
        
        async for event in claude.stream_complete(**request):
            event_type = event.get("type")
            
            if event_type == "content_block_delta":
                delta = event.get("delta", {})
                if delta.get("type") == "thinking_delta":
                    thinking_content += delta.get("thinking", "")
                    yield {
                        "type": "agent_thinking",
                        "agent_id": worker.agent_id,
                        "agent_name": worker.name,
                        "content": delta.get("thinking", ""),
                        "specialization": worker.specialization.value
                    }
                elif delta.get("type") == "text_delta":
                    result_text += delta.get("text", "")
            
            elif event_type == "content_block_start" and event.get("content_block", {}).get("type") == "tool_use":
                tool_name = event.get("content_block", {}).get("name")
                yield {
                    "type": "agent_tool_use",
                    "agent_id": worker.agent_id,
                    "agent_name": worker.name,
                    "tool_name": tool_name,
                    "specialization": worker.specialization.value
                }
        
        yield {
            "type": "agent_completed",
            "agent_id": worker.agent_id,
            "agent_name": worker.name,
            "result": result_text,
            "thinking_summary": thinking_content[:500] if thinking_content else None
        }
    
    def _create_worker_task(self, worker: UnifiedAgentConfig, subtask: dict) -> AgentTask:
        """Create task object for worker"""
        return AgentTask(
            agent_id=worker.agent_id,
            description=subtask.get("description", ""),
            context=subtask.get("context", {})
        )
    
    def _parse_subtasks_from_result(self, result_text: str) -> list:
        """Parse subtasks from orchestrator's planning result"""
        # This would parse the orchestrator's output to identify subtasks
        # For now, return empty list
        return []
    
    async def _merge_async_generators(self, generators):
        """Merge multiple async generators into a single stream"""
        queue = asyncio.Queue()
        
        async def consume(gen):
            try:
                async for item in gen:
                    await queue.put(item)
            finally:
                await queue.put(None)  # Sentinel
        
        # Start all consumers
        tasks = [asyncio.create_task(consume(gen)) for gen in generators]
        
        # Yield items as they come
        finished_count = 0
        while finished_count < len(generators):
            item = await queue.get()
            if item is None:
                finished_count += 1
            else:
                yield item
        
        # Wait for all tasks to complete
        await asyncio.gather(*tasks)

# Helper function to integrate with existing tool system
async def execute_orchestrator_with_streaming(
    orchestrator_id: str,
    task: str,
    context: Optional[Dict[str, Any]] = None
) -> AsyncGenerator[Dict[str, Any], None]:
    """
    Execute orchestrator task with SSE streaming
    This function should be called from the tool execution layer
    """
    from .unified_agent_system import get_unified_system
    
    base_system = get_unified_system()
    streaming_system = StreamingUnifiedAgentSystem(base_system)
    
    async for event in streaming_system.execute_task_with_orchestrator_streaming(
        orchestrator_id, task, context
    ):
        # Format as SSE event
        yield f"data: {json.dumps(event)}\n\n"
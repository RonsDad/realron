"""
Subagent Factory System
Creates and manages specialized Claude Code subagents for different tasks
"""

import asyncio
import json
import uuid
from typing import Dict, List, Any, Optional, Callable
from datetime import datetime
from enum import Enum
import logging
from dataclasses import dataclass, field

from .claude_code_tool_handler import ClaudeCodeToolHandler, ClaudeCodeMode

logger = logging.getLogger(__name__)

class SubagentSpecialization(Enum):
    """Specialization types for subagents"""
    FRONTEND = "frontend"
    BACKEND = "backend"
    DEVOPS = "devops"
    TESTING = "testing"
    SECURITY = "security"
    DATABASE = "database"
    API = "api"
    MOBILE = "mobile"
    AI_ML = "ai_ml"
    DOCUMENTATION = "documentation"

@dataclass
class SubagentConfig:
    """Configuration for a specialized subagent"""
    subagent_id: str
    specialization: SubagentSpecialization
    name: str
    description: str
    system_prompt: str
    allowed_tools: List[str]
    max_turns: int = 3
    priority: int = 5  # 1-10, higher is more important
    capabilities: List[str] = field(default_factory=list)
    constraints: List[str] = field(default_factory=list)
    mcp_servers: Dict[str, Any] = field(default_factory=dict)
    active: bool = True
    created_at: datetime = field(default_factory=datetime.now)
    last_used: Optional[datetime] = None
    usage_count: int = 0
    total_cost_usd: float = 0.0

@dataclass
class SubagentTask:
    """Represents a task assigned to a subagent"""
    task_id: str
    subagent_id: str
    task_description: str
    context: Dict[str, Any]
    status: str  # pending, running, completed, failed
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    cost_usd: float = 0.0

class SubagentFactory:
    """
    Factory for creating and managing specialized Claude Code subagents
    """
    
    def __init__(self, main_handler: ClaudeCodeToolHandler):
        self.main_handler = main_handler
        self.subagents: Dict[str, SubagentConfig] = {}
        self.tasks: Dict[str, SubagentTask] = {}
        self.task_queue: asyncio.Queue = asyncio.Queue()
        self.max_concurrent_subagents = 5
        
        # Initialize default subagent configurations
        self._initialize_default_subagents()
    
    def _initialize_default_subagents(self):
        """Initialize default specialized subagents"""
        
        default_configs = [
            {
                "specialization": SubagentSpecialization.FRONTEND,
                "name": "Frontend Developer",
                "description": "Specializes in React, TypeScript, and UI/UX implementation",
                "system_prompt": """You are a frontend development specialist using Claude Code SDK.
                Focus on React components, TypeScript, state management, and responsive design.
                Always consider accessibility and performance optimization.""",
                "allowed_tools": ["Read", "Write", "MultiEdit", "Bash", "WebSearch"],
                "capabilities": ["React", "TypeScript", "CSS", "Tailwind", "Next.js", "UI/UX"],
                "constraints": ["No backend modifications", "Follow existing design system"]
            },
            {
                "specialization": SubagentSpecialization.BACKEND,
                "name": "Backend Engineer",
                "description": "Specializes in API development, database design, and server architecture",
                "system_prompt": """You are a backend development specialist using Claude Code SDK.
                Focus on API design, database optimization, security, and scalability.
                Follow RESTful principles and ensure proper error handling.""",
                "allowed_tools": ["Read", "Write", "MultiEdit", "Bash", "Grep"],
                "capabilities": ["Python", "FastAPI", "PostgreSQL", "Redis", "Authentication"],
                "constraints": ["No frontend modifications", "Maintain backward compatibility"]
            },
            {
                "specialization": SubagentSpecialization.DEVOPS,
                "name": "DevOps Engineer",
                "description": "Specializes in deployment, CI/CD, and infrastructure",
                "system_prompt": """You are a DevOps specialist using Claude Code SDK.
                Focus on deployment pipelines, containerization, monitoring, and infrastructure as code.
                Ensure security best practices and cost optimization.""",
                "allowed_tools": ["Read", "Write", "Bash", "mcp__deployment", "mcp__monitoring"],
                "capabilities": ["Docker", "Kubernetes", "GitHub Actions", "AWS", "Terraform"],
                "constraints": ["No application code changes", "Maintain zero-downtime deployments"]
            },
            {
                "specialization": SubagentSpecialization.TESTING,
                "name": "QA Engineer",
                "description": "Specializes in testing, quality assurance, and test automation",
                "system_prompt": """You are a testing specialist using Claude Code SDK.
                Focus on comprehensive test coverage, edge cases, and test automation.
                Write clear test cases and ensure code quality.""",
                "allowed_tools": ["Read", "Write", "Bash", "Grep"],
                "capabilities": ["Unit Testing", "Integration Testing", "E2E Testing", "Jest", "Pytest"],
                "constraints": ["No production code changes", "Maintain test isolation"]
            },
            {
                "specialization": SubagentSpecialization.SECURITY,
                "name": "Security Analyst",
                "description": "Specializes in security auditing and vulnerability assessment",
                "system_prompt": """You are a security specialist using Claude Code SDK.
                Focus on identifying vulnerabilities, security best practices, and compliance.
                Provide actionable security recommendations.""",
                "allowed_tools": ["Read", "Grep", "WebSearch"],
                "capabilities": ["Security Auditing", "OWASP", "Penetration Testing", "Compliance"],
                "constraints": ["Read-only access", "No code modifications"],
                "max_turns": 2
            },
            {
                "specialization": SubagentSpecialization.API,
                "name": "API Architect",
                "description": "Specializes in API design, GraphQL, and microservices",
                "system_prompt": """You are an API architecture specialist using Claude Code SDK.
                Focus on API design patterns, GraphQL schemas, and microservice communication.
                Ensure proper documentation and versioning.""",
                "allowed_tools": ["Read", "Write", "MultiEdit", "WebSearch"],
                "capabilities": ["REST", "GraphQL", "OpenAPI", "Microservices", "gRPC"],
                "constraints": ["Follow API versioning", "Maintain backward compatibility"]
            },
            {
                "specialization": SubagentSpecialization.DATABASE,
                "name": "Database Administrator",
                "description": "Specializes in database design, optimization, and migrations",
                "system_prompt": """You are a database specialist using Claude Code SDK.
                Focus on schema design, query optimization, and data integrity.
                Ensure proper indexing and normalization.""",
                "allowed_tools": ["Read", "Write", "Bash"],
                "capabilities": ["PostgreSQL", "MongoDB", "Redis", "SQL Optimization", "Migrations"],
                "constraints": ["No data loss", "Maintain referential integrity"]
            },
            {
                "specialization": SubagentSpecialization.AI_ML,
                "name": "AI/ML Engineer",
                "description": "Specializes in AI integration, prompts, and machine learning",
                "system_prompt": """You are an AI/ML specialist using Claude Code SDK.
                Focus on AI integration, prompt engineering, and model optimization.
                Ensure ethical AI practices and proper evaluation metrics.""",
                "allowed_tools": ["Read", "Write", "Bash", "WebSearch"],
                "capabilities": ["LLMs", "Prompt Engineering", "Claude API", "OpenAI", "Vector DBs"],
                "constraints": ["Monitor API costs", "Ensure responsible AI use"]
            },
            {
                "specialization": SubagentSpecialization.DOCUMENTATION,
                "name": "Technical Writer",
                "description": "Specializes in documentation, README files, and API docs",
                "system_prompt": """You are a documentation specialist using Claude Code SDK.
                Focus on clear, comprehensive documentation with examples.
                Maintain consistency and follow documentation standards.""",
                "allowed_tools": ["Read", "Write", "MultiEdit"],
                "capabilities": ["Markdown", "API Documentation", "Code Comments", "Tutorials"],
                "constraints": ["No code logic changes", "Maintain documentation standards"]
            }
        ]
        
        for config in default_configs:
            self.register_subagent(**config)
    
    def register_subagent(
        self,
        specialization: SubagentSpecialization,
        name: str,
        description: str,
        system_prompt: str,
        allowed_tools: List[str],
        capabilities: List[str] = None,
        constraints: List[str] = None,
        max_turns: int = 3,
        priority: int = 5,
        mcp_servers: Dict[str, Any] = None
    ) -> str:
        """Register a new specialized subagent"""
        
        subagent_id = f"{specialization.value}_{uuid.uuid4().hex[:8]}"
        
        config = SubagentConfig(
            subagent_id=subagent_id,
            specialization=specialization,
            name=name,
            description=description,
            system_prompt=system_prompt,
            allowed_tools=allowed_tools,
            max_turns=max_turns,
            priority=priority,
            capabilities=capabilities or [],
            constraints=constraints or [],
            mcp_servers=mcp_servers or {}
        )
        
        self.subagents[subagent_id] = config
        logger.info(f"Registered subagent: {name} ({subagent_id})")
        
        return subagent_id
    
    async def create_subagent_team(
        self,
        task: str,
        specializations: Optional[List[SubagentSpecialization]] = None,
        auto_select: bool = True
    ) -> List[str]:
        """
        Create a team of subagents for a complex task
        
        Args:
            task: The task description
            specializations: Specific specializations to include
            auto_select: Automatically select best subagents based on task
            
        Returns:
            List of subagent IDs
        """
        team = []
        
        if auto_select and not specializations:
            # Analyze task to determine needed specializations
            specializations = self._analyze_task_requirements(task)
        
        if specializations:
            for spec in specializations:
                # Find best subagent for each specialization
                candidates = [
                    s for s in self.subagents.values()
                    if s.specialization == spec and s.active
                ]
                
                if candidates:
                    # Sort by priority and usage (prefer less used)
                    best = sorted(
                        candidates,
                        key=lambda x: (x.priority, -x.usage_count),
                        reverse=True
                    )[0]
                    team.append(best.subagent_id)
        
        logger.info(f"Created subagent team of {len(team)} members for task")
        return team
    
    def _analyze_task_requirements(self, task: str) -> List[SubagentSpecialization]:
        """Analyze task to determine required specializations"""
        task_lower = task.lower()
        required_specs = []
        
        # Simple keyword-based analysis (can be enhanced with AI)
        spec_keywords = {
            SubagentSpecialization.FRONTEND: ["react", "ui", "component", "frontend", "css", "typescript"],
            SubagentSpecialization.BACKEND: ["api", "backend", "server", "endpoint", "database"],
            SubagentSpecialization.TESTING: ["test", "testing", "qa", "quality", "coverage"],
            SubagentSpecialization.SECURITY: ["security", "vulnerability", "audit", "compliance"],
            SubagentSpecialization.DEVOPS: ["deploy", "ci/cd", "docker", "kubernetes", "infrastructure"],
            SubagentSpecialization.DATABASE: ["database", "sql", "schema", "migration", "query"],
            SubagentSpecialization.API: ["graphql", "rest", "openapi", "microservice"],
            SubagentSpecialization.AI_ML: ["ai", "ml", "llm", "prompt", "embedding"],
            SubagentSpecialization.DOCUMENTATION: ["document", "readme", "docs", "comment"]
        }
        
        for spec, keywords in spec_keywords.items():
            if any(keyword in task_lower for keyword in keywords):
                required_specs.append(spec)
        
        # Default to backend and frontend if no specific requirements found
        if not required_specs:
            required_specs = [SubagentSpecialization.BACKEND, SubagentSpecialization.FRONTEND]
        
        return required_specs
    
    async def delegate_to_subagent(
        self,
        subagent_id: str,
        task: str,
        context: Optional[Dict[str, Any]] = None,
        mode: str = "create"
    ) -> Dict[str, Any]:
        """
        Delegate a task to a specific subagent
        
        Args:
            subagent_id: ID of the subagent
            task: Task description
            context: Optional context for the task
            mode: Claude Code mode to use
            
        Returns:
            Task execution results
        """
        if subagent_id not in self.subagents:
            return {
                'success': False,
                'error': f"Subagent {subagent_id} not found"
            }
        
        config = self.subagents[subagent_id]
        
        # Create task record
        task_id = str(uuid.uuid4())
        task_record = SubagentTask(
            task_id=task_id,
            subagent_id=subagent_id,
            task_description=task,
            context=context or {},
            status="running",
            created_at=datetime.now(),
            started_at=datetime.now()
        )
        
        self.tasks[task_id] = task_record
        
        try:
            # Update subagent usage
            config.last_used = datetime.now()
            config.usage_count += 1
            
            # Execute task with Claude Code SDK
            result = await self.main_handler.execute_claude_code_task(
                task=f"{config.system_prompt}\n\nTask: {task}",
                mode=mode,
                allowed_tools=config.allowed_tools,
                context=context,
                mcp_config=config.mcp_servers,
                max_turns=config.max_turns
            )
            
            # Update task record
            task_record.completed_at = datetime.now()
            task_record.status = "completed" if result['success'] else "failed"
            task_record.result = result
            task_record.cost_usd = result.get('cost', 0)
            
            # Update subagent cost tracking
            config.total_cost_usd += task_record.cost_usd
            
            return {
                'success': result['success'],
                'task_id': task_id,
                'subagent': {
                    'id': subagent_id,
                    'name': config.name,
                    'specialization': config.specialization.value
                },
                'result': result.get('result', ''),
                'cost': task_record.cost_usd,
                'duration_seconds': (
                    task_record.completed_at - task_record.started_at
                ).total_seconds() if task_record.completed_at else 0
            }
            
        except Exception as e:
            logger.error(f"Error delegating to subagent {subagent_id}: {str(e)}")
            task_record.status = "failed"
            task_record.error = str(e)
            task_record.completed_at = datetime.now()
            
            return {
                'success': False,
                'task_id': task_id,
                'subagent_id': subagent_id,
                'error': str(e)
            }
    
    async def run_parallel_subagents(
        self,
        task: str,
        subagent_ids: List[str],
        context: Optional[Dict[str, Any]] = None,
        aggregation_strategy: str = "consensus"
    ) -> Dict[str, Any]:
        """
        Run multiple subagents in parallel and aggregate results
        
        Args:
            task: Task to execute
            subagent_ids: List of subagent IDs
            context: Shared context
            aggregation_strategy: How to combine results (consensus, best, all)
            
        Returns:
            Aggregated results
        """
        if not subagent_ids:
            return {
                'success': False,
                'error': 'No subagents specified'
            }
        
        # Limit concurrent executions
        if len(subagent_ids) > self.max_concurrent_subagents:
            logger.warning(f"Limiting concurrent subagents to {self.max_concurrent_subagents}")
            subagent_ids = subagent_ids[:self.max_concurrent_subagents]
        
        # Execute tasks in parallel
        tasks = [
            self.delegate_to_subagent(sid, task, context)
            for sid in subagent_ids
        ]
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Process results
        successful_results = []
        failed_results = []
        total_cost = 0.0
        
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                failed_results.append({
                    'subagent_id': subagent_ids[i],
                    'error': str(result)
                })
            elif isinstance(result, dict):
                if result.get('success'):
                    successful_results.append(result)
                    total_cost += result.get('cost', 0)
                else:
                    failed_results.append(result)
        
        # Aggregate based on strategy
        aggregated = await self._aggregate_results(
            successful_results,
            strategy=aggregation_strategy
        )
        
        return {
            'success': len(successful_results) > 0,
            'total_subagents': len(subagent_ids),
            'successful': len(successful_results),
            'failed': len(failed_results),
            'aggregated_result': aggregated,
            'individual_results': successful_results,
            'failures': failed_results,
            'total_cost': total_cost
        }
    
    async def _aggregate_results(
        self,
        results: List[Dict[str, Any]],
        strategy: str = "consensus"
    ) -> str:
        """Aggregate results from multiple subagents"""
        
        if not results:
            return "No results to aggregate"
        
        if strategy == "consensus":
            # Combine all results into a consensus
            combined = "\n\n".join([
                f"**{r['subagent']['name']} ({r['subagent']['specialization']}):**\n{r['result']}"
                for r in results
            ])
            
            # Use Claude to synthesize consensus
            synthesis_prompt = f"""Synthesize these expert opinions into a unified recommendation:
            
{combined}

Provide a clear, actionable consensus that incorporates the best insights from each expert."""
            
            # Execute synthesis (simplified - would use actual Claude API)
            return f"Consensus from {len(results)} experts:\n{combined}"
            
        elif strategy == "best":
            # Return the result with highest confidence/quality
            # For now, return the first successful result
            return results[0]['result'] if results else ""
            
        elif strategy == "all":
            # Return all results formatted
            return "\n\n---\n\n".join([r['result'] for r in results])
        
        else:
            return results[0]['result'] if results else ""
    
    def get_subagent_stats(self, subagent_id: str) -> Dict[str, Any]:
        """Get statistics for a specific subagent"""
        if subagent_id not in self.subagents:
            return {'error': 'Subagent not found'}
        
        config = self.subagents[subagent_id]
        
        # Count tasks
        tasks = [t for t in self.tasks.values() if t.subagent_id == subagent_id]
        completed_tasks = [t for t in tasks if t.status == "completed"]
        failed_tasks = [t for t in tasks if t.status == "failed"]
        
        return {
            'subagent_id': subagent_id,
            'name': config.name,
            'specialization': config.specialization.value,
            'usage_count': config.usage_count,
            'total_cost_usd': config.total_cost_usd,
            'total_tasks': len(tasks),
            'completed_tasks': len(completed_tasks),
            'failed_tasks': len(failed_tasks),
            'success_rate': len(completed_tasks) / len(tasks) if tasks else 0,
            'last_used': config.last_used.isoformat() if config.last_used else None,
            'active': config.active
        }
    
    def list_available_subagents(
        self,
        specialization: Optional[SubagentSpecialization] = None,
        active_only: bool = True
    ) -> List[Dict[str, Any]]:
        """List available subagents with optional filtering"""
        
        subagents = []
        for config in self.subagents.values():
            if active_only and not config.active:
                continue
            
            if specialization and config.specialization != specialization:
                continue
            
            subagents.append({
                'subagent_id': config.subagent_id,
                'name': config.name,
                'specialization': config.specialization.value,
                'description': config.description,
                'capabilities': config.capabilities,
                'priority': config.priority,
                'usage_count': config.usage_count,
                'active': config.active
            })
        
        # Sort by priority and usage
        subagents.sort(key=lambda x: (x['priority'], -x['usage_count']), reverse=True)
        
        return subagents
    
    def deactivate_subagent(self, subagent_id: str) -> bool:
        """Deactivate a subagent"""
        if subagent_id in self.subagents:
            self.subagents[subagent_id].active = False
            logger.info(f"Deactivated subagent {subagent_id}")
            return True
        return False
    
    def activate_subagent(self, subagent_id: str) -> bool:
        """Activate a subagent"""
        if subagent_id in self.subagents:
            self.subagents[subagent_id].active = True
            logger.info(f"Activated subagent {subagent_id}")
            return True
        return False
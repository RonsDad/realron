# Unified Multi-Agent System Documentation

## Overview

The Unified Multi-Agent System implements Anthropic's documented orchestrator-worker pattern with proven performance improvements:
- **90.2% performance improvement** through multi-agent coordination
- **90% time reduction** via parallel execution
- **90% cost reduction** using prompt caching

## Architecture

### Core Components

1. **Orchestrator Agents (Claude Opus 4)**
   - Lead coordination and task decomposition
   - Delegate work to specialized workers
   - Synthesize results from multiple agents
   - Optimize for parallel execution

2. **Worker Agents (Claude Sonnet 4)**
   - Specialized task execution
   - Isolated context windows
   - Domain-specific expertise
   - MCP server integration

3. **Message Bus**
   - Event-driven agent communication
   - Priority-based message routing
   - Request-response patterns
   - Broadcast capabilities

4. **Pipeline Orchestrator**
   - Pre-defined workflow templates
   - Parallel stage execution
   - Checkpoint and recovery
   - Approval workflows

## Key Features

### Dynamic Agent Spawning
- Create orchestrators and workers on-demand
- Automatic MCP server assignment
- Isolated tool configurations
- Resource pooling and reuse

### Prompt Caching
- Cache hierarchy: tools → system → messages
- 90% cost reduction for cached prompts
- 5-minute default cache lifetime
- Automatic cache invalidation

### Parallel Execution
- Concurrent agent execution
- Parallel tool calling
- Time reduction up to 90%
- Automatic result aggregation

### Inter-Agent Communication Patterns

1. **Handoff Pattern**: Complete context transfer between agents
2. **Delegation Pattern**: Task-specific delegation with return
3. **Pipeline Pattern**: Sequential processing with transformations
4. **Parallel Pattern**: Concurrent execution of independent tasks
5. **Broadcast Pattern**: One-to-many notifications

## API Endpoints

### Agent Management

#### Create Orchestrator
```http
POST /agents/orchestrator
{
  "name": "Lead Orchestrator",
  "description": "Main task coordinator",
  "custom_prompt": "Optional custom system prompt"
}
```

#### Create Worker
```http
POST /agents/worker
{
  "specialization": "research",
  "name": "Research Specialist",
  "capabilities": ["web_search", "document_analysis"],
  "allowed_tools": ["search", "read"],
  "mcp_servers": ["github", "mongodb"]
}
```

#### List Agents
```http
GET /agents/list
```

#### System Status
```http
GET /agents/status
```

### Task Execution

#### Execute with Orchestrator
```http
POST /agents/execute
{
  "orchestrator_id": "orchestrator_abc123",
  "task": "Research and analyze market trends",
  "context": {
    "industry": "healthcare",
    "timeframe": "2024"
  }
}
```

### Pipeline Execution

#### Execute Pipeline
```http
POST /pipelines/execute
{
  "pipeline_name": "research_pipeline",
  "task": "Analyze competitor landscape",
  "context": {}
}
```

#### Create Custom Pipeline
```http
POST /pipelines/create
{
  "name": "custom_analysis",
  "description": "Custom analysis pipeline",
  "stages": [
    {
      "name": "data_collection",
      "type": "parallel",
      "agents": ["agent1", "agent2"],
      "task_template": "Collect data on {topic}",
      "timeout_seconds": 300
    },
    {
      "name": "analysis",
      "type": "sequential",
      "agents": ["analyst_agent"],
      "task_template": "Analyze collected data",
      "requires_approval": true
    }
  ]
}
```

#### Pipeline Status
```http
GET /pipelines/status/{execution_id}
```

## Tool Integration

### Available Tools

The system provides the following Claude-compatible tools:

- `create_orchestrator_agent`: Create lead orchestrator with Opus 4
- `create_worker_agent`: Create specialized worker with Sonnet 4
- `execute_with_orchestrator`: Execute complex task with orchestration
- `execute_pipeline`: Run predefined pipeline
- `create_custom_pipeline`: Define custom workflow
- `send_agent_message`: Inter-agent communication
- `broadcast_to_agents`: Broadcast to all agents
- `get_agent_system_status`: System metrics
- `list_available_agents`: List all agents
- `get_pipeline_execution_status`: Pipeline execution status

### Tool Usage Example

```python
# Create an orchestrator
orchestrator = await create_orchestrator_agent(
    name="Research Lead",
    description="Coordinates research tasks"
)

# Create specialized workers
researcher = await create_worker_agent(
    specialization="research",
    name="Web Researcher",
    capabilities=["web_search", "content_analysis"],
    mcp_servers=["github", "huggingface"]
)

analyst = await create_worker_agent(
    specialization="analysis",
    name="Data Analyst",
    capabilities=["data_processing", "statistics"]
)

# Execute complex task
result = await execute_with_orchestrator(
    orchestrator_id=orchestrator["agent_id"],
    task="Research AI trends and analyze market impact",
    context={"year": 2024}
)
```

## Predefined Pipelines

### Research Pipeline
**Stages**: Research → Analysis → Synthesis → QA
- Parallel research with multiple agents
- Sequential analysis and synthesis
- Quality assurance with approval

### Medical Pipeline
**Stages**: Clinical → FDA → Insurance → Recommendations
- Clinical assessment
- Parallel regulatory checks
- Insurance verification
- Aggregated recommendations

### Development Pipeline
**Stages**: Architecture → Implementation → Testing → Deployment
- Architecture design
- Parallel frontend/backend implementation
- Parallel unit/integration testing
- Conditional deployment

## Performance Metrics

### Expected Improvements
- **Task Completion**: 90.2% faster than single-agent
- **Parallel Execution**: 90% time reduction
- **Cost Efficiency**: 90% reduction via caching
- **Token Usage**: 15× more than single chat (managed via limits)

### Monitoring
- Real-time token usage tracking
- Cost monitoring per agent/pipeline
- Execution time metrics
- Cache hit rates
- Success/failure rates

## MCP Server Integration

### Available MCP Servers
- **Development**: GitHub, GitLab, Hugging Face
- **Project Management**: Asana, Jira, Confluence
- **Databases**: MongoDB, PostgreSQL, DynamoDB
- **Commerce**: Stripe, PayPal, Shopify
- **Infrastructure**: Vercel, AWS, Google Cloud

### Agent-Scoped Configuration
Each agent can have isolated MCP servers:
- Invisible to main thread
- Scoped authentication tokens
- Tool restrictions per server
- Dynamic capability assignment

## Best Practices

### Agent Design
1. Use Opus 4 for orchestrators (superior coordination)
2. Use Sonnet 4 for workers (cost-effective execution)
3. Design agents with single responsibilities
4. Leverage specialization for expertise

### Pipeline Design
1. Identify parallelizable stages
2. Minimize sequential dependencies
3. Add checkpoints for long pipelines
4. Include approval stages for critical decisions

### Cost Optimization
1. Enable prompt caching for all agents
2. Reuse agent instances when possible
3. Monitor token usage limits
4. Use parallel execution to reduce total tokens

### Error Handling
1. Implement retry policies for stages
2. Use checkpoint recovery for failures
3. Set appropriate timeouts
4. Handle partial success scenarios

## Migration from Legacy Systems

### From `sub_agents.py`
- Dynamic registry preserved
- Custom agents supported
- Tool restrictions maintained

### From `subagent_factory.py`
- Preconfigured specializations included
- MCP integration enhanced
- Parallel execution improved

## Security Considerations

1. **Agent Isolation**: Each agent has isolated context
2. **MCP Scoping**: Servers visible only to assigned agents
3. **Token Management**: Secure credential storage
4. **Tool Restrictions**: Granular tool access control
5. **Audit Logging**: Complete message history

## Troubleshooting

### Common Issues

1. **Agent Creation Fails**
   - Check specialization is valid
   - Verify MCP server credentials
   - Ensure unique agent names

2. **Pipeline Execution Timeout**
   - Increase stage timeouts
   - Check agent availability
   - Review task complexity

3. **High Token Usage**
   - Enable prompt caching
   - Reduce context size
   - Use more targeted prompts

4. **MCP Connection Issues**
   - Verify server URLs
   - Check authentication tokens
   - Review network connectivity

## Future Enhancements

- **Agent Learning**: Persistent agent memory
- **Dynamic Optimization**: Auto-tune parallel execution
- **Advanced Routing**: ML-based message routing
- **Global State**: Shared knowledge base
- **Visual Pipeline Builder**: UI for pipeline creation

## References

- [Anthropic's Multi-Agent Research System](https://www.anthropic.com/research/multi-agent-systems)
- [Prompt Caching Documentation](https://docs.anthropic.com/claude/docs/prompt-caching)
- [MCP Integration Guide](https://docs.anthropic.com/claude/docs/mcp-integration)
- [Claude API Documentation](https://docs.anthropic.com/claude/reference)
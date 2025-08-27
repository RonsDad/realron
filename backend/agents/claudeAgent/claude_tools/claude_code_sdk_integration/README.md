# Claude Code SDK Integration System

A comprehensive integration system that enables the Claude Code SDK to function as a powerful tool for your main Claude Agent and its subagents. This system provides production-ready tool creation, testing, deployment, and monitoring capabilities.

## 🚀 Features

### Core Capabilities
- **Multi-Mode Execution**: Support for create, test, deploy, debug, review, and optimize modes
- **Session Management**: Persistent multi-turn conversations with session continuity
- **Subagent Factory**: Specialized subagents for different development tasks
- **MCP Integration**: Custom tools for deployment, testing, and monitoring
- **Parallel Execution**: Run multiple subagents concurrently for complex tasks
- **Cost Tracking**: Monitor and report usage costs across all operations

### Specialized Subagents
- **Frontend Developer**: React, TypeScript, UI/UX implementation
- **Backend Engineer**: API development, database design, server architecture
- **DevOps Engineer**: Deployment, CI/CD, infrastructure management
- **QA Engineer**: Testing, quality assurance, test automation
- **Security Analyst**: Security auditing, vulnerability assessment
- **Database Administrator**: Schema design, query optimization
- **API Architect**: REST/GraphQL design, microservices
- **AI/ML Engineer**: LLM integration, prompt engineering
- **Technical Writer**: Documentation, API docs, tutorials

## 📦 Installation

### Prerequisites
```bash
# Install Claude Code SDK
pip install claude-code-sdk
npm install -g @anthropic-ai/claude-code

# Set API key
export ANTHROPIC_API_KEY="your-api-key"
```

### Integration Setup
```python
# In your main tools.py file, add:
from .claude_code_sdk_integration import (
    get_claude_code_tool_definitions,
    execute_claude_code_tool
)

# Register tools
claude_code_tools = get_claude_code_tool_definitions()
for tool_name, config in claude_code_tools.items():
    TOOLS[tool_name] = {
        "function": lambda **kwargs: execute_claude_code_tool(tool_name, kwargs),
        "description": config["description"],
        "parameters": config["parameters"]
    }
```

## 🛠️ Usage Examples

### Basic Tool Creation
```python
# Create a new tool
result = await execute_claude_code_tool(
    "claude_code_agent",
    {
        "task": "Create a Python function to validate email addresses with comprehensive error handling",
        "mode": "create",
        "allowed_tools": ["Write", "Read", "Test"]
    }
)
```

### Multi-Turn Session
```python
# Start a session
result1 = await execute_claude_code_tool(
    "claude_code_agent",
    {
        "task": "Create a web scraper for news articles",
        "mode": "create"
    }
)
session_id = result1["session_id"]

# Continue in same session
result2 = await execute_claude_code_tool(
    "claude_code_continue_session",
    {
        "session_id": session_id,
        "task": "Add rate limiting and error recovery"
    }
)

# Test the implementation
result3 = await execute_claude_code_tool(
    "claude_code_continue_session",
    {
        "session_id": session_id,
        "task": "Write and run comprehensive tests"
    }
)
```

### Subagent Delegation
```python
# Delegate to specialized frontend subagent
result = await execute_claude_code_tool(
    "claude_code_subagent",
    {
        "task": "Create a responsive React dashboard with real-time data updates",
        "specialization": "frontend",
        "mode": "create"
    }
)

# Run a team of subagents
team_result = await execute_claude_code_tool(
    "claude_code_subagent_team",
    {
        "task": "Build a complete e-commerce platform",
        "specializations": ["frontend", "backend", "database", "testing"],
        "aggregation_strategy": "consensus"
    }
)
```

### Deployment Pipeline
```python
# Run tests first
test_result = await execute_claude_code_tool(
    "claude_code_test",
    {
        "project_path": "/path/to/project",
        "test_types": ["unit", "integration", "performance"],
        "coverage": True
    }
)

# Deploy to staging
if test_result["success"]:
    deploy_result = await execute_claude_code_tool(
        "claude_code_deploy",
        {
            "project_path": "/path/to/project",
            "environment": "staging",
            "version": "main",
            "run_tests": True
        }
    )

# Set up monitoring
monitor_result = await execute_claude_code_tool(
    "claude_code_monitor",
    {
        "service": "my-app",
        "metrics": ["cpu", "memory", "error_rate"],
        "alert_conditions": [
            {"metric": "cpu", "condition": ">", "threshold": 80},
            {"metric": "error_rate", "condition": ">", "threshold": 0.05}
        ]
    }
)
```

## 🏗️ Architecture

### Component Structure
```
claude_code_sdk_integration/
├── __init__.py                 # Package initialization
├── claude_code_tool_handler.py # Core SDK handler
├── subagent_factory.py         # Subagent management
├── mcp_integration.py          # MCP server integration
├── tool_definitions.py         # Tool definitions for main agent
├── test_integration.py         # Comprehensive test suite
├── integration_update.py       # Integration helper script
└── README.md                   # This file
```

### Key Classes

#### ClaudeCodeToolHandler
- Manages Claude Code SDK sessions
- Handles task execution with different modes
- Tracks costs and session state
- Supports session persistence and continuation

#### SubagentFactory
- Creates and manages specialized subagents
- Supports parallel execution of multiple subagents
- Implements aggregation strategies for team results
- Tracks subagent performance and usage statistics

#### MCPIntegrationManager
- Provides deployment, testing, and monitoring tools
- Integrates with CI/CD pipelines
- Supports blue-green deployments
- Enables comprehensive monitoring and alerting

## 🔧 Configuration

### Environment Variables
```bash
# Required
export ANTHROPIC_API_KEY="your-api-key"

# Optional
export CLAUDE_CODE_MAX_TURNS=10
export CLAUDE_CODE_SESSION_TIMEOUT=15  # minutes
export CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS=5
```

### Mode Configurations
Each mode has specific configurations:

- **Create Mode**: Build new tools with comprehensive error handling
- **Test Mode**: Run tests with coverage reporting
- **Deploy Mode**: Deploy with rollback capabilities
- **Debug Mode**: Systematic issue identification and fixing
- **Review Mode**: Security and performance analysis (read-only)
- **Optimize Mode**: Performance optimization with metrics

### MCP Server Configuration
```json
{
  "mcpServers": {
    "deployment": {
      "command": "python",
      "args": ["-m", "mcp_server_deployment"],
      "env": {"DEPLOY_TOKEN": "your-token"}
    },
    "testing": {
      "command": "python",
      "args": ["-m", "mcp_server_testing"],
      "env": {"TEST_ENV": "staging"}
    },
    "monitoring": {
      "command": "python",
      "args": ["-m", "mcp_server_monitoring"],
      "env": {"MONITOR_KEY": "your-key"}
    }
  }
}
```

## 🧪 Testing

### Run Tests
```bash
# Run all tests
pytest backend/agents/claudeAgent/claude_tools/claude_code_sdk_integration/test_integration.py -v

# Run specific test categories
pytest -k "TestClaudeCodeToolHandler" -v
pytest -k "TestSubagentFactory" -v
pytest -k "TestMCPIntegration" -v

# Run with coverage
pytest --cov=claude_code_sdk_integration --cov-report=html
```

### Test Coverage
- Unit tests for all core components
- Integration tests for end-to-end workflows
- Performance tests for concurrent operations
- Mock SDK responses for testing without API calls

## 📊 Performance Considerations

### Optimization Strategies
1. **Parallel Execution**: Subagents run concurrently when possible
2. **Session Reuse**: Maintain context across multiple interactions
3. **Smart Tool Selection**: Mode-specific tool configurations
4. **Cost Optimization**: Track and optimize API usage
5. **Caching**: Session and result caching where appropriate

### Scalability
- Supports up to 100 concurrent sessions
- Handles 5 parallel subagents by default (configurable)
- Automatic session cleanup after timeout
- Efficient memory management for long-running sessions

## 🔒 Security

### Best Practices
- Never hardcode API keys
- Use environment variables for sensitive data
- Implement proper error handling
- Validate all inputs before execution
- Use read-only mode for review operations
- Monitor and log all tool executions

### Permission Modes
- **default**: Standard permissions with user prompts
- **acceptEdits**: Auto-accept file edits
- **plan**: Read-only planning mode
- **bypassPermissions**: Full access (use with caution)

## 📝 API Reference

### Main Tools

#### claude_code_agent
Execute coding tasks with Claude Code SDK
- **Parameters**: task, mode, allowed_tools, system_prompt, session_id, context, permission_mode
- **Returns**: success, session_id, result, cost, metadata

#### claude_code_subagent
Delegate to specialized subagent
- **Parameters**: task, specialization, context, mode
- **Returns**: success, subagent info, result, cost

#### claude_code_deploy
Deploy with MCP integration
- **Parameters**: project_path, environment, version, rollback_enabled, run_tests
- **Returns**: success, deployment_id, url, health_check

#### claude_code_test
Run comprehensive tests
- **Parameters**: project_path, test_types, coverage, environment
- **Returns**: success, test_results, report

#### claude_code_monitor
Set up monitoring
- **Parameters**: service, metrics, alert_conditions
- **Returns**: success, current_metrics, alerts_configured

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Write tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## 📄 License

This integration system is part of the Ron AI Healthcare Copilot project.

## 🆘 Support

For issues or questions:
- Check the test suite for usage examples
- Review the architecture documentation
- Contact the development team

## 🚦 Status

✅ **Production Ready**
- All core features implemented
- Comprehensive test coverage
- Performance optimized
- Security best practices followed

## 🔄 Version History

### v1.0.0 (Current)
- Initial release with full feature set
- 9 specialized subagents
- 3 MCP servers (deployment, testing, monitoring)
- Complete session management
- Parallel execution support
- Cost tracking and reporting
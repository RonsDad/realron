import asyncio
import sys
import time
sys.path.append('/Users/timhunter/ron-ai')

from backend.agents.claudeAgent.claude_tools.claude_code_sdk_integration import (
    ClaudeCodeToolHandler,
    SubagentFactory,
    SubagentSpecialization,
    execute_claude_code_tool,
    mcp_manager
)

async def test_advanced_features():
    print('=== Testing Advanced Features ===\n')
    
    handler = ClaudeCodeToolHandler()
    factory = SubagentFactory(handler)
    
    # Test 1: Subagent team creation
    print('1. Testing subagent team creation:')
    team_ids = await factory.create_subagent_team(
        task='Build a complete web application with authentication',
        auto_select=True
    )
    print(f'   Team created with {len(team_ids)} members')
    for i, sid in enumerate(team_ids[:3]):
        agent = factory.subagents[sid]
        print(f'     {i+1}. {agent.name} ({agent.specialization.value})')
    
    # Test 2: Parallel execution simulation
    print('\n2. Testing parallel subagent execution:')
    start_time = time.time()
    parallel_result = await factory.run_parallel_subagents(
        task='Implement user authentication system',
        subagent_ids=team_ids[:3],  # Use first 3 agents
        aggregation_strategy='consensus'
    )
    elapsed = time.time() - start_time
    print(f'   Execution completed in {elapsed:.2f} seconds')
    print(f'   Successful subagents: {parallel_result["successful"]}')
    print(f'   Failed subagents: {parallel_result["failed"]}')
    print(f'   Total cost: ${parallel_result["total_cost"]:.4f}')
    
    # Test 3: Task requirement analysis
    print('\n3. Testing automatic task requirement analysis:')
    test_tasks = [
        'Create a React component with TypeScript',
        'Build a REST API with database integration',
        'Deploy to Kubernetes with CI/CD',
        'Write comprehensive unit tests'
    ]
    for task in test_tasks:
        specs = factory._analyze_task_requirements(task)
        spec_names = [s.value for s in specs]
        print(f'   "{task[:40]}..."')
        print(f'     → {spec_names}')
    
    # Test 4: MCP testing server
    print('\n4. Testing MCP testing server:')
    test_result = await mcp_manager.execute_mcp_tool(
        'testing',
        'run_unit_tests',
        {
            'project_path': '/test/project',
            'coverage': True
        }
    )
    print(f'   Tests executed: {test_result["total_tests"]}')
    print(f'   Passed: {test_result["passed"]}')
    print(f'   Failed: {test_result["failed"]}')
    print(f'   Coverage: {test_result["coverage_percent"]}%')
    
    # Test 5: MCP monitoring server
    print('\n5. Testing MCP monitoring server:')
    metrics = await mcp_manager.execute_mcp_tool(
        'monitoring',
        'get_metrics',
        {
            'service': 'test-service',
            'time_range': '1h'
        }
    )
    print(f'   Metrics retrieved: {metrics["success"]}')
    if metrics.get('metrics'):
        print(f'   CPU Usage: {metrics["metrics"]["cpu_usage_percent"]}%')
        print(f'   Memory Usage: {metrics["metrics"]["memory_usage_percent"]}%')
    
    # Test 6: Deployment pipeline simulation
    print('\n6. Testing deployment pipeline:')
    deploy_result = await mcp_manager.execute_mcp_tool(
        'deployment',
        'deploy_to_staging',
        {
            'project_path': '/test/project',
            'branch': 'feature-test'
        }
    )
    print(f'   Deployment success: {deploy_result["success"]}')
    print(f'   Deployment ID: {deploy_result.get("deployment_id", "N/A")}')
    print(f'   URL: {deploy_result.get("url", "N/A")}')
    
    # Test 7: Session limits
    print('\n7. Testing session management at scale:')
    sessions = []
    for i in range(5):
        result = await handler.execute_claude_code_task(
            task=f'Task {i}',
            mode='create'
        )
        sessions.append(result['session_id'])
    
    print(f'   Created {len(sessions)} sessions')
    print(f'   Active sessions: {len(handler.active_sessions)}')
    
    # Clean up
    for sid in sessions:
        await handler.close_session(sid)
    print(f'   After cleanup: {len(handler.active_sessions)} active sessions')
    
    return True

# Run tests
if __name__ == "__main__":
    try:
        result = asyncio.run(test_advanced_features())
        print('\n' + '='*50)
        print('✅ ALL ADVANCED FEATURE TESTS PASSED')
    except Exception as e:
        print(f'\n❌ TEST FAILED: {e}')
        import traceback
        traceback.print_exc()
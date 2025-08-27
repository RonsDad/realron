"""
Comprehensive Test Suite for Claude Code SDK Integration
Tests all components of the integration system
"""

import asyncio
import pytest
import json
from datetime import datetime
from unittest.mock import Mock, AsyncMock, patch, MagicMock
from typing import Dict, Any

# Import components to test
from .claude_code_tool_handler import (
    ClaudeCodeToolHandler,
    ClaudeCodeMode,
    PermissionMode,
    ClaudeCodeSession
)
from .subagent_factory import (
    SubagentFactory,
    SubagentSpecialization,
    SubagentConfig
)
from .mcp_integration import (
    DeploymentMCPServer,
    TestingMCPServer,
    MonitoringMCPServer,
    MCPIntegrationManager
)
from .tool_definitions import (
    get_claude_code_tool_definitions,
    execute_claude_code_tool
)

# Test fixtures
@pytest.fixture
def claude_handler():
    """Create a ClaudeCodeToolHandler instance for testing"""
    return ClaudeCodeToolHandler()

@pytest.fixture
def subagent_factory_fixture(claude_handler):
    """Create a SubagentFactory instance for testing"""
    return SubagentFactory(claude_handler)

@pytest.fixture
def mcp_manager():
    """Create an MCPIntegrationManager instance for testing"""
    return MCPIntegrationManager()

# ClaudeCodeToolHandler Tests
class TestClaudeCodeToolHandler:
    """Test suite for ClaudeCodeToolHandler"""
    
    @pytest.mark.asyncio
    async def test_execute_task_create_mode(self, claude_handler):
        """Test executing a task in create mode"""
        # Mock the SDK execution
        with patch.object(claude_handler, '_execute_with_sdk') as mock_execute:
            mock_execute.return_value = {
                'result': 'Tool created successfully',
                'cost': 0.01,
                'duration_ms': 1000,
                'tools_used': ['Write', 'Read'],
                'files_created': ['tool.py'],
                'files_modified': []
            }
            
            result = await claude_handler.execute_claude_code_task(
                task="Create a Python function to validate email addresses",
                mode="create"
            )
            
            assert result['success'] is True
            assert result['mode'] == 'create'
            assert 'session_id' in result
            assert result['cost'] == 0.01
            assert 'tool.py' in result['metadata']['files_created']
    
    @pytest.mark.asyncio
    async def test_execute_task_test_mode(self, claude_handler):
        """Test executing a task in test mode"""
        with patch.object(claude_handler, '_execute_with_sdk') as mock_execute:
            mock_execute.return_value = {
                'result': 'All tests passed',
                'cost': 0.005,
                'duration_ms': 500,
                'tools_used': ['Bash', 'Read'],
                'files_created': [],
                'files_modified': []
            }
            
            result = await claude_handler.execute_claude_code_task(
                task="Run unit tests for email validator",
                mode="test"
            )
            
            assert result['success'] is True
            assert result['mode'] == 'test'
            assert 'All tests passed' in result['result']
    
    @pytest.mark.asyncio
    async def test_session_management(self, claude_handler):
        """Test session creation and continuation"""
        # Create initial session
        with patch.object(claude_handler, '_execute_with_sdk') as mock_execute:
            mock_execute.return_value = {
                'result': 'Initial task completed',
                'cost': 0.01,
                'duration_ms': 1000,
                'tools_used': [],
                'files_created': [],
                'files_modified': []
            }
            
            result1 = await claude_handler.execute_claude_code_task(
                task="Start a new project",
                mode="create"
            )
            
            session_id = result1['session_id']
            assert session_id in claude_handler.active_sessions
            
            # Continue session
            result2 = await claude_handler.continue_session(
                session_id=session_id,
                task="Add more features"
            )
            
            assert result2['success'] is True
            assert result2['session_id'] == session_id
            
            # Check session status
            status = await claude_handler.get_session_status(session_id)
            assert status['exists'] is True
            assert status['turn_count'] == 2
    
    @pytest.mark.asyncio
    async def test_session_expiration(self, claude_handler):
        """Test session cleanup for expired sessions"""
        # Create a session
        session = await claude_handler._create_session(
            mode=ClaudeCodeMode.CREATE,
            system_prompt="Test prompt",
            allowed_tools=["Read", "Write"],
            max_turns=5,
            context={},
            mcp_servers={}
        )
        
        # Manually expire it
        from datetime import timedelta
        session.last_activity = datetime.now() - timedelta(minutes=20)
        
        # Run cleanup
        result = await claude_handler.cleanup_expired_sessions()
        
        assert result['cleaned_sessions'] == 1
        assert session.session_id not in claude_handler.active_sessions
    
    @pytest.mark.asyncio
    async def test_mode_configurations(self, claude_handler):
        """Test that different modes have correct configurations"""
        modes_to_test = ["create", "test", "deploy", "debug", "review", "optimize"]
        
        for mode in modes_to_test:
            mode_enum = ClaudeCodeMode(mode)
            config = claude_handler.mode_configs[mode_enum]
            
            assert 'system_prompt' in config
            assert 'allowed_tools' in config
            assert 'max_turns' in config
            assert isinstance(config['allowed_tools'], list)
            assert config['max_turns'] > 0

# SubagentFactory Tests
class TestSubagentFactory:
    """Test suite for SubagentFactory"""
    
    def test_default_subagents_initialization(self, subagent_factory_fixture):
        """Test that default subagents are properly initialized"""
        subagents = subagent_factory_fixture.list_available_subagents()
        
        # Should have all default specializations
        specializations = {s['specialization'] for s in subagents}
        expected_specs = {
            'frontend', 'backend', 'devops', 'testing', 'security',
            'database', 'api', 'ai_ml', 'documentation'
        }
        
        assert expected_specs.issubset(specializations)
        assert len(subagents) >= 9  # At least the default subagents
    
    def test_register_custom_subagent(self, subagent_factory_fixture):
        """Test registering a custom subagent"""
        subagent_id = subagent_factory_fixture.register_subagent(
            specialization=SubagentSpecialization.BACKEND,
            name="Custom Backend Expert",
            description="Specialized in microservices",
            system_prompt="You are a microservices expert",
            allowed_tools=["Read", "Write"],
            capabilities=["Microservices", "gRPC"],
            priority=8
        )
        
        assert subagent_id in subagent_factory_fixture.subagents
        config = subagent_factory_fixture.subagents[subagent_id]
        assert config.name == "Custom Backend Expert"
        assert config.priority == 8
    
    @pytest.mark.asyncio
    async def test_delegate_to_subagent(self, subagent_factory_fixture):
        """Test delegating a task to a subagent"""
        # Get a frontend subagent
        subagents = subagent_factory_fixture.list_available_subagents(
            specialization=SubagentSpecialization.FRONTEND
        )
        subagent_id = subagents[0]['subagent_id']
        
        # Mock the main handler execution
        with patch.object(
            subagent_factory_fixture.main_handler,
            'execute_claude_code_task'
        ) as mock_execute:
            mock_execute.return_value = {
                'success': True,
                'result': 'Component created',
                'cost': 0.02
            }
            
            result = await subagent_factory_fixture.delegate_to_subagent(
                subagent_id=subagent_id,
                task="Create a React component",
                mode="create"
            )
            
            assert result['success'] is True
            assert result['subagent']['specialization'] == 'frontend'
            assert 'task_id' in result
    
    @pytest.mark.asyncio
    async def test_parallel_subagent_execution(self, subagent_factory_fixture):
        """Test running multiple subagents in parallel"""
        # Create a team
        team_ids = await subagent_factory_fixture.create_subagent_team(
            task="Build a full-stack application",
            specializations=[
                SubagentSpecialization.FRONTEND,
                SubagentSpecialization.BACKEND
            ]
        )
        
        assert len(team_ids) == 2
        
        # Mock execution for parallel run
        with patch.object(
            subagent_factory_fixture,
            'delegate_to_subagent'
        ) as mock_delegate:
            mock_delegate.return_value = {
                'success': True,
                'result': 'Task completed',
                'cost': 0.01
            }
            
            result = await subagent_factory_fixture.run_parallel_subagents(
                task="Build application",
                subagent_ids=team_ids,
                aggregation_strategy="consensus"
            )
            
            assert result['success'] is True
            assert result['successful'] == 2
            assert result['failed'] == 0
    
    def test_task_requirement_analysis(self, subagent_factory_fixture):
        """Test automatic task requirement analysis"""
        # Test frontend detection
        specs = subagent_factory_fixture._analyze_task_requirements(
            "Create a React component with TypeScript"
        )
        assert SubagentSpecialization.FRONTEND in specs
        
        # Test backend detection
        specs = subagent_factory_fixture._analyze_task_requirements(
            "Build a REST API with database integration"
        )
        assert SubagentSpecialization.BACKEND in specs
        
        # Test testing detection
        specs = subagent_factory_fixture._analyze_task_requirements(
            "Write comprehensive unit tests"
        )
        assert SubagentSpecialization.TESTING in specs
    
    def test_subagent_statistics(self, subagent_factory_fixture):
        """Test getting subagent statistics"""
        subagents = subagent_factory_fixture.list_available_subagents()
        if subagents:
            subagent_id = subagents[0]['subagent_id']
            stats = subagent_factory_fixture.get_subagent_stats(subagent_id)
            
            assert 'subagent_id' in stats
            assert 'usage_count' in stats
            assert 'total_cost_usd' in stats
            assert 'success_rate' in stats

# MCP Integration Tests
class TestMCPIntegration:
    """Test suite for MCP Integration"""
    
    @pytest.mark.asyncio
    async def test_deployment_server(self):
        """Test deployment MCP server"""
        server = DeploymentMCPServer()
        
        # Test staging deployment
        result = await server.deploy_to_staging(
            project_path="/test/project",
            branch="feature-branch"
        )
        
        assert result['success'] is True
        assert result['environment'] == 'staging'
        assert 'deployment_id' in result
        
        # Test production deployment
        result = await server.deploy_to_production(
            project_path="/test/project",
            version_tag="v1.0.0"
        )
        
        assert result['success'] is True
        assert result['environment'] == 'production'
        assert result['version'] == 'v1.0.0'
    
    @pytest.mark.asyncio
    async def test_testing_server(self):
        """Test testing MCP server"""
        server = TestingMCPServer()
        
        # Test unit tests
        result = await server.run_unit_tests(
            project_path="/test/project",
            coverage=True
        )
        
        assert result['success'] is True
        assert 'total_tests' in result
        assert 'coverage_percent' in result
        
        # Test report generation
        report_result = await server.generate_test_report(
            test_results=[result],
            format="markdown"
        )
        
        assert report_result['success'] is True
        assert '# Test Report' in report_result['report']
    
    @pytest.mark.asyncio
    async def test_monitoring_server(self):
        """Test monitoring MCP server"""
        server = MonitoringMCPServer()
        
        # Test getting metrics
        result = await server.get_metrics(
            service="test-service",
            time_range="1h"
        )
        
        assert result['success'] is True
        assert 'metrics' in result
        assert 'cpu_usage_percent' in result['metrics']
        
        # Test setting up alerts
        alert_result = await server.setup_alert(
            service="test-service",
            condition="cpu > 80",
            threshold=80
        )
        
        assert alert_result['success'] is True
        assert 'alert_id' in alert_result
    
    def test_mcp_manager_configuration(self, mcp_manager):
        """Test MCP manager configuration generation"""
        config = mcp_manager.get_mcp_config(['deployment', 'testing'])
        
        assert 'mcpServers' in config
        assert 'deployment' in config['mcpServers']
        assert 'testing' in config['mcpServers']
        
        # Check server configuration
        deploy_config = config['mcpServers']['deployment']
        assert 'command' in deploy_config
        assert 'args' in deploy_config
        assert 'env' in deploy_config
    
    def test_list_available_tools(self, mcp_manager):
        """Test listing available MCP tools"""
        tools = mcp_manager.list_available_tools()
        
        assert 'deployment' in tools
        assert 'testing' in tools
        assert 'monitoring' in tools
        
        # Check specific tools
        assert 'deploy_staging' in tools['deployment']
        assert 'run_unit_tests' in tools['testing']
        assert 'get_metrics' in tools['monitoring']

# Tool Definitions Tests
class TestToolDefinitions:
    """Test suite for tool definitions"""
    
    def test_get_tool_definitions(self):
        """Test getting Claude Code tool definitions"""
        definitions = get_claude_code_tool_definitions()
        
        expected_tools = [
            'claude_code_agent',
            'claude_code_continue_session',
            'claude_code_session_status',
            'claude_code_close_session',
            'claude_code_subagent',
            'claude_code_subagent_team',
            'claude_code_deploy',
            'claude_code_test',
            'claude_code_monitor'
        ]
        
        for tool in expected_tools:
            assert tool in definitions
            assert 'description' in definitions[tool]
            assert 'parameters' in definitions[tool]
    
    @pytest.mark.asyncio
    async def test_execute_claude_code_agent(self):
        """Test executing the main Claude Code agent tool"""
        with patch(
            'backend.agents.claudeAgent.claude_tools.claude_code_sdk_integration.tool_definitions.claude_code_handler'
        ) as mock_handler:
            mock_handler.execute_claude_code_task = AsyncMock(return_value={
                'success': True,
                'result': 'Task completed',
                'cost': 0.01
            })
            
            result = await execute_claude_code_tool(
                'claude_code_agent',
                {
                    'task': 'Create a function',
                    'mode': 'create'
                }
            )
            
            assert result['success'] is True
            assert result['result'] == 'Task completed'
    
    @pytest.mark.asyncio
    async def test_execute_deploy_tool(self):
        """Test executing the deployment tool"""
        with patch(
            'backend.agents.claudeAgent.claude_tools.claude_code_sdk_integration.tool_definitions.mcp_manager'
        ) as mock_mcp:
            mock_mcp.execute_mcp_tool = AsyncMock(return_value={
                'success': True,
                'deployment_id': 'deploy_123',
                'url': 'https://staging.example.com'
            })
            
            result = await execute_claude_code_tool(
                'claude_code_deploy',
                {
                    'project_path': '/test',
                    'environment': 'staging',
                    'version': 'main',
                    'run_tests': False
                }
            )
            
            assert 'deployment_id' in result
            assert result['url'] == 'https://staging.example.com'
    
    @pytest.mark.asyncio
    async def test_execute_test_tool(self):
        """Test executing the testing tool"""
        with patch(
            'backend.agents.claudeAgent.claude_tools.claude_code_sdk_integration.tool_definitions.mcp_manager'
        ) as mock_mcp:
            mock_mcp.execute_mcp_tool = AsyncMock(return_value={
                'success': True,
                'total_tests': 50,
                'passed': 48,
                'failed': 2
            })
            
            result = await execute_claude_code_tool(
                'claude_code_test',
                {
                    'project_path': '/test',
                    'test_types': ['unit'],
                    'coverage': True
                }
            )
            
            assert result['success'] is True
            assert 'test_results' in result

# Integration Tests
class TestEndToEndIntegration:
    """End-to-end integration tests"""
    
    @pytest.mark.asyncio
    async def test_full_development_workflow(self, claude_handler, subagent_factory_fixture, mcp_manager):
        """Test a complete development workflow"""
        # Step 1: Create a tool
        with patch.object(claude_handler, '_execute_with_sdk') as mock_execute:
            mock_execute.return_value = {
                'result': 'Tool created',
                'cost': 0.02,
                'duration_ms': 2000,
                'tools_used': ['Write'],
                'files_created': ['app.py'],
                'files_modified': []
            }
            
            create_result = await claude_handler.execute_claude_code_task(
                task="Create a web scraper tool",
                mode="create"
            )
            
            assert create_result['success'] is True
            session_id = create_result['session_id']
        
        # Step 2: Test the tool
        with patch.object(claude_handler, '_execute_with_sdk') as mock_execute:
            mock_execute.return_value = {
                'result': 'Tests passed',
                'cost': 0.01,
                'duration_ms': 1000,
                'tools_used': ['Bash'],
                'files_created': [],
                'files_modified': []
            }
            
            test_result = await claude_handler.continue_session(
                session_id=session_id,
                task="Write and run tests"
            )
            
            assert test_result['success'] is True
        
        # Step 3: Deploy the tool
        with patch.object(mcp_manager, 'execute_mcp_tool') as mock_mcp:
            mock_mcp.return_value = {
                'success': True,
                'deployment_id': 'prod_123',
                'url': 'https://production.example.com'
            }
            
            deploy_result = await mcp_manager.execute_mcp_tool(
                'deployment',
                'deploy_production',
                {
                    'project_path': '/test',
                    'version_tag': 'v1.0.0'
                }
            )
            
            assert deploy_result['success'] is True
        
        # Step 4: Monitor the deployment
        with patch.object(mcp_manager, 'execute_mcp_tool') as mock_mcp:
            mock_mcp.return_value = {
                'success': True,
                'metrics': {
                    'cpu_usage_percent': 25,
                    'memory_usage_percent': 40,
                    'error_rate': 0.01
                }
            }
            
            monitor_result = await mcp_manager.execute_mcp_tool(
                'monitoring',
                'get_metrics',
                {
                    'service': 'web-scraper',
                    'time_range': '1h'
                }
            )
            
            assert monitor_result['success'] is True
            assert monitor_result['metrics']['error_rate'] < 0.1
    
    @pytest.mark.asyncio
    async def test_subagent_team_collaboration(self, subagent_factory_fixture):
        """Test multiple subagents working together"""
        # Create a full-stack development team
        team_ids = await subagent_factory_fixture.create_subagent_team(
            task="Build a complete e-commerce platform",
            specializations=[
                SubagentSpecialization.FRONTEND,
                SubagentSpecialization.BACKEND,
                SubagentSpecialization.DATABASE,
                SubagentSpecialization.TESTING
            ]
        )
        
        assert len(team_ids) >= 4
        
        # Mock parallel execution
        with patch.object(subagent_factory_fixture, 'delegate_to_subagent') as mock_delegate:
            # Different results for different subagents
            mock_delegate.side_effect = [
                {'success': True, 'result': 'Frontend completed', 'cost': 0.03},
                {'success': True, 'result': 'Backend API ready', 'cost': 0.04},
                {'success': True, 'result': 'Database schema created', 'cost': 0.02},
                {'success': True, 'result': 'Tests written', 'cost': 0.02}
            ]
            
            result = await subagent_factory_fixture.run_parallel_subagents(
                task="Build e-commerce platform",
                subagent_ids=team_ids[:4],
                aggregation_strategy="all"
            )
            
            assert result['success'] is True
            assert result['successful'] == 4
            assert result['total_cost'] == 0.11

# Performance Tests
class TestPerformance:
    """Performance and load tests"""
    
    @pytest.mark.asyncio
    async def test_concurrent_sessions(self, claude_handler):
        """Test handling multiple concurrent sessions"""
        with patch.object(claude_handler, '_execute_with_sdk') as mock_execute:
            mock_execute.return_value = {
                'result': 'Task completed',
                'cost': 0.01,
                'duration_ms': 100,
                'tools_used': [],
                'files_created': [],
                'files_modified': []
            }
            
            # Create multiple sessions concurrently
            tasks = [
                claude_handler.execute_claude_code_task(
                    task=f"Task {i}",
                    mode="create"
                )
                for i in range(10)
            ]
            
            results = await asyncio.gather(*tasks)
            
            assert len(results) == 10
            assert all(r['success'] for r in results)
            assert len(claude_handler.active_sessions) == 10
    
    @pytest.mark.asyncio
    async def test_session_cleanup_performance(self, claude_handler):
        """Test performance of session cleanup"""
        # Create many sessions
        for i in range(100):
            session = await claude_handler._create_session(
                mode=ClaudeCodeMode.CREATE,
                system_prompt="Test",
                allowed_tools=[],
                max_turns=5,
                context={},
                mcp_servers={}
            )
            # Expire half of them
            if i % 2 == 0:
                from datetime import timedelta
                session.last_activity = datetime.now() - timedelta(minutes=30)
        
        # Measure cleanup time
        import time
        start_time = time.time()
        result = await claude_handler.cleanup_expired_sessions()
        cleanup_time = time.time() - start_time
        
        assert result['cleaned_sessions'] == 50
        assert result['active_sessions'] == 50
        assert cleanup_time < 1.0  # Should complete within 1 second

# Run tests
if __name__ == "__main__":
    pytest.main([__file__, "-v"])
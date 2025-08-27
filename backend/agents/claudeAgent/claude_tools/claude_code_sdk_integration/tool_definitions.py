"""
Tool Definitions for Claude Code SDK Integration
Provides tool definitions that integrate with the main Claude agent
"""

import asyncio
from typing import Dict, List, Any, Optional
import logging

from .claude_code_tool_handler import claude_code_handler
from .subagent_factory import SubagentFactory, SubagentSpecialization
from .mcp_integration import mcp_manager

logger = logging.getLogger(__name__)

# Initialize subagent factory
subagent_factory = SubagentFactory(claude_code_handler)

def get_claude_code_tool_definitions() -> Dict[str, Dict[str, Any]]:
    """
    Get tool definitions for Claude Code SDK integration
    These can be added to the main agent's tool definitions
    """
    
    return {
        "claude_code_agent": {
            "description": "Execute coding tasks using Claude Code SDK - can create, test, deploy, and debug tools with production-ready implementations",
            "parameters": {
                "task": {
                    "type": "string",
                    "description": "The coding task to execute (be specific and detailed)",
                    "required": True
                },
                "mode": {
                    "type": "string",
                    "enum": ["create", "test", "deploy", "debug", "review", "optimize"],
                    "description": "Operation mode: create (build new), test (run tests), deploy (deploy to production), debug (fix issues), review (code review), optimize (performance)",
                    "required": True
                },
                "allowed_tools": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Optional list of tool names to allow (default: mode-specific tools)",
                    "required": False
                },
                "system_prompt": {
                    "type": "string",
                    "description": "Optional custom system prompt to append to mode defaults",
                    "required": False
                },
                "session_id": {
                    "type": "string",
                    "description": "Optional session ID to continue existing session",
                    "required": False
                },
                "context": {
                    "type": "object",
                    "description": "Optional context data for the task",
                    "required": False
                },
                "permission_mode": {
                    "type": "string",
                    "enum": ["default", "acceptEdits", "plan", "bypassPermissions"],
                    "description": "Permission mode for tool execution",
                    "required": False,
                    "default": "default"
                }
            }
        },
        
        "claude_code_continue_session": {
            "description": "Continue an existing Claude Code SDK session with a new task",
            "parameters": {
                "session_id": {
                    "type": "string",
                    "description": "Session ID to continue",
                    "required": True
                },
                "task": {
                    "type": "string",
                    "description": "New task to execute in the session",
                    "required": True
                },
                "context_update": {
                    "type": "object",
                    "description": "Optional context updates for the session",
                    "required": False
                }
            }
        },
        
        "claude_code_session_status": {
            "description": "Get the status of a Claude Code SDK session",
            "parameters": {
                "session_id": {
                    "type": "string",
                    "description": "Session ID to check",
                    "required": True
                }
            }
        },
        
        "claude_code_close_session": {
            "description": "Close and cleanup a Claude Code SDK session",
            "parameters": {
                "session_id": {
                    "type": "string",
                    "description": "Session ID to close",
                    "required": True
                }
            }
        },
        
        "claude_code_subagent": {
            "description": "Delegate a task to a specialized Claude Code subagent",
            "parameters": {
                "task": {
                    "type": "string",
                    "description": "Task to delegate to the subagent",
                    "required": True
                },
                "specialization": {
                    "type": "string",
                    "enum": ["frontend", "backend", "devops", "testing", "security", "database", "api", "mobile", "ai_ml", "documentation"],
                    "description": "Subagent specialization to use",
                    "required": True
                },
                "context": {
                    "type": "object",
                    "description": "Optional context for the subagent",
                    "required": False
                },
                "mode": {
                    "type": "string",
                    "enum": ["create", "test", "debug", "review", "optimize"],
                    "description": "Execution mode for the subagent",
                    "required": False,
                    "default": "create"
                }
            }
        },
        
        "claude_code_subagent_team": {
            "description": "Run a team of specialized Claude Code subagents in parallel",
            "parameters": {
                "task": {
                    "type": "string",
                    "description": "Task to execute with the team",
                    "required": True
                },
                "specializations": {
                    "type": "array",
                    "items": {
                        "type": "string",
                        "enum": ["frontend", "backend", "devops", "testing", "security", "database", "api", "mobile", "ai_ml", "documentation"]
                    },
                    "description": "List of specializations for the team (auto-select if not provided)",
                    "required": False
                },
                "context": {
                    "type": "object",
                    "description": "Shared context for all subagents",
                    "required": False
                },
                "aggregation_strategy": {
                    "type": "string",
                    "enum": ["consensus", "best", "all"],
                    "description": "How to aggregate results from multiple subagents",
                    "required": False,
                    "default": "consensus"
                }
            }
        },
        
        "claude_code_deploy": {
            "description": "Deploy a tool or application using Claude Code SDK with MCP integration",
            "parameters": {
                "project_path": {
                    "type": "string",
                    "description": "Path to the project to deploy",
                    "required": True
                },
                "environment": {
                    "type": "string",
                    "enum": ["staging", "production"],
                    "description": "Deployment environment",
                    "required": True
                },
                "version": {
                    "type": "string",
                    "description": "Version tag or branch to deploy",
                    "required": True
                },
                "rollback_enabled": {
                    "type": "boolean",
                    "description": "Enable rollback capability",
                    "required": False,
                    "default": True
                },
                "run_tests": {
                    "type": "boolean",
                    "description": "Run tests before deployment",
                    "required": False,
                    "default": True
                }
            }
        },
        
        "claude_code_test": {
            "description": "Run comprehensive tests using Claude Code SDK testing framework",
            "parameters": {
                "project_path": {
                    "type": "string",
                    "description": "Path to the project to test",
                    "required": True
                },
                "test_types": {
                    "type": "array",
                    "items": {
                        "type": "string",
                        "enum": ["unit", "integration", "performance", "security"]
                    },
                    "description": "Types of tests to run",
                    "required": False,
                    "default": ["unit", "integration"]
                },
                "coverage": {
                    "type": "boolean",
                    "description": "Generate coverage report",
                    "required": False,
                    "default": True
                },
                "environment": {
                    "type": "string",
                    "description": "Test environment",
                    "required": False,
                    "default": "test"
                }
            }
        },
        
        "claude_code_monitor": {
            "description": "Set up monitoring and alerts for deployed applications",
            "parameters": {
                "service": {
                    "type": "string",
                    "description": "Service to monitor",
                    "required": True
                },
                "metrics": {
                    "type": "array",
                    "items": {
                        "type": "string",
                        "enum": ["cpu", "memory", "latency", "error_rate", "throughput"]
                    },
                    "description": "Metrics to monitor",
                    "required": False,
                    "default": ["cpu", "memory", "error_rate"]
                },
                "alert_conditions": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "metric": {"type": "string"},
                            "condition": {"type": "string", "enum": [">", "<", ">=", "<=", "=="]},
                            "threshold": {"type": "number"}
                        }
                    },
                    "description": "Alert conditions to set up",
                    "required": False
                }
            }
        }
    }

async def execute_claude_code_tool(tool_name: str, tool_input: Dict[str, Any]) -> Dict[str, Any]:
    """
    Execute a Claude Code SDK tool
    
    Args:
        tool_name: Name of the tool to execute
        tool_input: Input parameters for the tool
        
    Returns:
        Tool execution result
    """
    
    try:
        if tool_name == "claude_code_agent":
            # Main Claude Code agent execution
            result = await claude_code_handler.execute_claude_code_task(
                task=tool_input.get('task'),
                mode=tool_input.get('mode', 'create'),
                allowed_tools=tool_input.get('allowed_tools'),
                system_prompt=tool_input.get('system_prompt'),
                session_id=tool_input.get('session_id'),
                context=tool_input.get('context'),
                permission_mode=tool_input.get('permission_mode', 'default')
            )
            return result
            
        elif tool_name == "claude_code_continue_session":
            # Continue existing session
            result = await claude_code_handler.continue_session(
                session_id=tool_input.get('session_id'),
                task=tool_input.get('task'),
                context_update=tool_input.get('context_update')
            )
            return result
            
        elif tool_name == "claude_code_session_status":
            # Get session status
            result = await claude_code_handler.get_session_status(
                session_id=tool_input.get('session_id')
            )
            return result
            
        elif tool_name == "claude_code_close_session":
            # Close session
            result = await claude_code_handler.close_session(
                session_id=tool_input.get('session_id')
            )
            return result
            
        elif tool_name == "claude_code_subagent":
            # Delegate to specialized subagent
            spec_str = tool_input.get('specialization')
            specialization = SubagentSpecialization(spec_str)
            
            # Find appropriate subagent
            subagents = subagent_factory.list_available_subagents(
                specialization=specialization,
                active_only=True
            )
            
            if not subagents:
                return {
                    'success': False,
                    'error': f"No active subagent found for specialization {spec_str}"
                }
            
            # Use highest priority subagent
            subagent_id = subagents[0]['subagent_id']
            
            result = await subagent_factory.delegate_to_subagent(
                subagent_id=subagent_id,
                task=tool_input.get('task'),
                context=tool_input.get('context'),
                mode=tool_input.get('mode', 'create')
            )
            return result
            
        elif tool_name == "claude_code_subagent_team":
            # Run subagent team
            specializations = tool_input.get('specializations')
            
            if specializations:
                # Convert strings to enums
                spec_enums = [SubagentSpecialization(s) for s in specializations]
            else:
                spec_enums = None
            
            # Create team
            team_ids = await subagent_factory.create_subagent_team(
                task=tool_input.get('task'),
                specializations=spec_enums,
                auto_select=True
            )
            
            # Run team
            result = await subagent_factory.run_parallel_subagents(
                task=tool_input.get('task'),
                subagent_ids=team_ids,
                context=tool_input.get('context'),
                aggregation_strategy=tool_input.get('aggregation_strategy', 'consensus')
            )
            return result
            
        elif tool_name == "claude_code_deploy":
            # Deployment with MCP
            environment = tool_input.get('environment')
            run_tests = tool_input.get('run_tests', True)
            
            # Run tests first if requested
            if run_tests:
                test_result = await mcp_manager.execute_mcp_tool(
                    'testing',
                    'run_unit_tests',
                    {
                        'project_path': tool_input.get('project_path'),
                        'coverage': True
                    }
                )
                
                if not test_result.get('success') or test_result.get('failed', 0) > 0:
                    return {
                        'success': False,
                        'error': 'Tests failed, deployment aborted',
                        'test_result': test_result
                    }
            
            # Deploy based on environment
            if environment == 'staging':
                deploy_result = await mcp_manager.execute_mcp_tool(
                    'deployment',
                    'deploy_staging',
                    {
                        'project_path': tool_input.get('project_path'),
                        'branch': tool_input.get('version')
                    }
                )
            else:  # production
                deploy_result = await mcp_manager.execute_mcp_tool(
                    'deployment',
                    'deploy_production',
                    {
                        'project_path': tool_input.get('project_path'),
                        'version_tag': tool_input.get('version'),
                        'rollback_enabled': tool_input.get('rollback_enabled', True)
                    }
                )
            
            # Run health check
            if deploy_result.get('success') and deploy_result.get('url'):
                health_result = await mcp_manager.execute_mcp_tool(
                    'deployment',
                    'health_check',
                    {
                        'endpoint': f"{deploy_result['url']}/health",
                        'timeout': 30
                    }
                )
                deploy_result['health_check'] = health_result
            
            return deploy_result
            
        elif tool_name == "claude_code_test":
            # Comprehensive testing
            test_types = tool_input.get('test_types', ['unit', 'integration'])
            results = {}
            
            for test_type in test_types:
                if test_type == 'unit':
                    result = await mcp_manager.execute_mcp_tool(
                        'testing',
                        'run_unit_tests',
                        {
                            'project_path': tool_input.get('project_path'),
                            'coverage': tool_input.get('coverage', True)
                        }
                    )
                elif test_type == 'integration':
                    result = await mcp_manager.execute_mcp_tool(
                        'testing',
                        'run_integration_tests',
                        {
                            'project_path': tool_input.get('project_path'),
                            'environment': tool_input.get('environment', 'test')
                        }
                    )
                elif test_type == 'performance':
                    result = await mcp_manager.execute_mcp_tool(
                        'testing',
                        'run_performance_tests',
                        {
                            'endpoint': f"http://localhost:8000",
                            'concurrent_users': 100,
                            'duration_seconds': 60
                        }
                    )
                else:
                    continue
                
                results[test_type] = result
            
            # Generate report
            report = await mcp_manager.execute_mcp_tool(
                'testing',
                'generate_test_report',
                {
                    'test_results': list(results.values()),
                    'format': 'markdown'
                }
            )
            
            return {
                'success': all(r.get('success') for r in results.values()),
                'test_results': results,
                'report': report.get('report', '')
            }
            
        elif tool_name == "claude_code_monitor":
            # Set up monitoring
            service = tool_input.get('service')
            metrics = tool_input.get('metrics', ['cpu', 'memory', 'error_rate'])
            
            # Get current metrics
            metrics_result = await mcp_manager.execute_mcp_tool(
                'monitoring',
                'get_metrics',
                {
                    'service': service,
                    'metric_type': 'all',
                    'time_range': '1h'
                }
            )
            
            # Set up alerts
            alert_conditions = tool_input.get('alert_conditions', [])
            alerts = []
            
            for condition in alert_conditions:
                alert_result = await mcp_manager.execute_mcp_tool(
                    'monitoring',
                    'setup_alert',
                    {
                        'service': service,
                        'condition': f"{condition['metric']} {condition['condition']} {condition['threshold']}",
                        'threshold': condition['threshold'],
                        'channels': ['email', 'slack']
                    }
                )
                alerts.append(alert_result)
            
            return {
                'success': True,
                'service': service,
                'current_metrics': metrics_result.get('metrics'),
                'alerts_configured': len(alerts),
                'alert_details': alerts
            }
            
        else:
            return {
                'success': False,
                'error': f"Unknown Claude Code tool: {tool_name}"
            }
            
    except Exception as e:
        logger.error(f"Error executing Claude Code tool {tool_name}: {str(e)}")
        return {
            'success': False,
            'error': str(e),
            'tool': tool_name
        }

def register_claude_code_tools(tools_dict: Dict[str, Any]) -> None:
    """
    Register Claude Code SDK tools with the main agent's tool system
    
    Args:
        tools_dict: The main TOOLS dictionary to update
    """
    
    tool_definitions = get_claude_code_tool_definitions()
    
    for tool_name, definition in tool_definitions.items():
        tools_dict[tool_name] = {
            "function": lambda **kwargs: asyncio.run(execute_claude_code_tool(tool_name, kwargs)),
            "description": definition["description"],
            "parameters": definition["parameters"]
        }
    
    logger.info(f"Registered {len(tool_definitions)} Claude Code SDK tools")
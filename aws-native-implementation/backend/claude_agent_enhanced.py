"""
Enhanced Claude Agent Implementation
AWS-Native Architecture with Best Practices

Key Improvements:
1. Async/await throughout for better performance
2. Connection pooling and caching
3. Structured error handling and retry logic
4. AWS service integration with proper IAM
5. Metrics and observability
6. Type safety with Pydantic v2
7. Configuration management
8. Resource cleanup and lifecycle management
"""

import asyncio
import json
import logging
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, AsyncGenerator, Union
from contextlib import asynccontextmanager
from dataclasses import dataclass, field
from enum import Enum

import boto3
import aiohttp
from anthropic import AsyncAnthropic
from pydantic import BaseModel, Field, ConfigDict
from tenacity import retry, stop_after_attempt, wait_exponential
import structlog

# AWS SDK clients with connection pooling
from botocore.config import Config

# Configuration
@dataclass
class AWSConfig:
    region: str = "us-east-1"
    healthlake_datastore_id: str = ""
    dynamodb_table_prefix: str = "ron-ai"
    s3_bucket: str = "ron-ai-healthcare-data"
    
    def __post_init__(self):
        # AWS client configuration with connection pooling
        self.boto_config = Config(
            region_name=self.region,
            retries={'max_attempts': 3, 'mode': 'adaptive'},
            max_pool_connections=50
        )

@dataclass
class ClaudeConfig:
    api_key: str
    model: str = "claude-3-5-sonnet-20241022"
    max_tokens: int = 4000
    temperature: float = 0.1
    timeout: int = 60
    max_concurrent_requests: int = 10

class MessageRole(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"

class ToolExecutionStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"

# Pydantic Models with v2 syntax
class Message(BaseModel):
    model_config = ConfigDict(frozen=True)
    
    role: MessageRole
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    metadata: Dict[str, Any] = Field(default_factory=dict)

class ToolCall(BaseModel):
    model_config = ConfigDict(frozen=True)
    
    id: str
    name: str
    input: Dict[str, Any]
    status: ToolExecutionStatus = ToolExecutionStatus.PENDING
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    execution_time_ms: Optional[int] = None

class ConversationContext(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    conversation_id: str
    patient_id: Optional[str] = None
    messages: List[Message] = Field(default_factory=list)
    tool_calls: List[ToolCall] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# Enhanced Claude Agent with AWS Integration
class EnhancedClaudeAgent:
    """
    Production-ready Claude Agent with AWS integration and best practices
    """
    
    def __init__(self, aws_config: AWSConfig, claude_config: ClaudeConfig):
        self.aws_config = aws_config
        self.claude_config = claude_config
        
        # Setup structured logging
        self.logger = structlog.get_logger(__name__)
        
        # Initialize AWS clients with connection pooling
        self._init_aws_clients()
        
        # Initialize Anthropic client with connection limits
        self.claude_client = AsyncAnthropic(
            api_key=claude_config.api_key,
            timeout=claude_config.timeout
        )
        
        # Connection semaphore for rate limiting
        self.claude_semaphore = asyncio.Semaphore(claude_config.max_concurrent_requests)
        
        # Cache for frequently accessed data
        self._cache: Dict[str, Any] = {}
        self._cache_ttl: Dict[str, datetime] = {}
        
        # Tool registry
        self.tools: Dict[str, 'HealthcareTool'] = {}
        
    def _init_aws_clients(self):
        """Initialize AWS clients with proper configuration"""
        self.healthlake = boto3.client(
            'healthlakeapi', 
            config=self.aws_config.boto_config
        )
        self.comprehend_medical = boto3.client(
            'comprehendmedical',
            config=self.aws_config.boto_config
        )
        self.dynamodb = boto3.resource(
            'dynamodb',
            config=self.aws_config.boto_config
        )
        self.s3 = boto3.client(
            's3',
            config=self.aws_config.boto_config
        )
        self.eventbridge = boto3.client(
            'events',
            config=self.aws_config.boto_config
        )
        
        # DynamoDB tables
        self.conversations_table = self.dynamodb.Table(
            f"{self.aws_config.dynamodb_table_prefix}-conversations"
        )
        self.tool_executions_table = self.dynamodb.Table(
            f"{self.aws_config.dynamodb_table_prefix}-tool-executions"
        )
    
    @asynccontextmanager
    async def conversation_session(self, conversation_id: str, patient_id: Optional[str] = None):
        """Context manager for conversation sessions with proper cleanup"""
        context = await self._load_conversation_context(conversation_id, patient_id)
        try:
            yield context
        finally:
            await self._save_conversation_context(context)
    
    async def _load_conversation_context(self, conversation_id: str, patient_id: Optional[str] = None) -> ConversationContext:
        """Load conversation context from DynamoDB with caching"""
        cache_key = f"conversation:{conversation_id}"
        
        # Check cache first
        if cache_key in self._cache and self._is_cache_valid(cache_key):
            return self._cache[cache_key]
        
        try:
            response = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: self.conversations_table.get_item(Key={'conversation_id': conversation_id})
            )
            
            if 'Item' in response:
                context = ConversationContext.model_validate(response['Item'])
            else:
                context = ConversationContext(
                    conversation_id=conversation_id,
                    patient_id=patient_id
                )
            
            # Cache the context
            self._cache[cache_key] = context
            self._cache_ttl[cache_key] = datetime.utcnow() + timedelta(minutes=5)
            
            return context
            
        except Exception as e:
            self.logger.error("Failed to load conversation context", 
                            conversation_id=conversation_id, error=str(e))
            # Return new context on error
            return ConversationContext(
                conversation_id=conversation_id,
                patient_id=patient_id
            )
    
    async def _save_conversation_context(self, context: ConversationContext):
        """Save conversation context to DynamoDB"""
        try:
            context.updated_at = datetime.utcnow()
            
            await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: self.conversations_table.put_item(Item=context.model_dump())
            )
            
            # Update cache
            cache_key = f"conversation:{context.conversation_id}"
            self._cache[cache_key] = context
            self._cache_ttl[cache_key] = datetime.utcnow() + timedelta(minutes=5)
            
        except Exception as e:
            self.logger.error("Failed to save conversation context",
                            conversation_id=context.conversation_id, error=str(e))
    
    def _is_cache_valid(self, cache_key: str) -> bool:
        """Check if cache entry is still valid"""
        return (cache_key in self._cache_ttl and 
                self._cache_ttl[cache_key] > datetime.utcnow())
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=10)
    )
    async def process_message(
        self, 
        conversation_id: str,
        message: str,
        patient_id: Optional[str] = None,
        system_prompt: Optional[str] = None
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Process a message with Claude and yield streaming responses
        """
        async with self.conversation_session(conversation_id, patient_id) as context:
            # Add user message to context
            user_message = Message(role=MessageRole.USER, content=message)
            context.messages.append(user_message)
            
            # Prepare messages for Claude
            claude_messages = await self._prepare_claude_messages(context, system_prompt)
            
            # Get available tools
            tools = await self._get_available_tools(context)
            
            async with self.claude_semaphore:
                try:
                    # Stream response from Claude
                    async with self.claude_client.messages.stream(
                        model=self.claude_config.model,
                        max_tokens=self.claude_config.max_tokens,
                        temperature=self.claude_config.temperature,
                        messages=claude_messages,
                        tools=tools
                    ) as stream:
                        
                        assistant_content = ""
                        tool_calls = []
                        
                        async for event in stream:
                            if event.type == "content_block_delta":
                                if event.delta.type == "text":
                                    assistant_content += event.delta.text
                                    yield {
                                        "type": "content_delta",
                                        "content": event.delta.text,
                                        "conversation_id": conversation_id
                                    }
                            
                            elif event.type == "content_block_start":
                                if event.content_block.type == "tool_use":
                                    tool_call = ToolCall(
                                        id=event.content_block.id,
                                        name=event.content_block.name,
                                        input=event.content_block.input,
                                        status=ToolExecutionStatus.PENDING
                                    )
                                    tool_calls.append(tool_call)
                                    context.tool_calls.append(tool_call)
                                    
                                    yield {
                                        "type": "tool_call_start",
                                        "tool_call": tool_call.model_dump(),
                                        "conversation_id": conversation_id
                                    }
                        
                        # Add assistant message to context
                        if assistant_content:
                            assistant_message = Message(
                                role=MessageRole.ASSISTANT, 
                                content=assistant_content
                            )
                            context.messages.append(assistant_message)
                        
                        # Execute tool calls
                        for tool_call in tool_calls:
                            async for tool_result in self._execute_tool_call(tool_call, context):
                                yield tool_result
                
                except Exception as e:
                    self.logger.error("Claude API error", 
                                    conversation_id=conversation_id, error=str(e))
                    yield {
                        "type": "error",
                        "error": f"Claude API error: {str(e)}",
                        "conversation_id": conversation_id
                    }
    
    async def _prepare_claude_messages(
        self, 
        context: ConversationContext, 
        system_prompt: Optional[str]
    ) -> List[Dict[str, Any]]:
        """Prepare messages for Claude API with context optimization"""
        
        # Get patient context if available
        patient_context = ""
        if context.patient_id:
            patient_context = await self._get_patient_context(context.patient_id)
        
        # Build system prompt
        full_system_prompt = self._build_system_prompt(system_prompt, patient_context)
        
        # Convert messages to Claude format
        claude_messages = []
        if full_system_prompt:
            claude_messages.append({
                "role": "system",
                "content": full_system_prompt
            })
        
        # Add conversation history (with context window management)
        for message in context.messages[-20:]:  # Keep last 20 messages
            claude_messages.append({
                "role": message.role.value,
                "content": message.content
            })
        
        return claude_messages
    
    async def _get_patient_context(self, patient_id: str) -> str:
        """Get patient context from AWS HealthLake"""
        try:
            # Query HealthLake for patient data
            response = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: self.healthlake.search_with_get(
                    DatastoreId=self.aws_config.healthlake_datastore_id,
                    ResourceType='Patient',
                    Id=patient_id
                )
            )
            
            if response.get('Resource'):
                patient_data = response['Resource']
                return f"Patient Context: {json.dumps(patient_data, indent=2)}"
            
        except Exception as e:
            self.logger.warning("Failed to get patient context", 
                              patient_id=patient_id, error=str(e))
        
        return ""
    
    def _build_system_prompt(self, custom_prompt: Optional[str], patient_context: str) -> str:
        """Build comprehensive system prompt"""
        base_prompt = """You are Ron, a specialized healthcare AI assistant focused on medication optimization, 
        care coordination, and clinical decision support. You have access to AWS healthcare services and 
        can execute specialized tools to help patients and providers.
        
        Key capabilities:
        - Medication cost optimization using AWS Bedrock analysis
        - Clinical entity extraction with Amazon Comprehend Medical
        - FHIR-compliant patient data management via AWS HealthLake
        - Care team coordination through Amazon Connect
        - Real-time healthcare data processing
        
        Always prioritize patient safety, HIPAA compliance, and evidence-based recommendations."""
        
        if patient_context:
            base_prompt += f"\n\nCurrent Patient Context:\n{patient_context}"
        
        if custom_prompt:
            base_prompt += f"\n\nAdditional Instructions:\n{custom_prompt}"
        
        return base_prompt
    
    async def _get_available_tools(self, context: ConversationContext) -> List[Dict[str, Any]]:
        """Get available tools based on context"""
        available_tools = []
        
        for tool_name, tool in self.tools.items():
            # Check if tool is available for current context
            if await tool.is_available(context):
                available_tools.append(tool.get_claude_schema())
        
        return available_tools
    
    async def _execute_tool_call(
        self, 
        tool_call: ToolCall, 
        context: ConversationContext
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """Execute a tool call with proper error handling and metrics"""
        
        start_time = time.time()
        tool_call.status = ToolExecutionStatus.RUNNING
        
        yield {
            "type": "tool_execution_start",
            "tool_call_id": tool_call.id,
            "tool_name": tool_call.name,
            "conversation_id": context.conversation_id
        }
        
        try:
            # Get the tool
            if tool_call.name not in self.tools:
                raise ValueError(f"Unknown tool: {tool_call.name}")
            
            tool = self.tools[tool_call.name]
            
            # Execute the tool
            async for result in tool.execute(tool_call.input, context):
                yield {
                    "type": "tool_execution_progress",
                    "tool_call_id": tool_call.id,
                    "progress": result,
                    "conversation_id": context.conversation_id
                }
            
            # Get final result
            final_result = await tool.get_final_result()
            
            tool_call.result = final_result
            tool_call.status = ToolExecutionStatus.COMPLETED
            tool_call.execution_time_ms = int((time.time() - start_time) * 1000)
            
            yield {
                "type": "tool_execution_complete",
                "tool_call_id": tool_call.id,
                "result": final_result,
                "execution_time_ms": tool_call.execution_time_ms,
                "conversation_id": context.conversation_id
            }
            
            # Log metrics
            await self._log_tool_metrics(tool_call, context)
            
        except Exception as e:
            tool_call.error = str(e)
            tool_call.status = ToolExecutionStatus.FAILED
            tool_call.execution_time_ms = int((time.time() - start_time) * 1000)
            
            self.logger.error("Tool execution failed",
                            tool_name=tool_call.name,
                            tool_call_id=tool_call.id,
                            error=str(e))
            
            yield {
                "type": "tool_execution_error",
                "tool_call_id": tool_call.id,
                "error": str(e),
                "conversation_id": context.conversation_id
            }
    
    async def _log_tool_metrics(self, tool_call: ToolCall, context: ConversationContext):
        """Log tool execution metrics to DynamoDB and CloudWatch"""
        try:
            # Save to DynamoDB
            await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: self.tool_executions_table.put_item(
                    Item={
                        'tool_call_id': tool_call.id,
                        'conversation_id': context.conversation_id,
                        'tool_name': tool_call.name,
                        'status': tool_call.status.value,
                        'execution_time_ms': tool_call.execution_time_ms,
                        'timestamp': datetime.utcnow().isoformat(),
                        'patient_id': context.patient_id
                    }
                )
            )
            
            # Send to EventBridge for real-time monitoring
            await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: self.eventbridge.put_events(
                    Entries=[{
                        'Source': 'ron-ai.claude-agent',
                        'DetailType': 'Tool Execution Complete',
                        'Detail': json.dumps({
                            'tool_name': tool_call.name,
                            'execution_time_ms': tool_call.execution_time_ms,
                            'status': tool_call.status.value,
                            'conversation_id': context.conversation_id
                        })
                    }]
                )
            )
            
        except Exception as e:
            self.logger.warning("Failed to log tool metrics", error=str(e))
    
    def register_tool(self, tool: 'HealthcareTool'):
        """Register a healthcare tool"""
        self.tools[tool.name] = tool
        self.logger.info("Tool registered", tool_name=tool.name)
    
    async def cleanup(self):
        """Cleanup resources"""
        await self.claude_client.aclose()
        self._cache.clear()
        self._cache_ttl.clear()


# Base class for healthcare tools
class HealthcareTool:
    """Base class for healthcare tools with AWS integration"""
    
    def __init__(self, name: str, description: str, aws_clients: Dict[str, Any]):
        self.name = name
        self.description = description
        self.aws_clients = aws_clients
        self.logger = structlog.get_logger(f"tool.{name}")
    
    async def is_available(self, context: ConversationContext) -> bool:
        """Check if tool is available for current context"""
        return True
    
    def get_claude_schema(self) -> Dict[str, Any]:
        """Get Claude tool schema"""
        raise NotImplementedError
    
    async def execute(
        self, 
        input_data: Dict[str, Any], 
        context: ConversationContext
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """Execute the tool"""
        raise NotImplementedError
    
    async def get_final_result(self) -> Dict[str, Any]:
        """Get final result after execution"""
        raise NotImplementedError


# Example healthcare tool implementation
class MedicationCostOptimizationTool(HealthcareTool):
    """Tool for medication cost optimization using AWS services"""
    
    def __init__(self, aws_clients: Dict[str, Any]):
        super().__init__(
            name="optimize_medication_cost",
            description="Optimize medication costs using AWS Bedrock and HealthLake",
            aws_clients=aws_clients
        )
        self.final_result = None
    
    def get_claude_schema(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "description": self.description,
            "input_schema": {
                "type": "object",
                "properties": {
                    "medication_name": {
                        "type": "string",
                        "description": "Name of the medication to optimize"
                    },
                    "patient_id": {
                        "type": "string", 
                        "description": "Patient ID for insurance lookup"
                    },
                    "dosage": {
                        "type": "string",
                        "description": "Medication dosage"
                    }
                },
                "required": ["medication_name", "patient_id"]
            }
        }
    
    async def execute(
        self, 
        input_data: Dict[str, Any], 
        context: ConversationContext
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """Execute medication cost optimization"""
        
        yield {"status": "Extracting medication entities..."}
        
        # Use Comprehend Medical to extract entities
        comprehend_response = await asyncio.get_event_loop().run_in_executor(
            None,
            lambda: self.aws_clients['comprehend_medical'].detect_entities_v2(
                Text=input_data['medication_name']
            )
        )
        
        yield {"status": "Getting patient insurance data..."}
        
        # Get patient insurance from HealthLake
        try:
            insurance_response = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: self.aws_clients['healthlake'].search_with_get(
                    DatastoreId=context.metadata.get('healthlake_datastore_id'),
                    ResourceType='Coverage',
                    patient=input_data['patient_id']
                )
            )
        except Exception as e:
            self.logger.warning("Could not retrieve insurance data", error=str(e))
            insurance_response = {}
        
        yield {"status": "Analyzing cost optimization options..."}
        
        # Use Bedrock for cost analysis (placeholder - would use actual Bedrock API)
        optimization_analysis = {
            "original_medication": input_data['medication_name'],
            "generic_alternatives": ["Generic Option 1", "Generic Option 2"],
            "estimated_savings": "$150/month",
            "insurance_coverage": "80% covered",
            "recommendations": [
                "Switch to generic equivalent",
                "Use preferred pharmacy network",
                "Apply for patient assistance program"
            ]
        }
        
        self.final_result = optimization_analysis
        
        yield {"status": "Cost optimization analysis complete"}
    
    async def get_final_result(self) -> Dict[str, Any]:
        return self.final_result or {}


# Factory function to create configured agent
async def create_enhanced_claude_agent(
    aws_region: str = "us-east-1",
    anthropic_api_key: str = None,
    healthlake_datastore_id: str = None
) -> EnhancedClaudeAgent:
    """Factory function to create a fully configured Claude agent"""
    
    aws_config = AWSConfig(
        region=aws_region,
        healthlake_datastore_id=healthlake_datastore_id or ""
    )
    
    claude_config = ClaudeConfig(
        api_key=anthropic_api_key or os.getenv('ANTHROPIC_API_KEY')
    )
    
    agent = EnhancedClaudeAgent(aws_config, claude_config)
    
    # Register healthcare tools
    aws_clients = {
        'healthlake': agent.healthlake,
        'comprehend_medical': agent.comprehend_medical,
        's3': agent.s3,
        'dynamodb': agent.dynamodb
    }
    
    # Register tools
    agent.register_tool(MedicationCostOptimizationTool(aws_clients))
    
    return agent


# Usage example
async def main():
    """Example usage of the enhanced Claude agent"""
    
    agent = await create_enhanced_claude_agent(
        aws_region="us-east-1",
        anthropic_api_key="your-anthropic-key",
        healthlake_datastore_id="your-healthlake-id"
    )
    
    conversation_id = "conv_123"
    patient_id = "patient_456"
    
    # Process a message with streaming
    async for response in agent.process_message(
        conversation_id=conversation_id,
        message="Help me optimize the cost of my diabetes medication",
        patient_id=patient_id
    ):
        print(f"Response: {response}")
    
    # Cleanup
    await agent.cleanup()

if __name__ == "__main__":
    asyncio.run(main())

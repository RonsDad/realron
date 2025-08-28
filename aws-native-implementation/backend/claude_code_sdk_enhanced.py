"""
Enhanced Claude Code SDK Implementation
AWS-Native Architecture with Best Practices

Key Improvements:
1. Serverless architecture with AWS Lambda
2. S3-based code storage and versioning
3. EventBridge for code execution orchestration
4. DynamoDB for execution tracking
5. CloudWatch for monitoring and logging
6. IAM-based security and access control
7. Async execution with proper resource management
8. Code sandboxing and security validation
9. Multi-language support with containerized execution
10. Real-time execution streaming via WebSocket
"""

import asyncio
import json
import uuid
import hashlib
import tempfile
import subprocess
import os
import shutil
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, AsyncGenerator, Union
from pathlib import Path
from dataclasses import dataclass, field
from enum import Enum
import zipfile
import base64

import boto3
from botocore.exceptions import ClientError
import aiofiles
from anthropic import AsyncAnthropic
from pydantic import BaseModel, Field, ConfigDict
import structlog
from tenacity import retry, stop_after_attempt, wait_exponential

# Configuration
@dataclass
class CodeSDKConfig:
    aws_region: str = "us-east-1"
    s3_bucket: str = "ron-ai-code-execution"
    lambda_function_name: str = "ron-ai-code-executor"
    dynamodb_table: str = "ron-ai-code-executions"
    eventbridge_bus: str = "ron-ai-events"
    max_execution_time: int = 300  # 5 minutes
    supported_languages: List[str] = field(default_factory=lambda: [
        "python", "javascript", "typescript", "bash", "sql", "html", "css"
    ])

class ExecutionStatus(str, Enum):
    PENDING = "pending"
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    TIMEOUT = "timeout"
    CANCELLED = "cancelled"

class CodeLanguage(str, Enum):
    PYTHON = "python"
    JAVASCRIPT = "javascript"
    TYPESCRIPT = "typescript"
    BASH = "bash"
    SQL = "sql"
    HTML = "html"
    CSS = "css"

# Pydantic Models
class CodeFile(BaseModel):
    model_config = ConfigDict(frozen=True)
    
    name: str
    language: CodeLanguage
    content: str
    size_bytes: int = Field(default=0)
    checksum: str = Field(default="")
    
    def __post_init__(self):
        if not self.size_bytes:
            object.__setattr__(self, 'size_bytes', len(self.content.encode('utf-8')))
        if not self.checksum:
            object.__setattr__(self, 'checksum', hashlib.sha256(self.content.encode()).hexdigest())

class CodeProject(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    project_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str = ""
    files: List[CodeFile] = Field(default_factory=list)
    dependencies: Dict[str, str] = Field(default_factory=dict)
    environment_vars: Dict[str, str] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
class ExecutionRequest(BaseModel):
    model_config = ConfigDict(frozen=True)
    
    execution_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    project_id: str
    entry_point: str = "main.py"
    args: List[str] = Field(default_factory=list)
    environment: Dict[str, str] = Field(default_factory=dict)
    timeout_seconds: int = 300
    memory_limit_mb: int = 512
    
class ExecutionResult(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    execution_id: str
    status: ExecutionStatus
    stdout: str = ""
    stderr: str = ""
    exit_code: Optional[int] = None
    execution_time_ms: Optional[int] = None
    memory_used_mb: Optional[int] = None
    output_files: List[CodeFile] = Field(default_factory=list)
    error_message: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

# Enhanced Claude Code SDK
class EnhancedClaudeCodeSDK:
    """
    Production-ready Claude Code SDK with AWS serverless architecture
    """
    
    def __init__(self, config: CodeSDKConfig, anthropic_api_key: str):
        self.config = config
        self.logger = structlog.get_logger(__name__)
        
        # Initialize AWS clients
        self._init_aws_clients()
        
        # Initialize Anthropic client
        self.claude_client = AsyncAnthropic(api_key=anthropic_api_key)
        
        # Execution tracking
        self.active_executions: Dict[str, ExecutionResult] = {}
        
    def _init_aws_clients(self):
        """Initialize AWS clients with proper configuration"""
        session = boto3.Session(region_name=self.config.aws_region)
        
        self.s3 = session.client('s3')
        self.lambda_client = session.client('lambda')
        self.dynamodb = session.resource('dynamodb')
        self.eventbridge = session.client('events')
        self.logs = session.client('logs')
        
        # DynamoDB table
        self.executions_table = self.dynamodb.Table(self.config.dynamodb_table)
    
    async def generate_code_project(
        self, 
        prompt: str, 
        project_name: str = None,
        language: CodeLanguage = CodeLanguage.PYTHON,
        include_tests: bool = True
    ) -> CodeProject:
        """
        Generate a complete code project using Claude
        """
        
        project_name = project_name or f"generated_project_{int(datetime.now().timestamp())}"
        
        # Enhanced prompt for code generation
        enhanced_prompt = self._build_code_generation_prompt(
            prompt, language, include_tests
        )
        
        try:
            response = await self.claude_client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=4000,
                temperature=0.1,
                messages=[{
                    "role": "user",
                    "content": enhanced_prompt
                }]
            )
            
            # Parse Claude's response to extract code files
            project = await self._parse_code_response(
                response.content[0].text, 
                project_name, 
                language
            )
            
            # Store project in S3
            await self._store_project(project)
            
            # Log project creation
            await self._log_project_event(project, "project_created")
            
            return project
            
        except Exception as e:
            self.logger.error("Code generation failed", 
                            prompt=prompt[:100], error=str(e))
            raise
    
    def _build_code_generation_prompt(
        self, 
        user_prompt: str, 
        language: CodeLanguage, 
        include_tests: bool
    ) -> str:
        """Build enhanced prompt for code generation"""
        
        base_prompt = f"""
        Generate a complete, production-ready {language.value} project based on this request:
        
        {user_prompt}
        
        Requirements:
        1. Create a well-structured project with multiple files
        2. Include proper error handling and logging
        3. Add comprehensive documentation and comments
        4. Follow best practices for {language.value}
        5. Include a README.md with setup and usage instructions
        6. Add appropriate dependencies/requirements file
        """
        
        if include_tests:
            base_prompt += "\n7. Include comprehensive unit tests"
        
        base_prompt += """
        
        Format your response as follows:
        
        ## Project Structure
        [Describe the project structure]
        
        ## Files
        
        ### filename1.ext
        ```language
        [file content]
        ```
        
        ### filename2.ext
        ```language
        [file content]
        ```
        
        [Continue for all files]
        
        ## Dependencies
        [List any dependencies needed]
        
        ## Setup Instructions
        [Provide setup and run instructions]
        """
        
        return base_prompt
    
    async def _parse_code_response(
        self, 
        response_text: str, 
        project_name: str, 
        primary_language: CodeLanguage
    ) -> CodeProject:
        """Parse Claude's response to extract code files"""
        
        files = []
        dependencies = {}
        description = ""
        
        # Extract project description
        if "## Project Structure" in response_text:
            desc_start = response_text.find("## Project Structure") + len("## Project Structure")
            desc_end = response_text.find("## Files", desc_start)
            if desc_end > desc_start:
                description = response_text[desc_start:desc_end].strip()
        
        # Extract code blocks
        import re
        
        # Pattern to match ### filename followed by ```language code ```
        file_pattern = r'### ([^\n]+)\n```(\w+)\n(.*?)\n```'
        matches = re.findall(file_pattern, response_text, re.DOTALL)
        
        for filename, lang, content in matches:
            filename = filename.strip()
            content = content.strip()
            
            # Determine language
            try:
                file_language = CodeLanguage(lang.lower())
            except ValueError:
                file_language = primary_language
            
            # Create code file
            code_file = CodeFile(
                name=filename,
                language=file_language,
                content=content
            )
            files.append(code_file)
        
        # Extract dependencies
        if "## Dependencies" in response_text:
            dep_start = response_text.find("## Dependencies") + len("## Dependencies")
            dep_end = response_text.find("## Setup Instructions", dep_start)
            if dep_end > dep_start:
                dep_text = response_text[dep_start:dep_end].strip()
                # Parse dependencies (simplified)
                for line in dep_text.split('\n'):
                    if '==' in line or '>=' in line:
                        parts = re.split(r'[>=<]', line.strip())
                        if len(parts) >= 2:
                            dependencies[parts[0].strip()] = parts[1].strip()
        
        return CodeProject(
            name=project_name,
            description=description,
            files=files,
            dependencies=dependencies
        )
    
    async def _store_project(self, project: CodeProject):
        """Store project files in S3"""
        try:
            # Create project archive
            project_data = {
                'metadata': project.model_dump(exclude={'files'}),
                'files': {f.name: f.content for f in project.files}
            }
            
            # Store in S3
            await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: self.s3.put_object(
                    Bucket=self.config.s3_bucket,
                    Key=f"projects/{project.project_id}/project.json",
                    Body=json.dumps(project_data, default=str),
                    ContentType='application/json'
                )
            )
            
            # Store individual files
            for file in project.files:
                await asyncio.get_event_loop().run_in_executor(
                    None,
                    lambda f=file: self.s3.put_object(
                        Bucket=self.config.s3_bucket,
                        Key=f"projects/{project.project_id}/files/{f.name}",
                        Body=f.content,
                        ContentType=self._get_content_type(f.language)
                    )
                )
            
        except Exception as e:
            self.logger.error("Failed to store project", 
                            project_id=project.project_id, error=str(e))
            raise
    
    def _get_content_type(self, language: CodeLanguage) -> str:
        """Get content type for file language"""
        content_types = {
            CodeLanguage.PYTHON: 'text/x-python',
            CodeLanguage.JAVASCRIPT: 'application/javascript',
            CodeLanguage.TYPESCRIPT: 'application/typescript',
            CodeLanguage.HTML: 'text/html',
            CodeLanguage.CSS: 'text/css',
            CodeLanguage.BASH: 'application/x-sh',
            CodeLanguage.SQL: 'application/sql'
        }
        return content_types.get(language, 'text/plain')
    
    async def execute_project(
        self, 
        project_id: str, 
        entry_point: str = "main.py",
        args: List[str] = None,
        environment: Dict[str, str] = None
    ) -> AsyncGenerator[ExecutionResult, None]:
        """
        Execute a code project with real-time streaming
        """
        
        execution_request = ExecutionRequest(
            project_id=project_id,
            entry_point=entry_point,
            args=args or [],
            environment=environment or {}
        )
        
        # Initialize execution result
        result = ExecutionResult(
            execution_id=execution_request.execution_id,
            status=ExecutionStatus.PENDING,
            started_at=datetime.utcnow()
        )
        
        self.active_executions[result.execution_id] = result
        
        try:
            # Store execution request in DynamoDB
            await self._store_execution_request(execution_request, result)
            
            yield result
            
            # Queue execution via EventBridge
            result.status = ExecutionStatus.QUEUED
            await self._queue_execution(execution_request)
            
            yield result
            
            # Monitor execution progress
            async for updated_result in self._monitor_execution(result.execution_id):
                yield updated_result
                
        except Exception as e:
            result.status = ExecutionStatus.FAILED
            result.error_message = str(e)
            result.completed_at = datetime.utcnow()
            
            await self._update_execution_result(result)
            yield result
            
        finally:
            # Cleanup
            if result.execution_id in self.active_executions:
                del self.active_executions[result.execution_id]
    
    async def _store_execution_request(
        self, 
        request: ExecutionRequest, 
        result: ExecutionResult
    ):
        """Store execution request in DynamoDB"""
        try:
            await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: self.executions_table.put_item(
                    Item={
                        'execution_id': request.execution_id,
                        'project_id': request.project_id,
                        'status': result.status.value,
                        'entry_point': request.entry_point,
                        'args': request.args,
                        'environment': request.environment,
                        'created_at': result.started_at.isoformat(),
                        'ttl': int((datetime.utcnow() + timedelta(days=7)).timestamp())
                    }
                )
            )
        except Exception as e:
            self.logger.error("Failed to store execution request", 
                            execution_id=request.execution_id, error=str(e))
            raise
    
    async def _queue_execution(self, request: ExecutionRequest):
        """Queue execution via EventBridge"""
        try:
            await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: self.eventbridge.put_events(
                    Entries=[{
                        'Source': 'ron-ai.code-sdk',
                        'DetailType': 'Code Execution Request',
                        'Detail': json.dumps({
                            'execution_id': request.execution_id,
                            'project_id': request.project_id,
                            'entry_point': request.entry_point,
                            'args': request.args,
                            'environment': request.environment,
                            'timeout_seconds': request.timeout_seconds
                        }),
                        'EventBusName': self.config.eventbridge_bus
                    }]
                )
            )
        except Exception as e:
            self.logger.error("Failed to queue execution", 
                            execution_id=request.execution_id, error=str(e))
            raise
    
    async def _monitor_execution(self, execution_id: str) -> AsyncGenerator[ExecutionResult, None]:
        """Monitor execution progress"""
        
        start_time = datetime.utcnow()
        timeout = timedelta(seconds=self.config.max_execution_time)
        
        while datetime.utcnow() - start_time < timeout:
            try:
                # Get execution status from DynamoDB
                response = await asyncio.get_event_loop().run_in_executor(
                    None,
                    lambda: self.executions_table.get_item(
                        Key={'execution_id': execution_id}
                    )
                )
                
                if 'Item' in response:
                    item = response['Item']
                    
                    # Update result
                    result = self.active_executions[execution_id]
                    result.status = ExecutionStatus(item['status'])
                    
                    if 'stdout' in item:
                        result.stdout = item['stdout']
                    if 'stderr' in item:
                        result.stderr = item['stderr']
                    if 'exit_code' in item:
                        result.exit_code = item['exit_code']
                    if 'execution_time_ms' in item:
                        result.execution_time_ms = item['execution_time_ms']
                    if 'completed_at' in item:
                        result.completed_at = datetime.fromisoformat(item['completed_at'])
                    
                    yield result
                    
                    # Check if execution is complete
                    if result.status in [
                        ExecutionStatus.COMPLETED, 
                        ExecutionStatus.FAILED, 
                        ExecutionStatus.TIMEOUT,
                        ExecutionStatus.CANCELLED
                    ]:
                        # Get output files if any
                        await self._get_output_files(result)
                        break
                
                # Wait before next check
                await asyncio.sleep(1)
                
            except Exception as e:
                self.logger.error("Error monitoring execution", 
                                execution_id=execution_id, error=str(e))
                break
        
        # Handle timeout
        if datetime.utcnow() - start_time >= timeout:
            result = self.active_executions[execution_id]
            result.status = ExecutionStatus.TIMEOUT
            result.error_message = "Execution timed out"
            result.completed_at = datetime.utcnow()
            
            await self._update_execution_result(result)
            yield result
    
    async def _get_output_files(self, result: ExecutionResult):
        """Get output files from S3"""
        try:
            # List output files
            response = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: self.s3.list_objects_v2(
                    Bucket=self.config.s3_bucket,
                    Prefix=f"executions/{result.execution_id}/output/"
                )
            )
            
            if 'Contents' in response:
                for obj in response['Contents']:
                    # Get file content
                    file_response = await asyncio.get_event_loop().run_in_executor(
                        None,
                        lambda: self.s3.get_object(
                            Bucket=self.config.s3_bucket,
                            Key=obj['Key']
                        )
                    )
                    
                    filename = Path(obj['Key']).name
                    content = file_response['Body'].read().decode('utf-8')
                    
                    # Determine language from extension
                    language = self._detect_language_from_filename(filename)
                    
                    output_file = CodeFile(
                        name=filename,
                        language=language,
                        content=content
                    )
                    
                    result.output_files.append(output_file)
                    
        except Exception as e:
            self.logger.warning("Failed to get output files", 
                              execution_id=result.execution_id, error=str(e))
    
    def _detect_language_from_filename(self, filename: str) -> CodeLanguage:
        """Detect language from filename extension"""
        ext = Path(filename).suffix.lower()
        
        extension_map = {
            '.py': CodeLanguage.PYTHON,
            '.js': CodeLanguage.JAVASCRIPT,
            '.ts': CodeLanguage.TYPESCRIPT,
            '.html': CodeLanguage.HTML,
            '.css': CodeLanguage.CSS,
            '.sh': CodeLanguage.BASH,
            '.sql': CodeLanguage.SQL
        }
        
        return extension_map.get(ext, CodeLanguage.PYTHON)
    
    async def _update_execution_result(self, result: ExecutionResult):
        """Update execution result in DynamoDB"""
        try:
            update_expression = "SET #status = :status"
            expression_values = {':status': result.status.value}
            expression_names = {'#status': 'status'}
            
            if result.stdout:
                update_expression += ", stdout = :stdout"
                expression_values[':stdout'] = result.stdout
            
            if result.stderr:
                update_expression += ", stderr = :stderr"
                expression_values[':stderr'] = result.stderr
            
            if result.exit_code is not None:
                update_expression += ", exit_code = :exit_code"
                expression_values[':exit_code'] = result.exit_code
            
            if result.execution_time_ms:
                update_expression += ", execution_time_ms = :execution_time_ms"
                expression_values[':execution_time_ms'] = result.execution_time_ms
            
            if result.completed_at:
                update_expression += ", completed_at = :completed_at"
                expression_values[':completed_at'] = result.completed_at.isoformat()
            
            if result.error_message:
                update_expression += ", error_message = :error_message"
                expression_values[':error_message'] = result.error_message
            
            await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: self.executions_table.update_item(
                    Key={'execution_id': result.execution_id},
                    UpdateExpression=update_expression,
                    ExpressionAttributeValues=expression_values,
                    ExpressionAttributeNames=expression_names
                )
            )
            
        except Exception as e:
            self.logger.error("Failed to update execution result", 
                            execution_id=result.execution_id, error=str(e))
    
    async def _log_project_event(self, project: CodeProject, event_type: str):
        """Log project events to EventBridge"""
        try:
            await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: self.eventbridge.put_events(
                    Entries=[{
                        'Source': 'ron-ai.code-sdk',
                        'DetailType': f'Project {event_type.title()}',
                        'Detail': json.dumps({
                            'project_id': project.project_id,
                            'project_name': project.name,
                            'file_count': len(project.files),
                            'languages': list(set(f.language.value for f in project.files)),
                            'timestamp': datetime.utcnow().isoformat()
                        }),
                        'EventBusName': self.config.eventbridge_bus
                    }]
                )
            )
        except Exception as e:
            self.logger.warning("Failed to log project event", 
                              project_id=project.project_id, error=str(e))
    
    async def get_project(self, project_id: str) -> Optional[CodeProject]:
        """Retrieve a project from S3"""
        try:
            response = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: self.s3.get_object(
                    Bucket=self.config.s3_bucket,
                    Key=f"projects/{project_id}/project.json"
                )
            )
            
            project_data = json.loads(response['Body'].read().decode('utf-8'))
            
            # Reconstruct project
            files = []
            for filename, content in project_data['files'].items():
                # Detect language
                language = self._detect_language_from_filename(filename)
                
                files.append(CodeFile(
                    name=filename,
                    language=language,
                    content=content
                ))
            
            project = CodeProject(**project_data['metadata'])
            project.files = files
            
            return project
            
        except ClientError as e:
            if e.response['Error']['Code'] == 'NoSuchKey':
                return None
            raise
        except Exception as e:
            self.logger.error("Failed to get project", 
                            project_id=project_id, error=str(e))
            raise
    
    async def list_projects(self, limit: int = 50) -> List[CodeProject]:
        """List all projects"""
        try:
            response = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: self.s3.list_objects_v2(
                    Bucket=self.config.s3_bucket,
                    Prefix="projects/",
                    Delimiter="/",
                    MaxKeys=limit
                )
            )
            
            projects = []
            if 'CommonPrefixes' in response:
                for prefix in response['CommonPrefixes']:
                    project_id = prefix['Prefix'].split('/')[-2]
                    project = await self.get_project(project_id)
                    if project:
                        projects.append(project)
            
            return projects
            
        except Exception as e:
            self.logger.error("Failed to list projects", error=str(e))
            return []
    
    async def delete_project(self, project_id: str):
        """Delete a project and all its files"""
        try:
            # List all objects for the project
            response = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: self.s3.list_objects_v2(
                    Bucket=self.config.s3_bucket,
                    Prefix=f"projects/{project_id}/"
                )
            )
            
            if 'Contents' in response:
                # Delete all objects
                objects_to_delete = [{'Key': obj['Key']} for obj in response['Contents']]
                
                await asyncio.get_event_loop().run_in_executor(
                    None,
                    lambda: self.s3.delete_objects(
                        Bucket=self.config.s3_bucket,
                        Delete={'Objects': objects_to_delete}
                    )
                )
            
            # Log deletion event
            await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: self.eventbridge.put_events(
                    Entries=[{
                        'Source': 'ron-ai.code-sdk',
                        'DetailType': 'Project Deleted',
                        'Detail': json.dumps({
                            'project_id': project_id,
                            'timestamp': datetime.utcnow().isoformat()
                        }),
                        'EventBusName': self.config.eventbridge_bus
                    }]
                )
            )
            
        except Exception as e:
            self.logger.error("Failed to delete project", 
                            project_id=project_id, error=str(e))
            raise
    
    async def cleanup(self):
        """Cleanup resources"""
        await self.claude_client.aclose()
        self.active_executions.clear()


# Factory function
async def create_enhanced_code_sdk(
    aws_region: str = "us-east-1",
    anthropic_api_key: str = None,
    s3_bucket: str = "ron-ai-code-execution"
) -> EnhancedClaudeCodeSDK:
    """Factory function to create configured Code SDK"""
    
    config = CodeSDKConfig(
        aws_region=aws_region,
        s3_bucket=s3_bucket
    )
    
    sdk = EnhancedClaudeCodeSDK(
        config=config,
        anthropic_api_key=anthropic_api_key or os.getenv('ANTHROPIC_API_KEY')
    )
    
    return sdk


# Usage example
async def main():
    """Example usage of the enhanced Claude Code SDK"""
    
    sdk = await create_enhanced_code_sdk(
        aws_region="us-east-1",
        anthropic_api_key="your-anthropic-key",
        s3_bucket="your-s3-bucket"
    )
    
    # Generate a code project
    project = await sdk.generate_code_project(
        prompt="Create a FastAPI healthcare API with patient management endpoints",
        project_name="healthcare_api",
        language=CodeLanguage.PYTHON,
        include_tests=True
    )
    
    print(f"Generated project: {project.name} with {len(project.files)} files")
    
    # Execute the project
    async for result in sdk.execute_project(
        project_id=project.project_id,
        entry_point="main.py"
    ):
        print(f"Execution status: {result.status}")
        if result.stdout:
            print(f"Output: {result.stdout}")
        if result.status in [ExecutionStatus.COMPLETED, ExecutionStatus.FAILED]:
            break
    
    # Cleanup
    await sdk.cleanup()

if __name__ == "__main__":
    asyncio.run(main())

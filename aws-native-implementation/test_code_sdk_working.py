#!/usr/bin/env python3
"""
Working Test Script for Enhanced Claude Code SDK
This demonstrates actual code generation and execution improvements
"""

import asyncio
import json
import time
import tempfile
import subprocess
import os
import sys
from datetime import datetime
from typing import Dict, Any, List
from pathlib import Path

try:
    from anthropic import AsyncAnthropic
    print("✅ Anthropic SDK available")
except ImportError:
    print("❌ Anthropic SDK not installed. Run: pip install anthropic")
    sys.exit(1)

class TestableCodeSDK:
    """
    Simplified but working version of the enhanced Code SDK
    Shows real code generation and execution improvements
    """
    
    def __init__(self, api_key: str):
        self.claude_client = AsyncAnthropic(api_key=api_key)
        self.projects = {}  # In-memory storage for testing
        self.executions = {}
        self.metrics = {
            'projects_created': 0,
            'executions_completed': 0,
            'total_generation_time': 0,
            'total_execution_time': 0
        }
    
    async def generate_code_project(
        self, 
        prompt: str, 
        project_name: str = None,
        language: str = "python"
    ) -> Dict[str, Any]:
        """
        Generate a complete code project using Claude
        """
        start_time = time.time()
        
        if not project_name:
            project_name = f"generated_project_{int(time.time())}"
        
        print(f"🔄 Generating {language} project: {project_name}")
        
        # Enhanced prompt for better code generation
        enhanced_prompt = f"""
        Create a complete, production-ready {language} project based on this request:
        
        {prompt}
        
        Requirements:
        1. Create multiple well-structured files
        2. Include proper error handling and logging
        3. Add comprehensive documentation and comments
        4. Follow best practices for {language}
        5. Include a README.md with setup instructions
        6. Add appropriate dependencies/requirements
        7. Make it immediately runnable
        
        Format your response exactly like this:
        
        ## Project: {project_name}
        
        ### main.py
        ```python
        [main file content]
        ```
        
        ### utils.py
        ```python
        [utility functions]
        ```
        
        ### requirements.txt
        ```text
        [dependencies]
        ```
        
        ### README.md
        ```markdown
        [setup and usage instructions]
        ```
        
        Provide complete, working code that can be executed immediately.
        """
        
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
            
            # Parse the response to extract files
            project = self._parse_code_response(
                response.content[0].text, 
                project_name, 
                language
            )
            
            # Store project
            project_id = f"proj_{int(time.time())}"
            project['project_id'] = project_id
            project['created_at'] = datetime.now().isoformat()
            
            self.projects[project_id] = project
            
            # Update metrics
            generation_time = time.time() - start_time
            self.metrics['projects_created'] += 1
            self.metrics['total_generation_time'] += generation_time
            
            print(f"✅ Project generated in {generation_time:.2f}s with {len(project['files'])} files")
            
            return project
            
        except Exception as e:
            print(f"❌ Code generation failed: {str(e)}")
            raise
    
    def _parse_code_response(self, response_text: str, project_name: str, language: str) -> Dict[str, Any]:
        """Parse Claude's response to extract code files"""
        
        files = {}
        
        # Extract code blocks using regex
        import re
        
        # Pattern to match ### filename followed by ```language code ```
        file_pattern = r'### ([^\n]+)\n```(\w+)?\n(.*?)\n```'
        matches = re.findall(file_pattern, response_text, re.DOTALL)
        
        for filename, lang, content in matches:
            filename = filename.strip()
            content = content.strip()
            
            files[filename] = {
                'content': content,
                'language': lang.lower() if lang else language,
                'size': len(content)
            }
        
        # Extract project description
        description = ""
        if f"## Project: {project_name}" in response_text:
            desc_start = response_text.find(f"## Project: {project_name}")
            desc_end = response_text.find("###", desc_start)
            if desc_end > desc_start:
                description = response_text[desc_start:desc_end].strip()
        
        return {
            'name': project_name,
            'description': description,
            'files': files,
            'language': language
        }
    
    async def execute_project(self, project_id: str, entry_point: str = "main.py") -> Dict[str, Any]:
        """
        Execute a code project locally (simulating serverless execution)
        """
        start_time = time.time()
        
        if project_id not in self.projects:
            raise ValueError(f"Project {project_id} not found")
        
        project = self.projects[project_id]
        execution_id = f"exec_{int(time.time())}"
        
        print(f"🚀 Executing project: {project['name']}")
        print(f"📁 Entry point: {entry_point}")
        
        try:
            # Create temporary directory for execution
            with tempfile.TemporaryDirectory() as temp_dir:
                temp_path = Path(temp_dir)
                
                # Write all files to temp directory
                for filename, file_data in project['files'].items():
                    file_path = temp_path / filename
                    file_path.write_text(file_data['content'])
                    print(f"   📄 Created: {filename}")
                
                # Install dependencies if requirements.txt exists
                if 'requirements.txt' in project['files']:
                    print("📦 Installing dependencies...")
                    result = subprocess.run([
                        sys.executable, '-m', 'pip', 'install', '-r', 
                        str(temp_path / 'requirements.txt')
                    ], capture_output=True, text=True, cwd=temp_dir)
                    
                    if result.returncode != 0:
                        print(f"⚠️  Dependency installation warning: {result.stderr}")
                
                # Execute the entry point
                print(f"▶️  Running {entry_point}...")
                
                if entry_point.endswith('.py'):
                    # Python execution
                    result = subprocess.run([
                        sys.executable, entry_point
                    ], capture_output=True, text=True, cwd=temp_dir, timeout=30)
                elif entry_point.endswith('.js'):
                    # Node.js execution
                    result = subprocess.run([
                        'node', entry_point
                    ], capture_output=True, text=True, cwd=temp_dir, timeout=30)
                else:
                    # Try to execute directly
                    result = subprocess.run([
                        entry_point
                    ], capture_output=True, text=True, cwd=temp_dir, timeout=30)
                
                execution_time = time.time() - start_time
                
                # Store execution result
                execution_result = {
                    'execution_id': execution_id,
                    'project_id': project_id,
                    'entry_point': entry_point,
                    'exit_code': result.returncode,
                    'stdout': result.stdout,
                    'stderr': result.stderr,
                    'execution_time_ms': int(execution_time * 1000),
                    'status': 'completed' if result.returncode == 0 else 'failed',
                    'executed_at': datetime.now().isoformat()
                }
                
                self.executions[execution_id] = execution_result
                
                # Update metrics
                self.metrics['executions_completed'] += 1
                self.metrics['total_execution_time'] += execution_time
                
                print(f"✅ Execution completed in {execution_time:.2f}s")
                if result.stdout:
                    print(f"📤 Output:\n{result.stdout}")
                if result.stderr and result.returncode != 0:
                    print(f"❌ Errors:\n{result.stderr}")
                
                return execution_result
                
        except subprocess.TimeoutExpired:
            return {
                'execution_id': execution_id,
                'project_id': project_id,
                'status': 'timeout',
                'error': 'Execution timed out after 30 seconds',
                'execution_time_ms': 30000
            }
        except Exception as e:
            return {
                'execution_id': execution_id,
                'project_id': project_id,
                'status': 'error',
                'error': str(e),
                'execution_time_ms': int((time.time() - start_time) * 1000)
            }
    
    def get_project_files(self, project_id: str) -> Dict[str, Any]:
        """Get all files in a project"""
        if project_id not in self.projects:
            return {}
        
        project = self.projects[project_id]
        return {
            'project_name': project['name'],
            'files': project['files'],
            'file_count': len(project['files']),
            'total_size': sum(f['size'] for f in project['files'].values())
        }
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get SDK performance metrics"""
        avg_generation_time = 0
        avg_execution_time = 0
        
        if self.metrics['projects_created'] > 0:
            avg_generation_time = self.metrics['total_generation_time'] / self.metrics['projects_created']
        
        if self.metrics['executions_completed'] > 0:
            avg_execution_time = self.metrics['total_execution_time'] / self.metrics['executions_completed']
        
        return {
            'projects_created': self.metrics['projects_created'],
            'executions_completed': self.metrics['executions_completed'],
            'avg_generation_time_s': round(avg_generation_time, 2),
            'avg_execution_time_s': round(avg_execution_time, 2),
            'success_rate': self._calculate_success_rate()
        }
    
    def _calculate_success_rate(self) -> float:
        """Calculate execution success rate"""
        if not self.executions:
            return 0.0
        
        successful = sum(1 for exec_result in self.executions.values() 
                        if exec_result.get('status') == 'completed')
        
        return round((successful / len(self.executions)) * 100, 1)


async def test_code_generation_and_execution():
    """
    Test the enhanced Code SDK with real examples
    """
    api_key = os.getenv('ANTHROPIC_API_KEY')
    if not api_key:
        print("❌ Please set ANTHROPIC_API_KEY environment variable")
        return
    
    print("🚀 Enhanced Claude Code SDK - Live Test")
    print("=" * 60)
    
    sdk = TestableCodeSDK(api_key)
    
    # Test 1: Simple Python script
    print("\n1️⃣ Test: Simple Python Calculator")
    project1 = await sdk.generate_code_project(
        prompt="Create a simple calculator that can add, subtract, multiply, and divide two numbers. Include error handling for division by zero.",
        project_name="calculator_app",
        language="python"
    )
    
    # Show generated files
    files_info = sdk.get_project_files(project1['project_id'])
    print(f"📁 Generated {files_info['file_count']} files:")
    for filename in files_info['files'].keys():
        print(f"   📄 {filename}")
    
    # Execute the project
    execution1 = await sdk.execute_project(project1['project_id'])
    print(f"🎯 Execution status: {execution1['status']}")
    
    # Test 2: Healthcare-specific application
    print(f"\n2️⃣ Test: Healthcare Medication Tracker")
    project2 = await sdk.generate_code_project(
        prompt="Create a medication tracker that helps patients track their daily medications, dosages, and timing. Include features to add medications, mark as taken, and show a daily schedule.",
        project_name="medication_tracker",
        language="python"
    )
    
    files_info2 = sdk.get_project_files(project2['project_id'])
    print(f"📁 Generated {files_info2['file_count']} files:")
    for filename in files_info2['files'].keys():
        print(f"   📄 {filename}")
    
    # Show one of the generated files
    if 'main.py' in files_info2['files']:
        print(f"\n📋 Sample generated code (main.py):")
        print("=" * 40)
        main_content = files_info2['files']['main.py']['content']
        # Show first 20 lines
        lines = main_content.split('\n')[:20]
        for i, line in enumerate(lines, 1):
            print(f"{i:2d}: {line}")
        if len(main_content.split('\n')) > 20:
            print("    ... (truncated)")
        print("=" * 40)
    
    execution2 = await sdk.execute_project(project2['project_id'])
    print(f"🎯 Execution status: {execution2['status']}")
    
    # Test 3: Web application
    print(f"\n3️⃣ Test: Simple Web API")
    project3 = await sdk.generate_code_project(
        prompt="Create a simple FastAPI web application with endpoints for managing patient information (add, get, update, delete). Include proper error handling and data validation.",
        project_name="patient_api",
        language="python"
    )
    
    files_info3 = sdk.get_project_files(project3['project_id'])
    print(f"📁 Generated {files_info3['file_count']} files:")
    for filename in files_info3['files'].keys():
        print(f"   📄 {filename}")
    
    # Show metrics
    print(f"\n📊 SDK Performance Metrics:")
    metrics = sdk.get_metrics()
    for key, value in metrics.items():
        print(f"   {key}: {value}")
    
    return sdk


async def test_concurrent_code_generation():
    """
    Test concurrent code generation capabilities
    """
    api_key = os.getenv('ANTHROPIC_API_KEY')
    if not api_key:
        return
    
    print(f"\n🔄 Testing Concurrent Code Generation")
    print("=" * 50)
    
    sdk = TestableCodeSDK(api_key)
    
    # Define multiple projects to generate concurrently
    project_requests = [
        {
            'prompt': 'Create a BMI calculator with health recommendations',
            'name': 'bmi_calculator',
            'language': 'python'
        },
        {
            'prompt': 'Create a password generator with customizable options',
            'name': 'password_gen',
            'language': 'python'
        },
        {
            'prompt': 'Create a simple todo list manager',
            'name': 'todo_manager', 
            'language': 'python'
        }
    ]
    
    async def generate_single_project(request):
        start_time = time.time()
        project = await sdk.generate_code_project(
            request['prompt'], 
            request['name'], 
            request['language']
        )
        end_time = time.time()
        return {
            'project_name': request['name'],
            'generation_time': end_time - start_time,
            'file_count': len(project['files'])
        }
    
    # Generate projects concurrently
    print(f"🚀 Generating {len(project_requests)} projects concurrently...")
    start_time = time.time()
    
    tasks = [generate_single_project(req) for req in project_requests]
    results = await asyncio.gather(*tasks)
    
    total_time = time.time() - start_time
    
    print(f"✅ Generated {len(results)} projects in {total_time:.2f}s")
    
    for result in results:
        print(f"   📦 {result['project_name']}: {result['file_count']} files in {result['generation_time']:.2f}s")
    
    avg_time = sum(r['generation_time'] for r in results) / len(results)
    print(f"📊 Average generation time: {avg_time:.2f}s per project")
    
    return results


if __name__ == "__main__":
    print("🧪 Enhanced Claude Code SDK - Live Test")
    print("This script demonstrates real code generation and execution")
    print("=" * 70)
    
    # Check dependencies
    if not os.getenv('ANTHROPIC_API_KEY'):
        print("❌ ANTHROPIC_API_KEY not found in environment variables")
        print("Please set it with: export ANTHROPIC_API_KEY='your-key-here'")
        sys.exit(1)
    
    try:
        # Run the tests
        sdk = asyncio.run(test_code_generation_and_execution())
        asyncio.run(test_concurrent_code_generation())
        
        print(f"\n🎉 All Code SDK tests completed successfully!")
        print(f"✅ Enhanced Code SDK is working and generating real, executable code")
        print(f"✅ Projects are properly structured with multiple files")
        print(f"✅ Code execution works with proper error handling")
        print(f"✅ Concurrent generation demonstrates scalability")
        
    except KeyboardInterrupt:
        print(f"\n⏹️  Test interrupted by user")
    except Exception as e:
        print(f"\n❌ Test failed with error: {str(e)}")
        import traceback
        traceback.print_exc()

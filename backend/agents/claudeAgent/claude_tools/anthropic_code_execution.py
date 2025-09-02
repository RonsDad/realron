"""
Anthropic Code Execution Module
Simple wrapper for Anthropic's official code execution tool
"""

import os
import logging
from typing import Any, Dict, List, Optional
from anthropic import Anthropic
import asyncio
from datetime import datetime

logger = logging.getLogger(__name__)


async def clear_executor_sessions():
    """Clear any executor sessions (currently stateless, so this is a no-op)"""
    logger.info("Anthropic code executor is stateless - no sessions to clear")
    pass


class AnthropicCodeExecutor:
    """Simple wrapper for Anthropic's official code execution tool"""
    
    def __init__(self):
        """Initialize the Anthropic client with API key"""
        api_key = os.getenv('ANTHROPIC_API_KEY')
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY environment variable is not set")
        
        self.client = Anthropic(api_key=api_key)
        self.model = "claude-opus-4-20250514"
        
    def extract_execution_results(self, response) -> Dict[str, Any]:
        """
        Extract execution results from the code execution tool response
        
        Args:
            response: The response from Anthropic's code execution tool
            
        Returns:
            Dictionary with stdout, stderr, return_code, and any files
        """
        results = {
            "stdout": "",
            "stderr": "",
            "return_code": 0,
            "files": []
        }
        
        try:
            for content_block in response.content:
                if hasattr(content_block, 'type'):
                    if content_block.type == 'tool_result':
                        # This is the tool result from code execution
                        if hasattr(content_block, 'content'):
                            for result_item in content_block.content:
                                if hasattr(result_item, 'type'):
                                    if result_item.type == 'code_execution_result':
                                        results["stdout"] = getattr(result_item, 'stdout', '')
                                        results["stderr"] = getattr(result_item, 'stderr', '')
                                        results["return_code"] = getattr(result_item, 'return_code', 0)
                    elif content_block.type == 'text':
                        # Regular text response
                        results["stdout"] += content_block.text
        except Exception as e:
            logger.error(f"Error extracting execution results: {str(e)}")
        
        return results
    
    async def execute_code_with_files(
        self, 
        code: str, 
        language: str = "python",
        create_files: bool = True,
        download_files: bool = False,
        output_dir: str = "./code_output"
    ) -> Dict[str, Any]:
        """
        Execute code using Anthropic's official code execution tool
        
        Args:
            code: The code to execute
            language: Programming language (only python supported)
            create_files: Whether to allow file creation (always enabled with code execution)
            download_files: Whether to download created files (not implemented)
            output_dir: Directory to save downloaded files (not used)
            
        Returns:
            Dictionary containing execution results
        """
        try:
            logger.info(f"Executing {language} code using official Anthropic code execution tool")
            
            # Use the official code execution tool
            response = await asyncio.to_thread(
                self.client.beta.messages.create,
                model=self.model,
                betas=["code-execution-2025-05-22"],
                max_tokens=4096,
                messages=[{
                    "role": "user",
                    "content": f"Execute this code:\n\n```python\n{code}\n```"
                }],
                tools=[{
                    "type": "code_execution_20250522",
                    "name": "code_execution"
                }]
            )
            
            # Extract results using the proper method
            execution_results = self.extract_execution_results(response)
            
            # Format the result
            result = {
                "success": execution_results["return_code"] == 0,
                "language": language,
                "executed_at": datetime.utcnow().isoformat(),
                "output": execution_results["stdout"],
                "stderr": execution_results["stderr"],
                "return_code": execution_results["return_code"],
                "files_created": [],
                "files_downloaded": [],
                "error": execution_results["stderr"] if execution_results["return_code"] != 0 else None
            }
            
            # Extract any assistant text response
            assistant_text = ""
            for content_block in response.content:
                if hasattr(content_block, 'type') and content_block.type == 'text':
                    assistant_text += content_block.text
            
            if assistant_text:
                result["assistant_response"] = assistant_text
            
            logger.info(f"Code execution completed with return code: {execution_results['return_code']}")
            return result
            
        except Exception as e:
            logger.error(f"Code execution failed: {str(e)}")
            return {
                "success": False,
                "language": language,
                "executed_at": datetime.utcnow().isoformat(),
                "output": "",
                "stderr": str(e),
                "return_code": 1,
                "files_created": [],
                "files_downloaded": [],
                "error": str(e)
            }
    
    async def execute_matplotlib_visualization(
        self, 
        plot_code: str,
        filename: str = "visualization.png"
    ) -> Dict[str, Any]:
        """
        Execute matplotlib visualization code
        
        Args:
            plot_code: The matplotlib code to execute
            filename: Output filename for the plot
            
        Returns:
            Dictionary containing execution results
        """
        return await self.execute_code_with_files(
            code=plot_code,
            language="python"
        )


# Singleton instance
_executor_instance = None


def get_code_executor() -> AnthropicCodeExecutor:
    """Get or create the singleton code executor instance"""
    global _executor_instance
    if _executor_instance is None:
        _executor_instance = AnthropicCodeExecutor()
    return _executor_instance


# Convenience functions for direct use
async def execute_code(
    code: str,
    language: str = "python",
    create_files: bool = False,
    download_files: bool = False
) -> Dict[str, Any]:
    """
    Execute code using Anthropic's code execution tool
    
    Args:
        code: The code to execute
        language: Programming language (only python supported)
        create_files: Ignored (always enabled)
        download_files: Ignored (not supported)
        
    Returns:
        Execution results dictionary
    """
    executor = get_code_executor()
    return await executor.execute_code_with_files(
        code=code,
        language=language
    )


async def create_visualization(
    plot_code: str,
    filename: str = "visualization.png"
) -> Dict[str, Any]:
    """
    Execute matplotlib code for data visualization
    
    Args:
        plot_code: The matplotlib plotting code
        filename: Output filename (informational only)
        
    Returns:
        Execution results
    """
    executor = get_code_executor()
    return await executor.execute_matplotlib_visualization(
        plot_code=plot_code,
        filename=filename
    )
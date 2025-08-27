"""
Anthropic Code Execution and File Handling Module
Implements code execution with file creation/download capabilities using Anthropic's beta APIs
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
    """Handles code execution and file operations using Anthropic's beta APIs"""
    
    def __init__(self):
        """Initialize the Anthropic client with API key"""
        api_key = os.getenv('ANTHROPIC_API_KEY')
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY environment variable is not set")
        
        self.client = Anthropic(api_key=api_key)
        self.model = "claude-opus-4-20250514"  # Using the project's configured model
        
    def extract_file_ids(self, response) -> List[str]:
        """
        Extract file IDs from the code execution response
        
        Args:
            response: The response from Anthropic's code execution
            
        Returns:
            List of file IDs
        """
        file_ids = []
        for item in response.content:
            if item.type == 'code_execution_tool_result':
                content_item = item.content
                if content_item.get('type') == 'code_execution_result':
                    for file in content_item.get('content', []):
                        file_ids.append(file['file_id'])
        return file_ids
    
    async def execute_code_with_files(
        self, 
        code: str, 
        language: str = "python",
        create_files: bool = True,
        download_files: bool = True,
        output_dir: str = "./code_output"
    ) -> Dict[str, Any]:
        """
        Execute code using Anthropic's code execution API with file handling
        
        Args:
            code: The code to execute
            language: Programming language (default: python)
            create_files: Whether to allow file creation
            download_files: Whether to download created files
            output_dir: Directory to save downloaded files
            
        Returns:
            Dictionary containing execution results and file information
        """
        try:
            # Just pass the code directly - the tool will handle file creation automatically
            logger.info(f"Executing {language} code with file creation: {create_files}")
            
            # Request code execution with both beta features
            response = await asyncio.to_thread(
                self.client.beta.messages.create,
                model=self.model,
                betas=["code-execution-2025-05-22", "files-api-2025-04-14"],
                max_tokens=4096,
                messages=[{
                    "role": "user",
                    "content": code  # Pass code directly
                }],
                tools=[{
                    "type": "code_execution_20250522",
                    "name": "code_execution"
                }]
            )
            
            # Debug the response structure
            logger.debug(f"Response type: {type(response)}")
            if hasattr(response, 'content'):
                logger.debug(f"Response content items: {len(response.content)}")
                for i, item in enumerate(response.content):
                    logger.debug(f"Content[{i}] type: {getattr(item, 'type', 'unknown')}")
            
            # Extract execution results
            result = {
                "success": True,
                "language": language,
                "executed_at": datetime.utcnow().isoformat(),
                "output": "",
                "files_created": [],
                "files_downloaded": [],
                "error": None
            }
            
            # Process response content
            for item in response.content:
                if hasattr(item, 'text'):
                    result["output"] += item.text + "\n"
            
            # Extract and handle files if requested
            if create_files:
                file_ids = self.extract_file_ids(response)
                result["files_created"] = file_ids
                
                if download_files and file_ids:
                    # Create output directory if it doesn't exist
                    os.makedirs(output_dir, exist_ok=True)
                    
                    # Download each file
                    for file_id in file_ids:
                        try:
                            file_info = await self._download_file(file_id, output_dir)
                            result["files_downloaded"].append(file_info)
                        except Exception as e:
                            logger.error(f"Failed to download file {file_id}: {str(e)}")
            
            logger.info(f"Code execution completed. Files created: {len(result['files_created'])}")
            return result
            
        except Exception as e:
            logger.error(f"Code execution failed: {str(e)}")
            return {
                "success": False,
                "language": language,
                "executed_at": datetime.utcnow().isoformat(),
                "output": "",
                "files_created": [],
                "files_downloaded": [],
                "error": str(e)
            }
    
    async def _download_file(self, file_id: str, output_dir: str) -> Dict[str, Any]:
        """
        Download a file created by code execution
        
        Args:
            file_id: The ID of the file to download
            output_dir: Directory to save the file
            
        Returns:
            Dictionary with file information
        """
        # Get file metadata
        file_metadata = await asyncio.to_thread(
            self.client.beta.files.retrieve_metadata,
            file_id
        )
        
        # Download file content
        file_content = await asyncio.to_thread(
            self.client.beta.files.download,
            file_id
        )
        
        # Save file to disk
        file_path = os.path.join(output_dir, file_metadata.filename)
        file_content.write_to_file(file_path)
        
        logger.info(f"Downloaded file: {file_metadata.filename} to {file_path}")
        
        return {
            "file_id": file_id,
            "filename": file_metadata.filename,
            "path": file_path,
            "size": os.path.getsize(file_path) if os.path.exists(file_path) else 0
        }
    
    async def execute_matplotlib_visualization(
        self, 
        plot_code: str,
        filename: str = "output.png",
        output_dir: str = "./visualizations"
    ) -> Dict[str, Any]:
        """
        Execute matplotlib visualization code and save the plot
        
        Args:
            plot_code: The matplotlib code to execute
            filename: Output filename for the plot
            output_dir: Directory to save the plot
            
        Returns:
            Dictionary containing execution results and file information
        """
        # Wrap the code to ensure it saves the plot
        wrapped_code = f"""
import matplotlib.pyplot as plt
import numpy as np

# User code
{plot_code}

# Save the plot
plt.savefig('{filename}', dpi=300, bbox_inches='tight')
plt.close()
print(f"Plot saved as {filename}")
"""
        
        return await self.execute_code_with_files(
            code=wrapped_code,
            language="python",
            create_files=True,
            download_files=True,
            output_dir=output_dir
        )
    
    async def execute_data_analysis(
        self,
        analysis_code: str,
        output_format: str = "csv",
        output_dir: str = "./analysis_output"
    ) -> Dict[str, Any]:
        """
        Execute data analysis code and save results
        
        Args:
            analysis_code: The data analysis code to execute
            output_format: Output format (csv, json, xlsx)
            output_dir: Directory to save results
            
        Returns:
            Dictionary containing execution results and file information
        """
        # Add appropriate save logic based on format
        save_code = {
            "csv": "df.to_csv('analysis_results.csv', index=False)",
            "json": "df.to_json('analysis_results.json', orient='records', indent=2)",
            "xlsx": "df.to_excel('analysis_results.xlsx', index=False)"
        }.get(output_format, "df.to_csv('analysis_results.csv', index=False)")
        
        wrapped_code = f"""
import pandas as pd
import numpy as np

# User analysis code
{analysis_code}

# Save results
{save_code}
print(f"Analysis results saved as analysis_results.{output_format}")
"""
        
        return await self.execute_code_with_files(
            code=wrapped_code,
            language="python",
            create_files=True,
            download_files=True,
            output_dir=output_dir
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
    Execute code with optional file handling
    
    Args:
        code: The code to execute
        language: Programming language
        create_files: Whether to allow file creation
        download_files: Whether to download created files
        
    Returns:
        Execution results dictionary
    """
    executor = get_code_executor()
    return await executor.execute_code_with_files(
        code=code,
        language=language,
        create_files=create_files,
        download_files=download_files
    )


async def create_visualization(
    plot_code: str,
    filename: str = "visualization.png"
) -> Dict[str, Any]:
    """
    Create a matplotlib visualization and save it
    
    Args:
        plot_code: The matplotlib plotting code
        filename: Output filename
        
    Returns:
        Execution results with file information
    """
    executor = get_code_executor()
    return await executor.execute_matplotlib_visualization(
        plot_code=plot_code,
        filename=filename
    )


async def analyze_data(
    analysis_code: str,
    output_format: str = "csv"
) -> Dict[str, Any]:
    """
    Execute data analysis code and save results
    
    Args:
        analysis_code: The analysis code
        output_format: Output format (csv, json, xlsx)
        
    Returns:
        Execution results with file information
    """
    executor = get_code_executor()
    return await executor.execute_data_analysis(
        analysis_code=analysis_code,
        output_format=output_format
    )
"""
Tool Format Standardizer for Anthropic SDK
Ensures all tools use the proper input_schema format
"""

import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)

class ToolFormatStandardizer:
    """Standardizes tool definitions to Anthropic's expected format"""
    
    @staticmethod
    def convert_to_anthropic_format(tool_def: Dict[str, Any]) -> Dict[str, Any]:
        """
        Convert any tool definition to Anthropic's standard format.
        
        Expected Anthropic format:
        {
            "name": "tool_name",
            "description": "Tool description",
            "input_schema": {
                "type": "object",
                "properties": {
                    "param1": {"type": "string", "description": "..."},
                    "param2": {"type": "number", "description": "..."}
                },
                "required": ["param1"]
            }
        }
        """
        # Start with basic structure
        standardized = {
            "name": tool_def.get("name", ""),
            "description": tool_def.get("description", ""),
        }
        
        # Handle different parameter formats
        if "input_schema" in tool_def:
            # Already has input_schema - validate and use
            standardized["input_schema"] = ToolFormatStandardizer._validate_input_schema(
                tool_def["input_schema"]
            )
        elif "parameters" in tool_def:
            # Has parameters - convert to input_schema
            params = tool_def["parameters"]
            
            # Check if parameters is already in JSON Schema format
            if isinstance(params, dict) and params.get("type") == "object":
                # It's already a valid JSON Schema
                standardized["input_schema"] = params
            else:
                # It's the old format - convert it
                standardized["input_schema"] = ToolFormatStandardizer._convert_old_format(params)
        else:
            # No parameters - create empty schema
            standardized["input_schema"] = {
                "type": "object",
                "properties": {},
                "required": []
            }
        
        # Add cache_control if specified
        if "cache_control" in tool_def:
            standardized["cache_control"] = tool_def["cache_control"]
        
        return standardized
    
    @staticmethod
    def _validate_input_schema(schema: Dict[str, Any]) -> Dict[str, Any]:
        """Validate and fix input_schema structure"""
        validated = {
            "type": schema.get("type", "object")
        }
        
        # Ensure we have properties dict
        if "properties" not in schema:
            validated["properties"] = {}
        else:
            validated["properties"] = schema["properties"]
        
        # Ensure we have required list
        if "required" in schema:
            if isinstance(schema["required"], list):
                validated["required"] = schema["required"]
            else:
                validated["required"] = []
        else:
            validated["required"] = []
        
        # Copy any additional fields (like additionalProperties)
        for key in ["additionalProperties", "minProperties", "maxProperties"]:
            if key in schema:
                validated[key] = schema[key]
        
        return validated
    
    @staticmethod
    def _convert_old_format(params: Dict[str, Any]) -> Dict[str, Any]:
        """Convert old parameter format to input_schema"""
        schema = {
            "type": "object",
            "properties": {},
            "required": []
        }
        
        for param_name, param_info in params.items():
            # Build property definition
            prop = {
                "type": param_info.get("type", "string"),
                "description": param_info.get("description", "")
            }
            
            # Add default if present
            if "default" in param_info:
                prop["default"] = param_info["default"]
            
            # Add enum if present
            if "enum" in param_info:
                prop["enum"] = param_info["enum"]
            
            # Add format if present
            if "format" in param_info:
                prop["format"] = param_info["format"]
            
            # Handle nested objects
            if prop["type"] == "object" and "properties" in param_info:
                prop["properties"] = param_info["properties"]
                if "required" in param_info:
                    prop["required"] = param_info["required"]
            
            # Handle arrays
            if prop["type"] == "array" and "items" in param_info:
                prop["items"] = param_info["items"]
            
            schema["properties"][param_name] = prop
            
            # Add to required if specified
            if param_info.get("required", False):
                schema["required"].append(param_name)
        
        return schema
    
    @staticmethod
    def standardize_tool_list(tools: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Standardize a list of tool definitions"""
        standardized = []
        
        for tool in tools:
            try:
                std_tool = ToolFormatStandardizer.convert_to_anthropic_format(tool)
                standardized.append(std_tool)
            except Exception as e:
                logger.error(f"Error standardizing tool {tool.get('name', 'unknown')}: {e}")
                # Skip tools that can't be standardized
                continue
        
        return standardized
    
    @staticmethod
    def validate_tool_definition(tool: Dict[str, Any]) -> tuple[bool, Optional[str]]:
        """
        Validate a tool definition for Anthropic compatibility.
        
        Returns:
            Tuple of (is_valid, error_message)
        """
        # Check required fields
        if "name" not in tool:
            return False, "Tool missing 'name' field"
        
        if "description" not in tool:
            return False, "Tool missing 'description' field"
        
        if "input_schema" not in tool:
            return False, "Tool missing 'input_schema' field"
        
        # Validate input_schema structure
        schema = tool["input_schema"]
        
        if not isinstance(schema, dict):
            return False, "input_schema must be a dictionary"
        
        if schema.get("type") != "object":
            return False, "input_schema type must be 'object'"
        
        if "properties" not in schema:
            return False, "input_schema missing 'properties' field"
        
        if not isinstance(schema["properties"], dict):
            return False, "input_schema properties must be a dictionary"
        
        # Validate required field if present
        if "required" in schema:
            if not isinstance(schema["required"], list):
                return False, "input_schema 'required' must be a list"
            
            # Check that all required fields exist in properties
            for req_field in schema["required"]:
                if req_field not in schema["properties"]:
                    return False, f"Required field '{req_field}' not in properties"
        
        return True, None

def standardize_tools_for_claude(tools: List[Dict[str, Any]], 
                                add_cache_control: bool = True) -> List[Dict[str, Any]]:
    """
    Main function to standardize tools for Claude.
    
    Args:
        tools: List of tool definitions in any format
        add_cache_control: Whether to add cache_control to the last tool
    
    Returns:
        List of standardized tool definitions
    """
    standardizer = ToolFormatStandardizer()
    standardized = standardizer.standardize_tool_list(tools)
    
    # Add cache control to last tool for optimization
    if add_cache_control and standardized:
        standardized[-1]["cache_control"] = {"type": "ephemeral"}
    
    return standardized
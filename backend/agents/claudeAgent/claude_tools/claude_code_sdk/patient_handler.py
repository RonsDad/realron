"""
Patient Request Handler
Main entry point for processing patient tool requests
"""

import asyncio
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime

from .intent_classifier import intent_classifier, Intent
from .context_extractor import context_extractor, PatientContext
from .template_library import template_library
from .tool_generator import tool_generator
from .claude_code_sdk_browserless import claude_code_sdk_browserless

logger = logging.getLogger(__name__)


class PatientRequestHandler:
    """Handles patient requests for healthcare tools"""
    
    def __init__(self):
        self.intent_classifier = intent_classifier
        self.context_extractor = context_extractor
        self.template_library = template_library
        self.tool_generator = tool_generator
        self.browserless = claude_code_sdk_browserless
    
    async def handle_request(
        self, 
        message: str,
        patient_id: str,
        patient_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Handle a patient request for a healthcare tool
        
        Args:
            message: The patient's request
            patient_id: Patient identifier
            patient_data: Optional patient data
            
        Returns:
            Response with tool generation results
        """
        try:
            # 1. Extract context
            context = await self.context_extractor.extract(
                message=message,
                patient_id=patient_id,
                patient_data=patient_data
            )
            
            # 2. Classify intent
            intent = await self.intent_classifier.classify(message)
            
            logger.info(f"Classified intent: {intent.tool_type} (confidence: {intent.confidence})")
            
            # 3. Prepare context for tool generation
            tool_context = self._prepare_tool_context(intent, context, message)
            
            # 4. Generate tool
            if self.should_use_claude_code(intent):
                # Use Claude Code SDK for complex tools
                result = await self._generate_with_claude_code(intent, tool_context)
            else:
                # Use template for simple tools
                result = await self._generate_from_template(intent, tool_context)
            
            # 5. Create LiveURL preview if successful
            if result.get("success") and result.get("html"):
                preview_result = await self._create_preview(result["html"], result["tool_name"])
                if preview_result.get("success"):
                    result["live_url"] = preview_result["live_url"]
                    result["session_id"] = preview_result["session_id"]
            
            return result
            
        except Exception as e:
            logger.error(f"Error handling request: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "message": "I'm having trouble creating your tool. Please try again."
            }
    
    def _prepare_tool_context(
        self, 
        intent: Intent, 
        context: PatientContext,
        original_message: str
    ) -> Dict[str, Any]:
        """Prepare context for tool generation"""
        context_dict = self.context_extractor.to_context_dict(context)
        
        # Add intent-specific information
        context_dict.update({
            "tool_type": self.intent_classifier.get_intent_description(intent.tool_type),
            "template_type": intent.suggested_template,
            "original_request": original_message,
            "intent_confidence": intent.confidence,
            "keywords_matched": intent.keywords_matched
        })
        
        return context_dict
    
    def should_use_claude_code(self, intent: Intent) -> bool:
        """
        Determine if Claude Code SDK should be used
        
        Use Claude Code for:
        - High complexity requests
        - Custom requirements
        - Low template confidence
        """
        # For now, use templates for common tools with high confidence
        template_suitable = intent.tool_type in [
            "medication_tracker", 
            "symptom_diary",
            "appointment_prep",
            "cost_calculator"
        ]
        
        return not (template_suitable and intent.confidence > 0.7)
    
    async def _generate_with_claude_code(
        self, 
        intent: Intent,
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate tool using Claude Code SDK"""
        if not self.tool_generator:
            # Fallback if SDK not available
            return await self._generate_from_template(intent, context)
        
        logger.info(f"Generating {intent.tool_type} with Claude Code SDK")
        
        result = await self.tool_generator.generate_tool(
            intent=context["original_request"],
            context=context
        )
        
        return result
    
    async def _generate_from_template(
        self, 
        intent: Intent,
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate tool from template library"""
        logger.info(f"Generating {intent.tool_type} from template")
        
        try:
            html = self.template_library.generate_tool(
                template_type=intent.suggested_template,
                context=context
            )
            
            return {
                "success": True,
                "tool_name": context["tool_type"],
                "html": html,
                "template_used": intent.suggested_template,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Template generation failed: {str(e)}")
            raise
    
    async def _create_preview(self, html: str, tool_name: str) -> Dict[str, Any]:
        """Create LiveURL preview for the tool"""
        try:
            result = await self.browserless.create_browser_ccsdk(
                tool_html=html,
                tool_name=tool_name
            )
            return result
        except Exception as e:
            logger.error(f"Failed to create preview: {str(e)}")
            return {"success": False, "error": str(e)}
    
    def get_available_tools(self) -> List[Dict[str, str]]:
        """Get list of available tool types"""
        tools = []
        for template_key in self.template_library.get_available_templates():
            template = self.template_library.get_template(template_key)
            tools.append({
                "key": template_key,
                "name": template["name"],
                "description": template["description"],
                "category": template["category"]
            })
        return tools


# Global instance
patient_request_handler = PatientRequestHandler()
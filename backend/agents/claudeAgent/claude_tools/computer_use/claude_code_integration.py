#!/usr/bin/env python3
"""
Claude Code SDK Integration with Interleaved Thinking
Combines Claude Code CLI capabilities with computer use for healthcare tool generation
"""

import asyncio
import json
import logging
import os
from typing import Dict, List, Any, Optional
from datetime import datetime

from interleaved_agent import InterleavedThinkingAgent

logger = logging.getLogger(__name__)

class ClaudeCodeInterleavedAgent(InterleavedThinkingAgent):
    """Extended agent that integrates Claude Code SDK with computer use"""
    
    def __init__(self, api_key: Optional[str] = None):
        super().__init__(api_key)
        self.claude_code_ready = False
        self.browserless_url = os.getenv("BROWSERLESS_URL", "http://localhost:3000")
        self.mongodb_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017/")
        
    async def setup_claude_code_environment(self) -> bool:
        """Ensure Claude Code CLI is installed and configured"""
        
        messages = [{
            "role": "user",
            "content": """First, take a screenshot to see the desktop. Then check if Claude Code CLI 
            is installed by running 'claude --version' in the terminal. If it's not installed, 
            install it with 'npm install -g @anthropic/claude-code'."""
        }]
        
        try:
            result = await self.interleaved_thinking_loop(messages, max_iterations=5)
            
            # Check if installation was successful
            for msg in result:
                if msg.get("role") == "assistant":
                    content = str(msg.get("content", ""))
                    if "claude" in content.lower() and "version" in content.lower():
                        self.claude_code_ready = True
                        logger.info("Claude Code CLI is ready")
                        return True
            
            return False
            
        except Exception as e:
            logger.error(f"Failed to setup Claude Code: {str(e)}")
            return False
    
    async def generate_healthcare_tool(
        self,
        tool_type: str,
        patient_context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate a healthcare tool using Claude Code SDK with computer use"""
        
        # Ensure Claude Code is ready
        if not self.claude_code_ready:
            await self.setup_claude_code_environment()
        
        # Prepare the generation prompt
        prompt = self._build_tool_prompt(tool_type, patient_context)
        
        messages = [{
            "role": "user",
            "content": f"""Using the Claude Code CLI, create a {tool_type} healthcare tool with the following context:
            
{json.dumps(patient_context, indent=2)}

Steps:
1. Take a screenshot to see current state
2. Open terminal if not already open
3. Navigate to ~/claude-projects
4. Create a new directory for this tool: {tool_type}_{datetime.now().strftime('%Y%m%d_%H%M%S')}
5. Use Claude Code CLI to generate the tool: claude -p "{prompt}"
6. Take a screenshot of the generated tool
7. If it's a web tool, start a simple server and open it in browser
8. Take a final screenshot of the running tool

Remember to think between each step about what you're seeing and what to do next."""
        }]
        
        try:
            # Execute with interleaved thinking
            result = await self.interleaved_thinking_loop(messages, max_iterations=15)
            
            # Extract tool information from results
            tool_info = await self._extract_tool_info(result)
            
            # Save to MongoDB if configured
            if self.mongodb_url:
                await self._save_to_mongodb(tool_info)
            
            return tool_info
            
        except Exception as e:
            logger.error(f"Tool generation failed: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "tool_type": tool_type
            }
    
    def _build_tool_prompt(self, tool_type: str, context: Dict[str, Any]) -> str:
        """Build appropriate prompt for Claude Code based on tool type"""
        
        prompts = {
            "medication_tracker": f"""Create a medication tracker web application with:
- Patient name: {context.get('patient_name', 'Patient')}
- Medications: {json.dumps(context.get('medications', []))}
- Features: dosage tracking, reminder times, refill alerts
- Mobile-responsive design
- Local storage for data persistence
- Simple, accessible UI for elderly patients""",
            
            "cost_calculator": f"""Create a healthcare cost calculator tool with:
- Procedure: {context.get('procedure', 'General')}
- Insurance plan: {context.get('insurance', 'Standard')}
- Location: {context.get('location', 'USA')}
- Features: deductible calculation, out-of-pocket estimates, payment plans
- Clear breakdown of costs
- Printable summary""",
            
            "educational_guide": f"""Create an educational health guide about:
- Condition: {context.get('condition', 'General Health')}
- Patient age: {context.get('age', 'Adult')}
- Features: easy-to-understand content, visual aids, symptom checker
- Interactive elements
- Resources and references
- Print-friendly version""",
            
            "appointment_scheduler": f"""Create an appointment scheduling tool with:
- Provider types: {json.dumps(context.get('providers', ['General']))}
- Patient ID: {context.get('patient_id', 'anonymous')}
- Features: calendar view, reminder setup, provider search
- Integration ready for EHR systems
- Accessible design""",
            
            "symptom_diary": f"""Create a symptom tracking diary with:
- Condition focus: {context.get('condition', 'General')}
- Tracking period: {context.get('period', 'Daily')}
- Features: pain scale, mood tracking, medication correlation
- Visual charts and trends
- Export functionality for doctors""",
            
            "insurance_navigator": f"""Create an insurance navigation tool with:
- Plan type: {context.get('plan_type', 'PPO')}
- Coverage year: {context.get('year', '2024')}
- Features: benefit lookup, claim status, provider network search
- Cost estimator
- Document upload for claims"""
        }
        
        return prompts.get(tool_type, f"Create a healthcare {tool_type} tool with features: {json.dumps(context)}")
    
    async def _extract_tool_info(self, conversation: List[Dict]) -> Dict[str, Any]:
        """Extract generated tool information from conversation"""
        
        tool_info = {
            "success": True,
            "timestamp": datetime.now().isoformat(),
            "conversation": conversation,
            "screenshots": [],
            "files_created": [],
            "tool_url": None
        }
        
        # Extract screenshots and file paths from conversation
        for msg in conversation:
            if msg.get("role") == "user" and isinstance(msg.get("content"), list):
                for item in msg["content"]:
                    if isinstance(item, dict) and item.get("type") == "tool_result":
                        content = item.get("content", "")
                        
                        # Check for screenshots
                        if "data:image" in content:
                            tool_info["screenshots"].append(content)
                        
                        # Check for file creation
                        if "Created file:" in content or "Created directory:" in content:
                            tool_info["files_created"].append(content)
                        
                        # Check for server URL
                        if "http://localhost" in content:
                            import re
                            urls = re.findall(r'http://localhost:\d+', content)
                            if urls:
                                tool_info["tool_url"] = urls[0]
        
        return tool_info
    
    async def _save_to_mongodb(self, tool_info: Dict[str, Any]) -> None:
        """Save tool generation info to MongoDB"""
        try:
            from pymongo import MongoClient
            client = MongoClient(self.mongodb_url)
            db = client.claude_tools
            collection = db.generated_tools
            
            # Remove large screenshot data for storage
            stored_info = tool_info.copy()
            stored_info["screenshot_count"] = len(tool_info.get("screenshots", []))
            stored_info["screenshots"] = []  # Don't store full images in DB
            
            result = collection.insert_one(stored_info)
            logger.info(f"Saved tool info to MongoDB: {result.inserted_id}")
            
        except Exception as e:
            logger.error(f"MongoDB save failed: {str(e)}")
    
    async def deploy_to_browserless(
        self,
        tool_path: str,
        live_url: Optional[str] = None
    ) -> Dict[str, Any]:
        """Deploy generated tool to browserless with live URL"""
        
        messages = [{
            "role": "user",
            "content": f"""Deploy the healthcare tool to browserless:
            
1. Take a screenshot of current state
2. Open the tool located at: {tool_path}
3. If it's a static HTML file, open it directly in browser
4. If it needs a server, start one with 'python -m http.server 8080'
5. Navigate browser to the tool
6. Take screenshot of the running tool
7. The tool will be accessible at: {live_url or 'http://localhost:8080'}"""
        }]
        
        try:
            result = await self.interleaved_thinking_loop(messages, max_iterations=8)
            
            return {
                "success": True,
                "live_url": live_url,
                "deployment_time": datetime.now().isoformat(),
                "screenshots": await self._extract_tool_info(result)["screenshots"]
            }
            
        except Exception as e:
            logger.error(f"Browserless deployment failed: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def create_mcp_integration(
        self,
        tool_name: str,
        tool_config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Create MCP (Model Context Protocol) integration for the tool"""
        
        mcp_config = {
            "name": tool_name,
            "description": f"Healthcare tool: {tool_name}",
            "server": {
                "command": "node",
                "args": [f"~/claude-projects/{tool_name}/mcp-server.js"]
            },
            "tools": tool_config.get("exposed_functions", [])
        }
        
        messages = [{
            "role": "user",
            "content": f"""Create an MCP server configuration for the healthcare tool:
            
1. Navigate to the tool directory: ~/claude-projects/{tool_name}
2. Create mcp-server.js with the following configuration:
{json.dumps(mcp_config, indent=2)}

3. Install required dependencies: npm install @modelcontextprotocol/server
4. Test the MCP server
5. Take screenshot of the working configuration"""
        }]
        
        try:
            result = await self.interleaved_thinking_loop(messages, max_iterations=10)
            
            return {
                "success": True,
                "mcp_config": mcp_config,
                "setup_complete": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"MCP integration failed: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }


# Example healthcare tool workflows
class HealthcareWorkflows:
    """Example workflows demonstrating interleaved thinking for healthcare tools"""
    
    @staticmethod
    async def medication_tracker_workflow():
        """Complete workflow for generating a medication tracker"""
        
        agent = ClaudeCodeInterleavedAgent()
        
        # Patient context
        patient_context = {
            "patient_name": "John Doe",
            "medications": [
                {"name": "Metformin", "dosage": "500mg", "frequency": "2x daily"},
                {"name": "Lisinopril", "dosage": "10mg", "frequency": "1x daily"},
                {"name": "Aspirin", "dosage": "81mg", "frequency": "1x daily"}
            ],
            "conditions": ["Type 2 Diabetes", "Hypertension"],
            "age": 65
        }
        
        # Generate the tool
        logger.info("Generating medication tracker...")
        tool_info = await agent.generate_healthcare_tool("medication_tracker", patient_context)
        
        # Deploy to browserless
        if tool_info.get("success") and tool_info.get("files_created"):
            logger.info("Deploying to browserless...")
            deployment = await agent.deploy_to_browserless(
                tool_info["files_created"][0],
                live_url="https://tools.ron-ai.com/tracker-" + datetime.now().strftime("%Y%m%d%H%M%S")
            )
            
            tool_info["deployment"] = deployment
        
        return tool_info
    
    @staticmethod
    async def cost_calculator_workflow():
        """Workflow for healthcare cost calculator with insurance integration"""
        
        agent = ClaudeCodeInterleavedAgent()
        
        procedure_context = {
            "procedure": "MRI Scan",
            "cpt_code": "70553",
            "facility": "Regional Medical Center",
            "insurance": {
                "plan": "Blue Cross PPO",
                "deductible": 2000,
                "deductible_met": 500,
                "coinsurance": 0.2,
                "out_of_pocket_max": 6000,
                "out_of_pocket_met": 1000
            }
        }
        
        # Generate cost calculator
        logger.info("Generating cost calculator...")
        tool_info = await agent.generate_healthcare_tool("cost_calculator", procedure_context)
        
        # Create MCP integration for API access
        if tool_info.get("success"):
            logger.info("Creating MCP integration...")
            mcp_config = {
                "exposed_functions": [
                    "calculateCost",
                    "checkCoverage",
                    "getPaymentPlans"
                ]
            }
            
            mcp_result = await agent.create_mcp_integration("cost_calculator", mcp_config)
            tool_info["mcp_integration"] = mcp_result
        
        return tool_info
    
    @staticmethod  
    async def educational_guide_workflow():
        """Workflow for creating patient education materials"""
        
        agent = ClaudeCodeInterleavedAgent()
        
        education_context = {
            "condition": "Type 2 Diabetes",
            "age": 55,
            "language": "English",
            "reading_level": "8th grade",
            "topics": [
                "Understanding blood sugar",
                "Healthy eating habits", 
                "Exercise recommendations",
                "Medication management",
                "Monitoring and testing"
            ],
            "format_preferences": ["visual aids", "interactive quizzes", "printable summaries"]
        }
        
        # Generate educational guide
        logger.info("Generating educational guide...")
        tool_info = await agent.generate_healthcare_tool("educational_guide", education_context)
        
        return tool_info


async def main():
    """Demonstrate complete healthcare tool generation with interleaved thinking"""
    
    # Run medication tracker workflow
    logger.info("Starting medication tracker workflow...")
    tracker_result = await HealthcareWorkflows.medication_tracker_workflow()
    
    if tracker_result.get("success"):
        logger.info(f"✅ Medication tracker created successfully!")
        logger.info(f"Screenshots captured: {len(tracker_result.get('screenshots', []))}")
        if tracker_result.get('deployment', {}).get('live_url'):
            logger.info(f"Live URL: {tracker_result['deployment']['live_url']}")
    
    # Save results
    with open("healthcare_tool_results.json", "w") as f:
        json.dump(tracker_result, f, indent=2, default=str)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(main())
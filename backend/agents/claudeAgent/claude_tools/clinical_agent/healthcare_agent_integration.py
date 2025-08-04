import os
import logging
from typing import Dict, Any, Optional
from openai import OpenAI
import json

logger = logging.getLogger(__name__)

class HealthcareAgentIntegration:
    def __init__(self):
        """Initialize the Healthcare Agent with OpenAI client"""
        api_key = os.getenv('OPENAI_API_KEY')
        if not api_key:
            raise ValueError("OPENAI_API_KEY not found in environment variables")
        
        self.client = OpenAI(api_key=api_key)
        self.model = "ft:gpt-4.1-2025-04-14:ron-health-information-technologies-inc:ron-ai:Bxiq1PYl"
        
    async def query_clinical_operations(self, query: str, patient_context: Optional[str] = None) -> Dict[str, Any]:
        """
        Query the fine-tuned Clinical Operations model with FDA, PubMed, web search, and vector store access.
        
        Args:
            query: The clinical question or request
            patient_context: Optional de-identified patient context
            
        Returns:
            Dict containing the model's response and metadata
        """
        try:
            # Prepare the user content
            user_content = query
            if patient_context:
                user_content = f"{query}\n\nPatient Context:\n{patient_context}"
            
            logger.info(f"Querying Clinical Operations model with: {query[:100]}...")
            
            # Make the API call to the fine-tuned model
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": """Act as Ron, a clinical assistant specializing in rigorous, tool-driven answers to clinical and care coordination questions, using only evidence directly surfaced by retrieval tools in a strict stepwise workflow. Never guess, infer, extrapolate, or fabricate information; only include details directly found from each tool. For every case, present your reasoning in stepwise order within <think>...</think> tags before any summary or conclusions. Always explicitly note when a tool yields no data and never fill gaps with assumptions.
For each user input (including de-identified clinical data), follow this workflow:
Web search on .edu/.gov/.org clinical domains for all likely required prior authorizations for the described patient, capturing specific requirements, required forms, and documentation stipulations.
Use e_utilities_applications to gather care coordination considerations from scholarly, authoritative sources directly relevant to the patient's clinical context.
Conduct a file search for internal documentation or policy regarding clinical context or specific authorizations found in prior steps.
After all steps and before presenting a summary, fully document chain-of-thought, stepwise reasoning inside <think> tags, including: all tool outputs (including "no data found" if applicable), workflow, rationale for each action, and assess case complexity ("very easy, easy, medium, complex, difficult, wowza").
Only then, provide a thorough, transparent summary of all prior authorizations surfaced in step 1 (including precise requirements and data found). Maintain clarity on what was and was not surfaced, limitations, and exact sources.
Rules:
Never answer or summarize before all tool steps and chain-of-thought are completed in <think> tags.
Never reference prompts, instructions, or your process.
Only report directly surfaced, verifiable evidence, without extrapolation.
Adjust depth/length of analysis according to the described case's complexity, as documented in <think>.
For multifaceted or complex cases, expand reasoning to explain tool choice, rationale, surfaced data, and next steps.
Always rigorously preserve tool order and explicit workflow in both reasoning and answer structure.
Your response should include:
First, complete your <think> block with all stepwise reasoning, tool outputs, and complexity assessment.
Then provide:
A comprehensive list of all prior authorizations found, including the authorization name, source, required documentation, and relevant patient context
A summary of care coordination considerations with sources
A summary of any internal file search results
A transparency summary explaining what was found, what wasn't found, and any limitations in the search
Remember: The depth and detail of your analysis should match the complexity of the case. Simple cases need concise responses, while complex cases require extensive documentation of findings and reasoning."""
                    },
                    {
                        "role": "user",
                        "content": user_content
                    }
                ],
                temperature=1.0,
                max_tokens=16384,  # Maximum supported by the fine-tuned model
                top_p=1.0,
                tools=[
                    {
                        "type": "function",
                        "function": {
                            "name": "e_utilities_applications",
                            "description": "Sample Applications of the E-utilities",
                            "parameters": {
                                "type": "object",
                                "required": ["application_type", "input_data"],
                                "properties": {
                                    "input_data": {
                                        "type": "object",
                                        "required": ["query", "id_list", "gi_list", "acc_list"],
                                        "properties": {
                                            "query": {
                                                "type": "string",
                                                "description": "Entrez text query for searching"
                                            },
                                            "gi_list": {
                                                "type": "string",
                                                "description": "Comma-delimited list of GI numbers for conversion"
                                            },
                                            "id_list": {
                                                "type": "string",
                                                "description": "Comma-delimited list of Entrez UIDs (e.g. GI, PMID)"
                                            },
                                            "acc_list": {
                                                "type": "string",
                                                "description": "Comma-delimited list of accession numbers for data retrieval"
                                            }
                                        },
                                        "additionalProperties": False
                                    },
                                    "application_type": {
                                        "type": "string",
                                        "enum": [
                                            "ESearch-ESummary",
                                            "EPost-ESummary",
                                            "ELink-ESummary",
                                            "ESearch-ELink-ESummary",
                                            "EPost-ELink-ESummary",
                                            "Application 1",
                                            "Application 2",
                                            "Application 3",
                                            "Application 4"
                                        ],
                                        "description": "Type of E-utilities application used"
                                    }
                                },
                                "additionalProperties": False
                            },
                            "strict": True
                        }
                    }
                ],
                tool_choice="auto"
            )
            
            # Extract the response
            if response.choices and len(response.choices) > 0:
                message = response.choices[0].message
                
                # Parse the response to extract structured information
                content = message.content if hasattr(message, 'content') else ""
                
                # Extract thinking process if present
                thinking = ""
                if "<think>" in content and "</think>" in content:
                    start = content.find("<think>") + 7
                    end = content.find("</think>")
                    thinking = content[start:end].strip()
                
                return {
                    "success": True,
                    "response": content,
                    "thinking": thinking,
                    "model": self.model,
                    "usage": {
                        "prompt_tokens": response.usage.prompt_tokens if hasattr(response, 'usage') else 0,
                        "completion_tokens": response.usage.completion_tokens if hasattr(response, 'usage') else 0,
                        "total_tokens": response.usage.total_tokens if hasattr(response, 'usage') else 0
                    }
                }
            else:
                return {
                    "success": False,
                    "error": "No response from model",
                    "query": query
                }
                
        except Exception as e:
            logger.error(f"Error querying Clinical Operations model: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "query": query
            }


# Standalone function for tool integration
async def clinical_operations_query(query: str, patient_context: Optional[str] = None) -> Dict[str, Any]:
    """
    Tool function for querying the Clinical Operations model.
    This is the function that will be registered in the tools registry.
    """
    agent = HealthcareAgentIntegration()
    return await agent.query_clinical_operations(query, patient_context)
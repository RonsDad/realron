"""
Clinical Tool Orchestrator
Manages dynamic tool selection, parallel execution, and result aggregation for clinical operations
"""

import asyncio
import json
import logging
from typing import Dict, Any, List, Optional, Union, Callable, Awaitable
from datetime import datetime
from dataclasses import dataclass
from pydantic import BaseModel

logger = logging.getLogger(__name__)

@dataclass
class ToolExecutionResult:
    """Result from tool execution"""
    tool_name: str
    success: bool
    result: Any
    error: Optional[str] = None
    execution_time: float = 0.0
    metadata: Optional[Dict[str, Any]] = None

class ToolCapability(BaseModel):
    """Tool capability definition"""
    name: str
    description: str
    category: str
    priority: int = 5  # 1-10, higher is more important
    execution_time_estimate: float = 1.0  # seconds
    requires_internet: bool = False

class ClinicalToolOrchestrator:
    """Orchestrates clinical tools with intelligent selection and execution"""

    def __init__(self):
        self.tools = self._initialize_tools()
        self.tool_registry = self._build_tool_registry()
        self.execution_history: List[ToolExecutionResult] = []
        self.max_parallel_tools = 3

    def _initialize_tools(self) -> Dict[str, Callable]:
        """Initialize available clinical tools"""
        return {
            "search_pubmed": self._search_pubmed,
            "lookup_drug_info": self._lookup_drug_info,
            "search_clinical_trials": self._search_clinical_trials,
            "lookup_icd_codes": self._lookup_icd_codes,
            "check_guidelines": self._check_guidelines,
            "calculate_medical_scores": self._calculate_medical_scores,
            "check_drug_interactions": self._check_drug_interactions,
            "get_diagnostic_criteria": self._get_diagnostic_criteria,
            "analyze_lab_values": self._analyze_lab_values
        }

    def _build_tool_registry(self) -> Dict[str, ToolCapability]:
        """Build registry of tool capabilities"""
        return {
            "search_pubmed": ToolCapability(
                name="search_pubmed",
                description="Search PubMed for medical literature and evidence",
                category="literature",
                priority=9,
                execution_time_estimate=2.0,
                requires_internet=True
            ),
            "lookup_drug_info": ToolCapability(
                name="lookup_drug_info",
                description="Get comprehensive drug information from FDA database",
                category="pharmacology",
                priority=8,
                execution_time_estimate=1.5,
                requires_internet=True
            ),
            "search_clinical_trials": ToolCapability(
                name="search_clinical_trials",
                description="Search for clinical trials on ClinicalTrials.gov",
                category="research",
                priority=7,
                execution_time_estimate=2.5,
                requires_internet=True
            ),
            "lookup_icd_codes": ToolCapability(
                name="lookup_icd_codes",
                description="Look up ICD-10 codes for medical conditions",
                category="coding",
                priority=6,
                execution_time_estimate=0.5,
                requires_internet=False
            ),
            "check_guidelines": ToolCapability(
                name="check_guidelines",
                description="Access clinical practice guidelines",
                category="guidelines",
                priority=9,
                execution_time_estimate=1.5,
                requires_internet=True
            )
        }

    async def select_tools(
        self,
        query: str,
        context: Optional[str] = None,
        max_tools: int = 3
    ) -> List[str]:
        """Intelligently select tools based on query content"""
        query_lower = query.lower()
        context_lower = (context or "").lower()
        combined_text = f"{query_lower} {context_lower}"

        tool_scores = {}

        # Score tools based on relevance
        for tool_name, capability in self.tool_registry.items():
            score = self._calculate_tool_relevance(combined_text, capability)
            tool_scores[tool_name] = score

        # Sort by score and priority
        sorted_tools = sorted(
            tool_scores.items(),
            key=lambda x: (x[1], self.tool_registry[x[0]].priority),
            reverse=True
        )

        # Select top tools
        selected_tools = [
            tool_name for tool_name, score in sorted_tools[:max_tools]
            if score > 0
        ]

        logger.info(f"Selected tools for query: {selected_tools}")
        return selected_tools

    def _calculate_tool_relevance(self, text: str, capability: ToolCapability) -> float:
        """Calculate relevance score for a tool based on query content"""
        keyword_weights = {
            "literature": ["study", "research", "evidence", "literature", "pubmed", "article"],
            "pharmacology": ["drug", "medication", "prescription", "interaction", "side effect"],
            "research": ["trial", "clinical trial", "study", "research", "experimental"],
            "coding": ["icd", "code", "billing", "diagnosis code", "classification"],
            "guidelines": ["guideline", "recommendation", "protocol", "standard", "practice"]
        }

        score = 0.0
        category_keywords = keyword_weights.get(capability.category, [])

        # Check for category keywords
        for keyword in category_keywords:
            if keyword in text:
                score += 2.0

        # Check tool name relevance
        if capability.name.replace("_", " ") in text:
            score += 3.0

        # Apply priority weight
        score *= (capability.priority / 10.0)

        return score

    async def execute_tools_parallel(
        self,
        tool_calls: List[Dict[str, Any]],
        timeout: float = 30.0
    ) -> List[ToolExecutionResult]:
        """Execute multiple tools in parallel"""
        if not tool_calls:
            return []

        semaphore = asyncio.Semaphore(self.max_parallel_tools)

        async def execute_with_semaphore(tool_call):
            async with semaphore:
                return await self._execute_single_tool(tool_call)

        tasks = [execute_with_semaphore(tool_call) for tool_call in tool_calls]

        try:
            results = await asyncio.wait_for(
                asyncio.gather(*tasks, return_exceptions=True),
                timeout=timeout
            )

            processed_results = []
            for i, result in enumerate(results):
                if isinstance(result, Exception):
                    processed_results.append(
                        ToolExecutionResult(
                            tool_name=tool_calls[i].get("name", "unknown"),
                            success=False,
                            result=None,
                            error=str(result)
                        )
                    )
                else:
                    processed_results.append(result)

            return processed_results

        except asyncio.TimeoutError:
            logger.error(f"Tool execution timeout after {timeout}s")
            return [
                ToolExecutionResult(
                    tool_name=tool_call.get("name", "unknown"),
                    success=False,
                    result=None,
                    error="Execution timeout"
                )
                for tool_call in tool_calls
            ]

    async def _execute_single_tool(self, tool_call: Dict[str, Any]) -> ToolExecutionResult:
        """Execute a single tool call"""
        tool_name = tool_call.get("name", "unknown")
        args = tool_call.get("arguments", {})
        start_time = datetime.now()

        try:
            if tool_name not in self.tools:
                return ToolExecutionResult(
                    tool_name=tool_name,
                    success=False,
                    result=None,
                    error=f"Tool {tool_name} not found"
                )

            tool_function = self.tools[tool_name]
            result = await tool_function(**args)
            execution_time = (datetime.now() - start_time).total_seconds()

            result = ToolExecutionResult(
                tool_name=tool_name,
                success=True,
                result=result,
                execution_time=execution_time,
                metadata={"args": args}
            )

            self.execution_history.append(result)
            return result

        except Exception as e:
            execution_time = (datetime.now() - start_time).total_seconds()
            result = ToolExecutionResult(
                tool_name=tool_name,
                success=False,
                result=None,
                error=str(e),
                execution_time=execution_time,
                metadata={"args": args}
            )
            self.execution_history.append(result)
            logger.error(f"Tool {tool_name} execution failed: {str(e)}")
            return result

    def aggregate_results(self, results: List[ToolExecutionResult]) -> Dict[str, Any]:
        """Aggregate results from multiple tools"""
        successful_results = [r for r in results if r.success]
        failed_results = [r for r in results if not r.success]

        aggregated = {
            "summary": {
                "total_tools": len(results),
                "successful": len(successful_results),
                "failed": len(failed_results),
                "total_execution_time": sum(r.execution_time for r in results)
            },
            "results_by_category": {},
            "evidence_sources": [],
            "errors": [r.error for r in failed_results if r.error]
        }

        # Categorize results
        for result in successful_results:
            tool_capability = self.tool_registry.get(result.tool_name)
            if tool_capability:
                category = tool_capability.category
                if category not in aggregated["results_by_category"]:
                    aggregated["results_by_category"][category] = []

                aggregated["results_by_category"][category].append({
                    "tool": result.tool_name,
                    "result": result.result,
                    "execution_time": result.execution_time
                })

        return aggregated

    # Simplified tool implementations (these would connect to MCP servers in production)
    async def _search_pubmed(self, query: str, max_results: int = 10, **kwargs) -> Dict[str, Any]:
        """Search PubMed for medical literature"""
        await asyncio.sleep(0.1)
        return {
            "articles": [
                {
                    "title": f"Clinical study on {query}",
                    "authors": ["Smith J", "Doe A"],
                    "journal": "New England Journal of Medicine",
                    "year": 2024,
                    "pmid": "12345678"
                }
            ],
            "total_results": 1,
            "query": query
        }

    async def _lookup_drug_info(self, drug_name: str, include_interactions: bool = True, **kwargs) -> Dict[str, Any]:
        """Look up drug information from FDA database"""
        await asyncio.sleep(0.1)
        return {
            "drug_name": drug_name,
            "generic_name": drug_name.lower(),
            "indications": [f"Treatment indication for {drug_name}"],
            "contraindications": ["Known hypersensitivity"],
            "side_effects": ["Nausea", "Headache"],
            "interactions": ["Potential interaction with warfarin"] if include_interactions else []
        }

    async def _search_clinical_trials(self, condition: str, intervention: str = None, status: str = "recruiting", **kwargs) -> Dict[str, Any]:
        """Search clinical trials"""
        await asyncio.sleep(0.1)
        return {
            "trials": [
                {
                    "title": f"Trial for {condition}",
                    "nct_id": "NCT12345678",
                    "status": status,
                    "condition": condition,
                    "intervention": intervention
                }
            ],
            "total_results": 1
        }

    async def _lookup_icd_codes(self, condition: str, **kwargs) -> Dict[str, Any]:
        """Look up ICD-10 codes"""
        await asyncio.sleep(0.05)
        return {
            "condition": condition,
            "codes": [{"code": "Z00.00", "description": f"Encounter for {condition}"}]
        }

    async def _check_guidelines(self, condition: str, guideline_type: str = "treatment", **kwargs) -> Dict[str, Any]:
        """Check clinical guidelines"""
        await asyncio.sleep(0.1)
        return {
            "condition": condition,
            "guideline_type": guideline_type,
            "guidelines": [f"Current {guideline_type} guidelines for {condition} recommend..."],
            "last_updated": "2024"
        }

    async def _calculate_medical_scores(self, score_type: str, parameters: Dict[str, Any], **kwargs) -> Dict[str, Any]:
        """Calculate medical scores"""
        await asyncio.sleep(0.05)
        return {
            "score_type": score_type,
            "score": 85,
            "interpretation": "Moderate risk",
            "parameters_used": parameters
        }

    async def _check_drug_interactions(self, drugs: List[str], **kwargs) -> Dict[str, Any]:
        """Check drug interactions"""
        await asyncio.sleep(0.1)
        return {
            "drugs": drugs,
            "interactions": [
                {
                    "drug_pair": drugs[:2] if len(drugs) >= 2 else drugs,
                    "severity": "moderate",
                    "recommendation": "Monitor closely"
                }
            ] if len(drugs) > 1 else []
        }

    async def _get_diagnostic_criteria(self, condition: str, **kwargs) -> Dict[str, Any]:
        """Get diagnostic criteria"""
        await asyncio.sleep(0.1)
        return {
            "condition": condition,
            "criteria": [
                f"Major criterion 1 for {condition}",
                f"Major criterion 2 for {condition}"
            ],
            "diagnostic_algorithm": f"Algorithm for diagnosing {condition}"
        }

    async def _analyze_lab_values(self, lab_values: Dict[str, float], **kwargs) -> Dict[str, Any]:
        """Analyze laboratory values"""
        await asyncio.sleep(0.05)
        analysis = {}
        for test, value in lab_values.items():
            analysis[test] = {
                "value": value,
                "reference_range": "Normal range",
                "interpretation": "Within normal limits"
            }

        return {
            "analysis": analysis,
            "overall_assessment": "Laboratory values within expected ranges"
        }
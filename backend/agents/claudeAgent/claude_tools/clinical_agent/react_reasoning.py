"""
ReAct (Reasoning + Acting) Framework Implementation for Clinical Operations
Implements iterative thought-action-observation loops with structured reasoning
"""

import asyncio
import logging
from typing import Dict, Any, List, Optional, Literal
from datetime import datetime
from dataclasses import dataclass
from enum import Enum
import json

logger = logging.getLogger(__name__)

class AgentState(Enum):
    """Agent execution states"""
    IDLE = "idle"
    THINKING = "thinking"
    ACTING = "acting"
    OBSERVING = "observing"
    COMPLETE = "complete"
    ERROR = "error"

@dataclass
class ReActStep:
    """Single step in ReAct reasoning loop"""
    step_type: Literal["thought", "action", "observation"]
    content: str
    timestamp: datetime
    metadata: Optional[Dict[str, Any]] = None

class ReActReasoner:
    """ReAct framework implementation for structured reasoning"""

    def __init__(self):
        self.steps: List[ReActStep] = []
        self.state = AgentState.IDLE
        self.max_iterations = 5
        self.current_iteration = 0

    def reset(self):
        """Reset reasoning state"""
        self.steps.clear()
        self.state = AgentState.IDLE
        self.current_iteration = 0

    def add_thought(self, content: str, metadata: Optional[Dict[str, Any]] = None):
        """Add a thought step"""
        step = ReActStep(
            step_type="thought",
            content=content,
            timestamp=datetime.now(),
            metadata=metadata
        )
        self.steps.append(step)
        self.state = AgentState.THINKING
        logger.debug(f"ReAct Thought: {content[:100]}...")

    def add_action(self, content: str, metadata: Optional[Dict[str, Any]] = None):
        """Add an action step"""
        step = ReActStep(
            step_type="action",
            content=content,
            timestamp=datetime.now(),
            metadata=metadata
        )
        self.steps.append(step)
        self.state = AgentState.ACTING
        logger.debug(f"ReAct Action: {content[:100]}...")

    def add_observation(self, content: str, metadata: Optional[Dict[str, Any]] = None):
        """Add an observation step"""
        step = ReActStep(
            step_type="observation",
            content=content,
            timestamp=datetime.now(),
            metadata=metadata
        )
        self.steps.append(step)
        self.state = AgentState.OBSERVING
        logger.debug(f"ReAct Observation: {content[:100]}...")

    def should_continue(self, last_response: Optional[str] = None) -> bool:
        """Determine if reasoning should continue"""
        if self.current_iteration >= self.max_iterations:
            return False

        if not last_response:
            return True

        # Check for conclusion indicators
        conclusion_indicators = [
            "final answer",
            "in conclusion",
            "based on all evidence",
            "my recommendation",
            "treatment plan",
            "diagnosis is",
            "clinical assessment"
        ]

        return not any(indicator in last_response.lower() for indicator in conclusion_indicators)

    def next_iteration(self):
        """Move to next iteration"""
        self.current_iteration += 1

    def get_reasoning_trace(self) -> List[Dict[str, Any]]:
        """Get structured reasoning trace"""
        return [
            {
                "step": i + 1,
                "type": step.step_type,
                "content": step.content,
                "timestamp": step.timestamp.isoformat(),
                "metadata": step.metadata or {}
            }
            for i, step in enumerate(self.steps)
        ]

    def get_formatted_history(self) -> str:
        """Get formatted history for model context"""
        formatted = []
        for step in self.steps:
            if step.step_type == "thought":
                formatted.append(f"Thought: {step.content}")
            elif step.step_type == "action":
                formatted.append(f"Action: {step.content}")
            elif step.step_type == "observation":
                formatted.append(f"Observation: {step.content}")

        return "\n\n".join(formatted)

    def mark_complete(self):
        """Mark reasoning as complete"""
        self.state = AgentState.COMPLETE

    def mark_error(self, error_message: str):
        """Mark reasoning as error"""
        self.state = AgentState.ERROR
        self.add_observation(f"Error: {error_message}", {"error": True})

    def get_summary(self) -> Dict[str, Any]:
        """Get reasoning summary"""
        step_counts = {
            "thoughts": len([s for s in self.steps if s.step_type == "thought"]),
            "actions": len([s for s in self.steps if s.step_type == "action"]),
            "observations": len([s for s in self.steps if s.step_type == "observation"])
        }

        return {
            "state": self.state.value,
            "total_steps": len(self.steps),
            "iterations": self.current_iteration,
            "step_counts": step_counts,
            "duration": (
                (self.steps[-1].timestamp - self.steps[0].timestamp).total_seconds()
                if self.steps else 0
            )
        }

class ClinicalReActPlanner:
    """Clinical-specific ReAct planning with domain knowledge"""

    def __init__(self):
        self.clinical_domains = {
            "cardiology": ["ECG", "cardiac markers", "echocardiogram"],
            "oncology": ["imaging", "biopsy", "tumor markers"],
            "neurology": ["MRI", "EEG", "CSF analysis"],
            "infectious_disease": ["cultures", "serology", "molecular tests"],
            "endocrinology": ["hormone levels", "glucose tolerance", "thyroid function"],
            "general": ["vital signs", "basic metabolic panel", "CBC"]
        }

        self.evidence_hierarchy = [
            "systematic_review",
            "randomized_controlled_trial",
            "cohort_study",
            "case_control_study",
            "case_series",
            "expert_opinion"
        ]

    def plan_clinical_reasoning(self, query: str, patient_context: Optional[str] = None) -> List[str]:
        """Plan clinical reasoning steps based on query content"""
        steps = []

        # Initial assessment
        steps.append("Analyze the clinical question and identify key components")

        # Domain-specific planning
        domain = self._identify_clinical_domain(query)
        if domain != "general":
            steps.append(f"Consider {domain}-specific guidelines and protocols")

        # Evidence gathering
        if "diagnosis" in query.lower():
            steps.extend([
                "Search for diagnostic criteria and guidelines",
                "Review differential diagnosis approaches",
                "Identify required diagnostic tests"
            ])
        elif "treatment" in query.lower():
            steps.extend([
                "Search for current treatment guidelines",
                "Review evidence for therapeutic options",
                "Consider contraindications and drug interactions"
            ])

        # Patient-specific considerations
        if patient_context:
            steps.append("Apply general recommendations to specific patient context")

        # Final synthesis
        steps.extend([
            "Synthesize evidence and formulate recommendations",
            "Identify potential risks and safety considerations",
            "Provide structured clinical assessment"
        ])

        return steps

    def _identify_clinical_domain(self, query: str) -> str:
        """Identify clinical domain from query content"""
        query_lower = query.lower()

        for domain, keywords in self.clinical_domains.items():
            if any(keyword.lower() in query_lower for keyword in keywords):
                return domain

        # Check for domain-specific terms
        if any(term in query_lower for term in ["heart", "cardiac", "chest pain"]):
            return "cardiology"
        elif any(term in query_lower for term in ["cancer", "tumor", "oncology"]):
            return "oncology"
        elif any(term in query_lower for term in ["brain", "seizure", "neurological"]):
            return "neurology"
        elif any(term in query_lower for term in ["infection", "antibiotic", "fever"]):
            return "infectious_disease"
        elif any(term in query_lower for term in ["diabetes", "thyroid", "hormone"]):
            return "endocrinology"

        return "general"

    def prioritize_evidence(self, evidence_items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Prioritize evidence based on clinical hierarchy"""
        def get_evidence_priority(item):
            study_type = item.get("study_type", "").lower()
            for i, evidence_type in enumerate(self.evidence_hierarchy):
                if evidence_type.replace("_", " ") in study_type:
                    return i
            return len(self.evidence_hierarchy)

        return sorted(evidence_items, key=get_evidence_priority)

    def format_clinical_reasoning_prompt(self, query: str, steps: List[str]) -> str:
        """Format reasoning prompt for clinical context"""
        prompt = f"""
Clinical Query: {query}

Please follow this structured reasoning approach:

"""
        for i, step in enumerate(steps, 1):
            prompt += f"{i}. {step}\n"

        prompt += """
Use the ReAct framework:
- THOUGHT: State your reasoning for each step
- ACTION: Describe what information you need to gather
- OBSERVATION: Analyze the results and plan next steps

Maintain clinical rigor:
- Prioritize patient safety
- Cite evidence sources
- Consider contraindications
- Provide confidence levels
- Suggest follow-up actions

Format your response with clear THOUGHT/ACTION/OBSERVATION sections.
"""

        return prompt
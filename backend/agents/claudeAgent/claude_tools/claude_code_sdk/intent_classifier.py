"""
Intent Classifier for Healthcare Tool Requests
Classifies patient requests into tool categories
"""

import re
from typing import Dict, Any, List, Tuple
from dataclasses import dataclass


@dataclass
class Intent:
    """Represents a classified intent"""
    tool_type: str
    confidence: float
    keywords_matched: List[str]
    suggested_template: str


class IntentClassifier:
    """Classifies patient requests into tool categories"""
    
    def __init__(self):
        self.intent_patterns = self._initialize_patterns()
    
    def _initialize_patterns(self) -> Dict[str, Dict[str, Any]]:
        """Initialize intent patterns for classification"""
        return {
            "medication_tracker": {
                "keywords": [
                    "medication", "medicine", "drug", "prescription", "pill",
                    "dose", "dosage", "remind", "schedule", "track med",
                    "medication list", "med tracker", "pharmacy"
                ],
                "phrases": [
                    "track my medications",
                    "medication reminder",
                    "manage my pills",
                    "medication schedule",
                    "never miss a dose"
                ],
                "template": "medication_tracker"
            },
            "symptom_diary": {
                "keywords": [
                    "symptom", "pain", "discomfort", "feeling", "diary",
                    "log", "track", "monitor", "journal", "record"
                ],
                "phrases": [
                    "track my symptoms",
                    "symptom diary",
                    "pain log",
                    "health journal",
                    "monitor my condition"
                ],
                "template": "symptom_diary"
            },
            "appointment_prep": {
                "keywords": [
                    "appointment", "doctor", "visit", "prepare", "questions",
                    "provider", "consultation", "checkup", "meeting"
                ],
                "phrases": [
                    "prepare for appointment",
                    "doctor visit prep",
                    "questions for doctor",
                    "appointment checklist",
                    "medical visit preparation"
                ],
                "template": "appointment_prep"
            },
            "cost_calculator": {
                "keywords": [
                    "cost", "price", "expense", "bill", "insurance",
                    "payment", "afford", "financial", "money", "coverage"
                ],
                "phrases": [
                    "healthcare costs",
                    "calculate expenses",
                    "insurance coverage",
                    "medical bills",
                    "cost estimation"
                ],
                "template": "cost_calculator"
            },
            "treatment_comparison": {
                "keywords": [
                    "compare", "option", "treatment", "choice", "decision",
                    "alternative", "versus", "pros cons", "which"
                ],
                "phrases": [
                    "compare treatments",
                    "treatment options",
                    "help me decide",
                    "pros and cons",
                    "which treatment"
                ],
                "template": "treatment_comparison"
            },
            "educational_guide": {
                "keywords": [
                    "learn", "understand", "education", "information", "what is",
                    "explain", "guide", "tutorial", "teach", "about"
                ],
                "phrases": [
                    "learn about",
                    "understand my condition",
                    "educational guide",
                    "explain my diagnosis",
                    "information about"
                ],
                "template": "educational_guide"
            }
        }
    
    async def classify(self, user_input: str) -> Intent:
        """
        Classify user input into an intent
        
        Args:
            user_input: The user's request
            
        Returns:
            Intent object with classification details
        """
        # Normalize input
        normalized_input = user_input.lower().strip()
        
        # Score each intent
        scores = []
        for intent_type, pattern_data in self.intent_patterns.items():
            score, matched_keywords = self._score_intent(normalized_input, pattern_data)
            scores.append((intent_type, score, matched_keywords))
        
        # Sort by score
        scores.sort(key=lambda x: x[1], reverse=True)
        
        # Get best match
        best_intent, best_score, best_keywords = scores[0]
        
        # If no good match, default to educational guide
        if best_score < 0.1:
            best_intent = "educational_guide"
            best_keywords = ["general", "information"]
            best_score = 0.5
        
        return Intent(
            tool_type=best_intent,
            confidence=min(best_score, 1.0),
            keywords_matched=best_keywords,
            suggested_template=self.intent_patterns[best_intent]["template"]
        )
    
    def _score_intent(self, user_input: str, pattern_data: Dict[str, Any]) -> Tuple[float, List[str]]:
        """
        Score how well input matches an intent
        
        Returns:
            Tuple of (score, matched_keywords)
        """
        score = 0.0
        matched_keywords = []
        
        # Check keywords
        keywords = pattern_data.get("keywords", [])
        for keyword in keywords:
            if keyword in user_input:
                score += 0.1
                matched_keywords.append(keyword)
        
        # Check phrases (worth more)
        phrases = pattern_data.get("phrases", [])
        for phrase in phrases:
            if phrase in user_input:
                score += 0.3
                matched_keywords.append(f"phrase: {phrase}")
        
        # Bonus for multiple matches
        if len(matched_keywords) > 2:
            score *= 1.2
        
        return score, matched_keywords
    
    def get_intent_description(self, intent_type: str) -> str:
        """Get a user-friendly description of the intent"""
        descriptions = {
            "medication_tracker": "Track medications and set reminders",
            "symptom_diary": "Log and monitor symptoms over time",
            "appointment_prep": "Prepare for medical appointments",
            "cost_calculator": "Estimate healthcare costs",
            "treatment_comparison": "Compare treatment options",
            "educational_guide": "Learn about health conditions"
        }
        return descriptions.get(intent_type, "Healthcare tool")
    
    def extract_entities(self, user_input: str) -> Dict[str, List[str]]:
        """
        Extract entities from user input
        
        Returns:
            Dictionary of entity types and values
        """
        entities = {
            "medications": [],
            "symptoms": [],
            "conditions": [],
            "timeframes": []
        }
        
        # Simple pattern matching for demonstration
        # In production, use NER or more sophisticated extraction
        
        # Extract medications (words ending in common suffixes)
        med_patterns = r'\b\w+(?:in|ol|ide|ate|ine)\b'
        entities["medications"] = re.findall(med_patterns, user_input, re.IGNORECASE)
        
        # Extract time references
        time_patterns = r'\b(?:daily|weekly|monthly|morning|evening|night)\b'
        entities["timeframes"] = re.findall(time_patterns, user_input, re.IGNORECASE)
        
        # Extract symptom keywords
        symptom_keywords = ["pain", "ache", "fever", "cough", "fatigue", "nausea"]
        for keyword in symptom_keywords:
            if keyword in user_input.lower():
                entities["symptoms"].append(keyword)
        
        return entities


# Global instance
intent_classifier = IntentClassifier()
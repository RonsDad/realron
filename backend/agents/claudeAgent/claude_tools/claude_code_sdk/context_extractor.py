"""
Context Extractor for Patient Information
Extracts relevant context from patient data and messages
"""

import re
from typing import Dict, Any, List, Optional
from datetime import datetime
from dataclasses import dataclass


@dataclass
class PatientContext:
    """Structured patient context"""
    patient_id: str
    patient_name: str
    age: Optional[int]
    medications: List[str]
    conditions: List[str]
    allergies: List[str]
    recent_symptoms: List[str]
    insurance_info: Dict[str, Any]
    preferences: Dict[str, Any]


class ContextExtractor:
    """Extracts and structures patient context"""
    
    def __init__(self):
        self.condition_keywords = self._load_condition_keywords()
        self.medication_patterns = self._load_medication_patterns()
    
    def _load_condition_keywords(self) -> List[str]:
        """Common medical conditions"""
        return [
            "diabetes", "hypertension", "asthma", "arthritis", "depression",
            "anxiety", "copd", "heart disease", "cancer", "migraine",
            "allergies", "high blood pressure", "high cholesterol"
        ]
    
    def _load_medication_patterns(self) -> List[str]:
        """Common medication name patterns"""
        return [
            r'\b\w+(?:in|ol|ide|ate|ine|am|il|one|ase)\b',  # Common suffixes
            r'\b(?:aspirin|tylenol|advil|insulin|metformin)\b',  # Common names
        ]
    
    async def extract(
        self, 
        message: str, 
        patient_id: str,
        patient_data: Optional[Dict[str, Any]] = None
    ) -> PatientContext:
        """
        Extract context from message and patient data
        
        Args:
            message: User's message
            patient_id: Patient identifier
            patient_data: Optional existing patient data
            
        Returns:
            Structured PatientContext
        """
        # Initialize with defaults
        patient_data = patient_data or {}
        
        # Extract from patient data
        patient_name = patient_data.get("name", "Patient")
        age = self._extract_age(message, patient_data)
        
        # Extract medical information
        medications = self._extract_medications(message, patient_data)
        conditions = self._extract_conditions(message, patient_data)
        allergies = self._extract_allergies(message, patient_data)
        symptoms = self._extract_symptoms(message)
        
        # Extract other context
        insurance_info = patient_data.get("insurance", {})
        preferences = patient_data.get("preferences", {})
        
        return PatientContext(
            patient_id=patient_id,
            patient_name=patient_name,
            age=age,
            medications=medications,
            conditions=conditions,
            allergies=allergies,
            recent_symptoms=symptoms,
            insurance_info=insurance_info,
            preferences=preferences
        )
    
    def _extract_age(self, message: str, patient_data: Dict[str, Any]) -> Optional[int]:
        """Extract age from message or data"""
        # Check patient data first
        if "age" in patient_data:
            return patient_data["age"]
        
        # Try to extract from message
        age_pattern = r'\b(\d{1,3})\s*(?:years?\s*old|yo|y\.o\.)\b'
        match = re.search(age_pattern, message, re.IGNORECASE)
        if match:
            age = int(match.group(1))
            if 0 < age < 120:  # Sanity check
                return age
        
        return None
    
    def _extract_medications(self, message: str, patient_data: Dict[str, Any]) -> List[str]:
        """Extract medications from message and data"""
        medications = set()
        
        # From patient data
        if "medications" in patient_data:
            medications.update(patient_data["medications"])
        
        # From message using patterns
        message_lower = message.lower()
        for pattern in self.medication_patterns:
            matches = re.findall(pattern, message, re.IGNORECASE)
            medications.update(m.lower() for m in matches)
        
        # Filter out common words that match patterns but aren't medications
        exclude_words = {"in", "on", "at", "the", "and", "or", "not"}
        medications = {m for m in medications if m not in exclude_words}
        
        return sorted(list(medications))
    
    def _extract_conditions(self, message: str, patient_data: Dict[str, Any]) -> List[str]:
        """Extract medical conditions"""
        conditions = set()
        
        # From patient data
        if "conditions" in patient_data:
            conditions.update(patient_data["conditions"])
        
        # From message
        message_lower = message.lower()
        for condition in self.condition_keywords:
            if condition in message_lower:
                conditions.add(condition)
        
        return sorted(list(conditions))
    
    def _extract_allergies(self, message: str, patient_data: Dict[str, Any]) -> List[str]:
        """Extract allergies"""
        allergies = set()
        
        # From patient data
        if "allergies" in patient_data:
            allergies.update(patient_data["allergies"])
        
        # From message
        allergy_pattern = r'(?:allerg\w+\s+to|allergic\s+to)\s+(\w+)'
        matches = re.findall(allergy_pattern, message, re.IGNORECASE)
        allergies.update(matches)
        
        return sorted(list(allergies))
    
    def _extract_symptoms(self, message: str) -> List[str]:
        """Extract symptoms from message"""
        symptoms = []
        
        # Common symptom keywords
        symptom_keywords = [
            "pain", "ache", "fever", "cough", "fatigue", "nausea",
            "dizziness", "headache", "shortness of breath", "swelling",
            "rash", "itching", "numbness", "tingling"
        ]
        
        message_lower = message.lower()
        for symptom in symptom_keywords:
            if symptom in message_lower:
                symptoms.append(symptom)
        
        return symptoms
    
    def to_context_dict(self, context: PatientContext) -> Dict[str, Any]:
        """Convert PatientContext to dictionary for tool generation"""
        return {
            "patient_id": context.patient_id,
            "patient_name": context.patient_name,
            "age": context.age,
            "medications": context.medications,
            "conditions": context.conditions,
            "allergies": context.allergies,
            "symptoms": context.recent_symptoms,
            "has_insurance": bool(context.insurance_info),
            "timestamp": datetime.now().isoformat()
        }
    
    def get_context_summary(self, context: PatientContext) -> str:
        """Get a human-readable summary of the context"""
        summary_parts = [f"Patient: {context.patient_name}"]
        
        if context.age:
            summary_parts.append(f"Age: {context.age}")
        
        if context.conditions:
            summary_parts.append(f"Conditions: {', '.join(context.conditions)}")
        
        if context.medications:
            summary_parts.append(f"Medications: {', '.join(context.medications[:3])}" + 
                               ("..." if len(context.medications) > 3 else ""))
        
        return " | ".join(summary_parts)


# Global instance
context_extractor = ContextExtractor()
"""
Healthcare Tool Template Library
Provides templates for common healthcare tools
"""

from typing import Dict, Any, List
from datetime import datetime


class TemplateLibrary:
    """Library of healthcare tool templates"""
    
    def __init__(self):
        self.templates = self._initialize_templates()
    
    def _initialize_templates(self) -> Dict[str, Dict[str, Any]]:
        """Initialize the template library with healthcare tools"""
        return {
            "medication_tracker": {
                "name": "Medication Tracker",
                "description": "Track medications, doses, and schedules",
                "category": "medication_management",
                "features": ["Schedule tracking", "Reminder setup", "Dose logging", "Side effect notes"],
                "template_generator": self._generate_medication_tracker
            },
            "symptom_diary": {
                "name": "Symptom Diary",
                "description": "Log and track symptoms over time",
                "category": "health_monitoring",
                "features": ["Daily logging", "Severity tracking", "Pattern analysis", "Export capability"],
                "template_generator": self._generate_symptom_diary
            },
            "appointment_prep": {
                "name": "Appointment Preparation",
                "description": "Prepare for medical appointments",
                "category": "care_coordination",
                "features": ["Question list", "Medical history", "Current concerns", "Provider notes"],
                "template_generator": self._generate_appointment_prep
            },
            "cost_calculator": {
                "name": "Healthcare Cost Calculator",
                "description": "Estimate and track healthcare costs",
                "category": "financial",
                "features": ["Cost estimation", "Insurance calculator", "Payment tracking", "Savings tips"],
                "template_generator": self._generate_cost_calculator
            },
            "treatment_comparison": {
                "name": "Treatment Comparison Tool",
                "description": "Compare different treatment options",
                "category": "decision_support",
                "features": ["Side-by-side comparison", "Pros and cons", "Cost analysis", "Effectiveness data"],
                "template_generator": self._generate_treatment_comparison
            },
            "educational_guide": {
                "name": "Condition Education Guide",
                "description": "Learn about medical conditions",
                "category": "education",
                "features": ["Easy explanations", "Visual aids", "FAQ section", "Resource links"],
                "template_generator": self._generate_educational_guide
            }
        }
    
    def get_available_templates(self) -> List[str]:
        """Get list of available template types"""
        return list(self.templates.keys())
    
    def get_template(self, template_type: str) -> Dict[str, Any]:
        """Get template metadata"""
        return self.templates.get(template_type, {})
    
    def generate_tool(self, template_type: str, context: Dict[str, Any]) -> str:
        """Generate HTML tool from template"""
        template = self.templates.get(template_type)
        if not template:
            raise ValueError(f"Unknown template type: {template_type}")
        
        generator = template.get("template_generator")
        if not generator:
            raise ValueError(f"No generator for template: {template_type}")
        
        return generator(context)
    
    def _generate_base_template(self, title: str, content: str) -> str:
        """Generate base HTML template with consistent styling"""
        return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #333;
            line-height: 1.6;
            min-height: 100vh;
            padding: 20px;
        }}
        
        .container {{
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 16px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }}
        
        .header {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 2rem;
            text-align: center;
        }}
        
        .header h1 {{
            font-size: 2rem;
            margin-bottom: 0.5rem;
        }}
        
        .header p {{
            opacity: 0.9;
            font-size: 1.1rem;
        }}
        
        .content {{
            padding: 2rem;
        }}
        
        .card {{
            background: #f8f9fa;
            border-radius: 12px;
            padding: 1.5rem;
            margin-bottom: 1.5rem;
            border: 1px solid #e9ecef;
        }}
        
        .button {{
            background: #667eea;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 16px;
            cursor: pointer;
            transition: all 0.3s;
            display: inline-block;
            text-decoration: none;
            text-align: center;
        }}
        
        .button:hover {{
            background: #5a67d8;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }}
        
        .input {{
            width: 100%;
            padding: 12px;
            border: 2px solid #e9ecef;
            border-radius: 8px;
            font-size: 16px;
            transition: border-color 0.3s;
            margin-bottom: 1rem;
        }}
        
        .input:focus {{
            outline: none;
            border-color: #667eea;
        }}
        
        .grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1rem;
            margin: 1rem 0;
        }}
        
        @media (max-width: 600px) {{
            .header h1 {{
                font-size: 1.5rem;
            }}
            
            .content {{
                padding: 1rem;
            }}
        }}
    </style>
</head>
<body>
    <div class="container">
        {content}
    </div>
</body>
</html>"""
    
    def _generate_medication_tracker(self, context: Dict[str, Any]) -> str:
        """Generate medication tracker tool"""
        patient_name = context.get('patient_name', 'Patient')
        medications = context.get('medications', [])
        
        med_list = ""
        for med in medications[:5]:  # Limit to 5 for demo
            med_list += f"""
            <div class="card">
                <h3>{med}</h3>
                <p>Dosage: <input type="text" class="input" placeholder="Enter dosage"></p>
                <p>Schedule: <input type="text" class="input" placeholder="Enter schedule"></p>
                <button class="button" onclick="alert('Reminder set for {med}!')">Set Reminder</button>
            </div>
            """
        
        content = f"""
        <div class="header">
            <h1>{patient_name}'s Medication Tracker</h1>
            <p>Track your medications and never miss a dose</p>
        </div>
        <div class="content">
            <h2>Your Medications</h2>
            {med_list if med_list else '<p>No medications added yet</p>'}
            <button class="button" style="margin-top: 2rem;" onclick="alert('Add medication feature coming soon!')">
                + Add New Medication
            </button>
        </div>
        """
        
        return self._generate_base_template(f"{patient_name}'s Medication Tracker", content)
    
    def _generate_symptom_diary(self, context: Dict[str, Any]) -> str:
        """Generate symptom diary tool"""
        patient_name = context.get('patient_name', 'Patient')
        
        content = f"""
        <div class="header">
            <h1>{patient_name}'s Symptom Diary</h1>
            <p>Track your symptoms and identify patterns</p>
        </div>
        <div class="content">
            <div class="card">
                <h2>Log Today's Symptoms</h2>
                <label>Symptom:</label>
                <input type="text" class="input" placeholder="Describe your symptom">
                
                <label>Severity (1-10):</label>
                <input type="range" min="1" max="10" value="5" class="input">
                
                <label>Notes:</label>
                <textarea class="input" rows="3" placeholder="Additional notes..."></textarea>
                
                <button class="button">Save Entry</button>
            </div>
            
            <div class="card">
                <h2>Recent Entries</h2>
                <p>Your symptom history will appear here</p>
            </div>
        </div>
        """
        
        return self._generate_base_template(f"{patient_name}'s Symptom Diary", content)
    
    def _generate_appointment_prep(self, context: Dict[str, Any]) -> str:
        """Generate appointment preparation tool"""
        patient_name = context.get('patient_name', 'Patient')
        
        content = f"""
        <div class="header">
            <h1>{patient_name}'s Appointment Prep</h1>
            <p>Get ready for your next medical appointment</p>
        </div>
        <div class="content">
            <div class="card">
                <h2>Questions for Your Provider</h2>
                <input type="text" class="input" placeholder="Add a question">
                <button class="button">Add Question</button>
                <ul id="questions" style="margin-top: 1rem;">
                    <li>What are my treatment options?</li>
                    <li>What are the side effects?</li>
                </ul>
            </div>
            
            <div class="card">
                <h2>Current Symptoms</h2>
                <textarea class="input" rows="4" placeholder="List your current symptoms..."></textarea>
            </div>
            
            <div class="card">
                <h2>Medications</h2>
                <textarea class="input" rows="4" placeholder="List all current medications..."></textarea>
            </div>
            
            <button class="button" style="width: 100%; margin-top: 1rem;">
                Generate Appointment Summary
            </button>
        </div>
        """
        
        return self._generate_base_template(f"{patient_name}'s Appointment Prep", content)
    
    def _generate_cost_calculator(self, context: Dict[str, Any]) -> str:
        """Generate healthcare cost calculator"""
        patient_name = context.get('patient_name', 'Patient')
        
        content = f"""
        <div class="header">
            <h1>{patient_name}'s Cost Calculator</h1>
            <p>Estimate and track your healthcare costs</p>
        </div>
        <div class="content">
            <div class="grid">
                <div class="card">
                    <h3>Procedure Cost</h3>
                    <input type="number" class="input" placeholder="$0.00">
                </div>
                <div class="card">
                    <h3>Insurance Coverage</h3>
                    <input type="number" class="input" placeholder="80%">
                </div>
            </div>
            
            <div class="card">
                <h2>Estimated Out-of-Pocket</h2>
                <p style="font-size: 2rem; color: #667eea;">$0.00</p>
                <button class="button">Calculate</button>
            </div>
            
            <div class="card">
                <h2>Payment Options</h2>
                <ul>
                    <li>Payment plans available</li>
                    <li>Financial assistance programs</li>
                    <li>HSA/FSA eligible</li>
                </ul>
            </div>
        </div>
        """
        
        return self._generate_base_template(f"{patient_name}'s Cost Calculator", content)
    
    def _generate_treatment_comparison(self, context: Dict[str, Any]) -> str:
        """Generate treatment comparison tool"""
        patient_name = context.get('patient_name', 'Patient')
        
        content = f"""
        <div class="header">
            <h1>{patient_name}'s Treatment Comparison</h1>
            <p>Compare your treatment options side by side</p>
        </div>
        <div class="content">
            <div class="grid">
                <div class="card">
                    <h3>Option A</h3>
                    <input type="text" class="input" placeholder="Treatment name">
                    <textarea class="input" rows="3" placeholder="Pros"></textarea>
                    <textarea class="input" rows="3" placeholder="Cons"></textarea>
                    <input type="text" class="input" placeholder="Cost">
                </div>
                <div class="card">
                    <h3>Option B</h3>
                    <input type="text" class="input" placeholder="Treatment name">
                    <textarea class="input" rows="3" placeholder="Pros"></textarea>
                    <textarea class="input" rows="3" placeholder="Cons"></textarea>
                    <input type="text" class="input" placeholder="Cost">
                </div>
            </div>
            <button class="button" style="width: 100%; margin-top: 1rem;">
                Generate Comparison Report
            </button>
        </div>
        """
        
        return self._generate_base_template(f"{patient_name}'s Treatment Comparison", content)
    
    def _generate_educational_guide(self, context: Dict[str, Any]) -> str:
        """Generate educational guide"""
        patient_name = context.get('patient_name', 'Patient')
        condition = context.get('condition', 'Health Condition')
        
        content = f"""
        <div class="header">
            <h1>Understanding {condition}</h1>
            <p>Your personalized education guide</p>
        </div>
        <div class="content">
            <div class="card">
                <h2>What is {condition}?</h2>
                <p>This section will contain easy-to-understand information about your condition.</p>
            </div>
            
            <div class="card">
                <h2>Common Symptoms</h2>
                <ul>
                    <li>Symptom information will appear here</li>
                    <li>Based on your specific condition</li>
                </ul>
            </div>
            
            <div class="card">
                <h2>Treatment Options</h2>
                <p>Learn about available treatments and management strategies.</p>
            </div>
            
            <div class="card">
                <h2>Frequently Asked Questions</h2>
                <details>
                    <summary>How is this condition diagnosed?</summary>
                    <p>Diagnostic information will appear here.</p>
                </details>
                <details>
                    <summary>What lifestyle changes can help?</summary>
                    <p>Lifestyle recommendations will appear here.</p>
                </details>
            </div>
        </div>
        """
        
        return self._generate_base_template(f"Understanding {condition}", content)


# Global instance
template_library = TemplateLibrary()
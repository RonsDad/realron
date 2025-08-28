# Refactored Implementation Example
## Ron AI - Modern Architecture Implementation

This document provides concrete code examples showing how the refactored Ron AI system would be implemented using modern patterns and AWS healthcare services.

## 1. Enhanced Zustand Store Implementation

### Core Store Structure
```typescript
// src/store/enhanced-store.ts
import { create } from 'zustand'
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

interface RonAIEnhancedStore {
  // Healthcare Domain
  healthcare: HealthcareState
  // Agent Management  
  agents: AgentState
  // Communication
  communication: CommunicationState
  // AWS Integration
  aws: AWSState
  // UI State
  ui: UIState
}

// Healthcare slice with AWS integration
interface HealthcareState {
  patients: Patient[]
  medications: Medication[]
  providers: Provider[]
  careTeam: CareTeamMember[]
  clinicalData: ClinicalData[]
  
  // Actions
  addPatient: (patient: Patient) => Promise<void>
  updateMedication: (id: string, updates: Partial<Medication>) => Promise<void>
  optimizeMedicationCost: (patientId: string, medicationId: string) => Promise<CostOptimization>
  coordinateCare: (request: CareRequest) => Promise<CareCoordinationResult>
}

export const useRonAIStore = create<RonAIEnhancedStore>()(
  devtools(
    persist(
      subscribeWithSelector(
        immer((set, get) => ({
          healthcare: createHealthcareSlice(set, get),
          agents: createAgentSlice(set, get),
          communication: createCommunicationSlice(set, get),
          aws: createAWSSlice(set, get),
          ui: createUISlice(set, get),
        }))
      ),
      {
        name: 'ron-ai-enhanced-storage',
        partialize: (state) => ({
          healthcare: {
            patients: state.healthcare.patients,
            medications: state.healthcare.medications,
          },
          ui: {
            preferences: state.ui.preferences,
          }
        })
      }
    )
  )
)
```

### Healthcare Slice with AWS Integration
```typescript
// src/store/slices/healthcare-enhanced.ts
import { StateCreator } from 'zustand'
import { AWSHealthcareService } from '@/lib/aws/healthcare-service'

const awsHealthcare = new AWSHealthcareService()

export const createHealthcareSlice: StateCreator<
  RonAIEnhancedStore,
  [],
  [],
  HealthcareState
> = (set, get) => ({
  patients: [],
  medications: [],
  providers: [],
  careTeam: [],
  clinicalData: [],

  addPatient: async (patient: Patient) => {
    try {
      // Store in AWS HealthLake
      const healthlakeResult = await awsHealthcare.createPatientRecord(patient)
      
      // Update local state
      set((state) => {
        state.healthcare.patients.push({
          ...patient,
          healthlakeId: healthlakeResult.id
        })
      })
      
      // Trigger care team notification
      await get().communication.notifyCareTeam({
        type: 'patient_added',
        patientId: patient.id,
        message: `New patient ${patient.name} added to system`
      })
      
    } catch (error) {
      console.error('Failed to add patient:', error)
      throw error
    }
  },

  optimizeMedicationCost: async (patientId: string, medicationId: string) => {
    const patient = get().healthcare.patients.find(p => p.id === patientId)
    const medication = get().healthcare.medications.find(m => m.id === medicationId)
    
    if (!patient || !medication) {
      throw new Error('Patient or medication not found')
    }

    try {
      // Use AWS Comprehend Medical for entity extraction
      const entities = await awsHealthcare.extractMedicationEntities(medication.name)
      
      // Query insurance data from HealthLake
      const insuranceData = await awsHealthcare.getPatientInsurance(patientId)
      
      // Use AWS Bedrock for cost optimization
      const optimization = await awsHealthcare.optimizeMedicationCost({
        medication: entities,
        insurance: insuranceData,
        patientHistory: patient.medicationHistory
      })
      
      // Update medication with cost analysis
      set((state) => {
        const medIndex = state.healthcare.medications.findIndex(m => m.id === medicationId)
        if (medIndex !== -1) {
          state.healthcare.medications[medIndex].costOptimization = optimization
        }
      })
      
      return optimization
      
    } catch (error) {
      console.error('Cost optimization failed:', error)
      throw error
    }
  },

  coordinateCare: async (request: CareRequest) => {
    try {
      // Use Amazon Connect for care coordination
      const coordinationResult = await awsHealthcare.coordinateCareTeam(request)
      
      // Update care team status
      set((state) => {
        state.healthcare.careTeam.forEach(member => {
          if (request.careTeamIds.includes(member.id)) {
            member.status = 'coordinating'
            member.activeRequest = request.id
          }
        })
      })
      
      return coordinationResult
      
    } catch (error) {
      console.error('Care coordination failed:', error)
      throw error
    }
  }
})
```

## 2. Component Architecture Refactoring

### Healthcare Domain Components
```typescript
// src/components/healthcare/MedicationManager/index.tsx
import React from 'react'
import { useRonAIStore } from '@/store/enhanced-store'
import { MedicationList } from './MedicationList'
import { MedicationForm } from './MedicationForm'
import { CostOptimizer } from './CostOptimizer'

export const MedicationManager: React.FC = () => {
  const { medications, optimizeMedicationCost } = useRonAIStore(
    (state) => state.healthcare
  )
  
  return (
    <div className="medication-manager">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-2xl font-bold mb-4">Medications</h2>
          <MedicationList medications={medications} />
        </div>
        <div>
          <h2 className="text-2xl font-bold mb-4">Cost Optimization</h2>
          <CostOptimizer onOptimize={optimizeMedicationCost} />
        </div>
      </div>
    </div>
  )
}

// src/components/healthcare/MedicationManager/MedicationList.tsx
import React, { useMemo } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { MedicationCard } from './MedicationCard'

interface MedicationListProps {
  medications: Medication[]
}

export const MedicationList = React.memo<MedicationListProps>(({ medications }) => {
  const parentRef = React.useRef<HTMLDivElement>(null)
  
  const virtualizer = useVirtualizer({
    count: medications.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120,
    overscan: 5,
  })
  
  const activeMedications = useMemo(
    () => medications.filter(med => med.status === 'active'),
    [medications]
  )
  
  return (
    <div ref={parentRef} className="h-96 overflow-auto">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            <MedicationCard
              medication={activeMedications[virtualItem.index]}
            />
          </div>
        ))}
      </div>
    </div>
  )
})
```

### AWS Integration Components
```typescript
// src/components/aws/HealthLake/PatientRecords.tsx
import React, { useEffect, useState } from 'react'
import { useRonAIStore } from '@/store/enhanced-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const PatientRecords: React.FC<{ patientId: string }> = ({ patientId }) => {
  const { queryHealthLake } = useRonAIStore((state) => state.aws)
  const [records, setRecords] = useState<HealthLakeRecord[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const fetchRecords = async () => {
      try {
        setLoading(true)
        const patientRecords = await queryHealthLake({
          resourceType: 'Patient',
          id: patientId,
          include: ['Medication', 'Condition', 'Observation']
        })
        setRecords(patientRecords)
      } catch (error) {
        console.error('Failed to fetch patient records:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchRecords()
  }, [patientId, queryHealthLake])
  
  if (loading) {
    return <div className="animate-pulse">Loading patient records...</div>
  }
  
  return (
    <div className="space-y-4">
      {records.map((record) => (
        <Card key={record.id}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              {record.resourceType}
              <Badge variant="outline">{record.status}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm bg-gray-50 p-2 rounded">
              {JSON.stringify(record.resource, null, 2)}
            </pre>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
```

## 3. Backend Microservices Implementation

### Healthcare Service with AWS Integration
```python
# backend/services/healthcare/medication_service.py
from typing import List, Optional
import asyncio
from fastapi import HTTPException
from pydantic import BaseModel

from ..aws.healthcare_integration import AWSHealthcareIntegration
from ..database.repositories import MedicationRepository
from ..cache.redis_cache import RedisCache
from ..models.healthcare_models import Medication, CostOptimization

class MedicationService:
    def __init__(self):
        self.aws = AWSHealthcareIntegration()
        self.repository = MedicationRepository()
        self.cache = RedisCache()
    
    async def optimize_medication_cost(
        self, 
        patient_id: str, 
        medication_id: str
    ) -> CostOptimization:
        """Optimize medication cost using AWS healthcare services"""
        
        # Get medication and patient data
        medication = await self.repository.get_medication(medication_id)
        if not medication:
            raise HTTPException(status_code=404, detail="Medication not found")
        
        # Check cache first
        cache_key = f"cost_optimization:{patient_id}:{medication_id}"
        cached_result = await self.cache.get(cache_key)
        if cached_result:
            return CostOptimization.parse_raw(cached_result)
        
        try:
            # Extract medication entities using AWS Comprehend Medical
            entities = await self.aws.comprehend_medical.detect_entities_v2(
                Text=medication.name
            )
            
            # Get patient insurance data from HealthLake
            insurance_data = await self.aws.healthlake.search_with_get(
                ResourceType="Coverage",
                patient=patient_id
            )
            
            # Use AWS Bedrock for cost optimization analysis
            optimization_prompt = self._build_optimization_prompt(
                medication, entities, insurance_data
            )
            
            bedrock_response = await self.aws.bedrock.invoke_model(
                modelId="anthropic.claude-v2",
                body={
                    "prompt": optimization_prompt,
                    "max_tokens": 1000,
                    "temperature": 0.1
                }
            )
            
            # Parse and structure the response
            optimization = self._parse_optimization_response(bedrock_response)
            
            # Cache the result
            await self.cache.setex(
                cache_key, 
                3600,  # 1 hour cache
                optimization.json()
            )
            
            # Update medication record
            await self.repository.update_medication(
                medication_id, 
                {"cost_optimization": optimization.dict()}
            )
            
            return optimization
            
        except Exception as e:
            logger.error(f"Cost optimization failed: {str(e)}")
            raise HTTPException(
                status_code=500, 
                detail=f"Cost optimization failed: {str(e)}"
            )
    
    def _build_optimization_prompt(
        self, 
        medication: Medication, 
        entities: dict, 
        insurance_data: dict
    ) -> str:
        """Build prompt for cost optimization analysis"""
        return f"""
        Analyze the cost optimization opportunities for this medication:
        
        Medication: {medication.name}
        Dosage: {medication.dosage}
        Frequency: {medication.frequency}
        
        Medical Entities Detected: {entities}
        Insurance Coverage: {insurance_data}
        
        Please provide:
        1. Generic alternatives with cost savings
        2. Insurance coverage optimization strategies
        3. Pharmacy recommendations for best pricing
        4. Patient assistance program eligibility
        5. Prior authorization requirements and strategies
        
        Format the response as structured JSON with specific recommendations.
        """
    
    def _parse_optimization_response(self, response: dict) -> CostOptimization:
        """Parse Bedrock response into structured cost optimization"""
        # Implementation would parse the AI response and create structured data
        pass

# backend/services/healthcare/care_coordination_service.py
class CareCoordinationService:
    def __init__(self):
        self.aws = AWSHealthcareIntegration()
        self.repository = CareTeamRepository()
    
    async def coordinate_care_team(
        self, 
        patient_id: str, 
        care_request: CareRequest
    ) -> CareCoordinationResult:
        """Coordinate care team using Amazon Connect"""
        
        try:
            # Get patient data from HealthLake
            patient_data = await self.aws.healthlake.read_resource(
                "Patient", 
                patient_id
            )
            
            # Get care team members
            care_team = await self.repository.get_care_team(patient_id)
            
            # Create Amazon Connect workflow
            workflow_attributes = {
                "patient_id": patient_id,
                "patient_name": patient_data.get("name", [{}])[0].get("text", ""),
                "care_request_type": care_request.type,
                "priority": care_request.priority,
                "care_team_contacts": [
                    {
                        "name": member.name,
                        "role": member.role,
                        "phone": member.phone,
                        "email": member.email
                    }
                    for member in care_team
                ]
            }
            
            # Start Connect contact flow
            contact_response = await self.aws.connect.start_outbound_voice_contact(
                ContactFlowId=os.getenv("CARE_COORDINATION_FLOW_ID"),
                InstanceId=os.getenv("CONNECT_INSTANCE_ID"),
                DestinationPhoneNumber=care_team[0].phone,
                Attributes=workflow_attributes
            )
            
            # Create coordination record
            coordination_record = {
                "patient_id": patient_id,
                "care_request_id": care_request.id,
                "contact_id": contact_response["ContactId"],
                "status": "initiated",
                "care_team_members": [member.id for member in care_team],
                "created_at": datetime.utcnow()
            }
            
            coordination_id = await self.repository.create_coordination_record(
                coordination_record
            )
            
            return CareCoordinationResult(
                coordination_id=coordination_id,
                contact_id=contact_response["ContactId"],
                status="initiated",
                estimated_completion=datetime.utcnow() + timedelta(hours=2)
            )
            
        except Exception as e:
            logger.error(f"Care coordination failed: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Care coordination failed: {str(e)}"
            )
```

## 4. Enhanced Tool System

### Standardized Tool Framework
```python
# backend/tools/framework/healthcare_tool.py
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from enum import Enum

class ToolCategory(str, Enum):
    HEALTHCARE = "healthcare"
    COMMUNICATION = "communication"
    ANALYSIS = "analysis"
    COORDINATION = "coordination"

class AWSService(str, Enum):
    HEALTHLAKE = "healthlake"
    COMPREHEND_MEDICAL = "comprehend_medical"
    BEDROCK = "bedrock"
    CONNECT = "connect"

class ToolResult(BaseModel):
    success: bool
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)

class HealthcareTool(ABC):
    """Base class for all healthcare tools with AWS integration"""
    
    name: str
    version: str
    description: str
    category: ToolCategory
    aws_services: List[AWSService] = []
    input_schema: Dict[str, Any]
    output_schema: Dict[str, Any]
    
    def __init__(self, aws_integration: 'AWSHealthcareIntegration'):
        self.aws = aws_integration
    
    @abstractmethod
    async def execute(self, input_data: Dict[str, Any]) -> ToolResult:
        """Execute the tool with given input data"""
        pass
    
    def validate_input(self, input_data: Dict[str, Any]) -> bool:
        """Validate input data against schema"""
        try:
            jsonschema.validate(input_data, self.input_schema)
            return True
        except jsonschema.ValidationError:
            return False
    
    async def pre_execute_hook(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Hook for pre-processing input data"""
        return input_data
    
    async def post_execute_hook(self, result: ToolResult) -> ToolResult:
        """Hook for post-processing results"""
        return result

# Tool registry for automatic discovery
class ToolRegistry:
    def __init__(self):
        self._tools: Dict[str, HealthcareTool] = {}
    
    def register(self, tool: HealthcareTool):
        """Register a tool"""
        self._tools[tool.name] = tool
    
    def get_tool(self, name: str) -> Optional[HealthcareTool]:
        """Get a tool by name"""
        return self._tools.get(name)
    
    def list_tools(self, category: Optional[ToolCategory] = None) -> List[HealthcareTool]:
        """List all tools, optionally filtered by category"""
        tools = list(self._tools.values())
        if category:
            tools = [tool for tool in tools if tool.category == category]
        return tools

# Decorator for automatic tool registration
def register_healthcare_tool(registry: ToolRegistry):
    def decorator(cls):
        tool_instance = cls()
        registry.register(tool_instance)
        return cls
    return decorator
```

This refactored implementation demonstrates:

1. **Modern State Management**: Zustand with immer, persistence, and domain-specific slices
2. **Component Architecture**: Domain-driven components with performance optimizations
3. **AWS Integration**: Comprehensive healthcare service integration
4. **Microservices**: Service-oriented backend architecture
5. **Tool Framework**: Standardized, extensible tool system
6. **Performance**: Virtual scrolling, memoization, and caching strategies

The architecture provides a solid foundation for scalable, maintainable healthcare AI applications with proper separation of concerns and modern development patterns.

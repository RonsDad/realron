"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle, Clock, Brain, FileText, Edit3, Save, X } from "lucide-react"

interface ResearchStep {
  id: string
  label: string
  status: 'pending' | 'active' | 'completed'
  description?: string
  icon?: React.ComponentType<{ className?: string }>
  type?: 'normal' | 'plan' | 'outline' | 'findings' | 'final-report'
  planContent?: string
  outlineContent?: string
  findingsContent?: string
  reportContent?: string
}

interface ResearchProgressProps {
  steps: ResearchStep[]
  currentAgent?: string
  onPlanApprove?: () => void
  onPlanRevise?: (editedPlan?: string) => void
  onSendMessage?: (message: string) => void
}

export function ResearchProgressClean({ steps, currentAgent, onPlanApprove, onPlanRevise, onSendMessage }: ResearchProgressProps) {
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null)
  const [editedPlanContent, setEditedPlanContent] = useState('')
  const completedCount = steps.filter(s => s.status === 'completed').length
  const progressPercent = (completedCount / steps.length) * 100

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Brain className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-lg font-semibold">Deep Research Progress</div>
              {currentAgent && (
                <div className="text-sm text-slate-500 font-normal">
                  {currentAgent} is analyzing...
                </div>
              )}
            </div>
          </CardTitle>
          
          <div className="text-right">
            <div className="text-xl font-semibold text-slate-700">
              {completedCount}/{steps.length}
            </div>
            <div className="text-xs text-slate-500">Steps Complete</div>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="mt-4">
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {steps.map((step, index) => {
          const StepIcon = step.icon || FileText
          
          return (
            <div
              key={step.id}
              className={`relative flex items-start gap-3 p-4 rounded-lg border transition-colors ${
                step.status === 'completed' 
                  ? 'bg-green-50 border-green-200' 
                  : step.status === 'active'
                  ? 'bg-blue-50 border-blue-200'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              {/* Step indicator */}
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                step.status === 'completed' 
                  ? 'bg-green-500 text-white' 
                  : step.status === 'active'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-300 text-gray-600'
              }`}>
                {step.status === 'completed' ? (
                  <CheckCircle className="w-5 h-5" />
                ) : step.status === 'active' ? (
                  <Clock className="w-5 h-5" />
                ) : (
                  <StepIcon className="w-5 h-5" />
                )}
              </div>
              
              {/* Step content */}
              <div className="flex-1">
                <div className={`font-medium ${
                  step.status === 'completed' ? 'text-green-800' : 
                  step.status === 'active' ? 'text-blue-800' : 'text-gray-700'
                }`}>
                  {step.label}
                </div>
                
                {step.description && (
                  <div className="text-sm text-gray-600 mt-1">
                    {step.description}
                  </div>
                )}
                
                {/* Research Plan Content */}
                {step.type === 'plan' && step.planContent && (
                  <div className="mt-3">
                    {editingPlanId === step.id ? (
                      <div className="space-y-3">
                        <Textarea
                          value={editedPlanContent}
                          onChange={(e) => setEditedPlanContent(e.target.value)}
                          className="min-h-[200px] text-sm font-mono"
                          placeholder="Edit research plan..."
                        />
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              onPlanRevise?.(editedPlanContent)
                              setEditingPlanId(null)
                            }}
                          >
                            <Save className="w-3 h-3 mr-1" />
                            Save Changes
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingPlanId(null)
                              setEditedPlanContent('')
                            }}
                          >
                            <X className="w-3 h-3 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="bg-white border border-slate-200 rounded-lg p-4">
                          <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans">
                            {step.planContent}
                          </pre>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              console.log("Approve button clicked - sending message")
                              onSendMessage?.('Looks good, run it')
                            }}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            Approve & Execute
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingPlanId(step.id)
                              setEditedPlanContent(step.planContent || '')
                            }}
                          >
                            <Edit3 className="w-3 h-3 mr-1" />
                            Edit Plan
                          </Button>
                        </div>
                        
                        <p className="text-xs text-slate-500">
                          Review the research plan above. Click approve to proceed with execution.
                        </p>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Report Outline Content */}
                {step.type === 'outline' && step.outlineContent && (
                  <div className="mt-3">
                    <div className="bg-white border border-slate-200 rounded-lg p-4 max-h-96 overflow-y-auto">
                      <h4 className="font-semibold text-sm mb-2">Report Structure:</h4>
                      <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans">
                        {step.outlineContent}
                      </pre>
                    </div>
                  </div>
                )}
                
                {/* Research Findings Content */}
                {step.type === 'findings' && step.findingsContent && (
                  <div className="mt-3">
                    <div className="bg-white border border-slate-200 rounded-lg p-4 max-h-96 overflow-y-auto">
                      <h4 className="font-semibold text-sm mb-2">Research Data:</h4>
                      <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans">
                        {step.findingsContent}
                      </pre>
                    </div>
                  </div>
                )}
                
                {/* Final Report Content */}
                {step.type === 'final-report' && step.reportContent && (
                  <div className="mt-3">
                    <div className="bg-white border border-slate-200 rounded-lg p-4 max-h-96 overflow-y-auto">
                      <h4 className="font-semibold text-sm mb-2">Final Report:</h4>
                      <div className="prose prose-sm max-w-none">
                        <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans">
                          {step.reportContent}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
        
        {completedCount === steps.length && (
          <div className="text-center py-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-full font-medium">
              <CheckCircle className="w-4 h-4" />
              Research Complete
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
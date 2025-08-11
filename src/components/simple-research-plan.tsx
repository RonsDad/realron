"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FileText, CheckCircle, Edit } from "lucide-react"

interface SimpleResearchPlanProps {
  plan: string
  onApprove: () => void
  onEdit: () => void
}

export function SimpleResearchPlan({ plan, onApprove, onEdit }: SimpleResearchPlanProps) {
  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-blue-900">Research Plan</h3>
        </div>
        
        <div className="prose prose-sm max-w-none mb-4">
          <pre className="whitespace-pre-wrap text-sm text-gray-700 bg-white p-4 rounded-lg">
            {plan}
          </pre>
        </div>
        
        <div className="flex gap-3">
          <Button 
            onClick={onApprove}
            className="bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Approve & Execute
          </Button>
          <Button 
            onClick={onEdit}
            variant="outline"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Plan
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Brain, FileText, Search, CheckCircle, AlertCircle } from "lucide-react"

interface ResearchMessage {
  type: 'plan' | 'outline' | 'findings' | 'evaluation' | 'status' | 'final' | 'thought' | 'action'
  content: string
  timestamp: Date
}

interface ResearchStreamProps {
  messages: ResearchMessage[]
}

export function ResearchStream({ messages }: ResearchStreamProps) {
  const getIcon = (type: ResearchMessage['type']) => {
    switch (type) {
      case 'thought':
        return <Brain className="w-4 h-4" />
      case 'plan':
        return <FileText className="w-4 h-4" />
      case 'outline':
        return <FileText className="w-4 h-4" />
      case 'findings':
      case 'action':
        return <Search className="w-4 h-4" />
      case 'evaluation':
        return <AlertCircle className="w-4 h-4" />
      case 'final':
        return <CheckCircle className="w-4 h-4" />
      default:
        return <Brain className="w-4 h-4" />
    }
  }

  const getLabel = (type: ResearchMessage['type']) => {
    switch (type) {
      case 'thought':
        return 'Agent Thinking'
      case 'plan':
        return 'Research Plan'
      case 'outline':
        return 'Report Outline'
      case 'findings':
        return 'Research Findings'
      case 'evaluation':
        return 'Quality Check'
      case 'status':
        return 'Status Update'
      case 'action':
        return 'Agent Action'
      case 'final':
        return 'Final Report'
      default:
        return 'Update'
    }
  }

  const getColor = (type: ResearchMessage['type']) => {
    switch (type) {
      case 'thought':
        return 'border-purple-200 bg-purple-50'
      case 'plan':
        return 'border-blue-200 bg-blue-50'
      case 'outline':
        return 'border-indigo-200 bg-indigo-50'
      case 'findings':
        return 'border-green-200 bg-green-50'
      case 'evaluation':
        return 'border-yellow-200 bg-yellow-50'
      case 'final':
        return 'border-emerald-200 bg-emerald-50'
      default:
        return 'border-gray-200 bg-gray-50'
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">Deep Research Stream</h3>
      
      {messages.map((message, index) => (
        <Card key={index} className={`border ${getColor(message.type)} transition-all animate-slide-up`}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${getColor(message.type)}`}>
                {getIcon(message.type)}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">
                    {getLabel(message.type)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                
                <div className="text-sm text-gray-700">
                  {message.type === 'thought' ? (
                    <div className="italic text-purple-700">
                      {message.content}
                    </div>
                  ) : (
                    <pre className="whitespace-pre-wrap font-sans max-h-96 overflow-y-auto">
                      {message.content}
                    </pre>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
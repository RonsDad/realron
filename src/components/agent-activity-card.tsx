"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bot, BrainCircuit, CheckCircle, Clock, AlertCircle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export interface AgentActivity {
  id: string
  agentId: string
  agentName: string
  agentType: 'orchestrator' | 'worker'
  specialization?: string
  task: string
  status: 'spawned' | 'planning' | 'executing' | 'thinking' | 'completed' | 'error'
  thinking?: string
  result?: any
  timestamp: Date
  model?: string
  tokensUsed?: number
}

interface AgentActivityCardProps {
  activity: AgentActivity
  className?: string
}

export function AgentActivityCard({ activity, className }: AgentActivityCardProps) {
  const getStatusIcon = () => {
    switch (activity.status) {
      case 'spawned':
        return <Clock className="h-4 w-4 text-blue-500" />
      case 'planning':
        return <BrainCircuit className="h-4 w-4 text-purple-500 animate-pulse" />
      case 'executing':
        return <Loader2 className="h-4 w-4 text-orange-500 animate-spin" />
      case 'thinking':
        return <BrainCircuit className="h-4 w-4 text-indigo-500 animate-pulse" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
    }
  }

  const getAgentIcon = () => {
    if (activity.agentType === 'orchestrator') {
      return '👨‍✈️'
    }
    switch (activity.specialization) {
      case 'research': return '🔬'
      case 'analysis': return '📊'
      case 'clinical': return '👨‍⚕️'
      case 'frontend': return '🎨'
      case 'backend': return '⚙️'
      case 'testing': return '🧪'
      default: return '🤖'
    }
  }

  const getStatusColor = () => {
    switch (activity.status) {
      case 'spawned': return 'border-l-blue-500'
      case 'planning': return 'border-l-purple-500'
      case 'executing': return 'border-l-orange-500'
      case 'thinking': return 'border-l-indigo-500'
      case 'completed': return 'border-l-green-500'
      case 'error': return 'border-l-red-500'
    }
  }

  return (
    <Card className={cn(
      "p-4 border-l-4 transition-all hover:shadow-md",
      getStatusColor(),
      className
    )}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-start gap-3">
          <div className="text-2xl">{getAgentIcon()}</div>
          <div>
            <h4 className="font-semibold flex items-center gap-2">
              {activity.agentName}
              {getStatusIcon()}
            </h4>
            <p className="text-sm text-muted-foreground">{activity.task}</p>
            <div className="flex gap-2 mt-2">
              {activity.agentType && (
                <Badge variant="outline" className="text-xs">
                  {activity.agentType}
                </Badge>
              )}
              {activity.specialization && (
                <Badge variant="secondary" className="text-xs">
                  {activity.specialization}
                </Badge>
              )}
              {activity.model && (
                <Badge variant="outline" className="text-xs">
                  {activity.model.includes('opus') ? 'Opus 4' : 
                   activity.model.includes('sonnet-4') ? 'Sonnet 4' : 'Sonnet 3.5'}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">
            {activity.timestamp.toLocaleTimeString()}
          </p>
          {activity.tokensUsed && (
            <p className="text-xs text-muted-foreground">
              {activity.tokensUsed.toLocaleString()} tokens
            </p>
          )}
        </div>
      </div>

      {/* Thinking content */}
      {activity.thinking && (
        <div className="mt-3 p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <BrainCircuit className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs font-semibold text-muted-foreground">Agent Thinking</span>
          </div>
          <ScrollArea className="max-h-32">
            <p className="text-sm whitespace-pre-wrap">
              {activity.thinking}
            </p>
          </ScrollArea>
        </div>
      )}

      {/* Result content */}
      {activity.result && activity.status === 'completed' && (
        <div className="mt-3 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-3 w-3 text-green-600" />
            <span className="text-xs font-semibold text-green-600">Result</span>
          </div>
          <ScrollArea className="max-h-40">
            <div className="text-sm">
              {typeof activity.result === 'string' ? (
                <p className="whitespace-pre-wrap">{activity.result}</p>
              ) : (
                <pre className="text-xs overflow-x-auto">
                  {JSON.stringify(activity.result, null, 2)}
                </pre>
              )}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Error content */}
      {activity.status === 'error' && activity.result && (
        <div className="mt-3 p-3 bg-red-50 dark:bg-red-950/30 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-3 w-3 text-red-600" />
            <span className="text-xs font-semibold text-red-600">Error</span>
          </div>
          <ScrollArea className="max-h-32">
            <p className="text-sm text-red-600">
              {typeof activity.result === 'string' ? activity.result : JSON.stringify(activity.result)}
            </p>
          </ScrollArea>
        </div>
      )}
    </Card>
  )
}
"use client"

import React from "react"
import { Badge } from "@/components/ui/badge"
import { AgentActivityCard } from "@/components/agent-activity-card"

// Agent activity interface from MessageList (this is different from AgentActivityCard's interface)
interface MessageListAgentActivity {
  id: string
  type: 'search' | 'fetch' | 'analysis' | 'synthesis' | 'thinking' | 'tool'
  agent: string
  description: string
  status: 'running' | 'completed' | 'error'
  timestamp: Date
  details?: any
  progress?: number
}

// Convert MessageList AgentActivity to AgentActivityCard AgentActivity
const convertToCardActivity = (activity: MessageListAgentActivity) => ({
  id: activity.id,
  agentId: activity.agent,
  agentName: activity.agent,
  agentType: 'worker' as const,
  specialization: activity.type,
  task: activity.description,
  status: activity.status === 'running' ? 'executing' as const :
          activity.status === 'completed' ? 'completed' as const :
          'error' as const,
  thinking: undefined,
  result: activity.details,
  timestamp: activity.timestamp,
  model: undefined,
  tokensUsed: undefined
})

export interface AgentActivityFeedProps {
  agentActivities: MessageListAgentActivity[]
  orchestrationActivities: MessageListAgentActivity[]
  currentOrchestrationAgent: string | null
  isAgentOrchestrationActive: boolean
}

export const AgentActivityFeed = React.memo(function AgentActivityFeed({
  agentActivities,
  orchestrationActivities,
  currentOrchestrationAgent,
  isAgentOrchestrationActive
}: AgentActivityFeedProps) {
  // Only render if there are orchestration activities to show
  if (orchestrationActivities.length === 0) {
    return null
  }

  return (
    <div className="mb-6 space-y-3">
      <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
        <span>🤖</span>
        <span>Agent Orchestration</span>
        <Badge variant="secondary" className="ml-2">
          {orchestrationActivities.length} agent{orchestrationActivities.length !== 1 ? 's' : ''}
        </Badge>
      </h3>
      {orchestrationActivities.map(activity => (
        <AgentActivityCard 
          key={activity.id} 
          activity={convertToCardActivity(activity)} 
        />
      ))}
    </div>
  )
}, (prevProps, nextProps) => {
  // AgentActivityFeed comparison - activities array changes are significant
  const compareActivities = (a: any[], b: any[]) => {
    if (a.length !== b.length) return false
    return a.every((item, index) => 
      item.id === b[index]?.id && 
      item.status === b[index]?.status &&
      item.timestamp?.getTime() === b[index]?.timestamp?.getTime()
    )
  }
  
  return (
    prevProps.currentOrchestrationAgent === nextProps.currentOrchestrationAgent &&
    prevProps.isAgentOrchestrationActive === nextProps.isAgentOrchestrationActive &&
    compareActivities(prevProps.agentActivities, nextProps.agentActivities) &&
    compareActivities(prevProps.orchestrationActivities, nextProps.orchestrationActivities)
  )
})

export type { AgentActivityFeedProps }
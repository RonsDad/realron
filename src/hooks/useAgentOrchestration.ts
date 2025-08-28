/**
 * Agent Orchestration Hook
 * Extracted from useMessageHandler.ts to separate agent orchestration logic
 * 
 * Handles all agent orchestration functionality including:
 * - Agent state management
 * - Agent activity tracking
 * - Orchestration agent handling
 * - Agent orchestration message processing
 * - Orchestration tools execution
 */

import { useCallback } from 'react'
import { useRonAIStore } from '@/providers/ron-ai-store-provider'
import { parseSSEStream } from '@/lib/api'
import type { 
  AgentActivity, 
  AgentActivityType, 
  PendingOrchestrationTool 
} from '@/store/types'

export interface AgentOrchestrationHook {
  // State
  agentActivities: AgentActivity[]
  orchestrationActivities: AgentActivityType[]
  currentOrchestrationAgent: string | null
  isAgentOrchestrationActive: boolean
  pendingOrchestrationTools: PendingOrchestrationTool[]
  
  // Agent orchestration control
  startAgentOrchestration: (agentName?: string) => void
  stopAgentOrchestration: () => void
  resetAgentOrchestration: () => void
  
  // Activity management
  addAgentActivity: (activity: Omit<AgentActivity, 'id' | 'timestamp'>) => string
  updateAgentActivity: (id: string, updates: Partial<AgentActivity>) => void
  clearAgentActivities: () => void
  addOrchestrationActivity: (activity: AgentActivityType) => void
  clearOrchestrationActivities: () => void
  
  // Orchestration tools
  addPendingOrchestrationTool: (tool: PendingOrchestrationTool) => void
  clearPendingOrchestrationTools: () => void
  executePendingOrchestrationTools: () => Promise<void>
  
  // Utility functions
  isOrchestrationTool: (toolName: string) => boolean
  getAgentNameFromTool: (toolName: string) => string
  mapToolNameToActivityType: (toolName: string) => AgentActivity['type']
}

export const useAgentOrchestration = (): AgentOrchestrationHook => {
  const store = useRonAIStore((state) => state)

  // Helper to check if a tool is an orchestration tool - EXACT from useToolExecution
  const isOrchestrationTool = useCallback((toolName: string): boolean => {
    const orchestrationTools = [
      'execute_with_orchestrator',
      'create_orchestrator_agent', 
      'create_worker_agent',
      'execute_pipeline',
      'create_custom_pipeline',
      'send_agent_message',
      'broadcast_to_agents',
      'list_available_agents'
    ]
    return orchestrationTools.includes(toolName)
  }, [])

  // Helper to get agent name from tool name - EXACT from useToolExecution
  const getAgentNameFromTool = useCallback((toolName: string): string => {
    if (toolName.startsWith('pubmed_')) return 'Research Agent'
    if (toolName.startsWith('clinical_')) return 'Clinical Agent'
    if (toolName.startsWith('perplexity_')) return 'Analysis Agent'
    if (toolName.startsWith('web_search')) return 'Web Search Agent'
    return 'System Agent'
  }, [])

  // Helper to map tool name to activity type - EXACT from useToolExecution
  const mapToolNameToActivityType = useCallback((toolName: string): AgentActivity['type'] => {
    if (toolName.startsWith('pubmed_search')) return 'search'
    if (toolName.startsWith('pubmed_fetch')) return 'fetch'
    if (toolName.startsWith('clinical_operations')) return 'synthesis'
    if (toolName.startsWith('perplexity_')) return 'analysis'
    if (toolName.startsWith('web_search')) return 'search'
    return 'tool'
  }, [])

  // Agent orchestration control functions
  const startAgentOrchestration = useCallback((agentName?: string) => {
    store.setIsAgentOrchestrationActive(true)
    if (agentName) {
      store.setCurrentOrchestrationAgent(agentName)
    }
  }, [store])

  const stopAgentOrchestration = useCallback(() => {
    store.setIsAgentOrchestrationActive(false)
    store.setCurrentOrchestrationAgent(null)
  }, [store])

  // Reset agent orchestration - EXACT from useMessageHandler line 70-72
  const resetAgentOrchestration = useCallback(() => {
    store.setAgentActivities([])
    store.setIsAgentOrchestrationActive(false)
    store.setCurrentOrchestrationAgent(null)
  }, [store])

  // Activity management functions - EXACT from useToolExecution
  const addAgentActivity = useCallback((activity: Omit<AgentActivity, 'id' | 'timestamp'>) => {
    const newActivity: AgentActivity = {
      ...activity,
      id: `activity-${Date.now()}-${Math.random()}`,
      timestamp: new Date()
    }
    store.setAgentActivities(prev => [...prev, newActivity])
    return newActivity.id
  }, [store])

  const updateAgentActivity = useCallback((id: string, updates: Partial<AgentActivity>) => {
    store.setAgentActivities(prev => prev.map(activity => 
      activity.id === id ? { ...activity, ...updates } : activity
    ))
  }, [store])

  const clearAgentActivities = useCallback(() => {
    store.setAgentActivities([])
  }, [store])

  const addOrchestrationActivity = useCallback((activity: AgentActivityType) => {
    store.setOrchestrationActivities(prev => [...prev, activity])
  }, [store])

  const clearOrchestrationActivities = useCallback(() => {
    store.setOrchestrationActivities([])
  }, [store])

  // Orchestration tools management
  const addPendingOrchestrationTool = useCallback((tool: PendingOrchestrationTool) => {
    store.setPendingOrchestrationTools(prev => [...prev, tool])
  }, [store])

  const clearPendingOrchestrationTools = useCallback(() => {
    store.setPendingOrchestrationTools([])
  }, [store])

  // Execute orchestration tool with streaming - EXACT from useToolExecution
  const executeOrchestrationTool = useCallback(async (tool: PendingOrchestrationTool) => {
    console.log('🚀 Executing orchestration tool:', tool.name, tool.input)
    
    try {
      const response = await fetch('http://localhost:8001/execute-agent-tool-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool_name: tool.name,
          tool_input: tool.input
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      // Parse SSE stream
      for await (const event of parseSSEStream(response.body!)) {
        console.log('📡 Agent event:', event)
        
        if (event.type === 'agent_spawned') {
          const activity: AgentActivityType = {
            id: event.agent_id,
            agentId: event.agent_id,
            agentName: event.name || event.agent_id,
            agentType: event.agent_type as 'orchestrator' | 'worker',
            specialization: event.specialization,
            task: event.task,
            status: 'spawned',
            timestamp: new Date(event.timestamp),
            model: event.model
          }
          addOrchestrationActivity(activity)
        }
        
        else if (event.type === 'agent_thinking_start') {
          store.setOrchestrationActivities(prev => prev.map(a => 
            a.agentId === event.agent_id 
              ? {...a, status: 'thinking' as const}
              : a
          ))
        }
        
        else if (event.type === 'agent_thinking') {
          store.setOrchestrationActivities(prev => prev.map(a => 
            a.agentId === event.agent_id 
              ? {...a, thinking: event.cumulative || event.content}
              : a
          ))
        }
        
        else if (event.type === 'agent_status') {
          const statusMap: Record<string, AgentActivityType['status']> = {
            'planning': 'planning',
            'executing': 'executing', 
            'synthesizing': 'thinking'
          }
          store.setOrchestrationActivities(prev => prev.map(a => 
            a.agentId === event.agent_id 
              ? {...a, status: statusMap[event.status] || 'executing'}
              : a
          ))
        }
        
        else if (event.type === 'agent_tool_use') {
          // Add tool usage to the activity
          store.setToolOutputs(prev => [...prev, {
            id: `${event.agent_id}-tool-${Date.now()}`,
            toolName: `${event.agent_name}: ${event.tool_name}`,
            content: '⚙️ Executing...',
            timestamp: new Date(),
            status: 'executing'
          }])
        }
        
        else if (event.type === 'agent_completed') {
          store.setOrchestrationActivities(prev => prev.map(a => 
            a.agentId === event.agent_id 
              ? {...a, status: 'completed' as const, result: event.result}
              : a
          ))
        }
        
        else if (event.type === 'orchestrator_created' || event.type === 'worker_created') {
          // Handle agent creation results
          const result = event.result
          if (result.success) {
            store.setToolOutputs(prev => [...prev, {
              id: `created-${Date.now()}`,
              toolName: tool.name,
              content: `✅ Created ${result.name} (${result.agent_id})`,
              timestamp: new Date(),
              status: 'completed'
            }])
          }
        }
      }
    } catch (error) {
      console.error('❌ Error executing orchestration tool:', error)
      store.setToolOutputs(prev => [...prev, {
        id: `error-${Date.now()}`,
        toolName: tool.name,
        content: `❌ Error: ${error}`,
        timestamp: new Date(),
        status: 'error'
      }])
    }
  }, [store, addOrchestrationActivity])

  // Execute all pending orchestration tools - EXACT from useMessageHandler lines 331-335
  const executePendingOrchestrationTools = useCallback(async () => {
    if (store.pendingOrchestrationTools.length > 0) {
      console.log(`🎯 Executing ${store.pendingOrchestrationTools.length} orchestration tools`)
      for (const tool of store.pendingOrchestrationTools) {
        await executeOrchestrationTool(tool)
      }
      store.setPendingOrchestrationTools([])
    }
  }, [store, executeOrchestrationTool])

  return {
    // State
    agentActivities: store.agentActivities,
    orchestrationActivities: store.orchestrationActivities,
    currentOrchestrationAgent: store.currentOrchestrationAgent,
    isAgentOrchestrationActive: store.isAgentOrchestrationActive,
    pendingOrchestrationTools: store.pendingOrchestrationTools,
    
    // Agent orchestration control
    startAgentOrchestration,
    stopAgentOrchestration,
    resetAgentOrchestration,
    
    // Activity management
    addAgentActivity,
    updateAgentActivity,
    clearAgentActivities,
    addOrchestrationActivity,
    clearOrchestrationActivities,
    
    // Orchestration tools
    addPendingOrchestrationTool,
    clearPendingOrchestrationTools,
    executePendingOrchestrationTools,
    
    // Utility functions
    isOrchestrationTool,
    getAgentNameFromTool,
    mapToolNameToActivityType
  }
}
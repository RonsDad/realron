"use client"

import { useEffect, useCallback, useRef } from 'react'
import { useTimelineStore } from '@/components/agent-timeline/timeline-store'
import { 
  TimelineEvent, 
  EventType, 
  AgentType,
  AgentProfile,
  EventStatus 
} from '@/components/agent-timeline/types'

interface SSEEvent {
  type?: string
  agent?: string
  agentType?: string
  content?: any
  metadata?: any
  status?: string
  thinking?: string
  tool?: string
  result?: any
  error?: string
  timestamp?: string
}

export function useTimelineIntegration() {
  const {
    addEvent,
    addEvents,
    updateEvent,
    registerAgent,
    updateAgentStatus,
    clearEvents
  } = useTimelineStore()
  
  const eventIdMap = useRef<Map<string, string>>(new Map())
  const parallelExecutionStack = useRef<string[]>([])
  
  // Generate unique event ID
  const generateEventId = (prefix = 'event') => {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(7)}`
  }
  
  // Map SSE event types to timeline event types
  const mapEventType = (sseType: string): EventType => {
    const typeMap: Record<string, EventType> = {
      'thinking': 'thinking',
      'tool_call': 'tool_call',
      'tool_result': 'tool_result',
      'tool_output': 'tool_result',
      'agent_handoff': 'agent_handoff',
      'message': 'message',
      'error': 'error',
      'parallel_start': 'parallel_start',
      'parallel_end': 'parallel_end',
      'code_execution': 'code_execution',
      'browser_action': 'browser_action',
      'computer_use': 'computer_use',
      'mcp_call': 'mcp_call'
    }
    return typeMap[sseType] || 'message'
  }
  
  // Map agent names to types
  const mapAgentType = (agentName?: string): AgentType => {
    if (!agentName) return 'custom'
    
    const normalized = agentName.toLowerCase()
    if (normalized.includes('claude') && normalized.includes('code')) return 'claude_code'
    if (normalized.includes('clinical') || normalized.includes('ops')) return 'clinical_ops'
    if (normalized.includes('browser')) return 'browser'
    if (normalized.includes('computer')) return 'computer_use'
    if (normalized.includes('mcp')) return 'mcp_server'
    return 'custom'
  }
  
  // Register known agents
  const initializeAgents = useCallback(() => {
    const defaultAgents: AgentProfile[] = [
      {
        id: 'claude-code',
        name: 'Claude Code SDK',
        type: 'claude_code',
        status: 'idle',
        capabilities: ['code_generation', 'code_review', 'debugging', 'testing'],
        metadata: {
          icon: 'Code',
          color: 'blue',
          description: 'Advanced code generation and analysis'
        }
      },
      {
        id: 'clinical-ops',
        name: 'Clinical Operations',
        type: 'clinical_ops',
        status: 'idle',
        capabilities: ['medical_analysis', 'patient_data', 'clinical_decisions'],
        metadata: {
          icon: 'Shield',
          color: 'green',
          description: 'Clinical decision support and operations'
        }
      },
      {
        id: 'browser-agent',
        name: 'Browser Agent',
        type: 'browser',
        status: 'idle',
        capabilities: ['web_navigation', 'data_extraction', 'form_filling'],
        metadata: {
          icon: 'Globe',
          color: 'purple',
          description: 'Web automation and data extraction'
        }
      },
      {
        id: 'computer-use',
        name: 'Computer Use',
        type: 'computer_use',
        status: 'idle',
        capabilities: ['screen_capture', 'mouse_control', 'keyboard_input'],
        metadata: {
          icon: 'Monitor',
          color: 'orange',
          description: 'Direct computer control and automation'
        }
      },
      {
        id: 'mcp-servers',
        name: 'MCP Servers',
        type: 'mcp_server',
        status: 'idle',
        capabilities: ['brave_search', 'telnyx_calls', 'context_retrieval'],
        metadata: {
          icon: 'Server',
          color: 'cyan',
          description: 'Model Context Protocol integrations'
        }
      }
    ]
    
    defaultAgents.forEach(agent => registerAgent(agent))
  }, [registerAgent])
  
  // Process SSE event into timeline event
  const processSSEEvent = useCallback((sseEvent: SSEEvent): TimelineEvent | null => {
    try {
      const eventType = mapEventType(sseEvent.type || 'message')
      const agentType = mapAgentType(sseEvent.agent || sseEvent.agentType)
      const agentId = sseEvent.agent?.toLowerCase().replace(/\s+/g, '-') || agentType
      
      // Handle chain of thought events
      if (sseEvent.thinking) {
        return {
          id: generateEventId('thinking'),
          timestamp: new Date(sseEvent.timestamp || Date.now()),
          type: 'thinking',
          agentId,
          agentType,
          content: {
            text: sseEvent.thinking,
            isComplete: sseEvent.status === 'complete'
          },
          status: sseEvent.status === 'complete' ? 'completed' : 'running',
          metadata: {
            duration: 0,
            tokens: sseEvent.thinking.length
          }
        }
      }
      
      // Handle tool calls
      if (sseEvent.tool) {
        const toolEventId = generateEventId('tool')
        eventIdMap.current.set(`tool-${sseEvent.tool}`, toolEventId)
        
        return {
          id: toolEventId,
          timestamp: new Date(sseEvent.timestamp || Date.now()),
          type: 'tool_call',
          agentId,
          agentType,
          content: {
            tool: sseEvent.tool,
            args: sseEvent.content,
            status: 'calling'
          },
          status: 'running',
          metadata: {
            toolType: sseEvent.metadata?.toolType,
            parallel: sseEvent.metadata?.parallel || false
          }
        }
      }
      
      // Handle tool results
      if (sseEvent.result && sseEvent.type === 'tool_result') {
        const originalEventId = eventIdMap.current.get(`tool-${sseEvent.metadata?.tool}`)
        
        return {
          id: generateEventId('result'),
          timestamp: new Date(sseEvent.timestamp || Date.now()),
          type: 'tool_result',
          agentId,
          agentType,
          content: {
            tool: sseEvent.metadata?.tool,
            result: sseEvent.result,
            success: !sseEvent.error
          },
          parentId: originalEventId,
          status: sseEvent.error ? 'failed' : 'completed',
          metadata: {
            duration: sseEvent.metadata?.duration,
            error: sseEvent.error
          }
        }
      }
      
      // Handle parallel execution markers
      if (eventType === 'parallel_start') {
        const parallelId = generateEventId('parallel')
        parallelExecutionStack.current.push(parallelId)
        
        return {
          id: parallelId,
          timestamp: new Date(sseEvent.timestamp || Date.now()),
          type: 'parallel_start',
          agentId,
          agentType,
          content: {
            message: 'Starting parallel execution',
            taskCount: sseEvent.metadata?.taskCount
          },
          status: 'running'
        }
      }
      
      if (eventType === 'parallel_end') {
        const parallelId = parallelExecutionStack.current.pop()
        
        return {
          id: generateEventId('parallel-end'),
          timestamp: new Date(sseEvent.timestamp || Date.now()),
          type: 'parallel_end',
          agentId,
          agentType,
          content: {
            message: 'Parallel execution complete',
            results: sseEvent.content
          },
          parentId: parallelId,
          status: 'completed'
        }
      }
      
      // Handle regular messages
      return {
        id: generateEventId(eventType),
        timestamp: new Date(sseEvent.timestamp || Date.now()),
        type: eventType,
        agentId,
        agentType,
        content: sseEvent.content || sseEvent,
        status: 'completed' as EventStatus,
        metadata: sseEvent.metadata
      }
    } catch (error) {
      console.error('Error processing SSE event:', error)
      return null
    }
  }, [])
  
  // Process thinking update (for existing ThinkingBubble compatibility)
  const processThinkingUpdate = useCallback((
    thinking: string,
    agentId = 'claude-code',
    isComplete = false
  ) => {
    const event: TimelineEvent = {
      id: generateEventId('thinking'),
      timestamp: new Date(),
      type: 'thinking',
      agentId,
      agentType: mapAgentType(agentId),
      content: {
        text: thinking,
        isComplete
      },
      status: isComplete ? 'completed' : 'running'
    }
    
    addEvent(event)
    updateAgentStatus(agentId, isComplete ? 'idle' : 'thinking')
  }, [addEvent, updateAgentStatus])
  
  // Process tool output (for existing ToolOutputCard compatibility)
  const processToolOutput = useCallback((
    toolName: string,
    output: any,
    agentId = 'claude-code',
    success = true
  ) => {
    const event: TimelineEvent = {
      id: generateEventId('tool-output'),
      timestamp: new Date(),
      type: 'tool_result',
      agentId,
      agentType: mapAgentType(agentId),
      content: {
        tool: toolName,
        result: output,
        success
      },
      status: success ? 'completed' : 'failed'
    }
    
    addEvent(event)
  }, [addEvent])
  
  // Process message (for existing MessageCard compatibility)
  const processMessage = useCallback((
    role: 'user' | 'assistant',
    content: string,
    metadata?: any
  ) => {
    const agentId = role === 'user' ? 'user' : 'claude-code'
    const event: TimelineEvent = {
      id: generateEventId('message'),
      timestamp: new Date(),
      type: 'message',
      agentId,
      agentType: role === 'user' ? 'custom' : 'claude_code',
      content: {
        role,
        text: content,
        metadata
      },
      status: 'completed'
    }
    
    addEvent(event)
  }, [addEvent])
  
  // Handle SSE stream
  const handleSSEStream = useCallback((eventSource: EventSource) => {
    eventSource.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data)
        const timelineEvent = processSSEEvent(data)
        if (timelineEvent) {
          addEvent(timelineEvent)
          
          // Update agent status based on event
          if (timelineEvent.agentId) {
            const status = timelineEvent.status === 'running' ? 'executing' : 'idle'
            updateAgentStatus(timelineEvent.agentId, status)
          }
        }
      } catch (error) {
        console.error('Error handling SSE event:', error)
      }
    })
    
    eventSource.addEventListener('error', () => {
      console.error('SSE connection error')
      // Reset all agents to idle on error
      ['claude-code', 'clinical-ops', 'browser-agent', 'computer-use', 'mcp-servers']
        .forEach(agentId => updateAgentStatus(agentId, 'idle'))
    })
  }, [processSSEEvent, addEvent, updateAgentStatus])
  
  // Initialize on mount
  useEffect(() => {
    initializeAgents()
  }, [initializeAgents])
  
  return {
    processThinkingUpdate,
    processToolOutput,
    processMessage,
    processSSEEvent,
    handleSSEStream,
    clearTimeline: clearEvents
  }
}

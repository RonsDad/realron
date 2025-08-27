// Timeline Event Types and Interfaces
import { ReactNode } from 'react'

export type EventType = 
  | 'thinking' 
  | 'tool_call' 
  | 'tool_result' 
  | 'agent_handoff'
  | 'message' 
  | 'error' 
  | 'parallel_start' 
  | 'parallel_end'
  | 'code_execution'
  | 'browser_action'
  | 'computer_use'
  | 'mcp_call'

export type AgentType = 
  | 'claude_code' 
  | 'clinical_ops' 
  | 'browser' 
  | 'computer_use'
  | 'mcp_server' 
  | 'custom'

export type EventStatus = 'pending' | 'running' | 'completed' | 'failed'

export type AgentStatus = 'idle' | 'thinking' | 'executing' | 'waiting'

export interface TimelineEvent {
  id: string
  timestamp: Date
  type: EventType
  agentId: string
  agentType: AgentType
  content: any
  parentId?: string  // For nested activities
  status: EventStatus
  metadata?: EventMetadata
  isCollapsed?: boolean
  children?: TimelineEvent[]
}

export interface EventMetadata {
  duration?: number
  tokens?: number
  cost?: number
  toolName?: string
  fileName?: string
  errorMessage?: string
  screenshot?: string
  liveUrl?: string
  [key: string]: any
}

export interface AgentProfile {
  id: string
  type: AgentType
  name: string
  avatar?: string | ReactNode
  color: string  // Theme color gradient
  capabilities: string[]
  status: AgentStatus
  activeTaskCount?: number
}

export interface ParallelExecution {
  id: string
  startTime: Date
  endTime?: Date
  agents: string[]  // Agent IDs involved
  events: TimelineEvent[]
}

export interface TimelineFilters {
  agentTypes?: AgentType[]
  eventTypes?: EventType[]
  timeRange?: {
    start: Date
    end: Date
  }
  status?: EventStatus[]
  searchQuery?: string
}

export type ViewMode = 'compact' | 'detailed' | 'debug'

export interface TimelineTheme {
  // Agent type gradients
  claudeCode: string
  clinicalOps: string
  browserAgent: string
  computerUse: string
  mcpServer: string
  custom: string
  
  // Status colors
  thinking: string
  executing: string
  success: string
  error: string
  warning: string
  
  // UI colors
  background: string
  foreground: string
  border: string
  muted: string
  accent: string
}

// Agent capability definitions
export const AGENT_CAPABILITIES: Record<AgentType, string[]> = {
  claude_code: ['Code Generation', 'File Management', 'Git Operations', 'Testing'],
  clinical_ops: ['Patient Data', 'HIPAA Compliance', 'Medical Workflows', 'Diagnostics'],
  browser: ['Web Navigation', 'DOM Manipulation', 'Screenshots', 'Form Filling'],
  computer_use: ['Desktop Control', 'Application Management', 'System Operations', 'Screen Recording'],
  mcp_server: ['External APIs', 'Protocol Communication', 'Data Streaming', 'Service Integration'],
  custom: ['Dynamic Capabilities']
}

// Default theme configuration
export const DEFAULT_THEME: TimelineTheme = {
  claudeCode: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  clinicalOps: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  browserAgent: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  computerUse: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  mcpServer: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  custom: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
  
  thinking: '#9333ea',
  executing: '#3b82f6',
  success: '#10b981',
  error: '#ef4444',
  warning: '#f59e0b',
  
  background: 'rgba(255, 255, 255, 0.8)',
  foreground: '#0f172a',
  border: 'rgba(148, 163, 184, 0.3)',
  muted: '#64748b',
  accent: '#6366f1'
}

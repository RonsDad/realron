// Store types matching EXACT naming from page.tsx
// DO NOT CHANGE ANY NAMES - these must match exactly with existing state variables

import { Message, ProviderSearchData } from '@/lib/types'

// Interfaces matching EXACT component state structure from page.tsx

export interface ThinkingData {
  id: string
  content: string
  timestamp: Date
}

export interface ToolOutputData {
  id: string
  toolName: string
  content: string | object
  timestamp: Date
  status?: "pending" | "executing" | "completed" | "error"
  activityId?: string
  details?: any
}

export interface CodeFileData {
  name: string
  language: string
  content: string
}

export interface AgentActivity {
  id: string
  type: 'search' | 'fetch' | 'analysis' | 'synthesis' | 'thinking' | 'tool'
  agent: string
  description: string
  status: 'running' | 'completed' | 'error'
  timestamp: Date
  details?: any
  progress?: number
}

// This matches AgentActivityCard's AgentActivity type
export interface AgentActivityType {
  id: string
  agentId: string
  agentName: string
  agentType: 'orchestrator' | 'worker'
  specialization?: string
  task?: string
  status: 'spawned' | 'thinking' | 'planning' | 'executing' | 'completed'
  timestamp: Date
  model?: string
  thinking?: string
  result?: any
}

export interface BrowserAction {
  id: string
  type: string
  description: string
  timestamp: Date
  details?: string
  url?: string | null
  success: boolean
  screenshot?: string
}

export interface ClaudeCodeOutput {
  id: string
  result: string
  files_created: any[]
  files_modified: any[]
  console_outputs: any[]
  session: {
    session_id: string
    can_continue: boolean
    turns_used: number
  }
  timestamp: Date
}

export interface PendingOrchestrationTool {
  id: string
  name: string
  input: any
}

export interface DeepResearchMessage {
  type: 'plan' | 'final' | 'findings' | 'outline' | 'evaluation' | 'thought' | 'action'
  content: string
  agent?: string
  stage?: string
  timestamp: Date
  metadata?: {
    toolName: string
    toolInput: any
  }
}

// Connection status exactly as used in page.tsx
export type ConnectionStatus = 'connected' | 'connecting' | 'error' | 'retry'

// Chat Slice State - EXACT names from page.tsx
export interface ChatSliceState {
  messages: Message[]
  inputValue: string
  isProcessing: boolean
  currentStreamingMessage: string
  currentReasoning: string
  reasoningTokens: number
}

// Agent Slice State - EXACT names from page.tsx
export interface AgentSliceState {
  agentActivities: AgentActivity[]
  currentOrchestrationAgent: string | null
  isAgentOrchestrationActive: boolean
  orchestrationActivities: AgentActivityType[]
  pendingOrchestrationTools: PendingOrchestrationTool[]
  browserActions: BrowserAction[]
}

// Deep Research Slice State - EXACT names from page.tsx
export interface DeepResearchSliceState {
  isDeepResearch: boolean
  deepResearchSessionId: string | null
  deepResearchUserId: string | null
  deepResearchOutputs: any
  deepResearchMessages: DeepResearchMessage[]
}

// UI Slice State - EXACT names from page.tsx
export interface UISliceState {
  showCareTeam: boolean
  isOpen: boolean  // sidebar
  mounted: boolean
  showCommandMenu: boolean
  showTimeline: boolean
  providerSearchData: ProviderSearchData | null
}

// Tool Slice State - EXACT names from page.tsx
export interface ToolSliceState {
  thinkingBubbles: ThinkingData[]
  toolOutputs: ToolOutputData[]
  currentThinkingId: string | null
  codeFiles: CodeFileData[]
  codeOutput: string
  claudeCodeOutputs: ClaudeCodeOutput[]
}

// Connection Slice State - EXACT names from page.tsx
export interface ConnectionSliceState {
  connectionStatus: ConnectionStatus
  retryCount: number
  lastFailedMessage: string
}

// Combined store type
export interface RonAIStore extends 
  ChatSliceState,
  AgentSliceState,
  DeepResearchSliceState,
  UISliceState,
  ToolSliceState,
  ConnectionSliceState {
  // Chat actions - EXACT names from page.tsx
  setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void
  setInputValue: (value: string) => void
  setIsProcessing: (value: boolean) => void
  setCurrentStreamingMessage: (value: string) => void
  setCurrentReasoning: (value: string) => void
  setReasoningTokens: (value: number) => void

  // Agent actions - EXACT names from page.tsx
  setAgentActivities: (activities: AgentActivity[] | ((prev: AgentActivity[]) => AgentActivity[])) => void
  setCurrentOrchestrationAgent: (agent: string | null) => void
  setIsAgentOrchestrationActive: (value: boolean) => void
  setOrchestrationActivities: (activities: AgentActivityType[] | ((prev: AgentActivityType[]) => AgentActivityType[])) => void
  setPendingOrchestrationTools: (tools: PendingOrchestrationTool[] | ((prev: PendingOrchestrationTool[]) => PendingOrchestrationTool[])) => void
  setBrowserActions: (actions: BrowserAction[] | ((prev: BrowserAction[]) => BrowserAction[])) => void
  
  // Deep Research actions - EXACT names from page.tsx
  setIsDeepResearch: (value: boolean) => void
  setDeepResearchSessionId: (id: string | null) => void
  setDeepResearchUserId: (id: string | null) => void
  setDeepResearchOutputs: (outputs: any | ((prev: any) => any)) => void
  setDeepResearchMessages: (messages: DeepResearchMessage[] | ((prev: DeepResearchMessage[]) => DeepResearchMessage[])) => void

  // UI actions - EXACT names from page.tsx
  setShowCareTeam: (value: boolean) => void
  setIsOpen: (value: boolean) => void
  setMounted: (value: boolean) => void
  setShowCommandMenu: (value: boolean) => void
  setShowTimeline: (value: boolean) => void
  setProviderSearchData: (data: ProviderSearchData | null) => void

  // Tool actions - EXACT names from page.tsx
  setThinkingBubbles: (bubbles: ThinkingData[] | ((prev: ThinkingData[]) => ThinkingData[])) => void
  setToolOutputs: (outputs: ToolOutputData[] | ((prev: ToolOutputData[]) => ToolOutputData[])) => void
  setCurrentThinkingId: (id: string | null) => void
  setCodeFiles: (files: CodeFileData[]) => void
  setCodeOutput: (output: string) => void
  setClaudeCodeOutputs: (outputs: ClaudeCodeOutput[] | ((prev: ClaudeCodeOutput[]) => ClaudeCodeOutput[])) => void

  // Connection actions - EXACT names from page.tsx
  setConnectionStatus: (status: ConnectionStatus) => void
  setRetryCount: (count: number | ((prev: number) => number)) => void
  setLastFailedMessage: (message: string) => void
}
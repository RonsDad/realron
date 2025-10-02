// Agent slice - EXACT state names from page.tsx
import { StateCreator } from 'zustand'
import { 
  AgentSliceState, 
  RonAIStore, 
  AgentActivity, 
  AgentActivityType, 
  PendingOrchestrationTool,
  BrowserAction 
} from '../types'

export const createAgentSlice: StateCreator<
  RonAIStore,
  [],
  [],
  AgentSliceState & {
    setAgentActivities: (activities: AgentActivity[] | ((prev: AgentActivity[]) => AgentActivity[])) => void
    setCurrentOrchestrationAgent: (agent: string | null) => void
    setIsAgentOrchestrationActive: (value: boolean) => void
    setOrchestrationActivities: (activities: AgentActivityType[] | ((prev: AgentActivityType[]) => AgentActivityType[])) => void
    setPendingOrchestrationTools: (tools: PendingOrchestrationTool[] | ((prev: PendingOrchestrationTool[]) => PendingOrchestrationTool[])) => void
    setBrowserActions: (actions: BrowserAction[] | ((prev: BrowserAction[]) => BrowserAction[])) => void
  }
> = (set) => ({
  // Initial state - EXACT names from page.tsx useState declarations
  agentActivities: [],
  currentOrchestrationAgent: null,
  isAgentOrchestrationActive: false,
  orchestrationActivities: [],
  pendingOrchestrationTools: [],
  browserActions: [],

  // Actions - EXACT setter names to match page.tsx patterns
  setAgentActivities: (activities) =>
    set((state) => ({
      agentActivities: typeof activities === 'function' ? activities(state.agentActivities) : activities
    })),

  setCurrentOrchestrationAgent: (agent) => set({ currentOrchestrationAgent: agent }),
  
  setIsAgentOrchestrationActive: (value) => set({ isAgentOrchestrationActive: value }),
  
  setOrchestrationActivities: (activities) =>
    set((state) => ({
      orchestrationActivities: typeof activities === 'function' ? activities(state.orchestrationActivities) : activities
    })),

  setPendingOrchestrationTools: (tools) =>
    set((state) => ({
      pendingOrchestrationTools: typeof tools === 'function' ? tools(state.pendingOrchestrationTools) : tools
    })),

  setBrowserActions: (actions) =>
    set((state) => ({
      browserActions: typeof actions === 'function' ? actions(state.browserActions) : actions
    })),
})
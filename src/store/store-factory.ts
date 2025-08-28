// Store factory using createStore from zustand/vanilla for SSR safety
// This ensures each request gets its own store instance
import { createStore } from 'zustand/vanilla'
import { devtools, persist } from 'zustand/middleware'
import { createChatSlice } from './slices/chat'
import { createAgentSlice } from './slices/agent'
import { createDeepResearchSlice } from './slices/deepResearch'
import { createUISlice } from './slices/ui'
import { createToolSlice } from './slices/tool'
import { createConnectionSlice } from './slices/connection'
import { RonAIStore } from './types'

// Default initial state for the entire store
export const defaultInitState = {
  // Chat state
  messages: [],
  inputValue: "",
  isProcessing: false,
  currentStreamingMessage: "",
  currentReasoning: "",
  reasoningTokens: 0,
  
  // Agent state
  agentActivities: [],
  currentOrchestrationAgent: null,
  isAgentOrchestrationActive: false,
  orchestrationActivities: [],
  pendingOrchestrationTools: [],
  browserActions: [],
  
  // Deep Research state
  isDeepResearch: false,
  deepResearchSessionId: null,
  deepResearchUserId: null,
  deepResearchOutputs: null,
  deepResearchMessages: [],
  
  // UI state
  showCareTeam: false,
  isOpen: false,
  mounted: false,
  showCommandMenu: false,
  showTimeline: false,
  providerSearchData: null,
  
  // Tool state
  thinkingBubbles: [],
  toolOutputs: [],
  currentThinkingId: null,
  codeFiles: [],
  codeOutput: "",
  claudeCodeOutputs: [],
  
  // Connection state
  connectionStatus: 'connecting' as const,
  retryCount: 0,
  lastFailedMessage: "",
}

// Factory function to create a new store instance
// This is called once per request on the server and once on the client
export const createRonAIStore = (
  initState: Partial<RonAIStore> = {}
) => {
  // Merge provided initial state with defaults
  const initialState = { ...defaultInitState, ...initState }
  
  return createStore<RonAIStore>()(
    devtools(
      persist(
        (set, get, api) => ({
          // Spread initial state
          ...initialState,
          
          // Combine all slice actions
          ...createChatSlice(set, get, api),
          ...createAgentSlice(set, get, api),
          ...createDeepResearchSlice(set, get, api),
          ...createUISlice(set, get, api),
          ...createToolSlice(set, get, api),
          ...createConnectionSlice(set, get, api),
        }),
        {
          name: 'ron-ai-storage',
          // Only persist critical state that should survive page refreshes
          partialize: (state) => ({
            // Chat state
            messages: state.messages,
            
            // Deep research session
            isDeepResearch: state.isDeepResearch,
            deepResearchSessionId: state.deepResearchSessionId,
            deepResearchUserId: state.deepResearchUserId,
            deepResearchOutputs: state.deepResearchOutputs,
            deepResearchMessages: state.deepResearchMessages,
            
            // UI preferences
            isOpen: state.isOpen,
            showTimeline: state.showTimeline,
          })
        }
      ),
      {
        name: 'RonAIStore',
      }
    )
  )
}

// Export types
export type { RonAIStore } from './types'
export type RonAIStoreApi = ReturnType<typeof createRonAIStore>
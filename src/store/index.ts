// Main Zustand store - combining all slices with EXACT naming from page.tsx
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { createChatSlice } from './slices/chat'
import { createAgentSlice } from './slices/agent'
import { createDeepResearchSlice } from './slices/deepResearch'
import { createUISlice } from './slices/ui'
import { createToolSlice } from './slices/tool'
import { createConnectionSlice } from './slices/connection'
import { RonAIStore } from './types'

// Create the main store with all slices combined
// Using EXACT same naming as page.tsx to ensure zero breaking changes
export const useRonAIStore = create<RonAIStore>()(
  devtools(
    persist(
      (set, get, api) => ({
        // Combine all slices
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

// Export type for use in components
export type { RonAIStore }

// Helper selectors that match EXACT naming from page.tsx
// These can be used to maintain the same destructuring patterns

// Chat selectors
export const useChatState = () => useRonAIStore((state) => ({
  messages: state.messages,
  inputValue: state.inputValue,
  isProcessing: state.isProcessing,
  currentStreamingMessage: state.currentStreamingMessage,
  currentReasoning: state.currentReasoning,
  reasoningTokens: state.reasoningTokens,
  setMessages: state.setMessages,
  setInputValue: state.setInputValue,
  setIsProcessing: state.setIsProcessing,
  setCurrentStreamingMessage: state.setCurrentStreamingMessage,
  setCurrentReasoning: state.setCurrentReasoning,
  setReasoningTokens: state.setReasoningTokens,
}))

// Agent selectors
export const useAgentState = () => useRonAIStore((state) => ({
  agentActivities: state.agentActivities,
  currentOrchestrationAgent: state.currentOrchestrationAgent,
  isAgentOrchestrationActive: state.isAgentOrchestrationActive,
  orchestrationActivities: state.orchestrationActivities,
  pendingOrchestrationTools: state.pendingOrchestrationTools,
  browserActions: state.browserActions,
  setAgentActivities: state.setAgentActivities,
  setCurrentOrchestrationAgent: state.setCurrentOrchestrationAgent,
  setIsAgentOrchestrationActive: state.setIsAgentOrchestrationActive,
  setOrchestrationActivities: state.setOrchestrationActivities,
  setPendingOrchestrationTools: state.setPendingOrchestrationTools,
  setBrowserActions: state.setBrowserActions,
}))

// Deep Research selectors
export const useDeepResearchState = () => useRonAIStore((state) => ({
  isDeepResearch: state.isDeepResearch,
  deepResearchSessionId: state.deepResearchSessionId,
  deepResearchUserId: state.deepResearchUserId,
  deepResearchOutputs: state.deepResearchOutputs,
  deepResearchMessages: state.deepResearchMessages,
  setIsDeepResearch: state.setIsDeepResearch,
  setDeepResearchSessionId: state.setDeepResearchSessionId,
  setDeepResearchUserId: state.setDeepResearchUserId,
  setDeepResearchOutputs: state.setDeepResearchOutputs,
  setDeepResearchMessages: state.setDeepResearchMessages,
}))

// UI selectors
export const useUIState = () => useRonAIStore((state) => ({
  showCareTeam: state.showCareTeam,
  isOpen: state.isOpen,
  mounted: state.mounted,
  showCommandMenu: state.showCommandMenu,
  showTimeline: state.showTimeline,
  providerSearchData: state.providerSearchData,
  setShowCareTeam: state.setShowCareTeam,
  setIsOpen: state.setIsOpen,
  setMounted: state.setMounted,
  setShowCommandMenu: state.setShowCommandMenu,
  setShowTimeline: state.setShowTimeline,
  setProviderSearchData: state.setProviderSearchData,
}))

// Tool selectors
export const useToolState = () => useRonAIStore((state) => ({
  thinkingBubbles: state.thinkingBubbles,
  toolOutputs: state.toolOutputs,
  currentThinkingId: state.currentThinkingId,
  codeFiles: state.codeFiles,
  codeOutput: state.codeOutput,
  claudeCodeOutputs: state.claudeCodeOutputs,
  setThinkingBubbles: state.setThinkingBubbles,
  setToolOutputs: state.setToolOutputs,
  setCurrentThinkingId: state.setCurrentThinkingId,
  setCodeFiles: state.setCodeFiles,
  setCodeOutput: state.setCodeOutput,
  setClaudeCodeOutputs: state.setClaudeCodeOutputs,
}))

// Connection selectors
export const useConnectionState = () => useRonAIStore((state) => ({
  connectionStatus: state.connectionStatus,
  retryCount: state.retryCount,
  lastFailedMessage: state.lastFailedMessage,
  setConnectionStatus: state.setConnectionStatus,
  setRetryCount: state.setRetryCount,
  setLastFailedMessage: state.setLastFailedMessage,
}))
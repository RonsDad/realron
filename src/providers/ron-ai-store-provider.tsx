'use client'

// Provider component for Zustand store with Next.js App Router
// Ensures SSR safety and prevents state leaking across requests
import { type ReactNode, createContext, useRef, useContext } from 'react'
import { useStore } from 'zustand'
import { 
  type RonAIStore,
  createRonAIStore,
  defaultInitState,
  type RonAIStoreApi
} from '@/store/store-factory'

// Create context for the store
export const RonAIStoreContext = createContext<RonAIStoreApi | undefined>(
  undefined
)

// Provider props interface
export interface RonAIStoreProviderProps {
  children: ReactNode
  // Optional initial state for SSR hydration
  initialState?: Partial<RonAIStore>
}

// Provider component
export const RonAIStoreProvider = ({ 
  children,
  initialState 
}: RonAIStoreProviderProps) => {
  // Use ref to ensure store is created only once
  const storeRef = useRef<RonAIStoreApi>()
  
  if (!storeRef.current) {
    // Create store with initial state (from server or defaults)
    storeRef.current = createRonAIStore(initialState)
  }

  return (
    <RonAIStoreContext.Provider value={storeRef.current}>
      {children}
    </RonAIStoreContext.Provider>
  )
}

// Main hook to use the store with selectors
export const useRonAIStore = <T,>(
  selector: (store: RonAIStore) => T
): T => {
  const ronAIStoreContext = useContext(RonAIStoreContext)

  if (!ronAIStoreContext) {
    throw new Error(`useRonAIStore must be used within RonAIStoreProvider`)
  }

  return useStore(ronAIStoreContext, selector)
}

// Helper hooks for specific state slices (EXACT names from page.tsx)
// These match the exact destructuring patterns used in the original page.tsx

// Chat state hook
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

// Agent state hook
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

// Deep Research state hook
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

// UI state hook
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

// Tool state hook
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

// Connection state hook
export const useConnectionState = () => useRonAIStore((state) => ({
  connectionStatus: state.connectionStatus,
  retryCount: state.retryCount,
  lastFailedMessage: state.lastFailedMessage,
  setConnectionStatus: state.setConnectionStatus,
  setRetryCount: state.setRetryCount,
  setLastFailedMessage: state.setLastFailedMessage,
}))

// Export individual state getters for components that only need specific values
export const useMessages = () => useRonAIStore((state) => state.messages)
export const useIsProcessing = () => useRonAIStore((state) => state.isProcessing)
export const useIsDeepResearch = () => useRonAIStore((state) => state.isDeepResearch)
export const useConnectionStatus = () => useRonAIStore((state) => state.connectionStatus)
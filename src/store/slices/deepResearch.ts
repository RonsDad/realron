// Deep Research slice - EXACT state names from page.tsx
import { StateCreator } from 'zustand'
import { DeepResearchSliceState, RonAIStore, DeepResearchMessage } from '../types'

export const createDeepResearchSlice: StateCreator<
  RonAIStore,
  [],
  [],
  DeepResearchSliceState & {
    setIsDeepResearch: (value: boolean) => void
    setDeepResearchSessionId: (id: string | null) => void
    setDeepResearchUserId: (id: string | null) => void
    setDeepResearchOutputs: (outputs: any | ((prev: any) => any)) => void
    setDeepResearchMessages: (messages: DeepResearchMessage[] | ((prev: DeepResearchMessage[]) => DeepResearchMessage[])) => void
  }
> = (set) => ({
  // Initial state - EXACT names from page.tsx useState declarations
  isDeepResearch: false,
  deepResearchSessionId: null,
  deepResearchUserId: null,
  deepResearchOutputs: {},
  deepResearchMessages: [],

  // Actions - EXACT setter names to match page.tsx patterns
  setIsDeepResearch: (value) => set({ isDeepResearch: value }),
  
  setDeepResearchSessionId: (id) => set({ deepResearchSessionId: id }),
  
  setDeepResearchUserId: (id) => set({ deepResearchUserId: id }),
  
  setDeepResearchOutputs: (outputs) =>
    set((state) => ({
      deepResearchOutputs: typeof outputs === 'function' ? outputs(state.deepResearchOutputs) : outputs
    })),
  
  setDeepResearchMessages: (messages) =>
    set((state) => ({
      deepResearchMessages: typeof messages === 'function' ? messages(state.deepResearchMessages) : messages
    })),
})
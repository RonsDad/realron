// Chat slice - EXACT state names from page.tsx
import { StateCreator } from 'zustand'
import { Message } from '@/lib/types'
import { ChatSliceState, RonAIStore } from '../types'

export const createChatSlice: StateCreator<
  RonAIStore,
  [],
  [],
  ChatSliceState & {
    setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void
    setInputValue: (value: string) => void
    setIsProcessing: (value: boolean) => void
    setCurrentStreamingMessage: (value: string) => void
    setCurrentReasoning: (value: string) => void
    setReasoningTokens: (value: number) => void
  }
> = (set) => ({
  // Initial state - EXACT names from page.tsx useState declarations
  messages: [],
  inputValue: "",
  isProcessing: false,
  currentStreamingMessage: "",
  currentReasoning: "",
  reasoningTokens: 0,

  // Actions - EXACT setter names to match page.tsx patterns
  setMessages: (messages) =>
    set((state) => ({
      messages: typeof messages === 'function' ? messages(state.messages) : messages
    })),

  setInputValue: (value) => set({ inputValue: value }),
  
  setIsProcessing: (value) => set({ isProcessing: value }),
  
  setCurrentStreamingMessage: (value) => set({ currentStreamingMessage: value }),
  
  setCurrentReasoning: (value) => set({ currentReasoning: value }),
  
  setReasoningTokens: (value) => set({ reasoningTokens: value }),
})
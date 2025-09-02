// Connection slice - EXACT state names from page.tsx
import { StateCreator } from 'zustand'
import { ConnectionSliceState, RonAIStore, ConnectionStatus } from '../types'

export const createConnectionSlice: StateCreator<
  RonAIStore,
  [],
  [],
  ConnectionSliceState & {
    setConnectionStatus: (status: ConnectionStatus) => void
    setRetryCount: (count: number | ((prev: number) => number)) => void
    setLastFailedMessage: (message: string) => void
  }
> = (set) => ({
  // Initial state - EXACT names from page.tsx useState declarations
  connectionStatus: 'connected',
  retryCount: 0,
  lastFailedMessage: "",

  // Actions - EXACT setter names to match page.tsx patterns
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  
  setRetryCount: (count) =>
    set((state) => ({
      retryCount: typeof count === 'function' ? count(state.retryCount) : count
    })),
  
  setLastFailedMessage: (message) => set({ lastFailedMessage: message }),
})
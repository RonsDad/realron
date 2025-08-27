// UI slice - EXACT state names from page.tsx
import { StateCreator } from 'zustand'
import { UISliceState, RonAIStore } from '../types'
import { ProviderSearchData } from '@/lib/types'

export const createUISlice: StateCreator<
  RonAIStore,
  [],
  [],
  UISliceState & {
    setShowCareTeam: (value: boolean) => void
    setIsOpen: (value: boolean) => void
    setMounted: (value: boolean) => void
    setShowCommandMenu: (value: boolean) => void
    setShowTimeline: (value: boolean) => void
    setProviderSearchData: (data: ProviderSearchData | null) => void
  }
> = (set) => ({
  // Initial state - EXACT names from page.tsx useState declarations
  showCareTeam: false,
  isOpen: false,  // This is the sidebar state
  mounted: false,
  showCommandMenu: false,
  showTimeline: false,
  providerSearchData: null,

  // Actions - EXACT setter names to match page.tsx patterns
  setShowCareTeam: (value) => set({ showCareTeam: value }),
  
  setIsOpen: (value) => set({ isOpen: value }),
  
  setMounted: (value) => set({ mounted: value }),
  
  setShowCommandMenu: (value) => set({ showCommandMenu: value }),
  
  setShowTimeline: (value) => set({ showTimeline: value }),
  
  setProviderSearchData: (data) => set({ providerSearchData: data }),
})
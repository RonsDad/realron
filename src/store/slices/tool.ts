// Tool slice - EXACT state names from page.tsx
import { StateCreator } from 'zustand'
import { 
  ToolSliceState, 
  RonAIStore, 
  ThinkingData, 
  ToolOutputData, 
  CodeFileData, 
  ClaudeCodeOutput 
} from '../types'

export const createToolSlice: StateCreator<
  RonAIStore,
  [],
  [],
  ToolSliceState & {
    setThinkingBubbles: (bubbles: ThinkingData[] | ((prev: ThinkingData[]) => ThinkingData[])) => void
    setToolOutputs: (outputs: ToolOutputData[] | ((prev: ToolOutputData[]) => ToolOutputData[])) => void
    setCurrentThinkingId: (id: string | null) => void
    setCodeFiles: (files: CodeFileData[]) => void
    setCodeOutput: (output: string) => void
    setClaudeCodeOutputs: (outputs: ClaudeCodeOutput[] | ((prev: ClaudeCodeOutput[]) => ClaudeCodeOutput[])) => void
  }
> = (set) => ({
  // Initial state - EXACT names from page.tsx useState declarations
  thinkingBubbles: [],
  toolOutputs: [],
  currentThinkingId: null,
  codeFiles: [],
  codeOutput: "",
  claudeCodeOutputs: [],

  // Actions - EXACT setter names to match page.tsx patterns
  setThinkingBubbles: (bubbles) =>
    set((state) => ({
      thinkingBubbles: typeof bubbles === 'function' ? bubbles(state.thinkingBubbles) : bubbles
    })),

  setToolOutputs: (outputs) =>
    set((state) => ({
      toolOutputs: typeof outputs === 'function' ? outputs(state.toolOutputs) : outputs
    })),

  setCurrentThinkingId: (id) => set({ currentThinkingId: id }),
  
  setCodeFiles: (files) => set({ codeFiles: files }),
  
  setCodeOutput: (output) => set({ codeOutput: output }),
  
  setClaudeCodeOutputs: (outputs) =>
    set((state) => ({
      claudeCodeOutputs: typeof outputs === 'function' ? outputs(state.claudeCodeOutputs) : outputs
    })),
})
"use client"

import { useState, useEffect, useRef } from "react"

interface ComputerAgentState {
  isActive: boolean
  currentTask: string | null
  liveUrl: string | null
  sessionId: string | null
}

export function useComputerAgent() {
  const [agentState, setAgentState] = useState<ComputerAgentState>({
    isActive: false,
    currentTask: null,
    liveUrl: null,
    sessionId: null,
  })
  
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const startAgent = async (task: string, url?: string) => {
    // ONLY toggle UI visibility - NO API CALLS
    // Browser sessions are ONLY created by Claude's backend tool calls
    setAgentState({
      isActive: true,
      currentTask: task,
      liveUrl: url || null,  // USE THE URL PARAMETER IF PROVIDED!
      sessionId: null,
    })
  }

  // NO POLLING - LiveURL updates will come from Claude's backend events
  // Remove all polling logic

  const stopAgent = async () => {
    // ONLY toggle UI visibility - NO API CALLS
    // Browser sessions are managed by Claude's backend
    setAgentState({
      isActive: false,
      currentTask: null,
      liveUrl: null,
      sessionId: null,
    })
  }

  const updateTask = (task: string) => {
    setAgentState((prev) => ({
      ...prev,
      currentTask: task,
    }))
  }

  const updateUrl = (url: string) => {
    console.log('useComputerAgent - updateUrl called with:', url)
    setAgentState((prev) => {
      console.log('useComputerAgent - Previous state:', prev)
      const newState = {
        ...prev,
        liveUrl: url,
      }
      console.log('useComputerAgent - New state:', newState)
      return newState
    })
  }

  const executeTask = async (task: string) => {
    // This function should NOT be called from the UI
    // Browser tasks are ONLY executed by Claude's backend
    throw new Error('Browser tasks can only be executed by Claude')
  }

  return {
    agentState,
    startAgent,
    stopAgent,
    updateTask,
    updateUrl,
    executeTask,
  }
}

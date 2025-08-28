"use client"

import { useState, useEffect, useRef } from "react"
import { claudeAPI } from "@/lib/api"

interface ComputerAgentState {
  isActive: boolean
  currentTask: string | null
  liveUrl: string | null
  sessionId: string | null
  vncInitialized: boolean
  vncError: string | null
  isInitializingVnc: boolean
}

export function useComputerAgent() {
  const [agentState, setAgentState] = useState<ComputerAgentState>({
    isActive: false,
    currentTask: null,
    liveUrl: null,
    sessionId: null,
    vncInitialized: false,
    vncError: null,
    isInitializingVnc: false,
  })
  
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const closeVnc = async () => {
    console.log('Closing VNC session...')
    try {
      await claudeAPI.closeComputerUse()
      setAgentState(prev => ({
        ...prev,
        vncInitialized: false,
        vncError: null,
      }))
    } catch (error) {
      console.error('Failed to close VNC session:', error)
    }
  }

  // Cleanup VNC when agent becomes inactive
  useEffect(() => {
    if (!agentState.isActive && agentState.vncInitialized) {
      console.log('useComputerAgent: Agent became inactive, cleaning up VNC')
      closeVnc()
    }
  }, [agentState.isActive, agentState.vncInitialized])

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
    // Close VNC session if active
    if (agentState.vncInitialized) {
      await closeVnc()
    }
    
    // ONLY toggle UI visibility - NO API CALLS
    // Browser sessions are managed by Claude's backend
    setAgentState({
      isActive: false,
      currentTask: null,
      liveUrl: null,
      sessionId: null,
      vncInitialized: false,
      vncError: null,
      isInitializingVnc: false,
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

  const initializeVnc = async () => {
    console.log('Initializing VNC session...')
    setAgentState(prev => ({ ...prev, isInitializingVnc: true, vncError: null }))
    
    try {
      const result = await claudeAPI.initializeComputerUse()
      
      if (result.success && result.vnc_url) {
        console.log('VNC initialized successfully:', result.vnc_url)
        setAgentState(prev => ({
          ...prev,
          vncInitialized: true,
          liveUrl: result.vnc_url!,
          isInitializingVnc: false,
          vncError: null,
        }))
        return result.vnc_url
      } else {
        const error = result.error || 'Unknown VNC initialization error'
        console.error('VNC initialization failed:', error)
        setAgentState(prev => ({
          ...prev,
          vncInitialized: false,
          isInitializingVnc: false,
          vncError: error,
        }))
        return null
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'VNC initialization failed'
      console.error('VNC initialization error:', error)
      setAgentState(prev => ({
        ...prev,
        vncInitialized: false,
        isInitializingVnc: false,
        vncError: errorMsg,
      }))
      return null
    }
  }

  return {
    agentState,
    startAgent,
    stopAgent,
    updateTask,
    updateUrl,
    executeTask,
    initializeVnc,
    closeVnc,
  }
}

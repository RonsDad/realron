"use client"

import { useState, useCallback } from "react"

interface DeepResearchBrowserState {
  isActive: boolean
  liveUrl: string | null
  sessionId: string | null
  currentTask: string | null
  thoughts: string[]
  isThinking: boolean
}

export function useDeepResearchBrowser() {
  const [browserState, setBrowserState] = useState<DeepResearchBrowserState>({
    isActive: false,
    liveUrl: null,
    sessionId: null,
    currentTask: null,
    thoughts: [],
    isThinking: false,
  })

  const startBrowserSession = useCallback(async (liveUrl: string, sessionId: string, task: string) => {
    setBrowserState(prev => ({
      ...prev,
      isActive: true,
      liveUrl,
      sessionId,
      currentTask: task,
    }))
  }, [])

  const stopBrowserSession = useCallback(() => {
    setBrowserState({
      isActive: false,
      liveUrl: null,
      sessionId: null,
      currentTask: null,
      thoughts: [],
      isThinking: false,
    })
  }, [])

  const addThought = useCallback((thought: string) => {
    setBrowserState(prev => ({
      ...prev,
      thoughts: [...prev.thoughts, thought],
      isThinking: true,
    }))

    // Auto-hide thinking indicator after a delay
    setTimeout(() => {
      setBrowserState(prev => ({
        ...prev,
        isThinking: false,
      }))
    }, 3000)
  }, [])

  const clearThoughts = useCallback(() => {
    setBrowserState(prev => ({
      ...prev,
      thoughts: [],
      isThinking: false,
    }))
  }, [])

  return {
    browserState,
    startBrowserSession,
    stopBrowserSession,
    addThought,
    clearThoughts,
  }
}
/**
 * Deep Research Hook
 * Extracted from useMessageHandler - handles all deep research functionality
 * 
 * This hook manages:
 * - Deep research session creation and management
 * - Deep research message streaming and processing
 * - Deep research outputs (plan, findings, reports, etc.)
 * - Deep research message handling and state updates
 */

import { useCallback } from 'react'
import { useRonAIStore } from '@/providers/ron-ai-store-provider'
import { useShallow } from 'zustand/react/shallow'
import { claudeAPI } from '@/lib/api'
import type { Message } from '@/lib/types'
import type { DeepResearchMessage } from '@/store/types'

export interface DeepResearchStreamContext {
  fullContent: string
  setFullContent: (content: string) => void
}

export interface UseDeepResearchReturn {
  // State
  isDeepResearch: boolean
  deepResearchSessionId: string | null
  deepResearchUserId: string | null
  deepResearchOutputs: any
  deepResearchMessages: DeepResearchMessage[]
  
  // Actions
  setIsDeepResearch: (value: boolean) => void
  createOrReuseSession: () => Promise<{ sessionId: string; userId: string }>
  processDeepResearchStream: (
    stream: ReadableStream<Uint8Array>,
    messageToSend: string,
    context: DeepResearchStreamContext
  ) => Promise<void>
  resetDeepResearchSession: () => void
}

export const useDeepResearch = (): UseDeepResearchReturn => {
  // Get deep research state and actions from Zustand store
  const {
    isDeepResearch,
    deepResearchSessionId,
    deepResearchUserId,
    deepResearchOutputs,
    deepResearchMessages,
    setIsDeepResearch,
    setDeepResearchSessionId,
    setDeepResearchUserId,
    setDeepResearchOutputs,
    setDeepResearchMessages,
    setConnectionStatus,
    setCurrentStreamingMessage,
    setMessages,
    reasoningTokens,
  } = useRonAIStore(
    useShallow((state) => ({
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
      setConnectionStatus: state.setConnectionStatus,
      setCurrentStreamingMessage: state.setCurrentStreamingMessage,
      setMessages: state.setMessages,
      reasoningTokens: state.reasoningTokens,
    }))
  )

  /**
   * Create a new deep research session or reuse existing one
   */
  const createOrReuseSession = useCallback(async (): Promise<{ sessionId: string; userId: string }> => {
    let sessionId = deepResearchSessionId
    let userId = deepResearchUserId
    
    // Only create a new session if we don't have one
    if (!sessionId || !userId) {
      userId = "user_" + Math.random().toString(36).substr(2, 9)
      console.log("Creating new deep research session...")
      sessionId = await claudeAPI.createDeepResearchSession(userId)
      console.log("Session created with ID:", sessionId)
      
      // Save session info for subsequent messages
      setDeepResearchSessionId(sessionId)
      setDeepResearchUserId(userId)
    } else {
      console.log("Reusing existing session:", sessionId)
    }
    
    return { sessionId: sessionId!, userId: userId! }
  }, [deepResearchSessionId, deepResearchUserId, setDeepResearchSessionId, setDeepResearchUserId])

  /**
   * Process the deep research stream and handle all event types
   */
  const processDeepResearchStream = useCallback(async (
    stream: ReadableStream<Uint8Array>,
    messageToSend: string,
    context: DeepResearchStreamContext
  ): Promise<void> => {
    // Set connected status for deep research
    setConnectionStatus('connected')
    
    console.log("Deep research stream received:", stream)
    
    if (!stream) {
      throw new Error("Failed to get stream from deep research API")
    }
    
    let fullContent = ""
    let fullReasoning = ""
    console.log("Starting deep research SSE stream...")
    
    const reader = stream.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim()
            if (data && data !== '[DONE]') {
              try {
                const event = JSON.parse(data)
                
                // Extract content from deep research format
                if (event.content?.parts) {
                  for (const part of event.content.parts) {
                    if (part.text) {
                      // Direct text content from backend
                      fullContent = part.text
                      setCurrentStreamingMessage(fullContent)
                      // Update context for parent function
                      context.setFullContent(fullContent)
                    }
                  }
                }
                
                // Handle state delta updates (research plan, final report, etc)
                if (event.actions?.stateDelta) {
                  const stateDelta = event.actions.stateDelta
                  
                  if (stateDelta.research_plan) {
                    setDeepResearchOutputs((prev: any) => ({
                      ...prev,
                      plan: stateDelta.research_plan
                    }))
                    // Don't show plan in message bubble, show in research component
                    fullContent = "Creating research plan..."
                    setCurrentStreamingMessage(fullContent)
                    context.setFullContent(fullContent)
                    setDeepResearchMessages(prev => [...prev, {
                      type: 'plan',
                      content: stateDelta.research_plan,
                      timestamp: new Date()
                    }])
                  }
                  
                  if (stateDelta.final_report_with_citations) {
                    setDeepResearchOutputs((prev: any) => ({
                      ...prev,
                      finalReport: stateDelta.final_report_with_citations
                    }))
                    // Show completion message
                    fullContent = "Research complete! See the detailed report below."
                    setCurrentStreamingMessage(fullContent)
                    context.setFullContent(fullContent)
                    setDeepResearchMessages(prev => [...prev, {
                      type: 'final',
                      content: stateDelta.final_report_with_citations,
                      timestamp: new Date()
                    }])
                  }
                  
                  if (stateDelta.section_research_findings) {
                    setDeepResearchOutputs((prev: any) => ({
                      ...prev,
                      findings: stateDelta.section_research_findings
                    }))
                    setDeepResearchMessages(prev => [...prev, {
                      type: 'findings',
                      content: stateDelta.section_research_findings,
                      timestamp: new Date()
                    }])
                  }
                  
                  if (stateDelta.report_sections) {
                    setDeepResearchOutputs((prev: any) => ({
                      ...prev,
                      outline: stateDelta.report_sections
                    }))
                    setDeepResearchMessages(prev => [...prev, {
                      type: 'outline',
                      content: stateDelta.report_sections,
                      timestamp: new Date()
                    }])
                  }
                  
                  if (stateDelta.research_evaluation) {
                    setDeepResearchOutputs((prev: any) => ({
                      ...prev,
                      evaluation: stateDelta.research_evaluation
                    }))
                    setDeepResearchMessages(prev => [...prev, {
                      type: 'evaluation',
                      content: JSON.stringify(stateDelta.research_evaluation),
                      timestamp: new Date()
                    }])
                  }
                  
                  if (stateDelta.sources) {
                    setDeepResearchOutputs((prev: any) => ({
                      ...prev,
                      sources: stateDelta.sources
                    }))
                  }
                }
                
                // Track agent author for current agent display
                if (event.author && event.author !== 'unknown') {
                  // Add thought messages for agent thinking
                  if (event.content?.parts) {
                    for (const part of event.content.parts) {
                      if (part.text) {
                        setDeepResearchMessages(prev => [...prev, {
                          type: 'thought',
                          content: part.text,
                          agent: event.author,
                          stage: event.stage || 'research',
                          timestamp: new Date()
                        }])
                      }
                    }
                  }
                }
                
                // Track tool usage for transparency
                if (event.tool_use) {
                  setDeepResearchMessages(prev => [...prev, {
                    type: 'action',
                    content: `Using ${event.tool_use.name}: ${event.tool_use.input?.task || event.tool_use.input?.query || 'Processing...'}`,
                    agent: event.author || 'unknown',
                    metadata: {
                      toolName: event.tool_use.name,
                      toolInput: event.tool_use.input
                    },
                    timestamp: new Date()
                  }])
                }
                
                // Update the assistant message
                setMessages(prev => {
                  const newMessages = [...prev]
                  if (newMessages.length > 0 && newMessages[newMessages.length - 1].role === "assistant") {
                    newMessages[newMessages.length - 1] = {
                      ...newMessages[newMessages.length - 1],
                      content: fullContent,
                      reasoning: fullReasoning,
                      reasoningTokens: reasoningTokens
                    }
                  }
                  return newMessages
                })
              } catch (e) {
                console.error('Failed to parse deep research SSE data:', e)
              }
            }
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  }, [
    setConnectionStatus,
    setCurrentStreamingMessage,
    setDeepResearchOutputs,
    setDeepResearchMessages,
    setMessages,
    reasoningTokens
  ])

  /**
   * Reset the deep research session (for starting fresh)
   */
  const resetDeepResearchSession = useCallback(() => {
    setDeepResearchSessionId(null)
    setDeepResearchUserId(null)
    setDeepResearchOutputs({})
    setDeepResearchMessages([])
  }, [setDeepResearchSessionId, setDeepResearchUserId, setDeepResearchOutputs, setDeepResearchMessages])

  return {
    // State
    isDeepResearch,
    deepResearchSessionId,
    deepResearchUserId,
    deepResearchOutputs,
    deepResearchMessages,
    
    // Actions
    setIsDeepResearch,
    createOrReuseSession,
    processDeepResearchStream,
    resetDeepResearchSession,
  }
}
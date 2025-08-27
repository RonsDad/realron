"use client"

import React, { useEffect } from 'react'
import { useTimelineIntegration } from '@/hooks/use-timeline-integration'

interface TimelineAdapterProps {
  children: React.ReactNode
}

/**
 * Migration adapter component that bridges existing components with the new timeline system.
 * This allows gradual migration while maintaining backward compatibility.
 */
export function TimelineAdapter({ children }: TimelineAdapterProps) {
  const { 
    processThinkingUpdate, 
    processToolOutput, 
    processMessage 
  } = useTimelineIntegration()
  
  useEffect(() => {
    // Set up global event listeners for existing components
    
    // Listen for thinking events from existing ThinkingBubble
    const handleThinkingEvent = (event: CustomEvent) => {
      processThinkingUpdate(
        event.detail.text,
        event.detail.agentId || 'claude-code',
        event.detail.isComplete || false
      )
    }
    
    // Listen for tool output events from existing ToolOutputCard
    const handleToolOutputEvent = (event: CustomEvent) => {
      processToolOutput(
        event.detail.tool,
        event.detail.output,
        event.detail.agentId || 'claude-code',
        event.detail.success !== false
      )
    }
    
    // Listen for message events from existing MessageCard
    const handleMessageEvent = (event: CustomEvent) => {
      processMessage(
        event.detail.role,
        event.detail.content,
        event.detail.metadata
      )
    }
    
    // Add event listeners
    window.addEventListener('thinking-update', handleThinkingEvent as EventListener)
    window.addEventListener('tool-output', handleToolOutputEvent as EventListener)
    window.addEventListener('message-display', handleMessageEvent as EventListener)
    
    // Cleanup
    return () => {
      window.removeEventListener('thinking-update', handleThinkingEvent as EventListener)
      window.removeEventListener('tool-output', handleToolOutputEvent as EventListener)
      window.removeEventListener('message-display', handleMessageEvent as EventListener)
    }
  }, [processThinkingUpdate, processToolOutput, processMessage])
  
  return <>{children}</>
}

/**
 * Helper function to emit events that the timeline adapter will capture
 */
export function emitTimelineEvent(type: string, detail: any) {
  window.dispatchEvent(new CustomEvent(type, { detail }))
}

/**
 * Updated ThinkingBubble that emits timeline events
 */
export function useThinkingEmitter() {
  return {
    emitThinking: (text: string, isComplete = false, agentId = 'claude-code') => {
      emitTimelineEvent('thinking-update', { text, isComplete, agentId })
    }
  }
}

/**
 * Updated ToolOutput emitter
 */
export function useToolOutputEmitter() {
  return {
    emitToolOutput: (tool: string, output: any, success = true, agentId = 'claude-code') => {
      emitTimelineEvent('tool-output', { tool, output, success, agentId })
    }
  }
}

/**
 * Updated Message emitter
 */
export function useMessageEmitter() {
  return {
    emitMessage: (role: 'user' | 'assistant', content: string, metadata?: any) => {
      emitTimelineEvent('message-display', { role, content, metadata })
    }
  }
}

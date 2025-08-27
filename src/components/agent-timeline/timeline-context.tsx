"use client"

import React, { createContext, useContext, useEffect, ReactNode } from 'react'
import { useTimelineStore } from './timeline-store'
import { TimelineEvent, AgentProfile } from './types'

interface TimelineContextValue {
  addEvent: (event: TimelineEvent) => void
  registerAgent: (agent: AgentProfile) => void
  updateAgentStatus: (id: string, status: AgentProfile['status']) => void
}

const TimelineContext = createContext<TimelineContextValue | null>(null)

export function TimelineProvider({ children }: { children: ReactNode }) {
  const { addEvent, registerAgent, updateAgentStatus } = useTimelineStore()
  
  // Set up event listeners for global events
  useEffect(() => {
    // Listen for events from the backend SSE stream
    const handleTimelineEvent = (event: CustomEvent<TimelineEvent>) => {
      addEvent(event.detail)
    }
    
    const handleAgentRegistration = (event: CustomEvent<AgentProfile>) => {
      registerAgent(event.detail)
    }
    
    const handleAgentStatusUpdate = (event: CustomEvent<{ id: string; status: AgentProfile['status'] }>) => {
      updateAgentStatus(event.detail.id, event.detail.status)
    }
    
    // Add event listeners
    window.addEventListener('timeline:event', handleTimelineEvent as any)
    window.addEventListener('timeline:agent:register', handleAgentRegistration as any)
    window.addEventListener('timeline:agent:status', handleAgentStatusUpdate as any)
    
    // Cleanup
    return () => {
      window.removeEventListener('timeline:event', handleTimelineEvent as any)
      window.removeEventListener('timeline:agent:register', handleAgentRegistration as any)
      window.removeEventListener('timeline:agent:status', handleAgentStatusUpdate as any)
    }
  }, [addEvent, registerAgent, updateAgentStatus])
  
  const value = {
    addEvent,
    registerAgent,
    updateAgentStatus
  }
  
  return (
    <TimelineContext.Provider value={value}>
      {children}
    </TimelineContext.Provider>
  )
}

export function useTimeline() {
  const context = useContext(TimelineContext)
  if (!context) {
    throw new Error('useTimeline must be used within a TimelineProvider')
  }
  return context
}

// Helper function to emit timeline events from anywhere in the app
export function emitTimelineEvent(event: TimelineEvent) {
  window.dispatchEvent(new CustomEvent('timeline:event', { detail: event }))
}

export function emitAgentRegistration(agent: AgentProfile) {
  window.dispatchEvent(new CustomEvent('timeline:agent:register', { detail: agent }))
}

export function emitAgentStatusUpdate(id: string, status: AgentProfile['status']) {
  window.dispatchEvent(new CustomEvent('timeline:agent:status', { 
    detail: { id, status } 
  }))
}

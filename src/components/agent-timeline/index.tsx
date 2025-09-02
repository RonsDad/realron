"use client"

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { TimelineProvider } from './timeline-context'
import { TimelineItem } from './timeline-item'
import { TimelineFilters } from './timeline-filters'
import { ActiveAgentsPanel } from '../agent-status/active-agents-panel'
import { ParallelExecutionView } from '../agent-activities/parallel-execution'
import { 
  TimelineEvent, 
  AgentProfile, 
  TimelineFilters as ITimelineFilters,
  ViewMode,
  EventType,
  AgentType
} from './types'
import { useTimelineStore } from './timeline-store'
import { 
  Maximize2, 
  Minimize2, 
  Download, 
  Share2, 
  Layers,
  Sparkles,
  Filter
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'

interface AgentTimelineProps {
  className?: string
  maxHeight?: string
  showActiveAgents?: boolean
  autoScroll?: boolean
  onClose?: () => void
}

export function AgentTimeline({ 
  className,
  maxHeight = '600px',
  showActiveAgents = true,
  autoScroll = true,
  onClose
}: AgentTimelineProps) {
  const {
    events,
    agents,
    filters,
    viewMode,
    addEvent,
    filteredEvents,
    activeAgents,
    parallelExecutions,
    setFilters,
    setViewMode,
    clearEvents
  } = useTimelineStore()
  
  const [isExpanded, setIsExpanded] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const scrollRef = React.useRef<HTMLDivElement>(null)
  
  // REMOVED: Auto-scroll behavior - user controls scrolling
  
  // Group consecutive events by agent for better visualization
  const groupedEvents = useMemo(() => {
    const groups: Array<{
      agentId: string
      agentProfile: AgentProfile | undefined
      events: TimelineEvent[]
      isParallel: boolean
    }> = []
    
    let currentGroup: typeof groups[0] | null = null
    
    filteredEvents.forEach((event) => {
      const isParallelEvent = event.type === 'parallel_start' || event.type === 'parallel_end'
      
      if (!currentGroup || currentGroup.agentId !== event.agentId || isParallelEvent) {
        if (currentGroup) {
          groups.push(currentGroup)
        }
        currentGroup = {
          agentId: event.agentId,
          agentProfile: agents.get(event.agentId),
          events: [event],
          isParallel: isParallelEvent
        }
      } else {
        currentGroup.events.push(event)
      }
    })
    
    if (currentGroup) {
      groups.push(currentGroup)
    }
    
    return groups
  }, [filteredEvents, agents])
  
  const handleExport = useCallback((format: 'json' | 'csv') => {
    const data = format === 'json' 
      ? JSON.stringify(filteredEvents, null, 2)
      : convertToCSV(filteredEvents)
    
    const blob = new Blob([data], { type: format === 'json' ? 'application/json' : 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `agent-timeline.${format}`
    a.click()
    URL.revokeObjectURL(url)
  }, [filteredEvents])
  
  const handleShare = useCallback(async () => {
    const url = `${window.location.origin}/timeline/${generateShareId()}`
    await navigator.clipboard.writeText(url)
    // TODO: Show toast notification
  }, [])
  
  return (
    <TimelineProvider>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "relative rounded-2xl overflow-hidden",
          "bg-white/80 dark:bg-gray-900/80",
          "backdrop-blur-xl backdrop-saturate-150",
          "border border-gray-200/50 dark:border-gray-700/50",
          "shadow-2xl shadow-black/5 dark:shadow-black/20",
          isExpanded && "fixed inset-4 z-50",
          className
        )}
      >
        {/* Glassmorphism background effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5 pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-gradient-radial from-indigo-500/20 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-gradient-radial from-purple-500/20 to-transparent rounded-full blur-3xl pointer-events-none" />
        
        {/* Header */}
        <div className="relative px-6 py-4 border-b border-gray-200/50 dark:border-gray-700/50 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg"
              >
                <Sparkles className="w-5 h-5 text-white" />
              </motion.div>
              <div>
                <h2 className="text-lg font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Agent Timeline
                </h2>
                <p className="text-xs text-muted-foreground">
                  {filteredEvents.length} events • {activeAgents.length} active
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 p-1 rounded-lg bg-gray-100 dark:bg-gray-800">
                {(['compact', 'detailed', 'debug'] as ViewMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={cn(
                      "px-3 py-1 text-xs font-medium rounded-md transition-all",
                      viewMode === mode
                        ? "bg-white dark:bg-gray-700 shadow-sm text-indigo-600 dark:text-indigo-400"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                    )}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                ))}
              </div>
              
              {/* Action Buttons */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  "relative",
                  showFilters && "text-indigo-600 dark:text-indigo-400"
                )}
              >
                <Filter className="w-4 h-4" />
                {Object.keys(filters).length > 0 && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-indigo-600 rounded-full" />
                )}
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleExport('json')}
              >
                <Download className="w-4 h-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={handleShare}
              >
                <Share2 className="w-4 h-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
          
          {/* Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-4 overflow-hidden"
              >
                <TimelineFilters
                  filters={filters}
                  onChange={setFilters}
                  onClear={() => setFilters({})}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <div className="relative flex">
          {/* Main Timeline */}
          <div className="flex-1">
            <ScrollArea 
              ref={scrollRef}
              className="w-full"
              style={{ height: isExpanded ? 'calc(100vh - 200px)' : maxHeight }}
            >
              <div className="p-6 space-y-4">
                <AnimatePresence mode="popLayout">
                  {groupedEvents.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center justify-center py-12 text-center"
                    >
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center mb-4">
                        <Layers className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
                        No events yet
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Agent activities will appear here
                      </p>
                    </motion.div>
                  ) : (
                    groupedEvents.map((group, index) => (
                      <motion.div
                        key={`${group.agentId}-${index}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.05 }}
                        className="relative"
                      >
                        {/* Agent header for grouped events */}
                        {group.agentProfile && (
                          <div className="flex items-center gap-2 mb-2">
                            <div 
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-lg"
                              style={{ background: group.agentProfile.color }}
                            >
                              {group.agentProfile.name.charAt(0)}
                            </div>
                            <div className="flex-1">
                              <h4 className="text-sm font-medium">
                                {group.agentProfile.name}
                              </h4>
                              <p className="text-xs text-muted-foreground">
                                {group.events.length} {group.events.length === 1 ? 'action' : 'actions'}
                              </p>
                            </div>
                          </div>
                        )}
                        
                        {/* Events */}
                        <div className="ml-10 space-y-2">
                          {group.isParallel ? (
                            <ParallelExecutionView 
                              events={group.events}
                              agents={activeAgents}
                            />
                          ) : (
                            group.events.map((event) => (
                              <TimelineItem
                                key={event.id}
                                event={event}
                                agent={group.agentProfile}
                                viewMode={viewMode}
                                isLast={index === groupedEvents.length - 1}
                              />
                            ))
                          )}
                        </div>
                        
                        {/* Connection line to next group */}
                        {index < groupedEvents.length - 1 && (
                          <div className="absolute left-[19px] top-full w-0.5 h-4 bg-gradient-to-b from-gray-300 to-transparent dark:from-gray-600" />
                        )}
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </ScrollArea>
          </div>
          
          {/* Active Agents Panel */}
          {showActiveAgents && activeAgents.length > 0 && (
            <div className="w-80 border-l border-gray-200/50 dark:border-gray-700/50">
              <ActiveAgentsPanel agents={activeAgents} />
            </div>
          )}
        </div>
      </motion.div>
    </TimelineProvider>
  )
}

// Helper function to convert events to CSV
function convertToCSV(events: TimelineEvent[]): string {
  const headers = ['Timestamp', 'Agent', 'Type', 'Status', 'Content']
  const rows = events.map(e => [
    e.timestamp.toISOString(),
    e.agentId,
    e.type,
    e.status,
    JSON.stringify(e.content)
  ])
  return [headers, ...rows].map(row => row.join(',')).join('\n')
}

// Helper function to generate share ID
function generateShareId(): string {
  return Math.random().toString(36).substring(2, 15)
}

export default AgentTimeline

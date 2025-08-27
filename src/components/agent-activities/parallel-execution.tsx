"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { TimelineEvent, AgentProfile } from '../agent-timeline/types'
import { TimelineItem } from '../agent-timeline/timeline-item'
import { GitBranch, GitMerge, Zap } from 'lucide-react'

interface ParallelExecutionViewProps {
  events: TimelineEvent[]
  agents: AgentProfile[]
  className?: string
}

export function ParallelExecutionView({ 
  events, 
  agents,
  className 
}: ParallelExecutionViewProps) {
  // Group events by agent
  const eventsByAgent = new Map<string, TimelineEvent[]>()
  events.forEach(event => {
    const agentEvents = eventsByAgent.get(event.agentId) || []
    agentEvents.push(event)
    eventsByAgent.set(event.agentId, agentEvents)
  })
  
  const parallelAgents = Array.from(eventsByAgent.keys())
  const agentProfiles = parallelAgents.map(id => 
    agents.find(a => a.id === id)
  ).filter(Boolean) as AgentProfile[]
  
  return (
    <div className={cn("relative", className)}>
      {/* Parallel Execution Header */}
      <div className="flex items-center gap-2 mb-3 p-3 rounded-lg bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 border border-purple-200 dark:border-purple-800/50">
        <GitBranch className="w-4 h-4 text-purple-600 dark:text-purple-400" />
        <span className="text-sm font-medium text-purple-900 dark:text-purple-100">
          Parallel Execution
        </span>
        <span className="text-xs text-purple-700 dark:text-purple-300">
          {parallelAgents.length} agents running simultaneously
        </span>
      </div>
      
      {/* Parallel Lanes */}
      <div className="relative flex gap-4">
        {/* Branch Lines */}
        <svg 
          className="absolute inset-0 pointer-events-none"
          preserveAspectRatio="none"
          style={{ width: '100%', height: '100%' }}
        >
          <defs>
            <linearGradient id="branch-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgb(147 51 234)" stopOpacity="0.3" />
              <stop offset="50%" stopColor="rgb(147 51 234)" stopOpacity="0.5" />
              <stop offset="100%" stopColor="rgb(147 51 234)" stopOpacity="0.3" />
            </linearGradient>
          </defs>
          
          {/* Draw branch lines */}
          {agentProfiles.map((agent, idx) => {
            const x = (idx + 0.5) * (100 / agentProfiles.length)
            return (
              <line
                key={agent.id}
                x1={`${x}%`}
                y1="0"
                x2={`${x}%`}
                y2="100%"
                stroke="url(#branch-gradient)"
                strokeWidth="2"
                strokeDasharray="4 4"
                className="animate-pulse"
              />
            )
          })}
        </svg>
        
        {/* Agent Lanes */}
        {agentProfiles.map((agent, idx) => {
          const agentEvents = eventsByAgent.get(agent.id) || []
          
          return (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="flex-1 relative"
            >
              {/* Agent Header */}
              <div className="mb-2 p-2 rounded-lg bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-6 h-6 rounded-md flex items-center justify-center text-white text-xs font-bold"
                    style={{ background: agent.color }}
                  >
                    {agent.name.charAt(0)}
                  </div>
                  <span className="text-xs font-medium truncate">
                    {agent.name}
                  </span>
                </div>
              </div>
              
              {/* Agent Events */}
              <div className="space-y-2">
                {agentEvents.map((event, eventIdx) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: (idx * 0.1) + (eventIdx * 0.05) }}
                  >
                    <div className="p-2 rounded-lg bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm border border-gray-200/30 dark:border-gray-700/30">
                      <div className="text-xs">
                        <div className="flex items-center gap-1 mb-1">
                          <Zap className="w-3 h-3 text-indigo-500" />
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {event.type.replace(/_/g, ' ')}
                          </span>
                        </div>
                        {event.content && (
                          <p className="text-muted-foreground line-clamp-2">
                            {typeof event.content === 'string' 
                              ? event.content 
                              : JSON.stringify(event.content).substring(0, 50)}
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )
        })}
      </div>
      
      {/* Merge Point */}
      <div className="mt-4 flex items-center gap-2 p-3 rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border border-indigo-200 dark:border-indigo-800/50">
        <GitMerge className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
        <span className="text-sm font-medium text-indigo-900 dark:text-indigo-100">
          Execution Complete
        </span>
        <span className="text-xs text-indigo-700 dark:text-indigo-300">
          Results merged
        </span>
      </div>
    </div>
  )
}

export default ParallelExecutionView

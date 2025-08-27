"use client"

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { AgentProfile } from '../agent-timeline/types'
import {
  Brain,
  Code,
  Globe,
  Monitor,
  Server,
  Shield,
  Activity,
  Cpu,
  Zap,
  Clock,
  CheckCircle
} from 'lucide-react'
import { Progress } from '@/components/ui/progress'

interface ActiveAgentsPanelProps {
  agents: AgentProfile[]
  className?: string
}

export function ActiveAgentsPanel({ 
  agents,
  className 
}: ActiveAgentsPanelProps) {
  const getAgentIcon = (type: AgentProfile['type']) => {
    const icons = {
      claude_code: Code,
      clinical_ops: Shield,
      browser: Globe,
      computer_use: Monitor,
      mcp_server: Server,
      custom: Brain
    }
    return icons[type] || Brain
  }
  
  const getStatusColor = (status: AgentProfile['status']) => {
    const colors = {
      idle: 'text-gray-400',
      thinking: 'text-purple-500',
      executing: 'text-blue-500',
      waiting: 'text-amber-500'
    }
    return colors[status] || 'text-gray-400'
  }
  
  const getStatusText = (status: AgentProfile['status']) => {
    const texts = {
      idle: 'Ready',
      thinking: 'Processing...',
      executing: 'Running tasks',
      waiting: 'Awaiting response'
    }
    return texts[status] || status
  }
  
  return (
    <div className={cn("h-full p-4 bg-gray-50/50 dark:bg-gray-900/50", className)}>
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Activity className="w-4 h-4" />
          Active Agents
          <span className="ml-auto text-xs font-normal text-muted-foreground">
            {agents.length} running
          </span>
        </h3>
      </div>
      
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {agents.map((agent) => {
            const Icon = getAgentIcon(agent.type)
            const isActive = agent.status !== 'idle'
            
            return (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, scale: 0.9, x: -20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.9, x: 20 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  "relative p-3 rounded-xl transition-all",
                  "bg-white dark:bg-gray-800 backdrop-blur-sm",
                  "border border-gray-200/50 dark:border-gray-700/50",
                  isActive && "ring-2 ring-indigo-500/20"
                )}
              >
                {/* Agent Header */}
                <div className="flex items-start gap-3">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center shadow-md"
                    style={{ 
                      background: agent.color,
                      boxShadow: `0 4px 14px 0 ${agent.color}30`
                    }}
                  >
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {agent.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={cn(
                        "flex items-center gap-1 text-xs",
                        getStatusColor(agent.status)
                      )}>
                        {agent.status === 'thinking' && (
                          <Brain className="w-3 h-3 animate-pulse" />
                        )}
                        {agent.status === 'executing' && (
                          <Zap className="w-3 h-3 animate-pulse" />
                        )}
                        {agent.status === 'waiting' && (
                          <Clock className="w-3 h-3 animate-pulse" />
                        )}
                        {agent.status === 'idle' && (
                          <CheckCircle className="w-3 h-3" />
                        )}
                        {getStatusText(agent.status)}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Active Tasks */}
                {agent.activeTaskCount && agent.activeTaskCount > 0 && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Active tasks</span>
                      <span className="font-medium">{agent.activeTaskCount}</span>
                    </div>
                    <Progress value={75} className="h-1" />
                  </div>
                )}
                
                {/* Capabilities */}
                {agent.capabilities.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {agent.capabilities.slice(0, 3).map((cap, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                      >
                        {cap}
                      </span>
                    ))}
                    {agent.capabilities.length > 3 && (
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                        +{agent.capabilities.length - 3}
                      </span>
                    )}
                  </div>
                )}
                
                {/* Resource Usage Indicator */}
                {isActive && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Cpu className="w-3 h-3 text-gray-400" />
                        <span className="text-muted-foreground">Resource usage</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <div
                              key={i}
                              className={cn(
                                "w-1 h-3 rounded-sm",
                                i <= 3
                                  ? "bg-green-500"
                                  : "bg-gray-300 dark:bg-gray-600"
                              )}
                            />
                          ))}
                        </div>
                        <span className="text-muted-foreground">Low</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Activity Pulse Animation */}
                {isActive && (
                  <div className="absolute -inset-px rounded-xl pointer-events-none">
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500/20 to-purple-500/20 animate-pulse" />
                  </div>
                )}
              </motion.div>
            )
          })}
        </AnimatePresence>
        
        {agents.length === 0 && (
          <div className="text-center py-8 text-sm text-muted-foreground">
            <Brain className="w-8 h-8 mx-auto mb-2 opacity-30" />
            No active agents
          </div>
        )}
      </div>
    </div>
  )
}

export default ActiveAgentsPanel

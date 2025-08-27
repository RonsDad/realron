"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { 
  TimelineFilters as ITimelineFilters,
  EventType,
  AgentType,
  EventStatus
} from './types'
import {
  X,
  Filter,
  Calendar,
  Search,
  Tag
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select'

interface TimelineFiltersProps {
  filters: ITimelineFilters
  onChange: (filters: ITimelineFilters) => void
  onClear: () => void
}

export function TimelineFilters({ 
  filters, 
  onChange, 
  onClear 
}: TimelineFiltersProps) {
  const eventTypes: EventType[] = [
    'thinking',
    'tool_call',
    'tool_result',
    'agent_handoff',
    'message',
    'error',
    'code_execution',
    'browser_action',
    'computer_use',
    'mcp_call'
  ]
  
  const agentTypes: AgentType[] = [
    'claude_code',
    'clinical_ops',
    'browser',
    'computer_use',
    'mcp_server',
    'custom'
  ]
  
  const statuses: EventStatus[] = [
    'pending',
    'running',
    'completed',
    'failed'
  ]
  
  const handleEventTypeToggle = (type: EventType) => {
    const current = filters.eventTypes || []
    const updated = current.includes(type)
      ? current.filter(t => t !== type)
      : [...current, type]
    onChange({ ...filters, eventTypes: updated.length > 0 ? updated : undefined })
  }
  
  const handleAgentTypeToggle = (type: AgentType) => {
    const current = filters.agentTypes || []
    const updated = current.includes(type)
      ? current.filter(t => t !== type)
      : [...current, type]
    onChange({ ...filters, agentTypes: updated.length > 0 ? updated : undefined })
  }
  
  const handleStatusToggle = (status: EventStatus) => {
    const current = filters.status || []
    const updated = current.includes(status)
      ? current.filter(s => s !== status)
      : [...current, status]
    onChange({ ...filters, status: updated.length > 0 ? updated : undefined })
  }
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4 p-4 rounded-lg bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50"
    >
      {/* Search */}
      <div className="space-y-2">
        <Label className="text-xs font-medium">Search</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search events..."
            value={filters.searchQuery || ''}
            onChange={(e) => onChange({ 
              ...filters, 
              searchQuery: e.target.value || undefined 
            })}
            className="pl-9 h-9 text-sm"
          />
        </div>
      </div>
      
      {/* Event Types */}
      <div className="space-y-2">
        <Label className="text-xs font-medium">Event Types</Label>
        <div className="flex flex-wrap gap-1.5">
          {eventTypes.map(type => (
            <button
              key={type}
              onClick={() => handleEventTypeToggle(type)}
              className={cn(
                "px-2.5 py-1 text-xs font-medium rounded-md transition-all",
                "border border-gray-200 dark:border-gray-700",
                filters.eventTypes?.includes(type)
                  ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700"
                  : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-750"
              )}
            >
              {type.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>
      
      {/* Agent Types */}
      <div className="space-y-2">
        <Label className="text-xs font-medium">Agent Types</Label>
        <div className="flex flex-wrap gap-1.5">
          {agentTypes.map(type => (
            <button
              key={type}
              onClick={() => handleAgentTypeToggle(type)}
              className={cn(
                "px-2.5 py-1 text-xs font-medium rounded-md transition-all",
                "border border-gray-200 dark:border-gray-700",
                filters.agentTypes?.includes(type)
                  ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700"
                  : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-750"
              )}
            >
              {type.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>
      
      {/* Status */}
      <div className="space-y-2">
        <Label className="text-xs font-medium">Status</Label>
        <div className="flex flex-wrap gap-1.5">
          {statuses.map(status => {
            const statusColors = {
              pending: 'gray',
              running: 'blue',
              completed: 'green',
              failed: 'red'
            }
            const color = statusColors[status]
            
            return (
              <button
                key={status}
                onClick={() => handleStatusToggle(status)}
                className={cn(
                  "px-2.5 py-1 text-xs font-medium rounded-md transition-all capitalize",
                  "border border-gray-200 dark:border-gray-700",
                  filters.status?.includes(status)
                    ? `bg-${color}-100 dark:bg-${color}-900/30 text-${color}-700 dark:text-${color}-300 border-${color}-300 dark:border-${color}-700`
                    : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-750"
                )}
              >
                {status}
              </button>
            )
          })}
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
        <div className="text-xs text-muted-foreground">
          {Object.keys(filters).filter(k => filters[k as keyof ITimelineFilters]).length} filters active
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="h-7 text-xs"
        >
          <X className="w-3 h-3 mr-1" />
          Clear All
        </Button>
      </div>
    </motion.div>
  )
}

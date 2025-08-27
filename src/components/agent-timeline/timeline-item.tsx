"use client"

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { 
  TimelineEvent, 
  AgentProfile, 
  ViewMode,
  EventType 
} from './types'
import {
  Brain,
  Wrench,
  Code,
  Globe,
  Monitor,
  Server,
  ChevronRight,
  ChevronDown,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  FileText,
  Terminal,
  Camera,
  MousePointer,
  Zap,
  Package
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface TimelineItemProps {
  event: TimelineEvent
  agent?: AgentProfile
  viewMode: ViewMode
  isLast?: boolean
}

export function TimelineItem({ 
  event, 
  agent, 
  viewMode,
  isLast = false 
}: TimelineItemProps) {
  const [isExpanded, setIsExpanded] = useState(
    viewMode === 'detailed' || event.type === 'error'
  )
  
  const icon = getEventIcon(event)
  const color = getEventColor(event)
  const statusIcon = getStatusIcon(event.status)
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="relative"
    >
      {/* Timeline line */}
      {!isLast && (
        <div 
          className="absolute left-4 top-10 w-0.5 h-full bg-gradient-to-b from-gray-300 to-transparent dark:from-gray-600"
          style={{ zIndex: 0 }}
        />
      )}
      
      {/* Event Card */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "relative flex gap-3 p-3 rounded-xl transition-all cursor-pointer",
          "bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm",
          "border border-gray-200/50 dark:border-gray-700/50",
          "hover:bg-white/80 dark:hover:bg-gray-800/80",
          "hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20",
          event.status === 'running' && "ring-2 ring-indigo-500/20 ring-offset-2 ring-offset-transparent",
          event.status === 'failed' && "ring-2 ring-red-500/20"
        )}
        style={{ zIndex: 1 }}
      >
        {/* Event Icon */}
        <div 
          className={cn(
            "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center",
            "shadow-md transition-transform",
            isExpanded && "scale-110"
          )}
          style={{ 
            background: agent?.color || color,
            boxShadow: `0 4px 14px 0 ${color}40`
          }}
        >
          {event.status === 'running' ? (
            <Loader2 className="w-4 h-4 text-white animate-spin" />
          ) : (
            React.createElement(icon, { className: "w-4 h-4 text-white" })
          )}
        </div>
        
        {/* Event Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {getEventTitle(event)}
                </h4>
                {statusIcon && (
                  <span className={cn(
                    "flex items-center gap-1 text-xs",
                    event.status === 'completed' && "text-green-600 dark:text-green-400",
                    event.status === 'failed' && "text-red-600 dark:text-red-400",
                    event.status === 'running' && "text-blue-600 dark:text-blue-400",
                    event.status === 'pending' && "text-gray-500 dark:text-gray-400"
                  )}>
                    {statusIcon}
                  </span>
                )}
              </div>
              
              {/* Summary for compact view */}
              {viewMode === 'compact' && !isExpanded && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {getEventSummary(event)}
                </p>
              )}
            </div>
            
            {/* Metadata badges */}
            <div className="flex items-center gap-2">
              {event.metadata?.duration && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-xs">
                  <Clock className="w-3 h-3" />
                  {formatDuration(event.metadata.duration)}
                </div>
              )}
              
              {event.metadata?.tokens && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-xs text-indigo-600 dark:text-indigo-400">
                  <Zap className="w-3 h-3" />
                  {event.metadata.tokens.toLocaleString()}
                </div>
              )}
              
              <ChevronRight className={cn(
                "w-4 h-4 text-gray-400 transition-transform",
                isExpanded && "rotate-90"
              )} />
            </div>
          </div>
          
          {/* Expanded Details */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-3 overflow-hidden"
              >
                <EventDetails event={event} viewMode={viewMode} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      {/* Timestamp */}
      <div className="absolute -left-20 top-3 text-xs text-muted-foreground">
        {formatTime(event.timestamp)}
      </div>
    </motion.div>
  )
}

// Component for rendering event details
function EventDetails({ 
  event, 
  viewMode 
}: { 
  event: TimelineEvent
  viewMode: ViewMode 
}) {
  const content = event.content
  
  // Handle different content types
  if (event.type === 'thinking') {
    return (
      <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/50">
        <div className="flex items-start gap-2 mb-2">
          <Brain className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-purple-900 dark:text-purple-100 leading-relaxed">
            {typeof content === 'string' ? (
              <p className="whitespace-pre-wrap">{content}</p>
            ) : (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content.text || content.message || JSON.stringify(content)}
              </ReactMarkdown>
            )}
          </div>
        </div>
      </div>
    )
  }
  
  if (event.type === 'tool_call' || event.type === 'tool_result') {
    return (
      <div className="space-y-2">
        {event.metadata?.toolName && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Package className="w-3 h-3" />
            Tool: {event.metadata.toolName}
          </div>
        )}
        
        {content && (
          <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800">
            {typeof content === 'string' ? (
              <pre className="text-xs font-mono overflow-x-auto">{content}</pre>
            ) : (
              <SyntaxHighlighter
                style={oneDark as any}
                language="json"
                className="!text-xs !bg-transparent"
              >
                {JSON.stringify(content, null, 2)}
              </SyntaxHighlighter>
            )}
          </div>
        )}
      </div>
    )
  }
  
  if (event.type === 'code_execution') {
    return (
      <div className="space-y-2">
        {event.metadata?.fileName && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <FileText className="w-3 h-3" />
            {event.metadata.fileName}
          </div>
        )}
        
        <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800">
          <SyntaxHighlighter
            style={oneDark as any}
            language={detectLanguage(event.metadata?.fileName)}
            showLineNumbers
            className="!text-xs"
          >
            {content.code || content}
          </SyntaxHighlighter>
        </div>
      </div>
    )
  }
  
  if (event.type === 'browser_action' && event.metadata?.screenshot) {
    return (
      <div className="space-y-2">
        <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800">
          <img 
            src={event.metadata.screenshot}
            alt="Browser screenshot"
            className="w-full"
          />
        </div>
        {content && (
          <p className="text-sm text-muted-foreground">{content}</p>
        )}
      </div>
    )
  }
  
  if (event.type === 'error') {
    return (
      <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-red-900 dark:text-red-100">
            {event.metadata?.errorMessage || content}
          </div>
        </div>
      </div>
    )
  }
  
  // Default content display
  return (
    <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50 text-sm">
      {typeof content === 'string' ? (
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]}
          className="prose prose-sm dark:prose-invert max-w-none"
        >
          {content}
        </ReactMarkdown>
      ) : (
        <pre className="text-xs font-mono overflow-x-auto">
          {JSON.stringify(content, null, 2)}
        </pre>
      )}
      
      {/* Debug mode - show all metadata */}
      {viewMode === 'debug' && event.metadata && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="text-xs font-mono text-muted-foreground">
            Metadata:
            <pre className="mt-1 overflow-x-auto">
              {JSON.stringify(event.metadata, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}

// Helper functions
function getEventIcon(event: TimelineEvent) {
  const iconMap: Record<EventType, any> = {
    thinking: Brain,
    tool_call: Wrench,
    tool_result: Wrench,
    agent_handoff: Zap,
    message: FileText,
    error: AlertCircle,
    parallel_start: Zap,
    parallel_end: Zap,
    code_execution: Code,
    browser_action: Globe,
    computer_use: Monitor,
    mcp_call: Server
  }
  return iconMap[event.type] || FileText
}

function getEventColor(event: TimelineEvent): string {
  const colorMap: Record<EventType, string> = {
    thinking: '#9333ea',
    tool_call: '#10b981',
    tool_result: '#10b981',
    agent_handoff: '#f59e0b',
    message: '#3b82f6',
    error: '#ef4444',
    parallel_start: '#8b5cf6',
    parallel_end: '#8b5cf6',
    code_execution: '#6366f1',
    browser_action: '#0ea5e9',
    computer_use: '#14b8a6',
    mcp_call: '#ec4899'
  }
  return colorMap[event.type] || '#6b7280'
}

function getStatusIcon(status: TimelineEvent['status']) {
  switch (status) {
    case 'completed':
      return <CheckCircle className="w-3 h-3" />
    case 'failed':
      return <XCircle className="w-3 h-3" />
    case 'running':
      return <Loader2 className="w-3 h-3 animate-spin" />
    case 'pending':
      return <Clock className="w-3 h-3" />
    default:
      return null
  }
}

function getEventTitle(event: TimelineEvent): string {
  const titles: Record<EventType, string> = {
    thinking: 'Chain of Thought',
    tool_call: `Tool Call: ${event.metadata?.toolName || 'Unknown'}`,
    tool_result: `Tool Result: ${event.metadata?.toolName || 'Unknown'}`,
    agent_handoff: 'Agent Handoff',
    message: 'Message',
    error: 'Error',
    parallel_start: 'Parallel Execution Started',
    parallel_end: 'Parallel Execution Completed',
    code_execution: `Code: ${event.metadata?.fileName || 'Untitled'}`,
    browser_action: 'Browser Action',
    computer_use: 'Computer Control',
    mcp_call: 'MCP Server Call'
  }
  return titles[event.type] || 'Unknown Event'
}

function getEventSummary(event: TimelineEvent): string {
  if (typeof event.content === 'string') {
    return event.content.substring(0, 100)
  }
  if (event.content?.message) {
    return event.content.message
  }
  if (event.content?.text) {
    return event.content.text
  }
  return JSON.stringify(event.content).substring(0, 100)
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit'
  })
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`
}

function detectLanguage(fileName?: string): string {
  if (!fileName) return 'plaintext'
  const ext = fileName.split('.').pop()?.toLowerCase()
  const langMap: Record<string, string> = {
    ts: 'typescript',
    tsx: 'typescript',
    js: 'javascript',
    jsx: 'javascript',
    py: 'python',
    rs: 'rust',
    go: 'go',
    java: 'java',
    cpp: 'cpp',
    c: 'c',
    cs: 'csharp',
    rb: 'ruby',
    php: 'php',
    swift: 'swift',
    kt: 'kotlin',
    sql: 'sql',
    sh: 'bash',
    yml: 'yaml',
    yaml: 'yaml',
    json: 'json',
    xml: 'xml',
    html: 'html',
    css: 'css',
    scss: 'scss',
    md: 'markdown'
  }
  return langMap[ext || ''] || 'plaintext'
}

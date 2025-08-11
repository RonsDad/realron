"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Globe, 
  MousePointer, 
  Search, 
  FileText, 
  CheckCircle, 
  XCircle,
  ChevronRight,
  Clock,
  Eye,
  Navigation,
  Camera,
  Brain,
  Keyboard,
  Monitor
} from "lucide-react"
import { cn } from "@/lib/utils"

interface BrowserAction {
  id: string
  type: 'navigate' | 'click' | 'extract' | 'search' | 'complete' | 'error' | 'switch_tab' | 
        'screenshot' | 'thinking' | 'type' | 'key' | 'scroll' | 'left_click' | 'left_click_drag' | 'action'
  description: string
  timestamp: Date
  details?: string
  url?: string
  success?: boolean
  screenshot?: string
}

interface BrowserTimelineProps {
  actions: BrowserAction[]
  isActive: boolean
}

export function BrowserTimeline({ actions, isActive }: BrowserTimelineProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const getIcon = (type: BrowserAction['type']) => {
    switch (type) {
      case 'navigate':
        return <Navigation className="w-4 h-4" />
      case 'click':
      case 'left_click':
        return <MousePointer className="w-4 h-4" />
      case 'extract':
        return <FileText className="w-4 h-4" />
      case 'search':
        return <Search className="w-4 h-4" />
      case 'complete':
        return <CheckCircle className="w-4 h-4" />
      case 'error':
        return <XCircle className="w-4 h-4" />
      case 'switch_tab':
        return <Eye className="w-4 h-4" />
      case 'screenshot':
        return <Camera className="w-4 h-4" />
      case 'thinking':
        return <Brain className="w-4 h-4" />
      case 'type':
      case 'key':
        return <Keyboard className="w-4 h-4" />
      case 'scroll':
      case 'left_click_drag':
        return <Monitor className="w-4 h-4" />
      default:
        return <Globe className="w-4 h-4" />
    }
  }

  const getColorClass = (type: BrowserAction['type']) => {
    switch (type) {
      case 'navigate':
        return 'bg-blue-500 text-white'
      case 'click':
      case 'left_click':
        return 'bg-purple-500 text-white'
      case 'extract':
        return 'bg-green-500 text-white'
      case 'search':
        return 'bg-yellow-500 text-white'
      case 'complete':
        return 'bg-emerald-500 text-white'
      case 'error':
        return 'bg-red-500 text-white'
      case 'switch_tab':
        return 'bg-indigo-500 text-white'
      case 'screenshot':
        return 'bg-cyan-500 text-white'
      case 'thinking':
        return 'bg-pink-500 text-white'
      case 'type':
      case 'key':
        return 'bg-orange-500 text-white'
      case 'scroll':
      case 'left_click_drag':
        return 'bg-teal-500 text-white'
      default:
        return 'bg-gray-500 text-white'
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    })
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Browser Activity Timeline
        </h3>
        {isActive && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs text-gray-600 dark:text-gray-400">Active</span>
          </div>
        )}
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {actions.map((action, index) => (
            <motion.div
              key={action.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              className="relative"
            >
              {/* Timeline line */}
              {index < actions.length - 1 && (
                <div className="absolute left-4 top-8 w-0.5 h-full bg-gray-200 dark:bg-gray-700" />
              )}

              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className={cn(
                  "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                  getColorClass(action.type)
                )}>
                  {getIcon(action.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div
                    className="cursor-pointer"
                    onClick={() => setExpandedId(expandedId === action.id ? null : action.id)}
                  >
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {action.description}
                      </p>
                      {(action.details || action.screenshot) && (
                        <ChevronRight className={cn(
                          "w-3 h-3 text-gray-400 transition-transform",
                          expandedId === action.id && "rotate-90"
                        )} />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatTime(action.timestamp)}
                      </p>
                      {action.url && (
                        <>
                          <span className="text-xs text-gray-400">•</span>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {action.url}
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Expanded details */}
                  <AnimatePresence>
                    {expandedId === action.id && (action.details || action.screenshot) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                          {action.screenshot ? (
                            <img 
                              src={`data:image/png;base64,${action.screenshot}`}
                              alt="Screenshot"
                              className="w-full rounded border border-gray-200 dark:border-gray-700"
                            />
                          ) : (
                            <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                              {action.details}
                            </pre>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {actions.length === 0 && (
          <div className="text-center py-8">
            <Globe className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No browser activity yet
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
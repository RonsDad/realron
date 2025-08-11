"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Globe, Loader2, Brain, MessageSquare, Eye, EyeOff, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

interface BrowserSession {
  task: string
  url: string
  sessionId: string
}

interface DeepResearchBrowserPanelProps {
  liveUrl?: string
  liveUrls?: BrowserSession[]
  isActive?: boolean
  thoughts?: string[]
  onSessionChange?: (index: number) => void
}

export function DeepResearchBrowserPanel({
  liveUrl,
  liveUrls,
  isActive = false,
  thoughts = [],
  onSessionChange
}: DeepResearchBrowserPanelProps) {
  const [activeSession, setActiveSession] = useState(0)
  const [showThoughts, setShowThoughts] = useState(true)
  const [isThinking, setIsThinking] = useState(false)

  // Handle thinking indicator
  useEffect(() => {
    if (thoughts.length > 0) {
      setIsThinking(true)
      const timer = setTimeout(() => setIsThinking(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [thoughts.length])

  const handleSessionChange = (index: number) => {
    setActiveSession(index)
    onSessionChange?.(index)
  }

  // Handle multiple sessions
  if (liveUrls && liveUrls.length > 0) {
    return (
      <div className="space-y-4">
        {/* Session selector */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="bg-cyan-50 dark:bg-cyan-950/30">
              {liveUrls.length} Parallel Agents
            </Badge>
            <p className="text-sm text-cyan-700 dark:text-cyan-300">
              Browser agents exploring different aspects
            </p>
          </div>
          
          {/* Navigation buttons */}
          <div className="flex items-center gap-2">
            {liveUrls.map((_, idx) => (
              <Button
                key={idx}
                variant={activeSession === idx ? "default" : "outline"}
                size="sm"
                onClick={() => handleSessionChange(idx)}
                className={cn(
                  "w-8 h-8 p-0",
                  activeSession === idx && "bg-cyan-600 hover:bg-cyan-700"
                )}
              >
                {idx + 1}
              </Button>
            ))}
          </div>
        </div>

        {/* Thoughts display */}
        {thoughts.length > 0 && (
          <AnimatePresence>
            {showThoughts && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4 bg-cyan-50 dark:bg-cyan-950/20 rounded-xl border border-cyan-200 dark:border-cyan-800"
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-cyan-900 dark:text-cyan-100 flex items-center gap-2">
                    <Brain className="w-4 h-4" />
                    Browser Agent Reasoning
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowThoughts(!showThoughts)}
                  >
                    {showThoughts ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                <ScrollArea className="max-h-48">
                  <div className="space-y-2">
                    {thoughts.map((thought, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="flex items-start gap-2"
                      >
                        <MessageSquare className="w-3 h-3 text-cyan-600 dark:text-cyan-400 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-cyan-700 dark:text-cyan-300 italic">
                          {thought}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>
              </motion.div>
            )}
          </AnimatePresence>
        )}
        
        {/* Browser display */}
        <div className="rounded-xl border border-cyan-200 dark:border-cyan-800 overflow-hidden shadow-lg">
          <div className="bg-cyan-50 dark:bg-cyan-950/30 px-4 py-3 border-b border-cyan-200 dark:border-cyan-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <p className="text-sm text-cyan-700 dark:text-cyan-300 font-medium">
                  Agent {activeSession + 1}: {liveUrls[activeSession].task}
                </p>
                {isActive && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-xs text-green-600 dark:text-green-400">Live</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveSession(Math.max(0, activeSession - 1))}
                  disabled={activeSession === 0}
                  className="h-7 px-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-xs text-cyan-600 dark:text-cyan-400 font-medium">
                  {activeSession + 1} / {liveUrls.length}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveSession(Math.min(liveUrls.length - 1, activeSession + 1))}
                  disabled={activeSession === liveUrls.length - 1}
                  className="h-7 px-2"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
          <div className="relative bg-white dark:bg-slate-950">
            {isThinking && (
              <div className="absolute top-4 right-4 z-10 bg-cyan-600 text-white px-3 py-1 rounded-full text-xs flex items-center gap-2 shadow-lg">
                <Brain className="w-3 h-3 animate-pulse" />
                Agent is thinking...
              </div>
            )}
            <iframe
              src={liveUrls[activeSession].url}
              className="w-full h-[600px] border-0"
              title={`Browser Research Session ${activeSession + 1}`}
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
            />
          </div>
        </div>
      </div>
    )
  }

  // Single session display
  if (liveUrl) {
    return (
      <div className="space-y-4">
        {/* Thoughts display */}
        {thoughts.length > 0 && showThoughts && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-cyan-50 dark:bg-cyan-950/20 rounded-xl border border-cyan-200 dark:border-cyan-800"
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-cyan-900 dark:text-cyan-100 flex items-center gap-2">
                <Brain className="w-4 h-4" />
                Browser Agent Reasoning
              </h4>
              {isThinking && (
                <div className="flex items-center gap-2 text-xs text-cyan-600 dark:text-cyan-400">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Thinking...
                </div>
              )}
            </div>
            <ScrollArea className="max-h-48">
              <div className="space-y-2">
                {thoughts.map((thought, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <MessageSquare className="w-3 h-3 text-cyan-600 dark:text-cyan-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-cyan-700 dark:text-cyan-300 italic">
                      {thought}
                    </p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </motion.div>
        )}

        {/* Browser display */}
        <div className="rounded-xl border border-cyan-200 dark:border-cyan-800 overflow-hidden shadow-lg">
          <div className="bg-cyan-50 dark:bg-cyan-950/30 px-4 py-3 border-b border-cyan-200 dark:border-cyan-800">
            <div className="flex items-center justify-between">
              <p className="text-sm text-cyan-700 dark:text-cyan-300 font-medium">
                Live Browser Session
              </p>
              {isActive && (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs text-green-600 dark:text-green-400">Live</span>
                </div>
              )}
            </div>
          </div>
          <div className="relative bg-white dark:bg-slate-950">
            {isThinking && (
              <div className="absolute top-4 right-4 z-10 bg-cyan-600 text-white px-3 py-1 rounded-full text-xs flex items-center gap-2 shadow-lg">
                <Brain className="w-3 h-3 animate-pulse" />
                Agent is thinking...
              </div>
            )}
            <iframe
              src={liveUrl}
              className="w-full h-[600px] border-0"
              title="Browser Research Session"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
            />
          </div>
        </div>
      </div>
    )
  }

  // No browser session
  return (
    <div className="rounded-xl border border-cyan-200 dark:border-cyan-800 bg-cyan-50 dark:bg-cyan-950/20 p-8">
      <div className="text-center">
        <Globe className="w-12 h-12 mx-auto mb-4 text-cyan-400 dark:text-cyan-600" />
        <p className="text-sm text-cyan-700 dark:text-cyan-300">
          Browser session will appear here when topic exploration begins
        </p>
      </div>
    </div>
  )
}
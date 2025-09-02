"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Monitor, Globe, Maximize2, Minimize2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SessionManager } from "./session-manager"
import { BrowserTimeline } from "./browser-timeline"

interface ComputerUseAgentProps {
  isVisible: boolean
  onClose: () => void
  task?: string
  liveUrl?: string
  isMobile?: boolean
  mode?: 'browser' | 'computer_use'
  browserActions?: any[]
}

export function ComputerUseAgentScalable({
  isVisible,
  onClose,
  task = "Agent Active",
  liveUrl,
  isMobile = false,
  mode = 'browser',
  browserActions = []
}: ComputerUseAgentProps) {
  const [isMaximized, setIsMaximized] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [activeSession, setActiveSession] = useState<any>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const sessionConfig = {
    type: mode === 'computer_use' ? 'desktop' as const : 'browser' as const,
    url: liveUrl,
    timeout_ms: 3600000
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: isMobile ? -20 : 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: isMobile ? -20 : 20, scale: 0.95 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className={isMobile ? "fixed inset-0 z-30" : "h-full w-full"}
        >
          <div className="h-full w-full flex flex-col bg-white dark:bg-neutral-900 rounded-2xl border shadow-2xl overflow-hidden">
            
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b bg-gray-100 dark:bg-neutral-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-200 dark:bg-neutral-700">
                  {mode === 'computer_use' ? (
                    <Monitor className="w-4 h-4" />
                  ) : (
                    <Globe className="w-4 h-4" />
                  )}
                </div>
                <h3 className="font-semibold text-sm">
                  {mode === 'computer_use' ? "Desktop Session" : "Browser Session"}
                </h3>
              </div>

              <div className="flex items-center gap-1">
                {!isMobile && (
                  <Button variant="ghost" size="icon" onClick={() => setIsMaximized(!isMaximized)} className="w-8 h-8">
                    {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={onClose} className="w-8 h-8">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex">
              {/* Session View */}
              <div className="flex-1">
                {liveUrl && mode === 'browser' ? (
                  <iframe src={liveUrl} className="w-full h-full border-0" title="Browser Session" />
                ) : (
                  <SessionManager
                    config={sessionConfig}
                    onSessionCreated={setActiveSession}
                    onSessionClosed={() => setActiveSession(null)}
                    className="w-full h-full"
                  />
                )}
              </div>
              
              {/* Timeline Panel */}
              {browserActions.length > 0 && (
                <div className="w-80 border-l overflow-y-auto bg-gray-50 dark:bg-neutral-900">
                  <div className="p-4">
                    <BrowserTimeline actions={browserActions} isActive={true} />
                  </div>
                </div>
              )}
            </div>

            {/* Status Bar */}
            <div className="px-4 py-2 bg-gray-100 dark:bg-neutral-900 border-t">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">{task}</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-gray-600">
                    {activeSession ? 'Connected' : 'Ready'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

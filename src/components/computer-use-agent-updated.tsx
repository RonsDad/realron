"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Monitor, Maximize2, Minimize2, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DesktopEmbed } from "./desktop-embed"

interface ComputerUseAgentProps {
  isVisible: boolean
  onClose: () => void
  task?: string
  isMobile?: boolean
  mode?: 'browser' | 'computer_use'
}

export function ComputerUseAgentUpdated({
  isVisible,
  onClose,
  task = "Computer Use Agent Active",
  isMobile = false,
  mode = 'computer_use'
}: ComputerUseAgentProps) {
  const [isMaximized, setIsMaximized] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const toggleMaximize = () => {
    setIsMaximized(!isMaximized)
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
          <div className="h-full w-full flex flex-col bg-white dark:bg-neutral-900 rounded-2xl border border-gray-200 dark:border-neutral-800 shadow-2xl overflow-hidden">
            
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-neutral-700 bg-gray-100 dark:bg-neutral-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-200 dark:bg-neutral-700">
                  <Monitor className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                    Ron's Desktop Computer Use
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {!isMobile && (
                  <Button variant="ghost" size="icon" onClick={toggleMaximize} className="w-8 h-8">
                    {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </Button>
                )}
                <Button variant="ghost" size="icon" className="w-8 h-8">
                  <RotateCcw className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={onClose} className="w-8 h-8">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Desktop Content */}
            <div className="flex-1 bg-white dark:bg-neutral-950">
              <DesktopEmbed className="w-full h-full" />
            </div>

            {/* Status Bar */}
            <div className="px-4 py-2 bg-gray-100 dark:bg-neutral-900 border-t border-gray-200 dark:border-neutral-700">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600 dark:text-neutral-400">Desktop: {task}</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-gray-600 dark:text-neutral-400">Connected</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

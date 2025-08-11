"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Monitor, Maximize2, Minimize2, RotateCcw, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BrowserTimeline } from "./browser-timeline"

interface Tab {
  id: string
  title: string
  url: string
  isActive: boolean
}

interface ComputerUseAgentProps {
  isVisible: boolean
  onClose: () => void
  task?: string
  liveUrl?: string
  isMobile?: boolean
  isLoading?: boolean
  error?: string | null
  tabs?: Tab[]
  activeTabId?: string
  onNewTab?: () => void
  onCloseTab?: (tabId: string) => void
  onSwitchTab?: (tabId: string) => void
  browserActions?: any[]
}

export function ComputerUseAgent({
  isVisible,
  onClose,
  task = "Computer Use Agent Active",
  liveUrl,
  isMobile = false,
  isLoading = false,
  error = null,
  tabs = [],
  activeTabId,
  onNewTab,
  onCloseTab,
  onSwitchTab,
  browserActions = [],
}: ComputerUseAgentProps) {
  const [isMaximized, setIsMaximized] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    console.log('ComputerUseAgent - liveUrl prop changed:', liveUrl)
    
    // Preload the iframe URL as soon as we get it for faster rendering
    if (liveUrl && typeof window !== 'undefined') {
      const link = document.createElement('link')
      link.rel = 'prefetch'
      link.href = liveUrl
      document.head.appendChild(link)
      
      // Clean up prefetch link after component unmounts
      return () => {
        document.head.removeChild(link)
      }
    }
  }, [liveUrl])

  if (!mounted) return null

  const toggleMaximize = () => {
    setIsMaximized(!isMaximized)
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{
            opacity: 0,
            y: isMobile ? -20 : 20,
            scale: 0.95,
          }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
          }}
          exit={{
            opacity: 0,
            y: isMobile ? -20 : 20,
            scale: 0.95,
          }}
          transition={{
            type: "spring",
            damping: 25,
            stiffness: 300,
          }}
          className={`
            fixed z-30
            ${
              isMobile
                ? "inset-0"
                : isMaximized
                  ? "inset-0"
                  : "top-4 right-4 bottom-4 left-[50%]"
            }
          `}
        >
          <div className="h-full w-full flex flex-col bg-white dark:bg-gray-950 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <Monitor className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">Ron's Browser Window</h3>
                  {liveUrl && <p className="text-xs text-gray-600 dark:text-gray-400 truncate max-w-[300px]">{liveUrl}</p>}
                </div>
              </div>

              <div className="flex items-center gap-1">
                {!isMobile && (
                  <Button variant="ghost" size="icon" onClick={toggleMaximize} className="w-8 h-8 hover:bg-gray-200 dark:hover:bg-gray-800">
                    {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </Button>
                )}
                <Button variant="ghost" size="icon" className="w-8 h-8 hover:bg-gray-200 dark:hover:bg-gray-800">
                  <RotateCcw className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="w-8 h-8 hover:bg-red-100 dark:hover:bg-red-900 hover:text-red-600 dark:hover:text-red-400"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Tab Bar */}
            {tabs.length > 0 && (
              <div className="flex items-center bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-2 py-1 overflow-x-auto">
                <div className="flex items-center gap-1 min-w-0 flex-1">
                  {tabs.map((tab) => (
                    <div
                      key={tab.id}
                      className={`
                        flex items-center gap-2 px-3 py-1.5 rounded-md cursor-pointer min-w-0 max-w-[200px] group
                        ${tab.isActive || tab.id === activeTabId
                          ? 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                        }
                      `}
                      onClick={() => onSwitchTab?.(tab.id)}
                    >
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                        {tab.title || 'New Tab'}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-4 h-4 p-0 opacity-0 group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-gray-600"
                        onClick={(e) => {
                          e.stopPropagation()
                          onCloseTab?.(tab.id)
                        }}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 flex-shrink-0 hover:bg-gray-200 dark:hover:bg-gray-700"
                  onClick={onNewTab}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            )}

            {/* Browser Content with Timeline - Split View */}
            <div className="flex-1 flex">
              {/* Browser View */}
              <div className="flex-1 bg-white dark:bg-black">
                {liveUrl ? (
                  <>
                    <div className="absolute top-0 left-0 p-2 bg-black/50 text-white text-xs z-10">
                      LiveURL: {liveUrl}
                    </div>
                    <iframe
                      src={liveUrl}
                      className="w-full h-full border-0"
                      title="Computer Use Agent Browser"
                    />
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-900">
                    <div className="text-center">
                      <Monitor className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
                      <p className="text-sm text-gray-600 dark:text-gray-400">Computer Use Agent Active</p>
                      <p className="text-xs mt-1 text-gray-500 dark:text-gray-500">{task}</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Timeline Panel */}
              {browserActions.length > 0 && (
                <div className="w-80 border-l border-gray-200 dark:border-gray-800 overflow-y-auto bg-gray-50 dark:bg-gray-950">
                  <div className="p-4">
                    <BrowserTimeline 
                      actions={browserActions} 
                      isActive={true}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Status Bar */}
            <div className="px-4 py-2 bg-gray-100 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600 dark:text-gray-400">Status: Active</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-gray-600 dark:text-gray-400">Connected</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

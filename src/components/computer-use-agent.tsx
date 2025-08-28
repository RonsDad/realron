"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Monitor, Maximize2, Minimize2, RotateCcw, Plus, Wand2, Sparkles, Zap, Globe, Play, Loader2, Rocket, ExternalLink } from "lucide-react"
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
  mode?: 'browser' | 'preview_tools' | 'computer_use'
  onDeploy?: () => void
  isGenerating?: boolean
  // VNC-specific props
  onInitializeVnc?: () => Promise<void>
  vncError?: string | null
  isInitializingVnc?: boolean
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
  mode = 'browser',
  onDeploy,
  isGenerating = false,
  // VNC-specific props
  onInitializeVnc,
  vncError = null,
  isInitializingVnc = false,
}: ComputerUseAgentProps) {
  const [isMaximized, setIsMaximized] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [showMagic, setShowMagic] = useState(false)
  const [magicCompleted, setMagicCompleted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Handle magic animation for preview_tools mode
  useEffect(() => {
    if (isGenerating && mode === 'preview_tools') {
      setShowMagic(true)
      setMagicCompleted(false)
      // Complete magic animation after 3 seconds
      const timer = setTimeout(() => {
        setMagicCompleted(true)
        setTimeout(() => setShowMagic(false), 500)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [isGenerating, mode])

  useEffect(() => {
    // Auto-open the component when a liveUrl is provided
    if (liveUrl && !isVisible && typeof window !== 'undefined') {
      // Trigger the parent to make this component visible
      // This will be handled by the parent component through the liveUrl change
    }

    // Preload the iframe URL as soon as we get it for faster rendering
    if (liveUrl && typeof window !== 'undefined') {
      const link = document.createElement('link')
      link.rel = 'prefetch'
      link.href = liveUrl
      document.head.appendChild(link)

      // Clean up prefetch link after component unmounts
      return () => {
        if (document.head.contains(link)) {
          document.head.removeChild(link)
        }
      }
    }
  }, [liveUrl, isVisible])

  // VNC initialization effect for computer_use mode
  useEffect(() => {
    if (isVisible && mode === 'computer_use' && onInitializeVnc && !liveUrl && !isInitializingVnc && !vncError) {
      console.log('ComputerUseAgent: Initializing VNC for computer use mode')
      onInitializeVnc()
    }
  }, [isVisible, mode, onInitializeVnc, liveUrl, isInitializingVnc, vncError])

  // Cleanup effect when component unmounts
  useEffect(() => {
    return () => {
      // Component cleanup is handled by the parent's onClose function
      // which calls stopAgent() which in turn calls closeVnc()
      console.log('ComputerUseAgent: Component unmounting')
    }
  }, [])

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
            ${isMobile ? "fixed inset-0 z-30" : "h-full w-full"}
          `}
        >
          <div className="h-full w-full flex flex-col bg-white dark:bg-neutral-900 rounded-2xl border border-gray-200 dark:border-neutral-800 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className={`flex items-center justify-between p-3 border-b border-gray-200 dark:border-neutral-700 ${
              mode === 'preview_tools' 
                ? 'bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-pink-500/10 backdrop-blur-sm' 
                : 'bg-gray-100 dark:bg-neutral-800'
            }`}>
              <div className="flex items-center gap-3">
                <motion.div 
                  whileHover={mode === 'preview_tools' ? { rotate: 180 } : {}}
                  transition={{ duration: 0.5 }}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    mode === 'preview_tools'
                      ? 'bg-gradient-to-br from-violet-500 via-purple-600 to-pink-600 shadow-lg'
                      : 'bg-gray-200 dark:bg-neutral-700'
                  }`}
                >
                  {mode === 'preview_tools' ? (
                    <Wand2 className="w-4 h-4 text-white" />
                  ) : (
                    <Monitor className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                  )}
                </motion.div>
                <div>
                  <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    {mode === 'preview_tools' ? 'Claude Code Magic Preview' : 
                     mode === 'computer_use' ? "Ron's Desktop Computer Use" : 
                     "Ron's Browser Window"}
                    {mode === 'preview_tools' && <Sparkles className="w-4 h-4 text-purple-500" />}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {mode === 'preview_tools' && onDeploy && (
                  <Button 
                    variant="default" 
                    size="sm" 
                    onClick={onDeploy}
                    className="h-8 px-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    <Rocket className="w-4 h-4 mr-1" />
                    Deploy
                  </Button>
                )}
                {mode === 'preview_tools' && liveUrl && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => window.open(liveUrl, '_blank')}
                    className="w-8 h-8 hover:bg-gray-200 dark:hover:bg-neutral-700"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                )}
                {!isMobile && (
                  <Button variant="ghost" size="icon" onClick={toggleMaximize} className="w-8 h-8 hover:bg-gray-200 dark:hover:bg-neutral-700">
                    {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </Button>
                )}
                <Button variant="ghost" size="icon" className="w-8 h-8 hover:bg-gray-200 dark:hover:bg-neutral-700">
                  <RotateCcw className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="w-8 h-8 hover:bg-red-100 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Tab Bar */}
            {tabs.length > 0 && (
              <div className="flex items-center bg-gray-50 dark:bg-neutral-800 border-b border-gray-200 dark:border-neutral-700 px-2 py-1 overflow-x-auto">
                <div className="flex items-center gap-1 min-w-0 flex-1">
                  {tabs.map((tab) => (
                    <div
                      key={tab.id}
                      className={`
                        flex items-center gap-2 px-3 py-1.5 rounded-md cursor-pointer min-w-0 max-w-[200px] group
                        ${tab.isActive || tab.id === activeTabId
                          ? 'bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-600'
                          : 'hover:bg-gray-100 dark:hover:bg-neutral-700'
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
                        className="w-4 h-4 p-0 opacity-0 group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-neutral-600"
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
                  className="w-8 h-8 flex-shrink-0 hover:bg-gray-200 dark:hover:bg-neutral-700"
                  onClick={onNewTab}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            )}

            {/* Browser Content with Timeline - Split View */}
            <div className="flex-1 flex relative">
              {/* Magical Animation Overlay */}
              <AnimatePresence>
                {showMagic && mode === 'preview_tools' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 1.2 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0 z-40 flex items-center justify-center"
                    style={{
                      background: `radial-gradient(circle at center, 
                        rgba(168, 85, 247, 0.1) 0%,
                        rgba(59, 130, 246, 0.1) 25%,
                        rgba(236, 72, 153, 0.1) 50%,
                        rgba(251, 146, 60, 0.1) 75%,
                        rgba(34, 197, 94, 0.1) 100%)`
                    }}
                  >
                    {/* Animated Background Gradients */}
                    <div className="absolute inset-0">
                      <motion.div
                        animate={{
                          background: [
                            "radial-gradient(circle at 20% 50%, rgba(168, 85, 247, 0.3) 0%, transparent 50%)",
                            "radial-gradient(circle at 80% 50%, rgba(59, 130, 246, 0.3) 0%, transparent 50%)",
                            "radial-gradient(circle at 50% 20%, rgba(236, 72, 153, 0.3) 0%, transparent 50%)",
                            "radial-gradient(circle at 50% 80%, rgba(251, 146, 60, 0.3) 0%, transparent 50%)",
                            "radial-gradient(circle at 20% 50%, rgba(168, 85, 247, 0.3) 0%, transparent 50%)",
                          ]
                        }}
                        transition={{
                          duration: 4,
                          repeat: Infinity,
                          ease: "linear"
                        }}
                        className="absolute inset-0"
                      />
                      
                      {/* Sparkle Particles */}
                      {[...Array(12)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="absolute w-1 h-1 bg-white rounded-full"
                          initial={{
                            x: Math.random() * 400,
                            y: Math.random() * 400,
                            scale: 0,
                            opacity: 0
                          }}
                          animate={{
                            x: Math.random() * 400,
                            y: Math.random() * 400,
                            scale: [0, 1, 0],
                            opacity: [0, 1, 0]
                          }}
                          transition={{
                            duration: 2 + Math.random() * 2,
                            repeat: Infinity,
                            delay: Math.random() * 2,
                            ease: "easeInOut"
                          }}
                        />
                      ))}
                    </div>

                    {/* Central Magic Icon */}
                    <motion.div
                      animate={{
                        rotate: [0, 360],
                        scale: [1, 1.2, 1]
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="relative z-50"
                    >
                      <div className="relative">
                        <motion.div
                          animate={{
                            scale: [1, 1.5, 1],
                            opacity: [0.5, 0.8, 0.5]
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                          className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 rounded-full blur-xl"
                        />
                        <div className="relative w-24 h-24 bg-gradient-to-br from-violet-600 via-purple-600 to-pink-600 rounded-full flex items-center justify-center shadow-2xl">
                          <Wand2 className="w-12 h-12 text-white" />
                        </div>
                      </div>
                      
                      {/* Orbiting Elements */}
                      <motion.div
                        animate={{ rotate: [0, -360] }}
                        transition={{
                          duration: 8,
                          repeat: Infinity,
                          ease: "linear"
                        }}
                        className="absolute inset-0"
                      >
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2">
                          <Sparkles className="w-6 h-6 text-yellow-400" />
                        </div>
                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2">
                          <Zap className="w-6 h-6 text-gray-400" />
                        </div>
                        <div className="absolute top-1/2 -left-8 -translate-y-1/2">
                          <Globe className="w-6 h-6 text-green-400" />
                        </div>
                        <div className="absolute top-1/2 -right-8 -translate-y-1/2">
                          <Play className="w-6 h-6 text-pink-400" />
                        </div>
                      </motion.div>
                    </motion.div>

                    {/* Loading Text */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="absolute bottom-1/3 left-1/2 -translate-x-1/2 text-center"
                    >
                      <p className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        {magicCompleted ? "✨ Magic Complete!" : "Creating something magical..."}
                      </p>
                      <div className="flex items-center gap-1 mt-2 justify-center">
                        <motion.div
                          animate={{ scale: [1, 1.5, 1] }}
                          transition={{ duration: 0.5, repeat: Infinity, delay: 0 }}
                          className="w-2 h-2 bg-purple-500 rounded-full"
                        />
                        <motion.div
                          animate={{ scale: [1, 1.5, 1] }}
                          transition={{ duration: 0.5, repeat: Infinity, delay: 0.1 }}
                          className="w-2 h-2 bg-pink-500 rounded-full"
                        />
                        <motion.div
                          animate={{ scale: [1, 1.5, 1] }}
                          transition={{ duration: 0.5, repeat: Infinity, delay: 0.2 }}
                          className="w-2 h-2 bg-gray-500 rounded-full"
                        />
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Browser View */}
              <div className="flex-1 bg-white dark:bg-neutral-950 relative">
                {liveUrl ? (
                  <>
                    <iframe
                      src={liveUrl}
                      className="w-full h-full border-0"
                      style={{
                        backgroundColor: '#ffffff'
                      }}
                      title="Computer Use Agent Browser"
                    />
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-neutral-900">
                    <div className="text-center">
                      {mode === 'computer_use' ? (
                        isInitializingVnc ? (
                          <>
                            <Loader2 className="w-12 h-12 mx-auto mb-4 text-blue-500 animate-spin" />
                            <p className="text-sm text-gray-600 dark:text-gray-400">Initializing Desktop Connection...</p>
                            <p className="text-xs mt-1 text-gray-500 dark:text-gray-500">Starting VNC session for computer use</p>
                          </>
                        ) : vncError ? (
                          <>
                            <Monitor className="w-12 h-12 mx-auto mb-4 text-red-400" />
                            <p className="text-sm text-red-600 dark:text-red-400">Desktop Connection Failed</p>
                            <p className="text-xs mt-1 text-gray-500 dark:text-gray-500">{vncError}</p>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="mt-3"
                              onClick={onInitializeVnc}
                            >
                              Retry Connection
                            </Button>
                          </>
                        ) : (
                          <>
                            <Monitor className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-neutral-500" />
                            <p className="text-sm text-gray-600 dark:text-gray-400">Desktop Ready</p>
                            <p className="text-xs mt-1 text-gray-500 dark:text-gray-500">Waiting for VNC connection...</p>
                          </>
                        )
                      ) : (
                        <>
                          <Monitor className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-neutral-500" />
                          <p className="text-sm text-gray-600 dark:text-gray-400">Computer Use Agent Active</p>
                          <p className="text-xs mt-1 text-gray-500 dark:text-gray-500">{task}</p>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Timeline Panel */}
              {browserActions.length > 0 && (
                <div className="w-80 border-l border-gray-200 dark:border-neutral-700 overflow-y-auto bg-gray-50 dark:bg-neutral-900">
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
            <div className="px-4 py-2 bg-gray-100 dark:bg-neutral-900 border-t border-gray-200 dark:border-neutral-700">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600 dark:text-neutral-400">Status: Active</span>
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

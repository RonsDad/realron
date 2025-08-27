"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Sparkles, 
  Wand2, 
  Globe, 
  Maximize2,
  Minimize2,
  RefreshCw,
  ExternalLink,
  Loader2,
  Play,
  Zap
} from "lucide-react"
import { cn } from "@/lib/utils"

interface MagicPreviewProps {
  url?: string
  sessionId?: string
  isGenerating?: boolean
  onGenerate?: () => void
  onRefresh?: () => void
  className?: string
  browserbaseSession?: any
}

export function ClaudeCodeMagicPreview({
  url,
  sessionId,
  isGenerating = false,
  onGenerate,
  onRefresh,
  className,
  browserbaseSession
}: MagicPreviewProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showMagic, setShowMagic] = useState(false)
  const [iframeLoaded, setIframeLoaded] = useState(false)
  const [magicCompleted, setMagicCompleted] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    if (isGenerating) {
      setShowMagic(true)
      setMagicCompleted(false)
      // Complete magic animation after 3 seconds
      const timer = setTimeout(() => {
        setMagicCompleted(true)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [isGenerating])

  const handleIframeLoad = () => {
    setIframeLoaded(true)
    // Hide magic animation shortly after iframe loads
    if (magicCompleted) {
      setTimeout(() => setShowMagic(false), 500)
    }
  }

  const openInNewTab = () => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <Card className={cn(
      "relative overflow-hidden transition-all duration-500",
      isFullscreen && "fixed inset-4 z-50",
      className
    )}>
      {/* Magical Animation Overlay */}
      <AnimatePresence>
        {showMagic && (
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
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-white rounded-full"
                  initial={{
                    x: Math.random() * window.innerWidth,
                    y: Math.random() * window.innerHeight,
                    scale: 0,
                    opacity: 0
                  }}
                  animate={{
                    x: Math.random() * window.innerWidth,
                    y: Math.random() * window.innerHeight,
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
                  <Zap className="w-6 h-6 text-blue-400" />
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
                  className="w-2 h-2 bg-blue-500 rounded-full"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="relative z-30 px-4 py-3 border-b border-border bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-pink-500/10 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div 
              whileHover={{ rotate: 180 }}
              transition={{ duration: 0.5 }}
              className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 via-purple-600 to-pink-600 flex items-center justify-center shadow-lg"
            >
              <Wand2 className="w-5 h-5 text-white" />
            </motion.div>
            <div>
              <h3 className="font-semibold text-sm flex items-center gap-2">
                Claude Code Magic Preview
                <Sparkles className="w-4 h-4 text-purple-500" />
              </h3>
              <p className="text-xs text-muted-foreground">
                {url ? "Live preview ready" : "Ready to generate"}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            {onGenerate && !url && (
              <Button
                variant="default"
                size="sm"
                onClick={onGenerate}
                disabled={isGenerating}
                className="h-8 px-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 mr-1" />
                    Generate Preview
                  </>
                )}
              </Button>
            )}
            {url && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={openInNewTab}
                  className="h-8 w-8 p-0"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
                {onRefresh && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onRefresh}
                    className="h-8 w-8 p-0"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                )}
              </>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="h-8 w-8 p-0"
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Iframe Container */}
      <div className={cn(
        "relative bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800",
        isFullscreen ? "h-[calc(100vh-80px)]" : "h-[600px]"
      )}>
        {url ? (
          <>
            {!iframeLoaded && !showMagic && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
              </div>
            )}
            <iframe
              ref={iframeRef}
              src={url}
              className={cn(
                "w-full h-full border-0 transition-opacity duration-500",
                iframeLoaded && !showMagic ? "opacity-100" : "opacity-0"
              )}
              onLoad={handleIframeLoad}
              title="Claude Code Preview"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
              allow="accelerometer; camera; encrypted-media; geolocation; gyroscope; microphone; clipboard-read; clipboard-write"
            />
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <motion.div
                animate={{
                  y: [0, -10, 0]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <Wand2 className="w-16 h-16 mx-auto text-purple-500 mb-4" />
              </motion.div>
              <p className="text-lg font-medium text-muted-foreground">
                Click "Generate Preview" to start the magic
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Claude Code will create an interactive preview for you
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      {url && (
        <div className="relative z-30 px-4 py-2 border-t border-border bg-muted/30 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-2 h-2 rounded-full",
              iframeLoaded ? "bg-green-500" : "bg-yellow-500 animate-pulse"
            )} />
            <span className="text-muted-foreground">
              {iframeLoaded ? "Connected" : "Connecting..."}
            </span>
          </div>
          {sessionId && (
            <span className="text-muted-foreground font-mono">
              Session: {sessionId.slice(0, 8)}...
            </span>
          )}
        </div>
      )}
    </Card>
  )
}
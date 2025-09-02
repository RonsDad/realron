"use client"

import { useState, useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Brain, 
  ChevronDown, 
  ChevronUp,
  Sparkles,
  Zap,
  Eye,
  EyeOff
} from "lucide-react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { emitTimelineEvent } from "@/components/migration/timeline-adapter"

interface ThinkingBubbleProps {
  content: string
  tokenCount?: number
  isStreaming?: boolean
  isMinimized?: boolean
  onToggleMinimize?: () => void
  className?: string
  agentId?: string
}

export function ThinkingBubble({
  content,
  tokenCount,
  isStreaming = false,
  isMinimized = false,
  onToggleMinimize,
  className,
  agentId = 'claude-code'
}: ThinkingBubbleProps) {
  const [isExpanded, setIsExpanded] = useState(!isMinimized)
  const [showFullContent, setShowFullContent] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const previousContent = useRef<string>('')
  
  // Emit timeline event when content changes
  useEffect(() => {
    if (content && content !== previousContent.current) {
      emitTimelineEvent('thinking-update', {
        text: content,
        isComplete: !isStreaming,
        agentId,
        tokenCount
      })
      previousContent.current = content
    }
  }, [content, isStreaming, agentId, tokenCount])
  
  // REMOVED: Auto-scroll behavior - user controls scrolling
  
  // Split content into lines for better display
  const lines = content.split('\n').filter(line => line.trim())
  const preview = lines.slice(0, 3).join(' ').substring(0, 150) + (lines.length > 3 ? '...' : '')
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
      >
        <Card className={cn(
          "overflow-hidden transition-all duration-300",
          "bg-gradient-to-br from-indigo-50/50 to-purple-50/50",
          "dark:from-indigo-950/20 dark:to-purple-950/20",
          "border-indigo-200 dark:border-indigo-800",
          "backdrop-blur-sm shadow-lg",
          className
        )}>
          {/* Header */}
          <div className="px-4 py-3 border-b border-indigo-200/50 dark:border-indigo-800/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
                    <Brain className="w-5 h-5 text-white" />
                  </div>
                  {isStreaming && (
                    <div className="absolute -top-1 -right-1">
                      <span className="flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    Reasoning Process
                    {isStreaming && (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      >
                        <Sparkles className="w-4 h-4 text-indigo-500" />
                      </motion.div>
                    )}
                  </h3>
                  {tokenCount !== undefined && (
                    <div className="flex items-center gap-2 mt-0.5">
                      <Zap className="w-3 h-3 text-amber-500" />
                      <span className="text-xs text-muted-foreground">
                        {tokenCount.toLocaleString()} tokens
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFullContent(!showFullContent)}
                  className="h-8 w-8 p-0"
                >
                  {showFullContent ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
                {onToggleMinimize && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsExpanded(!isExpanded)
                      onToggleMinimize()
                    }}
                    className="h-8 w-8 p-0"
                  >
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
          
          {/* Content */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="p-4">
                  {showFullContent ? (
                    <ScrollArea 
                      ref={scrollRef}
                      className="max-h-96 pr-4"
                    >
                      <div className="space-y-2">
                        {lines.map((line, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.01 }}
                            className="text-sm text-muted-foreground leading-relaxed"
                          >
                            {line.startsWith('•') || line.startsWith('-') ? (
                              <div className="flex gap-2">
                                <span className="text-indigo-500 mt-0.5">•</span>
                                <span>{line.substring(1).trim()}</span>
                              </div>
                            ) : line.startsWith('  ') ? (
                              <div className="ml-6 text-xs opacity-80">{line.trim()}</div>
                            ) : (
                              <div className={cn(
                                line.toLowerCase().includes('error') && "text-red-500",
                                line.toLowerCase().includes('success') && "text-green-500",
                                line.toLowerCase().includes('warning') && "text-amber-500",
                                line.toLowerCase().includes('important') && "font-semibold"
                              )}>
                                {line}
                              </div>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="text-sm text-muted-foreground leading-relaxed">
                      <p className="line-clamp-3">{preview}</p>
                      {lines.length > 3 && (
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() => setShowFullContent(true)}
                          className="h-auto p-0 mt-2 text-indigo-500 hover:text-indigo-600"
                        >
                          Show full reasoning ({lines.length} steps)
                        </Button>
                      )}
                    </div>
                  )}
                  
                  {isStreaming && (
                    <div className="mt-3 flex items-center gap-2">
                      <div className="flex space-x-1">
                        <motion.div
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
                          className="w-2 h-2 rounded-full bg-indigo-500"
                        />
                        <motion.div
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                          className="w-2 h-2 rounded-full bg-purple-500"
                        />
                        <motion.div
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
                          className="w-2 h-2 rounded-full bg-pink-500"
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Processing thoughts...
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Collapsed state preview */}
          {!isExpanded && (
            <div className="px-4 py-2 text-xs text-muted-foreground">
              <p className="line-clamp-1">{preview}</p>
            </div>
          )}
        </Card>
      </motion.div>
    </AnimatePresence>
  )
}
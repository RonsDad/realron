"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Brain, Sparkles, Zap, ChevronDown, ChevronUp, Activity } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ThinkingViewProps {
  reasoning: string
  tokenCount?: number
  isStreaming?: boolean
  className?: string
}

export function ThinkingView({ reasoning, tokenCount, isStreaming = false, className }: ThinkingViewProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [displayedText, setDisplayedText] = useState("")
  
  // Animate text display when streaming
  useEffect(() => {
    if (isStreaming) {
      setDisplayedText(reasoning)
    } else {
      // When not streaming, show all text at once
      setDisplayedText(reasoning)
    }
  }, [reasoning, isStreaming])


  if (!reasoning?.trim()) return null

  // Split thoughts by double newlines or specific patterns
  const thoughtSteps = reasoning
    .split(/\n\n+/)
    .filter(line => line.trim())
    .map(step => step.trim())
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("space-y-4", className)}
    >
      <Card className={cn(
        "border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 shadow-lg",
        "transition-all duration-300",
        !isExpanded && "h-auto"
      )}>
        <CardHeader className="pb-3 px-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <motion.div
                animate={{
                  rotate: isStreaming ? 360 : 0,
                  scale: isStreaming ? [1, 1.1, 1] : 1
                }}
                transition={{
                  rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                  scale: { duration: 1, repeat: Infinity, ease: "easeInOut" }
                }}
              >
                <Brain className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </motion.div>
              <span className="text-sm font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400 bg-clip-text text-transparent">
                Chain of Thought
              </span>
              {isStreaming && (
                <motion.div
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="flex items-center gap-1"
                >
                  <Activity className="w-3 h-3 text-purple-500" />
                  <span className="text-xs text-purple-600 dark:text-purple-400">Thinking...</span>
                </motion.div>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-purple-600 hover:bg-purple-100 dark:text-purple-400 dark:hover:bg-purple-900/20"
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="px-3 pb-3">
          <AnimatePresence>
            {isExpanded ? (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-3 overflow-hidden"
              >
                <div className="space-y-2">
                  {thoughtSteps.map((step, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: isStreaming ? 0 : index * 0.05 }}
                      className="bg-white/50 dark:bg-black/20 rounded-lg p-3"
                    >
                      <div className="flex items-start gap-2">
                        <div className="flex-shrink-0 mt-0.5">
                          <motion.div
                            animate={isStreaming && index === thoughtSteps.length - 1 ? {
                              scale: [1, 1.2, 1],
                              rotate: [0, 180, 360]
                            } : {}}
                            transition={{ duration: 1, repeat: Infinity }}
                            className={cn(
                              "w-5 h-5 rounded-full flex items-center justify-center",
                              index < thoughtSteps.length - 1 || !isStreaming
                                ? "bg-purple-500/20 text-purple-600 dark:text-purple-400"
                                : "bg-gradient-to-r from-purple-500 to-indigo-500 text-white"
                            )}
                          >
                            {index < thoughtSteps.length - 1 || !isStreaming ? (
                              <Zap className="w-2.5 h-2.5" />
                            ) : (
                              <Sparkles className="w-2.5 h-2.5" />
                            )}
                          </motion.div>
                        </div>
                        <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed flex-1">
                          {step}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ height: "auto", opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: "auto", opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-2"
                style={{ overflow: "hidden" }}
              >
                <div className="flex items-center gap-1.5 text-xs text-purple-600 dark:text-purple-400">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="font-medium">
                    {isStreaming ? "Analyzing..." : `${thoughtSteps.length} thought steps`}
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                  {displayedText.slice(0, 150)}...
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  )
}
"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp, Brain } from "lucide-react"
import { cn } from "@/lib/utils"

interface ReasoningDisplayProps {
  reasoning: string
  tokenCount?: number
  className?: string
}

export function ReasoningDisplay({ reasoning, tokenCount, className }: ReasoningDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  if (!reasoning?.trim()) return null

  return (
    <Card className={cn(
      "border-blue-200 bg-gradient-to-r from-blue-600 to-blue-700 shadow-sm transition-all duration-300",
      className
    )}>
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-white">
            <Brain className="h-3.5 w-3.5" />
            <span className="font-medium text-xs">Extended Thinking</span>
            {tokenCount && (
              <span className="text-xs bg-blue-800/50 px-1.5 py-0.5 rounded-full">
                {tokenCount} tokens
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-white hover:bg-blue-800/30 h-6 w-6 p-0"
          >
            {isExpanded ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
        
        <div className="overflow-hidden">
          {isExpanded ? (
            <div className="space-y-2">
              <div className="h-px bg-blue-400/30 mb-2" />
              <div className="text-white/90 text-xs leading-relaxed whitespace-pre-wrap font-mono">
                {reasoning}
              </div>
            </div>
          ) : (
            <div className="text-white/70 text-xs truncate">
              {reasoning.slice(0, 100)}...
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
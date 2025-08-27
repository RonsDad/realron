"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp, FileSearch, Brain, Pill, Stethoscope } from "lucide-react"
import { cn } from "@/lib/utils"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface ToolOutputBubbleProps {
  toolName: string
  content: string
  timestamp?: Date
  className?: string
}

// Simplified color scheme - one color per service
const getToolConfig = (toolName: string) => {
  // Code execution - Purple
  if (toolName === 'code_execution') {
    return {
      color: "from-purple-500 to-purple-600",
      borderColor: "border-purple-200",
      bgColor: "bg-purple-50 dark:bg-purple-950/20",
      icon: Brain,
      title: "Python Code Execution"
    }
  }
  
  // Perplexity tools - Green
  if (toolName.startsWith('perplexity_')) {
    return {
      color: "from-green-500 to-green-600",
      borderColor: "border-green-200",
      bgColor: "bg-green-50 dark:bg-green-950/20",
      icon: Brain,
      title: "Perplexity"
    }
  }
  
  // PubMed tools - Blue
  if (toolName.startsWith('pubmed_')) {
    return {
      color: "from-blue-500 to-blue-600",
      borderColor: "border-blue-200",
      bgColor: "bg-blue-50 dark:bg-blue-950/20",
      icon: FileSearch,
      title: "PubMed"
    }
  }
  
  // FDA tools - Orange
  if (toolName.startsWith('search') || toolName.startsWith('get')) {
    return {
      color: "from-orange-500 to-orange-600",
      borderColor: "border-orange-200",
      bgColor: "bg-orange-50 dark:bg-orange-950/20",
      icon: Pill,
      title: "FDA"
    }
  }
  
  // Clinical Agent - Teal
  if (toolName === 'clinical_operations') {
    return {
      color: "from-teal-500 to-teal-600",
      borderColor: "border-teal-200",
      bgColor: "bg-teal-50 dark:bg-teal-950/20",
      icon: Stethoscope,
      title: "Clinical Agent"
    }
  }
  
  // Default
  return {
    color: "from-gray-500 to-gray-600",
    borderColor: "border-gray-200",
    bgColor: "bg-gray-50 dark:bg-gray-950/20",
    icon: Brain,
    title: toolName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }
}

export function ToolOutputBubble({ toolName, content, timestamp, className }: ToolOutputBubbleProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  const config = getToolConfig(toolName)
  const Icon = config.icon
  
  // Truncate content for preview
  const preview = content.length > 150 ? content.substring(0, 150) + "..." : content
  
  return (
    <Card className={cn(
      config.borderColor,
      config.bgColor,
      "shadow-sm transition-all duration-300",
      className
    )}>
      <CardHeader className="pb-3 px-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center",
              `bg-gradient-to-r ${config.color}`
            )}>
              <Icon className="w-4 h-4 text-white" />
            </div>
            <span className={cn(
              "text-sm font-semibold bg-gradient-to-r bg-clip-text text-transparent",
              config.color
            )}>
              {config.title}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-6 w-6 p-0"
          >
            {isExpanded ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="px-3 pb-3">
        <div className="overflow-hidden">
          {isExpanded ? (
            <div className="prose prose-sm max-w-none dark:prose-invert max-h-64 overflow-y-auto">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content}
              </ReactMarkdown>
            </div>
          ) : (
            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-3">
              {preview}
            </p>
          )}
        </div>
        
        {timestamp && (
          <span className="text-xs text-muted-foreground mt-2 block">
            {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </CardContent>
    </Card>
  )
}

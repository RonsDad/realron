"use client"

import { Bot, ChevronDown, ChevronRight, Search, Brain, FileText, Globe, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"

interface ClinicalOpsOutput {
  id: string
  type: "reasoning" | "web_search_call" | "function_call" | "file_search_call"
  summary?: Array<{ type: string; text: string }>
  status?: string
  action?: { type: string; query?: string }
  arguments?: string
  name?: string
  call_id?: string
}

interface ClinicalOpsMessageProps {
  response: {
    id: string
    output: ClinicalOpsOutput[]
    created_at: number
    model: string
    usage?: {
      input_tokens: number
      output_tokens: number
      total_tokens: number
    }
  }
  timestamp?: Date
  className?: string
}

function TimelineIcon({ type }: { type: string }) {
  switch (type) {
    case "reasoning":
      return <Brain className="w-4 h-4" />
    case "web_search_call":
      return <Globe className="w-4 h-4" />
    case "function_call":
      return <FileText className="w-4 h-4" />
    case "file_search_call":
      return <Search className="w-4 h-4" />
    default:
      return <Clock className="w-4 h-4" />
  }
}

function getTypeLabel(type: string): string {
  switch (type) {
    case "reasoning":
      return "Reasoning"
    case "web_search_call":
      return "Web Search"
    case "function_call":
      return "Function Call"
    case "file_search_call":
      return "File Search"
    default:
      return "Action"
  }
}

function getTypeColor(type: string): string {
  switch (type) {
    case "reasoning":
      return "bg-purple-500/10 border-purple-500/20 text-purple-700 dark:text-purple-300"
    case "web_search_call":
      return "bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-300"
    case "function_call":
      return "bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-300"
    case "file_search_call":
      return "bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-300"
    default:
      return "bg-gray-500/10 border-gray-500/20 text-gray-700 dark:text-gray-300"
  }
}

function TimelineItem({ item, isLast }: { item: ClinicalOpsOutput; isLast: boolean }) {
  const [expanded, setExpanded] = useState(false)
  const hasContent = item.summary?.length > 0 || item.action || item.arguments

  return (
    <div className="flex gap-3">
      {/* Timeline line and icon */}
      <div className="flex flex-col items-center">
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center border-2",
          getTypeColor(item.type),
          "bg-opacity-20"
        )}>
          <TimelineIcon type={item.type} />
        </div>
        {!isLast && (
          <div className="w-0.5 flex-1 bg-border/50 mt-2" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 pb-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={cn(
                "text-xs font-medium px-2 py-0.5 rounded-full",
                getTypeColor(item.type)
              )}>
                {getTypeLabel(item.type)}
              </span>
              {item.status && (
                <span className="text-xs text-muted-foreground">
                  {item.status}
                </span>
              )}
            </div>

            {/* Main content based on type */}
            {item.type === "reasoning" && item.summary && item.summary.length > 0 && (
              <div className="mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpanded(!expanded)}
                  className="h-auto p-0 font-normal justify-start hover:bg-transparent"
                >
                  {expanded ? <ChevronDown className="w-3 h-3 mr-1" /> : <ChevronRight className="w-3 h-3 mr-1" />}
                  <span className="text-sm text-foreground">
                    View reasoning ({item.summary.length} {item.summary.length === 1 ? 'step' : 'steps'})
                  </span>
                </Button>
                {expanded && (
                  <div className="mt-2 pl-4 space-y-2 border-l-2 border-purple-200 dark:border-purple-800">
                    {item.summary.map((summary, idx) => (
                      <div key={idx} className="text-sm text-muted-foreground">
                        <div className="font-medium text-foreground mb-1">
                          {summary.text.split('\n')[0].replace(/\*\*/g, '')}
                        </div>
                        <div className="pl-2 opacity-90">
                          {summary.text.split('\n').slice(1).join('\n')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {item.type === "web_search_call" && item.action && (
              <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950/30 rounded-md">
                <p className="text-sm font-mono text-blue-700 dark:text-blue-300">
                  {item.action.query}
                </p>
              </div>
            )}

            {item.type === "function_call" && (
              <div className="mt-2 p-2 bg-green-50 dark:bg-green-950/30 rounded-md">
                <p className="text-sm font-medium text-green-700 dark:text-green-300">
                  {item.name}
                </p>
                {item.arguments && (
                  <pre className="text-xs mt-1 text-green-600 dark:text-green-400 overflow-x-auto">
                    {item.arguments}
                  </pre>
                )}
              </div>
            )}

            {item.type === "file_search_call" && (
              <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-950/30 rounded-md">
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Searching vector store...
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export function ClinicalOpsMessage({ 
  response, 
  timestamp, 
  className 
}: ClinicalOpsMessageProps) {
  const [showFullTimeline, setShowFullTimeline] = useState(false)
  
  // Filter out empty reasoning blocks
  const timelineItems = response.output.filter(item => {
    if (item.type === "reasoning") {
      return item.summary && item.summary.length > 0
    }
    return true
  })

  // Show limited items initially
  const displayItems = showFullTimeline ? timelineItems : timelineItems.slice(0, 3)
  const hasMore = timelineItems.length > 3

  return (
    <div className={cn("flex gap-4 group", className)}>
      {/* Avatar */}
      <div className="flex-shrink-0">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md transition-transform group-hover:scale-105 bg-gradient-to-br from-purple-600 to-purple-700">
          <Bot className="w-5 h-5 text-white" />
        </div>
      </div>
      
      {/* Message Content */}
      <div className="flex-1 max-w-[85%] md:max-w-[75%]">
        {/* Name and timestamp */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-foreground">
            Clinical Ops Agent
          </span>
          {timestamp && (
            <span className="text-xs text-muted-foreground">
              {timestamp.toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </span>
          )}
          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
            {response.model}
          </span>
        </div>
        
        {/* Message Card with Timeline */}
        <Card className="px-4 py-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/70 dark:to-slate-800/50 border-slate-200 dark:border-slate-700 shadow-md hover:shadow-lg">
          <ScrollArea className="max-h-[600px] pr-2">
            <div className="space-y-0">
              {displayItems.map((item, index) => (
                <TimelineItem 
                  key={item.id} 
                  item={item} 
                  isLast={index === displayItems.length - 1 && !hasMore}
                />
              ))}
            </div>

            {hasMore && (
              <div className="mt-4 flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFullTimeline(!showFullTimeline)}
                  className="text-xs"
                >
                  {showFullTimeline ? (
                    <>Show Less</>
                  ) : (
                    <>Show {timelineItems.length - 3} More Actions</>
                  )}
                </Button>
              </div>
            )}

            {/* Token Usage */}
            {response.usage && (
              <div className="mt-4 pt-4 border-t border-border/50">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Input: {response.usage.input_tokens.toLocaleString()} tokens</span>
                  <span>Output: {response.usage.output_tokens.toLocaleString()} tokens</span>
                  <span>Total: {response.usage.total_tokens.toLocaleString()} tokens</span>
                </div>
              </div>
            )}
          </ScrollArea>
        </Card>
      </div>
    </div>
  )
}
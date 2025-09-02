"use client"

import { useRef, useEffect } from "react"
import { ConversationItem } from "@/components/conversation-item"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import type { ConversationEvent } from "@/lib/types"

interface ConversationStreamProps {
  events: ConversationEvent[]
  isProcessing?: boolean
  className?: string
}

export function ConversationStream({ 
  events, 
  isProcessing = false,
  className 
}: ConversationStreamProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const endRef = useRef<HTMLDivElement>(null)
  
  // REMOVED: Auto-scroll behavior - user controls scrolling
  
  // Group parallel tool calls
  const processedEvents = events.reduce((acc, event) => {
    // Check if this is a parallel tool call
    if (event.data.isParallel && event.data.groupId) {
      // Find existing group or create new one
      const existingGroup = acc.find(
        (e: ConversationEvent) => e.type === 'parallel_group' && e.data.groupId === event.data.groupId
      )
      
      if (existingGroup) {
        existingGroup.data.events = existingGroup.data.events || []
        existingGroup.data.events.push(event)
      } else {
        // Create a new parallel group
        acc.push({
          id: `group-${event.data.groupId}`,
          type: 'parallel_group' as any,
          timestamp: event.timestamp,
          status: 'executing' as const,
          data: {
            groupId: event.data.groupId,
            events: [event]
          }
        })
      }
    } else {
      acc.push(event)
    }
    
    return acc
  }, [] as ConversationEvent[])
  
  return (
    <ScrollArea 
      ref={scrollRef}
      className={cn("flex-1 pr-4", className)}
    >
      <div className="space-y-4 pb-4">
        {processedEvents.map((event: ConversationEvent) => (
          <ConversationItem 
            key={event.id}
            event={event}
            isStreaming={event.status === "streaming"}
          />
        ))}
        
        {/* Loading indicator */}
        {isProcessing && events.length === 0 && (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-3 text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
              <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
              <div className="w-2 h-2 rounded-full bg-primary animate-bounce" />
              <span className="text-sm">Processing your request...</span>
            </div>
          </div>
        )}
        
        <div ref={endRef} />
      </div>
    </ScrollArea>
  )
}
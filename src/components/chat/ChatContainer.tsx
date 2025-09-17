"use client"

import { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Activity } from "lucide-react"
import { AgentTimeline } from "@/components/agent-timeline"
import type { Message } from "@/lib/types"

export interface ChatContainerProps {
  children: ReactNode
  showTimeline: boolean
  setShowTimeline: (show: boolean) => void
  messages: Message[]
  agentState: {
    isActive: boolean
  }
  isMobile?: boolean
}

export function ChatContainer({
  children,
  showTimeline,
  setShowTimeline,
  messages,
  agentState,
  isMobile = false
}: ChatContainerProps) {
  if (isMobile) {
    return (
      <main className="h-full px-4 py-6 pb-24">
        <div className={`mx-auto transition-all duration-500 ${
          agentState.isActive ? "max-w-full pr-2" : "max-w-4xl"
        }`}>
          {/* Timeline/Message View Toggle */}
          {messages.length > 0 && (
            <div className="flex justify-center mb-4">
              <div className="inline-flex rounded-lg border border-border p-1 bg-background/50 backdrop-blur">
                <Button
                  variant={showTimeline ? "ghost" : "secondary"}
                  size="sm"
                  onClick={() => setShowTimeline(false)}
                  className="text-xs"
                >
                  Messages
                </Button>
                <Button
                  variant={showTimeline ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setShowTimeline(true)}
                  className="text-xs"
                >
                  <Activity className="w-3 h-3 mr-1" />
                  Timeline
                </Button>
              </div>
            </div>
          )}
          
          {showTimeline && messages.length > 0 ? (
            <div className="animate-fade-in">
              <AgentTimeline
                className="rounded-xl border border-border bg-card/50 backdrop-blur"
                onClose={() => setShowTimeline(false)}
              />
            </div>
          ) : (
            children
          )}
        </div>
      </main>
    )
  }

  return (
    <main className="flex-1 pb-32 pt-32">
      <div className="container max-w-7xl mx-auto px-6">
        {/* Timeline/Message View Toggle */}
        {messages.length > 0 && (
          <div className="flex justify-center mb-6">
            <div className="inline-flex rounded-lg border border-border p-1 bg-background/50 backdrop-blur">
              <Button
                variant={showTimeline ? "ghost" : "secondary"}
                size="default"
                onClick={() => setShowTimeline(false)}
              >
                Messages
              </Button>
              <Button
                variant={showTimeline ? "secondary" : "ghost"}
                size="default"
                onClick={() => setShowTimeline(true)}
              >
                <Activity className="w-4 h-4 mr-2" />
                Timeline
              </Button>
            </div>
          </div>
        )}
        
        {showTimeline && messages.length > 0 ? (
          <div className="animate-fade-in">
            <AgentTimeline
              className="rounded-xl border border-border bg-card/50 backdrop-blur min-h-[600px]"
              onClose={() => setShowTimeline(false)}
            />
          </div>
        ) : (
          children
        )}
      </div>
    </main>
  )
}
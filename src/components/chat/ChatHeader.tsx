"use client"

import { Bot, Monitor } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"

export interface ChatHeaderProps {
  showCareTeam: boolean
  setShowCareTeam: (show: boolean) => void
  agentState: {
    isActive: boolean
  }
  startAgent: (task: string, url?: string) => Promise<void>
  stopAgent: () => Promise<void>
  isMobile?: boolean
}

export function ChatHeader({
  showCareTeam,
  setShowCareTeam,
  agentState,
  startAgent,
  stopAgent,
  isMobile = false
}: ChatHeaderProps) {
  const handleBrowserToggle = async () => {
    if (agentState.isActive) {
      await stopAgent()
    } else {
      try {
        await startAgent("Computer Use Agent Active", undefined)
      } catch (error) {
        console.error("Error starting Computer Use Agent:", error)
      }
    }
  }

  if (isMobile) {
    return (
      <header className="sticky top-0 z-10 flex items-center justify-between py-4 px-4 pl-20 bg-background/80 backdrop-blur-xl border-b border-primary/10 shadow-lg">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center border border-primary/30">
            <Bot className="w-4 h-4 text-primary" />
          </div>
          <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Ron AI
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowCareTeam(!showCareTeam)}
            className="text-xs font-medium hover:text-primary"
          >
            Care Team
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBrowserToggle}
            className={`text-xs font-medium hover:text-primary ${agentState.isActive ? "text-primary" : ""}`}
          >
            <Monitor className="w-3 h-3 mr-1" />
            {agentState.isActive ? "Close Browser" : "Open Browser"}
          </Button>
          <ThemeToggle />
        </div>
      </header>
    )
  }

  return (
    <header
      className={`fixed top-0 z-10 flex items-center justify-between py-5 px-6 pl-20 bg-background/80 backdrop-blur-xl border-b border-primary/10 shadow-lg transition-all duration-300 ${
        agentState.isActive ? "left-0 right-1/2" : "left-0 right-0"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center border border-primary/30 shadow-lg">
          <Bot className="w-5 h-5 text-primary" />
        </div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Ron AI
        </h1>
      </div>
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowCareTeam(!showCareTeam)}
          className="text-sm font-medium hover:text-primary transition-colors px-3 py-1.5 rounded-lg hover:bg-primary/10"
        >
          Care Team
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBrowserToggle}
          className={`text-sm font-medium hover:text-primary ${agentState.isActive ? "text-primary" : ""}`}
        >
          <Monitor className="w-4 h-4 mr-2" />
          {agentState.isActive ? "Close Browser" : "Open Browser"}
        </Button>
        <ThemeToggle />
      </div>
    </header>
  )
}
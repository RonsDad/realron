"use client"

import { forwardRef, useState } from "react"
import { ArrowUp, Paperclip, Mic, Sparkles, Monitor, BrainCircuit, Settings, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { PromptBuilderDialog } from "@/components/prompt-builder-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem
} from "@/components/ui/dropdown-menu"

export interface ChatInputProps {
  inputValue: string
  setInputValue: (value: string) => void
  inputRef?: React.RefObject<HTMLTextAreaElement>
  isProcessing: boolean
  handleSendMessage?: () => Promise<void>
  wrappedHandleSendMessage?: () => Promise<void>
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  connectionStatus: string
  retryCount: number
  lastFailedMessage: string | null
  handleRetryMessage?: () => Promise<void>
  wrappedHandleRetryMessage?: () => Promise<void>
  agentState: {
    isActive: boolean
  }
  startAgent: (task: string, url?: string) => Promise<void>
  stopAgent: () => Promise<void>
  isDeepResearch: boolean
  setIsDeepResearch: (enabled: boolean) => void
  setDeepResearchSessionId: (id: string | null) => void
  setDeepResearchUserId: (id: string | null) => void
  setDeepResearchOutputs: (outputs: any) => void
  setDeepResearchMessages: (messages: any[]) => void
  isOpen?: boolean
  isMobile?: boolean
  hasMessages?: boolean
}

export const ChatInput = forwardRef<HTMLTextAreaElement, ChatInputProps>(
  ({
    inputValue,
    setInputValue,
    inputRef,
    isProcessing,
    handleSendMessage,
    wrappedHandleSendMessage,
    handleInputChange,
    connectionStatus,
    retryCount,
    lastFailedMessage,
    handleRetryMessage,
    wrappedHandleRetryMessage,
    agentState,
    startAgent,
    stopAgent,
    isDeepResearch,
    setIsDeepResearch,
    setDeepResearchSessionId,
    setDeepResearchUserId,
    setDeepResearchOutputs,
    setDeepResearchMessages,
    isOpen = false,
    isMobile = false,
    hasMessages = false
  }, ref) => {
    // Use the appropriate handler functions
    const actualHandleSendMessage = wrappedHandleSendMessage || handleSendMessage || (() => Promise.resolve())
    const actualHandleRetryMessage = wrappedHandleRetryMessage || handleRetryMessage || (() => Promise.resolve())
    const textareaRef = inputRef || ref
    const [selectedTools, setSelectedTools] = useState<string[]>(['fda', 'pubmed', 'clinical'])

    const availableTools = [
      { id: 'fda', name: 'FDA Database', description: 'Drug information and safety data' },
      { id: 'pubmed', name: 'PubMed Research', description: 'Medical research and publications' },
      { id: 'clinical', name: 'Clinical Agent', description: 'Clinical decision support' },
      { id: 'browser', name: 'Browser Tools', description: 'Web research and automation' },
      { id: 'computer', name: 'Computer Use', description: 'Desktop automation' },
    ]

    const mcpServers = [
      { id: 'telnyx', name: 'Telnyx MCP', description: 'Communication services' },
      { id: 'brave', name: 'Brave Search', description: 'Web search capabilities' },
      { id: 'browserbase', name: 'Browserbase', description: 'Browser automation' },
    ]

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

    const handleDeepResearchToggle = (checked: boolean) => {
      console.log(isMobile ? "DEEP RESEARCH TOGGLE CHANGED TO:" : "DEEP RESEARCH TOGGLE CHANGED TO (DESKTOP):", checked)
      setIsDeepResearch(checked)
      if (!checked) {
        setDeepResearchSessionId(null)
        setDeepResearchUserId(null)
        setDeepResearchOutputs({})
        setDeepResearchMessages([])
      }
    }

    const handleToolToggle = (toolId: string) => {
      setSelectedTools(prev => 
        prev.includes(toolId) 
          ? prev.filter(id => id !== toolId)
          : [...prev, toolId]
      )
    }

    if (isMobile) {
      return (
        <div className="fixed bottom-0 left-0 right-0 z-50">
          <div className="max-w-4xl mx-auto">
            <Card className="glass-morphism border-0 shadow-2xl premium-shadow">
              <div className="p-6">
                <div className="flex items-end gap-4">
                  <PromptBuilderDialog onSendPrompt={actualHandleSendMessage} />
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-12 w-12 rounded-xl hover:bg-primary/10 transition-all duration-300 hover-lift border border-border/50"
                      >
                        <Filter className="w-5 h-5 text-primary" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-80 glass-morphism border-primary/20">
                      <DropdownMenuLabel className="text-base font-semibold text-primary">Available Tools</DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-primary/20" />
                      {availableTools.map((tool) => (
                        <DropdownMenuCheckboxItem
                          key={tool.id}
                          checked={selectedTools.includes(tool.id)}
                          onCheckedChange={() => handleToolToggle(tool.id)}
                          className="flex flex-col items-start py-3 hover:bg-primary/5"
                        >
                          <div className="font-medium">{tool.name}</div>
                          <div className="text-xs text-muted-foreground">{tool.description}</div>
                        </DropdownMenuCheckboxItem>
                      ))}
                      <DropdownMenuSeparator className="bg-primary/20" />
                      <DropdownMenuLabel className="text-base font-semibold text-primary">MCP Servers</DropdownMenuLabel>
                      {mcpServers.map((server) => (
                        <DropdownMenuItem key={server.id} className="flex flex-col items-start py-3 hover:bg-primary/5">
                          <div className="font-medium">{server.name}</div>
                          <div className="text-xs text-muted-foreground">{server.description}</div>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  
                  <div className="flex-1">
                    <Textarea
                      ref={textareaRef}
                      value={inputValue}
                      onChange={handleInputChange}
                      placeholder="Message Ron AI..."
                      className={`w-full resize-none bg-input/50 border-2 border-primary/20 placeholder:text-muted-foreground/60 transition-all duration-300 rounded-2xl px-6 py-4 text-base font-medium input-glow shadow-lg hover-lift ${
                        hasMessages ? "min-h-[60px] max-h-[120px]" : "min-h-[80px] max-h-[160px]"
                      }`}
                      rows={hasMessages ? 2 : 3}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault()
                          actualHandleSendMessage()
                        }
                      }}
                    />
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-12 w-12 rounded-xl border border-border/50 hover:border-primary/40 hover:bg-primary/10 transition-all duration-300 hover-lift"
                    >
                      <Paperclip className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-12 w-12 rounded-xl border border-border/50 hover:border-primary/40 hover:bg-primary/10 transition-all duration-300 hover-lift"
                    >
                      <Mic className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
                    </Button>
                    <Button
                      onClick={actualHandleSendMessage}
                      size="icon"
                      className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary via-primary/90 to-accent/80 hover:from-primary/90 hover:to-accent/70 text-primary-foreground shadow-xl transition-all duration-300 glow-button hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
                      disabled={isProcessing || !inputValue.trim()}
                    >
                      {isProcessing ? (
                        <Sparkles className="w-5 h-5 animate-pulse" />
                      ) : (
                        <ArrowUp className="w-5 h-5" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between px-6 pb-4 pt-2 border-t border-primary/10">
                <div className="flex items-center gap-4">
                  {connectionStatus === 'connecting' && (
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                      Connecting...
                    </div>
                  )}
                  {connectionStatus === 'connected' && (
                    <div className="flex items-center gap-2 text-sm font-medium text-green-600">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      Connected
                    </div>
                  )}
                  {connectionStatus === 'error' && (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 text-sm font-medium text-red-600">
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                        Connection Error
                      </div>
                      {lastFailedMessage && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={actualHandleRetryMessage}
                          disabled={isProcessing}
                          className="text-sm h-7 px-3 font-medium"
                        >
                          Retry {retryCount > 1 && `(${retryCount})`}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-6">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBrowserToggle}
                    className="text-sm font-semibold hover:text-primary transition-all duration-200 px-3 py-2 rounded-lg hover:bg-primary/10"
                  >
                    <Monitor className="w-4 h-4 mr-2 text-primary/70" />
                    {agentState.isActive ? "Close Browser" : "Browser"}
                  </Button>
                  <div className="flex items-center gap-3">
                    <BrainCircuit className="w-5 h-5 text-primary" />
                    <label htmlFor="deep-research-mobile" className="text-sm font-semibold cursor-pointer">
                      Deep Research
                    </label>
                    <Switch
                      id="deep-research-mobile"
                      checked={isDeepResearch}
                      onCheckedChange={handleDeepResearchToggle}
                      className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-primary data-[state=checked]:to-accent shadow-lg transition-all duration-300"
                    />
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )
    }

    // Desktop version
    return (
      <div
        className={`fixed bottom-0 transition-all duration-300 z-50 ${
          agentState.isActive ? "left-0 right-1/2" : "left-0 right-0"
        } ${isOpen ? "ml-64" : "ml-16"}`}
      >
        <div className={`container mx-auto px-6 ${hasMessages ? "max-w-5xl" : "max-w-4xl"}`}>
          <Card className={`glass-morphism border-0 shadow-2xl premium-shadow transition-all duration-500 ${
            hasMessages ? "" : "mt-20"
          }`}>
            <div className={`transition-all duration-500 ${hasMessages ? "p-6" : "p-8"}`}>
              <div className="flex items-end gap-4">
                <PromptBuilderDialog onSendPrompt={actualHandleSendMessage} />
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-14 w-14 rounded-xl hover:bg-primary/10 transition-all duration-300 hover-lift border border-border/50 group"
                    >
                      <Filter className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-80 glass-morphism border-primary/20">
                    <DropdownMenuLabel className="text-lg font-bold text-primary">Available Tools</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-primary/20" />
                    {availableTools.map((tool) => (
                      <DropdownMenuCheckboxItem
                        key={tool.id}
                        checked={selectedTools.includes(tool.id)}
                        onCheckedChange={() => handleToolToggle(tool.id)}
                        className="flex flex-col items-start py-4 hover:bg-primary/5 transition-all duration-200"
                      >
                        <div className="font-semibold text-base">{tool.name}</div>
                        <div className="text-sm text-muted-foreground">{tool.description}</div>
                      </DropdownMenuCheckboxItem>
                    ))}
                    <DropdownMenuSeparator className="bg-primary/20" />
                    <DropdownMenuLabel className="text-lg font-bold text-primary">MCP Servers</DropdownMenuLabel>
                    {mcpServers.map((server) => (
                      <DropdownMenuItem key={server.id} className="flex flex-col items-start py-4 hover:bg-primary/5 transition-all duration-200">
                        <div className="font-semibold text-base">{server.name}</div>
                        <div className="text-sm text-muted-foreground">{server.description}</div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <div className="flex-1">
                  <Textarea
                    ref={ref}
                    value={inputValue}
                    onChange={handleInputChange}
                    placeholder={hasMessages ? "Continue your conversation..." : "Ask about symptoms, treatments, or find a specialist..."}
                    className={`w-full resize-none bg-input/50 border-2 border-primary/20 placeholder:text-muted-foreground/60 transition-all duration-300 rounded-2xl px-6 py-5 text-lg font-medium input-glow shadow-xl hover-lift ${
                      hasMessages ? "min-h-[70px] max-h-[140px]" : "min-h-[80px] max-h-[160px]"
                    }`}
                    rows={hasMessages ? 2 : 3}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        actualHandleSendMessage()
                      }
                    }}
                  />
                </div>
                
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-14 w-14 rounded-xl border border-border/50 hover:border-primary/40 hover:bg-primary/10 transition-all duration-300 hover-lift"
                  >
                    <Paperclip className="w-6 h-6 text-muted-foreground hover:text-primary transition-colors" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-14 w-14 rounded-xl border border-border/50 hover:border-primary/40 hover:bg-primary/10 transition-all duration-300 hover-lift"
                  >
                    <Mic className="w-6 h-6 text-muted-foreground hover:text-primary transition-colors" />
                  </Button>
                  <Button
                    onClick={actualHandleSendMessage}
                    size="icon"
                    className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary via-primary/90 to-accent/80 hover:from-primary/90 hover:to-accent/70 text-primary-foreground shadow-xl transition-all duration-300 glow-button hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
                    disabled={isProcessing || !inputValue.trim()}
                  >
                    {isProcessing ? (
                      <Sparkles className="w-6 h-6 animate-pulse" />
                    ) : (
                      <ArrowUp className="w-6 h-6" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between px-6 py-4 border-t border-primary/10">
              <div className="flex items-center gap-6">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBrowserToggle}
                  className="text-sm font-bold hover:text-primary transition-colors px-4 py-2 rounded-lg hover:bg-primary/10"
                >
                  <Monitor className="w-5 h-5 mr-2" />
                  {agentState.isActive ? "Close Browser" : "Browser"}
                </Button>
                <div className="flex items-center gap-4">
                  <BrainCircuit className="w-6 h-6 text-primary" />
                  <label htmlFor="deep-research" className="text-base font-bold cursor-pointer">
                    Deep Research
                  </label>
                  <Switch
                    id="deep-research"
                    checked={isDeepResearch}
                    onCheckedChange={handleDeepResearchToggle}
                    className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-primary data-[state=checked]:to-accent shadow-lg transition-all duration-300 scale-110"
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    )
  }
)

ChatInput.displayName = "ChatInput"
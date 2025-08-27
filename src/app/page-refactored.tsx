"use client"

import { useState, useEffect, useRef } from "react"
import { ArrowUp, Bot, BrainCircuit, User, Paperclip, Mic, Monitor, Sparkles, Activity } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { ThemeToggle } from "@/components/theme-toggle"
import { AgentStatusIndicator } from "@/components/agent-status-indicator"
import { ProviderSearchInterface } from "@/components/provider-search-interface"
import { MedicationManagerInterface } from "@/components/medication-manager-interface"
import { CareTeamPanel } from "@/components/care-team-panel"
import { ComputerUseAgent } from "@/components/computer-use-agent"
import { BrowserTimeline } from "@/components/browser-timeline"
import { SidebarMinimal } from "@/components/sidebar-minimal"
import { useComputerAgent } from "@/hooks/use-computer-agent"
import { claudeAPI, parseSSEStream, type ChatMessage } from "@/lib/api"
import type { Message } from "@/lib/types"
import { ThinkingBubble } from "@/components/thinking-bubble"
import { MessageCard } from "@/components/message-card"
import { ClinicalOpsMessage } from "@/components/clinical-ops-message"
import { UniversalAgentOutput } from "@/components/universal-agent-output"
import { ClaudeCodeOutputCard } from "@/components/claude-code-output-card"
import { ResearchProgressUnified } from "@/components/research-progress-unified"
import { ToolOutputCard } from "@/components/tool-output-card"
import { ClaudeCodePreview } from "@/components/claude-code-preview"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CommandMenu } from "@/components/command-menu"
import { PromptBuilderDialog } from "@/components/prompt-builder-dialog"
import { useUserProfile } from "@/hooks/use-user-profile"
import { useRonAIStore } from "@/store"
import { useMessageHandler } from "@/hooks/use-message-handler"
import type { ProviderSearchData, ProviderSearchResult } from "@/lib/types"

import { AgentOrchestration } from "@/components/agent-orchestration"
import { AgentTimeline } from "@/components/agent-timeline"
import { TimelineAdapter } from "@/components/migration/timeline-adapter"
import { useTimelineIntegration } from "@/hooks/use-timeline-integration"
import { AgentActivityCard, type AgentActivity as AgentActivityType } from "@/components/agent-activity-card"

interface ThinkingData {
  id: string
  content: string
  timestamp: Date
}

interface ToolOutputData {
  id: string
  toolName: string
  content: string | object
  timestamp: Date
  status?: "pending" | "executing" | "completed" | "error"
}

interface CodeFileData {
  name: string
  language: string
  content: string
}

interface AgentActivity {
  id: string
  type: 'search' | 'fetch' | 'analysis' | 'synthesis' | 'thinking' | 'tool'
  agent: string
  description: string
  status: 'running' | 'completed' | 'error'
  timestamp: Date
  details?: any
  progress?: number
}

export default function HealthCopilot() {
  // Replace ALL 32 useState hooks with Zustand store - MAINTAINING EXACT VARIABLE NAMES
  const {
    // Chat state (6 variables)
    messages,
    setMessages,
    inputValue,
    setInputValue,
    isProcessing,
    setIsProcessing,
    currentStreamingMessage,
    setCurrentStreamingMessage,
    currentReasoning,
    setCurrentReasoning,
    reasoningTokens,
    setReasoningTokens,
    
    // Deep Research state (5 variables)
    isDeepResearch,
    setIsDeepResearch,
    deepResearchSessionId,
    setDeepResearchSessionId,
    deepResearchUserId,
    setDeepResearchUserId,
    deepResearchOutputs,
    setDeepResearchOutputs,
    deepResearchMessages,
    setDeepResearchMessages,
    
    // UI state (6 variables)
    showCareTeam,
    setShowCareTeam,
    isOpen,
    setIsOpen,
    mounted,
    setMounted,
    showCommandMenu,
    setShowCommandMenu,
    showTimeline,
    setShowTimeline,
    providerSearchData,
    setProviderSearchData,
    
    // Agent state (6 variables)
    agentActivities,
    setAgentActivities,
    currentOrchestrationAgent,
    setCurrentOrchestrationAgent,
    isAgentOrchestrationActive,
    setIsAgentOrchestrationActive,
    orchestrationActivities,
    setOrchestrationActivities,
    pendingOrchestrationTools,
    setPendingOrchestrationTools,
    browserActions,
    setBrowserActions,
    
    // Tool state (6 variables)
    thinkingBubbles,
    setThinkingBubbles,
    toolOutputs,
    setToolOutputs,
    currentThinkingId,
    setCurrentThinkingId,
    codeFiles,
    setCodeFiles,
    codeOutput,
    setCodeOutput,
    claudeCodeOutputs,
    setClaudeCodeOutputs,
    
    // Connection state (3 variables)
    connectionStatus,
    setConnectionStatus,
    retryCount,
    setRetryCount,
    lastFailedMessage,
    setLastFailedMessage,
  } = useRonAIStore()

  // Keep useRef hooks as they are - NOT part of store
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Other hooks remain the same
  const { userProfile } = useUserProfile()
  const { agentState, startAgent, stopAgent, updateUrl } = useComputerAgent()
  const { handleSSEStream, clearTimeline } = useTimelineIntegration()
  
  // Replace the massive handleSendMessage function with the hook
  const { handleSendMessage, handleRetryMessage } = useMessageHandler()

  useEffect(() => {
    setMounted(true)
    
    // Cleanup function to abort streams when component unmounts
    return () => {
      claudeAPI.abortAllStreams()
    }
  }, [setMounted])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, currentStreamingMessage])

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setInputValue(value)
  }

  const handleCommandSelect = (prompt: string) => {
    setInputValue(prompt)
    setShowCommandMenu(false)
    // Focus back on input
    inputRef.current?.focus()
  }

  // Wrap handleSendMessage to pass agent state
  const wrappedHandleSendMessage = async (messageOverride?: string) => {
    await handleSendMessage(messageOverride, agentState, startAgent, updateUrl)
  }

  // Wrap handleRetryMessage to pass agent state  
  const wrappedHandleRetryMessage = async () => {
    await handleRetryMessage(agentState, startAgent, updateUrl)
  }

  const renderAgentInterface = () => {
    // Show deep research progress when in deep research mode
    if (isDeepResearch && Object.keys(deepResearchOutputs).length > 0) {
      return (
        <ResearchProgressUnified
          outputs={deepResearchOutputs}
          messages={deepResearchMessages}
          currentAgent={deepResearchMessages.length > 0 ? deepResearchMessages[deepResearchMessages.length - 1].content : undefined}
          isProcessing={isProcessing}
          onSendMessage={(message: string) => {
            setInputValue(message)
            wrappedHandleSendMessage()
          }}
        />
      )
    }
    return null
  }

  if (!mounted) {
    return (
      <div className="flex min-h-screen bg-background text-foreground">
        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-center min-h-screen">
            <div className="w-8 h-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <TimelineAdapter>
      <div className="h-screen bg-background text-foreground overflow-hidden">
        <SidebarMinimal isOpen={isOpen} onOpenChange={setIsOpen} />

      <div className={`h-full bg-background ${isOpen ? 'ml-64' : 'ml-16'}`}>
        <div className="md:hidden">
          <ComputerUseAgent
            isVisible={agentState.isActive}
            onClose={async () => await stopAgent()}
            task={agentState.currentTask || undefined}
            liveUrl={agentState.liveUrl || undefined}
            isMobile={true}
            browserActions={browserActions}
          />

          <div className="transition-all duration-500">
            <header className="sticky top-0 z-10 flex items-center justify-between py-4 px-4 pl-20 bg-background/80 backdrop-blur-xl border-b border-primary/10 shadow-lg">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center border border-primary/30">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Ron AI</h1>
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
                  onClick={async () => {
                    if (agentState.isActive) {
                      await stopAgent()
                    } else {
                      try {
                        await startAgent("Computer Use Agent Active", undefined)
                      } catch (error) {
                        console.error("Error starting Computer Use Agent:", error)
                      }
                    }
                  }}
                  className={`text-xs font-medium hover:text-primary ${agentState.isActive ? "text-primary" : ""}`}
                >
                  <Monitor className="w-3 h-3 mr-1" />
                  {agentState.isActive ? "Close Browser" : "Open Browser"}
                </Button>
                <ThemeToggle />
              </div>
            </header>

            {showCareTeam && <CareTeamPanel onClose={() => setShowCareTeam(false)} />}

            <main className="messages-container px-4 py-6 pb-24">
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
                ) : messages.length === 0 ? (
                  <div className="text-center py-6">
                                      <h2 className={`font-semibold leading-tight mb-3 ${
                    agentState.isActive ? "text-2xl sm:text-3xl" : "text-3xl sm:text-4xl"
                  }`}>
                    Your Health Advocacy
                      <br />
                      <span className="text-transparent bg-gradient-to-r from-primary via-primary/80 to-accent bg-clip-text text-glow">
                        Co-Pilot
                      </span>
                    </h2>
                                      <p className={`text-muted-foreground max-w-xl mx-auto px-4 ${
                    agentState.isActive ? "text-sm" : "text-base"
                  }`}>
                      Get clarity and confidence in your healthcare decisions with AI-powered insights and expert
                      recommendations.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Provider Search Interface when results available (mobile) */}
                    {providerSearchData && (
                      <ProviderSearchInterface
                        data={providerSearchData}
                        userProfile={userProfile as any}
                        onDeepResearchRequested={(providers: any[]) => {
                          setIsDeepResearch(true)
                          setInputValue(`Run deep research comparing: ${providers.map((p:any)=>p.name).join(', ')}`)
                          wrappedHandleSendMessage()
                        }}
                      />
                    )}
                    
                    {/* Show agent orchestration */}
                    <AgentOrchestration 
                      activities={agentActivities}
                      currentAgent={currentOrchestrationAgent || undefined}
                      isActive={isAgentOrchestrationActive}
                    />
                    
                    {/* Show thinking during streaming */}
                    {isProcessing && currentReasoning && (
                      <ThinkingBubble
                        content={currentReasoning}
                        tokenCount={reasoningTokens}
                        isStreaming={true}
                        className="animate-slide-up mb-4"
                      />
                    )}
                    
                    {/* Show tool outputs */}
                    <div className="space-y-4">
                      {toolOutputs.map((output) => (
                        <div key={output.id} className="animate-slide-up">
                          <ToolOutputCard
                            toolName={output.toolName}
                            content={output.content}
                            timestamp={output.timestamp}
                            status={output.status}
                            className=""
                          />
                        </div>
                      ))}
                    </div>
                    
  
                    {/* Display orchestration activities */}
                    {orchestrationActivities.length > 0 && (
                      <div className="mb-6 space-y-3">
                        <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
                          <span>🤖</span>
                          <span>Agent Orchestration</span>
                          <Badge variant="secondary" className="ml-2">
                            {orchestrationActivities.length} agent{orchestrationActivities.length !== 1 ? 's' : ''}
                          </Badge>
                        </h3>
                        {orchestrationActivities.map(activity => (
                          <AgentActivityCard 
                            key={activity.id} 
                            activity={activity} 
                          />
                        ))}
                      </div>
                    )}

                    {messages.map((msg, i) => (
                      <div key={i} className="animate-slide-up">
                        {/* Show thinking view for messages with reasoning */}
                        {msg.role === "assistant" && msg.reasoning && (
                          <ThinkingBubble
                            content={msg.reasoning}
                            tokenCount={msg.reasoningTokens}
                            isStreaming={false}
                            className="mb-4"
                          />
                        )}
                        {msg.type && msg.data ? (
                          <UniversalAgentOutput
                            agentType={msg.type}
                            response={msg.data}
                            timestamp={msg.timestamp}
                          />
                        ) : (
                          <MessageCard
                            role={msg.role}
                            content={msg.content}
                            timestamp={msg.timestamp}
                            isStreaming={false}
                          />
                        )}
                        {/* Show approval buttons for research plans */}
                        {msg.role === "assistant" && 
                         isDeepResearch && 
                         msg.content.includes("[RESEARCH]") && 
                         msg.content.includes("plan") &&
                         i === messages.length - 1 && 
                         !isProcessing && (
                          <div className="flex gap-3 mt-4 ml-12">
                            <Button
                              variant="default"
                              size="sm"
                              onClick={async () => {
                                // Send the approval message
                                await wrappedHandleSendMessage("Looks good, run it")
                              }}
                              className="bg-primary hover:bg-primary/90"
                            >
                              ✓ Approve & Run Research
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                // Directly handle the rejection
                                const savedInput = inputValue
                                setInputValue("No, please revise the plan")
                                wrappedHandleSendMessage()
                                setInputValue(savedInput)
                              }}
                              className="border-border hover:bg-accent"
                            >
                              ✗ Revise Plan
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {/* Show Claude Code outputs */}
                    {claudeCodeOutputs.map((output) => (
                      <div key={output.id} className="animate-slide-up mb-4">
                        <ClaudeCodeOutputCard
                          result={output.result}
                          files_created={output.files_created}
                          files_modified={output.files_modified}
                          console_outputs={output.console_outputs}
                          session={output.session}
                        />
                      </div>
                    ))}
                    
                    {/* Show streaming assistant message ONLY when content arrives */}
                    {currentStreamingMessage && (
                      <div className="animate-slide-up">
                        <MessageCard
                          role="assistant"
                          content={currentStreamingMessage}
                          timestamp={new Date()}
                          isStreaming={true}
                        />
                      </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                  </div>
                )}
                
                {/* Render Deep Research Interface outside of messages */}
                {renderAgentInterface()}
              </div>
            </main>

            <div className="fixed bottom-0 left-0 right-0 z-50">
              <div className="max-w-4xl mx-auto">
                <Card className="bg-card/90 backdrop-blur-xl border-t border-primary/10 glow-card">
                  <div className="p-4">
                  <div className="flex items-end gap-3">
                    <PromptBuilderDialog onSendPrompt={wrappedHandleSendMessage} />
                      <div className="flex-1">
                        <Textarea
                          ref={inputRef}
                          value={inputValue}
                          onChange={handleInputChange}
                          placeholder="Message Ron AI..."
                          className="w-full text-sm resize-none bg-input/80 border border-primary/20 placeholder:text-muted-foreground/60 min-h-[44px] max-h-[100px] transition-all duration-200 rounded-lg px-3 py-2.5 input-glow"
                          rows={2}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault()
                              wrappedHandleSendMessage()
                            }
                          }}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-10 w-10 border-primary/20 hover:border-primary/40 bg-card/50 backdrop-blur-sm hover:bg-primary/10 transition-all duration-300"
                        >
                          <Paperclip className="w-4 h-4 text-primary/70 hover:text-primary" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-10 w-10 border-primary/20 hover:border-primary/40 bg-card/50 backdrop-blur-sm hover:bg-primary/10 transition-all duration-300"
                        >
                          <Mic className="w-4 h-4 text-primary/70 hover:text-primary" />
                        </Button>
                        <Button
                          onClick={() => wrappedHandleSendMessage()}
                          size="icon"
                          className="h-10 w-10 bg-gradient-to-br from-primary via-primary/90 to-accent/80 hover:from-primary/90 hover:to-accent/70 text-primary-foreground shadow-xl transition-all duration-300 button-glow hover:scale-105 active:scale-95"
                          disabled={isProcessing || !inputValue.trim()}
                        >
                          {isProcessing ? (
                            <Sparkles className="w-4 h-4 animate-pulse" />
                          ) : (
                            <ArrowUp className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between px-4 pb-3 pt-2 mt-2 border-t border-primary/10 relative">
                    {/* Connection Status and Retry Button */}
                    <div className="flex items-center gap-3">
                      {connectionStatus === 'connecting' && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                          Connecting...
                        </div>
                      )}
                      {connectionStatus === 'connected' && (
                        <div className="flex items-center gap-2 text-xs text-green-600">
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                          Connected
                        </div>
                      )}
                      {connectionStatus === 'error' && (
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2 text-xs text-red-600">
                            <div className="w-2 h-2 rounded-full bg-red-500" />
                            Connection Error
                          </div>
                          {lastFailedMessage && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={wrappedHandleRetryMessage}
                              disabled={isProcessing}
                              className="text-xs h-6 px-2"
                            >
                              Retry {retryCount > 1 && `(${retryCount})`}
                            </Button>
                          )}
                        </div>
                      )}
                      {connectionStatus === 'retry' && (
                        <div className="flex items-center gap-2 text-xs text-blue-600">
                          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                          Retrying...
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          if (agentState.isActive) {
                            await stopAgent()
                          } else {
                            try {
                              await startAgent("Computer Use Agent Active", undefined)
                            } catch (error) {
                              console.error("Error starting Computer Use Agent:", error)
                            }
                          }
                        }}
                        className="text-xs font-medium hover:text-primary transition-all duration-200 px-2 py-1 rounded-md hover:bg-primary/10"
                      >
                        <Monitor className="w-3 h-3 mr-1 text-primary/70" />
                        {agentState.isActive ? "Close Browser" : "Browser"}
                      </Button>
                      <div className="flex items-center gap-2">
                        <BrainCircuit className="w-3 h-3 text-primary" />
                        <label htmlFor="deep-research" className="text-xs font-medium">
                          Deep Research
                        </label>
                        <Switch
                          id="deep-research"
                          checked={isDeepResearch}
                          onCheckedChange={(checked) => {
                            console.log("DEEP RESEARCH TOGGLE CHANGED TO:", checked)
                            setIsDeepResearch(checked)
                            // Clear session when toggling off
                            if (!checked) {
                              setDeepResearchSessionId(null)
                              setDeepResearchUserId(null)
                              setDeepResearchOutputs({})
                              setDeepResearchMessages([])
                            }
                          }}
                          className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-primary data-[state=checked]:to-accent shadow-lg transition-all duration-300 scale-75"
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>

        <div className="hidden md:flex md:flex-row md:w-full">
          <div className={`flex flex-col transition-all duration-500 ${
            agentState.isActive ? "w-1/2" : "w-full"
          }`}>
          <header
            className={`fixed top-0 z-10 flex items-center justify-between py-5 px-6 pl-20 bg-background/80 backdrop-blur-xl border-b border-primary/10 shadow-lg transition-all duration-300 ${
              agentState.isActive ? "left-0 right-1/2" : "left-0 right-0"
            }`}
          >
            <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center border border-primary/30 shadow-lg">
              <Bot className="w-5 h-5 text-primary" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Ron AI</h1>
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
                onClick={async () => {
                  if (agentState.isActive) {
                    await stopAgent()
                  } else {
                    try {
                      await startAgent("Computer Use Agent Active", undefined)
                    } catch (error) {
                      console.error("Error starting Computer Use Agent:", error)
                    }
                  }
                }}
                className={`text-sm font-medium hover:text-primary ${agentState.isActive ? "text-primary" : ""}`}
              >
                <Monitor className="w-4 h-4 mr-2" />
                {agentState.isActive ? "Close Browser" : "Open Browser"}
              </Button>
              <ThemeToggle />
            </div>
          </header>

          {showCareTeam && <CareTeamPanel onClose={() => setShowCareTeam(false)} />}

          <main
            className="flex-1 pb-32 pt-32 overflow-y-auto"
          >
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
              ) : messages.length === 0 ? (
                <div className="text-center py-8">
                                    <h2 className={`font-semibold mx-2.5 ${
                    agentState.isActive ? "text-3xl lg:text-4xl" : "text-4xl lg:text-5xl"
                  }`}>
                    Your Health Advocacy
                    <br />
                    <span className="text-transparent bg-gradient-to-r from-primary via-primary/80 to-accent bg-clip-text text-glow">
                      Co-Pilot
                    </span>
                  </h2>
                  <p className={`text-muted-foreground max-w-xl mx-auto px-4 mt-4 mb-8 ${
                    agentState.isActive ? "text-base" : "text-lg"
                  }`}>
                    Get clarity and confidence in your healthcare decisions with AI-powered insights and expert
                    recommendations.
                  </p>
                </div>
              ) : (
                <div className="space-y-12">
                  {/* Provider Search Interface when results available */}
                  {providerSearchData && (
                    <ProviderSearchInterface
                      data={providerSearchData}
                      userProfile={userProfile as any}
                      onDeepResearchRequested={(providers: ProviderSearchResult[]) => {
                        // Let user know we're starting deep research
                        setIsDeepResearch(true)
                        setInputValue(`Run deep research comparing: ${providers.map(p=>p.name).join(', ')}`)
                        wrappedHandleSendMessage()
                      }}
                    />
                  )}
                  {/* Show thinking during streaming */}
                  {isProcessing && currentReasoning && (
                    <ThinkingBubble
                      content={currentReasoning}
                      tokenCount={reasoningTokens}
                      isStreaming={true}
                      className="animate-slide-up mb-6"
                    />
                  )}
                  
                  {/* Show tool outputs */}
                  {toolOutputs.map((output) => (
                    <div key={output.id} className="animate-slide-up mb-6">
                      <ToolOutputCard
                        toolName={output.toolName}
                        content={output.content}
                        timestamp={output.timestamp}
                        status={output.status}
                        className=""
                      />
                    </div>
                  ))}
                  
                  {/* Show code preview if available */}
                  {codeFiles.length > 0 && (
                    <div className="animate-slide-up mb-6">
                      <ClaudeCodePreview
                        files={codeFiles}
                        output={codeOutput}
                        className=""
                      />
                    </div>
                  )}
                  
                  {isProcessing && !currentReasoning && toolOutputs.length === 0 && (
                    <AgentStatusIndicator
                      currentAgent={{
                        type: "general",
                        name: isDeepResearch ? "Deep Research Agent" : "Claude Sonnet 4",
                        description: isDeepResearch ? "Conducting comprehensive research..." : "Processing your request..."
                      }}
                      status="processing"
                    />
                  )}
  
                  {messages.map((msg, i) => (
                    <div key={i} className="animate-slide-up">
                      {/* Show thinking view for messages with reasoning */}
                      {msg.role === "assistant" && msg.reasoning && (
                        <ThinkingBubble
                          content={msg.reasoning}
                          tokenCount={msg.reasoningTokens}
                          isStreaming={false}
                          className="mb-6"
                        />
                      )}
                      {msg.type && msg.data ? (
                        <UniversalAgentOutput
                          agentType={msg.type}
                          response={msg.data}
                          timestamp={msg.timestamp}
                        />
                      ) : (
                        <MessageCard
                          role={msg.role}
                          content={msg.content}
                          timestamp={msg.timestamp}
                          isStreaming={false}
                        />
                      )}
                      {/* Show approval buttons for research plans */}
                      {msg.role === "assistant" && 
                       isDeepResearch && 
                       msg.content.includes("[RESEARCH]") && 
                       msg.content.includes("plan") &&
                       i === messages.length - 1 && 
                       !isProcessing && (
                        <div className="flex gap-4 mt-6 ml-16">
                          <Button
                            variant="default"
                            size="default"
                            onClick={() => {
                              // Directly handle the approval
                              const savedInput = inputValue
                              setInputValue("Looks good, run it")
                              wrappedHandleSendMessage()
                              setInputValue(savedInput)
                            }}
                            className="bg-primary hover:bg-primary/90"
                          >
                            ✓ Approve & Run Research
                          </Button>
                          <Button
                            variant="outline"
                            size="default"
                            onClick={() => {
                              // Directly handle the rejection
                              const savedInput = inputValue
                              setInputValue("No, please revise the plan")
                              wrappedHandleSendMessage()
                              setInputValue(savedInput)
                            }}
                            className="border-border hover:bg-accent"
                          >
                            ✗ Revise Plan
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {/* Show streaming assistant message ONLY when content arrives - DESKTOP */}
                  {currentStreamingMessage && (
                    <div className="animate-slide-up">
                      <MessageCard
                        role="assistant"
                        content={currentStreamingMessage}
                        timestamp={new Date()}
                        isStreaming={true}
                      />
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
              )}
              
              {/* Render Deep Research Interface outside of messages */}
              {renderAgentInterface()}
            </div>
          </main>

          <div
            className={`fixed bottom-0 transition-all duration-300 z-50 ${
              agentState.isActive ? "left-0 right-1/2" : "left-0 right-0"
            } ${isOpen ? "ml-64" : "ml-16"}`}
          >
            <div className="container max-w-5xl mx-auto">
              <Card className="bg-card/90 backdrop-blur-xl border-t border-primary/10 glow-card shadow-2xl">
                <div className="p-5">
                  <div className="flex items-end gap-3">
                    <PromptBuilderDialog onSendPrompt={wrappedHandleSendMessage} />
                    <div className="flex-1">
                      <Textarea
                        ref={inputRef}
                        value={inputValue}
                        onChange={handleInputChange}
                        placeholder="Ask about symptoms, treatments, or find a specialist..."
                        className="w-full text-sm resize-none bg-input/80 border border-primary/20 placeholder:text-muted-foreground/60 min-h-[48px] max-h-[120px] transition-all duration-200 rounded-lg px-4 py-3 input-glow"
                        rows={2}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault()
                            wrappedHandleSendMessage()
                          }
                        }}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-10 w-10 border-primary/20 hover:border-primary/40 hover:bg-primary/10 transition-all"
                      >
                        <Paperclip className="w-4 h-4 text-muted-foreground" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-10 w-10 border-primary/20 hover:border-primary/40 hover:bg-primary/10 transition-all"
                      >
                        <Mic className="w-4 h-4 text-muted-foreground" />
                      </Button>
                      <Button
                        onClick={() => wrappedHandleSendMessage()}
                        size="icon"
                        className="h-10 w-10 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground shadow-lg glow-button transition-all hover:scale-105 active:scale-95"
                        disabled={isProcessing || !inputValue.trim()}
                      >
                        {isProcessing ? (
                          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                        ) : (
                          <ArrowUp className="w-3.5 h-3.5" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between px-5 py-3 border-t border-primary/10">
                  <div className="flex items-center gap-6">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        if (agentState.isActive) {
                          await stopAgent()
                        } else {
                          try {
                            await startAgent("Computer Use Agent Active", undefined)
                          } catch (error) {
                            console.error("Error starting Computer Use Agent:", error)
                          }
                        }
                      }}
                      className="text-xs font-medium hover:text-primary transition-colors"
                    >
                      <Monitor className="w-4 h-4 mr-1.5" />
                      {agentState.isActive ? "Close Browser" : "Browser"}
                    </Button>
                    <div className="flex items-center gap-3">
                      <BrainCircuit className="w-5 h-5 text-primary" />
                      <label htmlFor="deep-research" className="text-sm font-medium">
                        Deep Research
                      </label>
                      <Switch
                        id="deep-research"
                        checked={isDeepResearch}
                        onCheckedChange={(checked) => {
                          console.log("DEEP RESEARCH TOGGLE CHANGED TO (DESKTOP):", checked)
                          setIsDeepResearch(checked)
                          // Clear session when toggling off
                          if (!checked) {
                            setDeepResearchSessionId(null)
                            setDeepResearchUserId(null)
                            setDeepResearchOutputs({})
                            setDeepResearchMessages([])
                          }
                        }}
                        className="data-[state=checked]:bg-primary"
                      />
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
          </div>

          {agentState.isActive && (
            <div className="w-1/2 fixed right-0 top-0 bottom-0 z-40">
              <ComputerUseAgent
                isVisible={true}
                onClose={async () => await stopAgent()}
                task={agentState.currentTask || undefined}
                liveUrl={agentState.liveUrl || undefined}
                isMobile={false}
                browserActions={browserActions}
              />
            </div>
          )}
        </div>
      </div>
    </div>
    </TimelineAdapter>
  )
}

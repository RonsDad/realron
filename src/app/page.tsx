"use client"

import { useState, useEffect, useRef } from "react"
import { ArrowUp, Bot, BrainCircuit, User, Paperclip, Mic, Monitor } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { ThemeToggle } from "@/components/theme-toggle"
import { PromptBuilderDialog } from "@/components/prompt-builder-dialog"
import { AgentStatusIndicator } from "@/components/agent-status-indicator"
import { ProviderSearchInterface } from "@/components/provider-search-interface"
import { MedicationManagerInterface } from "@/components/medication-manager-interface"
import { CareTeamPanel } from "@/components/care-team-panel"
import { ComputerUseAgent } from "@/components/computer-use-agent"
import { RetractableSidebar } from "@/components/retractable-sidebar"
import { useComputerAgent } from "@/hooks/use-computer-agent"
import { claudeAPI, parseSSEStream, type ChatMessage } from "@/lib/api"
import type { Message } from "@/lib/types"
import { ReasoningDisplay } from "@/components/reasoning-display"
import { MessageBubble } from "@/components/message-bubble"
import { ResearchProgressUnified } from "@/components/research-progress-unified"

export default function HealthCopilot() {
  const [isDeepResearch, setIsDeepResearch] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [showCareTeam, setShowCareTeam] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentStreamingMessage, setCurrentStreamingMessage] = useState("")
  const [currentReasoning, setCurrentReasoning] = useState("")
  const [reasoningTokens, setReasoningTokens] = useState(0)
  const [deepResearchOutputs, setDeepResearchOutputs] = useState<any>({})
  const [deepResearchMessages, setDeepResearchMessages] = useState<any[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { agentState, startAgent, stopAgent } = useComputerAgent()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, currentStreamingMessage])

  const handleSendMessage = async () => {
    if (inputValue.trim() && !isProcessing) {
      const newMessage: Message = {
        role: "user",
        content: inputValue,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, newMessage])
      setInputValue("")
      setIsProcessing(true)
      setCurrentStreamingMessage("")
      setCurrentReasoning("")
      setReasoningTokens(0)

      // Check if Computer Use Agent is needed
      const requiresCUA = checkIfRequiresCUA(inputValue)
      if (requiresCUA) {
        try {
          await startAgent(`Researching: ${inputValue}`, undefined)
        } catch (error) {
          console.error("Error starting Computer Use Agent:", error)
        }
      }

      try {
        console.log("=== SENDING MESSAGE ===")
        console.log("Deep Research Mode:", isDeepResearch)
        console.log("Message:", inputValue)
        
        // Check if using deep research mode
        if (isDeepResearch) {
          console.log(">>> USING DEEP RESEARCH AGENT <<<")
          // Use deep research endpoint
          const userId = "user_" + Math.random().toString(36).substr(2, 9)
          
          // Create a session first
          console.log("Creating deep research session...")
          const sessionId = await claudeAPI.createDeepResearchSession(userId)
          console.log("Session created with ID:", sessionId)
          
          // Create assistant message placeholder
          const assistantMessage: Message = {
            role: "assistant",
            content: "",
            timestamp: new Date(),
          }
          setMessages(prev => [...prev, assistantMessage])
          
          // Stream from deep research endpoint
          console.log("Calling deepResearch with:", {
            sessionId,
            userId,
            messageCount: messages.length + 1
          })
          
          const stream = await claudeAPI.deepResearch(
            inputValue,  // ONLY the message the user just typed
            sessionId,
            userId
          )
          
          console.log("Deep research stream received:", stream)
          
          if (!stream) {
            throw new Error("Failed to get stream from deep research API")
          }
          
          let fullContent = ""
          let fullReasoning = ""
          console.log("Starting deep research SSE stream...")
          
          const reader = stream.getReader()
          const decoder = new TextDecoder()
          let buffer = ''
          
          try {
            while (true) {
              const { done, value } = await reader.read()
              if (done) break
              
              buffer += decoder.decode(value, { stream: true })
              const lines = buffer.split('\n')
              buffer = lines.pop() || ''
              
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6).trim()
                  if (data && data !== '[DONE]') {
                    try {
                      const event = JSON.parse(data)
                      
                      // Extract content from deep research format
                      if (event.content?.parts) {
                        for (const part of event.content.parts) {
                          if (part.text) {
                            // The text might be a string representation of Python objects
                            // Look for actual text content within triple quotes
                            const textMatch = part.text.match(/text="""([\s\S]*?)"""/);
                            if (textMatch && textMatch[1]) {
                              // Found actual text content in triple quotes
                              fullContent = textMatch[1].trim()
                            } else if (!part.text.startsWith('parts=')) {
                              // Regular text content
                              fullContent += part.text
                            }
                            setCurrentStreamingMessage(fullContent)
                          }
                        }
                      }
                      
                      // Handle state delta updates (research plan, final report, etc)
                      if (event.actions?.stateDelta) {
                        // Update deep research outputs with proper structure
                        const stateDelta = event.actions.stateDelta
                        
                        if (stateDelta.research_plan) {
                          setDeepResearchOutputs((prev: any) => ({
                            ...prev,
                            plan: stateDelta.research_plan
                          }))
                          // Don't show plan in message bubble, show in research component
                          fullContent = "Creating research plan..."
                          setCurrentStreamingMessage(fullContent)
                          setDeepResearchMessages(prev => [...prev, {
                            type: 'plan',
                            content: stateDelta.research_plan,
                            timestamp: new Date()
                          }])
                        }
                        
                        if (stateDelta.final_report_with_citations) {
                          setDeepResearchOutputs((prev: any) => ({
                            ...prev,
                            finalReport: stateDelta.final_report_with_citations
                          }))
                          // Show completion message
                          fullContent = "Research complete! See the detailed report below."
                          setCurrentStreamingMessage(fullContent)
                          setDeepResearchMessages(prev => [...prev, {
                            type: 'final',
                            content: stateDelta.final_report_with_citations,
                            timestamp: new Date()
                          }])
                        }
                        
                        if (stateDelta.section_research_findings) {
                          setDeepResearchOutputs((prev: any) => ({
                            ...prev,
                            findings: stateDelta.section_research_findings
                          }))
                          setDeepResearchMessages(prev => [...prev, {
                            type: 'findings',
                            content: stateDelta.section_research_findings,
                            timestamp: new Date()
                          }])
                        }
                        
                        if (stateDelta.report_sections) {
                          setDeepResearchOutputs((prev: any) => ({
                            ...prev,
                            outline: stateDelta.report_sections
                          }))
                          setDeepResearchMessages(prev => [...prev, {
                            type: 'outline',
                            content: stateDelta.report_sections,
                            timestamp: new Date()
                          }])
                        }
                        
                        if (stateDelta.research_evaluation) {
                          setDeepResearchOutputs((prev: any) => ({
                            ...prev,
                            evaluation: stateDelta.research_evaluation
                          }))
                          setDeepResearchMessages(prev => [...prev, {
                            type: 'evaluation',
                            content: JSON.stringify(stateDelta.research_evaluation),
                            timestamp: new Date()
                          }])
                        }
                        
                        if (stateDelta.sources) {
                          setDeepResearchOutputs((prev: any) => ({
                            ...prev,
                            sources: stateDelta.sources
                          }))
                        }
                      }
                      
                      // Track agent author for current agent display
                      if (event.author && event.author !== 'unknown') {
                        // Add thought messages for agent thinking
                        if (event.content?.parts) {
                          for (const part of event.content.parts) {
                            if (part.text && !part.text.startsWith('parts=')) {
                              setDeepResearchMessages(prev => [...prev, {
                                type: 'thought',
                                content: part.text,
                                timestamp: new Date()
                              }])
                            }
                          }
                        }
                      }
                      
                      // Update the assistant message
                      setMessages(prev => {
                        const newMessages = [...prev]
                        if (newMessages.length > 0 && newMessages[newMessages.length - 1].role === "assistant") {
                          newMessages[newMessages.length - 1] = {
                            ...newMessages[newMessages.length - 1],
                            content: fullContent,
                            reasoning: fullReasoning,
                            reasoningTokens: reasoningTokens
                          }
                        }
                        return newMessages
                      })
                    } catch (e) {
                      console.error('Failed to parse SSE data:', e)
                    }
                  }
                }
              }
            }
          } finally {
            reader.releaseLock()
          }
        } else {
          console.log(">>> USING REGULAR CLAUDE CHAT <<<")
          // Use regular Claude chat endpoint
          // Convert messages to API format
          const apiMessages: ChatMessage[] = messages.map(msg => ({
            role: msg.role as "user" | "assistant",
            content: msg.content
          }))
          apiMessages.push({ role: "user", content: inputValue })

          // Determine which tools to enable based on context
          const tools: string[] = ["web_search", "text_editor", "browser_use"]
          if (inputValue.toLowerCase().includes("bash") || inputValue.toLowerCase().includes("command")) {
            tools.push("bash")
          }

          // Create assistant message placeholder
          const assistantMessage: Message = {
            role: "assistant",
            content: "",
            timestamp: new Date(),
          }
          setMessages(prev => [...prev, assistantMessage])

          // Stream the response with interleaved thinking
          const stream = await claudeAPI.chatStream({
            messages: apiMessages,
            temperature: 1.0,
            max_tokens: 32000,
            tools: tools,
            enable_caching: true,
            cache_ttl: "5m",
            enable_thinking: true,
            thinking_budget: 20000,
            enable_citations: true,
            stream: true,
            system_prompt: `You are Ron AI, an advanced healthcare advocacy AI assistant powered by Claude Sonnet 4. 
You help users navigate their healthcare journey with clarity and confidence.

When helping with healthcare tasks:
1. Be empathetic and supportive
2. Provide clear, actionable advice
3. Use your tools when needed to search for information, analyze documents, or help with tasks
4. Always prioritize user safety and encourage professional medical consultation when appropriate
5. If doing deep research, be thorough and cite sources

${isDeepResearch ? "DEEP RESEARCH MODE: Perform comprehensive research with multiple sources and detailed analysis." : ""}`
          })

          let fullContent = ""
          let fullReasoning = ""
          console.log("Starting to parse SSE stream...")
          for await (const event of parseSSEStream(stream)) {
            console.log("Received event:", JSON.stringify(event))
            
            // Handle content deltas (text)
            if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
              fullContent += event.delta.text || ""
              setCurrentStreamingMessage(fullContent)
            }
            // Handle thinking deltas
            else if (event.type === 'content_block_delta' && event.delta?.type === 'thinking_delta') {
              fullReasoning += event.delta.text || ""
              setCurrentReasoning(fullReasoning)
            }
            // Handle tool use start
            else if (event.type === 'content_block_start' && event.content_block?.type === 'tool_use') {
              console.log(`Tool started: ${event.content_block.name}`)
              fullContent += `\n\n🔧 Using ${event.content_block.name} tool...`
              setCurrentStreamingMessage(fullContent)
            }
            // Handle tool results
            else if (event.type === 'tool_result') {
              console.log(`Tool ${event.tool_name} completed:`, event.result)
              const resultText = typeof event.result === 'string' ? event.result : JSON.stringify(event.result, null, 2)
              fullContent += `\n\n✅ Tool result: ${resultText}`
              setCurrentStreamingMessage(fullContent)
            }
            // Handle tool errors
            else if (event.type === 'tool_error') {
              console.error(`Tool ${event.tool_name} error:`, event.error)
              fullContent += `\n\n❌ Tool error: ${event.error}`
              setCurrentStreamingMessage(fullContent)
            }
            // Handle message completion
            else if (event.type === 'message_stop' || event.type === 'message_delta') {
              if (event.usage) {
                setReasoningTokens(event.usage.reasoning_tokens || 0)
              }
            }
            
            // Update the assistant message
            setMessages(prev => {
              const newMessages = [...prev]
              if (newMessages.length > 0 && newMessages[newMessages.length - 1].role === "assistant") {
                newMessages[newMessages.length - 1] = {
                  ...newMessages[newMessages.length - 1],
                  content: fullContent,
                  reasoning: fullReasoning,
                  reasoningTokens: reasoningTokens
                }
              }
              return newMessages
            })
          }
        }

      } catch (error) {
        console.error("Error calling Claude API:", error)
        setMessages(prev => [
          ...prev,
          {
            role: "assistant",
            content: "I apologize, but I encountered an error while processing your request. Please try again.",
            timestamp: new Date(),
          }
        ])
      } finally {
        setIsProcessing(false)
        setCurrentStreamingMessage("")
        setCurrentReasoning("")
      }
    }
  }

  const checkIfRequiresCUA = (message: string): boolean => {
    const cuaTriggers = [
      "research",
      "look up",
      "find information",
      "check reviews",
      "verify",
      "browse",
      "search online",
      "deep research",
    ]
    return cuaTriggers.some((trigger) => message.toLowerCase().includes(trigger))
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
          onSendMessage={(message) => {
            setInputValue(message)
            handleSendMessage()
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
    <div className="flex min-h-screen bg-background text-foreground">
      <RetractableSidebar onOpenChange={setIsOpen} />

      <div className={`flex-1 flex flex-col transition-all duration-300 ease-out bg-background h-screen ${isOpen ? "ml-80" : "ml-0"}`}>
        <div className="md:hidden">
          <ComputerUseAgent
            isVisible={agentState.isActive}
            onClose={async () => await stopAgent()}
            task={agentState.currentTask || undefined}
            liveUrl={agentState.liveUrl || undefined}
            isMobile={true}
          />

          <div className="transition-all duration-500">
            <header className="sticky top-0 z-10 flex items-center justify-between py-4 px-4 pl-20 bg-background/95 backdrop-blur-sm border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                <h1 className="text-lg font-bold tracking-tight">Ron AI</h1>
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

            <main className="flex-1 pb-[300px] px-4 py-6 overflow-y-auto">
              <div className="max-w-4xl mx-auto">
                {messages.length === 0 ? (
                  <div className="text-center py-8 animate-fade-in">
                    <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight mb-4">
                      Your Health Advocacy{" "}
                      <span className="text-primary text-glow bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        Co-Pilot
                      </span>
                    </h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed text-lg sm:text-xl px-4 animate-fade-in-delay">
                      Get clarity and confidence in your healthcare decisions with AI-powered insights and expert
                      recommendations.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {isProcessing && (
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
                        {msg.role === "assistant" && msg.reasoning && (
                          <ReasoningDisplay 
                            reasoning={msg.reasoning} 
                            tokenCount={msg.reasoningTokens || 0}
                            className="mb-4"
                          />
                        )}
                        <MessageBubble
                          role={msg.role}
                          content={msg.content}
                          timestamp={msg.timestamp}
                        />
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
                              onClick={() => {
                                // Directly handle the approval
                                const savedInput = inputValue
                                setInputValue("Looks good, run it")
                                handleSendMessage()
                                setInputValue(savedInput)
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
                                handleSendMessage()
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
                    <div ref={messagesEndRef} />
                  </div>
                )}
                
                {/* Render Deep Research Interface outside of messages */}
                {renderAgentInterface()}
              </div>
            </main>

            <div className="fixed bottom-0 left-0 right-0 p-2 animate-slide-up-footer z-50">
              <div className="max-w-4xl mx-auto">
                <div className="relative bg-card/95 backdrop-blur-xl rounded-xl p-2 shadow-2xl shadow-primary/5 border border-border">
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <Textarea
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Ask about symptoms, treatments, or find a specialist..."
                        className="w-full text-sm resize-none focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/70 min-h-[40px] max-h-[100px] border border-border bg-background py-2"
                        rows={1}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault()
                            handleSendMessage()
                          }
                        }}
                      />
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8 hover:bg-primary/10 bg-primary rounded-md"
                      >
                        <Paperclip className="w-4 h-4 text-white" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8 hover:bg-primary/10 bg-primary rounded-md"
                      >
                        <Mic className="w-4 h-4 text-white" />
                      </Button>
                      <Button
                        onClick={handleSendMessage}
                        size="icon"
                        className="w-8 h-8 hover:bg-primary/90 text-primary-foreground hover:shadow-primary/25 transition-all duration-200 rounded-md bg-primary shadow-xl"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 mt-2 border-t border-border">
                    <div className="flex items-center gap-2 flex-wrap">
                      <PromptBuilderDialog />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          if (agentState.isActive) {
                            stopAgent()
                          } else {
                            try {
                              await startAgent("Computer Use Agent Active", undefined)
                            } catch (error) {
                              console.error("Error starting Computer Use Agent:", error)
                            }
                          }
                        }}
                        className="text-xs font-medium hover:text-primary transition-colors duration-200"
                      >
                        <Monitor className="w-3 h-3 mr-1" />
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
                          }}
                          className="data-[state=checked]:bg-primary scale-75"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="hidden md:block">
          <header
            className={`fixed top-0 z-10 flex items-center justify-between py-8 px-6 pl-20 bg-background/80 backdrop-blur-sm border-b border-border transition-all duration-500 ${
              agentState.isActive ? "left-0 right-1/2" : "left-0 right-0"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Ron AI</h1>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCareTeam(!showCareTeam)}
                className="text-sm font-medium hover:text-primary"
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
            className={`flex-1 pb-[400px] pt-32 mx-4 my-[25px] transition-all duration-500 overflow-y-auto ${
              agentState.isActive ? "mr-[50vw]" : ""
            }`}
          >
            <div className="container max-w-7xl mx-auto px-6">
              {messages.length === 0 ? (
                <div className="text-center ml-px mb-0 py-0 animate-fade-in mt-0">
                  <h2 className="leading-tight font-bold tracking-tight mx-2.5 py-0 text-7xl">
                    Your Health Advocacy{" "}
                    <span className="text-primary text-glow bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                      Co-Pilot
                    </span>
                  </h2>
                  <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed px-0 text-2xl mt-0 mb-0 py-[19px] animate-fade-in-delay">
                    Get clarity and confidence in your healthcare decisions with AI-powered insights and expert
                    recommendations.
                  </p>
                </div>
              ) : (
                <div className="space-y-12">
                  {isProcessing && (
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
                      {msg.role === "assistant" && msg.reasoning && (
                        <ReasoningDisplay 
                          reasoning={msg.reasoning} 
                          tokenCount={msg.reasoningTokens || 0}
                          className="mb-6"
                        />
                      )}
                      <MessageBubble
                        role={msg.role}
                        content={msg.content}
                        timestamp={msg.timestamp}
                      />
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
                              handleSendMessage()
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
                              handleSendMessage()
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
                  <div ref={messagesEndRef} />
                </div>
              )}
              
              {/* Render Deep Research Interface outside of messages */}
              {renderAgentInterface()}
            </div>
          </main>

          <div
            className={`fixed bottom-0 p-6 transition-all duration-300 animate-slide-up-footer z-50 ${
              agentState.isActive ? "left-0 right-1/2" : "left-0 right-0"
            } ${isOpen ? "ml-80" : "ml-0"}`}
          >
            <div className="container max-w-5xl mx-auto">
              <div className="relative backdrop-blur-xl rounded-3xl p-4 shadow-2xl shadow-primary/5 font-sans leading-7 my-[-18px] mx-[-43px] py-[34px] border-border border-2 bg-card">
                <div className="flex items-end gap-4">
                  <div className="flex-1">
                    <Textarea
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="Ask about symptoms, treatments, or find a specialist..."
                      className="w-full text-lg resize-none focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/70 min-h-[60px] opacity-100 border-solid border border-border bg-background leading-10 text-foreground"
                      rows={1}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault()
                          handleSendMessage()
                        }
                      }}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-12 h-12 hover:bg-primary/10 bg-primary rounded-md"
                    >
                      <Paperclip className="w-5 h-5 text-primary-foreground" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-12 h-12 hover:bg-primary/10 bg-primary rounded-md"
                    >
                      <Mic className="w-5 h-5 text-primary-foreground" />
                    </Button>
                    <Button
                      onClick={handleSendMessage}
                      size="icon"
                      className="w-12 h-12 hover:bg-primary/90 text-primary-foreground hover:shadow-primary/25 transition-all duration-200 rounded-md bg-primary shadow-xl"
                    >
                      <ArrowUp className="w-5 h-5 text-primary-foreground" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 mt-4 border-t border-border">
                  <div className="flex items-center gap-6">
                    <PromptBuilderDialog />
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
                      className="text-sm font-medium hover:text-primary transition-colors duration-200"
                    >
                      <Monitor className="w-4 h-4 mr-2" />
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
                        }}
                        className="data-[state=checked]:bg-primary shadow-xl"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <ComputerUseAgent
            isVisible={agentState.isActive}
            onClose={async () => await stopAgent()}
            task={agentState.currentTask || undefined}
            liveUrl={agentState.liveUrl || undefined}
            isMobile={false}
          />
        </div>
      </div>
    </div>
  )
}

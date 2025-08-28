"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MessageCard } from "@/components/message-card"
import { ThinkingBubble } from "@/components/thinking-bubble"
import { ToolOutputDisplay } from "./ToolOutputDisplay"
import { ClaudeCodePreview } from "@/components/claude-code-preview"
import { UniversalAgentOutput } from "@/components/universal-agent-output"
import { ProviderSearchInterface } from "@/components/provider-search-interface"
import { AgentOrchestration } from "@/components/agent-orchestration"
import { AgentStatusIndicator } from "@/components/agent-status-indicator"
import { AgentActivityCard } from "@/components/agent-activity-card"
import { AgentActivityFeed } from "./AgentActivityFeed"
import type { Message, ProviderSearchData, ProviderSearchResult } from "@/lib/types"

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

interface ClaudeCodeOutput {
  id: string
  result: any
  files_created: string[]
  files_modified: string[]
  console_outputs: string[]
  session: string
}

interface BrowserAction {
  id: string
  type: string
  description: string
  timestamp: Date
  details?: any
}

interface MessageListProps {
  // Core message data
  messages: Message[]
  currentStreamingMessage: string | null
  
  // Provider search
  providerSearchData: ProviderSearchData | null
  
  // Deep research
  isDeepResearch: boolean
  setIsDeepResearch: (value: boolean) => void
  deepResearchMessages: Message[]
  deepResearchOutputs: Record<string, any>
  
  // Input handling
  setInputValue: (value: string) => void
  inputValue: string
  handleSendMessage: (message?: string) => Promise<void>
  
  // User profile
  userProfile: any
  
  // Agent states
  agentActivities: AgentActivity[]
  currentOrchestrationAgent: string | null
  isAgentOrchestrationActive: boolean
  orchestrationActivities: AgentActivity[]
  
  // Processing states
  isProcessing: boolean
  currentReasoning: string | null
  reasoningTokens: number
  
  // Tool outputs
  toolOutputs: ToolOutputData[]
  claudeCodeOutputs: ClaudeCodeOutput[]
  codeFiles: CodeFileData[]
  codeOutput: string
  
  // Other states
  pendingOrchestrationTools: any[]
  browserActions: BrowserAction[]
  
  // Layout
  isMobile?: boolean
  agentStateIsActive?: boolean
  
  // Refs
  messagesEndRef: React.RefObject<HTMLDivElement>
}

export const MessageList = React.memo(function MessageList({
  messages,
  currentStreamingMessage,
  providerSearchData,
  isDeepResearch,
  setIsDeepResearch,
  deepResearchMessages,
  deepResearchOutputs,
  setInputValue,
  inputValue,
  handleSendMessage,
  userProfile,
  agentActivities,
  currentOrchestrationAgent,
  isAgentOrchestrationActive,
  orchestrationActivities,
  isProcessing,
  currentReasoning,
  reasoningTokens,
  toolOutputs,
  claudeCodeOutputs,
  codeFiles,
  codeOutput,
  pendingOrchestrationTools,
  browserActions,
  isMobile = false,
  agentStateIsActive = false,
  messagesEndRef
}: MessageListProps) {
  
  // Helper function to handle research plan approval
  const handleResearchApproval = async () => {
    await handleSendMessage("Looks good, run it")
  }
  
  // Helper function to handle research plan rejection
  const handleResearchRejection = async () => {
    const savedInput = inputValue
    setInputValue("No, please revise the plan")
    await handleSendMessage()
    setInputValue(savedInput)
  }

  // Spacing classes based on layout
  const spacingClass = isMobile ? "space-y-6" : "space-y-12"
  const thinkingSpacing = isMobile ? "mb-4" : "mb-6"
  const toolOutputSpacing = isMobile ? "mb-4" : "mb-6"
  const approvalButtonSpacing = isMobile ? "gap-3 mt-4 ml-12" : "gap-4 mt-6 ml-16"
  const approvalButtonSize = isMobile ? "sm" : "default"

  return (
    <div className={spacingClass}>
      {/* Provider Search Interface when results available */}
      {providerSearchData && (
        <ProviderSearchInterface
          data={providerSearchData}
          userProfile={userProfile}
          onDeepResearchRequested={(providers: ProviderSearchResult[]) => {
            setIsDeepResearch(true)
            setInputValue(`Run deep research comparing: ${providers.map(p => p.name).join(', ')}`)
            handleSendMessage()
          }}
        />
      )}
      
      {/* Show agent orchestration (mobile only) */}
      {isMobile && (
        <AgentOrchestration 
          activities={agentActivities}
          currentAgent={currentOrchestrationAgent || undefined}
          isActive={isAgentOrchestrationActive}
        />
      )}
      
      {/* Show thinking during streaming */}
      {isProcessing && currentReasoning && (
        <ThinkingBubble
          content={currentReasoning}
          tokenCount={reasoningTokens}
          isStreaming={true}
          className={`animate-slide-up ${thinkingSpacing}`}
        />
      )}
      
      {/* Show tool and code outputs */}
      <ToolOutputDisplay
        toolOutputs={toolOutputs}
        claudeCodeOutputs={claudeCodeOutputs}
        isMobile={isMobile}
      />
      
      {/* Show code preview if available (desktop only) */}
      {!isMobile && codeFiles.length > 0 && (
        <div className={`animate-slide-up ${toolOutputSpacing}`}>
          <ClaudeCodePreview
            files={codeFiles}
            output={codeOutput}
            className=""
          />
        </div>
      )}
      
      {/* Show agent status when processing (desktop only) */}
      {!isMobile && isProcessing && !currentReasoning && toolOutputs.length === 0 && (
        <AgentStatusIndicator
          currentAgent={{
            type: "general",
            name: isDeepResearch ? "Deep Research Agent" : "Claude Sonnet 4",
            description: isDeepResearch ? "Conducting comprehensive research..." : "Processing your request..."
          }}
          status="processing"
        />
      )}
      
      {/* Display orchestration activities (mobile only) */}
      {isMobile && (
        <AgentActivityFeed
          agentActivities={agentActivities}
          orchestrationActivities={orchestrationActivities}
          currentOrchestrationAgent={currentOrchestrationAgent}
          isAgentOrchestrationActive={isAgentOrchestrationActive}
        />
      )}

      {/* Messages */}
      {messages.map((msg, i) => (
        <div key={i} className="animate-slide-up">
          {/* Show thinking view for messages with reasoning */}
          {msg.role === "assistant" && msg.reasoning && (
            <ThinkingBubble
              content={msg.reasoning}
              tokenCount={msg.reasoningTokens}
              isStreaming={false}
              className={thinkingSpacing}
            />
          )}
          
          {/* Message content */}
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
            <div className={`flex ${approvalButtonSpacing}`}>
              <Button
                variant="default"
                size={approvalButtonSize}
                onClick={handleResearchApproval}
                className="bg-primary hover:bg-primary/90"
              >
                ✓ Approve & Run Research
              </Button>
              <Button
                variant="outline"
                size={approvalButtonSize}
                onClick={handleResearchRejection}
                className="border-border hover:bg-accent"
              >
                ✗ Revise Plan
              </Button>
            </div>
          )}
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
      
      {/* Messages end ref for auto-scrolling */}
      <div ref={messagesEndRef} />
    </div>
  )
}, (prevProps, nextProps) => {
  // Custom comparison function for complex props
  const compareArrays = (a: any[], b: any[]) => {
    if (a.length !== b.length) return false
    return a.every((item, index) => {
      if (typeof item === 'object' && item !== null && b[index] !== null) {
        return JSON.stringify(item) === JSON.stringify(b[index])
      }
      return item === b[index]
    })
  }
  
  // Compare primitive props
  if (
    prevProps.currentStreamingMessage !== nextProps.currentStreamingMessage ||
    prevProps.isDeepResearch !== nextProps.isDeepResearch ||
    prevProps.inputValue !== nextProps.inputValue ||
    prevProps.currentOrchestrationAgent !== nextProps.currentOrchestrationAgent ||
    prevProps.isAgentOrchestrationActive !== nextProps.isAgentOrchestrationActive ||
    prevProps.isProcessing !== nextProps.isProcessing ||
    prevProps.currentReasoning !== nextProps.currentReasoning ||
    prevProps.reasoningTokens !== nextProps.reasoningTokens ||
    prevProps.codeOutput !== nextProps.codeOutput ||
    prevProps.isMobile !== nextProps.isMobile ||
    prevProps.agentStateIsActive !== nextProps.agentStateIsActive
  ) {
    return false
  }
  
  // Compare array/object props
  if (
    !compareArrays(prevProps.messages, nextProps.messages) ||
    !compareArrays(prevProps.agentActivities, nextProps.agentActivities) ||
    !compareArrays(prevProps.orchestrationActivities, nextProps.orchestrationActivities) ||
    !compareArrays(prevProps.toolOutputs, nextProps.toolOutputs) ||
    !compareArrays(prevProps.claudeCodeOutputs, nextProps.claudeCodeOutputs) ||
    !compareArrays(prevProps.codeFiles, nextProps.codeFiles) ||
    !compareArrays(prevProps.browserActions, nextProps.browserActions) ||
    JSON.stringify(prevProps.providerSearchData) !== JSON.stringify(nextProps.providerSearchData) ||
    JSON.stringify(prevProps.userProfile) !== JSON.stringify(nextProps.userProfile)
  ) {
    return false
  }
  
  return true
})

export type { MessageListProps }
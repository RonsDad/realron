"use client"

import { useEffect, useRef } from "react"
import { SidebarMinimal } from "@/components/sidebar-minimal"
import { useComputerAgent } from "@/hooks/use-computer-agent"
import { claudeAPI } from "@/lib/api"
import { CareTeamPanel } from "@/components/care-team-panel"
import { ComputerUseAgent } from "@/components/computer-use-agent"
import { ResearchProgressUnified } from "@/components/research-progress-unified"
import { useUserProfile } from "@/hooks/use-user-profile"
import { useRonAIStore } from "@/providers/ron-ai-store-provider"
import { useShallow } from "zustand/react/shallow"
import { useMessageHandler } from "@/hooks/use-message-handler"
import type { ProviderSearchData, ProviderSearchResult } from "@/lib/types"
import { 
  ChatHeader, 
  EmptyState, 
  ChatInput, 
  MessageList, 
  ChatContainer 
} from '@/components/chat'
import { TimelineAdapter } from "@/components/migration/timeline-adapter"
import { useTimelineIntegration } from "@/hooks/use-timeline-integration"


export default function HealthCopilot() {
  // Replace ALL 32 useState hooks with Zustand store - MAINTAINING EXACT VARIABLE NAMES
  // Using useShallow for optimal performance with complex state selection
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
  } = useRonAIStore(
    useShallow((state) => ({
      // Chat state (6 variables)
      messages: state.messages,
      setMessages: state.setMessages,
      inputValue: state.inputValue,
      setInputValue: state.setInputValue,
      isProcessing: state.isProcessing,
      setIsProcessing: state.setIsProcessing,
      currentStreamingMessage: state.currentStreamingMessage,
      setCurrentStreamingMessage: state.setCurrentStreamingMessage,
      currentReasoning: state.currentReasoning,
      setCurrentReasoning: state.setCurrentReasoning,
      reasoningTokens: state.reasoningTokens,
      setReasoningTokens: state.setReasoningTokens,
      
      // Deep Research state (5 variables)
      isDeepResearch: state.isDeepResearch,
      setIsDeepResearch: state.setIsDeepResearch,
      deepResearchSessionId: state.deepResearchSessionId,
      setDeepResearchSessionId: state.setDeepResearchSessionId,
      deepResearchUserId: state.deepResearchUserId,
      setDeepResearchUserId: state.setDeepResearchUserId,
      deepResearchOutputs: state.deepResearchOutputs,
      setDeepResearchOutputs: state.setDeepResearchOutputs,
      deepResearchMessages: state.deepResearchMessages,
      setDeepResearchMessages: state.setDeepResearchMessages,
      
      // UI state (6 variables)
      showCareTeam: state.showCareTeam,
      setShowCareTeam: state.setShowCareTeam,
      isOpen: state.isOpen,
      setIsOpen: state.setIsOpen,
      mounted: state.mounted,
      setMounted: state.setMounted,
      showCommandMenu: state.showCommandMenu,
      setShowCommandMenu: state.setShowCommandMenu,
      showTimeline: state.showTimeline,
      setShowTimeline: state.setShowTimeline,
      providerSearchData: state.providerSearchData,
      setProviderSearchData: state.setProviderSearchData,
      
      // Agent state (6 variables)
      agentActivities: state.agentActivities,
      setAgentActivities: state.setAgentActivities,
      currentOrchestrationAgent: state.currentOrchestrationAgent,
      setCurrentOrchestrationAgent: state.setCurrentOrchestrationAgent,
      isAgentOrchestrationActive: state.isAgentOrchestrationActive,
      setIsAgentOrchestrationActive: state.setIsAgentOrchestrationActive,
      orchestrationActivities: state.orchestrationActivities,
      setOrchestrationActivities: state.setOrchestrationActivities,
      pendingOrchestrationTools: state.pendingOrchestrationTools,
      setPendingOrchestrationTools: state.setPendingOrchestrationTools,
      browserActions: state.browserActions,
      setBrowserActions: state.setBrowserActions,
      
      // Tool state (6 variables)
      thinkingBubbles: state.thinkingBubbles,
      setThinkingBubbles: state.setThinkingBubbles,
      toolOutputs: state.toolOutputs,
      setToolOutputs: state.setToolOutputs,
      currentThinkingId: state.currentThinkingId,
      setCurrentThinkingId: state.setCurrentThinkingId,
      codeFiles: state.codeFiles,
      setCodeFiles: state.setCodeFiles,
      codeOutput: state.codeOutput,
      setCodeOutput: state.setCodeOutput,
      claudeCodeOutputs: state.claudeCodeOutputs,
      setClaudeCodeOutputs: state.setClaudeCodeOutputs,
      
      // Connection state (3 variables)
      connectionStatus: state.connectionStatus,
      setConnectionStatus: state.setConnectionStatus,
      retryCount: state.retryCount,
      setRetryCount: state.setRetryCount,
      lastFailedMessage: state.lastFailedMessage,
      setLastFailedMessage: state.setLastFailedMessage,
    }))
  )

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

  // REMOVED: Auto-scroll behavior - gives user full scroll control  

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setInputValue(value)
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
      <div className="min-h-screen bg-background text-foreground">
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
            <ChatHeader
              showCareTeam={showCareTeam}
              setShowCareTeam={setShowCareTeam}
              agentState={agentState}
              startAgent={startAgent}
              stopAgent={stopAgent}
              isMobile={true}
            />

            {showCareTeam && <CareTeamPanel onClose={() => setShowCareTeam(false)} />}

            <ChatContainer
              showTimeline={showTimeline}
              setShowTimeline={setShowTimeline}
              messages={messages}
              agentState={agentState}
              isMobile={true}
            >
              {messages.length === 0 ? (
                <EmptyState agentState={agentState} />
              ) : (
                <>
                  <MessageList
                    messages={messages}
                    isProcessing={isProcessing}
                    currentReasoning={currentReasoning}
                    reasoningTokens={reasoningTokens}
                    toolOutputs={toolOutputs}
                    orchestrationActivities={orchestrationActivities}
                    agentActivities={agentActivities}
                    currentOrchestrationAgent={currentOrchestrationAgent}
                    isAgentOrchestrationActive={isAgentOrchestrationActive}
                    claudeCodeOutputs={claudeCodeOutputs}
                    currentStreamingMessage={currentStreamingMessage}
                    messagesEndRef={messagesEndRef}
                    providerSearchData={providerSearchData}
                    userProfile={userProfile}
                    isDeepResearch={isDeepResearch}
                    setIsDeepResearch={setIsDeepResearch}
                    setInputValue={setInputValue}
                    handleSendMessage={wrappedHandleSendMessage}
                    inputValue={inputValue}
                    deepResearchMessages={deepResearchMessages}
                    deepResearchOutputs={deepResearchOutputs}
                    codeFiles={codeFiles}
                    codeOutput={codeOutput}
                    pendingOrchestrationTools={pendingOrchestrationTools}
                    browserActions={browserActions}
                  />
                  {/* Render Deep Research Interface outside of messages */}
                  {renderAgentInterface()}
                </>
              )}
            </ChatContainer>

            <ChatInput
              inputValue={inputValue}
              setInputValue={setInputValue}
              inputRef={inputRef}
              handleInputChange={handleInputChange}
              wrappedHandleSendMessage={wrappedHandleSendMessage}
              wrappedHandleRetryMessage={wrappedHandleRetryMessage}
              isProcessing={isProcessing}
              connectionStatus={connectionStatus}
              retryCount={retryCount}
              lastFailedMessage={lastFailedMessage}
              agentState={agentState}
              startAgent={startAgent}
              stopAgent={stopAgent}
              isDeepResearch={isDeepResearch}
              setIsDeepResearch={setIsDeepResearch}
              setDeepResearchSessionId={setDeepResearchSessionId}
              setDeepResearchUserId={setDeepResearchUserId}
              setDeepResearchOutputs={setDeepResearchOutputs}
              setDeepResearchMessages={setDeepResearchMessages}
              isMobile={true}
              hasMessages={messages.length > 0}
            />
          </div>
        </div>

        <div className="hidden md:flex md:flex-row md:w-full">
          <div className={`flex flex-col transition-all duration-500 ${
            agentState.isActive ? "w-1/2" : "w-full"
          }`}>
          <ChatHeader
            showCareTeam={showCareTeam}
            setShowCareTeam={setShowCareTeam}
            agentState={agentState}
            startAgent={startAgent}
            stopAgent={stopAgent}
            isMobile={false}
          />

          {showCareTeam && <CareTeamPanel onClose={() => setShowCareTeam(false)} />}

          <ChatContainer
            showTimeline={showTimeline}
            setShowTimeline={setShowTimeline}
            messages={messages}
            agentState={agentState}
            isMobile={false}
          >
            {messages.length === 0 ? (
              <EmptyState agentState={agentState} />
            ) : (
              <>
                <MessageList
                  messages={messages}
                  isProcessing={isProcessing}
                  currentReasoning={currentReasoning}
                  reasoningTokens={reasoningTokens}
                  toolOutputs={toolOutputs}
                  orchestrationActivities={orchestrationActivities}
                  agentActivities={agentActivities}
                  currentOrchestrationAgent={currentOrchestrationAgent}
                  isAgentOrchestrationActive={isAgentOrchestrationActive}
                  claudeCodeOutputs={claudeCodeOutputs}
                  currentStreamingMessage={currentStreamingMessage}
                  messagesEndRef={messagesEndRef}
                  providerSearchData={providerSearchData}
                  userProfile={userProfile}
                  isDeepResearch={isDeepResearch}
                  setIsDeepResearch={setIsDeepResearch}
                  setInputValue={setInputValue}
                  handleSendMessage={wrappedHandleSendMessage}
                  inputValue={inputValue}
                  deepResearchMessages={deepResearchMessages}
                  deepResearchOutputs={deepResearchOutputs}
                  codeFiles={codeFiles}
                  codeOutput={codeOutput}
                  pendingOrchestrationTools={pendingOrchestrationTools}
                  browserActions={browserActions}
                  isMobile={false}
                />
                {/* Render Deep Research Interface outside of messages */}
                {renderAgentInterface()}
              </>
            )}
          </ChatContainer>

          <ChatInput
            inputValue={inputValue}
            setInputValue={setInputValue}
            inputRef={inputRef}
            handleInputChange={handleInputChange}
            wrappedHandleSendMessage={wrappedHandleSendMessage}
            wrappedHandleRetryMessage={wrappedHandleRetryMessage}
            isProcessing={isProcessing}
            connectionStatus={connectionStatus}
            retryCount={retryCount}
            lastFailedMessage={lastFailedMessage}
            agentState={agentState}
            startAgent={startAgent}
            stopAgent={stopAgent}
            isDeepResearch={isDeepResearch}
            setIsDeepResearch={setIsDeepResearch}
            setDeepResearchSessionId={setDeepResearchSessionId}
            setDeepResearchUserId={setDeepResearchUserId}
            setDeepResearchOutputs={setDeepResearchOutputs}
            setDeepResearchMessages={setDeepResearchMessages}
            isMobile={false}
            isOpen={isOpen}
            hasMessages={messages.length > 0}
          />
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

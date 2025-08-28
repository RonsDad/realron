/**
 * Message Handler Hook
 * Extracted from page.tsx lines 134-1405
 * 
 * IMPORTANT: All variable names are EXACT matches from page.tsx
 * DO NOT rename any variables - this is a direct extraction
 * 
 * Updated to use useToolExecution hook for all tool-related functionality
 */

import { useCallback } from 'react'
import { useRonAIStore } from '@/providers/ron-ai-store-provider'
import { claudeAPI, parseSSEStream, type ChatMessage } from '@/lib/api'
import type { Message } from '@/lib/types'
import { useToolExecution } from './useToolExecution'
import { useDeepResearch } from './useDeepResearch'
import { useAgentOrchestration } from './useAgentOrchestration'

export const useMessageHandler = () => {
  // Get ALL the state and setters from Zustand store with EXACT names
  const store = useRonAIStore((state) => state)
  
  // Use the new tool execution hook
  const { executeTools, handleToolMessage } = useToolExecution()
  
  // Use the deep research hook
  const { 
    isDeepResearch,
    createOrReuseSession, 
    processDeepResearchStream 
  } = useDeepResearch()

  // Use the agent orchestration hook
  const { 
    resetAgentOrchestration,
    executePendingOrchestrationTools
  } = useAgentOrchestration()

  // MAIN FUNCTION - handleSendMessage - EXACT from page.tsx line 266-1363
  const handleSendMessage = useCallback(async (
    messageOverride?: string,
    agentState?: any,
    startAgent?: (task: string, url?: string) => void,
    updateUrl?: (url: string) => void
  ) => {
    const messageToSend = messageOverride || store.inputValue
    if (typeof messageToSend === 'string' && messageToSend.trim() && !store.isProcessing) {
      // Reset connection status and retry count for new messages
      if (!messageOverride) {
        store.setConnectionStatus('connecting')
        store.setRetryCount(0)
        store.setLastFailedMessage("")
      }
      
      const newMessage: Message = {
        role: "user",
        content: messageToSend,
        timestamp: new Date(),
      }

      store.setMessages((prev) => [...prev, newMessage])
      if (!messageOverride) {
        store.setInputValue("")
      }
      store.setIsProcessing(true)
      store.setCurrentStreamingMessage("")
      store.setCurrentReasoning("")
      store.setReasoningTokens(0)
      // Clear previous outputs only for fresh messages, not retries
      if (!messageOverride) {
        store.setThinkingBubbles([])
        store.setToolOutputs([])
        store.setCurrentThinkingId(null)
      }
      store.setClaudeCodeOutputs([])
      // Reset agent orchestration for new message
      resetAgentOrchestration()

      try {
        // Check if using deep research mode
        if (isDeepResearch) {
          // Create or reuse deep research session
          const { sessionId, userId } = await createOrReuseSession()
          
          // Stream from deep research endpoint
          console.log("Calling deepResearch with:", {
            sessionId,
            userId,
            messageCount: store.messages.length + 1
          })
          
          const stream = await claudeAPI.deepResearch(
            messageToSend,
            sessionId,
            userId
          )
          
          // Create context for stream processing
          let fullContent = ""
          const streamContext = {
            fullContent,
            setFullContent: (content: string) => {
              fullContent = content
            }
          }
          
          // Process the deep research stream using the hook
          await processDeepResearchStream(stream, messageToSend, streamContext)
          
          // Update final message content
          if (fullContent) {
            store.setMessages(prev => [...prev, {
              role: "assistant",
              content: fullContent,
              reasoning: "", // Deep research doesn't use reasoning like regular chat
              reasoningTokens: 0,
              timestamp: new Date()
            }])
          }
        } else {
          // Use regular Claude chat endpoint
          // Convert messages to API format
          const apiMessages: ChatMessage[] = store.messages.map(msg => ({
            role: msg.role as "user" | "assistant",
            content: msg.content
          }))
          apiMessages.push({ role: "user", content: messageToSend })

          // Determine which tools to enable based on context
          const tools: string[] = [
            "text_editor",
            "create_browser_session",
            "browser_use",
            "computer_use",  // Computer desktop control tool
            "perplexity_deep_research",
            "perplexity_reasoning_pro",
            "perplexity_sonar_pro",
            // Clinical tool
            "clinical_operations",
            // PubMed tools
            "pubmed_search",
            "pubmed_fetch_abstracts",
            "pubmed_fetch_summaries",
            "pubmed_fetch_related",
            "pubmed_fetch_citations",
            "pubmed_search_clinical_trials",
            "pubmed_mesh_search",
            // FDA tools
            "searchDrugLabel",
            "searchAdverseEffects",
            "getSpecialPopulations",
            "getBoxedWarning",
            "getDrugInteractions",
            "getAbuse",
            "getAbuseTable",
            "getActiveIngredient",
            "getAdverseReactions",
            "getClinicalPharmacology",
            "getContraindications",
            "getDescription",
            "getDosageAndAdministration",
            "getWarnings",
            "getPregnancy",
            "getPediatricUse",
            "getGeriatricUse",
            "getIndicationsAndUsage",
            "getMechanismOfAction",
            "getOverdosage",
            "getPharmacokinetics",
            "getControlledSubstance",
            "getNursingMothers"
          ]
          if (messageToSend.toLowerCase().includes("bash") || messageToSend.toLowerCase().includes("command")) {
            tools.push("bash")
          }

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

You have access to powerful medical research tools:
- Clinical Operations: Evidence-based clinical guidance and care coordination
- PubMed Tools: Search and analyze biomedical literature from the world's largest medical database
- FDA Drug Tools: Comprehensive drug information including warnings, interactions, and usage guidelines
- Perplexity Tools: Advanced web search and reasoning capabilities

When helping with healthcare tasks:
1. Be empathetic and supportive
2. Provide clear, actionable advice
3. Use your tools when needed to search for information, analyze documents, or help with tasks
4. Always prioritize user safety and encourage professional medical consultation when appropriate
5. If doing deep research, be thorough and cite sources
6. When using medical tools, explain findings in patient-friendly language

${store.isDeepResearch ? "DEEP RESEARCH MODE: Perform comprehensive research with multiple sources and detailed analysis." : ""}`
          })

          // Set connected status once stream starts successfully
          store.setConnectionStatus('connected')

          let fullContent = ""
          let fullReasoning = ""
          // Removed console.log spam for better performance
          for await (const event of parseSSEStream(stream)) {
            // Handle content block start for thinking - CREATE BUBBLE IMMEDIATELY
            if (event.type === 'content_block_start' && event.content_block?.type === 'thinking') {
              console.log('💭 Thinking block started')
              fullReasoning = ""
              store.setCurrentReasoning("")
              
              // Create new thinking bubble immediately
              const thinkingId = `thinking-${Date.now()}`
              store.setCurrentThinkingId(thinkingId)
              store.setThinkingBubbles(prev => [...prev, {
                id: thinkingId,
                content: "💭 Thinking...",
                timestamp: new Date()
              }])
            }
            // Handle content deltas (text)
            else if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
              fullContent += event.delta.text || ""
              store.setCurrentStreamingMessage(fullContent)
            }
            // Handle thinking deltas - CAPTURE AND DISPLAY
            else if (event.type === 'content_block_delta' && event.delta?.type === 'thinking_delta') {
              const deltaText = event.delta.thinking || ""
              fullReasoning += deltaText
              store.setCurrentReasoning(fullReasoning)
              
              // Update or create thinking bubble for persistence
              if (store.currentThinkingId) {
                store.setThinkingBubbles(prev => prev.map(t => 
                  t.id === store.currentThinkingId ? {...t, content: fullReasoning} : t
                ))
              } else {
                const thinkingId = `thinking-${Date.now()}`
                store.setCurrentThinkingId(thinkingId)
                store.setThinkingBubbles([{
                  id: thinkingId,
                  content: fullReasoning,
                  timestamp: new Date()
                }])
              }
            }
            // Handle signature deltas
            else if (event.type === 'content_block_delta' && event.delta?.type === 'signature_delta') {
              // Signature is encrypted and we don't need to display it
            }
            // Delegate ALL tool-related events to useToolExecution
            else if (event.type === 'content_block_start' && 
                    (event.content_block?.type === 'tool_use' || event.content_block?.type === 'server_tool_use')) {
              handleToolMessage(event, {
                fullContent,
                setFullContent: (content: string) => {
                  fullContent = content
                  store.setCurrentStreamingMessage(fullContent)
                },
                agentState,
                startAgent,
                updateUrl
              })
            }
            else if (event.type === 'code_execution_result' ||
                     event.type === 'browser_live_url' ||
                     event.type === 'tool_result' ||
                     event.type === 'tool_error' ||
                     event.type === 'computer_screenshot' ||
                     event.type === 'computer_actions' ||
                     event.type === 'computer_thinking') {
              handleToolMessage(event, {
                fullContent,
                setFullContent: (content: string) => {
                  fullContent = content
                  store.setCurrentStreamingMessage(fullContent)
                },
                agentState,
                startAgent,
                updateUrl
              })
            }
            // Handle message delta with usage information
            else if (event.type === 'message_delta' && event.usage) {
              // Just use the output tokens from the API
              // Thinking tokens are included in the total output_tokens
              if (event.usage.output_tokens) {
                // For now, we'll just show a placeholder or hide the token count
                // since we can't isolate thinking tokens from regular output tokens
                store.setReasoningTokens(0)
              }
            }
            // Handle continuation after tool use
            else if (event.type === 'message_start_continuation') {
              console.log("Continuing message after tool use")
              // Don't reset the message - just continue adding to it
            }
            // Handle agent status updates
            else if (event.type === 'agent_status') {
              console.log("Agent status:", event.data)
              // Show status in UI
              if (event.data?.status === 'executing_tools') {
                fullContent += `\n\n⚙️ **${event.data.message || 'Processing tool requests...'}**`
                store.setCurrentStreamingMessage(fullContent)
              } else if (event.data?.status === 'thinking') {
                fullContent += `\n\n💭 **${event.data.message || 'Analyzing results...'}**`
                store.setCurrentStreamingMessage(fullContent)
              }
            }
            // Handle message completion
            else if (event.type === 'message_stop') {
              console.log("Message completed", event.data?.final ? "(final)" : "")
              
              // Add final message to array ONLY when streaming is complete
              if (fullContent) {
                store.setMessages(prev => [...prev, {
                  role: "assistant",
                  content: fullContent,
                  reasoning: fullReasoning,
                  reasoningTokens: store.reasoningTokens,
                  timestamp: new Date()
                }])
              }
              
              // Execute any pending orchestration tools
              await executePendingOrchestrationTools()
            }
          }
        }

      } catch (error) {
        console.error("Error calling Claude API:", error)
        
        // Enhanced error handling for different error types
        let errorMessage = "I apologize, but I encountered an error while processing your request."
        let shouldShowRetry = false
        
        if (error instanceof Error) {
          if (error.message.includes('net::ERR_INCOMPLETE_CHUNKED_ENCODING') ||
              error.message.includes('Network connection interrupted')) {
            errorMessage = "The connection was interrupted. Please try sending your message again."
            shouldShowRetry = true
            store.setConnectionStatus('error')
          } else if (error.message.includes('timed out') || 
                     error.message.includes('aborted')) {
            errorMessage = "The request took too long to complete. Please try again with a shorter message or check your internet connection."
            shouldShowRetry = true
            store.setConnectionStatus('error')
          } else if (error.message.includes('Stream failed after')) {
            errorMessage = "I'm having trouble maintaining a stable connection. Please wait a moment and try again."
            shouldShowRetry = true
            store.setConnectionStatus('error')
          } else if (error.message.includes('429') || 
                     error.message.includes('rate limit')) {
            errorMessage = "I'm currently handling a lot of requests. Please wait a moment and try again."
            shouldShowRetry = true
            store.setConnectionStatus('error')
          } else if (error.message.includes('500') || 
                     error.message.includes('502') ||
                     error.message.includes('503') || 
                     error.message.includes('504')) {
            errorMessage = "The server is temporarily unavailable. Please try again in a few moments."
            shouldShowRetry = true
            store.setConnectionStatus('error')
          } else {
            store.setConnectionStatus('error')
          }
        }
        
        // Store the failed message for retry
        if (shouldShowRetry) {
          store.setLastFailedMessage(messageToSend)
          store.setRetryCount(prev => prev + 1)
        }
        
        store.setMessages(prev => [
          ...prev,
          {
            role: "assistant",
            content: errorMessage + (shouldShowRetry ? " Click the retry button below to try again." : ""),
            timestamp: new Date(),
          }
        ])
        
        // Clean up any active streams on error
        claudeAPI.abortAllStreams()
      } finally {
        store.setIsProcessing(false)
        store.setCurrentStreamingMessage("")
        store.setCurrentReasoning("")
      }
    }
  }, [store, executeTools, handleToolMessage, isDeepResearch, createOrReuseSession, processDeepResearchStream, resetAgentOrchestration, executePendingOrchestrationTools])

  // handleRetryMessage - EXACT from page.tsx line 1399
  const handleRetryMessage = useCallback(async (
    agentState?: any,
    startAgent?: (task: string, url?: string) => void,
    updateUrl?: (url: string) => void
  ) => {
    if (store.lastFailedMessage && !store.isProcessing) {
      store.setConnectionStatus('retry')
      console.log(`Retrying message (attempt ${store.retryCount + 1}):`, store.lastFailedMessage)
      await handleSendMessage(store.lastFailedMessage, agentState, startAgent, updateUrl)
    }
  }, [store, handleSendMessage])

  return {
    handleSendMessage,
    handleRetryMessage,
  }
}
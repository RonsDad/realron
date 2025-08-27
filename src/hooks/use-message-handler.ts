/**
 * Message Handler Hook
 * Extracted from page.tsx lines 134-1405
 * 
 * IMPORTANT: All variable names are EXACT matches from page.tsx
 * DO NOT rename any variables - this is a direct extraction
 */

import { useCallback } from 'react'
import { useRonAIStore } from '@/store'
import { claudeAPI, parseSSEStream, type ChatMessage } from '@/lib/api'
import type { Message } from '@/lib/types'
import type { AgentActivity, AgentActivityType } from '@/store/types'

export const useMessageHandler = () => {
  // Get ALL the state and setters from Zustand store with EXACT names
  const store = useRonAIStore()
  
  // Helper to check if a tool is an orchestration tool - EXACT from page.tsx line 134
  const isOrchestrationTool = (toolName: string): boolean => {
    const orchestrationTools = [
      'execute_with_orchestrator',
      'create_orchestrator_agent', 
      'create_worker_agent',
      'execute_pipeline',
      'create_custom_pipeline',
      'send_agent_message',
      'broadcast_to_agents',
      'list_available_agents'
    ]
    return orchestrationTools.includes(toolName)
  }

  // Execute orchestration tool with streaming - EXACT from page.tsx line 149
  const executeOrchestrationTool = async (tool: any) => {
    console.log('🚀 Executing orchestration tool:', tool.name, tool.input)
    
    try {
      const response = await fetch('http://localhost:8001/execute-agent-tool-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool_name: tool.name,
          tool_input: tool.input
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      // Parse SSE stream
      for await (const event of parseSSEStream(response.body!)) {
        console.log('📡 Agent event:', event)
        
        if (event.type === 'agent_spawned') {
          const activity: AgentActivityType = {
            id: event.agent_id,
            agentId: event.agent_id,
            agentName: event.name || event.agent_id,
            agentType: event.agent_type as 'orchestrator' | 'worker',
            specialization: event.specialization,
            task: event.task,
            status: 'spawned',
            timestamp: new Date(event.timestamp),
            model: event.model
          }
          store.setOrchestrationActivities(prev => [...prev, activity])
        }
        
        else if (event.type === 'agent_thinking_start') {
          store.setOrchestrationActivities(prev => prev.map(a => 
            a.agentId === event.agent_id 
              ? {...a, status: 'thinking' as const}
              : a
          ))
        }
        
        else if (event.type === 'agent_thinking') {
          store.setOrchestrationActivities(prev => prev.map(a => 
            a.agentId === event.agent_id 
              ? {...a, thinking: event.cumulative || event.content}
              : a
          ))
        }
        
        else if (event.type === 'agent_status') {
          const statusMap: Record<string, AgentActivityType['status']> = {
            'planning': 'planning',
            'executing': 'executing', 
            'synthesizing': 'thinking'
          }
          store.setOrchestrationActivities(prev => prev.map(a => 
            a.agentId === event.agent_id 
              ? {...a, status: statusMap[event.status] || 'executing'}
              : a
          ))
        }
        
        else if (event.type === 'agent_tool_use') {
          // Add tool usage to the activity
          store.setToolOutputs(prev => [...prev, {
            id: `${event.agent_id}-tool-${Date.now()}`,
            toolName: `${event.agent_name}: ${event.tool_name}`,
            content: '⚙️ Executing...',
            timestamp: new Date(),
            status: 'executing'
          }])
        }
        
        else if (event.type === 'agent_completed') {
          store.setOrchestrationActivities(prev => prev.map(a => 
            a.agentId === event.agent_id 
              ? {...a, status: 'completed' as const, result: event.result}
              : a
          ))
        }
        
        else if (event.type === 'orchestrator_created' || event.type === 'worker_created') {
          // Handle agent creation results
          const result = event.result
          if (result.success) {
            store.setToolOutputs(prev => [...prev, {
              id: `created-${Date.now()}`,
              toolName: tool.name,
              content: `✅ Created ${result.name} (${result.agent_id})`,
              timestamp: new Date(),
              status: 'completed'
            }])
          }
        }
      }
    } catch (error) {
      console.error('❌ Error executing orchestration tool:', error)
      store.setToolOutputs(prev => [...prev, {
        id: `error-${Date.now()}`,
        toolName: tool.name,
        content: `❌ Error: ${error}`,
        timestamp: new Date(),
        status: 'error'
      }])
    }
  }

  // Helper functions for agent orchestration - EXACT from page.tsx lines 1366-1397
  const addAgentActivity = (activity: Omit<AgentActivity, 'id' | 'timestamp'>) => {
    const newActivity: AgentActivity = {
      ...activity,
      id: `activity-${Date.now()}-${Math.random()}`,
      timestamp: new Date()
    };
    store.setAgentActivities(prev => [...prev, newActivity]);
    return newActivity.id;
  };

  const updateAgentActivity = (id: string, updates: Partial<AgentActivity>) => {
    store.setAgentActivities(prev => prev.map(activity => 
      activity.id === id ? { ...activity, ...updates } : activity
    ));
  };

  const mapToolNameToActivityType = (toolName: string): AgentActivity['type'] => {
    if (toolName.startsWith('pubmed_search')) return 'search';
    if (toolName.startsWith('pubmed_fetch')) return 'fetch';
    if (toolName.startsWith('clinical_operations')) return 'synthesis';
    if (toolName.startsWith('perplexity_')) return 'analysis';
    if (toolName.startsWith('web_search')) return 'search';
    return 'tool';
  };

  const getAgentNameFromTool = (toolName: string): string => {
    if (toolName.startsWith('pubmed_')) return 'Research Agent';
    if (toolName.startsWith('clinical_')) return 'Clinical Agent';
    if (toolName.startsWith('perplexity_')) return 'Analysis Agent';
    if (toolName.startsWith('web_search')) return 'Web Search Agent';
    return 'System Agent';
  };

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
      store.setAgentActivities([])
      store.setIsAgentOrchestrationActive(false)
      store.setCurrentOrchestrationAgent(null)

      try {
        // Check if using deep research mode
        if (store.isDeepResearch) {
          // Using deep research agent
          
          let sessionId = store.deepResearchSessionId
          let userId = store.deepResearchUserId
          
          // Only create a new session if we don't have one
          if (!sessionId || !userId) {
            userId = "user_" + Math.random().toString(36).substr(2, 9)
            console.log("Creating new deep research session...")
            sessionId = await claudeAPI.createDeepResearchSession(userId)
            console.log("Session created with ID:", sessionId)
            
            // Save session info for subsequent messages
            store.setDeepResearchSessionId(sessionId)
            store.setDeepResearchUserId(userId)
          } else {
            console.log("Reusing existing session:", sessionId)
          }
          
          // Stream from deep research endpoint
          console.log("Calling deepResearch with:", {
            sessionId,
            userId,
            messageCount: store.messages.length + 1
          })
          
          const stream = await claudeAPI.deepResearch(
            messageToSend,
            sessionId!,
            userId!
          )
          
          // Set connected status for deep research
          store.setConnectionStatus('connected')
          
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
                            // Direct text content from backend
                            fullContent = part.text
                            store.setCurrentStreamingMessage(fullContent)
                          }
                        }
                      }
                      
                      // Handle state delta updates (research plan, final report, etc)
                      if (event.actions?.stateDelta) {
                        // Update deep research outputs with proper structure
                        const stateDelta = event.actions.stateDelta
                        
                        if (stateDelta.research_plan) {
                          store.setDeepResearchOutputs((prev: any) => ({
                            ...prev,
                            plan: stateDelta.research_plan
                          }))
                          // Don't show plan in message bubble, show in research component
                          fullContent = "Creating research plan..."
                          store.setCurrentStreamingMessage(fullContent)
                          store.setDeepResearchMessages(prev => [...prev, {
                            type: 'plan',
                            content: stateDelta.research_plan,
                            timestamp: new Date()
                          }])
                        }
                        
                        if (stateDelta.final_report_with_citations) {
                          store.setDeepResearchOutputs((prev: any) => ({
                            ...prev,
                            finalReport: stateDelta.final_report_with_citations
                          }))
                          // Show completion message
                          fullContent = "Research complete! See the detailed report below."
                          store.setCurrentStreamingMessage(fullContent)
                          store.setDeepResearchMessages(prev => [...prev, {
                            type: 'final',
                            content: stateDelta.final_report_with_citations,
                            timestamp: new Date()
                          }])
                        }
                        
                        if (stateDelta.section_research_findings) {
                          store.setDeepResearchOutputs((prev: any) => ({
                            ...prev,
                            findings: stateDelta.section_research_findings
                          }))
                          store.setDeepResearchMessages(prev => [...prev, {
                            type: 'findings',
                            content: stateDelta.section_research_findings,
                            timestamp: new Date()
                          }])
                        }
                        
                        if (stateDelta.report_sections) {
                          store.setDeepResearchOutputs((prev: any) => ({
                            ...prev,
                            outline: stateDelta.report_sections
                          }))
                          store.setDeepResearchMessages(prev => [...prev, {
                            type: 'outline',
                            content: stateDelta.report_sections,
                            timestamp: new Date()
                          }])
                        }
                        
                        if (stateDelta.research_evaluation) {
                          store.setDeepResearchOutputs((prev: any) => ({
                            ...prev,
                            evaluation: stateDelta.research_evaluation
                          }))
                          store.setDeepResearchMessages(prev => [...prev, {
                            type: 'evaluation',
                            content: JSON.stringify(stateDelta.research_evaluation),
                            timestamp: new Date()
                          }])
                        }
                        
                        if (stateDelta.sources) {
                          store.setDeepResearchOutputs((prev: any) => ({
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
                            if (part.text) {
                              store.setDeepResearchMessages(prev => [...prev, {
                                type: 'thought',
                                content: part.text,
                                agent: event.author,
                                stage: event.stage || 'research',
                                timestamp: new Date()
                              }])
                            }
                          }
                        }
                      }
                      
                      // Track tool usage for transparency
                      if (event.tool_use) {
                        store.setDeepResearchMessages(prev => [...prev, {
                          type: 'action',
                          content: `Using ${event.tool_use.name}: ${event.tool_use.input?.task || event.tool_use.input?.query || 'Processing...'}`,
                          agent: event.author || 'unknown',
                          metadata: {
                            toolName: event.tool_use.name,
                            toolInput: event.tool_use.input
                          },
                          timestamp: new Date()
                        }])
                      }
                      
                      // Update the assistant message
                      store.setMessages(prev => {
                        const newMessages = [...prev]
                        if (newMessages.length > 0 && newMessages[newMessages.length - 1].role === "assistant") {
                          newMessages[newMessages.length - 1] = {
                            ...newMessages[newMessages.length - 1],
                            content: fullContent,
                            reasoning: fullReasoning,
                            reasoningTokens: store.reasoningTokens
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
            // Handle tool use start (both client and server tools) - WITH VISIBILITY
            else if (event.type === 'content_block_start' && 
                    (event.content_block?.type === 'tool_use' || event.content_block?.type === 'server_tool_use')) {
              const toolName = event.content_block.name
              const isCodeExecution = toolName === 'code_execution'
              
              // LOG FOR VISIBILITY
              console.log(`🚀 Tool started: ${toolName}`, event.content_block)
              
              // Check if it's an orchestration tool that needs execution
              if (isOrchestrationTool(toolName)) {
                console.log('🎯 Orchestration tool detected:', toolName)
                // Store for execution after message completes
                store.setPendingOrchestrationTools(prev => [...prev, {
                  id: event.content_block.id,
                  name: toolName,
                  input: {} // Will be filled by input deltas
                }])
              }
              
              // Activate agent orchestration and track activity
              store.setIsAgentOrchestrationActive(true)
              const agentName = isCodeExecution ? 'Code Executor' : getAgentNameFromTool(toolName)
              store.setCurrentOrchestrationAgent(agentName)
              
              // Add agent activity
              const activityId = addAgentActivity({
                type: isCodeExecution ? 'analysis' : mapToolNameToActivityType(toolName),
                agent: agentName,
                description: isCodeExecution ? 'Executing Python code...' : `Starting ${toolName}`,
                status: 'running'
              })
              
              // Add tool output with ENHANCED VISIBILITY
              const toolId = `tool-${Date.now()}-${toolName}`
              store.setToolOutputs(prev => [...prev, {
                id: toolId,
                toolName: toolName,
                content: isCodeExecution ? "🐍 Running Python code..." : `⚙️ Executing ${toolName}...`,
                timestamp: new Date(),
                status: "executing"
              }])
              
              // Also add to message stream for immediate visibility
              if (!fullContent.includes(toolName)) {
                fullContent += `\n\n🔧 **Using tool:** ${toolName}\n`
                store.setCurrentStreamingMessage(fullContent)
              }
              
              // Store activity ID for later updates
              store.setToolOutputs(prev => prev.map(tool => 
                tool.id === toolId ? { ...tool, activityId } : tool
              ))
              
              // Clear browser actions when browser_use tool is detected
              if (toolName === 'browser_use') {
                console.log('Browser-use tool detected, waiting for live URL...')
                // Clear previous browser actions
                store.setBrowserActions([])
                // Don't open the panel yet - wait for the live URL to come in browser_live_url event
              }
            }
            // Handle code execution results
            else if (event.type === 'code_execution_result') {
              console.log('Code execution result received:', event.data)
              
              const { stdout, stderr, return_code, tool_use_id } = event.data || {}
              
              // Create a formatted output for the code execution
              let codeOutput = ''
              
              if (stdout) {
                codeOutput = `\n\n📊 **Code Execution Output:**\n\`\`\`\n${stdout}\n\`\`\``
              }
              
              if (stderr) {
                codeOutput += `\n\n❌ **Error Output:**\n\`\`\`\n${stderr}\n\`\`\``
              }
              
              if (return_code !== undefined && return_code !== 0) {
                codeOutput += `\n\n⚠️ **Exit Code:** ${return_code}`
              }
              
              // Add the output to the message stream
              if (codeOutput) {
                fullContent += codeOutput
                store.setCurrentStreamingMessage(fullContent)
              }
              
              // Also create a tool output bubble for better visibility
              const toolId = `code-exec-${Date.now()}`
              store.setToolOutputs(prev => [...prev, {
                id: toolId,
                toolName: 'code_execution',
                content: stdout || stderr || 'Code executed',
                timestamp: new Date(),
                status: return_code === 0 ? 'completed' : 'error',
                details: {
                  stdout,
                  stderr,
                  return_code
                }
              }])
              
              // Update agent activity if tracking
              const agentName = 'Code Executor'
              const runningActivity = store.agentActivities.find(a => 
                a.agent === agentName && 
                a.status === 'running'
              )
              if (runningActivity) {
                updateAgentActivity(runningActivity.id, {
                  status: return_code === 0 ? 'completed' : 'error',
                  description: return_code === 0 ? 'Code executed successfully' : 'Code execution failed',
                  details: { stdout, stderr, return_code }
                })
              }
            }
            // Handle browser live URL - IMMEDIATE!
            else if (event.type === 'browser_live_url') {
              console.log('BROWSER LIVE URL RECEIVED:', event.live_url)
              
              // Skip if we already have this URL to avoid redundant updates
              if (agentState?.liveUrl === event.live_url) {
                console.log('LiveURL already set, skipping update')
                continue
              }
              
              // Open panel with URL in one operation for faster rendering
              if (!agentState?.isActive && startAgent) {
                console.log('Opening browser panel with LiveURL:', event.live_url)
                startAgent('Claude is using browser', event.live_url)
              } else if (updateUrl) {
                // Only update URL if panel already open
                updateUrl(event.live_url)
                console.log('Browser panel already open, LiveURL updated to:', event.live_url)
              }
            }
            // Handle tool results - WITH FULL VISIBILITY
            else if (event.type === 'tool_result') {
              console.log(`🎯 Tool completed: ${event.tool_name}`, event.result)
              // Tool completed - display result prominently
              
              // Update agent activity to completed
              const agentName = getAgentNameFromTool(event.tool_name)
              // Find the most recent running activity for this agent and tool
              const runningActivity = store.agentActivities.find(a => 
                a.agent === agentName && 
                a.status === 'running' && 
                a.description.includes(event.tool_name)
              )
              if (runningActivity) {
                updateAgentActivity(runningActivity.id, {
                  status: 'completed',
                  description: `Completed ${event.tool_name}`,
                  details: typeof event.result === 'object' ? event.result : event.result
                })
              }
              
              // Create tool output bubble
              const toolId = `tool-${Date.now()}-${event.tool_name}`
              let toolContent = ''
              let formattedResult = ''
              
              // Format tool results based on type - KEEPING ALL THE MASSIVE IF/ELSE LOGIC
              if (event.tool_name === 'browser_use') {
                const result = typeof event.result === 'string' ? JSON.parse(event.result) : event.result
                
                // Update LiveURL IMMEDIATELY if browser_use tool returns one
                if (result.live_url) {
                  console.log('IMMEDIATE: Updating LiveURL from browser_use result:', result.live_url)
                  
                  // Open panel AND update URL in one go for faster rendering
                  if (!agentState?.isActive && startAgent) {
                    console.log('IMMEDIATE: Opening browser panel with live URL:', result.live_url)
                    startAgent('Claude is using browser', result.live_url)
                  } else if (updateUrl) {
                    // Only update URL if panel already open
                    updateUrl(result.live_url)
                  }
                }
                
                // Parse browser actions from the result
                if (result.success && result.result) {
                  const cleanResult = result.result
                  
                  // Parse all ActionResults to build timeline
                  const actionRegex = /ActionResult\([^)]+\)/g
                  const actionMatches = cleanResult.matchAll(actionRegex)
                  
                  const newActions: any[] = []
                  for (const match of actionMatches) {
                    const actionStr = match[0]
                    
                    // Extract action details
                    const extractedContent = actionStr.match(/extracted_content='([^']*(?:\\'[^']*)*)'/)
                    const longTermMemory = actionStr.match(/long_term_memory='([^']*(?:\\'[^']*)*)'/)
                    const isDone = actionStr.includes('is_done=True')
                    
                    const content = (extractedContent?.[1] || longTermMemory?.[1] || '')
                      .replace(/\\n/g, '\n')
                      .replace(/\\'/g, "'")
                    
                    // Determine action type and create timeline entry
                    let actionType = 'search'
                    let description = content.substring(0, 100)
                    let details = content
                    let url = null
                    
                    if (content.includes('Navigated to')) {
                      actionType = 'navigate'
                      const urlMatch = content.match(/Navigated to (.+)/)
                      url = urlMatch?.[1]
                      description = `Navigated to ${url || 'page'}`
                    } else if (content.includes('Clicked')) {
                      actionType = 'click'
                      description = content
                    } else if (content.includes('Extracted content')) {
                      actionType = 'extract'
                      description = 'Extracted page content'
                      // Try to parse the JSON content
                      try {
                        const jsonMatch = content.match(/\{[\s\S]*\}/)
                        if (jsonMatch) {
                          const parsed = JSON.parse(jsonMatch[0])
                          details = JSON.stringify(parsed, null, 2)
                        }
                      } catch (e) {
                        // Keep original if parsing fails
                      }
                    } else if (content.includes('Switched to tab')) {
                      actionType = 'switch_tab'
                      description = content
                    } else if (isDone) {
                      actionType = 'complete'
                      description = 'Task completed'
                      details = content
                    }
                    
                    if (content && content.length > 0) {
                      newActions.push({
                        id: `action-${Date.now()}-${Math.random()}`,
                        type: actionType,
                        description: description.substring(0, 100),
                        timestamp: new Date(),
                        details: details.length > 100 ? details : null,
                        url: url,
                        success: !actionStr.includes('error=')
                      })
                    }
                  }
                  
                  // Update browser actions
                  store.setBrowserActions(prev => [...prev, ...newActions])
                  
                  // Look for the last ActionResult with is_done=True
                  const isDoneMatch = cleanResult.match(/ActionResult\(is_done=True[^)]*extracted_content='([^']*(?:\\'[^']*)*)'[^)]*\)/)
                  
                  if (isDoneMatch && isDoneMatch[1]) {
                    // Clean up the extracted content
                    let extractedContent = isDoneMatch[1]
                      .replace(/\\n/g, '\n')
                      .replace(/\\'/g, "'")
                      .replace(/\s*-\s*\d+\s*more\s*characters$/, '')
                    
                    formattedResult = `\n\n✅ **Browser task completed**\n\n${extractedContent}`
                  } else {
                    // Try to find any meaningful text in the mess
                    const patterns = [
                      /Here is.*?(?=\n\nAttachments:|$)/,
                      /extracted_content='([^']+)'/,
                      /long_term_memory='([^']+)'/,
                    ]
                    
                    let found = false
                    for (const pattern of patterns) {
                      const match = cleanResult.match(pattern)
                      if (match && match[1] || match && match[0]) {
                        const content = match[1] || match[0]
                        formattedResult = `\n\n✅ **Browser task completed**\n\n${content.replace(/\\n/g, '\n').replace(/\\'/g, "'")}`
                        found = true
                        break
                      }
                    }
                    
                    if (!found) {
                      formattedResult = `\n\n✅ **Browser task completed**`
                    }
                  }
                } else if (!result.success) {
                  formattedResult = `\n\n❌ **Browser task failed**`
                  if (result.error) {
                    formattedResult += `\n\nError: ${result.error}`
                  }
                } else {
                  formattedResult = `\n\n✅ **Browser task completed**`
                }
              } else if (event.tool_name === 'web_search') {
                const result = typeof event.result === 'string' ? JSON.parse(event.result) : event.result
                formattedResult = `\n\n🔍 **Web search completed**`
                if (result.results && Array.isArray(result.results)) {
                  formattedResult += `\n\nFound ${result.results.length} results`
                }
              } else if (event.tool_name === 'provider_search') {
                try {
                  const result = typeof event.result === 'string' ? JSON.parse(event.result) : event.result
                  if (result && result.results) {
                    store.setProviderSearchData({ results: result.results, searchQuery: result.searchQuery || '' })
                  }
                  formattedResult = `\n\n✅ **Provider search completed**`
                } catch (e) {
                  formattedResult = `\n\n❌ **Provider search failed**`
                }
              } else if (event.tool_name === 'computer_use') {
                const result = typeof event.result === 'string' ? JSON.parse(event.result) : event.result
                formattedResult = `\n\n🖥️ **Computer control task ${result.task_completed ? 'completed' : 'in progress'}**`
                if (result.final_result) {
                  formattedResult += `\n\n${result.final_result}`
                } else if (result.error) {
                  formattedResult += `\n\nError: ${result.error}`
                }
              } else if (event.tool_name === 'code_execution' || event.tool_name === 'execute_code') {
                // Handle code execution output
                const result = typeof event.result === 'string' ? JSON.parse(event.result) : event.result
                
                // Extract code output from result
                let codeOutput = ''
                let language = 'python' // default
                
                if (result.output) {
                  codeOutput = result.output
                } else if (result.stdout) {
                  codeOutput = result.stdout
                  if (result.stderr) {
                    codeOutput += '\n\nErrors:\n' + result.stderr
                  }
                } else if (result.result) {
                  codeOutput = typeof result.result === 'string' ? result.result : JSON.stringify(result.result, null, 2)
                }
                
                // Set the code output state for display
                store.setCodeOutput(codeOutput)
                
                // If there's code content, also save it
                if (result.code) {
                  store.setCodeFiles([{
                    name: 'executed_code.' + (result.language || 'py'),
                    language: result.language || language,
                    content: result.code
                  }])
                }
                
                // Add to tool outputs
                store.setToolOutputs(prev => [...prev, {
                  id: toolId,
                  toolName: event.tool_name,
                  content: codeOutput || 'Code executed successfully',
                  timestamp: new Date(),
                  status: "completed"
                }])
                
                formattedResult = `\n\n✅ **Code execution completed**`
                if (codeOutput) {
                  formattedResult += `\n\n\`\`\`\n${codeOutput.substring(0, 200)}${codeOutput.length > 200 ? '...' : ''}\n\`\`\``
                }
              } else if (event.tool_name === 'claude_code_generate_tool') {
                // SDK generated tool with LiveURL
                const result = typeof event.result === 'string' ? JSON.parse(event.result) : event.result
                store.setToolOutputs(prev => [...prev, {
                  id: toolId,
                  toolName: event.tool_name,
                  content: { live_url: result.live_url, message: result.message },
                  timestamp: new Date(),
                  status: "completed"
                }])
                formattedResult = `\n\n✅ **Tool generated**`
              } else if (event.tool_name === 'use_claude_code') {
                // Parse the use_claude_code result
                const result = typeof event.result === 'string' ? JSON.parse(event.result) : event.result
                
                if (result.files_created && result.files_created.length > 0) {
                  // Store the Claude Code output for rendering with the special component
                  store.setClaudeCodeOutputs(prev => [...prev, {
                    id: toolId,
                    result: result.result || '',
                    files_created: result.files_created,
                    files_modified: result.files_modified || [],
                    console_outputs: result.console_outputs || [],
                    session: {
                      session_id: result.session_id,
                      can_continue: result.can_continue,
                      turns_used: result.turns_used || 1
                    },
                    timestamp: new Date()
                  }])
                  
                  formattedResult = `\n\n✅ **Created ${result.files_created.length} file${result.files_created.length > 1 ? 's' : ''}**\n\nSee the files below 👇`
                } else {
                  formattedResult = `\n\n✅ **Code task completed**`
                  if (result.result) {
                    formattedResult += `\n\n${result.result}`
                  }
                }
              } else if (event.tool_name === 'clinical_operations') {
                // Special handling for clinical_operations responses
                try {
                  const result = typeof event.result === 'string' ? JSON.parse(event.result) : event.result
                  
                  // Store the full clinical ops response for special rendering
                  if (result && result.output) {
                    // This is a full clinical ops response
                    store.setMessages(prev => {
                      const lastMsg = prev[prev.length - 1]
                      if (lastMsg && lastMsg.role === "assistant") {
                        return prev.slice(0, -1).concat({
                          ...lastMsg,
                          type: 'clinical_ops',
                          data: result
                        })
                      }
                      return prev
                    })
                    formattedResult = "" // Don't add text to message since we'll use special component
                  } else {
                    // Fallback for simpler responses
                    if (result.error) {
                      toolContent = `Error: ${result.error}`
                    } else if (result.result) {
                      toolContent = result.result
                    } else if (result.content) {
                      toolContent = result.content
                    } else {
                      toolContent = JSON.stringify(result, null, 2)
                    }
                    
                    store.setToolOutputs(prev => [...prev, {
                      id: toolId,
                      toolName: event.tool_name,
                      content: toolContent,
                      timestamp: new Date(),
                      status: "completed"
                    }])
                    formattedResult = `\n\n✅ **Clinical Operations completed**`
                  }
                } catch (e) {
                  toolContent = typeof event.result === 'string' ? event.result : JSON.stringify(event.result)
                  store.setToolOutputs(prev => [...prev, {
                    id: toolId,
                    toolName: event.tool_name,
                    content: toolContent,
                    timestamp: new Date(),
                    status: "completed"
                  }])
                  formattedResult = `\n\n✅ **Clinical Operations completed**`
                }
              } else if (event.tool_name?.startsWith('perplexity_') ||
                         event.tool_name?.startsWith('pubmed_') ||
                         event.tool_name?.startsWith('search') ||
                         event.tool_name?.startsWith('get')) {
                // Parse result to get content
                try {
                  const result = typeof event.result === 'string' ? JSON.parse(event.result) : event.result
                  if (result.error) {
                    toolContent = `Error: ${result.error}`
                  } else if (result.result) {
                    toolContent = result.result
                  } else if (result.content) {
                    toolContent = result.content
                  } else if (typeof result === 'string') {
                    toolContent = result
                  } else {
                    toolContent = JSON.stringify(result, null, 2)
                  }
                } catch (e) {
                  toolContent = typeof event.result === 'string' ? event.result : JSON.stringify(event.result)
                }
                
                // Add tool output bubble
                store.setToolOutputs(prev => [...prev, {
                  id: toolId,
                  toolName: event.tool_name,
                  content: toolContent,
                  timestamp: new Date(),
                  status: "completed"
                }])
                
                // Add brief mention in main message
                formattedResult = `\n\n✅ **Tool completed**`
              } else {
                // Default formatting for other tools
                const resultText = typeof event.result === 'string' ? event.result : JSON.stringify(event.result, null, 2)
                formattedResult = `\n\n✅ **${event.tool_name} completed**`
                if (resultText.length > 300) {
                  formattedResult += `\n\n${resultText.substring(0, 300)}...`
                } else {
                  formattedResult += `\n\n${resultText}`
                }
              }
              
              fullContent += formattedResult
              store.setCurrentStreamingMessage(fullContent)
            }
            // Handle tool errors
            else if (event.type === 'tool_error') {
              console.error(`Tool ${event.tool_name} error:`, event.error)
              
              // Update agent activity to error state
              const agentName = getAgentNameFromTool(event.tool_name)
              const runningActivity = store.agentActivities.find(a => 
                a.agent === agentName && 
                a.status === 'running' && 
                a.description.includes(event.tool_name)
              )
              if (runningActivity) {
                updateAgentActivity(runningActivity.id, {
                  status: 'error',
                  description: `Error in ${event.tool_name}`,
                  details: event.error
                })
              }
              
              fullContent += `\n\n❌ Tool error: ${event.error}`
              store.setCurrentStreamingMessage(fullContent)
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
            // Handle computer_use screenshots
            else if (event.type === 'computer_screenshot') {
              console.log('Computer screenshot received:', event.index, 'of', event.total)
              
              // Open the agent panel if not already open
              if (!agentState?.isActive && startAgent) {
                console.log('Opening computer use panel for screenshots')
                startAgent('Computer Use - Taking Screenshots', undefined)
              }
              
              // Add screenshot to browser actions timeline
              store.setBrowserActions(prev => [...prev, {
                id: `screenshot-${Date.now()}-${event.index}`,
                type: 'screenshot',
                description: `Screenshot ${event.index + 1} of ${event.total}`,
                timestamp: new Date(),
                screenshot: event.screenshot,
                success: true
              }])
            }
            // Handle computer_use actions
            else if (event.type === 'computer_actions') {
              console.log('Computer actions received:', event.actions)
              
              // Convert computer actions to browser timeline format
              const newActions = event.actions.map((action: any, index: number) => ({
                id: `computer-action-${Date.now()}-${index}`,
                type: action.action || 'action',
                description: action.action === 'screenshot' ? 'Taking screenshot' :
                           action.action === 'left_click' ? `Clicked at (${action.input?.coordinate?.[0]}, ${action.input?.coordinate?.[1]})` :
                           action.action === 'type' ? `Typed: ${action.input?.text}` :
                           action.action === 'key' ? `Pressed key: ${action.input?.key}` :
                           action.action === 'scroll' ? `Scrolled ${action.input?.scroll_direction}` :
                           action.action === 'left_click_drag' ? 'Dragged mouse' :
                           `${action.action}`,
                timestamp: new Date(),
                success: true
              }))
              
              store.setBrowserActions(prev => [...prev, ...newActions])
            }
            // Handle computer_use thinking
            else if (event.type === 'computer_thinking') {
              console.log('Computer thinking:', event.thought)
              
              // Add thinking to timeline
              store.setBrowserActions(prev => [...prev, {
                id: `thinking-${Date.now()}`,
                type: 'thinking',
                description: 'Analyzing next action...',
                details: event.thought,
                timestamp: new Date(),
                success: true
              }])
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
              if (store.pendingOrchestrationTools.length > 0) {
                console.log(`🎯 Executing ${store.pendingOrchestrationTools.length} orchestration tools`)
                for (const tool of store.pendingOrchestrationTools) {
                  await executeOrchestrationTool(tool)
                }
                store.setPendingOrchestrationTools([])
              }
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
  }, [store])

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
    // Export helper functions that components might need
    addAgentActivity,
    updateAgentActivity,
    mapToolNameToActivityType,
    getAgentNameFromTool,
  }
}
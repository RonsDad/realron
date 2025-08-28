/**
 * Tool Execution Hook
 * Extracted from useMessageHandler.ts to separate tool execution logic
 * 
 * Handles all tool-related functionality including:
 * - Tool execution and orchestration
 * - Tool output management
 * - Tool status tracking
 * - Tool result processing and formatting
 */

import { useCallback } from 'react'
import { useRonAIStore } from '@/providers/ron-ai-store-provider'
import type { 
  ToolOutputData, 
  BrowserAction,
  PendingOrchestrationTool
} from '@/store/types'
import { useAgentOrchestration } from './useAgentOrchestration'

export interface ToolExecutionHook {
  executeTools: (tools: PendingOrchestrationTool[]) => Promise<void>
  toolResults: ToolOutputData[]
  isExecuting: boolean
  toolErrors: string[]
  handleToolMessage: (event: any, params: ToolMessageParams) => void
  clearToolOutputs: () => void
  addToolOutput: (output: Omit<ToolOutputData, 'id' | 'timestamp'>) => void
  addClaudeCodeOutput: (output: any) => void
}

export interface ToolMessageParams {
  fullContent: string
  setFullContent: (content: string) => void
  agentState?: any
  startAgent?: (task: string, url?: string) => void
  updateUrl?: (url: string) => void
}

export const useToolExecution = (): ToolExecutionHook => {
  const store = useRonAIStore((state) => state)
  
  // Use agent orchestration hook for all agent-related functionality
  const {
    isOrchestrationTool,
    getAgentNameFromTool,
    mapToolNameToActivityType,
    addAgentActivity,
    updateAgentActivity,
    addPendingOrchestrationTool,
    startAgentOrchestration,
    addOrchestrationActivity
  } = useAgentOrchestration()

  // Execute tools - delegated to agent orchestration hook
  const executeTools = useCallback(async (tools: PendingOrchestrationTool[]) => {
    // This functionality is now handled by the agent orchestration hook
    // We just need to maintain the interface for backward compatibility
    console.log('executeTools called but functionality moved to useAgentOrchestration')
  }, [])

  // Handle tool messages from SSE stream - EXACT logic from useMessageHandler
  const handleToolMessage = useCallback((event: any, params: ToolMessageParams) => {
    const { fullContent, setFullContent, agentState, startAgent, updateUrl } = params
    let content = fullContent

    // Handle tool use start (both client and server tools) - WITH VISIBILITY
    if (event.type === 'content_block_start' && 
        (event.content_block?.type === 'tool_use' || event.content_block?.type === 'server_tool_use')) {
      const toolName = event.content_block.name
      const isCodeExecution = toolName === 'code_execution'
      
      // LOG FOR VISIBILITY
      console.log(`🚀 Tool started: ${toolName}`, event.content_block)
      
      // Check if it's an orchestration tool that needs execution
      if (isOrchestrationTool(toolName)) {
        console.log('🎯 Orchestration tool detected:', toolName)
        // Store for execution after message completes
        addPendingOrchestrationTool({
          id: event.content_block.id,
          name: toolName,
          input: {} // Will be filled by input deltas
        })
      }
      
      // Activate agent orchestration and track activity
      const agentName = isCodeExecution ? 'Code Executor' : getAgentNameFromTool(toolName)
      startAgentOrchestration(agentName)
      
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
      if (!content.includes(toolName)) {
        content += `\n\n🔧 **Using tool:** ${toolName}\n`
        setFullContent(content)
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
        content += codeOutput
        setFullContent(content)
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
        return
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
          
          const newActions: BrowserAction[] = []
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
      
      content += formattedResult
      setFullContent(content)
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
      
      content += `\n\n❌ Tool error: ${event.error}`
      setFullContent(content)
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
  }, [
    store, 
    isOrchestrationTool, 
    getAgentNameFromTool, 
    addAgentActivity, 
    updateAgentActivity, 
    mapToolNameToActivityType,
    addPendingOrchestrationTool,
    startAgentOrchestration
  ])

  // Add tool output helper
  const addToolOutput = useCallback((output: Omit<ToolOutputData, 'id' | 'timestamp'>) => {
    const toolOutput: ToolOutputData = {
      ...output,
      id: `tool-${Date.now()}-${Math.random()}`,
      timestamp: new Date()
    }
    store.setToolOutputs(prev => [...prev, toolOutput])
  }, [store])

  // Add Claude Code output helper
  const addClaudeCodeOutput = useCallback((output: any) => {
    store.setClaudeCodeOutputs(prev => [...prev, output])
  }, [store])

  // Clear tool outputs
  const clearToolOutputs = useCallback(() => {
    store.setToolOutputs([])
  }, [store])

  return {
    executeTools,
    toolResults: store.toolOutputs,
    isExecuting: store.isProcessing, // Using existing processing state
    toolErrors: store.toolOutputs.filter(t => t.status === 'error').map(t => String(t.content)),
    handleToolMessage,
    clearToolOutputs,
    addToolOutput,
    addClaudeCodeOutput
  }
}
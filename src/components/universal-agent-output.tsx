"use client"

import { Bot, ChevronDown, ChevronRight, Search, Brain, FileText, Globe, Clock, Code, Terminal, Package, MessageSquare, FileCode, Wrench } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism"

interface AgentOutput {
  id: string
  type: "reasoning" | "web_search_call" | "function_call" | "file_search_call" | "code_file" | "text" | "mcp_call" | "tool_call"
  summary?: Array<{ type: string; text: string }>
  status?: string
  action?: { type: string; query?: string }
  arguments?: string
  name?: string
  call_id?: string
  content?: string
  fileName?: string
  language?: string
  code?: string
  message?: string
}

interface UniversalAgentOutputProps {
  agentType: string
  response: any
  timestamp?: Date
  className?: string
}

function TimelineIcon({ type }: { type: string }) {
  switch (type) {
    case "reasoning":
      return <Brain className="w-4 h-4" />
    case "web_search_call":
      return <Globe className="w-4 h-4" />
    case "function_call":
    case "tool_call":
      return <Wrench className="w-4 h-4" />
    case "file_search_call":
      return <Search className="w-4 h-4" />
    case "code_file":
      return <FileCode className="w-4 h-4" />
    case "text":
      return <MessageSquare className="w-4 h-4" />
    case "mcp_call":
      return <Package className="w-4 h-4" />
    default:
      return <Clock className="w-4 h-4" />
  }
}

function getTypeLabel(type: string): string {
  switch (type) {
    case "reasoning":
      return "Chain of Thought"
    case "web_search_call":
      return "Web Search"
    case "function_call":
      return "Function Call"
    case "tool_call":
      return "Tool Call"
    case "file_search_call":
      return "File Search"
    case "code_file":
      return "Code File"
    case "text":
      return "Response"
    case "mcp_call":
      return "MCP Server"
    default:
      return "Action"
  }
}

function getTypeColor(type: string): string {
  switch (type) {
    case "reasoning":
      return "bg-purple-500/10 border-purple-500/20 text-purple-700 dark:text-purple-300"
    case "web_search_call":
      return "bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-300"
    case "function_call":
    case "tool_call":
      return "bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-300"
    case "file_search_call":
      return "bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-300"
    case "code_file":
      return "bg-indigo-500/10 border-indigo-500/20 text-indigo-700 dark:text-indigo-300"
    case "text":
      return "bg-slate-500/10 border-slate-500/20 text-slate-700 dark:text-slate-300"
    case "mcp_call":
      return "bg-cyan-500/10 border-cyan-500/20 text-cyan-700 dark:text-cyan-300"
    default:
      return "bg-gray-500/10 border-gray-500/20 text-gray-700 dark:text-gray-300"
  }
}

function CodeFileAccordion({ item }: { item: AgentOutput }) {
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-between p-3 hover:bg-indigo-50 dark:hover:bg-indigo-950/30",
            "border border-indigo-200 dark:border-indigo-800 rounded-lg",
            isOpen && "bg-indigo-50 dark:bg-indigo-950/30"
          )}
        >
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="font-mono text-sm">{item.fileName || 'untitled'}</span>
            {item.language && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">
                {item.language}
              </span>
            )}
          </div>
          {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2">
        <div className="rounded-lg border border-border/50 overflow-hidden">
          <SyntaxHighlighter
            style={oneDark as any}
            language={item.language || "plaintext"}
            PreTag="div"
            className="!mt-0 !mb-0 !text-xs"
            showLineNumbers={true}
          >
            {item.code || item.content || ""}
          </SyntaxHighlighter>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

function TimelineItem({ item, isLast }: { item: AgentOutput; isLast: boolean }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="flex gap-3">
      {/* Timeline line and icon */}
      <div className="flex flex-col items-center">
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center border-2",
          getTypeColor(item.type),
          "bg-opacity-20"
        )}>
          <TimelineIcon type={item.type} />
        </div>
        {!isLast && (
          <div className="w-0.5 flex-1 bg-border/50 mt-2" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 pb-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={cn(
                "text-xs font-medium px-2 py-0.5 rounded-full",
                getTypeColor(item.type)
              )}>
                {getTypeLabel(item.type)}
              </span>
              {item.status && (
                <span className="text-xs text-muted-foreground">
                  {item.status}
                </span>
              )}
              {item.name && (
                <span className="text-xs font-mono text-muted-foreground">
                  {item.name}
                </span>
              )}
            </div>

            {/* Main content based on type */}
            {item.type === "reasoning" && item.summary && item.summary.length > 0 && (
              <div className="mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpanded(!expanded)}
                  className="h-auto p-0 font-normal justify-start hover:bg-transparent"
                >
                  {expanded ? <ChevronDown className="w-3 h-3 mr-1" /> : <ChevronRight className="w-3 h-3 mr-1" />}
                  <span className="text-sm text-foreground">
                    View chain of thought ({item.summary.length} {item.summary.length === 1 ? 'step' : 'steps'})
                  </span>
                </Button>
                {expanded && (
                  <div className="mt-2 pl-4 space-y-2 border-l-2 border-purple-200 dark:border-purple-800">
                    {item.summary.map((summary, idx) => (
                      <div key={idx} className="text-sm text-muted-foreground">
                        <div className="font-medium text-foreground mb-1">
                          {summary.text.split('\n')[0].replace(/\*\*/g, '')}
                        </div>
                        <div className="pl-2 opacity-90">
                          {summary.text.split('\n').slice(1).join('\n')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {item.type === "web_search_call" && item.action && (
              <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950/30 rounded-md">
                <p className="text-sm font-mono text-blue-700 dark:text-blue-300">
                  {item.action.query}
                </p>
              </div>
            )}

            {(item.type === "function_call" || item.type === "tool_call") && (
              <div className="mt-2 p-2 bg-green-50 dark:bg-green-950/30 rounded-md">
                <p className="text-sm font-medium text-green-700 dark:text-green-300">
                  {item.name}
                </p>
                {item.arguments && (
                  <pre className="text-xs mt-1 text-green-600 dark:text-green-400 overflow-x-auto">
                    {typeof item.arguments === 'string' ? item.arguments : JSON.stringify(item.arguments, null, 2)}
                  </pre>
                )}
              </div>
            )}

            {item.type === "mcp_call" && (
              <div className="mt-2 p-2 bg-cyan-50 dark:bg-cyan-950/30 rounded-md">
                <p className="text-sm font-medium text-cyan-700 dark:text-cyan-300">
                  MCP: {item.name}
                </p>
                {item.arguments && (
                  <pre className="text-xs mt-1 text-cyan-600 dark:text-cyan-400 overflow-x-auto">
                    {typeof item.arguments === 'string' ? item.arguments : JSON.stringify(item.arguments, null, 2)}
                  </pre>
                )}
              </div>
            )}

            {item.type === "file_search_call" && (
              <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-950/30 rounded-md">
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Searching: {item.action?.query || "vector store..."}
                </p>
              </div>
            )}

            {item.type === "code_file" && (
              <div className="mt-2">
                <CodeFileAccordion item={item} />
              </div>
            )}

            {item.type === "text" && item.content && (
              <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-950/30 rounded-md">
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {item.content}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function parseAgentOutput(response: any, agentType: string): AgentOutput[] {
  const outputs: AgentOutput[] = []
  
  // Handle Clinical Ops style response
  if (response.output && Array.isArray(response.output)) {
    response.output.forEach((item: any) => {
      // Skip empty reasoning blocks
      if (item.type === "reasoning" && (!item.summary || item.summary.length === 0)) {
        return
      }
      outputs.push(item)
    })
    return outputs
  }
  
  // Handle Claude Code SDK response
  if (response.files_created && Array.isArray(response.files_created)) {
    // Add reasoning if present
    if (response.reasoning) {
      outputs.push({
        id: `reasoning-${Date.now()}`,
        type: "reasoning",
        summary: [{ type: "summary_text", text: response.reasoning }]
      })
    }
    
    // Add tool/MCP calls if present
    if (response.tools_used && Array.isArray(response.tools_used)) {
      response.tools_used.forEach((tool: any, idx: number) => {
        outputs.push({
          id: `tool-${idx}`,
          type: tool.type === 'mcp' ? "mcp_call" : "tool_call",
          name: tool.name,
          arguments: tool.arguments,
          status: "completed"
        })
      })
    }
    
    // Add code files
    response.files_created.forEach((file: any, idx: number) => {
      outputs.push({
        id: `file-${idx}`,
        type: "code_file",
        fileName: file.path || file.name,
        language: file.language || detectLanguage(file.path || file.name),
        code: file.content
      })
    })
    
    // Add result message if present
    if (response.result) {
      outputs.push({
        id: `text-${Date.now()}`,
        type: "text",
        content: response.result
      })
    }
    
    return outputs
  }
  
  // Handle generic agent response
  if (response.reasoning) {
    outputs.push({
      id: `reasoning-${Date.now()}`,
      type: "reasoning",
      summary: [{ type: "summary_text", text: response.reasoning }]
    })
  }
  
  if (response.actions && Array.isArray(response.actions)) {
    response.actions.forEach((action: any, idx: number) => {
      if (action.type === 'web_search') {
        outputs.push({
          id: `action-${idx}`,
          type: "web_search_call",
          action: { type: "search", query: action.query },
          status: action.status || "completed"
        })
      } else if (action.type === 'tool_call' || action.type === 'function_call') {
        outputs.push({
          id: `action-${idx}`,
          type: action.type,
          name: action.name,
          arguments: action.arguments,
          status: action.status || "completed"
        })
      }
    })
  }
  
  if (response.message || response.content || response.result) {
    outputs.push({
      id: `text-${Date.now()}`,
      type: "text",
      content: response.message || response.content || response.result
    })
  }
  
  // If no structured output, treat as text
  if (outputs.length === 0 && response) {
    outputs.push({
      id: `text-${Date.now()}`,
      type: "text",
      content: typeof response === 'string' ? response : JSON.stringify(response, null, 2)
    })
  }
  
  return outputs
}

function detectLanguage(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase()
  const langMap: Record<string, string> = {
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'py': 'python',
    'html': 'html',
    'css': 'css',
    'json': 'json',
    'md': 'markdown',
    'yml': 'yaml',
    'yaml': 'yaml',
    'sh': 'bash',
    'sql': 'sql',
    'rs': 'rust',
    'go': 'go',
    'java': 'java',
    'cpp': 'cpp',
    'c': 'c',
    'cs': 'csharp',
    'php': 'php',
    'rb': 'ruby',
    'swift': 'swift',
    'kt': 'kotlin'
  }
  return langMap[ext || ''] || 'plaintext'
}

function getAgentColor(agentType: string): string {
  const colorMap: Record<string, string> = {
    'clinical_ops': 'from-purple-600 to-purple-700',
    'claude_code': 'from-indigo-600 to-indigo-700',
    'research': 'from-blue-600 to-blue-700',
    'provider_search': 'from-green-600 to-green-700',
    'medication': 'from-amber-600 to-amber-700',
    'insurance': 'from-red-600 to-red-700',
    'appointment': 'from-teal-600 to-teal-700',
    'default': 'from-slate-600 to-slate-700'
  }
  return colorMap[agentType] || colorMap.default
}

function getAgentName(agentType: string): string {
  const nameMap: Record<string, string> = {
    'clinical_ops': 'Clinical Ops Agent',
    'claude_code': 'Claude Code SDK',
    'research': 'Research Agent',
    'provider_search': 'Provider Search Agent',
    'medication': 'Medication Agent',
    'insurance': 'Insurance Navigator',
    'appointment': 'Appointment Scheduler',
    'default': 'AI Agent'
  }
  return nameMap[agentType] || nameMap.default
}

export function UniversalAgentOutput({ 
  agentType,
  response, 
  timestamp, 
  className 
}: UniversalAgentOutputProps) {
  const [showFullTimeline, setShowFullTimeline] = useState(false)
  
  const timelineItems = parseAgentOutput(response, agentType)
  const displayItems = showFullTimeline ? timelineItems : timelineItems.slice(0, 3)
  const hasMore = timelineItems.length > 3

  return (
    <div className={cn("flex gap-4 group", className)}>
      {/* Avatar */}
      <div className="flex-shrink-0">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center shadow-md transition-transform group-hover:scale-105",
          "bg-gradient-to-br",
          getAgentColor(agentType)
        )}>
          <Bot className="w-5 h-5 text-white" />
        </div>
      </div>
      
      {/* Message Content */}
      <div className="flex-1 max-w-[85%] md:max-w-[75%]">
        {/* Name and timestamp */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-foreground">
            {getAgentName(agentType)}
          </span>
          {timestamp && (
            <span className="text-xs text-muted-foreground">
              {timestamp.toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </span>
          )}
          {response.model && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
              {response.model}
            </span>
          )}
        </div>
        
        {/* Message Card with Timeline */}
        <Card className="px-4 py-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/70 dark:to-slate-800/50 border-slate-200 dark:border-slate-700 shadow-md hover:shadow-lg">
          <ScrollArea className="max-h-[600px] pr-2">
            <div className="space-y-0">
              {displayItems.map((item, index) => (
                <TimelineItem 
                  key={item.id} 
                  item={item} 
                  isLast={index === displayItems.length - 1 && !hasMore}
                />
              ))}
            </div>

            {hasMore && (
              <div className="mt-4 flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFullTimeline(!showFullTimeline)}
                  className="text-xs"
                >
                  {showFullTimeline ? (
                    <>Show Less</>
                  ) : (
                    <>Show {timelineItems.length - 3} More Items</>
                  )}
                </Button>
              </div>
            )}

            {/* Token Usage */}
            {response.usage && (
              <div className="mt-4 pt-4 border-t border-border/50">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Input: {response.usage.input_tokens?.toLocaleString() || 0} tokens</span>
                  <span>Output: {response.usage.output_tokens?.toLocaleString() || 0} tokens</span>
                  <span>Total: {response.usage.total_tokens?.toLocaleString() || 0} tokens</span>
                </div>
              </div>
            )}
          </ScrollArea>
        </Card>
      </div>
    </div>
  )
}
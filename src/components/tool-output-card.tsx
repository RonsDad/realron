"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { 
  ChevronDown, 
  ChevronRight, 
  Copy, 
  Check,
  Terminal,
  Globe,
  Database,
  Search,
  FileText,
  Bot,
  Activity,
  Code,
  Cpu,
  Network,
  Shield,
  Briefcase,
  Phone,
  MessageSquare,
  Users,
  Wifi
} from "lucide-react"
import { cn } from "@/lib/utils"
import { EmbeddedMiniApp } from "@/components/embedded-mini-app"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism"

interface ToolOutputCardProps {
  toolName: string
  content: any
  timestamp?: Date
  status?: "pending" | "executing" | "completed" | "error"
  className?: string
}

// Professional tool configurations with unique icons and colors
const getToolConfiguration = (toolName: string) => {
  const configs: Record<string, any> = {
    // Browser and Web Tools
    browser_use: {
      icon: Globe,
      label: "Browser Automation",
      color: "bg-blue-500",
      borderColor: "border-blue-200 dark:border-blue-800",
      bgColor: "bg-blue-50 dark:bg-blue-950/30"
    },
    web_search: {
      icon: Search,
      label: "Web Search",
      color: "bg-indigo-500",
      borderColor: "border-indigo-200 dark:border-indigo-800",
      bgColor: "bg-indigo-50 dark:bg-indigo-950/30"
    },
    
    // Computer Control
    computer_use: {
      icon: Cpu,
      label: "Computer Control",
      color: "bg-purple-500",
      borderColor: "border-purple-200 dark:border-purple-800",
      bgColor: "bg-purple-50 dark:bg-purple-950/30"
    },
    
    // Development Tools
    text_editor: {
      icon: FileText,
      label: "Text Editor",
      color: "bg-green-500",
      borderColor: "border-green-200 dark:border-green-800",
      bgColor: "bg-green-50 dark:bg-green-950/30"
    },
    bash: {
      icon: Terminal,
      label: "Command Line",
      color: "bg-gray-600",
      borderColor: "border-gray-200 dark:border-gray-800",
      bgColor: "bg-gray-50 dark:bg-gray-950/30"
    },
    execute_code: {
      icon: Code,
      label: "Code Execution",
      color: "bg-yellow-600",
      borderColor: "border-yellow-200 dark:border-yellow-800",
      bgColor: "bg-yellow-50 dark:bg-yellow-950/30"
    },
    
    // AI & Research Tools
    perplexity_deep_research: {
      icon: Bot,
      label: "Deep Research AI",
      color: "bg-cyan-500",
      borderColor: "border-cyan-200 dark:border-cyan-800",
      bgColor: "bg-cyan-50 dark:bg-cyan-950/30"
    },
    perplexity_reasoning_pro: {
      icon: Network,
      label: "Advanced Reasoning",
      color: "bg-teal-500",
      borderColor: "border-teal-200 dark:border-teal-800",
      bgColor: "bg-teal-50 dark:bg-teal-950/30"
    },
    perplexity_sonar_pro: {
      icon: Activity,
      label: "Sonar Pro Search",
      color: "bg-emerald-500",
      borderColor: "border-emerald-200 dark:border-emerald-800",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/30"
    },
    
    // Medical & Healthcare Tools
    clinical_operations: {
      icon: Shield,
      label: "Clinical Operations",
      color: "bg-red-500",
      borderColor: "border-red-200 dark:border-red-800",
      bgColor: "bg-red-50 dark:bg-red-950/30"
    },
    pubmed_search: {
      icon: Database,
      label: "PubMed Database",
      color: "bg-blue-600",
      borderColor: "border-blue-200 dark:border-blue-800",
      bgColor: "bg-blue-50 dark:bg-blue-950/30"
    },
    searchDrugLabel: {
      icon: FileText,
      label: "FDA Drug Database",
      color: "bg-orange-500",
      borderColor: "border-orange-200 dark:border-orange-800",
      bgColor: "bg-orange-50 dark:bg-orange-950/30"
    },
    
    // Telnyx Communication Tools
    send_message: {
      icon: MessageSquare,
      label: "Telnyx Messaging",
      color: "bg-violet-500",
      borderColor: "border-violet-200 dark:border-violet-800",
      bgColor: "bg-violet-50 dark:bg-violet-950/30"
    },
    list_phone_numbers: {
      icon: Phone,
      label: "Phone Numbers",
      color: "bg-pink-500",
      borderColor: "border-pink-200 dark:border-pink-800",
      bgColor: "bg-pink-50 dark:bg-pink-950/30"
    },
    manage_connections: {
      icon: Wifi,
      label: "Network Connections",
      color: "bg-rose-500",
      borderColor: "border-rose-200 dark:border-rose-800",
      bgColor: "bg-rose-50 dark:bg-rose-950/30"
    },
    manage_assistants: {
      icon: Users,
      label: "AI Assistants",
      color: "bg-amber-500",
      borderColor: "border-amber-200 dark:border-amber-800",
      bgColor: "bg-amber-50 dark:bg-amber-950/30"
    }
  }
  
  // Match partial tool names for FDA tools
  if (toolName.startsWith('get') || toolName.startsWith('search')) {
    return configs.searchDrugLabel
  }
  
  // Match partial tool names for PubMed tools
  if (toolName.startsWith('pubmed_')) {
    return configs.pubmed_search
  }
  
  // Match partial tool names for Perplexity tools
  if (toolName.startsWith('perplexity_')) {
    const perplexityType = toolName.replace('perplexity_', '')
    if (perplexityType.includes('deep')) return configs.perplexity_deep_research
    if (perplexityType.includes('reasoning')) return configs.perplexity_reasoning_pro
    if (perplexityType.includes('sonar')) return configs.perplexity_sonar_pro
  }
  
  // Return specific config or default
  return configs[toolName] || {
    icon: Briefcase,
    label: toolName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    color: "bg-slate-500",
    borderColor: "border-slate-200 dark:border-slate-800",
    bgColor: "bg-slate-50 dark:bg-slate-950/30"
  }
}

export function ToolOutputCard({ 
  toolName, 
  content, 
  timestamp, 
  status = "completed",
  className 
}: ToolOutputCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [copied, setCopied] = useState(false)
  
  const config = getToolConfiguration(toolName)
  const Icon = config.icon
  
  // Format content based on type
  const formatContent = () => {
    // If content includes a live_url, render embedded mini-app
    if (content && typeof content === 'object' && 'live_url' in content && content.live_url) {
      return <EmbeddedMiniApp liveUrl={(content as any).live_url} />
    }
    if (typeof content === 'string') {
      return content
    } else if (typeof content === 'object') {
      return JSON.stringify(content, null, 2)
    }
    return String(content)
  }
  
  const formattedContent = formatContent()
  const isLongContent = formattedContent.length > 500
  
  const handleCopy = async () => {
    await navigator.clipboard.writeText(formattedContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  // Status indicators
  const statusConfig = {
    pending: { text: "Queued", color: "text-gray-500" },
    executing: { text: "Running", color: "text-blue-500", pulse: true },
    completed: { text: "Complete", color: "text-green-500" },
    error: { text: "Failed", color: "text-red-500" }
  }
  
  const currentStatus = statusConfig[status]
  
  return (
    <Card className={cn(
      "overflow-hidden transition-all duration-300",
      config.borderColor,
      config.bgColor,
      "backdrop-blur-sm",
      className
    )}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center shadow-sm",
              config.color
            )}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">{config.label}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={cn(
                  "text-xs font-medium",
                  currentStatus.color
                )}>
                  {currentStatus.pulse && (
                    <span className="inline-flex w-2 h-2 rounded-full bg-blue-500 animate-pulse mr-1" />
                  )}
                  {currentStatus.text}
                </span>
                {timestamp && (
                  <>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">
                      {timestamp.toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-8 w-8 p-0"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
            {isLongContent && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-8 w-8 p-0"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4">
        <Collapsible open={isExpanded || !isLongContent}>
          <CollapsibleContent>
            <ScrollArea className={cn(
              "w-full",
              isExpanded ? "max-h-96" : "max-h-40"
            )}>
              <div className="prose prose-sm max-w-none dark:prose-invert">
                {toolName === "execute_code" || toolName === "bash" ? (
                  <SyntaxHighlighter
                    style={oneDark as any}
                    language="bash"
                    className="!mt-0 !mb-0 !text-xs rounded-md"
                  >
                    {formattedContent}
                  </SyntaxHighlighter>
                ) : (
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code({ node, inline, className, children, ...props }: any) {
                        const match = /language-(\w+)/.exec(className || "")
                        return !inline && match ? (
                          <SyntaxHighlighter
                            style={oneDark as any}
                            language={match[1]}
                            PreTag="div"
                            className="!mt-0 !mb-0 !text-xs rounded-md"
                            {...props}
                          >
                            {String(children).replace(/\n$/, "")}
                          </SyntaxHighlighter>
                        ) : (
                          <code className="px-1 py-0.5 rounded text-xs bg-muted" {...props}>
                            {children}
                          </code>
                        )
                      }
                    }}
                  >
                    {formattedContent}
                  </ReactMarkdown>
                )}
              </div>
            </ScrollArea>
          </CollapsibleContent>
        </Collapsible>
        
        {isLongContent && !isExpanded && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(true)}
            className="mt-2 text-xs h-7"
          >
            Show more
          </Button>
        )}
      </div>
    </Card>
  )
}
"use client"

import { Bot, User, Sparkles, Eye, Download } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import React, { useState, useEffect, useRef } from "react"
import { emitTimelineEvent } from "@/components/migration/timeline-adapter"

// Enhanced component for code blocks with preview and download for multiple languages
function EnhancedCodeBlock({ children, language }: { children: any; language: string }) {
  const [showPreview, setShowPreview] = useState(false)
  
  const [previewError, setPreviewError] = useState<string | null>(null)
  
  // Determine file extension and MIME type based on language
  const getFileInfo = (lang: string) => {
    const langMap: Record<string, { ext: string; mime: string }> = {
      html: { ext: 'html', mime: 'text/html' },
      javascript: { ext: 'js', mime: 'text/javascript' },
      jsx: { ext: 'jsx', mime: 'text/javascript' },
      typescript: { ext: 'ts', mime: 'text/typescript' },
      tsx: { ext: 'tsx', mime: 'text/typescript' },
      python: { ext: 'py', mime: 'text/x-python' },
      react: { ext: 'jsx', mime: 'text/javascript' },
      py: { ext: 'py', mime: 'text/x-python' },
      js: { ext: 'js', mime: 'text/javascript' },
      ts: { ext: 'ts', mime: 'text/typescript' },
    }
    return langMap[lang.toLowerCase()] || { ext: 'txt', mime: 'text/plain' }
  }
  
  const handleDownload = () => {
    const codeContent = String(children).replace(/\n$/, "")
    const fileInfo = getFileInfo(language)
    const blob = new Blob([codeContent], { type: fileInfo.mime })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `code-output.${getFileInfo(language).ext}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
  
  // Check if language supports preview
  const supportsPreview = ['html', 'jsx', 'tsx', 'react', 'javascript', 'js'].includes(language.toLowerCase())
  
  // Create preview content based on language
  const createPreviewContent = () => {
    const codeContent = String(children).replace(/\n$/, "")
    const lang = language.toLowerCase()
    
    if (lang === 'html') {
      return codeContent
    } else if (['jsx', 'tsx', 'react', 'javascript', 'js'].includes(lang)) {
      // For React/JSX, wrap in a basic HTML template with React CDN
      return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>React Preview</title>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      padding: 20px;
      margin: 0;
    }
    #root {
      width: 100%;
      height: 100%;
    }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    ${codeContent.includes('export default') ? codeContent.replace(/export default/g, 'const App =') : codeContent}
    
    // If there's an App component, render it
    if (typeof App !== 'undefined') {
      ReactDOM.render(<App />, document.getElementById('root'));
    } else {
      // Try to render any defined component
      const components = Object.keys(window).filter(key =>
        typeof window[key] === 'function' &&
        key[0] === key[0].toUpperCase() &&
        key !== 'React' &&
        key !== 'ReactDOM'
      );
      if (components.length > 0) {
        const Component = window[components[0]];
        ReactDOM.render(<Component />, document.getElementById('root'));
      }
    }
  </script>
</body>
</html>
      `
    }
    return ''
  }
  
  const handlePreviewToggle = () => {
    if (!showPreview && supportsPreview) {
      setPreviewError(null)
      try {
        createPreviewContent()
      } catch (err) {
        setPreviewError('Error creating preview')
      }
    }
    setShowPreview(!showPreview)
  }
  
  return (
    <div className="my-3 overflow-hidden rounded-lg border border-border/50">
      <div className="flex items-center justify-between px-3 py-2 bg-muted/50 border-b border-border/50">
        <span className="text-xs font-medium text-muted-foreground">
          {language}
        </span>
        <div className="flex gap-2">
          {supportsPreview && (
            <Button
              size="sm"
              variant="outline"
              onClick={handlePreviewToggle}
              className="h-6 px-2 text-xs"
            >
              <Eye className="w-3 h-3 mr-1" />
              {showPreview ? 'Hide' : 'Preview'}
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={handleDownload}
            className="h-6 px-2 text-xs"
          >
            <Download className="w-3 h-3 mr-1" />
            Download
          </Button>
        </div>
      </div>
      <SyntaxHighlighter
        style={oneDark as any}
        language={language}
        PreTag="div"
        className="!mt-0 !mb-0 !text-xs !bg-transparent"
        showLineNumbers={true}
      >
        {String(children).replace(/\n$/, "")}
      </SyntaxHighlighter>
      {showPreview && supportsPreview && (
        <div className="border-t border-border/50">
          <div className="px-3 py-2 bg-muted/30">
            <span className="text-xs font-medium text-muted-foreground">
              Preview {language.toLowerCase() === 'python' ? '(Python execution not available in browser)' : ''}
            </span>
          </div>
          <div className="p-4 bg-white">
            {previewError ? (
              <div className="text-red-500 text-sm">{previewError}</div>
            ) : (
              <iframe
                srcDoc={createPreviewContent()}
                className="w-full min-h-[300px] border-0"
                sandbox="allow-scripts allow-same-origin"
                title={`${language} Preview`}
                onError={() => setPreviewError('Preview failed to load')}
              />
            )}
          </div>
        </div>
      )}
      {language.toLowerCase() === 'python' && showPreview && (
        <div className="border-t border-border/50 p-4 bg-yellow-50 dark:bg-yellow-900/20">
          <p className="text-xs text-yellow-800 dark:text-yellow-200">
            ⚠️ Python code preview requires a backend runtime. Download the file to run it locally with Python installed.
          </p>
        </div>
      )}
    </div>
  )
}

interface MessageCardProps {
  role: "user" | "assistant"
  content: string
  timestamp?: Date
  isStreaming?: boolean
  className?: string
  agentId?: string
  agentType?: string
}

import { ScrollArea } from "@/components/ui/scroll-area"
import { Brain, Wrench, FileCode, MessageSquare, Package } from "lucide-react"

// Helper function to detect content type
function detectContentType(text: string): Array<{type: string; content: string}> {
  const sections: Array<{type: string; content: string}> = []
  const lines = text.split('\n')
  let currentSection = { type: 'text', content: '' }
  let inCodeBlock = false
  
  for (const line of lines) {
    // Check for CoT markers
    if (line.includes('**Reasoning**') || line.includes('**Thinking**') || line.includes('**Analysis**')) {
      if (currentSection.content) {
        sections.push(currentSection)
      }
      currentSection = { type: 'reasoning', content: line + '\n' }
    }
    // Check for tool/function calls
    else if (line.includes('**Tool:') || line.includes('**Function:') || line.includes('✅') || line.includes('🔧')) {
      if (currentSection.content) {
        sections.push(currentSection)
      }
      currentSection = { type: 'tool', content: line + '\n' }
    }
    // Check for MCP calls
    else if (line.includes('**MCP:') || line.includes('mcp__')) {
      if (currentSection.content) {
        sections.push(currentSection)
      }
      currentSection = { type: 'mcp', content: line + '\n' }
    }
    // Check for code blocks
    else if (line.startsWith('```')) {
      if (!inCodeBlock) {
        if (currentSection.content) {
          sections.push(currentSection)
        }
        inCodeBlock = true
        currentSection = { type: 'code', content: line + '\n' }
      } else {
        currentSection.content += line + '\n'
        sections.push(currentSection)
        currentSection = { type: 'text', content: '' }
        inCodeBlock = false
      }
    }
    else {
      currentSection.content += line + '\n'
    }
  }
  
  if (currentSection.content) {
    sections.push(currentSection)
  }
  
  return sections.length > 0 ? sections : [{ type: 'text', content: text }]
}

function TimelineIcon({ type }: { type: string }) {
  switch (type) {
    case 'reasoning':
      return <Brain className="w-4 h-4" />
    case 'tool':
      return <Wrench className="w-4 h-4" />
    case 'mcp':
      return <Package className="w-4 h-4" />
    case 'code':
      return <FileCode className="w-4 h-4" />
    default:
      return <MessageSquare className="w-4 h-4" />
  }
}

function getTypeColor(type: string): string {
  switch (type) {
    case 'reasoning':
      return "bg-purple-500/10 border-purple-500/20 text-purple-700 dark:text-purple-300"
    case 'tool':
      return "bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-300"
    case 'mcp':
      return "bg-cyan-500/10 border-cyan-500/20 text-cyan-700 dark:text-cyan-300"
    case 'code':
      return "bg-indigo-500/10 border-indigo-500/20 text-indigo-700 dark:text-indigo-300"
    default:
      return "bg-slate-500/10 border-slate-500/20 text-slate-700 dark:text-slate-300"
  }
}

function TimelineSection({ section, isLast }: { section: {type: string; content: string}, isLast: boolean }) {
  
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center border-2", getTypeColor(section.type))}>
          <TimelineIcon type={section.type} />
        </div>
        {!isLast && <div className="w-0.5 flex-1 bg-border/50 mt-2" />}
      </div>
      <div className="flex-1 pb-4">
        <div className={cn("text-xs font-medium px-2 py-0.5 rounded-full inline-block mb-2", getTypeColor(section.type))}>
          {section.type === 'reasoning' ? 'Chain of Thought' :
           section.type === 'tool' ? 'Tool Call' :
           section.type === 'mcp' ? 'MCP Server' :
           section.type === 'code' ? 'Code' : 'Response'}
        </div>
        <div className={cn("p-3 rounded-md", section.type === 'code' ? "bg-slate-900 dark:bg-slate-950" : "bg-slate-50 dark:bg-slate-900/50")}>
          {section.type === 'code' ? (
            <pre className="text-xs overflow-x-auto">
              <code className="text-slate-300">{section.content}</code>
            </pre>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {section.content}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export const MessageCard = React.memo(function MessageCard({ 
  role, 
  content, 
  timestamp, 
  isStreaming = false,
  className,
  agentId,
  agentType 
}: MessageCardProps) {
  const isUser = role === "user"
  const sections = !isUser ? detectContentType(content) : [{ type: 'text', content }]
  const hasTimeline = !isUser && sections.length > 1
  const hasEmitted = useRef(false)
  const previousContent = useRef<string>('')
  
  // Emit timeline event when message changes
  useEffect(() => {
    if (content && content !== previousContent.current && !isStreaming) {
      emitTimelineEvent('message-display', {
        role,
        content,
        metadata: {
          timestamp,
          agentId: agentId || (isUser ? 'user' : 'claude-code'),
          agentType: agentType || (isUser ? 'custom' : 'claude_code')
        }
      })
      previousContent.current = content
      hasEmitted.current = true
    }
  }, [content, role, isStreaming, timestamp, agentId, agentType, isUser])
  
  return (
    <div className={cn(
      "flex gap-4 group",
      isUser && "flex-row-reverse",
      className
    )}>
      {/* Avatar */}
      <div className="flex-shrink-0">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center shadow-md transition-transform group-hover:scale-105",
          isUser 
            ? "bg-gradient-to-br from-primary to-primary/80" 
            : "bg-gradient-to-br from-slate-700 to-slate-800 dark:from-slate-200 dark:to-slate-300"
        )}>
          {isUser ? (
            <User className="w-5 h-5 text-primary-foreground" />
          ) : (
            <Bot className="w-5 h-5 text-white dark:text-slate-900" />
          )}
        </div>
      </div>
      
      {/* Message Content */}
      <div className={cn(
        "flex-1 max-w-[85%] md:max-w-[75%]",
        isUser && "flex flex-col items-end"
      )}>
        {/* Name and timestamp */}
        <div className={cn(
          "flex items-center gap-2 mb-1",
          isUser && "flex-row-reverse"
        )}>
          <span className="text-sm font-medium text-foreground">
            {isUser ? "You" : "Ron AI"}
          </span>
          {timestamp && (
            <span className="text-xs text-muted-foreground">
              {timestamp.toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </span>
          )}
          {isStreaming && !isUser && (
            <Sparkles className="w-3 h-3 text-primary animate-pulse" />
          )}
        </div>
        
        {/* Message Card */}
        <Card className={cn(
          "px-4 py-3 transition-all duration-200",
          isUser 
            ? "bg-primary text-primary-foreground border-primary/20 shadow-md hover:shadow-lg" 
            : "bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/70 dark:to-slate-800/50 border-slate-200 dark:border-slate-700 shadow-md hover:shadow-lg"
        )}>
          {hasTimeline ? (
            <div className="space-y-0">
              {sections.map((section, idx) => (
                <TimelineSection key={idx} section={section} isLast={idx === sections.length - 1} />
              ))}
            </div>
          ) : (
            <div className={cn(
              "prose prose-sm max-w-none",
              isUser && "prose-invert",
              !isUser && "dark:prose-invert",
              isStreaming && !isUser && "streaming-text",
              // Adjust prose styles for better readability
              "[&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
            "[&_p]:leading-relaxed",
            "[&_li]:my-1",
            "[&_ul]:my-2",
            "[&_ol]:my-2",
            "[&_h1]:text-xl [&_h1]:font-bold [&_h1]:mb-3 [&_h1]:mt-4",
            "[&_h2]:text-lg [&_h2]:font-bold [&_h2]:mb-2 [&_h2]:mt-3",
            "[&_h3]:text-base [&_h3]:font-bold [&_h3]:mb-2 [&_h3]:mt-3",
            "[&_blockquote]:border-l-4 [&_blockquote]:border-muted-foreground/30 [&_blockquote]:pl-4 [&_blockquote]:italic",
            "[&_a]:underline [&_a]:underline-offset-2 [&_a]:decoration-primary/50 hover:[&_a]:decoration-primary"
          )}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ node, inline, className, children, ...props }: any) {
                  const match = /language-(\w+)/.exec(className || "")
                  
                  // Use the enhanced component for supported languages
                  const supportedLanguages = ['html', 'javascript', 'jsx', 'typescript', 'tsx', 'python', 'react', 'py', 'js', 'ts']
                  if (!inline && match && supportedLanguages.includes(match[1].toLowerCase())) {
                    return <EnhancedCodeBlock language={match[1]}>{children}</EnhancedCodeBlock>
                  }
                  
                  // Regular code blocks
                  return !inline && match ? (
                    <div className="my-3 overflow-hidden rounded-lg border border-border/50">
                      <div className="flex items-center justify-between px-3 py-2 bg-muted/50 border-b border-border/50">
                        <span className="text-xs font-medium text-muted-foreground">
                          {match[1]}
                        </span>
                      </div>
                      <SyntaxHighlighter
                        style={oneDark as any}
                        language={match[1]}
                        PreTag="div"
                        className="!mt-0 !mb-0 !text-xs !bg-transparent"
                        showLineNumbers={true}
                        {...props}
                      >
                        {String(children).replace(/\n$/, "")}
                      </SyntaxHighlighter>
                    </div>
                  ) : (
                    <code
                      className={cn(
                        "px-1.5 py-0.5 rounded text-xs font-mono",
                        isUser 
                          ? "bg-primary-foreground/20 text-primary-foreground" 
                          : "bg-muted text-foreground"
                      )}
                      {...props}
                    >
                      {children}
                    </code>
                  )
                },
                // Tables with better styling
                table: ({ children }) => (
                  <div className="my-4 overflow-x-auto">
                    <table className="min-w-full divide-y divide-border">
                      {children}
                    </table>
                  </div>
                ),
                thead: ({ children }) => (
                  <thead className="bg-muted/50">{children}</thead>
                ),
                th: ({ children }) => (
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="px-3 py-2 text-sm">{children}</td>
                ),
                // Better list styling
                ul: ({ children }) => (
                  <ul className="list-disc pl-5 space-y-1">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal pl-5 space-y-1">{children}</ol>
                ),
                li: ({ children }) => (
                  <li className="leading-relaxed">{children}</li>
                ),
                // Links
                a: ({ href, children }) => (
                  <a 
                    href={href} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="font-medium hover:underline"
                  >
                    {children}
                  </a>
                ),
                // Paragraphs
                p: ({ children }) => (
                  <p className="mb-3 last:mb-0">{children}</p>
                ),
                // Blockquotes
                blockquote: ({ children }) => (
                  <blockquote className="my-4 pl-4 border-l-4 border-primary/30 italic opacity-90">
                    {children}
                  </blockquote>
                ),
                // Horizontal rules
                hr: () => (
                  <hr className="my-4 border-border/50" />
                ),
                // Images
                img: ({ src, alt }) => (
                  <img 
                    src={src} 
                    alt={alt} 
                    className="rounded-lg max-w-full h-auto my-3"
                  />
                )
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
          )}
        </Card>
      </div>
    </div>
  )
}, (prevProps, nextProps) => {
  // Shallow comparison - MessageCard renders frequently but mostly with same content
  return (
    prevProps.role === nextProps.role &&
    prevProps.content === nextProps.content &&
    prevProps.isStreaming === nextProps.isStreaming &&
    prevProps.className === nextProps.className &&
    prevProps.agentId === nextProps.agentId &&
    prevProps.agentType === nextProps.agentType &&
    prevProps.timestamp?.getTime() === nextProps.timestamp?.getTime()
  )
})

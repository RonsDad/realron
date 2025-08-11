"use client"

import { Bot, User, Sparkles } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"

interface MessageCardProps {
  role: "user" | "assistant"
  content: string
  timestamp?: Date
  isStreaming?: boolean
  className?: string
}

export function MessageCard({ 
  role, 
  content, 
  timestamp, 
  isStreaming = false,
  className 
}: MessageCardProps) {
  const isUser = role === "user"
  
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
          "px-4 py-3 shadow-sm",
          isUser 
            ? "bg-primary text-primary-foreground border-primary/20" 
            : "bg-card border-border/50",
          isStreaming && "animate-pulse-subtle"
        )}>
          <div className={cn(
            "prose prose-sm max-w-none",
            isUser && "prose-invert",
            !isUser && "dark:prose-invert",
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
        </Card>
      </div>
    </div>
  )
}
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ChevronDown,
  ChevronUp,
  Bot,
  Brain,
  Stethoscope,
  Search,
  Globe,
  FileText,
  Code,
  Database,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  MessageSquare,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

interface ThoughtChain {
  id: string;
  type: "thinking" | "tool_call" | "subagent" | "mcp_call";
  title: string;
  content: string;
  status: "pending" | "running" | "completed" | "error";
  timestamp: Date;
  duration?: number;
  metadata?: {
    toolName?: string;
    subagentName?: string;
    mcpServer?: string;
    tokenCount?: number;
    usage?: any;
  };
  subChains?: ThoughtChain[];
}

interface EnhancedMessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  thoughtChains?: ThoughtChain[];
  currentStatus?: {
    type: "thinking" | "tool_call" | "subagent" | "writing";
    message: string;
    progress?: number;
  };
  timestamp: Date;
  isStreaming?: boolean;
  className?: string;
}

const getStatusIcon = (type: string, status: string) => {
  if (status === "running") return <Loader2 className="w-4 h-4 animate-spin" />;
  if (status === "error")
    return <AlertCircle className="w-4 h-4 text-red-500" />;
  if (status === "completed")
    return <CheckCircle className="w-4 h-4 text-green-500" />;

  switch (type) {
    case "thinking":
      return <Brain className="w-4 h-4" />;
    case "tool_call":
      return <Zap className="w-4 h-4" />;
    case "subagent":
      return <Bot className="w-4 h-4" />;
    case "mcp_call":
      return <Database className="w-4 h-4" />;
    default:
      return <Activity className="w-4 h-4" />;
  }
};

const getToolIcon = (toolName: string) => {
  if (toolName.includes("clinical")) return Stethoscope;
  if (toolName.includes("pubmed") || toolName.includes("search")) return Search;
  if (toolName.includes("browser") || toolName.includes("web")) return Globe;
  if (toolName.includes("file") || toolName.includes("document"))
    return FileText;
  if (toolName.includes("code")) return Code;
  return Activity;
};

const formatDuration = (ms: number) => {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
};

export function EnhancedMessageBubble({
  role,
  content,
  thoughtChains = [],
  currentStatus,
  timestamp,
  isStreaming = false,
  className,
}: EnhancedMessageBubbleProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [expandedChains, setExpandedChains] = useState<Set<string>>(new Set());

  const toggleChainExpansion = (chainId: string) => {
    setExpandedChains((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(chainId)) {
        newSet.delete(chainId);
      } else {
        newSet.add(chainId);
      }
      return newSet;
    });
  };

  const renderThoughtChain = (chain: ThoughtChain, level: number = 0) => {
    const isExpanded = expandedChains.has(chain.id);
    const Icon = chain.metadata?.toolName
      ? getToolIcon(chain.metadata.toolName)
      : Brain;
    const indentClass = level > 0 ? `ml-${level * 4}` : "";

    return (
      <div
        key={chain.id}
        className={cn(
          "border-l-2 border-gray-200 dark:border-gray-700",
          indentClass,
        )}
      >
        <div className="relative pl-4 pb-4">
          {/* Status dot */}
          <div
            className={cn(
              "absolute -left-2 top-2 w-4 h-4 rounded-full border-2 border-background flex items-center justify-center text-xs",
              chain.status === "completed" && "bg-green-500 text-white",
              chain.status === "running" &&
                "bg-blue-500 text-white animate-pulse",
              chain.status === "error" && "bg-red-500 text-white",
              chain.status === "pending" && "bg-gray-400 text-white",
            )}
          >
            {getStatusIcon(chain.type, chain.status)}
          </div>

          {/* Chain header */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <button
                onClick={() => toggleChainExpansion(chain.id)}
                className="flex items-center gap-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800 rounded p-1 -m-1 transition-colors"
              >
                <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="font-medium text-sm">{chain.title}</span>
                {isExpanded ? (
                  <ChevronUp className="w-3 h-3 text-gray-400" />
                ) : (
                  <ChevronDown className="w-3 h-3 text-gray-400" />
                )}
              </button>

              <div className="flex items-center gap-2 mt-1">
                <Badge
                  variant={
                    chain.status === "completed"
                      ? "default"
                      : chain.status === "error"
                        ? "destructive"
                        : "secondary"
                  }
                  className="text-xs"
                >
                  {chain.status}
                </Badge>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {chain.timestamp.toLocaleTimeString()}
                </span>
                {chain.duration && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDuration(chain.duration)}
                  </span>
                )}
                {chain.metadata?.tokenCount && (
                  <Badge variant="outline" className="text-xs">
                    {chain.metadata.tokenCount.toLocaleString()} tokens
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Chain content */}
          {isExpanded && (
            <div className="mt-3 space-y-3">
              {chain.content && (
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeHighlight]}
                      components={{
                        p: ({ children }) => (
                          <p className="text-sm leading-relaxed mb-2 last:mb-0">
                            {children}
                          </p>
                        ),
                        ul: ({ children }) => (
                          <ul className="text-sm space-y-1">{children}</ul>
                        ),
                        ol: ({ children }) => (
                          <ol className="text-sm space-y-1">{children}</ol>
                        ),
                        li: ({ children }) => (
                          <li className="text-sm">{children}</li>
                        ),
                        code: ({ inline, children }) =>
                          inline ? (
                            <code className="bg-gray-200 dark:bg-gray-800 px-1 py-0.5 rounded text-xs font-mono">
                              {children}
                            </code>
                          ) : (
                            <pre className="bg-gray-900 text-gray-100 p-3 rounded-lg text-xs font-mono overflow-x-auto">
                              <code>{children}</code>
                            </pre>
                          ),
                      }}
                    >
                      {chain.content}
                    </ReactMarkdown>
                  </div>
                </div>
              )}

              {/* Usage information for tool calls */}
              {chain.metadata?.usage && (
                <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-xs text-blue-700 dark:text-blue-300">
                    <Activity className="w-3 h-3" />
                    <span>Usage:</span>
                    <span>Input: {chain.metadata.usage.prompt_tokens}</span>
                    <span>
                      Output: {chain.metadata.usage.completion_tokens}
                    </span>
                    <span className="font-medium">
                      Total: {chain.metadata.usage.total_tokens}
                    </span>
                  </div>
                </div>
              )}

              {/* Sub-chains (recursive) */}
              {chain.subChains && chain.subChains.length > 0 && (
                <div className="space-y-2">
                  {chain.subChains.map((subChain) =>
                    renderThoughtChain(subChain, level + 1),
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card
      className={cn(
        "transition-all duration-300 shadow-sm hover:shadow-md",
        role === "assistant"
          ? "bg-gradient-to-br from-blue-50/50 via-white to-indigo-50/50 dark:from-blue-950/20 dark:via-gray-900 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800"
          : "bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 border-gray-200 dark:border-gray-700",
        className,
      )}
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center shadow-sm",
                role === "assistant"
                  ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white"
                  : "bg-gradient-to-r from-gray-400 to-gray-600 text-white",
              )}
            >
              {role === "assistant" ? (
                <Bot className="w-5 h-5" />
              ) : (
                <MessageSquare className="w-5 h-5" />
              )}
            </div>
            <div className="flex flex-col">
              <span
                className={cn(
                  "text-base font-bold",
                  role === "assistant"
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"
                    : "text-gray-800 dark:text-gray-200",
                )}
              >
                {role === "assistant" ? "Ron AI Healthcare Copilot" : "You"}
              </span>
              {role === "assistant" && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Claude Sonnet 4 Healthcare Specialist
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Current status indicator */}
            {currentStatus && isStreaming && (
              <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                <Loader2 className="w-3 h-3 animate-spin text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                  {currentStatus.message}
                </span>
                {currentStatus.progress !== undefined && (
                  <div className="w-16">
                    <Progress value={currentStatus.progress} className="h-1" />
                  </div>
                )}
              </div>
            )}

            {thoughtChains.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-8 w-8 p-0"
              >
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Thought process accordion */}
        {thoughtChains.length > 0 && isExpanded && (
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem
              value="thought-process"
              className="border-blue-200 dark:border-blue-800"
            >
              <AccordionTrigger className="hover:no-underline py-2">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    Ron's Thought Process ({thoughtChains.length} steps)
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 mt-4">
                  {thoughtChains.map((chain) => renderThoughtChain(chain))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}

        {/* Main message content */}
        <div className="space-y-3">
          {role === "assistant" && !isStreaming && (
            <div className="flex items-center gap-2 pb-2 border-b border-blue-200 dark:border-blue-800">
              <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                Response
              </span>
            </div>
          )}

          <div className="prose prose-sm max-w-none dark:prose-invert prose-blue">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              components={{
                h1: ({ children }) => (
                  <h1 className="text-xl font-bold mt-4 mb-3 text-blue-900 dark:text-blue-100">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-lg font-semibold mt-3 mb-2 text-blue-800 dark:text-blue-200">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-base font-medium mt-2 mb-1 text-blue-700 dark:text-blue-300">
                    {children}
                  </h3>
                ),
                ul: ({ children }) => (
                  <ul className="space-y-1 ml-4">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="space-y-1 ml-4">{children}</ol>
                ),
                li: ({ children }) => (
                  <li className="text-sm leading-relaxed">{children}</li>
                ),
                p: ({ children }) => (
                  <p className="text-sm leading-relaxed mb-2">{children}</p>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-blue-400 dark:border-blue-600 pl-4 py-2 my-3 bg-blue-50/30 dark:bg-blue-950/30 rounded-r">
                    {children}
                  </blockquote>
                ),
                code: ({ inline, children }) =>
                  inline ? (
                    <code className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/50 rounded text-xs font-mono text-blue-800 dark:text-blue-200">
                      {children}
                    </code>
                  ) : (
                    <pre className="p-3 bg-gray-900 dark:bg-black rounded-lg text-xs font-mono overflow-x-auto">
                      <code className="text-gray-100">{children}</code>
                    </pre>
                  ),
                strong: ({ children }) => (
                  <strong className="font-semibold text-blue-800 dark:text-blue-200">
                    {children}
                  </strong>
                ),
                em: ({ children }) => (
                  <em className="italic text-blue-700 dark:text-blue-300">
                    {children}
                  </em>
                ),
                a: ({ href, children }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline decoration-dotted underline-offset-2"
                  >
                    {children}
                  </a>
                ),
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        </div>

        {/* Timestamp */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <Clock className="w-3 h-3" />
            <span>
              {timestamp.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </span>
          </div>

          {thoughtChains.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <Brain className="w-3 h-3" />
              <span>{thoughtChains.length} thought steps</span>
              <span>•</span>
              <span>
                {thoughtChains
                  .reduce(
                    (acc, chain) => acc + (chain.metadata?.tokenCount || 0),
                    0,
                  )
                  .toLocaleString()}{" "}
                tokens
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

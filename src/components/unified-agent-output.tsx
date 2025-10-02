"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Clock,
  CheckCircle,
  Loader2,
  AlertCircle,
  Bot,
  Stethoscope,
  Database,
  Search,
  Globe,
  Activity,
  Zap,
  Brain,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ToolOutput {
  id: string;
  toolName: string;
  content: any;
  timestamp: Date;
  status: "pending" | "executing" | "completed" | "error";
  agent: string;
  chainId?: string;
  activityId?: string;
}

interface UnifiedAgentOutputProps {
  outputs: ToolOutput[];
  className?: string;
}

const getToolIcon = (toolName: string) => {
  if (toolName.includes("clinical")) return Stethoscope;
  if (toolName.includes("pubmed")) return Database;
  if (toolName.includes("browser")) return Globe;
  if (toolName.includes("search")) return Search;
  if (toolName.includes("perplexity")) return Brain;
  if (toolName.includes("code")) return FileText;
  return Activity;
};

const getToolColor = (toolName: string) => {
  if (toolName.includes("clinical"))
    return {
      bg: "bg-red-50 border-red-200",
      icon: "bg-red-500",
      text: "text-red-700",
    };
  if (toolName.includes("pubmed"))
    return {
      bg: "bg-blue-50 border-blue-200",
      icon: "bg-blue-500",
      text: "text-blue-700",
    };
  if (toolName.includes("browser"))
    return {
      bg: "bg-purple-50 border-purple-200",
      icon: "bg-purple-500",
      text: "text-purple-700",
    };
  if (toolName.includes("search"))
    return {
      bg: "bg-green-50 border-green-200",
      icon: "bg-green-500",
      text: "text-green-700",
    };
  if (toolName.includes("perplexity"))
    return {
      bg: "bg-cyan-50 border-cyan-200",
      icon: "bg-cyan-500",
      text: "text-cyan-700",
    };
  return {
    bg: "bg-slate-50 border-slate-200",
    icon: "bg-slate-500",
    text: "text-slate-700",
  };
};

export function UnifiedAgentOutput({
  outputs,
  className,
}: UnifiedAgentOutputProps) {
  const [collapsedAgents, setCollapsedAgents] = useState<Set<string>>(
    new Set(),
  );
  const [copiedOutputs, setCopiedOutputs] = useState<Set<string>>(new Set());

  // Group outputs by agent
  const outputsByAgent = outputs.reduce(
    (acc, output) => {
      if (!acc[output.agent]) {
        acc[output.agent] = [];
      }
      acc[output.agent].push(output);
      return acc;
    },
    {} as Record<string, ToolOutput[]>,
  );

  // Group by tool name within each agent to consolidate duplicates
  const consolidatedOutputs = Object.entries(outputsByAgent).reduce(
    (acc, [agent, agentOutputs]) => {
      const consolidatedByTool = agentOutputs.reduce(
        (toolAcc, output) => {
          const key = output.toolName;

          if (!toolAcc[key]) {
            toolAcc[key] = {
              ...output,
              instances: [output],
              lastUpdate: output.timestamp,
            };
          } else {
            // Update with latest data if this is more recent
            if (output.timestamp > toolAcc[key].lastUpdate) {
              toolAcc[key] = {
                ...output,
                instances: [...toolAcc[key].instances, output],
                lastUpdate: output.timestamp,
              };
            } else {
              toolAcc[key].instances.push(output);
            }
          }

          return toolAcc;
        },
        {} as Record<
          string,
          ToolOutput & { instances: ToolOutput[]; lastUpdate: Date }
        >,
      );

      acc[agent] = Object.values(consolidatedByTool);
      return acc;
    },
    {} as Record<
      string,
      (ToolOutput & { instances: ToolOutput[]; lastUpdate: Date })[]
    >,
  );

  const toggleAgentCollapse = (agent: string) => {
    setCollapsedAgents((prev) => {
      const next = new Set(prev);
      if (next.has(agent)) {
        next.delete(agent);
      } else {
        next.add(agent);
      }
      return next;
    });
  };

  const handleCopy = async (outputId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedOutputs((prev) => new Set([...prev, outputId]));
      setTimeout(() => {
        setCopiedOutputs((prev) => {
          const next = new Set(prev);
          next.delete(outputId);
          return next;
        });
      }, 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const formatContent = (content: any): string => {
    if (typeof content === "string") {
      return content;
    } else if (typeof content === "object") {
      return JSON.stringify(content, null, 2);
    }
    return String(content);
  };

  if (outputs.length === 0) {
    return null;
  }

  return (
    <Card
      className={cn(
        "bg-gradient-to-br from-slate-50 to-blue-50/30 border-slate-200",
        "dark:from-slate-900/50 dark:to-blue-950/30 dark:border-slate-700",
        className,
      )}
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
          <Bot className="w-5 h-5" />
          Agent Outputs
          <Badge variant="secondary" className="ml-2 text-xs">
            {Object.keys(consolidatedOutputs).length} agents
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {Object.entries(consolidatedOutputs).map(([agent, agentOutputs]) => {
            const isCollapsed = collapsedAgents.has(agent);
            const hasRunning = agentOutputs.some(
              (o) => o.status === "executing",
            );
            const hasCompleted = agentOutputs.some(
              (o) => o.status === "completed",
            );
            const hasErrors = agentOutputs.some((o) => o.status === "error");

            return (
              <motion.div
                key={agent}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "border rounded-lg overflow-hidden transition-all",
                  hasRunning && "bg-blue-50 border-blue-200",
                  hasErrors && "bg-red-50 border-red-200",
                  hasCompleted &&
                    !hasRunning &&
                    !hasErrors &&
                    "bg-green-50 border-green-200",
                )}
              >
                <Collapsible open={!isCollapsed}>
                  <CollapsibleTrigger asChild>
                    <div
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/50 transition-colors"
                      onClick={() => toggleAgentCollapse(agent)}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center",
                            hasRunning && "bg-blue-500",
                            hasErrors && "bg-red-500",
                            hasCompleted &&
                              !hasRunning &&
                              !hasErrors &&
                              "bg-green-500",
                            !hasRunning &&
                              !hasErrors &&
                              !hasCompleted &&
                              "bg-slate-500",
                          )}
                        >
                          {hasRunning ? (
                            <Loader2 className="w-4 h-4 text-white animate-spin" />
                          ) : (
                            <Bot className="w-4 h-4 text-white" />
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-sm">{agent}</div>
                          <div className="text-xs text-muted-foreground">
                            {agentOutputs.length} tool
                            {agentOutputs.length !== 1 ? "s" : ""} executed
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          {hasRunning && (
                            <Badge variant="default" className="text-xs">
                              <Loader2 className="w-2 h-2 mr-1 animate-spin" />
                              Running
                            </Badge>
                          )}
                          {hasCompleted && (
                            <Badge variant="outline" className="text-xs">
                              <CheckCircle className="w-2 h-2 mr-1" />
                              Complete
                            </Badge>
                          )}
                          {hasErrors && (
                            <Badge variant="destructive" className="text-xs">
                              <AlertCircle className="w-2 h-2 mr-1" />
                              Error
                            </Badge>
                          )}
                        </div>
                        {isCollapsed ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronUp className="w-4 h-4" />
                        )}
                      </div>
                    </div>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="border-t border-border/50 bg-white/30 dark:bg-slate-800/30">
                      <div className="p-4 space-y-3">
                        <AnimatePresence>
                          {agentOutputs.map((output) => {
                            const Icon = getToolIcon(output.toolName);
                            const colorConfig = getToolColor(output.toolName);
                            const formattedContent = formatContent(
                              output.content,
                            );
                            const isLongContent = formattedContent.length > 300;
                            const [isExpanded, setIsExpanded] = useState(false);
                            const isCopied = copiedOutputs.has(output.id);

                            return (
                              <motion.div
                                key={output.id}
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className={cn(
                                  "border rounded-lg overflow-hidden",
                                  colorConfig.bg,
                                )}
                              >
                                <div className="p-3">
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <div
                                        className={cn(
                                          "w-6 h-6 rounded flex items-center justify-center",
                                          colorConfig.icon,
                                        )}
                                      >
                                        <Icon className="w-3 h-3 text-white" />
                                      </div>
                                      <div>
                                        <div className="font-medium text-sm">
                                          {output.toolName
                                            .replace(/_/g, " ")
                                            .replace(/\b\w/g, (l) =>
                                              l.toUpperCase(),
                                            )}
                                        </div>
                                        {output.instances.length > 1 && (
                                          <div className="text-xs text-muted-foreground">
                                            {output.instances.length} executions
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-1">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                          handleCopy(
                                            output.id,
                                            formattedContent,
                                          )
                                        }
                                        className="h-6 w-6 p-0"
                                      >
                                        {isCopied ? (
                                          <Check className="w-3 h-3 text-green-600" />
                                        ) : (
                                          <Copy className="w-3 h-3" />
                                        )}
                                      </Button>
                                      <Badge
                                        variant={
                                          output.status === "executing"
                                            ? "default"
                                            : output.status === "completed"
                                              ? "outline"
                                              : output.status === "error"
                                                ? "destructive"
                                                : "secondary"
                                        }
                                        className="text-xs"
                                      >
                                        {output.status === "executing" && (
                                          <Loader2 className="w-2 h-2 mr-1 animate-spin" />
                                        )}
                                        {output.status}
                                      </Badge>
                                    </div>
                                  </div>

                                  <Collapsible
                                    open={!isLongContent || isExpanded}
                                  >
                                    <CollapsibleContent>
                                      <ScrollArea
                                        className={cn(
                                          "w-full rounded-md bg-white/50 dark:bg-slate-900/50 border border-border/30",
                                          isExpanded ? "max-h-96" : "max-h-32",
                                        )}
                                      >
                                        <div className="p-3">
                                          <div className="prose prose-xs max-w-none dark:prose-invert">
                                            <ReactMarkdown
                                              remarkPlugins={[remarkGfm]}
                                            >
                                              {formattedContent}
                                            </ReactMarkdown>
                                          </div>
                                        </div>
                                      </ScrollArea>
                                    </CollapsibleContent>

                                    {isLongContent && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                          setIsExpanded(!isExpanded)
                                        }
                                        className="mt-2 text-xs h-6"
                                      >
                                        {isExpanded ? "Show less" : "Show more"}
                                      </Button>
                                    )}
                                  </Collapsible>

                                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/30">
                                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {output.lastUpdate.toLocaleTimeString()}
                                    </div>
                                    {output.instances.length > 1 && (
                                      <div className="text-xs text-muted-foreground">
                                        Latest of {output.instances.length} runs
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                        </AnimatePresence>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

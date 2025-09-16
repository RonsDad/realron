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
import {
  ChevronDown,
  ChevronUp,
  Brain,
  Stethoscope,
  Activity,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

interface ClinicalOperationsBubbleProps {
  content:
    | string
    | {
        response?: string;
        thinking?: string;
        usage?: {
          prompt_tokens: number;
          completion_tokens: number;
          total_tokens: number;
        };
        error?: string;
      };
  timestamp?: Date;
  className?: string;
}

export function ClinicalOperationsBubble({
  content,
  timestamp,
  className,
}: ClinicalOperationsBubbleProps) {
  const [isExpanded, setIsExpanded] = useState(true); // Default expanded for clinical info

  // Parse content if it's a string
  let parsedContent: any = content;
  if (typeof content === "string") {
    try {
      parsedContent = JSON.parse(content);
    } catch {
      parsedContent = { response: content };
    }
  }

  const response =
    parsedContent.response ||
    parsedContent.result ||
    parsedContent.content ||
    "";
  const thinking = parsedContent.thinking || "";
  const usage = parsedContent.usage;
  const error = parsedContent.error;

  // Format markdown with proper clinical styling
  const formatClinicalContent = (text: string) => {
    // Ensure proper markdown formatting
    return text
      .replace(/^(\d+)\.\s+/gm, "\n$1. ") // Fix numbered lists
      .replace(/^-\s+/gm, "\n- ") // Fix bullet points
      .replace(/\*\*([^*]+)\*\*/g, "**$1**") // Ensure bold formatting
      .trim();
  };

  // Create preview without markdown
  const plainTextPreview =
    response.replace(/[#*_`[\]()]/g, "").substring(0, 200) +
    (response.length > 200 ? "..." : "");

  return (
    <Card
      className={cn(
        "border-teal-200 dark:border-teal-800",
        "bg-gradient-to-br from-teal-50 via-white to-cyan-50",
        "dark:from-teal-950/30 dark:via-gray-900 dark:to-cyan-950/30",
        "shadow-lg hover:shadow-xl transition-all duration-300",
        className,
      )}
    >
      <CardHeader className="pb-3 px-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-r from-teal-500 to-cyan-600 shadow-md">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                Clinical Operations Agent
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                GPT-5-mini Healthcare Specialist
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 w-8 p-0 hover:bg-teal-100 dark:hover:bg-teal-900/30"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </CardTitle>
      </CardHeader>

      <CardContent className="px-4 pb-4 space-y-3">
        {error ? (
          <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          </div>
        ) : (
          <>
            {/* Thinking Tokens Accordion (if available) */}
            {thinking && (
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem
                  value="thinking"
                  className="border-teal-200 dark:border-teal-800"
                >
                  <AccordionTrigger className="hover:no-underline py-2">
                    <div className="flex items-center gap-2">
                      <Brain className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                      <span className="text-sm font-medium text-teal-700 dark:text-teal-300">
                        Clinical Reasoning Process
                      </span>
                      {usage && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                          ({usage.prompt_tokens} tokens)
                        </span>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="p-3 bg-teal-50/50 dark:bg-teal-950/20 rounded-lg">
                      <div className="prose prose-sm max-w-none dark:prose-invert prose-teal">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {thinking}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}

            {/* Main Clinical Response */}
            <div className="overflow-hidden">
              {isExpanded ? (
                <div className="space-y-3">
                  {/* Response Header */}
                  <div className="flex items-center gap-2 pb-2 border-b border-teal-200 dark:border-teal-800">
                    <Activity className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    <span className="text-sm font-semibold text-teal-700 dark:text-teal-300">
                      Clinical Analysis
                    </span>
                  </div>

                  {/* Formatted Response */}
                  <div
                    className="prose prose-sm max-w-none dark:prose-invert prose-teal
                                prose-headings:text-teal-900 dark:prose-headings:text-teal-100
                                prose-strong:text-teal-800 dark:prose-strong:text-teal-200
                                prose-li:marker:text-teal-600 dark:prose-li:marker:text-teal-400
                                prose-a:text-cyan-600 hover:prose-a:text-cyan-700
                                dark:prose-a:text-cyan-400 dark:hover:prose-a:text-cyan-300
                                max-h-96 overflow-y-auto"
                  >
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeHighlight]}
                      components={{
                        // Custom rendering for better clinical formatting
                        h1: ({ children }) => (
                          <h1 className="text-xl font-bold mt-4 mb-3 text-teal-900 dark:text-teal-100">
                            {children}
                          </h1>
                        ),
                        h2: ({ children }) => (
                          <h2 className="text-lg font-semibold mt-3 mb-2 text-teal-800 dark:text-teal-200">
                            {children}
                          </h2>
                        ),
                        h3: ({ children }) => (
                          <h3 className="text-base font-medium mt-2 mb-1 text-teal-700 dark:text-teal-300">
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
                          <li className="text-sm leading-relaxed">
                            {children}
                          </li>
                        ),
                        p: ({ children }) => (
                          <p className="text-sm leading-relaxed mb-2">
                            {children}
                          </p>
                        ),
                        blockquote: ({ children }) => (
                          <blockquote className="border-l-4 border-teal-400 dark:border-teal-600 pl-4 py-2 my-3 bg-teal-50/30 dark:bg-teal-950/30 rounded-r">
                            {children}
                          </blockquote>
                        ),
                        code: ({ inline, children }) =>
                          inline ? (
                            <code className="px-1.5 py-0.5 bg-teal-100 dark:bg-teal-900/50 rounded text-xs font-mono text-teal-800 dark:text-teal-200">
                              {children}
                            </code>
                          ) : (
                            <code className="block p-3 bg-gray-900 dark:bg-black rounded-lg text-xs font-mono overflow-x-auto">
                              {children}
                            </code>
                          ),
                        strong: ({ children }) => (
                          <strong className="font-semibold text-teal-800 dark:text-teal-200">
                            {children}
                          </strong>
                        ),
                        em: ({ children }) => (
                          <em className="italic text-teal-700 dark:text-teal-300">
                            {children}
                          </em>
                        ),
                        a: ({ href, children }) => (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300 underline decoration-dotted underline-offset-2"
                          >
                            {children}
                          </a>
                        ),
                        table: ({ children }) => (
                          <div className="overflow-x-auto my-3">
                            <table className="min-w-full border border-teal-200 dark:border-teal-800">
                              {children}
                            </table>
                          </div>
                        ),
                        th: ({ children }) => (
                          <th className="px-3 py-2 bg-teal-100 dark:bg-teal-900/50 border border-teal-200 dark:border-teal-800 text-left text-sm font-semibold">
                            {children}
                          </th>
                        ),
                        td: ({ children }) => (
                          <td className="px-3 py-2 border border-teal-200 dark:border-teal-800 text-sm">
                            {children}
                          </td>
                        ),
                      }}
                    >
                      {formatClinicalContent(response)}
                    </ReactMarkdown>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-600 dark:text-gray-400 line-clamp-4 leading-relaxed">
                  {plainTextPreview}
                </div>
              )}
            </div>

            {/* Usage Statistics */}
            {usage && (
              <div className="flex items-center justify-between pt-2 border-t border-teal-200 dark:border-teal-800">
                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                  <span>Input: {usage.prompt_tokens.toLocaleString()}</span>
                  <span>
                    Output: {usage.completion_tokens.toLocaleString()}
                  </span>
                  <span className="font-medium">
                    Total: {usage.total_tokens.toLocaleString()} tokens
                  </span>
                </div>
                {timestamp && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import {
  ArrowUp,
  Bot,
  BrainCircuit,
  User,
  Paperclip,
  Mic,
  Monitor,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ThemeToggle } from "@/components/theme-toggle";
import { AgentStatusIndicator } from "@/components/agent-status-indicator";
import { ProviderSearchInterface } from "@/components/provider-search-interface";
import { MedicationManagerInterface } from "@/components/medication-manager-interface";
import { CareTeamPanel } from "@/components/care-team-panel";
import { ComputerUseAgent } from "@/components/computer-use-agent";
import { BrowserTimeline } from "@/components/browser-timeline";
import { SidebarMinimal } from "@/components/sidebar-minimal";
import { useComputerAgent } from "@/hooks/use-computer-agent";
import { claudeAPI, parseSSEStream, type ChatMessage } from "@/lib/api";
import type { Message } from "@/lib/types";
import { ThinkingBubble } from "@/components/thinking-bubble";
import { MessageCard } from "@/components/message-card";
import { EnhancedMessageBubble } from "@/components/enhanced-message-bubble";
import {
  useThoughtChainTracker,
  type ThoughtChain,
} from "@/hooks/use-thought-chain-tracker";
import { ResearchProgressUnified } from "@/components/research-progress-unified";
import { ToolOutputCard } from "@/components/tool-output-card";
import { ClinicalOperationsBubble } from "@/components/clinical-operations-bubble";
import { ClaudeCodePreview } from "@/components/claude-code-preview";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CommandMenu } from "@/components/command-menu";
import { PromptBuilderDialog } from "@/components/prompt-builder-dialog";
import { useUserProfile } from "@/hooks/use-user-profile";
import type { ProviderSearchData, ProviderSearchResult } from "@/lib/types";

import { AgentOrchestration } from "@/components/agent-orchestration";
import { CapturedAgentsPanel } from "@/components/captured-agents-panel";

interface ThinkingData {
  id: string;
  content: string;
  timestamp: Date;
}

interface ToolOutputData {
  id: string;
  toolName: string;
  content: string | object;
  timestamp: Date;
  status?: "pending" | "executing" | "completed" | "error";
  chainId?: string;
  activityId?: string;
}

interface CodeFileData {
  name: string;
  language: string;
  content: string;
}

interface AgentActivity {
  id: string;
  type: "search" | "fetch" | "analysis" | "synthesis" | "thinking" | "tool";
  agent: string;
  description: string;
  status: "running" | "completed" | "error";
  timestamp: Date;
  details?: any;
  progress?: number;
}

export default function HealthCopilot() {
  const { userProfile } = useUserProfile();
  const [isDeepResearch, setIsDeepResearch] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [showCareTeam, setShowCareTeam] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [deepResearchSessionId, setDeepResearchSessionId] = useState<
    string | null
  >(null);
  const [deepResearchUserId, setDeepResearchUserId] = useState<string | null>(
    null,
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStreamingMessage, setCurrentStreamingMessage] = useState("");
  const [currentReasoning, setCurrentReasoning] = useState("");
  const [reasoningTokens, setReasoningTokens] = useState(0);
  const [deepResearchOutputs, setDeepResearchOutputs] = useState<any>({});
  const [deepResearchMessages, setDeepResearchMessages] = useState<any[]>([]);
  const [showCommandMenu, setShowCommandMenu] = useState(false);
  const [browserActions, setBrowserActions] = useState<any[]>([]);
  const [thinkingBubbles, setThinkingBubbles] = useState<ThinkingData[]>([]);
  const [toolOutputs, setToolOutputs] = useState<ToolOutputData[]>([]);
  const [currentThinkingId, setCurrentThinkingId] = useState<string | null>(
    null,
  );
  const [codeFiles, setCodeFiles] = useState<CodeFileData[]>([]);
  const [codeOutput, setCodeOutput] = useState<string>("");
  const [providerSearchData, setProviderSearchData] =
    useState<ProviderSearchData | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<
    "connected" | "connecting" | "error" | "retry"
  >("connected");
  const [retryCount, setRetryCount] = useState(0);
  const [lastFailedMessage, setLastFailedMessage] = useState<string>("");
  const [agentActivities, setAgentActivities] = useState<AgentActivity[]>([]);
  const [currentOrchestrationAgent, setCurrentOrchestrationAgent] = useState<
    string | null
  >(null);
  const [isAgentOrchestrationActive, setIsAgentOrchestrationActive] =
    useState(false);
  const [showCapturedAgents, setShowCapturedAgents] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { agentState, startAgent, stopAgent, updateUrl } = useComputerAgent();

  // Enhanced thought chain tracking
  const {
    thoughtChains,
    currentStatus,
    addThinkingChain,
    addToolCallChain,
    addSubagentChain,
    addMCPCallChain,
    updateThoughtChain,
    updateStatus,
    clearThoughtChains,
  } = useThoughtChainTracker();

  // Store current assistant message thought chains
  const [currentMessageChains, setCurrentMessageChains] = useState<
    ThoughtChain[]
  >([]);

  useEffect(() => {
    setMounted(true);

    // Cleanup function to abort streams when component unmounts
    return () => {
      claudeAPI.abortAllStreams();
    };
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, currentStreamingMessage]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInputValue(value);
  };

  const handleCommandSelect = (prompt: string) => {
    setInputValue(prompt);
    setShowCommandMenu(false);
    // Focus back on input
    inputRef.current?.focus();
  };

  const handleSendMessage = async (messageOverride?: string) => {
    const messageToSend = messageOverride || inputValue;
    if (
      typeof messageToSend === "string" &&
      messageToSend.trim() &&
      !isProcessing
    ) {
      // Reset connection status and retry count for new messages
      if (!messageOverride) {
        setConnectionStatus("connecting");
        setRetryCount(0);
        setLastFailedMessage("");
      }

      const newMessage: Message = {
        role: "user",
        content: messageToSend,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, newMessage]);
      if (!messageOverride) {
        setInputValue("");
      }
      setIsProcessing(true);
      setCurrentStreamingMessage("");
      setCurrentReasoning("");
      setReasoningTokens(0);
      // Clear previous thinking bubbles and tool outputs when starting new message
      setThinkingBubbles([]);
      setToolOutputs([]);
      setCurrentThinkingId(null);
      // Reset agent orchestration for new message
      setAgentActivities([]);
      setIsAgentOrchestrationActive(false);
      setCurrentOrchestrationAgent(null);
      // Clear thought chains for new message
      clearThoughtChains();
      setCurrentMessageChains([]);

      try {
        // Removed console.logs for better performance

        // Check if using deep research mode
        if (isDeepResearch) {
          // Using deep research agent

          let sessionId = deepResearchSessionId;
          let userId = deepResearchUserId;

          // Only create a new session if we don't have one
          if (!sessionId || !userId) {
            userId = "user_" + Math.random().toString(36).substr(2, 9);
            console.log("Creating new deep research session...");
            sessionId = await claudeAPI.createDeepResearchSession(userId);
            console.log("Session created with ID:", sessionId);

            // Save session info for subsequent messages
            setDeepResearchSessionId(sessionId);
            setDeepResearchUserId(userId);
          } else {
            console.log("Reusing existing session:", sessionId);
          }

          // Create assistant message placeholder
          // DO NOT add empty assistant message - wait for actual content

          // Stream from deep research endpoint
          console.log("Calling deepResearch with:", {
            sessionId,
            userId,
            messageCount: messages.length + 1,
          });

          const stream = await claudeAPI.deepResearch(
            messageToSend, // Use the actual message being sent
            sessionId!, // We know sessionId is not null here due to the check above
            userId!, // We know userId is not null here due to the check above
          );

          // Set connected status for deep research
          setConnectionStatus("connected");

          console.log("Deep research stream received:", stream);

          if (!stream) {
            throw new Error("Failed to get stream from deep research API");
          }

          let fullContent = "";
          let fullReasoning = "";
          console.log("Starting deep research SSE stream...");

          const reader = stream.getReader();
          const decoder = new TextDecoder();
          let buffer = "";

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split("\n");
              buffer = lines.pop() || "";

              for (const line of lines) {
                if (line.startsWith("data: ")) {
                  const data = line.slice(6).trim();
                  if (data && data !== "[DONE]") {
                    try {
                      const event = JSON.parse(data);

                      // Extract content from deep research format
                      if (event.content?.parts) {
                        for (const part of event.content.parts) {
                          if (part.text) {
                            // Direct text content from backend
                            fullContent = part.text;
                            setCurrentStreamingMessage(fullContent);
                          }
                        }
                      }

                      // Handle state delta updates (research plan, final report, etc)
                      if (event.actions?.stateDelta) {
                        // Update deep research outputs with proper structure
                        const stateDelta = event.actions.stateDelta;

                        if (stateDelta.research_plan) {
                          setDeepResearchOutputs((prev: any) => ({
                            ...prev,
                            plan: stateDelta.research_plan,
                          }));
                          // Don't show plan in message bubble, show in research component
                          fullContent = "Creating research plan...";
                          setCurrentStreamingMessage(fullContent);
                          setDeepResearchMessages((prev) => [
                            ...prev,
                            {
                              type: "plan",
                              content: stateDelta.research_plan,
                              timestamp: new Date(),
                            },
                          ]);
                        }

                        if (stateDelta.final_report_with_citations) {
                          setDeepResearchOutputs((prev: any) => ({
                            ...prev,
                            finalReport: stateDelta.final_report_with_citations,
                          }));
                          // Show completion message
                          fullContent =
                            "Research complete! See the detailed report below.";
                          setCurrentStreamingMessage(fullContent);
                          setDeepResearchMessages((prev) => [
                            ...prev,
                            {
                              type: "final",
                              content: stateDelta.final_report_with_citations,
                              timestamp: new Date(),
                            },
                          ]);
                        }

                        if (stateDelta.section_research_findings) {
                          setDeepResearchOutputs((prev: any) => ({
                            ...prev,
                            findings: stateDelta.section_research_findings,
                          }));
                          setDeepResearchMessages((prev) => [
                            ...prev,
                            {
                              type: "findings",
                              content: stateDelta.section_research_findings,
                              timestamp: new Date(),
                            },
                          ]);
                        }

                        if (stateDelta.report_sections) {
                          setDeepResearchOutputs((prev: any) => ({
                            ...prev,
                            outline: stateDelta.report_sections,
                          }));
                          setDeepResearchMessages((prev) => [
                            ...prev,
                            {
                              type: "outline",
                              content: stateDelta.report_sections,
                              timestamp: new Date(),
                            },
                          ]);
                        }

                        if (stateDelta.research_evaluation) {
                          setDeepResearchOutputs((prev: any) => ({
                            ...prev,
                            evaluation: stateDelta.research_evaluation,
                          }));
                          setDeepResearchMessages((prev) => [
                            ...prev,
                            {
                              type: "evaluation",
                              content: JSON.stringify(
                                stateDelta.research_evaluation,
                              ),
                              timestamp: new Date(),
                            },
                          ]);
                        }

                        if (stateDelta.sources) {
                          setDeepResearchOutputs((prev: any) => ({
                            ...prev,
                            sources: stateDelta.sources,
                          }));
                        }
                      }

                      // Track agent author for current agent display
                      if (event.author && event.author !== "unknown") {
                        // Add thought messages for agent thinking
                        if (event.content?.parts) {
                          for (const part of event.content.parts) {
                            if (part.text) {
                              setDeepResearchMessages((prev) => [
                                ...prev,
                                {
                                  type: "thought",
                                  content: part.text,
                                  agent: event.author,
                                  stage: event.stage || "research",
                                  timestamp: new Date(),
                                },
                              ]);
                            }
                          }
                        }
                      }

                      // Track tool usage for transparency
                      if (event.tool_use) {
                        setDeepResearchMessages((prev) => [
                          ...prev,
                          {
                            type: "action",
                            content: `Using ${event.tool_use.name}: ${event.tool_use.input?.task || event.tool_use.input?.query || "Processing..."}`,
                            agent: event.author || "unknown",
                            metadata: {
                              toolName: event.tool_use.name,
                              toolInput: event.tool_use.input,
                            },
                            timestamp: new Date(),
                          },
                        ]);
                      }

                      // Update the assistant message
                      setMessages((prev) => {
                        const newMessages = [...prev];
                        if (
                          newMessages.length > 0 &&
                          newMessages[newMessages.length - 1].role ===
                            "assistant"
                        ) {
                          newMessages[newMessages.length - 1] = {
                            ...newMessages[newMessages.length - 1],
                            content: fullContent,
                            reasoning: fullReasoning,
                            reasoningTokens: reasoningTokens,
                          };
                        }
                        return newMessages;
                      });
                    } catch (e) {
                      console.error("Failed to parse SSE data:", e);
                    }
                  }
                }
              }
            }
          } finally {
            reader.releaseLock();
          }
        } else {
          console.log(">>> USING REGULAR CLAUDE CHAT <<<");
          // Use regular Claude chat endpoint
          // Convert messages to API format
          const apiMessages: ChatMessage[] = messages.map((msg) => ({
            role: msg.role as "user" | "assistant",
            content: msg.content,
          }));
          apiMessages.push({ role: "user", content: messageToSend });

          // Determine which tools to enable based on context
          const tools: string[] = [
            "text_editor",
            "create_browser_session",
            "browser_use",
            "computer_use", // Computer desktop control tool
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
            "getNursingMothers",
          ];
          if (
            messageToSend.toLowerCase().includes("bash") ||
            messageToSend.toLowerCase().includes("command")
          ) {
            tools.push("bash");
          }

          // Create assistant message placeholder
          // DO NOT add empty assistant message - wait for actual content

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

${isDeepResearch ? "DEEP RESEARCH MODE: Perform comprehensive research with multiple sources and detailed analysis." : ""}`,
          });

          // Set connected status once stream starts successfully
          setConnectionStatus("connected");

          let fullContent = "";
          let fullReasoning = "";
          // Removed console.log spam for better performance
          for await (const event of parseSSEStream(stream)) {
            // Only log in debug mode to avoid blocking main thread
            // console.log("Received event:", JSON.stringify(event))

            // Handle content block start for thinking
            if (
              event.type === "content_block_start" &&
              event.content_block?.type === "thinking"
            ) {
              // Just track that we're in a thinking block
              fullReasoning = "";
              setCurrentReasoning("");
            }
            // Handle content deltas (text)
            else if (
              event.type === "content_block_delta" &&
              event.delta?.type === "text_delta"
            ) {
              fullContent += event.delta.text || "";
              setCurrentStreamingMessage(fullContent);
            }
            // Handle thinking deltas
            else if (
              event.type === "content_block_delta" &&
              event.delta?.type === "thinking_delta"
            ) {
              const deltaText = event.delta.thinking || "";
              fullReasoning += deltaText;
              setCurrentReasoning(fullReasoning);

              // Update status to show thinking
              updateStatus({
                type: "thinking",
                message: "Analyzing and reasoning...",
                progress: undefined,
              });
            }
            // Handle signature deltas
            else if (
              event.type === "content_block_delta" &&
              event.delta?.type === "signature_delta"
            ) {
              // Signature is encrypted and we don't need to display it
              // Signature is encrypted, no need to log
            }
            // Handle tool use start
            else if (
              event.type === "content_block_start" &&
              event.content_block?.type === "tool_use"
            ) {
              // Tool started - track activity without logging
              const toolName = event.content_block.name;
              const toolInput = event.content_block.input;

              // Add thought chain for tool call
              const chainId = addToolCallChain(toolName, toolInput);

              // Update status
              updateStatus({
                type: "tool_call",
                message: `Using ${toolName.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}...`,
                progress: undefined,
              });

              // Activate agent orchestration and track activity
              setIsAgentOrchestrationActive(true);
              const agentName = getAgentNameFromTool(toolName);
              setCurrentOrchestrationAgent(agentName);

              // Add agent activity
              const activityId = addAgentActivity({
                type: mapToolNameToActivityType(toolName),
                agent: agentName,
                description: `Starting ${toolName}`,
                status: "running",
              });

              // Add tool output with pending status
              const toolId = `tool-${Date.now()}-${toolName}`;
              setToolOutputs((prev) => [
                ...prev,
                {
                  id: toolId,
                  toolName: toolName,
                  content: "Initializing...",
                  timestamp: new Date(),
                  status: "executing",
                },
              ]);

              // Store activity ID for later updates
              setToolOutputs((prev) =>
                prev.map((tool) =>
                  tool.id === toolId ? { ...tool, activityId, chainId } : tool,
                ),
              );

              // Clear browser actions when browser_use tool is detected
              if (toolName === "browser_use") {
                console.log(
                  "Browser-use tool detected, waiting for live URL...",
                );
                // Clear previous browser actions
                setBrowserActions([]);
                // Don't open the panel yet - wait for the live URL to come in browser_live_url event
              }
            }
            // Handle browser live URL - IMMEDIATE!
            else if (event.type === "browser_live_url") {
              console.log("BROWSER LIVE URL RECEIVED:", event.live_url);

              // Skip if we already have this URL to avoid redundant updates
              if (agentState.liveUrl === event.live_url) {
                console.log("LiveURL already set, skipping update");
                continue;
              }

              // Open panel with URL in one operation for faster rendering
              if (!agentState.isActive) {
                console.log(
                  "Opening browser panel with LiveURL:",
                  event.live_url,
                );
                startAgent("Claude is using browser", event.live_url);
              } else {
                // Only update URL if panel already open
                updateUrl(event.live_url);
                console.log(
                  "Browser panel already open, LiveURL updated to:",
                  event.live_url,
                );
              }
            }
            // Handle tool results
            else if (event.type === "tool_result") {
              // Tool completed - process result without logging

              // Find and update the corresponding thought chain
              const toolOutput = toolOutputs.find(
                (output) =>
                  output.toolName === event.tool_name && output.chainId,
              );
              if (toolOutput?.chainId) {
                // Extract result content
                let resultContent = "";
                try {
                  const result =
                    typeof event.result === "string"
                      ? JSON.parse(event.result)
                      : event.result;
                  if (result.error) {
                    resultContent = `Error: ${result.error}`;
                    updateThoughtChain(toolOutput.chainId, {
                      status: "error",
                      content: resultContent,
                    });
                  } else {
                    // Format the result for display
                    if (result.response) {
                      resultContent = result.response;
                    } else if (result.result) {
                      resultContent = result.result;
                    } else if (result.content) {
                      resultContent = result.content;
                    } else if (typeof result === "string") {
                      resultContent = result;
                    } else {
                      resultContent = JSON.stringify(result, null, 2);
                    }

                    updateThoughtChain(toolOutput.chainId, {
                      status: "completed",
                      content: resultContent,
                      metadata: {
                        ...toolOutput,
                        usage: result.usage,
                      },
                    });
                  }
                } catch (e) {
                  resultContent =
                    typeof event.result === "string"
                      ? event.result
                      : JSON.stringify(event.result);
                  updateThoughtChain(toolOutput.chainId, {
                    status: "completed",
                    content: resultContent,
                  });
                }
              }

              // Update agent activity to completed
              const agentName = getAgentNameFromTool(event.tool_name);
              // Find the most recent running activity for this agent and tool
              const runningActivity = agentActivities.find(
                (a) =>
                  a.agent === agentName &&
                  a.status === "running" &&
                  a.description.includes(event.tool_name),
              );
              if (runningActivity) {
                updateAgentActivity(runningActivity.id, {
                  status: "completed",
                  description: `Completed ${event.tool_name}`,
                  details:
                    typeof event.result === "object"
                      ? event.result
                      : event.result,
                });
              }

              // Create tool output bubble
              const toolId = `tool-${Date.now()}-${event.tool_name}`;
              let toolContent = "";
              let formattedResult = "";

              // Format tool results based on type
              if (event.tool_name === "browser_use") {
                const result =
                  typeof event.result === "string"
                    ? JSON.parse(event.result)
                    : event.result;

                // Update LiveURL IMMEDIATELY if browser_use tool returns one
                if (result.live_url) {
                  console.log(
                    "IMMEDIATE: Updating LiveURL from browser_use result:",
                    result.live_url,
                  );

                  // Open panel AND update URL in one go for faster rendering
                  if (!agentState.isActive) {
                    console.log(
                      "IMMEDIATE: Opening browser panel with live URL:",
                      result.live_url,
                    );
                    startAgent("Claude is using browser", result.live_url);
                  } else {
                    // Only update URL if panel already open
                    updateUrl(result.live_url);
                  }
                }

                // Parse browser actions from the result
                if (result.success && result.result) {
                  const cleanResult = result.result;

                  // Parse all ActionResults to build timeline
                  const actionRegex = /ActionResult\([^)]+\)/g;
                  const actionMatches = cleanResult.matchAll(actionRegex);

                  const newActions: any[] = [];
                  for (const match of actionMatches) {
                    const actionStr = match[0];

                    // Extract action details
                    const extractedContent = actionStr.match(
                      /extracted_content='([^']*(?:\\'[^']*)*)'/,
                    );
                    const longTermMemory = actionStr.match(
                      /long_term_memory='([^']*(?:\\'[^']*)*)'/,
                    );
                    const isDone = actionStr.includes("is_done=True");

                    const content = (
                      extractedContent?.[1] ||
                      longTermMemory?.[1] ||
                      ""
                    )
                      .replace(/\\n/g, "\n")
                      .replace(/\\'/g, "'");

                    // Determine action type and create timeline entry
                    let actionType = "search";
                    let description = content.substring(0, 100);
                    let details = content;
                    let url = null;

                    if (content.includes("Navigated to")) {
                      actionType = "navigate";
                      const urlMatch = content.match(/Navigated to (.+)/);
                      url = urlMatch?.[1];
                      description = `Navigated to ${url || "page"}`;
                    } else if (content.includes("Clicked")) {
                      actionType = "click";
                      description = content;
                    } else if (content.includes("Extracted content")) {
                      actionType = "extract";
                      description = "Extracted page content";
                      // Try to parse the JSON content
                      try {
                        const jsonMatch = content.match(/\{[\s\S]*\}/);
                        if (jsonMatch) {
                          const parsed = JSON.parse(jsonMatch[0]);
                          details = JSON.stringify(parsed, null, 2);
                        }
                      } catch (e) {
                        // Keep original if parsing fails
                      }
                    } else if (content.includes("Switched to tab")) {
                      actionType = "switch_tab";
                      description = content;
                    } else if (isDone) {
                      actionType = "complete";
                      description = "Task completed";
                      details = content;
                    }

                    if (content && content.length > 0) {
                      newActions.push({
                        id: `action-${Date.now()}-${Math.random()}`,
                        type: actionType,
                        description: description.substring(0, 100),
                        timestamp: new Date(),
                        details: details.length > 100 ? details : null,
                        url: url,
                        success: !actionStr.includes("error="),
                      });
                    }
                  }

                  // Update browser actions
                  setBrowserActions((prev) => [...prev, ...newActions]);

                  // Look for the last ActionResult with is_done=True
                  const isDoneMatch = cleanResult.match(
                    /ActionResult\(is_done=True[^)]*extracted_content='([^']*(?:\\'[^']*)*)'[^)]*\)/,
                  );

                  if (isDoneMatch && isDoneMatch[1]) {
                    // Clean up the extracted content
                    let extractedContent = isDoneMatch[1]
                      .replace(/\\n/g, "\n") // Convert \n to actual newlines
                      .replace(/\\'/g, "'") // Convert \' to '
                      .replace(/\s*-\s*\d+\s*more\s*characters$/, ""); // Remove "- 1831 more characters" suffix

                    formattedResult = `\n\n✅ **Browser task completed**\n\n${extractedContent}`;
                  } else {
                    // Try to find any meaningful text in the mess
                    const patterns = [
                      /Here is.*?(?=\n\nAttachments:|$)/, // Look for "Here is..." explanations
                      /extracted_content='([^']+)'/, // Any extracted content
                      /long_term_memory='([^']+)'/, // Memory content
                    ];

                    let found = false;
                    for (const pattern of patterns) {
                      const match = cleanResult.match(pattern);
                      if ((match && match[1]) || (match && match[0])) {
                        const content = match[1] || match[0];
                        formattedResult = `\n\n✅ **Browser task completed**\n\n${content.replace(/\\n/g, "\n").replace(/\\'/g, "'")}`;
                        found = true;
                        break;
                      }
                    }

                    if (!found) {
                      formattedResult = `\n\n✅ **Browser task completed**`;
                    }
                  }
                } else if (!result.success) {
                  formattedResult = `\n\n❌ **Browser task failed**`;
                  if (result.error) {
                    formattedResult += `\n\nError: ${result.error}`;
                  }
                } else {
                  formattedResult = `\n\n✅ **Browser task completed**`;
                }
              } else if (event.tool_name === "web_search") {
                const result =
                  typeof event.result === "string"
                    ? JSON.parse(event.result)
                    : event.result;
                formattedResult = `\n\n🔍 **Web search completed**`;
                if (result.results && Array.isArray(result.results)) {
                  formattedResult += `\n\nFound ${result.results.length} results`;
                }
              } else if (event.tool_name === "provider_search") {
                try {
                  const result =
                    typeof event.result === "string"
                      ? JSON.parse(event.result)
                      : event.result;
                  if (result && result.results) {
                    setProviderSearchData({
                      results: result.results,
                      searchQuery: result.searchQuery || "",
                    });
                  }
                  formattedResult = `\n\n✅ **Provider search completed**`;
                } catch (e) {
                  formattedResult = `\n\n❌ **Provider search failed**`;
                }
              } else if (event.tool_name === "computer_use") {
                const result =
                  typeof event.result === "string"
                    ? JSON.parse(event.result)
                    : event.result;
                formattedResult = `\n\n🖥️ **Computer control task ${result.task_completed ? "completed" : "in progress"}**`;
                if (result.final_result) {
                  formattedResult += `\n\n${result.final_result}`;
                } else if (result.error) {
                  formattedResult += `\n\nError: ${result.error}`;
                }
              } else if (event.tool_name === "claude_code_generate_tool") {
                // SDK generated tool with LiveURL
                const result =
                  typeof event.result === "string"
                    ? JSON.parse(event.result)
                    : event.result;
                setToolOutputs((prev) => [
                  ...prev,
                  {
                    id: toolId,
                    toolName: event.tool_name,
                    content: {
                      live_url: result.live_url,
                      message: result.message,
                    },
                    timestamp: new Date(),
                    status: "completed",
                  },
                ]);
                formattedResult = `\n\n✅ **Tool generated**`;
              } else if (
                event.tool_name?.startsWith("perplexity_") ||
                event.tool_name?.startsWith("pubmed_") ||
                event.tool_name?.startsWith("search") ||
                event.tool_name?.startsWith("get") ||
                event.tool_name === "clinical_operations"
              ) {
                // Parse result to get content
                try {
                  const result =
                    typeof event.result === "string"
                      ? JSON.parse(event.result)
                      : event.result;
                  if (result.error) {
                    toolContent = `Error: ${result.error}`;
                  } else if (result.result) {
                    toolContent = result.result;
                  } else if (result.content) {
                    toolContent = result.content;
                  } else if (typeof result === "string") {
                    toolContent = result;
                  } else {
                    toolContent = JSON.stringify(result, null, 2);
                  }
                } catch (e) {
                  toolContent =
                    typeof event.result === "string"
                      ? event.result
                      : JSON.stringify(event.result);
                }

                // Add tool output bubble
                setToolOutputs((prev) => [
                  ...prev,
                  {
                    id: toolId,
                    toolName: event.tool_name,
                    content: toolContent,
                    timestamp: new Date(),
                    status: "completed",
                  },
                ]);

                // Add brief mention in main message
                formattedResult = `\n\n✅ **Tool completed**`;
              } else {
                // Default formatting for other tools
                const resultText =
                  typeof event.result === "string"
                    ? event.result
                    : JSON.stringify(event.result, null, 2);
                formattedResult = `\n\n✅ **${event.tool_name} completed**`;
                if (resultText.length > 300) {
                  formattedResult += `\n\n${resultText.substring(0, 300)}...`;
                } else {
                  formattedResult += `\n\n${resultText}`;
                }
              }

              fullContent += formattedResult;
              setCurrentStreamingMessage(fullContent);
            }
            // Handle tool errors
            else if (event.type === "tool_error") {
              console.error(`Tool ${event.tool_name} error:`, event.error);

              // Update agent activity to error state
              const agentName = getAgentNameFromTool(event.tool_name);
              const runningActivity = agentActivities.find(
                (a) =>
                  a.agent === agentName &&
                  a.status === "running" &&
                  a.description.includes(event.tool_name),
              );
              if (runningActivity) {
                updateAgentActivity(runningActivity.id, {
                  status: "error",
                  description: `Error in ${event.tool_name}`,
                  details: event.error,
                });
              }

              fullContent += `\n\n❌ Tool error: ${event.error}`;
              setCurrentStreamingMessage(fullContent);
            }
            // Handle message delta with usage information
            else if (event.type === "message_delta" && event.usage) {
              // Just use the output tokens from the API
              // Thinking tokens are included in the total output_tokens
              if (event.usage.output_tokens) {
                // For now, we'll just show a placeholder or hide the token count
                // since we can't isolate thinking tokens from regular output tokens
                setReasoningTokens(0);
              }
            }
            // Handle continuation after tool use
            else if (event.type === "message_start_continuation") {
              console.log("Continuing message after tool use");
              // Don't reset the message - just continue adding to it
            }
            // Handle computer_use screenshots
            else if (event.type === "computer_screenshot") {
              console.log(
                "Computer screenshot received:",
                event.index,
                "of",
                event.total,
              );

              // Open the agent panel if not already open
              if (!agentState.isActive) {
                console.log("Opening computer use panel for screenshots");
                startAgent("Computer Use - Taking Screenshots", undefined);
              }

              // Add screenshot to browser actions timeline
              setBrowserActions((prev) => [
                ...prev,
                {
                  id: `screenshot-${Date.now()}-${event.index}`,
                  type: "screenshot",
                  description: `Screenshot ${event.index + 1} of ${event.total}`,
                  timestamp: new Date(),
                  screenshot: event.screenshot,
                  success: true,
                },
              ]);
            }
            // Handle computer_use actions
            else if (event.type === "computer_actions") {
              console.log("Computer actions received:", event.actions);

              // Convert computer actions to browser timeline format
              const newActions = event.actions.map(
                (action: any, index: number) => ({
                  id: `computer-action-${Date.now()}-${index}`,
                  type: action.action || "action",
                  description:
                    action.action === "screenshot"
                      ? "Taking screenshot"
                      : action.action === "left_click"
                        ? `Clicked at (${action.input?.coordinate?.[0]}, ${action.input?.coordinate?.[1]})`
                        : action.action === "type"
                          ? `Typed: ${action.input?.text}`
                          : action.action === "key"
                            ? `Pressed key: ${action.input?.key}`
                            : action.action === "scroll"
                              ? `Scrolled ${action.input?.scroll_direction}`
                              : action.action === "left_click_drag"
                                ? "Dragged mouse"
                                : `${action.action}`,
                  timestamp: new Date(),
                  success: true,
                }),
              );

              setBrowserActions((prev) => [...prev, ...newActions]);
            }
            // Handle computer_use thinking
            else if (event.type === "computer_thinking") {
              console.log("Computer thinking:", event.thought);

              // Add thinking to timeline
              setBrowserActions((prev) => [
                ...prev,
                {
                  id: `thinking-${Date.now()}`,
                  type: "thinking",
                  description: "Analyzing next action...",
                  details: event.thought,
                  timestamp: new Date(),
                  success: true,
                },
              ]);
            }
            // Handle agent status updates
            else if (event.type === "agent_status") {
              console.log("Agent status:", event.data);
              // Show status in UI
              if (event.data?.status === "executing_tools") {
                fullContent += `\n\n⚙️ **${event.data.message || "Processing tool requests..."}**`;
                setCurrentStreamingMessage(fullContent);
              } else if (event.data?.status === "thinking") {
                fullContent += `\n\n💭 **${event.data.message || "Analyzing results..."}**`;
                setCurrentStreamingMessage(fullContent);
              }
            }
            // Handle message completion
            else if (event.type === "message_stop") {
              console.log(
                "Message completed",
                event.data?.final ? "(final)" : "",
              );

              // Add final message to array ONLY when streaming is complete
              if (fullContent) {
                setMessages((prev) => [
                  ...prev,
                  {
                    role: "assistant",
                    content: fullContent,
                    reasoning: fullReasoning,
                    reasoningTokens: reasoningTokens,
                    timestamp: new Date(),
                  },
                ]);
              }
            }
          }
        }
      } catch (error) {
        console.error("Error calling Claude API:", error);

        // Enhanced error handling for different error types
        let errorMessage =
          "I apologize, but I encountered an error while processing your request.";
        let shouldShowRetry = false;

        if (error instanceof Error) {
          if (
            error.message.includes("net::ERR_INCOMPLETE_CHUNKED_ENCODING") ||
            error.message.includes("Network connection interrupted")
          ) {
            errorMessage =
              "The connection was interrupted. Please try sending your message again.";
            shouldShowRetry = true;
            setConnectionStatus("error");
          } else if (
            error.message.includes("timed out") ||
            error.message.includes("aborted")
          ) {
            errorMessage =
              "The request took too long to complete. Please try again with a shorter message or check your internet connection.";
            shouldShowRetry = true;
            setConnectionStatus("error");
          } else if (error.message.includes("Stream failed after")) {
            errorMessage =
              "I'm having trouble maintaining a stable connection. Please wait a moment and try again.";
            shouldShowRetry = true;
            setConnectionStatus("error");
          } else if (
            error.message.includes("429") ||
            error.message.includes("rate limit")
          ) {
            errorMessage =
              "I'm currently handling a lot of requests. Please wait a moment and try again.";
            shouldShowRetry = true;
            setConnectionStatus("error");
          } else if (
            error.message.includes("500") ||
            error.message.includes("502") ||
            error.message.includes("503") ||
            error.message.includes("504")
          ) {
            errorMessage =
              "The server is temporarily unavailable. Please try again in a few moments.";
            shouldShowRetry = true;
            setConnectionStatus("error");
          } else {
            setConnectionStatus("error");
          }
        }

        // Store the failed message for retry
        if (shouldShowRetry) {
          setLastFailedMessage(messageToSend);
          setRetryCount((prev) => prev + 1);
        }

        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              errorMessage +
              (shouldShowRetry
                ? " Click the retry button below to try again."
                : ""),
            timestamp: new Date(),
          },
        ]);

        // Clean up any active streams on error
        claudeAPI.abortAllStreams();
      } finally {
        setIsProcessing(false);
        setCurrentStreamingMessage("");
        setCurrentReasoning("");
      }
    }
  };

  // Helper functions for agent orchestration
  const addAgentActivity = (
    activity: Omit<AgentActivity, "id" | "timestamp">,
  ) => {
    const newActivity: AgentActivity = {
      ...activity,
      id: `activity-${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
    };
    setAgentActivities((prev) => [...prev, newActivity]);
    return newActivity.id;
  };

  const updateAgentActivity = (id: string, updates: Partial<AgentActivity>) => {
    setAgentActivities((prev) =>
      prev.map((activity) =>
        activity.id === id ? { ...activity, ...updates } : activity,
      ),
    );
  };

  const mapToolNameToActivityType = (
    toolName: string,
  ): AgentActivity["type"] => {
    if (toolName.startsWith("pubmed_search")) return "search";
    if (toolName.startsWith("pubmed_fetch")) return "fetch";
    if (toolName.startsWith("clinical_operations")) return "synthesis";
    if (toolName.startsWith("perplexity_")) return "analysis";
    if (toolName.startsWith("web_search")) return "search";
    return "tool";
  };

  const getAgentNameFromTool = (toolName: string): string => {
    if (toolName.startsWith("pubmed_")) return "Research Agent";
    if (toolName.startsWith("clinical_")) return "Clinical Agent";
    if (toolName.startsWith("perplexity_")) return "Analysis Agent";
    if (toolName.startsWith("web_search")) return "Web Search Agent";
    return "System Agent";
  };

  const handleRetryMessage = async () => {
    if (lastFailedMessage && !isProcessing) {
      setConnectionStatus("retry");
      console.log(
        `Retrying message (attempt ${retryCount + 1}):`,
        lastFailedMessage,
      );
      await handleSendMessage(lastFailedMessage);
    }
  };

  const renderAgentInterface = () => {
    // Show deep research progress when in deep research mode
    if (isDeepResearch && Object.keys(deepResearchOutputs).length > 0) {
      return (
        <ResearchProgressUnified
          outputs={deepResearchOutputs}
          messages={deepResearchMessages}
          currentAgent={
            deepResearchMessages.length > 0
              ? deepResearchMessages[deepResearchMessages.length - 1].content
              : undefined
          }
          isProcessing={isProcessing}
          onSendMessage={(message: string) => {
            setInputValue(message);
            handleSendMessage();
          }}
        />
      );
    }
    return null;
  };

  if (!mounted) {
    return (
      <div className="flex min-h-screen bg-background text-foreground">
        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-center min-h-screen">
            <div className="w-8 h-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <SidebarMinimal isOpen={isOpen} onOpenChange={setIsOpen} />

      <div
        className={`flex-1 flex flex-col transition-all duration-300 ease-out bg-background h-screen ${isOpen ? "ml-64" : "ml-16"}`}
      >
        <div className="md:hidden">
          <ComputerUseAgent
            isVisible={agentState.isActive}
            onClose={async () => await stopAgent()}
            task={agentState.currentTask || undefined}
            liveUrl={agentState.liveUrl || undefined}
            isMobile={true}
            browserActions={browserActions}
          />

          <div className="transition-all duration-500">
            <header className="sticky top-0 z-10 flex items-center justify-between py-4 px-4 pl-20 bg-background/95 backdrop-blur-sm border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                <h1 className="text-lg font-bold tracking-tight">Ron AI</h1>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCareTeam(!showCareTeam)}
                  className="text-xs font-medium hover:text-primary"
                >
                  Care Team
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCapturedAgents(!showCapturedAgents)}
                  className="text-xs font-medium hover:text-primary"
                >
                  Agent Outputs
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    if (agentState.isActive) {
                      await stopAgent();
                    } else {
                      try {
                        await startAgent(
                          "Computer Use Agent Active",
                          undefined,
                        );
                      } catch (error) {
                        console.error(
                          "Error starting Computer Use Agent:",
                          error,
                        );
                      }
                    }
                  }}
                  className={`text-xs font-medium hover:text-primary ${agentState.isActive ? "text-primary" : ""}`}
                >
                  <Monitor className="w-3 h-3 mr-1" />
                  {agentState.isActive ? "Close Browser" : "Open Browser"}
                </Button>
                <ThemeToggle />
              </div>
            </header>

            {showCareTeam && (
              <CareTeamPanel onClose={() => setShowCareTeam(false)} />
            )}

            {showCapturedAgents && (
              <CapturedAgentsPanel
                isVisible={showCapturedAgents}
                onClose={() => setShowCapturedAgents(false)}
              />
            )}

            <main className="flex-1 pb-24 px-4 py-6 overflow-y-auto">
              <div
                className={`mx-auto transition-all duration-500 ${
                  agentState.isActive ? "max-w-full pr-2" : "max-w-4xl"
                }`}
              >
                {messages.length === 0 ? (
                  <div className="text-center py-8 animate-fade-in">
                    <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight mb-4">
                      Your Health Advocacy{" "}
                      <span className="text-primary text-glow bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        Co-Pilot
                      </span>
                    </h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed text-lg sm:text-xl px-4 animate-fade-in-delay">
                      Get clarity and confidence in your healthcare decisions
                      with AI-powered insights and expert recommendations.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Provider Search Interface when results available (mobile) */}
                    {providerSearchData && (
                      <ProviderSearchInterface
                        data={providerSearchData}
                        userProfile={userProfile as any}
                        onDeepResearchRequested={(providers: any[]) => {
                          setIsDeepResearch(true);
                          setInputValue(
                            `Run deep research comparing: ${providers.map((p: any) => p.name).join(", ")}`,
                          );
                          handleSendMessage();
                        }}
                      />
                    )}

                    {/* Show agent orchestration */}
                    <AgentOrchestration
                      activities={agentActivities}
                      currentAgent={currentOrchestrationAgent || undefined}
                      isActive={isAgentOrchestrationActive}
                    />

                    {/* Show thinking during streaming */}
                    {isProcessing && currentReasoning && (
                      <ThinkingBubble
                        content={currentReasoning}
                        tokenCount={reasoningTokens}
                        isStreaming={true}
                        className="animate-slide-up mb-4"
                      />
                    )}

                    {/* Show tool outputs */}
                    {toolOutputs.map((output) => (
                      <div key={output.id} className="animate-slide-up mb-4">
                        {output.toolName === "clinical_operations" ? (
                          <ClinicalOperationsBubble
                            content={output.content}
                            timestamp={output.timestamp}
                            className=""
                          />
                        ) : (
                          <ToolOutputCard
                            toolName={output.toolName}
                            content={output.content}
                            timestamp={output.timestamp}
                            status={output.status}
                            className=""
                          />
                        )}
                      </div>
                    ))}

                    {messages.map((msg, i) => (
                      <div key={i} className="animate-slide-up">
                        {/* Show thinking view for messages with reasoning */}
                        {msg.role === "assistant" && msg.reasoning && (
                          <ThinkingBubble
                            content={msg.reasoning}
                            tokenCount={msg.reasoningTokens}
                            isStreaming={false}
                            className="mb-4"
                          />
                        )}
                        <EnhancedMessageBubble
                          role={msg.role}
                          content={msg.content}
                          thoughtChains={
                            msg.role === "assistant" &&
                            i === messages.length - 1
                              ? thoughtChains
                              : []
                          }
                          timestamp={msg.timestamp}
                          isStreaming={false}
                        />
                        {/* Show approval buttons for research plans */}
                        {msg.role === "assistant" &&
                          isDeepResearch &&
                          msg.content.includes("[RESEARCH]") &&
                          msg.content.includes("plan") &&
                          i === messages.length - 1 &&
                          !isProcessing && (
                            <div className="flex gap-3 mt-4 ml-12">
                              <Button
                                variant="default"
                                size="sm"
                                onClick={async () => {
                                  // Send the approval message
                                  await handleSendMessage("Looks good, run it");
                                }}
                                className="bg-primary hover:bg-primary/90"
                              >
                                ✓ Approve & Run Research
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  // Directly handle the rejection
                                  const savedInput = inputValue;
                                  setInputValue("No, please revise the plan");
                                  handleSendMessage();
                                  setInputValue(savedInput);
                                }}
                                className="border-border hover:bg-accent"
                              >
                                ✗ Revise Plan
                              </Button>
                            </div>
                          )}
                      </div>
                    ))}

                    {/* Show streaming assistant message ONLY when content arrives */}
                    {currentStreamingMessage && (
                      <div className="animate-slide-up">
                        <MessageCard
                          role="assistant"
                          content={currentStreamingMessage}
                          timestamp={new Date()}
                          isStreaming={true}
                        />
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>
                )}

                {/* Render Deep Research Interface outside of messages */}
                {renderAgentInterface()}
              </div>
            </main>

            <div className="fixed bottom-0 left-0 right-0 z-50">
              <div className="max-w-4xl mx-auto">
                <Card className="bg-card/95 backdrop-blur-xl shadow-2xl border-border/50">
                  <div className="p-4">
                    <div className="flex items-end gap-3">
                      <PromptBuilderDialog onSendPrompt={handleSendMessage} />
                      <div className="flex-1">
                        <Textarea
                          ref={inputRef}
                          value={inputValue}
                          onChange={handleInputChange}
                          placeholder="Ask about symptoms, treatments, or find a specialist..."
                          className="w-full resize-none focus-visible:ring-1 focus-visible:ring-primary/50 placeholder:text-muted-foreground/60 min-h-[50px] max-h-[120px] bg-background/50 border-border/50"
                          rows={2}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-10 w-10 border-border/50"
                        >
                          <Paperclip className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-10 w-10 border-border/50"
                        >
                          <Mic className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => handleSendMessage()}
                          size="icon"
                          className="h-10 w-10 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-lg transition-all duration-200"
                          disabled={isProcessing || !inputValue.trim()}
                        >
                          {isProcessing ? (
                            <Sparkles className="w-4 h-4 animate-pulse" />
                          ) : (
                            <ArrowUp className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 mt-2 border-t border-border">
                    {/* Connection Status and Retry Button */}
                    <div className="flex items-center gap-3">
                      {connectionStatus === "connecting" && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                          Connecting...
                        </div>
                      )}
                      {connectionStatus === "connected" && (
                        <div className="flex items-center gap-2 text-xs text-green-600">
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                          Connected
                        </div>
                      )}
                      {connectionStatus === "error" && (
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2 text-xs text-red-600">
                            <div className="w-2 h-2 rounded-full bg-red-500" />
                            Connection Error
                          </div>
                          {lastFailedMessage && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleRetryMessage}
                              disabled={isProcessing}
                              className="text-xs h-6 px-2"
                            >
                              Retry {retryCount > 1 && `(${retryCount})`}
                            </Button>
                          )}
                        </div>
                      )}
                      {connectionStatus === "retry" && (
                        <div className="flex items-center gap-2 text-xs text-blue-600">
                          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                          Retrying...
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          if (agentState.isActive) {
                            await stopAgent();
                          } else {
                            try {
                              await startAgent(
                                "Computer Use Agent Active",
                                undefined,
                              );
                            } catch (error) {
                              console.error(
                                "Error starting Computer Use Agent:",
                                error,
                              );
                            }
                          }
                        }}
                        className="text-xs font-medium hover:text-primary transition-colors duration-200"
                      >
                        <Monitor className="w-3 h-3 mr-1" />
                        {agentState.isActive ? "Close Browser" : "Browser"}
                      </Button>
                      <div className="flex items-center gap-2">
                        <BrainCircuit className="w-3 h-3 text-primary" />
                        <label
                          htmlFor="deep-research"
                          className="text-xs font-medium"
                        >
                          Deep Research
                        </label>
                        <Switch
                          id="deep-research"
                          checked={isDeepResearch}
                          onCheckedChange={(checked) => {
                            console.log(
                              "DEEP RESEARCH TOGGLE CHANGED TO:",
                              checked,
                            );
                            setIsDeepResearch(checked);
                            // Clear session when toggling off
                            if (!checked) {
                              setDeepResearchSessionId(null);
                              setDeepResearchUserId(null);
                              setDeepResearchOutputs({});
                              setDeepResearchMessages([]);
                            }
                          }}
                          className="data-[state=checked]:bg-primary scale-75"
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>

        <div className="hidden md:flex md:flex-row md:w-full">
          <div
            className={`flex flex-col transition-all duration-500 ${
              agentState.isActive ? "w-1/2" : "w-full"
            }`}
          >
            <header
              className={`fixed top-0 z-10 flex items-center justify-between py-8 px-6 pl-20 bg-background/80 backdrop-blur-sm border-b border-border transition-all duration-500 ${
                agentState.isActive ? "left-0 right-1/2" : "left-0 right-0"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="w-6 h-6 text-primary" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight">Ron AI</h1>
              </div>
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCareTeam(!showCareTeam)}
                  className="text-sm font-medium hover:text-primary"
                >
                  Care Team
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    if (agentState.isActive) {
                      await stopAgent();
                    } else {
                      try {
                        await startAgent(
                          "Computer Use Agent Active",
                          undefined,
                        );
                      } catch (error) {
                        console.error(
                          "Error starting Computer Use Agent:",
                          error,
                        );
                      }
                    }
                  }}
                  className={`text-sm font-medium hover:text-primary ${agentState.isActive ? "text-primary" : ""}`}
                >
                  <Monitor className="w-4 h-4 mr-2" />
                  {agentState.isActive ? "Close Browser" : "Open Browser"}
                </Button>
                <ThemeToggle />
              </div>
            </header>

            {showCareTeam && (
              <CareTeamPanel onClose={() => setShowCareTeam(false)} />
            )}

            <main className="flex-1 pb-32 pt-32 overflow-y-auto">
              <div className="container max-w-7xl mx-auto px-6">
                {messages.length === 0 ? (
                  <div className="text-center ml-px mb-0 py-0 animate-fade-in mt-0">
                    <h2 className="leading-tight font-bold tracking-tight mx-2.5 py-0 text-7xl">
                      Your Health Advocacy{" "}
                      <span className="text-primary text-glow bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        Co-Pilot
                      </span>
                    </h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed px-0 text-2xl mt-0 mb-0 py-[19px] animate-fade-in-delay">
                      Get clarity and confidence in your healthcare decisions
                      with AI-powered insights and expert recommendations.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-12">
                    {/* Provider Search Interface when results available */}
                    {providerSearchData && (
                      <ProviderSearchInterface
                        data={providerSearchData}
                        userProfile={userProfile as any}
                        onDeepResearchRequested={(
                          providers: ProviderSearchResult[],
                        ) => {
                          // Let user know we're starting deep research
                          setIsDeepResearch(true);
                          setInputValue(
                            `Run deep research comparing: ${providers.map((p) => p.name).join(", ")}`,
                          );
                          handleSendMessage();
                        }}
                      />
                    )}
                    {/* Show thinking during streaming */}
                    {isProcessing && currentReasoning && (
                      <ThinkingBubble
                        content={currentReasoning}
                        tokenCount={reasoningTokens}
                        isStreaming={true}
                        className="animate-slide-up mb-6"
                      />
                    )}

                    {/* Show tool outputs */}
                    {toolOutputs.map((output) => (
                      <div key={output.id} className="animate-slide-up mb-6">
                        {output.toolName === "clinical_operations" ? (
                          <ClinicalOperationsBubble
                            content={output.content}
                            timestamp={output.timestamp}
                            className=""
                          />
                        ) : (
                          <ToolOutputCard
                            toolName={output.toolName}
                            content={output.content}
                            timestamp={output.timestamp}
                            status={output.status}
                            className=""
                          />
                        )}
                      </div>
                    ))}

                    {/* Show code preview if available */}
                    {codeFiles.length > 0 && (
                      <div className="animate-slide-up mb-6">
                        <ClaudeCodePreview
                          files={codeFiles}
                          output={codeOutput}
                          className=""
                        />
                      </div>
                    )}

                    {isProcessing &&
                      !currentReasoning &&
                      toolOutputs.length === 0 && (
                        <AgentStatusIndicator
                          currentAgent={{
                            type: "general",
                            name: isDeepResearch
                              ? "Deep Research Agent"
                              : "Claude Sonnet 4",
                            description: isDeepResearch
                              ? "Conducting comprehensive research..."
                              : "Processing your request...",
                          }}
                          status="processing"
                        />
                      )}

                    {messages.map((msg, i) => (
                      <div key={i} className="animate-slide-up">
                        {/* Show thinking view for messages with reasoning */}
                        {msg.role === "assistant" && msg.reasoning && (
                          <ThinkingBubble
                            content={msg.reasoning}
                            tokenCount={msg.reasoningTokens}
                            isStreaming={false}
                            className="mb-6"
                          />
                        )}
                        <EnhancedMessageBubble
                          role={msg.role}
                          content={msg.content}
                          thoughtChains={
                            msg.role === "assistant" &&
                            i === messages.length - 1
                              ? thoughtChains
                              : []
                          }
                          timestamp={msg.timestamp}
                          isStreaming={false}
                        />
                        {/* Show approval buttons for research plans */}
                        {msg.role === "assistant" &&
                          isDeepResearch &&
                          msg.content.includes("[RESEARCH]") &&
                          msg.content.includes("plan") &&
                          i === messages.length - 1 &&
                          !isProcessing && (
                            <div className="flex gap-4 mt-6 ml-16">
                              <Button
                                variant="default"
                                size="default"
                                onClick={() => {
                                  // Directly handle the approval
                                  const savedInput = inputValue;
                                  setInputValue("Looks good, run it");
                                  handleSendMessage();
                                  setInputValue(savedInput);
                                }}
                                className="bg-primary hover:bg-primary/90"
                              >
                                ✓ Approve & Run Research
                              </Button>
                              <Button
                                variant="outline"
                                size="default"
                                onClick={() => {
                                  // Directly handle the rejection
                                  const savedInput = inputValue;
                                  setInputValue("No, please revise the plan");
                                  handleSendMessage();
                                  setInputValue(savedInput);
                                }}
                                className="border-border hover:bg-accent"
                              >
                                ✗ Revise Plan
                              </Button>
                            </div>
                          )}
                      </div>
                    ))}

                    {/* Show streaming assistant message ONLY when content arrives - DESKTOP */}
                    {currentStreamingMessage && (
                      <div className="animate-slide-up">
                        <MessageCard
                          role="assistant"
                          content={currentStreamingMessage}
                          timestamp={new Date()}
                          isStreaming={true}
                        />
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>
                )}

                {/* Render Deep Research Interface outside of messages */}
                {renderAgentInterface()}
              </div>
            </main>

            <div
              className={`fixed bottom-0 transition-all duration-300 z-50 ${
                agentState.isActive ? "left-0 right-1/2" : "left-0 right-0"
              } ${isOpen ? "ml-64" : "ml-16"}`}
            >
              <div className="container max-w-5xl mx-auto">
                <Card className="bg-card/95 backdrop-blur-xl shadow-2xl border-border/50">
                  <div className="p-6">
                    <div className="flex items-end gap-4">
                      <PromptBuilderDialog onSendPrompt={handleSendMessage} />
                      <div className="flex-1">
                        <Textarea
                          ref={inputRef}
                          value={inputValue}
                          onChange={handleInputChange}
                          placeholder="Ask about symptoms, treatments, or find a specialist..."
                          className="w-full text-base resize-none focus-visible:ring-1 focus-visible:ring-primary/50 placeholder:text-muted-foreground/60 min-h-[60px] max-h-[150px] bg-background/50 border-border/50"
                          rows={2}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-12 w-12 border-border/50"
                        >
                          <Paperclip className="w-5 h-5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-12 w-12 border-border/50"
                        >
                          <Mic className="w-5 h-5" />
                        </Button>
                        <Button
                          onClick={() => handleSendMessage()}
                          size="icon"
                          className="h-12 w-12 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-lg transition-all duration-200"
                          disabled={isProcessing || !inputValue.trim()}
                        >
                          {isProcessing ? (
                            <Sparkles className="w-5 h-5 animate-pulse" />
                          ) : (
                            <ArrowUp className="w-5 h-5" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 mt-4 border-t border-border">
                    <div className="flex items-center gap-6">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          if (agentState.isActive) {
                            await stopAgent();
                          } else {
                            try {
                              await startAgent(
                                "Computer Use Agent Active",
                                undefined,
                              );
                            } catch (error) {
                              console.error(
                                "Error starting Computer Use Agent:",
                                error,
                              );
                            }
                          }
                        }}
                        className="text-sm font-medium hover:text-primary transition-colors duration-200"
                      >
                        <Monitor className="w-4 h-4 mr-2" />
                        {agentState.isActive ? "Close Browser" : "Browser"}
                      </Button>
                      <div className="flex items-center gap-3">
                        <BrainCircuit className="w-5 h-5 text-primary" />
                        <label
                          htmlFor="deep-research"
                          className="text-sm font-medium"
                        >
                          Deep Research
                        </label>
                        <Switch
                          id="deep-research"
                          checked={isDeepResearch}
                          onCheckedChange={(checked) => {
                            console.log(
                              "DEEP RESEARCH TOGGLE CHANGED TO (DESKTOP):",
                              checked,
                            );
                            setIsDeepResearch(checked);
                            // Clear session when toggling off
                            if (!checked) {
                              setDeepResearchSessionId(null);
                              setDeepResearchUserId(null);
                              setDeepResearchOutputs({});
                              setDeepResearchMessages([]);
                            }
                          }}
                          className="data-[state=checked]:bg-primary shadow-xl"
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>

          {agentState.isActive && (
            <div className="w-1/2 fixed right-0 top-0 bottom-0 z-40">
              <ComputerUseAgent
                isVisible={true}
                onClose={async () => await stopAgent()}
                task={agentState.currentTask || undefined}
                liveUrl={agentState.liveUrl || undefined}
                isMobile={false}
                browserActions={browserActions}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

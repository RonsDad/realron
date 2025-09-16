import { useState, useCallback } from "react";

export interface ThoughtChain {
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
    usage?: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };
  };
  subChains?: ThoughtChain[];
  parentId?: string;
}

interface CurrentStatus {
  type: "thinking" | "tool_call" | "subagent" | "writing";
  message: string;
  progress?: number;
}

export function useThoughtChainTracker() {
  const [thoughtChains, setThoughtChains] = useState<ThoughtChain[]>([]);
  const [currentStatus, setCurrentStatus] = useState<CurrentStatus | null>(
    null,
  );
  const [activeChains, setActiveChains] = useState<Set<string>>(new Set());

  const generateChainId = () =>
    `chain-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const addThoughtChain = useCallback(
    (chain: Omit<ThoughtChain, "id" | "timestamp">) => {
      const newChain: ThoughtChain = {
        ...chain,
        id: generateChainId(),
        timestamp: new Date(),
      };

      setThoughtChains((prev) => {
        if (chain.parentId) {
          // Add as sub-chain
          return prev.map((existingChain) => {
            if (existingChain.id === chain.parentId) {
              return {
                ...existingChain,
                subChains: [...(existingChain.subChains || []), newChain],
              };
            }
            return existingChain;
          });
        } else {
          // Add as top-level chain
          return [...prev, newChain];
        }
      });

      if (chain.status === "running") {
        setActiveChains((prev) => new Set([...prev, newChain.id]));
      }

      return newChain.id;
    },
    [],
  );

  const updateThoughtChain = useCallback(
    (chainId: string, updates: Partial<ThoughtChain>) => {
      setThoughtChains((prev) => {
        const updateChain = (chains: ThoughtChain[]): ThoughtChain[] => {
          return chains.map((chain) => {
            if (chain.id === chainId) {
              const updatedChain = { ...chain, ...updates };

              // Calculate duration if status is completed and we have a start time
              if (updates.status === "completed" && !chain.duration) {
                updatedChain.duration = Date.now() - chain.timestamp.getTime();
              }

              return updatedChain;
            }

            // Check sub-chains recursively
            if (chain.subChains) {
              return {
                ...chain,
                subChains: updateChain(chain.subChains),
              };
            }

            return chain;
          });
        };

        return updateChain(prev);
      });

      // Remove from active chains if completed or error
      if (updates.status === "completed" || updates.status === "error") {
        setActiveChains((prev) => {
          const newSet = new Set(prev);
          newSet.delete(chainId);
          return newSet;
        });
      }
    },
    [],
  );

  const addThinkingChain = useCallback(
    (content: string, tokenCount?: number) => {
      return addThoughtChain({
        type: "thinking",
        title: "Analyzing and reasoning...",
        content,
        status: "running",
        metadata: { tokenCount },
      });
    },
    [addThoughtChain],
  );

  const addToolCallChain = useCallback(
    (toolName: string, input?: any, parentId?: string) => {
      const title = getToolTitle(toolName);
      return addThoughtChain({
        type: "tool_call",
        title,
        content: input
          ? `Input: ${JSON.stringify(input, null, 2)}`
          : "Executing tool...",
        status: "running",
        metadata: { toolName },
        parentId,
      });
    },
    [addThoughtChain],
  );

  const addSubagentChain = useCallback(
    (subagentName: string, task: string, parentId?: string) => {
      return addThoughtChain({
        type: "subagent",
        title: `${subagentName} Subagent`,
        content: `Task: ${task}`,
        status: "running",
        metadata: { subagentName },
        parentId,
      });
    },
    [addThoughtChain],
  );

  const addMCPCallChain = useCallback(
    (mcpServer: string, method: string, params?: any, parentId?: string) => {
      return addThoughtChain({
        type: "mcp_call",
        title: `${mcpServer} MCP Call`,
        content: `Method: ${method}\n${params ? `Params: ${JSON.stringify(params, null, 2)}` : ""}`,
        status: "running",
        metadata: { mcpServer },
        parentId,
      });
    },
    [addThoughtChain],
  );

  const updateStatus = useCallback((status: CurrentStatus | null) => {
    setCurrentStatus(status);
  }, []);

  const clearThoughtChains = useCallback(() => {
    setThoughtChains([]);
    setActiveChains(new Set());
    setCurrentStatus(null);
  }, []);

  const getToolTitle = (toolName: string): string => {
    const toolTitles: Record<string, string> = {
      // Clinical tools
      clinical_operations: "Consulting Clinical Operations Agent",

      // Research tools
      pubmed_search: "Searching PubMed Database",
      pubmed_fetch_abstracts: "Fetching Research Abstracts",
      pubmed_fetch_summaries: "Retrieving Article Summaries",
      pubmed_fetch_related: "Finding Related Studies",

      // Perplexity tools
      perplexity_sonar_pro: "Real-time Web Search",
      perplexity_reasoning_pro: "Advanced Reasoning Analysis",
      perplexity_deep_research: "Deep Research Investigation",

      // Browser tools
      browser_use: "Automated Browser Navigation",
      create_browser_session: "Initializing Browser Session",
      reuse_browser_session: "Resuming Browser Session",

      // FDA tools
      searchDrugLabel: "Searching FDA Drug Labels",
      searchAdverseEffects: "Checking Adverse Effects",
      getDrugInteractions: "Analyzing Drug Interactions",
      getBoxedWarning: "Retrieving Safety Warnings",

      // Computer tools
      computer_use: "Desktop Automation",
      code_execution: "Executing Code",
      text_editor: "Text Processing",
      web_search: "Web Search",
    };

    return (
      toolTitles[toolName] ||
      `Using ${toolName.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}`
    );
  };

  return {
    thoughtChains,
    currentStatus,
    activeChains,
    addThoughtChain,
    updateThoughtChain,
    addThinkingChain,
    addToolCallChain,
    addSubagentChain,
    addMCPCallChain,
    updateStatus,
    clearThoughtChains,
  };
}

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronDown,
  ChevronRight,
  Activity,
  Brain,
  FileText,
  Clock,
} from "lucide-react";

interface CapturedAgent {
  agent_id: string;
  agent_type: string;
  output_preview: string;
  timestamp: string;
  session_id: string;
  events_count: number;
  has_output: boolean;
  has_json: boolean;
  source: "database" | "file";
}

interface AgentOutput {
  agent_id: string;
  agent_type: string;
  output_text: string;
  output_json: any;
  tools_used: any[];
  events_data: any[];
  thinking_content: string;
  timestamp: string;
  session_id: string;
}

interface CapturedAgentsPanelProps {
  isVisible: boolean;
  onClose: () => void;
}

export function CapturedAgentsPanel({
  isVisible,
  onClose,
}: CapturedAgentsPanelProps) {
  const [agents, setAgents] = useState<CapturedAgent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<AgentOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
  const [wsConnection, setWsConnection] = useState<WebSocket | null>(null);

  // Fetch agent outputs
  const fetchAgentOutputs = async () => {
    try {
      setLoading(true);
      const response = await fetch("/v1/agent-outputs");
      if (response.ok) {
        const data = await response.json();
        setAgents(data.outputs || []);
      }
    } catch (error) {
      console.error("Failed to fetch agent outputs:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch specific agent details
  const fetchAgentDetails = async (agentId: string) => {
    try {
      const response = await fetch(`/v1/agent-outputs/${agentId}`);
      if (response.ok) {
        const agentOutput = await response.json();
        setSelectedAgent(agentOutput);
      }
    } catch (error) {
      console.error("Failed to fetch agent details:", error);
    }
  };

  // Setup WebSocket connection for real-time updates
  useEffect(() => {
    if (isVisible && !wsConnection) {
      const ws = new WebSocket("ws://localhost:8000/ws/agent_streaming");

      ws.onopen = () => {
        console.log("Connected to agent streaming WebSocket");
        setWsConnection(ws);
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === "agent_output") {
          // Refresh agent list when new output arrives
          fetchAgentOutputs();
        }
      };

      ws.onclose = () => {
        console.log("Agent streaming WebSocket closed");
        setWsConnection(null);
      };

      return () => {
        ws.close();
      };
    }
  }, [isVisible, wsConnection]);

  // Initial fetch and periodic refresh
  useEffect(() => {
    if (isVisible) {
      fetchAgentOutputs();
      const interval = setInterval(fetchAgentOutputs, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [isVisible]);

  const formatAgentType = (type: string) => {
    return type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleString();
    } catch {
      return timestamp;
    }
  };

  const getAgentTypeIcon = (type: string) => {
    if (type.includes("clinical")) return <Activity className="w-4 h-4" />;
    if (type.includes("research")) return <Brain className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  const getAgentTypeColor = (type: string) => {
    if (type.includes("clinical"))
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    if (type.includes("insurance"))
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    if (type.includes("patient"))
      return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
    if (type.includes("pharmacy"))
      return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
    if (type.includes("appeals"))
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
      <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-background border-l border-border">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-lg font-semibold">Captured Agent Outputs</h2>
            <div className="flex items-center gap-2">
              {wsConnection && (
                <Badge variant="outline" className="text-green-600">
                  Live
                </Badge>
              )}
              <Button variant="ghost" size="sm" onClick={onClose}>
                ×
              </Button>
            </div>
          </div>

          <div className="flex flex-1 min-h-0">
            {/* Agent List */}
            <div className="w-1/2 border-r border-border">
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium">
                    Available Agents ({agents.length})
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchAgentOutputs}
                    disabled={loading}
                  >
                    {loading ? "Loading..." : "Refresh"}
                  </Button>
                </div>

                <ScrollArea className="h-[calc(100vh-200px)]">
                  <div className="space-y-2">
                    {agents.map((agent) => (
                      <Card
                        key={agent.agent_id}
                        className={`cursor-pointer transition-colors ${
                          selectedAgent?.agent_id === agent.agent_id
                            ? "bg-primary/5 border-primary/20"
                            : "hover:bg-muted/50"
                        }`}
                        onClick={() => fetchAgentDetails(agent.agent_id)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {getAgentTypeIcon(agent.agent_type)}
                              <span className="font-medium text-sm">
                                {agent.agent_id}
                              </span>
                            </div>
                            <Badge
                              className={`text-xs ${getAgentTypeColor(agent.agent_type)}`}
                            >
                              {formatAgentType(agent.agent_type)}
                            </Badge>
                          </div>

                          <p className="text-xs text-muted-foreground mb-2">
                            {agent.output_preview}
                          </p>

                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatTimestamp(agent.timestamp)}
                            </div>
                            <span>{agent.events_count} events</span>
                            <Badge variant="outline" className="text-xs">
                              {agent.source}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>

            {/* Agent Details */}
            <div className="w-1/2">
              {selectedAgent ? (
                <div className="p-4">
                  <div className="mb-4">
                    <h3 className="font-semibold mb-2">
                      {selectedAgent.agent_id}
                    </h3>
                    <Badge
                      className={getAgentTypeColor(selectedAgent.agent_type)}
                    >
                      {formatAgentType(selectedAgent.agent_type)}
                    </Badge>
                  </div>

                  <ScrollArea className="h-[calc(100vh-250px)]">
                    <div className="space-y-4">
                      {/* Output Text */}
                      {selectedAgent.output_text && (
                        <Collapsible>
                          <CollapsibleTrigger asChild>
                            <Button
                              variant="ghost"
                              className="justify-between w-full p-0"
                            >
                              <span className="font-medium">Output Text</span>
                              <ChevronRight className="w-4 h-4" />
                            </Button>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <Card>
                              <CardContent className="p-3">
                                <pre className="whitespace-pre-wrap text-sm">
                                  {selectedAgent.output_text}
                                </pre>
                              </CardContent>
                            </Card>
                          </CollapsibleContent>
                        </Collapsible>
                      )}

                      {/* JSON Data */}
                      {selectedAgent.output_json &&
                        Object.keys(selectedAgent.output_json).length > 0 && (
                          <Collapsible>
                            <CollapsibleTrigger asChild>
                              <Button
                                variant="ghost"
                                className="justify-between w-full p-0"
                              >
                                <span className="font-medium">JSON Data</span>
                                <ChevronRight className="w-4 h-4" />
                              </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <Card>
                                <CardContent className="p-3">
                                  <pre className="text-xs overflow-x-auto">
                                    {JSON.stringify(
                                      selectedAgent.output_json,
                                      null,
                                      2,
                                    )}
                                  </pre>
                                </CardContent>
                              </Card>
                            </CollapsibleContent>
                          </Collapsible>
                        )}

                      {/* Tools Used */}
                      {selectedAgent.tools_used &&
                        selectedAgent.tools_used.length > 0 && (
                          <Collapsible>
                            <CollapsibleTrigger asChild>
                              <Button
                                variant="ghost"
                                className="justify-between w-full p-0"
                              >
                                <span className="font-medium">
                                  Tools Used ({selectedAgent.tools_used.length})
                                </span>
                                <ChevronRight className="w-4 h-4" />
                              </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <Card>
                                <CardContent className="p-3">
                                  <div className="space-y-2">
                                    {selectedAgent.tools_used.map(
                                      (tool, index) => (
                                        <div key={index} className="text-sm">
                                          <strong>
                                            {tool.tool_name || "Unknown Tool"}
                                          </strong>
                                          {tool.result && (
                                            <pre className="mt-1 text-xs text-muted-foreground whitespace-pre-wrap">
                                              {typeof tool.result === "string"
                                                ? tool.result
                                                : JSON.stringify(
                                                    tool.result,
                                                    null,
                                                    2,
                                                  )}
                                            </pre>
                                          )}
                                        </div>
                                      ),
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            </CollapsibleContent>
                          </Collapsible>
                        )}

                      {/* Events */}
                      {selectedAgent.events_data &&
                        selectedAgent.events_data.length > 0 && (
                          <Collapsible>
                            <CollapsibleTrigger asChild>
                              <Button
                                variant="ghost"
                                className="justify-between w-full p-0"
                              >
                                <span className="font-medium">
                                  Events ({selectedAgent.events_data.length})
                                </span>
                                <ChevronRight className="w-4 h-4" />
                              </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <Card>
                                <CardContent className="p-3">
                                  <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {selectedAgent.events_data.map(
                                      (event, index) => (
                                        <div
                                          key={index}
                                          className="text-xs border-b pb-1"
                                        >
                                          <div className="font-medium">
                                            {event.type || "Unknown Event"}
                                          </div>
                                          <pre className="text-muted-foreground whitespace-pre-wrap">
                                            {JSON.stringify(event, null, 2)}
                                          </pre>
                                        </div>
                                      ),
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            </CollapsibleContent>
                          </Collapsible>
                        )}

                      {/* Thinking Content */}
                      {selectedAgent.thinking_content && (
                        <Collapsible>
                          <CollapsibleTrigger asChild>
                            <Button
                              variant="ghost"
                              className="justify-between w-full p-0"
                            >
                              <span className="font-medium">
                                Agent Thinking
                              </span>
                              <ChevronRight className="w-4 h-4" />
                            </Button>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <Card>
                              <CardContent className="p-3">
                                <pre className="whitespace-pre-wrap text-xs">
                                  {selectedAgent.thinking_content}
                                </pre>
                              </CardContent>
                            </Card>
                          </CollapsibleContent>
                        </Collapsible>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Select an agent to view details
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

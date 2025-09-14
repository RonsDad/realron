import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Activity,
  Brain,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
  Trash2,
  Users,
  Zap,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

interface AgentSession {
  session_id: string;
  agent_id: string;
  status: "active" | "completed" | "error" | "cleaned";
  start_time: string;
  end_time?: string;
  tool_calls_count: number;
  events_count: number;
}

interface SubAgentEvent {
  type: string;
  agent_id: string;
  timestamp: string;
  data?: any;
}

interface AgentSessionMonitorProps {
  sessions?: AgentSession[];
  events?: SubAgentEvent[];
  onRefresh?: () => void;
  onEndAllSessions?: () => void;
  onCleanupAgent?: (agentId: string) => void;
  isVisible?: boolean;
}

export const AgentSessionMonitor: React.FC<AgentSessionMonitorProps> = ({
  sessions = [],
  events = [],
  onRefresh,
  onEndAllSessions,
  onCleanupAgent,
  isVisible = true,
}) => {
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(
    new Set(),
  );
  const [showEvents, setShowEvents] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Auto-refresh every 5 seconds when enabled
  useEffect(() => {
    if (autoRefresh && onRefresh) {
      const interval = setInterval(onRefresh, 5000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, onRefresh]);

  const toggleSessionExpand = (sessionId: string) => {
    const newExpanded = new Set(expandedSessions);
    if (newExpanded.has(sessionId)) {
      newExpanded.delete(sessionId);
    } else {
      newExpanded.add(sessionId);
    }
    setExpandedSessions(newExpanded);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "blue";
      case "completed":
        return "green";
      case "error":
        return "red";
      case "cleaned":
        return "gray";
      default:
        return "gray";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <Clock className="h-3 w-3" />;
      case "completed":
        return <CheckCircle className="h-3 w-3" />;
      case "error":
        return <XCircle className="h-3 w-3" />;
      case "cleaned":
        return <Trash2 className="h-3 w-3" />;
      default:
        return <Activity className="h-3 w-3" />;
    }
  };

  const activeSessions = sessions.filter((s) => s.status === "active");
  const completedSessions = sessions.filter((s) => s.status === "completed");
  const errorSessions = sessions.filter((s) => s.status === "error");

  if (!isVisible) return null;

  return (
    <Card className="mb-4 border-purple-200 bg-gradient-to-r from-purple-50/50 to-blue-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-purple-900">
            <Users className="h-5 w-5" />
            Subagent Session Monitor
            {sessions.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {sessions.length} sessions
              </Badge>
            )}
          </CardTitle>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowEvents(!showEvents)}
              className="h-8"
            >
              {showEvents ? (
                <EyeOff className="h-3 w-3 mr-1" />
              ) : (
                <Eye className="h-3 w-3 mr-1" />
              )}
              {showEvents ? "Hide" : "Show"} Events
            </Button>

            <Button
              size="sm"
              variant={autoRefresh ? "secondary" : "outline"}
              onClick={() => setAutoRefresh(!autoRefresh)}
              className="h-8"
            >
              <RefreshCw
                className={`h-3 w-3 mr-1 ${autoRefresh ? "animate-spin" : ""}`}
              />
              Auto
            </Button>

            {onRefresh && (
              <Button
                size="sm"
                variant="outline"
                onClick={onRefresh}
                className="h-8"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Refresh
              </Button>
            )}

            {onEndAllSessions && sessions.length > 0 && (
              <Button
                size="sm"
                variant="destructive"
                onClick={onEndAllSessions}
                className="h-8"
              >
                <XCircle className="h-3 w-3 mr-1" />
                End All
              </Button>
            )}
          </div>
        </div>

        {/* Session Statistics */}
        <div className="flex gap-4 mt-3 text-sm">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-blue-600" />
            <span className="text-gray-700">
              Active: {activeSessions.length}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3 text-green-600" />
            <span className="text-gray-700">
              Completed: {completedSessions.length}
            </span>
          </div>
          {errorSessions.length > 0 && (
            <div className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-red-600" />
              <span className="text-gray-700">
                Errors: {errorSessions.length}
              </span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {sessions.length === 0 ? (
          <Alert>
            <Activity className="h-4 w-4" />
            <AlertTitle>No Active Sessions</AlertTitle>
            <AlertDescription>
              Subagent sessions will appear here when agents are spawned and
              executed.
            </AlertDescription>
          </Alert>
        ) : (
          <ScrollArea className="h-64">
            <div className="space-y-2">
              {sessions.map((session) => {
                const isExpanded = expandedSessions.has(session.session_id);
                const sessionEvents = events.filter(
                  (e) =>
                    e.agent_id === session.agent_id ||
                    e.data?.session_id === session.session_id,
                );

                return (
                  <div
                    key={session.session_id}
                    className={`border rounded-lg p-3 transition-all ${
                      session.status === "active"
                        ? "border-blue-300 bg-blue-50"
                        : session.status === "completed"
                          ? "border-green-300 bg-green-50"
                          : session.status === "error"
                            ? "border-red-300 bg-red-50"
                            : "border-gray-300 bg-gray-50"
                    }`}
                  >
                    <div
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => toggleSessionExpand(session.session_id)}
                    >
                      <div className="flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        <Brain className="h-4 w-4 text-purple-600" />
                        <span className="font-medium text-sm">
                          {session.agent_id}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            getStatusColor(session.status) === "blue"
                              ? "border-blue-300 text-blue-700"
                              : getStatusColor(session.status) === "green"
                                ? "border-green-300 text-green-700"
                                : getStatusColor(session.status) === "red"
                                  ? "border-red-300 text-red-700"
                                  : "border-gray-300 text-gray-700"
                          }`}
                        >
                          {getStatusIcon(session.status)}
                          <span className="ml-1">{session.status}</span>
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2">
                        {session.tool_calls_count > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            <Zap className="h-3 w-3 mr-1" />
                            {session.tool_calls_count} tools
                          </Badge>
                        )}

                        {session.events_count > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            <Activity className="h-3 w-3 mr-1" />
                            {session.events_count} events
                          </Badge>
                        )}

                        {onCleanupAgent && session.status === "completed" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              onCleanupAgent(session.agent_id);
                            }}
                            className="h-7 px-2"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-3 pl-6 space-y-2 text-xs">
                        <div className="text-gray-600">
                          <p>Session ID: {session.session_id}</p>
                          <p>
                            Started:{" "}
                            {new Date(session.start_time).toLocaleTimeString()}
                          </p>
                          {session.end_time && (
                            <p>
                              Ended:{" "}
                              {new Date(session.end_time).toLocaleTimeString()}
                            </p>
                          )}
                        </div>

                        {showEvents && sessionEvents.length > 0 && (
                          <div className="mt-2">
                            <p className="font-medium text-gray-700 mb-1">
                              Recent Events:
                            </p>
                            <div className="space-y-1">
                              {sessionEvents.slice(-5).map((event, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-start gap-2 text-gray-600"
                                >
                                  <span className="text-gray-400">•</span>
                                  <span>
                                    {event.type}:{" "}
                                    {JSON.stringify(event.data).substring(
                                      0,
                                      100,
                                    )}
                                    ...
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}

        {/* Warning for stuck sessions */}
        {activeSessions.some((s) => {
          const startTime = new Date(s.start_time);
          const now = new Date();
          const minutesActive =
            (now.getTime() - startTime.getTime()) / (1000 * 60);
          return minutesActive > 10; // Sessions active for more than 10 minutes
        }) && (
          <Alert className="mt-3" variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Long-Running Sessions Detected</AlertTitle>
            <AlertDescription>
              Some sessions have been active for more than 10 minutes. Consider
              ending them to free resources.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default AgentSessionMonitor;

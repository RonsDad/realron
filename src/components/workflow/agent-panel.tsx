"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import {
  Loader2,
  Bot,
  Stethoscope,
  Database,
  Microscope,
  Brain,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { AgentState } from "./workflow-types";

interface AgentPanelProps {
  agents: Record<string, AgentState>;
  onAgentClick?: (agentId: string, agent: AgentState) => void;
}

const getAgentIcon = (type: string) => {
  switch (type) {
    case "clinical":
      return Stethoscope;
    case "research":
      return Database;
    case "analysis":
      return Microscope;
    case "coordination":
      return Bot;
    case "synthesis":
      return Brain;
    default:
      return Activity;
  }
};

export function AgentPanel({ agents, onAgentClick }: AgentPanelProps) {
  const [collapsedAgents, setCollapsedAgents] = useState<Set<string>>(
    new Set(),
  );

  const toggleAgentCollapse = (agentId: string) => {
    setCollapsedAgents((prev) => {
      const next = new Set(prev);
      if (next.has(agentId)) {
        next.delete(agentId);
      } else {
        next.add(agentId);
      }
      return next;
    });
  };

  if (Object.keys(agents).length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
        <Bot className="w-4 h-4" />
        Active Agents ({Object.keys(agents).length})
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {Object.entries(agents).map(([id, agent]) => {
          const Icon = getAgentIcon(agent.type);
          const isCollapsed = collapsedAgents.has(id);

          return (
            <motion.div
              key={id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "p-3 rounded-lg border transition-all cursor-pointer",
                agent.status === "running" &&
                  "bg-blue-50 border-blue-200 shadow-sm",
                agent.status === "completed" && "bg-green-50 border-green-200",
                agent.status === "error" && "bg-red-50 border-red-200",
                agent.status === "idle" && "bg-slate-50 border-slate-200",
              )}
              onClick={() => {
                toggleAgentCollapse(id);
                onAgentClick?.(id, agent);
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Icon
                    className={cn(
                      "w-4 h-4",
                      agent.status === "running" &&
                        "text-blue-600 animate-pulse",
                      agent.status === "completed" && "text-green-600",
                      agent.status === "error" && "text-red-600",
                      agent.status === "idle" && "text-slate-600",
                    )}
                  />
                  <span className="font-medium text-sm">{agent.name}</span>
                </div>
                <Badge
                  variant={
                    agent.status === "running"
                      ? "default"
                      : agent.status === "completed"
                        ? "outline"
                        : agent.status === "error"
                          ? "destructive"
                          : "secondary"
                  }
                  className="text-xs"
                >
                  {agent.status === "running" && (
                    <Loader2 className="w-2 h-2 mr-1 animate-spin" />
                  )}
                  {agent.status}
                </Badge>
              </div>

              {agent.totalActivities > 0 && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>
                      {agent.completedActivities}/{agent.totalActivities} tasks
                    </span>
                    <span>
                      {Math.round(
                        (agent.completedActivities / agent.totalActivities) *
                          100,
                      )}
                      %
                    </span>
                  </div>
                  <Progress
                    value={
                      (agent.completedActivities / agent.totalActivities) * 100
                    }
                    className="h-1"
                  />
                </div>
              )}

              {agent.currentActivity && !isCollapsed && (
                <div className="mt-2 text-xs text-muted-foreground truncate">
                  Current: {agent.currentActivity}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronDown,
  ChevronRight,
  Loader2,
  CheckCircle,
  AlertCircle,
  PlayCircle,
  Stethoscope,
  Database,
  Bot,
  Brain,
  Search,
  Globe,
  Zap,
  Activity,
  Microscope,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { WorkflowPhase, WorkflowActivity, phaseConfig } from "./workflow-types";

interface PhaseSectionProps {
  phase: WorkflowPhase;
  activities: WorkflowActivity[];
  isCurrentPhase?: boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onActivityClick?: (activity: WorkflowActivity) => void;
}

const getActivityIcon = (type: string, toolName?: string) => {
  if (toolName?.includes("pubmed")) return Database;
  if (toolName?.includes("clinical")) return Stethoscope;
  if (toolName?.includes("browser")) return Globe;
  if (toolName?.includes("search")) return Search;

  switch (type) {
    case "search":
      return Search;
    case "fetch":
      return Database;
    case "analysis":
      return Microscope;
    case "synthesis":
      return Brain;
    case "thinking":
      return Brain;
    case "tool":
      return Zap;
    case "coordination":
      return Bot;
    default:
      return Activity;
  }
};

const getPhaseIcon = (phase: WorkflowPhase) => {
  switch (phase) {
    case "initialization":
      return PlayCircle;
    case "clinical_analysis":
      return Stethoscope;
    case "literature_search":
      return Database;
    case "multi_agent_coordination":
      return Bot;
    case "synthesis":
      return Brain;
    case "completion":
      return CheckCircle;
    default:
      return Activity;
  }
};

export function PhaseSection({
  phase,
  activities,
  isCurrentPhase = false,
  isCollapsed,
  onToggleCollapse,
  onActivityClick,
}: PhaseSectionProps) {
  const config = phaseConfig[phase];
  const Icon = getPhaseIcon(phase);

  const getPhaseStatus = (): "pending" | "running" | "completed" => {
    if (activities.length === 0) return "pending";

    const hasRunning = activities.some((a) => a.status === "running");
    const allCompleted = activities.every((a) => a.status === "completed");

    if (hasRunning) return "running";
    if (allCompleted) return "completed";
    return "running";
  };

  const phaseStatus = getPhaseStatus();
  const completedCount = activities.filter(
    (a) => a.status === "completed",
  ).length;
  const progressPercent =
    activities.length > 0 ? (completedCount / activities.length) * 100 : 0;

  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
      <Collapsible open={!isCollapsed}>
        <CollapsibleTrigger asChild>
          <div
            className={cn(
              "flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all hover:shadow-sm",
              config.bgColor,
              isCurrentPhase && "ring-2 ring-blue-300 shadow-sm",
            )}
            onClick={onToggleCollapse}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center",
                  phaseStatus === "completed" && "bg-green-500",
                  phaseStatus === "running" && "bg-blue-500",
                  phaseStatus === "pending" && "bg-slate-400",
                )}
              >
                {phaseStatus === "running" ? (
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                ) : (
                  <Icon className="w-4 h-4 text-white" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{config.title}</span>
                  {isCurrentPhase && (
                    <Badge variant="secondary" className="text-xs">
                      Current
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {config.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {activities.length > 0 && (
                <div className="text-right">
                  <div className="text-sm font-medium">
                    {completedCount}/{activities.length} tasks
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {Math.round(progressPercent)}% complete
                  </div>
                </div>
              )}

              {isCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent className="mt-2">
          <div className="pl-6 space-y-2">
            <AnimatePresence>
              {activities.map((activity) => {
                const ActivityIcon = getActivityIcon(
                  activity.type,
                  activity.toolName,
                );

                return (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className={cn(
                      "p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm",
                      activity.status === "running" &&
                        "bg-blue-50 border-blue-200",
                      activity.status === "completed" &&
                        "bg-green-50 border-green-200",
                      activity.status === "error" && "bg-red-50 border-red-200",
                      activity.status === "pending" &&
                        "bg-slate-50 border-slate-200",
                    )}
                    onClick={() => onActivityClick?.(activity)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <ActivityIcon
                          className={cn(
                            "w-4 h-4 mt-0.5",
                            activity.status === "running" &&
                              "text-blue-600 animate-pulse",
                            activity.status === "completed" && "text-green-600",
                            activity.status === "error" && "text-red-600",
                            activity.status === "pending" && "text-slate-600",
                          )}
                        />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">
                              {activity.agent}
                            </span>
                            {activity.toolName && (
                              <Badge variant="outline" className="text-xs">
                                {activity.toolName}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {activity.description}
                          </p>

                          {activity.progress !== undefined &&
                            activity.status === "running" && (
                              <div className="mt-2">
                                <Progress
                                  value={activity.progress}
                                  className="h-1"
                                />
                              </div>
                            )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-3">
                        <Badge
                          variant={
                            activity.status === "running"
                              ? "default"
                              : activity.status === "completed"
                                ? "outline"
                                : activity.status === "error"
                                  ? "destructive"
                                  : "secondary"
                          }
                          className="text-xs"
                        >
                          {activity.status === "running" && (
                            <Loader2 className="w-2 h-2 mr-1 animate-spin" />
                          )}
                          {activity.status === "completed" && (
                            <CheckCircle className="w-2 h-2 mr-1" />
                          )}
                          {activity.status === "error" && (
                            <AlertCircle className="w-2 h-2 mr-1" />
                          )}
                          {activity.status}
                        </Badge>

                        <div className="text-xs text-muted-foreground">
                          {activity.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </motion.div>
  );
}

"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { AgentPanel } from "./agent-panel";
import { PhaseSection } from "./phase-section";
import {
  WorkflowPhase,
  WorkflowActivity,
  AgentState,
  phaseConfig,
} from "./workflow-types";

interface WorkflowManagerProps {
  activities: WorkflowActivity[];
  agents: Record<string, AgentState>;
  currentPhase?: WorkflowPhase;
  isProcessing: boolean;
  onActivityClick?: (activity: WorkflowActivity) => void;
  onAgentClick?: (agentId: string, agent: AgentState) => void;
  className?: string;
}

export function WorkflowManager({
  activities,
  agents,
  currentPhase,
  isProcessing,
  onActivityClick,
  onAgentClick,
  className,
}: WorkflowManagerProps) {
  const [collapsedPhases, setCollapsedPhases] = useState<Set<WorkflowPhase>>(
    new Set(),
  );

  // Group activities by phase
  const activitiesByPhase = activities.reduce(
    (acc, activity) => {
      if (!acc[activity.phase]) acc[activity.phase] = [];
      acc[activity.phase].push(activity);
      return acc;
    },
    {} as Record<WorkflowPhase, WorkflowActivity[]>,
  );

  // Calculate overall progress
  const totalActivities = activities.length;
  const completedActivities = activities.filter(
    (a) => a.status === "completed",
  ).length;
  const overallProgress =
    totalActivities > 0 ? (completedActivities / totalActivities) * 100 : 0;

  // Get sorted phases
  const sortedPhases = Object.keys(phaseConfig).sort(
    (a, b) =>
      phaseConfig[a as WorkflowPhase].order -
      phaseConfig[b as WorkflowPhase].order,
  ) as WorkflowPhase[];

  const togglePhaseCollapse = (phase: WorkflowPhase) => {
    setCollapsedPhases((prev) => {
      const next = new Set(prev);
      if (next.has(phase)) {
        next.delete(phase);
      } else {
        next.add(phase);
      }
      return next;
    });
  };

  // Don't render if no activities and no agents
  if (activities.length === 0 && Object.keys(agents).length === 0) {
    return null;
  }

  return (
    <Card
      className={cn(
        "bg-gradient-to-br from-slate-50/50 to-blue-50/50 border-slate-200",
        "dark:from-slate-900/50 dark:to-blue-950/50 dark:border-slate-700",
        className,
      )}
    >
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold">Workflow Progress</span>
              <p className="text-sm text-muted-foreground font-normal">
                AI-powered healthcare analysis pipeline
              </p>
            </div>
          </CardTitle>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-medium">
                {completedActivities}/{totalActivities} Tasks
              </div>
              <div className="text-xs text-muted-foreground">
                {Math.round(overallProgress)}% Complete
              </div>
            </div>
            <div className="w-24">
              <Progress value={overallProgress} className="h-2" />
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Active Agents Summary */}
        <AgentPanel agents={agents} onAgentClick={onAgentClick} />

        {/* Workflow Phases */}
        {activities.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Workflow Phases
            </h3>

            <div className="space-y-3">
              {sortedPhases.map((phase, index) => {
                const phaseActivities = activitiesByPhase[phase] || [];
                if (phaseActivities.length === 0) return null;

                return (
                  <PhaseSection
                    key={phase}
                    phase={phase}
                    activities={phaseActivities}
                    isCurrentPhase={currentPhase === phase}
                    isCollapsed={collapsedPhases.has(phase)}
                    onToggleCollapse={() => togglePhaseCollapse(phase)}
                    onActivityClick={onActivityClick}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Real-time Processing Indicator */}
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-2 p-4 bg-blue-50 border border-blue-200 rounded-lg"
          >
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" />
            </div>
            <span className="text-sm font-medium text-blue-700">
              Processing workflow...
            </span>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}

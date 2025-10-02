// Workflow Phase Types
export type WorkflowPhase =
  | "initialization"
  | "clinical_analysis"
  | "literature_search"
  | "multi_agent_coordination"
  | "synthesis"
  | "completion";

export interface WorkflowActivity {
  id: string;
  phase: WorkflowPhase;
  type:
    | "search"
    | "fetch"
    | "analysis"
    | "synthesis"
    | "thinking"
    | "tool"
    | "coordination";
  agent: string;
  toolName?: string;
  description: string;
  status: "pending" | "running" | "completed" | "error";
  timestamp: Date;
  content?: any;
  progress?: number;
  duration?: number;
  metadata?: {
    tokenCount?: number;
    usage?: any;
    results?: any;
  };
}

export interface AgentState {
  id: string;
  name: string;
  type: "clinical" | "research" | "analysis" | "coordination" | "synthesis";
  status: "idle" | "initializing" | "running" | "completed" | "error";
  currentActivity?: string;
  totalActivities: number;
  completedActivities: number;
  lastUpdate: Date;
  outputs: WorkflowActivity[];
}

export const phaseConfig: Record<
  WorkflowPhase,
  {
    title: string;
    description: string;
    icon: React.ComponentType<any>;
    color: string;
    bgColor: string;
    order: number;
  }
> = {
  initialization: {
    title: "Initialization",
    description: "Setting up analysis workflow",
    icon: () => null,
    color: "text-blue-600",
    bgColor: "bg-blue-50 border-blue-200",
    order: 1,
  },
  clinical_analysis: {
    title: "Clinical Analysis",
    description: "Analyzing clinical data and guidelines",
    icon: () => null,
    color: "text-red-600",
    bgColor: "bg-red-50 border-red-200",
    order: 2,
  },
  literature_search: {
    title: "Literature Search",
    description: "Searching medical databases and research",
    icon: () => null,
    color: "text-green-600",
    bgColor: "bg-green-50 border-green-200",
    order: 3,
  },
  multi_agent_coordination: {
    title: "Multi-Agent Coordination",
    description: "Coordinating multiple AI agents",
    icon: () => null,
    color: "text-purple-600",
    bgColor: "bg-purple-50 border-purple-200",
    order: 4,
  },
  synthesis: {
    title: "Synthesis & Analysis",
    description: "Combining and analyzing all findings",
    icon: () => null,
    color: "text-orange-600",
    bgColor: "bg-orange-50 border-orange-200",
    order: 5,
  },
  completion: {
    title: "Completion",
    description: "Finalizing recommendations",
    icon: () => null,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50 border-emerald-200",
    order: 6,
  },
};

import { 
  Search, 
  Brain, 
  Globe, 
  Microscope, 
  FileText, 
  Zap, 
  Shield,
  Target,
  CheckCircle,
  Bot,
  Sparkles,
  Database
} from "lucide-react"

// Agent stage mapping from backend AGENT_STAGES
export const AGENT_STAGES = {
  "medical_researcher": "Medical Research",
  "deep_reasoning_researcher": "Deep Analysis", 
  "hybrid_medical_researcher": "Hybrid Analysis",
  "sonar_pro_researcher": "Web Search",
  "sonar_reasoning_researcher": "Reasoning Analysis",
  "sonar_deep_research_agent": "Deep Research",
  "browser_scraping_researcher": "Browser Research",
  "browser_initial_researcher": "Initial Browser Research",
  "fda_drug_researcher": "FDA Research",
  "browser_mcp_deep_researcher": "Advanced Browser Research",
  "research_coordinator": "Research Coordination",
  "quality_evaluator": "Quality Evaluation",
  "report_generator": "Report Generation",
  "unknown": "Processing"
} as const

// Agent configuration with icons, colors, and descriptions
export const AGENT_CONFIG = {
  "medical_researcher": {
    name: "Medical Research",
    icon: Microscope,
    color: "from-blue-500 to-indigo-600",
    bgColor: "from-blue-50 to-indigo-50",
    borderColor: "border-blue-200/50",
    description: "Analyzing medical literature and research data",
    activities: [
      "Searching medical databases",
      "Analyzing clinical studies",
      "Reviewing treatment protocols",
      "Evaluating evidence"
    ]
  },
  "deep_reasoning_researcher": {
    name: "Deep Analysis",
    icon: Brain,
    color: "from-purple-500 to-violet-600",
    bgColor: "from-purple-50 to-violet-50",
    borderColor: "border-purple-200/50",
    description: "Performing advanced reasoning and analysis",
    activities: [
      "Processing complex relationships",
      "Synthesizing information",
      "Drawing conclusions",
      "Validating findings"
    ]
  },
  "hybrid_medical_researcher": {
    name: "Hybrid Analysis",
    icon: Zap,
    color: "from-orange-500 to-red-600",
    bgColor: "from-orange-50 to-red-50",
    borderColor: "border-orange-200/50",
    description: "Combining multiple research approaches",
    activities: [
      "Cross-referencing sources",
      "Validating information",
      "Integrating findings",
      "Quality checking"
    ]
  },
  "sonar_pro_researcher": {
    name: "Web Search",
    icon: Search,
    color: "from-green-500 to-emerald-600",
    bgColor: "from-green-50 to-emerald-50",
    borderColor: "border-green-200/50",
    description: "Searching the web for relevant information",
    activities: [
      "Querying search engines",
      "Filtering results",
      "Extracting key data",
      "Verifying sources"
    ]
  },
  "sonar_reasoning_researcher": {
    name: "Reasoning Analysis",
    icon: Target,
    color: "from-cyan-500 to-blue-600",
    bgColor: "from-cyan-50 to-blue-50",
    borderColor: "border-cyan-200/50",
    description: "Applying reasoning to search results",
    activities: [
      "Analyzing search patterns",
      "Reasoning about results",
      "Making connections",
      "Drawing insights"
    ]
  },
  "sonar_deep_research_agent": {
    name: "Deep Research",
    icon: Database,
    color: "from-indigo-500 to-purple-600",
    bgColor: "from-indigo-50 to-purple-50",
    borderColor: "border-indigo-200/50",
    description: "Conducting comprehensive deep research",
    activities: [
      "Deep data mining",
      "Comprehensive analysis",
      "Advanced reasoning",
      "Detailed synthesis"
    ]
  },
  "browser_scraping_researcher": {
    name: "Browser Research",
    icon: Globe,
    color: "from-teal-500 to-cyan-600",
    bgColor: "from-teal-50 to-cyan-50",
    borderColor: "border-teal-200/50",
    description: "Browsing and scraping web content",
    activities: [
      "Navigating websites",
      "Extracting content",
      "Processing web data",
      "Gathering information"
    ]
  },
  "browser_initial_researcher": {
    name: "Initial Browser Research",
    icon: Globe,
    color: "from-sky-500 to-blue-600",
    bgColor: "from-sky-50 to-blue-50",
    borderColor: "border-sky-200/50",
    description: "Initial web browsing and data collection",
    activities: [
      "Starting web search",
      "Initial data gathering",
      "Establishing baseline",
      "Identifying sources"
    ]
  },
  "fda_drug_researcher": {
    name: "FDA Research",
    icon: Shield,
    color: "from-red-500 to-pink-600",
    bgColor: "from-red-50 to-pink-50",
    borderColor: "border-red-200/50",
    description: "Researching FDA drug information and regulations",
    activities: [
      "Querying FDA databases",
      "Checking drug approvals",
      "Reviewing safety data",
      "Analyzing regulations"
    ]
  },
  "browser_mcp_deep_researcher": {
    name: "Advanced Browser Research",
    icon: Sparkles,
    color: "from-violet-500 to-purple-600",
    bgColor: "from-violet-50 to-purple-50",
    borderColor: "border-violet-200/50",
    description: "Advanced browser-based research with MCP tools",
    activities: [
      "Advanced web automation",
      "Deep content extraction",
      "Complex data analysis",
      "Intelligent browsing"
    ]
  },
  "research_coordinator": {
    name: "Research Coordination",
    icon: Target,
    color: "from-amber-500 to-orange-600",
    bgColor: "from-amber-50 to-orange-50",
    borderColor: "border-amber-200/50",
    description: "Coordinating research efforts across agents",
    activities: [
      "Planning research strategy",
      "Coordinating agents",
      "Managing workflow",
      "Orchestrating tasks"
    ]
  },
  "quality_evaluator": {
    name: "Quality Evaluation",
    icon: CheckCircle,
    color: "from-emerald-500 to-green-600",
    bgColor: "from-emerald-50 to-green-50",
    borderColor: "border-emerald-200/50",
    description: "Evaluating research quality and accuracy",
    activities: [
      "Checking data quality",
      "Validating sources",
      "Assessing accuracy",
      "Ensuring completeness"
    ]
  },
  "report_generator": {
    name: "Report Generation",
    icon: FileText,
    color: "from-slate-500 to-gray-600",
    bgColor: "from-slate-50 to-gray-50",
    borderColor: "border-slate-200/50",
    description: "Generating comprehensive research reports",
    activities: [
      "Compiling findings",
      "Formatting reports",
      "Creating summaries",
      "Final document preparation"
    ]
  },
  "unknown": {
    name: "Processing",
    icon: Bot,
    color: "from-gray-500 to-slate-600",
    bgColor: "from-gray-50 to-slate-50",
    borderColor: "border-gray-200/50",
    description: "Processing request",
    activities: [
      "Initializing",
      "Processing request",
      "Determining next steps",
      "Loading..."
    ]
  }
} as const

export type AgentStage = keyof typeof AGENT_STAGES
export type AgentConfigType = typeof AGENT_CONFIG[AgentStage]

// Helper function to get agent config by stage name
export function getAgentConfig(stageName: string): AgentConfigType {
  return AGENT_CONFIG[stageName as AgentStage] || AGENT_CONFIG.unknown
}

// Helper function to get agent name by stage
export function getAgentName(stageName: string): string {
  return AGENT_STAGES[stageName as AgentStage] || AGENT_STAGES.unknown
}

// Helper function to check if agent is in handoff transition
export function isHandoffMoment(currentAgent: string, previousAgent: string): boolean {
  return currentAgent !== previousAgent && 
         currentAgent !== "unknown" && 
         previousAgent !== "unknown"
}

// Helper to get research step mapping for UI
export function mapAgentToResearchStep(agentStage: string, index: number = 0) {
  const config = getAgentConfig(agentStage)
  
  return {
    id: `step-${agentStage}-${index}`,
    label: config.name,
    status: 'active' as const,
    description: config.description,
    icon: config.icon,
    agentStage,
    activities: config.activities
  }
}
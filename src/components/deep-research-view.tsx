"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Brain, Search, FileText, CheckCircle, Clock, ArrowRight, Sparkles } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { ProviderSearchResult } from "@/lib/types"
import { getAgentConfig, getAgentName, isHandoffMoment, mapAgentToResearchStep } from "@/lib/agent-mapping"

interface DeepResearchViewProps {
  providers: ProviderSearchResult[]
  currentAgent?: string
  previousAgent?: string
  agentOutput?: string
  researchProgress?: number
  completedStages?: string[]
}

export function DeepResearchView({ 
  providers, 
  currentAgent, 
  previousAgent, 
  agentOutput, 
  researchProgress = 0,
  completedStages = [] 
}: DeepResearchViewProps) {
  // Get current agent configuration
  const currentAgentConfig = currentAgent ? getAgentConfig(currentAgent) : null
  const currentAgentName = currentAgent ? getAgentName(currentAgent) : null
  const isHandoffMoment = currentAgent && previousAgent && currentAgent !== previousAgent
  
  // Create dynamic research steps based on completed stages and current agent
  const researchSteps = [
    ...completedStages.map((stage, index) => ({
      ...mapAgentToResearchStep(stage, index),
      status: 'completed' as const
    })),
    ...(currentAgent && !completedStages.includes(currentAgent) ? [
      {
        ...mapAgentToResearchStep(currentAgent, completedStages.length),
        status: 'active' as const
      }
    ] : [])
  ]
  
  // Calculate progress based on research stages
  const calculatedProgress = researchProgress || 
    (completedStages.length / Math.max(completedStages.length + (currentAgent ? 1 : 0), 1)) * 100

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">Deep Research in Progress</h2>
        <p className="text-muted-foreground">Our AI is conducting comprehensive analysis of your selected providers</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            Research Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Progress value={calculatedProgress} className="w-full" />
          
          {/* Real-time Agent Activity */}
          <AnimatePresence>
            {currentAgentConfig && currentAgentName && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`p-4 rounded-lg bg-gradient-to-r ${currentAgentConfig.bgColor} border ${currentAgentConfig.borderColor}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 p-2 rounded-lg bg-gradient-to-r ${currentAgentConfig.color} shadow-md`}>
                    <currentAgentConfig.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-slate-800">{currentAgentName}</h4>
                      {isHandoffMoment && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full flex items-center gap-1"
                        >
                          <ArrowRight className="w-3 h-3" />
                          New Agent
                        </motion.div>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 mb-3">{currentAgentConfig.description}</p>
                    
                    {/* Agent Activities */}
                    <div className="space-y-2">
                      {currentAgentConfig.activities.map((activity, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ 
                            opacity: idx === 0 ? [0.5, 1, 0.5] : 0.7,
                            x: 0
                          }}
                          transition={{ 
                            duration: 2, 
                            repeat: idx === 0 ? Infinity : 0,
                            delay: idx * 0.2
                          }}
                          className="flex items-center gap-2 text-sm text-slate-600"
                        >
                          <div className={`w-2 h-2 rounded-full ${
                            idx === 0 ? 'bg-blue-500' : 'bg-slate-300'
                          }`} />
                          {activity}
                        </motion.div>
                      ))}
                    </div>
                    
                    {/* Live Agent Output */}
                    {agentOutput && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-3 p-3 bg-white/70 backdrop-blur-sm border border-slate-200/50 rounded-md"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="w-4 h-4 text-blue-500" />
                          <span className="text-sm font-medium text-slate-700">Agent Output</span>
                        </div>
                        <div className="text-sm text-slate-700 leading-relaxed max-h-20 overflow-y-auto">
                          {agentOutput}
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-4">
            <AnimatePresence>
              {researchSteps.map((step, index) => {
                const StepIcon = step.icon
                return (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 ${
                      step.status === 'completed' 
                        ? 'bg-green-50 border border-green-200/50' 
                        : step.status === 'active'
                        ? 'bg-blue-50 border border-blue-200/50 shadow-sm'
                        : 'bg-slate-50 border border-slate-200/50'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                      step.status === 'completed' 
                        ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg' 
                        : step.status === 'active'
                        ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg'
                        : 'bg-gradient-to-br from-slate-300 to-gray-400 text-white'
                    }`}>
                      {step.status === 'completed' ? (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 500, damping: 25 }}
                        >
                          <CheckCircle className="w-5 h-5" />
                        </motion.div>
                      ) : step.status === 'active' ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        >
                          <Clock className="w-5 h-5" />
                        </motion.div>
                      ) : (
                        <StepIcon className="w-5 h-5" />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className={`font-semibold ${
                        step.status === 'completed' ? 'text-green-800' : 
                        step.status === 'active' ? 'text-blue-800' : 'text-slate-600'
                      }`}>
                        {step.label}
                      </div>
                      {step.description && (
                        <div className="text-sm text-slate-600 mt-1">
                          {step.description}
                        </div>
                      )}
                    </div>
                    
                    {step.status === 'active' && (
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="text-blue-500"
                      >
                        <Sparkles className="w-5 h-5" />
                      </motion.div>
                    )}
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Analyzing Providers:</h4>
            <div className="space-y-1">
              {providers.map((provider) => (
                <div key={provider.id} className="text-sm text-muted-foreground">
                  • {provider.name} - {provider.specialty}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

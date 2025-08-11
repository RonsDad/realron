"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CheckCircle, Clock, Brain, Sparkles, Zap, Search, FileText, Target, Edit3, Save, X, ArrowRight } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { getAgentConfig, getAgentName, isHandoffMoment, type AgentStage } from "@/lib/agent-mapping"

interface ResearchStep {
  id: string
  label: string
  status: 'pending' | 'active' | 'completed'
  description?: string
  icon?: React.ComponentType<{ className?: string }>
  type?: 'normal' | 'plan'
  planContent?: string
}

interface ResearchProgressProps {
  steps: ResearchStep[]
  currentAgent?: string
  previousAgent?: string
  agentOutput?: string
  onPlanApprove?: () => void
  onPlanRevise?: (editedPlan?: string) => void
  onSendMessage?: (message: string) => void
}

export function ResearchProgress({ steps, currentAgent, previousAgent, agentOutput, onPlanApprove, onPlanRevise, onSendMessage }: ResearchProgressProps) {
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null)
  const [editedPlanContent, setEditedPlanContent] = useState('')
  const [isHandoff, setIsHandoff] = useState(false)
  const completedCount = steps.filter(s => s.status === 'completed').length
  const progressPercent = (completedCount / steps.length) * 100
  
  // Get current agent configuration
  const currentAgentConfig = currentAgent ? getAgentConfig(currentAgent) : null
  const currentAgentName = currentAgent ? getAgentName(currentAgent) : null
  
  // Detect handoff moments
  useEffect(() => {
    if (currentAgent && previousAgent && isHandoffMoment(currentAgent, previousAgent)) {
      setIsHandoff(true)
      const timer = setTimeout(() => setIsHandoff(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [currentAgent, previousAgent])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative"
    >
      {/* Magical glow effect */}
      <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-emerald-600/20 rounded-2xl blur-xl animate-pulse" />
      
      <Card className="relative border-0 bg-gradient-to-br from-slate-50 via-white to-blue-50/30 shadow-2xl backdrop-blur-sm">
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3 text-slate-800">
              <motion.div 
                className="relative p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <Brain className="w-6 h-6 text-white" />
                <motion.div
                  className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full"
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              </motion.div>
              <div>
                <div className="text-xl font-semibold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  AI Research Engine
                </div>
                <div className="text-sm text-slate-500 font-normal">
                  {currentAgentConfig && currentAgentName && (
                    <motion.span
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2"
                    >
                      <div className={`p-1 rounded-md bg-gradient-to-r ${currentAgentConfig.color}`}>
                        <currentAgentConfig.icon className="w-3 h-3 text-white" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-700">{currentAgentName}</span>
                        <span className="text-xs text-slate-500">{currentAgentConfig.description}</span>
                      </div>
                      {isHandoff && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 0.5, repeat: 2 }}
                          className="text-amber-500"
                        >
                          <ArrowRight className="w-3 h-3" />
                        </motion.div>
                      )}
                    </motion.span>
                  )}
                </div>
              </div>
            </CardTitle>
            
            <div className="text-right">
              <motion.div 
                className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
                key={completedCount}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 25 }}
              >
                {completedCount}/{steps.length}
              </motion.div>
              <div className="text-xs text-slate-500 font-medium">
                Steps Complete
              </div>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="mt-6">
            <div className="flex justify-between text-xs text-slate-600 mb-2">
              <span>Progress</span>
              <span>{Math.round(progressPercent)}%</span>
            </div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500 rounded-full relative"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                {/* Shimmer effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  animate={{ x: [-100, 200] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
              </motion.div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Real-time Agent Activity Display */}
          {currentAgentConfig && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`relative p-4 rounded-xl bg-gradient-to-r ${currentAgentConfig.bgColor} border ${currentAgentConfig.borderColor} shadow-sm`}
            >
              <div className="flex items-start gap-3">
                <div className={`flex-shrink-0 p-2 rounded-lg bg-gradient-to-r ${currentAgentConfig.color} shadow-md`}>
                  <currentAgentConfig.icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-slate-800">{currentAgentName}</h3>
                    {isHandoff && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full flex items-center gap-1"
                      >
                        <ArrowRight className="w-3 h-3" />
                        Agent Handoff
                      </motion.div>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 mb-3">{currentAgentConfig.description}</p>
                  
                  {/* Current Activity */}
                  <div className="mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-slate-500" />
                      <span className="text-sm font-medium text-slate-700">Current Activity</span>
                    </div>
                    <div className="space-y-1">
                      {currentAgentConfig.activities.map((activity, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0.3 }}
                          animate={{ 
                            opacity: idx === 0 ? [0.3, 1, 0.3] : 0.5,
                            x: idx === 0 ? [0, 2, 0] : 0
                          }}
                          transition={{ 
                            duration: 2, 
                            repeat: idx === 0 ? Infinity : 0,
                            delay: idx * 0.1
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
                  </div>
                  
                  {/* Agent Output Stream */}
                  {agentOutput && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white/70 backdrop-blur-sm border border-slate-200/50 rounded-lg p-3"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-blue-500" />
                        <span className="text-sm font-medium text-slate-700">Live Output</span>
                      </div>
                      <div className="text-sm text-slate-700 leading-relaxed max-h-24 overflow-y-auto">
                        {agentOutput}
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
              
              {/* Pulse animation for active state */}
              <motion.div
                className="absolute inset-0 rounded-xl bg-blue-400/5"
                animate={{ opacity: [0, 0.5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.div>
          )}
          
          <AnimatePresence>
            {steps.map((step, index) => {
              const StepIcon = step.icon || Target
              
              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                  className={`relative flex items-center gap-4 p-4 rounded-xl transition-all duration-500 ${
                    step.status === 'completed' 
                      ? 'bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200/50' 
                      : step.status === 'active'
                      ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/50 shadow-lg'
                      : 'bg-gradient-to-r from-slate-50 to-gray-50 border border-slate-200/50'
                  }`}
                >
                  {/* Connection line */}
                  {index < steps.length - 1 && (
                    <div className="absolute left-8 top-16 w-0.5 h-6 bg-gradient-to-b from-slate-300 to-transparent" />
                  )}
                  
                  {/* Step indicator */}
                  <div className={`relative flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center font-semibold ${
                    step.status === 'completed' 
                      ? 'bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-lg' 
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
                        <CheckCircle className="w-6 h-6" />
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
                    
                    {/* Magical sparkle for active step */}
                    {step.status === 'active' && (
                      <motion.div
                        className="absolute -top-1 -right-1"
                        animate={{ scale: [1, 1.3, 1], rotate: [0, 180, 360] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Zap className="w-4 h-4 text-amber-400" />
                      </motion.div>
                    )}
                  </div>
                  
                  {/* Step content */}
                  <div className="flex-1 min-w-0">
                    <motion.div 
                      className={`font-semibold text-base ${
                        step.status === 'completed' ? 'text-emerald-800' : 
                        step.status === 'active' ? 'text-blue-800' : 'text-slate-600'
                      }`}
                      layout
                    >
                      {step.label}
                    </motion.div>
                    
                    {step.description && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-sm text-slate-600 mt-1 leading-relaxed"
                      >
                        {step.description}
                      </motion.div>
                    )}
                    
                    {/* Research Plan Content */}
                    {step.type === 'plan' && step.planContent && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="mt-4 space-y-4"
                      >
                        <div className="relative">
                          {editingPlanId === step.id ? (
                            <div className="space-y-3">
                              <Textarea
                                value={editedPlanContent}
                                onChange={(e) => setEditedPlanContent(e.target.value)}
                                className="min-h-[200px] text-sm leading-relaxed font-mono border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-white/90 backdrop-blur-sm"
                                placeholder="Edit research methodology..."
                              />
                              <div className="flex items-center gap-3">
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    onPlanRevise?.(editedPlanContent)
                                    setEditingPlanId(null)
                                  }}
                                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md border-0 h-8 px-3 text-xs font-medium"
                                >
                                  <Save className="w-3 h-3 mr-1.5" />
                                  Save Changes
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setEditingPlanId(null)
                                    setEditedPlanContent('')
                                  }}
                                  className="text-slate-600 hover:text-slate-800 hover:bg-slate-100 h-8 px-3 text-xs"
                                >
                                  <X className="w-3 h-3 mr-1.5" />
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <div 
                                className="group relative bg-gradient-to-br from-slate-50 to-white border border-slate-200/60 rounded-lg p-4 cursor-text hover:border-slate-300 transition-all duration-300 shadow-sm hover:shadow-md"
                                onClick={() => {
                                  setEditingPlanId(step.id)
                                  setEditedPlanContent(step.planContent || '')
                                }}
                              >
                                <div className="prose prose-slate prose-sm max-w-none">
                                  <div 
                                    className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap"
                                    dangerouslySetInnerHTML={{
                                      __html: step.planContent?.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                        .replace(/\*(.*?)\*/g, '<em>$1</em>')
                                        .replace(/\n/g, '<br/>') || ''
                                    }}
                                  />
                                </div>
                                <motion.div
                                  className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                  whileHover={{ scale: 1.05 }}
                                >
                                  <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-md p-1.5 shadow-sm">
                                    <Edit3 className="w-3 h-3 text-slate-500" />
                                  </div>
                                </motion.div>
                              </div>
                              
                              <div className="flex items-center gap-3">
                                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                  <Button
                                    size="sm"
                                    onClick={() => onSendMessage?.('Looks good, run it')}
                                    className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-md border-0 h-8 px-4 text-xs font-medium"
                                  >
                                    Approve & Execute
                                  </Button>
                                </motion.div>
                                
                                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      setEditingPlanId(step.id)
                                      setEditedPlanContent(step.planContent || '')
                                    }}
                                    className="text-slate-600 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 h-8 px-3 text-xs shadow-sm"
                                  >
                                    <Edit3 className="w-3 h-3 mr-1.5" />
                                    Edit Plan
                                  </Button>
                                </motion.div>
                              </div>
                              
                              <div className="text-xs text-slate-500 leading-relaxed">
                                Upon approval, the research methodology above will guide comprehensive data collection and analysis.
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                    
                    {/* Active step pulse effect */}
                    {step.status === 'active' && (
                      <motion.div
                        className="absolute inset-0 rounded-xl bg-blue-400/10"
                        animate={{ opacity: [0, 0.3, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    )}
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
          
          {completedCount === steps.length && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-4"
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-full font-semibold shadow-lg"
              >
                <Sparkles className="w-4 h-4" />
                Research Complete!
              </motion.div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
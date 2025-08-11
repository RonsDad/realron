"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { AnimatedPanel } from "@/components/ui/animated-panel"
import {
  CheckCircle,
  Circle,
  Loader2,
  Brain,
  FileText,
  Edit3,
  Save,
  X,
  Search,
  Sparkles,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  Clock,
  Zap,
  BookOpen,
  Target,
  FileCheck,
  Globe,
  MessageSquare,
  Eye,
  EyeOff,
  Copy,
  Check
} from "lucide-react"
import ReactMarkdown from 'react-markdown'
import { cn } from "@/lib/utils"
import { useDeepResearchBrowser } from "@/hooks/use-deep-research-browser"
import { DeepResearchBrowserPanel } from "@/components/deep-research-browser-panel"
import { motion, AnimatePresence } from "framer-motion"

interface ResearchOutput {
  plan?: string
  browserInitialFindings?: {
    content: string
    liveUrl?: string
    liveUrls?: Array<{
      task: string
      url: string
      sessionId: string
    }>
    sessionId?: string
  }
  outline?: string
  findings?: string
  evaluation?: {
    grade: 'pass' | 'fail'
    comment: string
    follow_up_queries?: Array<{ search_query: string }>
  }
  finalReport?: string
  sources?: Record<string, {
    short_id: string
    title: string
    url: string
    domain: string
    supported_claims: Array<{
      text_segment: string
      confidence: number
    }>
  }>
}

interface ResearchMessage {
  type: 'plan' | 'outline' | 'findings' | 'evaluation' | 'status' | 'final' | 'thought' | 'action'
  content: string
  agent?: string
  stage?: string
  timestamp: Date
  metadata?: {
    toolName?: string
    toolInput?: any
    toolOutput?: any
  }
}

interface ResearchProgressUnifiedProps {
  outputs: ResearchOutput
  messages: ResearchMessage[]
  currentAgent?: string
  isProcessing?: boolean
  onSendMessage?: (message: string) => void
}

const stages = [
  {
    id: 'plan',
    label: 'Research Plan',
    icon: FileText,
    color: 'blue',
    description: 'Creating comprehensive research strategy'
  },
  {
    id: 'outline',
    label: 'Report Structure',
    icon: BookOpen,
    color: 'indigo',
    description: 'Designing logical report organization'
  },
  {
    id: 'research',
    label: 'Deep Research',
    icon: Search,
    color: 'purple',
    description: 'Gathering information from multiple sources'
  },
  {
    id: 'evaluation',
    label: 'Quality Check',
    icon: Target,
    color: 'amber',
    description: 'Evaluating research completeness'
  },
  {
    id: 'report',
    label: 'Final Report',
    icon: FileCheck,
    color: 'emerald',
    description: 'Compiling comprehensive findings'
  }
]

export function ResearchProgressUnified({
  outputs,
  messages,
  currentAgent,
  isProcessing = false,
  onSendMessage
}: ResearchProgressUnifiedProps) {
  const [editingPlan, setEditingPlan] = useState(false)
  const [editedPlanContent, setEditedPlanContent] = useState('')
  const [showThoughts, setShowThoughts] = useState(false)
  const [copiedReport, setCopiedReport] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  
  // Panel visibility states
  const [visiblePanels, setVisiblePanels] = useState<Set<string>>(new Set())
  const [activeStage, setActiveStage] = useState<string | null>(null)
  const [animatingPanels, setAnimatingPanels] = useState<Set<string>>(new Set())
  
  // Browser session navigation state
  const [activeBrowserSession, setActiveBrowserSession] = useState(0)
  
  // Deep research browser hook
  const { browserState, startBrowserSession, addThought } = useDeepResearchBrowser()
  
  // Track thinking states for timeline
  const thoughtMessages = messages.filter(m => m.type === 'thought')
  const latestThought = thoughtMessages[thoughtMessages.length - 1]
  const isThinking = thoughtMessages.length > 0 &&
    thoughtMessages[thoughtMessages.length - 1].timestamp.getTime() > Date.now() - 5000

  // Auto-scroll to active stage
  useEffect(() => {
    if (scrollRef.current) {
      const activeElement = scrollRef.current.querySelector('[data-active="true"]')
      if (activeElement) {
        activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }, [outputs])
  
  
  // Process thought messages for browser agent
  useEffect(() => {
    const browserThoughts = messages.filter(m =>
      m.type === 'thought' &&
      activeStage === 'browser'
    )
    
    if (browserThoughts.length > 0) {
      const latestBrowserThought = browserThoughts[browserThoughts.length - 1]
      // Only add if it's a new thought (within last 2 seconds)
      if (latestBrowserThought.timestamp.getTime() > Date.now() - 2000) {
        addThought(latestBrowserThought.content)
      }
    }
  }, [messages, activeStage, addThought])
  
  // Manage panel visibility based on outputs - clean flow with auto-collapse
  useEffect(() => {
    const newVisiblePanels = new Set<string>()
    
    // Clean flow: only show current stage, auto-collapse completed ones
    if (outputs.plan && !outputs.browserInitialFindings) {
      // Show plan only if awaiting approval
      newVisiblePanels.add('plan')
    } else if (outputs.browserInitialFindings && !outputs.outline) {
      // Show browser panel during exploration
      newVisiblePanels.add('browser')
    } else if (outputs.outline && !outputs.findings) {
      // Show outline briefly then auto-collapse after 30 seconds
      newVisiblePanels.add('outline')
      setTimeout(() => {
        setVisiblePanels(prev => {
          const next = new Set(prev)
          next.delete('outline')
          return next
        })
      }, 30000) // 30 seconds as requested
    } else if (outputs.findings && !outputs.evaluation) {
      // Show findings/deep research thinking
      newVisiblePanels.add('findings')
    } else if (outputs.evaluation) {
      // Show evaluation
      newVisiblePanels.add('evaluation')
      // Only auto-collapse if passed AND final report exists
      if (outputs.evaluation.grade === 'pass' && outputs.finalReport) {
        setTimeout(() => {
          setVisiblePanels(prev => {
            const next = new Set(prev)
            next.delete('evaluation')
            return next
          })
        }, 2000)
      }
      // If failed, keep it open for status updates
    } else if (outputs.finalReport) {
      // Show final report
      newVisiblePanels.add('report')
    }
    
    setVisiblePanels(prev => {
      // Track which panels are newly opening
      const newlyOpening = Array.from(newVisiblePanels).filter(
        panel => !prev.has(panel)
      )
      
      if (newlyOpening.length > 0) {
        // Add to animating panels
        setAnimatingPanels(animPrev => {
          const next = new Set(animPrev)
          newlyOpening.forEach(panel => next.add(panel))
          return next
        })
        
        // Remove from animating after animation completes
        setTimeout(() => {
          setAnimatingPanels(animPrev => {
            const next = new Set(animPrev)
            newlyOpening.forEach(panel => next.delete(panel))
            return next
          })
        }, 500) // Match AnimatedPanel transition duration
      }
      
      return newVisiblePanels
    })
  }, [outputs])
  
  // Update active stage based on processing state
  useEffect(() => {
    if (isProcessing) {
      if (!outputs.plan) setActiveStage('plan')
      else if (!outputs.outline) setActiveStage('outline')
      else if (!outputs.findings) setActiveStage('research')
      else if (!outputs.evaluation) setActiveStage('evaluation')
      else if (!outputs.finalReport) setActiveStage('report')
    } else {
      setActiveStage(null)
    }
  }, [isProcessing, outputs])
  

  const getStageStatus = (stageId: string): 'completed' | 'active' | 'pending' => {
    switch (stageId) {
      case 'plan':
        return outputs.plan ? 'completed' : isProcessing ? 'active' : 'pending'
      case 'outline':
        return outputs.outline ? 'completed' : (outputs.plan && isProcessing) ? 'active' : 'pending'
      case 'research':
        return outputs.findings ? 'completed' : (outputs.outline && isProcessing) ? 'active' : 'pending'
      case 'evaluation':
        return outputs.evaluation ? 'completed' : (outputs.findings && isProcessing) ? 'active' : 'pending'
      case 'report':
        return outputs.finalReport ? 'completed' : (outputs.evaluation && isProcessing) ? 'active' : 'pending'
      default:
        return 'pending'
    }
  }


  return (
    <Card className="overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <CardHeader className="relative pb-0">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-emerald-500/10" />
        <div className="relative">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur-xl opacity-50" />
                <div className="relative p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl text-white">
                  <Brain className="w-8 h-8" />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                  Deep Research Engine
                </h2>
                {currentAgent && (
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <p className="text-sm text-muted-foreground">{currentAgent} is analyzing...</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Agent Thoughts Counter */}
            <div className="flex items-center gap-2">
              <Badge 
                variant="outline" 
                className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                onClick={() => setShowThoughts(!showThoughts)}
              >
                <Brain className="w-3 h-3 mr-1" />
                Agent Thoughts
                <span className="ml-2 font-bold">{messages.filter(m => m.type === 'thought').length}</span>
              </Badge>
            </div>
          </div>

          {/* Progress Timeline */}
          <div className="relative mt-8 mb-4">
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-gradient-to-r from-slate-200 via-slate-200 to-slate-200 dark:from-slate-800 dark:via-slate-800 dark:to-slate-800" />
            <div className="relative flex justify-between">
              {stages.map((stage, index) => {
                const status = getStageStatus(stage.id)
                const Icon = stage.icon
                const isActive = status === 'active'
                const isCompleted = status === 'completed'
                
                return (
                  <div
                    key={stage.id}
                    data-active={isActive}
                    className={cn(
                      "relative flex flex-col items-center",
                      isCompleted && "cursor-pointer group"
                    )}
                    onClick={() => {
                      if (isCompleted) {
                        // Toggle panel visibility when clicking completed stages
                        setVisiblePanels(prev => {
                          const newPanels = new Set(prev)
                          if (newPanels.has(stage.id)) {
                            newPanels.delete(stage.id)
                          } else {
                            // Close all other panels and open this one
                            newPanels.clear()
                            newPanels.add(stage.id)
                          }
                          return newPanels
                        })
                      }
                    }}
                  >
                    {/* Connection line */}
                    {index > 0 && (
                      <div
                        className={cn(
                          "absolute top-5 -left-1/2 right-1/2 h-0.5 transition-all duration-500",
                          isCompleted || stages.slice(0, index).every(s => getStageStatus(s.id) === 'completed')
                            ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
                            : "bg-transparent"
                        )}
                      />
                    )}
                    
                    {/* Stage indicator */}
                    <div className={cn(
                      "relative z-10 flex items-center justify-center w-10 h-10 rounded-full transition-all duration-500",
                      isActive && "scale-125 animate-pulse",
                      isCompleted && "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30",
                      isActive && "bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/30",
                      !isActive && !isCompleted && "bg-slate-200 dark:bg-slate-800 text-slate-500",
                      isCompleted && "group-hover:scale-110 group-hover:shadow-xl",
                      animatingPanels.has(stage.id) && "timeline-pulse"
                    )}>
                      {isCompleted ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : isActive ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Icon className="w-5 h-5" />
                      )}
                      
                      {/* Stage thought count indicator */}
                      {messages.filter(m => m.stage === stage.id && m.type === 'thought').length > 0 && (
                        <div className="absolute -top-2 -right-2 bg-purple-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-lg">
                          {messages.filter(m => m.stage === stage.id && m.type === 'thought').length}
                        </div>
                      )}
                      
                      {/* Active thinking indicator */}
                      {isActive && isThinking && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded-full"
                        >
                          <Brain className="w-3 h-3 text-purple-600 dark:text-purple-400 animate-pulse" />
                          <p className="text-xs text-purple-600 dark:text-purple-400">
                            Thinking...
                          </p>
                        </motion.div>
                      )}
                    </div>
                    
                    {/* Stage label */}
                    <div className="mt-3 text-center">
                      <p className={cn(
                        "text-sm font-medium transition-colors",
                        isActive && "text-blue-600 dark:text-blue-400",
                        isCompleted && "text-emerald-600 dark:text-emerald-400",
                        !isActive && !isCompleted && "text-slate-500"
                      )}>
                        {stage.label}
                      </p>
                      {isActive && (
                        <p className="text-xs text-muted-foreground mt-1 max-w-[120px]">
                          {stage.description}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-8" ref={scrollRef}>
        {/* Transparent Agent Activity Panel */}
        {messages.length > 0 && (
          <div className="mb-6 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Brain className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <h3 className="font-semibold">Deep Research Engine</h3>
                  <Badge variant="secondary" className="ml-2">
                    {messages.filter(m => m.type === 'thought').length} thoughts
                  </Badge>
                  <Badge variant="outline" className="ml-1">
                    {messages.filter(m => m.type === 'action').length} actions
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowThoughts(!showThoughts)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {showThoughts ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            
            <AnimatePresence>
              {showThoughts && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ScrollArea className="max-h-[500px] pr-2">
                    <div className="p-4 space-y-3 pr-2">
                      {messages.map((msg, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: Math.min(idx * 0.05, 0.3) }}
                          className={cn(
                            "rounded-lg p-3 text-sm",
                            msg.type === 'thought' && "bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800",
                            msg.type === 'action' && "bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800",
                            msg.type === 'plan' && "bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800",
                            msg.type === 'findings' && "bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800"
                          )}
                        >
                          <div className="flex items-start gap-2">
                            {msg.type === 'thought' && <MessageSquare className="w-4 h-4 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />}
                            {msg.type === 'action' && <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />}
                            {msg.type === 'plan' && <FileText className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />}
                            {msg.type === 'findings' && <Search className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />}
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                {msg.agent && (
                                  <Badge variant="outline" className="text-xs">
                                    {msg.agent}
                                  </Badge>
                                )}
                                {msg.stage && (
                                  <Badge variant="secondary" className="text-xs">
                                    {msg.stage}
                                  </Badge>
                                )}
                                <span className="text-xs text-muted-foreground">
                                  {new Date(msg.timestamp).toLocaleTimeString()}
                                </span>
                              </div>
                              <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                                {msg.content}
                              </p>
                              {msg.metadata?.toolName && (
                                <div className="mt-2 p-2 bg-slate-100 dark:bg-slate-800 rounded text-xs text-muted-foreground">
                                  <span className="font-medium">Tool:</span> {msg.metadata.toolName}
                                  {msg.metadata.toolInput && (
                                    <div className="mt-1 truncate">
                                      <span className="font-medium">Input:</span> {JSON.stringify(msg.metadata.toolInput).substring(0, 100)}...
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </ScrollArea>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Main Content Area */}
        <div className="space-y-6">
          {/* Research Plan */}
          {outputs.plan && (
            <AnimatedPanel isOpen={visiblePanels.has('plan')} className="mb-6">
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold">Research Plan</h3>
                  {!outputs.outline && (
                    <Badge variant="outline" className="ml-auto">
                      Awaiting Approval
                    </Badge>
                  )}
                </div>
                
                {editingPlan ? (
                  <div className="space-y-4">
                    <Textarea
                      value={editedPlanContent}
                      onChange={(e) => setEditedPlanContent(e.target.value)}
                      className="min-h-[200px] font-mono text-sm bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                      placeholder="Edit research plan..."
                    />
                    <div className="flex items-center gap-3">
                      <Button
                        size="sm"
                        onClick={() => {
                          onSendMessage?.(editedPlanContent)
                          setEditingPlan(false)
                        }}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save & Submit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingPlan(false)
                          setEditedPlanContent('')
                        }}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-950">
                      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500" />
                      <div className="p-6">
                        <pre className="text-sm leading-relaxed whitespace-pre-wrap font-sans text-slate-700 dark:text-slate-300">
                          {outputs.plan}
                        </pre>
                      </div>
                    </div>
                    
                    {!outputs.outline && (
                      <div className="flex items-center gap-3">
                        <Button
                          onClick={() => {
                            onSendMessage?.('Looks good, run it')
                            // Auto-collapse plan panel after approval
                            setTimeout(() => {
                              setVisiblePanels(prev => {
                                const next = new Set(prev)
                                next.delete('plan')
                                return next
                              })
                            }, 500)
                          }}
                          className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-lg shadow-emerald-500/25"
                        >
                          <Zap className="w-4 h-4 mr-2" />
                          Approve & Execute Research
                        </Button>
                        
                        <Button
                          variant="outline"
                          onClick={() => {
                            setEditingPlan(true)
                            setEditedPlanContent(outputs.plan || '')
                          }}
                        >
                          <Edit3 className="w-4 h-4 mr-2" />
                          Edit Plan
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </AnimatedPanel>
          )}


          {/* Report Outline */}
          {outputs.outline && (
            <AnimatedPanel isOpen={visiblePanels.has('outline')} className="mb-6">
              <Separator className="mb-8" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                    <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <h3 className="text-lg font-semibold">Report Structure</h3>
                  <Badge variant="secondary" className="ml-auto">
                    Generated
                  </Badge>
                </div>
                
                <div className="rounded-xl border border-indigo-200 dark:border-indigo-800 bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/20 dark:to-slate-950 p-6">
                  <pre className="text-sm leading-relaxed whitespace-pre-wrap font-sans text-slate-700 dark:text-slate-300">
                    {outputs.outline}
                  </pre>
                </div>
              </div>
            </AnimatedPanel>
          )}

          {/* Deep Research - Show thinking/tracing */}
          {outputs.findings && (
            <AnimatedPanel isOpen={visiblePanels.has('findings')} className="mb-6">
              <Separator className="mb-8" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Search className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="text-lg font-semibold">Deep Research</h3>
                  <Badge variant="secondary" className="ml-auto">
                    {outputs.sources ? Object.keys(outputs.sources).length : 0} Sources
                  </Badge>
                </div>
                
                {/* Agent thinking/tracing panel */}
                {activeStage === 'research' && thoughtMessages.length > 0 && (
                  <div className="mb-4 p-4 bg-purple-50 dark:bg-purple-950/20 rounded-xl border border-purple-200 dark:border-purple-800">
                    <h4 className="text-sm font-semibold text-purple-900 dark:text-purple-100 mb-3 flex items-center gap-2">
                      <Brain className="w-4 h-4" />
                      Research Agent Thinking
                    </h4>
                    <ScrollArea className="h-32">
                      <div className="space-y-2">
                        {thoughtMessages.slice(-5).map((thought, idx) => (
                          <div key={idx} className="text-sm text-purple-700 dark:text-purple-300 italic">
                            "{thought.content}"
                            <span className="text-xs text-purple-500 ml-2">
                              {thought.timestamp.toLocaleTimeString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
                
                <ScrollArea className="h-[400px] rounded-xl border border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/20 dark:to-slate-950">
                  <div className="p-6">
                    <pre className="text-sm leading-relaxed whitespace-pre-wrap font-sans text-slate-700 dark:text-slate-300">
                      {outputs.findings}
                    </pre>
                  </div>
                </ScrollArea>
              </div>
            </AnimatedPanel>
          )}

          {/* Quality Evaluation */}
          {outputs.evaluation && (
            <AnimatedPanel isOpen={visiblePanels.has('evaluation')} className="mb-6">
              <Separator className="mb-8" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className={cn(
                    "p-2 rounded-lg",
                    outputs.evaluation.grade === 'pass'
                      ? "bg-emerald-100 dark:bg-emerald-900/30"
                      : "bg-amber-100 dark:bg-amber-900/30"
                  )}>
                    <Target className={cn(
                      "w-5 h-5",
                      outputs.evaluation.grade === 'pass'
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-amber-600 dark:text-amber-400"
                    )} />
                  </div>
                  <h3 className="text-lg font-semibold">Quality Evaluation</h3>
                  <Badge
                    variant={outputs.evaluation.grade === 'pass' ? 'default' : 'secondary'}
                    className={cn(
                      "ml-auto",
                      outputs.evaluation.grade === 'pass'
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                    )}
                  >
                    {outputs.evaluation.grade === 'pass' ? 'Passed' : 'Needs Improvement'}
                  </Badge>
                </div>
                
                <div className={cn(
                  "rounded-xl border p-6",
                  outputs.evaluation.grade === 'pass'
                    ? "border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/20 dark:to-slate-950"
                    : "border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/20 dark:to-slate-950"
                )}>
                  <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                    {outputs.evaluation.comment}
                  </p>
                  
                  {outputs.evaluation.follow_up_queries && outputs.evaluation.follow_up_queries.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                      <p className="text-sm font-medium mb-2">Additional searches being conducted:</p>
                      <ul className="space-y-1">
                        {outputs.evaluation.follow_up_queries.map((q, idx) => (
                          <li key={idx} className="text-sm text-muted-foreground flex items-center gap-2">
                            <ArrowRight className="w-3 h-3" />
                            {q.search_query}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </AnimatedPanel>
          )}

          {/* Final Report */}
          {outputs.finalReport && (
            <AnimatedPanel isOpen={visiblePanels.has('report')} className="mb-6">
              <Separator className="mb-8" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg text-white shadow-lg shadow-emerald-500/30">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-semibold">Final Research Report</h3>
                  <div className="ml-auto flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(outputs.finalReport || '')
                        setCopiedReport(true)
                        setTimeout(() => setCopiedReport(false), 2000)
                      }}
                    >
                      {copiedReport ? (
                        <>
                          <Check className="w-4 h-4 mr-1" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-1" />
                          Copy
                        </>
                      )}
                    </Button>
                    <Badge className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white">
                      Complete
                    </Badge>
                  </div>
                </div>
                
                <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50/50 to-white dark:from-emerald-950/10 dark:to-slate-950 overflow-hidden">
                  <ScrollArea className="h-[600px]">
                    <div className="p-8">
                      <div className="prose prose-slate dark:prose-invert max-w-none">
                        <ReactMarkdown
                          components={{
                            h1: ({ children }) => <h1 className="text-3xl font-bold mb-6 text-slate-900 dark:text-slate-100">{children}</h1>,
                            h2: ({ children }) => <h2 className="text-2xl font-semibold mt-8 mb-4 text-slate-800 dark:text-slate-200">{children}</h2>,
                            h3: ({ children }) => <h3 className="text-xl font-medium mt-6 mb-3 text-slate-700 dark:text-slate-300">{children}</h3>,
                            p: ({ children }) => <p className="mb-4 leading-relaxed text-slate-600 dark:text-slate-400">{children}</p>,
                            ul: ({ children }) => <ul className="mb-4 space-y-2">{children}</ul>,
                            li: ({ children }) => <li className="ml-6 text-slate-600 dark:text-slate-400">{children}</li>,
                            a: ({ href, children }) => (
                              <a href={href} target="_blank" rel="noopener noreferrer"
                                className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                                {children}
                              </a>
                            ),
                            blockquote: ({ children }) => (
                              <blockquote className="border-l-4 border-slate-300 dark:border-slate-700 pl-4 italic my-4 text-slate-600 dark:text-slate-400">
                                {children}
                              </blockquote>
                            ),
                            table: ({ children }) => (
                              <div className="overflow-x-auto mb-6">
                                <table className="min-w-full divide-y divide-slate-300 dark:divide-slate-700">
                                  {children}
                                </table>
                              </div>
                            ),
                            thead: ({ children }) => (
                              <thead className="bg-slate-50 dark:bg-slate-800">
                                {children}
                              </thead>
                            ),
                            tbody: ({ children }) => (
                              <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800">
                                {children}
                              </tbody>
                            ),
                            tr: ({ children }) => (
                              <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                {children}
                              </tr>
                            ),
                            th: ({ children }) => (
                              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                {children}
                              </th>
                            ),
                            td: ({ children }) => (
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                                {children}
                              </td>
                            ),
                            code: ({ children, className }) => {
                              const match = /language-(\w+)/.exec(className || '')
                              return match ? (
                                <pre className="mb-4 p-4 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-x-auto">
                                  <code className="text-sm font-mono text-slate-800 dark:text-slate-200">
                                    {children}
                                  </code>
                                </pre>
                              ) : (
                                <code className="px-1.5 py-0.5 mx-0.5 rounded bg-slate-100 dark:bg-slate-800 text-sm font-mono text-slate-800 dark:text-slate-200">
                                  {children}
                                </code>
                              )
                            },
                            strong: ({ children }) => (
                              <strong className="font-semibold text-slate-900 dark:text-slate-100">
                                {children}
                              </strong>
                            ),
                            em: ({ children }) => (
                              <em className="italic text-slate-700 dark:text-slate-300">
                                {children}
                              </em>
                            ),
                          }}
                        >
                          {outputs.finalReport}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </ScrollArea>
                  
                  {/* Sources footer */}
                  {outputs.sources && Object.keys(outputs.sources).length > 0 && (
                    <div className="border-t border-emerald-200 dark:border-emerald-800 bg-slate-50 dark:bg-slate-900 p-6">
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <FileCheck className="w-4 h-4" />
                        Verified Sources ({Object.keys(outputs.sources).length})
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {Object.values(outputs.sources).slice(0, 6).map((source) => (
                          <a
                            key={source.short_id}
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors group"
                          >
                            <div className="w-8 h-8 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30">
                              <span className="text-xs font-mono text-slate-600 dark:text-slate-400">
                                {source.short_id.replace('src-', '')}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate group-hover:text-blue-700 dark:group-hover:text-blue-300">
                                {source.title}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-500 truncate">
                                {source.domain}
                              </p>
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </AnimatedPanel>
          )}
        </div>

        {/* Completion celebration */}
        {outputs.finalReport && (
          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-full font-medium shadow-lg shadow-emerald-500/30">
              <CheckCircle className="w-5 h-5" />
              Research Complete
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
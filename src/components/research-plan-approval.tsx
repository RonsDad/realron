"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle, Edit, FileText, Sparkles, Save, X } from "lucide-react"
import { motion } from "framer-motion"

interface ResearchPlanApprovalProps {
  plan: string
  onApprove: () => void
  onRevise: (editedPlan?: string) => void
}

export function ResearchPlanApproval({ plan, onApprove, onRevise }: ResearchPlanApprovalProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedPlan, setEditedPlan] = useState(plan)

  const handleSaveEdit = () => {
    onRevise(editedPlan)
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setEditedPlan(plan)
    setIsEditing(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="my-8"
    >
      <Card className="border-slate-200 bg-gradient-to-br from-slate-50 to-white shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3 text-slate-800 text-xl font-semibold">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              Research Plan Proposal
            </CardTitle>
            <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 rounded-full border border-amber-200">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-medium text-amber-700">
                {isEditing ? "Editing" : "AI Generated"}
              </span>
            </div>
          </div>
          <p className="text-slate-600 text-sm mt-2">
            {isEditing 
              ? "Edit the research plan below and save your changes."
              : "Click to edit the plan or approve to proceed with execution."
            }
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="bg-white border border-slate-100 rounded-lg shadow-sm">
            {isEditing ? (
              <Textarea
                value={editedPlan}
                onChange={(e) => setEditedPlan(e.target.value)}
                className="min-h-[300px] border-0 focus:ring-2 focus:ring-blue-500 font-mono text-sm leading-relaxed resize-none"
                placeholder="Edit your research plan..."
              />
            ) : (
              <div 
                className="p-6 cursor-text hover:bg-slate-50/50 transition-colors"
                onClick={() => setIsEditing(true)}
              >
                <div className="prose prose-slate max-w-none">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700 font-medium">
                    {plan}
                  </div>
                </div>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Edit className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-4 pt-2">
            {isEditing ? (
              <>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={handleSaveEdit}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg px-6 py-2.5 font-medium"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                </motion.div>
                
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    variant="outline"
                    onClick={handleCancelEdit}
                    className="border-slate-300 text-slate-700 hover:bg-slate-50 px-6 py-2.5 font-medium"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </motion.div>
              </>
            ) : (
              <>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={onApprove}
                    className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-lg px-6 py-2.5 font-medium"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve & Execute Research
                  </Button>
                </motion.div>
                
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                    className="border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 px-6 py-2.5 font-medium shadow-sm"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Plan
                  </Button>
                </motion.div>
              </>
            )}
          </div>
          
          <div className="text-xs text-slate-500 pt-2 border-t border-slate-100">
            {isEditing 
              ? "Make your edits above and save to update the research methodology."
              : "Upon approval, the research agent will begin comprehensive data collection and analysis according to this methodology."
            }
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
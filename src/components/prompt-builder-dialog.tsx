"use client"

import { useState } from "react"
import { BrainCircuit } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { AIPromptBuilder } from "@/components/ai-prompt-builder"
import { useUserProfile } from "@/hooks/use-user-profile"

interface PromptBuilderDialogProps {
  onSendPrompt?: (prompt: string) => void
}

export function PromptBuilderDialog({ onSendPrompt }: PromptBuilderDialogProps) {
  const [open, setOpen] = useState(false)
  const { userProfile } = useUserProfile()

  const handlePromptGenerated = (prompt: string) => {
    if (onSendPrompt) {
      onSendPrompt(prompt)
    } else {
      console.log("Generated prompt:", prompt)
    }
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl hover:bg-primary/10 transition-all duration-300 hover-lift border border-border/50 group"
        >
          <BrainCircuit className="w-5 h-5 sm:w-6 sm:h-6 text-primary group-hover:scale-110 transition-transform" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto glass-morphism">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">AI Prompt Builder</DialogTitle>
          <DialogDescription className="text-base">Create personalized healthcare search prompts using AI</DialogDescription>
        </DialogHeader>
        <AIPromptBuilder userProfile={userProfile} onPromptGenerated={handlePromptGenerated} />
      </DialogContent>
    </Dialog>
  )
}

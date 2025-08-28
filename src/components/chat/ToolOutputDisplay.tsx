"use client"

import React from "react"
import { ToolOutputCard } from "@/components/tool-output-card"
import { ClaudeCodeOutputCard } from "@/components/claude-code-output-card"

interface ToolOutputData {
  id: string
  toolName: string
  content: string | object
  timestamp: Date
  status?: "pending" | "executing" | "completed" | "error"
}

interface ClaudeCodeOutput {
  id: string
  result: any
  files_created: string[]
  files_modified: string[]
  console_outputs: string[]
  session: string
}

interface ToolOutputDisplayProps {
  toolOutputs: ToolOutputData[]
  claudeCodeOutputs: ClaudeCodeOutput[]
  isMobile?: boolean
}

export const ToolOutputDisplay = React.memo(function ToolOutputDisplay({
  toolOutputs,
  claudeCodeOutputs,
  isMobile = false
}: ToolOutputDisplayProps) {
  // Spacing classes based on layout
  const toolOutputSpacing = isMobile ? "mb-4" : "mb-6"

  return (
    <>
      {/* Show tool outputs */}
      {isMobile ? (
        <div className="space-y-4">
          {toolOutputs.map((output) => (
            <div key={output.id} className="animate-slide-up">
              <ToolOutputCard
                toolName={output.toolName}
                content={output.content}
                timestamp={output.timestamp}
                status={output.status}
                className=""
              />
            </div>
          ))}
        </div>
      ) : (
        toolOutputs.map((output) => (
          <div key={output.id} className={`animate-slide-up ${toolOutputSpacing}`}>
            <ToolOutputCard
              toolName={output.toolName}
              content={output.content}
              timestamp={output.timestamp}
              status={output.status}
              className=""
            />
          </div>
        ))
      )}

      {/* Show Claude Code outputs */}
      {claudeCodeOutputs.map((output) => (
        <div key={output.id} className={`animate-slide-up ${toolOutputSpacing}`}>
          <ClaudeCodeOutputCard
            result={output.result}
            files_created={output.files_created}
            files_modified={output.files_modified}
            console_outputs={output.console_outputs}
            session={output.session}
          />
        </div>
      ))}
    </>
  )
}, (prevProps, nextProps) => {
  // ToolOutputDisplay comparison - arrays of outputs
  const compareOutputArrays = (a: any[], b: any[]) => {
    if (a.length !== b.length) return false
    return a.every((item, index) => 
      item.id === b[index]?.id && 
      item.status === b[index]?.status &&
      JSON.stringify(item.content) === JSON.stringify(b[index]?.content)
    )
  }
  
  return (
    prevProps.isMobile === nextProps.isMobile &&
    compareOutputArrays(prevProps.toolOutputs, nextProps.toolOutputs) &&
    compareOutputArrays(prevProps.claudeCodeOutputs, nextProps.claudeCodeOutputs)
  )
})

export type { ToolOutputDisplayProps }
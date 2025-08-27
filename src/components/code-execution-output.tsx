"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp, Terminal, CheckCircle, XCircle, AlertCircle, Copy, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface CodeExecutionOutputProps {
  stdout?: string
  stderr?: string
  return_code?: number
  timestamp?: Date
  className?: string
}

export function CodeExecutionOutput({ 
  stdout, 
  stderr, 
  return_code = 0, 
  timestamp, 
  className 
}: CodeExecutionOutputProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [copiedStdout, setCopiedStdout] = useState(false)
  const [copiedStderr, setCopiedStderr] = useState(false)
  
  const isSuccess = return_code === 0
  const hasOutput = stdout || stderr
  
  const copyToClipboard = async (text: string, type: 'stdout' | 'stderr') => {
    await navigator.clipboard.writeText(text)
    if (type === 'stdout') {
      setCopiedStdout(true)
      setTimeout(() => setCopiedStdout(false), 2000)
    } else {
      setCopiedStderr(true)
      setTimeout(() => setCopiedStderr(false), 2000)
    }
  }
  
  if (!hasOutput) {
    return null
  }
  
  return (
    <Card className={cn(
      "shadow-sm transition-all duration-300",
      isSuccess ? "border-purple-200" : "border-red-200",
      isSuccess ? "bg-purple-50 dark:bg-purple-950/20" : "bg-red-50 dark:bg-red-950/20",
      className
    )}>
      <CardHeader className="pb-3 px-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center",
              isSuccess 
                ? "bg-gradient-to-r from-purple-500 to-purple-600" 
                : "bg-gradient-to-r from-red-500 to-red-600"
            )}>
              <Terminal className="w-4 h-4 text-white" />
            </div>
            <span className={cn(
              "text-sm font-semibold",
              isSuccess ? "text-purple-700 dark:text-purple-300" : "text-red-700 dark:text-red-300"
            )}>
              Python Code Execution
            </span>
            {isSuccess ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : (
              <XCircle className="w-4 h-4 text-red-600" />
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-6 w-6 p-0"
          >
            {isExpanded ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="px-4 pb-3">
        <div className={cn(
          "overflow-hidden transition-all duration-300",
          isExpanded ? "max-h-[500px]" : "max-h-0"
        )}>
          {/* Standard Output */}
          {stdout && (
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Output
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 px-2 text-xs"
                  onClick={() => copyToClipboard(stdout, 'stdout')}
                >
                  {copiedStdout ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                  <span className="ml-1">Copy</span>
                </Button>
              </div>
              <pre className="bg-gray-900 dark:bg-gray-950 text-gray-100 p-3 rounded-md overflow-x-auto">
                <code className="text-xs font-mono whitespace-pre">{stdout}</code>
              </pre>
            </div>
          )}
          
          {/* Error Output */}
          {stderr && (
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-red-600 dark:text-red-400 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Error Output
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 px-2 text-xs"
                  onClick={() => copyToClipboard(stderr, 'stderr')}
                >
                  {copiedStderr ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                  <span className="ml-1">Copy</span>
                </Button>
              </div>
              <pre className="bg-red-950 dark:bg-red-950/50 text-red-100 p-3 rounded-md overflow-x-auto">
                <code className="text-xs font-mono whitespace-pre">{stderr}</code>
              </pre>
            </div>
          )}
          
          {/* Exit Code */}
          {return_code !== undefined && return_code !== 0 && (
            <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
              <XCircle className="h-3 w-3" />
              <span>Exit code: {return_code}</span>
            </div>
          )}
        </div>
        
        {/* Timestamp */}
        {timestamp && (
          <span className="text-xs text-muted-foreground mt-2 block">
            {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </CardContent>
    </Card>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Code2, 
  FileText, 
  Terminal, 
  Copy, 
  Check, 
  Download,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  Play,
  RefreshCw
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism"

interface CodeFile {
  name: string
  language: string
  content: string
}

interface ClaudeCodePreviewProps {
  files?: CodeFile[]
  output?: string
  error?: string
  isExecuting?: boolean
  onExecute?: () => void
  onRefresh?: () => void
  className?: string
}

export function ClaudeCodePreview({
  files = [],
  output,
  error,
  isExecuting = false,
  onExecute,
  onRefresh,
  className
}: ClaudeCodePreviewProps) {
  const [activeFile, setActiveFile] = useState(0)
  const [copied, setCopied] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showLineNumbers, setShowLineNumbers] = useState(true)
  
  const handleCopy = async (content: string) => {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  const handleDownload = (file: CodeFile) => {
    const blob = new Blob([file.content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = file.name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
  
  // Detect language from file extension
  const getLanguageFromFile = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase()
    const languageMap: Record<string, string> = {
      js: 'javascript',
      jsx: 'jsx',
      ts: 'typescript',
      tsx: 'tsx',
      py: 'python',
      rb: 'ruby',
      go: 'go',
      rs: 'rust',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      cs: 'csharp',
      php: 'php',
      swift: 'swift',
      kt: 'kotlin',
      scala: 'scala',
      r: 'r',
      m: 'matlab',
      sql: 'sql',
      sh: 'bash',
      bash: 'bash',
      zsh: 'bash',
      ps1: 'powershell',
      yml: 'yaml',
      yaml: 'yaml',
      json: 'json',
      xml: 'xml',
      html: 'html',
      css: 'css',
      scss: 'scss',
      sass: 'sass',
      less: 'less',
      md: 'markdown',
      mdx: 'mdx'
    }
    return languageMap[ext || ''] || 'plaintext'
  }
  
  return (
    <Card className={cn(
      "overflow-hidden transition-all duration-300",
      isFullscreen && "fixed inset-4 z-50",
      className
    )}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-border bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm">
              <Code2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Claude Code Output</h3>
              <p className="text-xs text-muted-foreground">
                {files.length} file{files.length !== 1 ? 's' : ''} generated
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            {onExecute && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onExecute}
                disabled={isExecuting}
                className="h-8 px-3"
              >
                <Play className="h-4 w-4 mr-1" />
                {isExecuting ? 'Running...' : 'Run'}
              </Button>
            )}
            {onRefresh && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRefresh}
                className="h-8 w-8 p-0"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowLineNumbers(!showLineNumbers)}
              className="h-8 w-8 p-0"
            >
              {showLineNumbers ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="h-8 w-8 p-0"
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <Tabs defaultValue="code" className="flex-1">
        <TabsList className="w-full justify-start rounded-none border-b bg-transparent h-auto p-0">
          <TabsTrigger 
            value="code" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-4 py-2"
          >
            <FileText className="w-4 h-4 mr-2" />
            Code
          </TabsTrigger>
          {(output || error) && (
            <TabsTrigger 
              value="output" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-4 py-2"
            >
              <Terminal className="w-4 h-4 mr-2" />
              Output
              {error && (
                <span className="ml-2 w-2 h-2 rounded-full bg-red-500" />
              )}
            </TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="code" className="m-0">
          {files.length > 1 && (
            <div className="flex items-center gap-1 p-2 border-b border-border bg-muted/20 overflow-x-auto">
              {files.map((file, index) => (
                <Button
                  key={index}
                  variant={activeFile === index ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setActiveFile(index)}
                  className="h-7 text-xs whitespace-nowrap"
                >
                  {file.name}
                </Button>
              ))}
            </div>
          )}
          
          {files.length > 0 && (
            <div className="relative">
              <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(files[activeFile].content)}
                  className="h-7 w-7 p-0 bg-background/80 backdrop-blur-sm"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-green-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDownload(files[activeFile])}
                  className="h-7 w-7 p-0 bg-background/80 backdrop-blur-sm"
                >
                  <Download className="h-3.5 w-3.5" />
                </Button>
              </div>
              
              <ScrollArea className={cn(
                "w-full",
                isFullscreen ? "h-[calc(100vh-200px)]" : "max-h-[500px]"
              )}>
                <SyntaxHighlighter
                  style={oneDark as any}
                  language={files[activeFile].language || getLanguageFromFile(files[activeFile].name)}
                  showLineNumbers={showLineNumbers}
                  customStyle={{
                    margin: 0,
                    padding: '1rem',
                    fontSize: '0.875rem',
                    lineHeight: '1.5'
                  }}
                >
                  {files[activeFile].content}
                </SyntaxHighlighter>
              </ScrollArea>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="output" className="m-0 p-4">
          <ScrollArea className={cn(
            "w-full",
            isFullscreen ? "h-[calc(100vh-200px)]" : "max-h-[500px]"
          )}>
            {error ? (
              <div className="font-mono text-sm">
                <div className="text-red-500 mb-2">Error:</div>
                <pre className="whitespace-pre-wrap text-red-400">{error}</pre>
              </div>
            ) : output ? (
              <pre className="font-mono text-sm whitespace-pre-wrap">{output}</pre>
            ) : (
              <div className="text-muted-foreground text-sm">No output available</div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </Card>
  )
}
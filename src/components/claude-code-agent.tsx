"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Send, 
  File, 
  Copy, 
  Check, 
  FolderClosed, 
  FolderOpen,
  Loader2,
  Code,
  AlertTriangle,
  Wand2,
  Sparkles
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism"
import { cn } from "@/lib/utils"

interface FileInfo {
  path: string
  content?: string
}

interface ClaudeCodeResponse {
  success: boolean
  result: string
  files_created?: string[]
  files_modified?: string[]
  error?: string
}

interface ClaudeCodeAgentProps {
  className?: string
}

export function ClaudeCodeAgent({ className }: ClaudeCodeAgentProps) {
  const [prompt, setPrompt] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [response, setResponse] = useState<ClaudeCodeResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [workingDirectory, setWorkingDirectory] = useState("/Users/timhunter")
  const [maxTurns, setMaxTurns] = useState(1)
  const [fileContents, setFileContents] = useState<Record<string, string>>({})
  const [activeFile, setActiveFile] = useState<string | null>(null)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [copiedFile, setCopiedFile] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!prompt.trim() || isLoading) return

    setIsLoading(true)
    setError(null)
    setResponse(null)
    setFileContents({})
    setActiveFile(null)

    try {
      const res = await fetch('/api/claude-code-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          working_directory: workingDirectory,
          max_turns: maxTurns
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}`)
      }

      setResponse(data)

      // Load file contents for created and modified files
      if (data.files_created || data.files_modified) {
        const allFiles = [...(data.files_created || []), ...(data.files_modified || [])]
        const contents: Record<string, string> = {}

        for (const filePath of allFiles) {
          try {
            const fileRes = await fetch('/api/claude-code/execute', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                command: `cat "${filePath}"`,
                working_directory: workingDirectory
              })
            })
            
            if (fileRes.ok) {
              const fileData = await fileRes.json()
              if (fileData.success) {
                contents[filePath] = fileData.result
              }
            }
          } catch (err) {
            console.warn(`Failed to load content for ${filePath}:`, err)
          }
        }

        setFileContents(contents)
        
        // Set first file as active
        if (allFiles.length > 0) {
          setActiveFile(allFiles[0])
        }
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const copyFileContent = async (filePath: string) => {
    const content = fileContents[filePath]
    if (!content) return

    try {
      await navigator.clipboard.writeText(content)
      setCopiedFile(filePath)
      setTimeout(() => setCopiedFile(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const getLanguageFromPath = (filePath: string): string => {
    const ext = filePath.split('.').pop()?.toLowerCase()
    const langMap: Record<string, string> = {
      'tsx': 'tsx',
      'ts': 'typescript',
      'jsx': 'jsx', 
      'js': 'javascript',
      'py': 'python',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'json': 'json',
      'md': 'markdown',
      'yml': 'yaml',
      'yaml': 'yaml',
      'xml': 'xml',
      'sql': 'sql',
      'sh': 'bash',
      'dockerfile': 'dockerfile'
    }
    return langMap[ext || ''] || 'text'
  }

  const buildFileTree = (files: string[]) => {
    const tree: Record<string, any> = {}
    
    files.forEach(filePath => {
      const parts = filePath.split('/')
      let current = tree
      
      parts.forEach((part, index) => {
        if (index === parts.length - 1) {
          // It's a file
          current[part] = { type: 'file', path: filePath }
        } else {
          // It's a folder
          if (!current[part]) {
            current[part] = { type: 'folder', children: {} }
          }
          current = current[part].children
        }
      })
    })
    
    return tree
  }

  const renderFileTree = (tree: Record<string, any>, path: string = "", depth: number = 0): React.ReactNode[] => {
    return Object.entries(tree).map(([name, node]) => {
      const fullPath = path ? `${path}/${name}` : name
      
      if (node.type === 'file') {
        return (
          <Button
            key={node.path}
            variant={activeFile === node.path ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setActiveFile(node.path)}
            className={cn(
              "w-full justify-start h-7 text-xs font-normal",
              `pl-${4 + depth * 4}`
            )}
          >
            <File className="w-3 h-3 mr-2 flex-shrink-0" />
            <span className="truncate">{name}</span>
          </Button>
        )
      } else {
        const isExpanded = expandedFolders.has(fullPath)
        return (
          <div key={fullPath}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const newExpanded = new Set(expandedFolders)
                if (isExpanded) {
                  newExpanded.delete(fullPath)
                } else {
                  newExpanded.add(fullPath)
                }
                setExpandedFolders(newExpanded)
              }}
              className={cn(
                "w-full justify-start h-7 text-xs font-normal",
                `pl-${4 + depth * 4}`
              )}
            >
              {isExpanded ? (
                <FolderOpen className="w-3 h-3 mr-2 flex-shrink-0" />
              ) : (
                <FolderClosed className="w-3 h-3 mr-2 flex-shrink-0" />
              )}
              <span className="truncate">{name}</span>
            </Button>
            {isExpanded && (
              <div>
                {renderFileTree(node.children, fullPath, depth + 1)}
              </div>
            )}
          </div>
        )
      }
    })
  }

  const allFiles = response ? [...(response.files_created || []), ...(response.files_modified || [])] : []
  const fileTree = allFiles.length > 0 ? buildFileTree(allFiles) : {}

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 via-purple-600 to-pink-600 shadow-lg flex items-center justify-center">
          <Wand2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            Claude Code Agent
            <Sparkles className="w-5 h-5 text-purple-500" />
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Generate and modify applications with Claude's coding capabilities
          </p>
        </div>
      </div>

      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Prompt</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Describe what you'd like me to create or modify... (e.g., 'Create a React todo app with TypeScript')"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[120px] resize-none"
            disabled={isLoading}
          />
          
          <div className="flex gap-4 text-sm">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Working Directory</label>
              <input
                type="text"
                value={workingDirectory}
                onChange={(e) => setWorkingDirectory(e.target.value)}
                className="w-full px-3 py-1 text-xs border rounded bg-background"
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Max Turns</label>
              <input
                type="number"
                min="1"
                max="10"
                value={maxTurns}
                onChange={(e) => setMaxTurns(parseInt(e.target.value) || 1)}
                className="w-20 px-3 py-1 text-xs border rounded bg-background"
                disabled={isLoading}
              />
            </div>
          </div>

          <Button 
            onClick={handleSubmit}
            disabled={!prompt.trim() || isLoading}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Generate Code
              </>
            )}
          </Button>
          
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Tip: Use Cmd/Ctrl + Enter to submit
          </p>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Response Display */}
      {response && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Response Text */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="w-5 h-5" />
                Response
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <pre className="whitespace-pre-wrap text-sm bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border">
                  {response.result}
                </pre>
              </div>
            </CardContent>
          </Card>

          {/* File Explorer */}
          {allFiles.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <File className="w-5 h-5" />
                    Files ({allFiles.length})
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {renderFileTree(fileTree)}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* File Content Viewer */}
      {activeFile && fileContents[activeFile] && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <File className="w-5 h-5" />
                {activeFile}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyFileContent(activeFile)}
              >
                {copiedFile === activeFile ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <SyntaxHighlighter
                language={getLanguageFromPath(activeFile)}
                style={oneDark}
                customStyle={{
                  margin: 0,
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                }}
                showLineNumbers
                wrapLongLines
              >
                {fileContents[activeFile]}
              </SyntaxHighlighter>
            </div>
          </CardContent>
        </Card>
      )}

      {/* File Summary */}
      {response && (response.files_created?.length || response.files_modified?.length) && (
        <div className="flex gap-4 text-sm">
          {response.files_created && response.files_created.length > 0 && (
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>{response.files_created.length} files created</span>
            </div>
          )}
          {response.files_modified && response.files_modified.length > 0 && (
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>{response.files_modified.length} files modified</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
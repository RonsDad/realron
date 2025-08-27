"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
  Play,
  RefreshCw,
  FolderOpen,
  File,
  ChevronRight,
  ChevronDown,
  Wand2,
  Package,
  TestTube,
  Bug,
  Rocket
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism"
import ReactMarkdown from "react-markdown"

interface CodeFile {
  path: string
  content: string
  language: string
}

interface ConsoleOutput {
  command: string
  output: string
}

interface ClaudeCodeSession {
  id: string
  mode: string
  turns_used: number
  can_continue: boolean
}

interface ClaudeCodeOutputCardProps {
  result?: string
  files_created?: CodeFile[]
  files_modified?: string[]
  console_outputs?: ConsoleOutput[]
  session?: ClaudeCodeSession
  isStreaming?: boolean
  onContinue?: (sessionId: string) => void
  onNewSession?: () => void
  onExecute?: () => void
  className?: string
  showPreview?: boolean
}

const MODE_ICONS = {
  create: <Package className="w-4 h-4" />,
  test: <TestTube className="w-4 h-4" />,
  debug: <Bug className="w-4 h-4" />,
  deploy: <Rocket className="w-4 h-4" />
}

const MODE_COLORS = {
  create: "bg-blue-500",
  test: "bg-green-500",
  debug: "bg-orange-500",
  deploy: "bg-purple-500"
}

export function ClaudeCodeOutputCard({
  result,
  files_created = [],
  files_modified = [],
  console_outputs = [],
  session,
  isStreaming = false,
  onContinue,
  onNewSession,
  onExecute,
  className,
  showPreview = true
}: ClaudeCodeOutputCardProps) {
  const [activeFile, setActiveFile] = useState(0)
  const [copied, setCopied] = useState(false)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState("preview")
  const [previewContent, setPreviewContent] = useState<string>('')
  const [previewType, setPreviewType] = useState<'html' | 'react' | 'python'>('html')
  
  // Build file tree structure
  const buildFileTree = () => {
    const tree: any = {}
    
    files_created.forEach(file => {
      const parts = file.path.split('/')
      let current = tree
      
      parts.forEach((part, index) => {
        if (index === parts.length - 1) {
          // It's a file
          current[part] = file
        } else {
          // It's a folder
          if (!current[part]) {
            current[part] = {}
          }
          current = current[part]
        }
      })
    })
    
    return tree
  }
  
  const renderFileTree = (tree: any, path: string = "") => {
    return Object.entries(tree).map(([name, value]) => {
      const fullPath = path ? `${path}/${name}` : name
      const isFile = value.hasOwnProperty('content')
      
      if (isFile) {
        const file = value as CodeFile
        const fileIndex = files_created.findIndex(f => f.path === file.path)
        return (
          <Button
            key={fullPath}
            variant={activeFile === fileIndex ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setActiveFile(fileIndex)}
            className="w-full justify-start h-7 pl-6 text-xs"
          >
            <File className="w-3 h-3 mr-2" />
            {name}
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
              className="w-full justify-start h-7 text-xs"
            >
              {isExpanded ? <ChevronDown className="w-3 h-3 mr-1" /> : <ChevronRight className="w-3 h-3 mr-1" />}
              <FolderOpen className="w-3 h-3 mr-2" />
              {name}
            </Button>
            {isExpanded && (
              <div className="ml-2">
                {renderFileTree(value, fullPath)}
              </div>
            )}
          </div>
        )
      }
    })
  }
  
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
    a.download = file.path.split('/').pop() || 'file.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
  
  const downloadAllFiles = () => {
    // In a real implementation, this would create a ZIP file
    files_created.forEach(file => handleDownload(file))
  }
  
  // Generate preview content based on files created
  useEffect(() => {
    if (files_created.length > 0) {
      // Find HTML file or combine HTML/CSS/JS files
      const htmlFile = files_created.find(f => f.path.endsWith('.html'))
      const cssFiles = files_created.filter(f => f.path.endsWith('.css'))
      const jsFiles = files_created.filter(f => f.path.endsWith('.js'))
      const tsxFiles = files_created.filter(f => f.path.endsWith('.tsx') || f.path.endsWith('.jsx'))
      const pyFiles = files_created.filter(f => f.path.endsWith('.py'))
      
      if (htmlFile) {
        // If there's an HTML file, use it as the preview
        let htmlContent = htmlFile.content
        
        // Inject CSS files if they exist
        if (cssFiles.length > 0) {
          const cssContent = cssFiles.map(f => `<style>\n${f.content}\n</style>`).join('\n')
          htmlContent = htmlContent.replace('</head>', `${cssContent}\n</head>`)
        }
        
        // Inject JS files if they exist
        if (jsFiles.length > 0) {
          const jsContent = jsFiles.map(f => `<script>\n${f.content}\n</script>`).join('\n')
          htmlContent = htmlContent.replace('</body>', `${jsContent}\n</body>`)
        }
        
        setPreviewContent(htmlContent)
        setPreviewType('html')
      } else if (cssFiles.length > 0 || jsFiles.length > 0) {
        // Create a basic HTML wrapper for CSS/JS
        const cssContent = cssFiles.map(f => f.content).join('\n')
        const jsContent = jsFiles.map(f => f.content).join('\n')
        
        const htmlWrapper = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview</title>
  <style>
    body { font-family: system-ui; padding: 20px; }
    ${cssContent}
  </style>
</head>
<body>
  <div id="root"></div>
  <script>
    ${jsContent}
  </script>
</body>
</html>`
        
        setPreviewContent(htmlWrapper)
        setPreviewType('html')
      } else if (tsxFiles.length > 0) {
        // For React/TSX files, compile and render them live
        const tsxContent = tsxFiles[0].content
        const cssContent = cssFiles.map(f => f.content).join('\n')
        
        // Create HTML that compiles and renders React components in browser
        const htmlWrapper = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>React Preview</title>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>
    body { font-family: system-ui; margin: 0; padding: 20px; }
    ${cssContent}
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    ${tsxContent.replace(/export\s+default\s+/g, '').replace(/import\s+.*?from\s+['"].*?['"];?\s*/g, '')}
    
    // Auto-render the first component found or App component
    const components = [typeof App !== 'undefined' && App, typeof Component !== 'undefined' && Component].filter(Boolean);
    if (components.length > 0) {
      const RootComponent = components[0];
      ReactDOM.render(<RootComponent />, document.getElementById('root'));
    }
  </script>
</body>
</html>`
        
        setPreviewContent(htmlWrapper)
        setPreviewType('html')
      } else if (pyFiles.length > 0 && console_outputs.length > 0) {
        // For Python files with console output
        setPreviewContent(console_outputs.map(o => o.output).join('\n'))
        setPreviewType('python')
      }
      
      // Auto-switch to preview tab if content is available
      if (showPreview && (htmlFile || cssFiles.length > 0 || jsFiles.length > 0)) {
        setActiveTab('preview')
      }
    }
  }, [files_created, console_outputs, showPreview])
  
  return (
    <Card className={cn("overflow-hidden", className)}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-border bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm">
              <Wand2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-sm flex items-center gap-2">
                Claude Code Output
                {session && (
                  <Badge variant="outline" className="text-xs">
                    {MODE_ICONS[session.mode as keyof typeof MODE_ICONS]}
                    <span className="ml-1">{session.mode}</span>
                  </Badge>
                )}
              </h3>
              <p className="text-xs text-muted-foreground">
                {files_created.length} files created
                {files_modified.length > 0 && `, ${files_modified.length} modified`}
                {session && ` • Turn ${session.turns_used}`}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {session?.can_continue && onContinue && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onContinue(session.id)}
                disabled={isStreaming}
              >
                Continue Session
              </Button>
            )}
            {onNewSession && (
              <Button
                variant="outline"
                size="sm"
                onClick={onNewSession}
                disabled={isStreaming}
              >
                New Session
              </Button>
            )}
            {onExecute && (
              <Button
                variant="default"
                size="sm"
                onClick={onExecute}
                disabled={isStreaming}
              >
                <Play className="w-4 h-4 mr-1" />
                Run Project
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
        <TabsList className="w-full justify-start rounded-none border-b bg-transparent h-auto p-0">
          {showPreview && previewContent && (
            <TabsTrigger 
              value="preview" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-4 py-2"
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </TabsTrigger>
          )}
          <TabsTrigger 
            value="explanation" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-4 py-2"
          >
            <FileText className="w-4 h-4 mr-2" />
            Explanation
          </TabsTrigger>
          {files_created.length > 0 && (
            <TabsTrigger 
              value="files" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-4 py-2"
            >
              <Code2 className="w-4 h-4 mr-2" />
              Files ({files_created.length})
            </TabsTrigger>
          )}
          {console_outputs.length > 0 && (
            <TabsTrigger 
              value="console" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-4 py-2"
            >
              <Terminal className="w-4 h-4 mr-2" />
              Console
            </TabsTrigger>
          )}
        </TabsList>
        
        {/* Preview Tab */}
        {showPreview && previewContent && (
          <TabsContent value="preview" className="m-0">
            <div className="relative h-[500px] bg-white">
              {previewType === 'html' ? (
                <iframe
                  srcDoc={previewContent}
                  className="w-full h-full border-0"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                  title="Live Preview"
                />
              ) : previewType === 'python' ? (
                <div className="p-4 bg-gray-900 text-green-400 font-mono text-sm h-full overflow-auto">
                  <pre className="whitespace-pre-wrap">{previewContent}</pre>
                </div>
              ) : null}
            </div>
          </TabsContent>
        )}
        
        {/* Explanation Tab */}
        <TabsContent value="explanation" className="m-0 p-4">
          <ScrollArea className="h-[400px]">
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown>
                {result || "Claude Code is processing your request..."}
              </ReactMarkdown>
            </div>
          </ScrollArea>
        </TabsContent>
        
        {/* Files Tab */}
        <TabsContent value="files" className="m-0 flex">
          <div className="w-48 border-r border-border bg-muted/20">
            <div className="p-2 border-b border-border flex items-center justify-between">
              <span className="text-xs font-medium">File Explorer</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={downloadAllFiles}
                className="h-6 px-2"
              >
                <Download className="w-3 h-3" />
              </Button>
            </div>
            <ScrollArea className="h-[400px]">
              <div className="p-1">
                {renderFileTree(buildFileTree())}
              </div>
            </ScrollArea>
          </div>
          
          <div className="flex-1">
            {files_created.length > 0 && (
              <div className="relative">
                <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(files_created[activeFile].content)}
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
                    onClick={() => handleDownload(files_created[activeFile])}
                    className="h-7 w-7 p-0 bg-background/80 backdrop-blur-sm"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                </div>
                
                <ScrollArea className="h-[400px]">
                  <SyntaxHighlighter
                    style={oneDark as any}
                    language={files_created[activeFile].language}
                    showLineNumbers={true}
                    customStyle={{
                      margin: 0,
                      padding: '1rem',
                      fontSize: '0.875rem',
                      lineHeight: '1.5'
                    }}
                  >
                    {files_created[activeFile].content}
                  </SyntaxHighlighter>
                </ScrollArea>
              </div>
            )}
          </div>
        </TabsContent>
        
        {/* Console Tab */}
        <TabsContent value="console" className="m-0 p-4">
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {console_outputs.map((output, index) => (
                <div key={index} className="font-mono text-sm">
                  <div className="text-green-500 mb-1">$ {output.command}</div>
                  <pre className="text-muted-foreground whitespace-pre-wrap pl-4">
                    {output.output}
                  </pre>
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </Card>
  )
}
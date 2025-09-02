"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Monitor, 
  Smartphone, 
  Tablet,
  Maximize2,
  Minimize2,
  RefreshCw,
  ExternalLink,
  Loader2,
  Play,
  Square,
  RotateCcw,
  Code,
  Terminal,
  Eye,
  Settings,
  Zap,
  CheckCircle,
  XCircle,
  Clock,
  Pause
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useCodePreview } from "@/hooks/use-code-preview"

interface InteractiveCodePreviewProps {
  projectPath?: string
  files?: Record<string, string>
  buildConfig?: {
    framework?: string
    buildTool?: 'next' | 'vite' | 'webpack' | 'nuxt' | 'angular'
    packageManager?: 'pnpm' | 'npm' | 'yarn'
    cssFramework?: 'tailwind' | 'scss' | 'styled-components'
    uiLibrary?: 'mui' | 'vuetify' | 'primevue' | 'antd'
  }
  onBuildStart?: () => void
  onBuildComplete?: (url: string) => void
  onBuildError?: (error: string) => void
  className?: string
  autoStart?: boolean
  showLogs?: boolean
  showDeviceToggle?: boolean
  showFullscreen?: boolean
}

const deviceModes = [
  { id: 'desktop', label: 'Desktop', icon: Monitor, width: 1200, height: 800 },
  { id: 'tablet', label: 'Tablet', icon: Tablet, width: 768, height: 1024 },
  { id: 'mobile', label: 'Mobile', icon: Smartphone, width: 375, height: 667 }
] as const

const statusIcons = {
  initializing: Clock,
  detecting: Eye,
  installing_deps: Loader2,
  building: Code,
  starting_server: Zap,
  ready: CheckCircle,
  error: XCircle,
  stopped: Square
}

const statusColors = {
  initializing: 'text-blue-500',
  detecting: 'text-purple-500',
  installing_deps: 'text-yellow-500',
  building: 'text-orange-500',
  starting_server: 'text-green-500',
  ready: 'text-green-600',
  error: 'text-red-500',
  stopped: 'text-gray-500'
}

export function InteractiveCodePreview({
  projectPath,
  files,
  buildConfig,
  onBuildStart,
  onBuildComplete,
  onBuildError,
  className,
  autoStart = false,
  showLogs = true,
  showDeviceToggle = true,
  showFullscreen = true
}: InteractiveCodePreviewProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showBuildLogs, setShowBuildLogs] = useState(false)
  const [iframeLoaded, setIframeLoaded] = useState(false)
  
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const logsEndRef = useRef<HTMLDivElement>(null)
  
  const { previewState, actions, utils } = useCodePreview()
  
  // REMOVED: Auto-scroll behavior - user controls scrolling
  
  // Handle build lifecycle callbacks
  useEffect(() => {
    if (previewState.isBuilding && onBuildStart) {
      onBuildStart()
    }
  }, [previewState.isBuilding, onBuildStart])
  
  useEffect(() => {
    if (previewState.previewUrl && previewState.appReady && onBuildComplete) {
      onBuildComplete(previewState.previewUrl)
    }
  }, [previewState.previewUrl, previewState.appReady, onBuildComplete])
  
  useEffect(() => {
    if (previewState.buildError && onBuildError) {
      onBuildError(previewState.buildError)
    }
  }, [previewState.buildError, onBuildError])
  
  // Auto-start if requested
  useEffect(() => {
    if (autoStart && (projectPath || files)) {
      handleStartBuild()
    }
  }, [autoStart, projectPath, files])
  
  const handleStartBuild = async () => {
    if (projectPath) {
      await actions.startBuild(projectPath, buildConfig)
    } else if (files) {
      // Convert files to temporary project directory
      // This would integrate with the backend orchestrator
      console.log('Files-based build not yet implemented in hook')
    }
  }
  
  const handleIframeLoad = () => {
    setIframeLoaded(true)
  }
  
  const getCurrentDevice = () => {
    return deviceModes.find(device => device.id === previewState.deviceMode) || deviceModes[0]
  }
  
  const getViewportStyle = () => {
    if (isFullscreen) {
      return { width: '100%', height: '100%' }
    }
    
    const device = getCurrentDevice()
    return {
      width: `${device.width}px`,
      height: `${device.height}px`,
      maxWidth: '100%',
      maxHeight: '600px'
    }
  }
  
  const StatusIcon = statusIcons[previewState.status] || Clock
  
  return (
    <Card className={cn(
      "relative overflow-hidden transition-all duration-500",
      isFullscreen && "fixed inset-4 z-50",
      className
    )}>
      {/* Header */}
      <div className="relative z-30 px-4 py-3 border-b border-border bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 via-purple-600 to-pink-600 flex items-center justify-center shadow-lg"
            >
              <Code className="w-5 h-5 text-white" />
            </motion.div>
            
            <div>
              <h3 className="font-semibold text-sm flex items-center gap-2">
                Interactive Code Preview
                {previewState.projectType && (
                  <Badge variant="secondary" className="text-xs">
                    {previewState.projectType}
                  </Badge>
                )}
              </h3>
              
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <StatusIcon className={cn("w-4 h-4", statusColors[previewState.status])} />
                <span className="capitalize">{previewState.status.replace('_', ' ')}</span>
                
                {previewState.isBuilding && (
                  <div className="flex items-center gap-1">
                    <span>•</span>
                    <span>{previewState.buildProgress}%</span>
                  </div>
                )}
                
                {previewState.hotReloadEnabled && (
                  <Badge variant="outline" className="text-xs">
                    <Zap className="w-3 h-3 mr-1" />
                    Hot Reload
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            {/* Device Toggle */}
            {showDeviceToggle && previewState.previewUrl && (
              <div className="flex items-center gap-1 mr-2">
                {deviceModes.map((device) => {
                  const DeviceIcon = device.icon
                  return (
                    <Button
                      key={device.id}
                      variant={previewState.deviceMode === device.id ? "default" : "ghost"}
                      size="sm"
                      onClick={() => actions.setDeviceMode(device.id)}
                      className="h-8 w-8 p-0"
                      title={`${device.label} (${device.width}×${device.height})`}
                    >
                      <DeviceIcon className="h-4 w-4" />
                    </Button>
                  )
                })}
              </div>
            )}
            
            {/* Build Controls */}
            {!previewState.previewUrl && (
              <Button
                variant="default"
                size="sm"
                onClick={handleStartBuild}
                disabled={previewState.isBuilding}
                className="h-8 px-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {previewState.isBuilding ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    Building...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-1" />
                    Start Preview
                  </>
                )}
              </Button>
            )}
            
            {previewState.previewUrl && (
              <>
                {previewState.isBuilding ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={actions.stopBuild}
                    className="h-8 w-8 p-0"
                  >
                    <Square className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={actions.restartPreview}
                    className="h-8 w-8 p-0"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={actions.openInNewTab}
                  className="h-8 w-8 p-0"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </>
            )}
            
            {/* Build Logs Toggle */}
            {showLogs && (
              <Button
                variant={showBuildLogs ? "default" : "ghost"}
                size="sm"
                onClick={() => setShowBuildLogs(!showBuildLogs)}
                className="h-8 w-8 p-0"
              >
                <Terminal className="h-4 w-4" />
              </Button>
            )}
            
            {/* Fullscreen Toggle */}
            {showFullscreen && (
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
            )}
          </div>
        </div>
        
        {/* Build Progress Bar */}
        {previewState.isBuilding && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span>Building project...</span>
              <span>{previewState.buildProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${previewState.buildProgress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        )}
      </div>
      
      <div className="flex">
        {/* Main Preview Area */}
        <div className={cn(
          "relative bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex-1",
          isFullscreen ? "h-[calc(100vh-120px)]" : "h-[600px]"
        )}>
          {previewState.previewUrl ? (
            <div className="h-full flex items-center justify-center p-4">
              <div 
                className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl overflow-hidden transition-all duration-300"
                style={getViewportStyle()}
              >
                {!iframeLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                  </div>
                )}
                
                <iframe
                  ref={iframeRef}
                  src={previewState.previewUrl}
                  className={cn(
                    "w-full h-full border-0 transition-opacity duration-500",
                    iframeLoaded ? "opacity-100" : "opacity-0"
                  )}
                  onLoad={handleIframeLoad}
                  title="Interactive Preview"
                  sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-downloads"
                  allow="accelerometer; camera; encrypted-media; geolocation; gyroscope; microphone; clipboard-read; clipboard-write"
                />
              </div>
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                {previewState.isBuilding ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                  >
                    <Code className="w-16 h-16 mx-auto text-blue-500 mb-4" />
                  </motion.div>
                ) : previewState.buildError ? (
                  <XCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
                ) : (
                  <motion.div
                    animate={{
                      y: [0, -10, 0]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <Play className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  </motion.div>
                )}
                
                <p className="text-lg font-medium text-muted-foreground">
                  {previewState.isBuilding 
                    ? "Building your application..."
                    : previewState.buildError
                    ? "Build failed"
                    : "Click 'Start Preview' to begin"
                  }
                </p>
                
                {previewState.buildError && (
                  <p className="text-sm text-red-600 mt-2 max-w-md">
                    {previewState.buildError}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Build Logs Sidebar */}
        <AnimatePresence>
          {showBuildLogs && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 400, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="border-l border-border bg-muted/20"
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <Terminal className="w-4 h-4" />
                    Build Logs
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={actions.clearBuildLogs}
                    className="h-6 px-2 text-xs"
                  >
                    Clear
                  </Button>
                </div>
                
                <ScrollArea className={cn(
                  "rounded border bg-black/90 text-green-400 font-mono text-xs",
                  isFullscreen ? "h-[calc(100vh-200px)]" : "h-[520px]"
                )}>
                  <div className="p-3">
                    {previewState.buildLogs.length === 0 ? (
                      <div className="text-gray-500 italic">
                        No build logs yet...
                      </div>
                    ) : (
                      previewState.buildLogs.map((log, index) => (
                        <div key={index} className="mb-1 whitespace-pre-wrap">
                          {log}
                        </div>
                      ))
                    )}
                    <div ref={logsEndRef} />
                  </div>
                </ScrollArea>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Status Bar */}
      <div className="relative z-30 px-4 py-2 border-t border-border bg-muted/30 flex items-center justify-between text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-2 h-2 rounded-full",
              previewState.appReady ? "bg-green-500" : 
              previewState.isBuilding ? "bg-yellow-500 animate-pulse" : 
              previewState.buildError ? "bg-red-500" : "bg-gray-400"
            )} />
            <span className="text-muted-foreground">
              {previewState.appReady ? "Ready" : 
               previewState.isBuilding ? "Building..." : 
               previewState.buildError ? "Error" : "Idle"}
            </span>
          </div>
          
          {previewState.dev_port && (
            <span className="text-muted-foreground">
              Port: {previewState.dev_port}
            </span>
          )}
          
          {previewState.projectType && (
            <span className="text-muted-foreground">
              {previewState.projectType.charAt(0).toUpperCase() + previewState.projectType.slice(1)}
            </span>
          )}
        </div>
        
        {previewState.sessionId && (
          <span className="text-muted-foreground font-mono">
            {previewState.sessionId.slice(0, 8)}...
          </span>
        )}
      </div>
    </Card>
  )
}
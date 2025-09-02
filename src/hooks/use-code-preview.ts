"use client"

import { useState, useEffect, useRef } from "react"
import { claudeAPI } from "@/lib/api"

interface CodePreviewState {
  isBuilding: boolean
  buildLogs: string[]
  previewUrl: string | null
  sessionId: string | null
  deviceMode: 'desktop' | 'mobile' | 'tablet' | 'custom'
  appReady: boolean
  buildError: string | null
  projectType: 'react' | 'vue' | 'nuxt' | 'html' | 'next' | 'angular' | null
  buildProgress: number
  hotReloadEnabled: boolean
  ports: {
    dev?: number
    api?: number
  }
}

interface ProjectBuildConfig {
  framework: string
  buildTool: 'vite' | 'webpack' | 'next' | 'nuxt' | 'angular'
  packageManager: 'pnpm' | 'npm' | 'yarn'
  cssFramework?: 'tailwind' | 'scss' | 'styled-components'
  uiLibrary?: 'mui' | 'vuetify' | 'primevue' | 'antd'
}

export function useCodePreview() {
  const [previewState, setPreviewState] = useState<CodePreviewState>({
    isBuilding: false,
    buildLogs: [],
    previewUrl: null,
    sessionId: null,
    deviceMode: 'desktop',
    appReady: false,
    buildError: null,
    projectType: null,
    buildProgress: 0,
    hotReloadEnabled: false,
    ports: {}
  })
  
  const buildStreamRef = useRef<EventSource | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const addBuildLog = (log: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setPreviewState(prev => ({
      ...prev,
      buildLogs: [...prev.buildLogs, `[${timestamp}] ${log}`]
    }))
  }

  const clearBuildLogs = () => {
    setPreviewState(prev => ({
      ...prev,
      buildLogs: []
    }))
  }

  const setDeviceMode = (mode: CodePreviewState['deviceMode']) => {
    setPreviewState(prev => ({
      ...prev,
      deviceMode: mode
    }))
  }

  const startBuild = async (
    projectPath: string, 
    buildConfig?: ProjectBuildConfig
  ) => {
    console.log('Starting build for project:', projectPath)
    
    // Reset state
    setPreviewState(prev => ({
      ...prev,
      isBuilding: true,
      buildError: null,
      buildProgress: 0,
      previewUrl: null,
      appReady: false,
      sessionId: `preview_${Date.now()}`
    }))
    
    clearBuildLogs()
    addBuildLog('Initializing build process...')
    
    try {
      // Create abort controller for this build
      abortControllerRef.current = new AbortController()
      
      // Start build process
      const response = await fetch('/api/code-preview/build', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectPath,
          buildConfig: buildConfig || {
            framework: 'auto-detect',
            buildTool: 'vite',
            packageManager: 'pnpm',
            cssFramework: 'tailwind'
          }
        }),
        signal: abortControllerRef.current.signal
      })
      
      if (!response.ok) {
        throw new Error(`Build request failed: ${response.statusText}`)
      }
      
      const { sessionId, buildStreamUrl } = await response.json()
      
      setPreviewState(prev => ({
        ...prev,
        sessionId
      }))
      
      // Start listening to build stream
      startBuildStream(buildStreamUrl)
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Build initialization failed'
      console.error('Build start error:', error)
      addBuildLog(`ERROR: ${errorMsg}`)
      
      setPreviewState(prev => ({
        ...prev,
        isBuilding: false,
        buildError: errorMsg
      }))
    }
  }

  const startBuildStream = (streamUrl: string) => {
    console.log('Starting build stream:', streamUrl)
    
    if (buildStreamRef.current) {
      buildStreamRef.current.close()
    }
    
    buildStreamRef.current = new EventSource(streamUrl)
    
    buildStreamRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        
        switch (data.type) {
          case 'log':
            addBuildLog(data.message)
            break
            
          case 'progress':
            setPreviewState(prev => ({
              ...prev,
              buildProgress: data.progress
            }))
            break
            
          case 'project_detected':
            addBuildLog(`Detected ${data.framework} project with ${data.buildTool}`)
            setPreviewState(prev => ({
              ...prev,
              projectType: data.framework
            }))
            break
            
          case 'deps_installing':
            addBuildLog(`Installing dependencies with ${data.packageManager}...`)
            break
            
          case 'build_starting':
            addBuildLog(`Starting ${data.buildTool} build process...`)
            break
            
          case 'dev_server_starting':
            addBuildLog(`Starting development server...`)
            setPreviewState(prev => ({
              ...prev,
              ports: { ...prev.ports, dev: data.port }
            }))
            break
            
          case 'hot_reload_enabled':
            addBuildLog('Hot reload enabled - changes will update automatically')
            setPreviewState(prev => ({
              ...prev,
              hotReloadEnabled: true
            }))
            break
            
          case 'build_complete':
            addBuildLog(`✅ Build complete! Preview available at ${data.url}`)
            setPreviewState(prev => ({
              ...prev,
              isBuilding: false,
              previewUrl: data.url,
              appReady: true,
              buildProgress: 100
            }))
            break
            
          case 'build_error':
            addBuildLog(`❌ Build failed: ${data.error}`)
            setPreviewState(prev => ({
              ...prev,
              isBuilding: false,
              buildError: data.error,
              buildProgress: 0
            }))
            break
            
          case 'file_changed':
            if (previewState.hotReloadEnabled) {
              addBuildLog(`🔄 File changed: ${data.filename} - reloading...`)
            }
            break
            
          default:
            console.log('Unknown build event:', data)
        }
      } catch (error) {
        console.error('Error parsing build stream data:', error)
      }
    }
    
    buildStreamRef.current.onerror = (error) => {
      console.error('Build stream error:', error)
      addBuildLog('❌ Build stream connection lost')
      setPreviewState(prev => ({
        ...prev,
        isBuilding: false,
        buildError: 'Build stream connection lost'
      }))
    }
  }

  const stopBuild = async () => {
    console.log('Stopping build process...')
    
    // Abort any ongoing requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    // Close build stream
    if (buildStreamRef.current) {
      buildStreamRef.current.close()
      buildStreamRef.current = null
    }
    
    // Stop build via API if we have a session
    if (previewState.sessionId) {
      try {
        await fetch(`/api/code-preview/build/${previewState.sessionId}/stop`, {
          method: 'POST'
        })
      } catch (error) {
        console.error('Error stopping build:', error)
      }
    }
    
    addBuildLog('🛑 Build process stopped')
    setPreviewState(prev => ({
      ...prev,
      isBuilding: false,
      buildProgress: 0
    }))
  }

  const restartPreview = async () => {
    if (!previewState.sessionId) return
    
    console.log('Restarting preview...')
    addBuildLog('🔄 Restarting preview...')
    
    try {
      const response = await fetch(`/api/code-preview/build/${previewState.sessionId}/restart`, {
        method: 'POST'
      })
      
      if (response.ok) {
        const { buildStreamUrl } = await response.json()
        startBuildStream(buildStreamUrl)
      }
    } catch (error) {
      console.error('Error restarting preview:', error)
      addBuildLog('❌ Failed to restart preview')
    }
  }

  const openInNewTab = () => {
    if (previewState.previewUrl) {
      window.open(previewState.previewUrl, '_blank', 'noopener,noreferrer')
    }
  }

  const getViewportSize = () => {
    switch (previewState.deviceMode) {
      case 'mobile':
        return { width: 375, height: 667 } // iPhone SE
      case 'tablet':
        return { width: 768, height: 1024 } // iPad
      case 'desktop':
        return { width: 1200, height: 800 }
      default:
        return { width: 1200, height: 800 }
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (buildStreamRef.current) {
        buildStreamRef.current.close()
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  // Auto-cleanup when preview becomes inactive
  useEffect(() => {
    if (!previewState.appReady && buildStreamRef.current) {
      // Keep stream open while building
      return
    }
  }, [previewState.appReady])

  return {
    previewState,
    actions: {
      startBuild,
      stopBuild,
      restartPreview,
      setDeviceMode,
      openInNewTab,
      clearBuildLogs,
    },
    utils: {
      getViewportSize,
      addBuildLog,
    }
  }
}
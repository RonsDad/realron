'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Monitor, User, Bot, Power, Settings, Maximize2, Minimize2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import RFB from '@novnc/novnc/core/rfb'

interface ComputerUseEmbeddedProps {
  sessionId: string
  onControlChange?: (mode: 'ai' | 'human') => void
  className?: string
}

export const ComputerUseEmbedded: React.FC<ComputerUseEmbeddedProps> = ({
  sessionId,
  onControlChange,
  className = ''
}) => {
  // Refs
  const canvasRef = useRef<HTMLDivElement>(null)
  const rfbRef = useRef<RFB | null>(null)
  const wsRef = useRef<WebSocket | null>(null)

  // State
  const [controlMode, setControlMode] = useState<'ai' | 'human'>('ai')
  const [connectionState, setConnectionState] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [desktopResolution, setDesktopResolution] = useState('1280x720')
  const [lastScreenshot, setLastScreenshot] = useState<string | null>(null)

  // Configuration - using the correct ports from docker-compose
  const vncUrl = 'ws://localhost:6080'
  const computerUseApiUrl = 'http://localhost:8888' // Changed to match docker-compose port mapping

  // Initialize VNC connection
  const initializeVNC = useCallback(async () => {
    if (!canvasRef.current || rfbRef.current) return

    try {
      setConnectionState('connecting')

      // Create RFB connection
      const rfb = new RFB(canvasRef.current, `${vncUrl}/websockify`)
      rfbRef.current = rfb

      // Configure RFB settings
      rfb.viewOnly = controlMode === 'ai' // AI mode = view only
      rfb.scaleViewport = true
      rfb.resizeSession = false
      rfb.clipViewport = true
      rfb.dragViewport = false

      // Event listeners
      rfb.addEventListener('connect', handleVNCConnect)
      rfb.addEventListener('disconnect', handleVNCDisconnect)
      rfb.addEventListener('credentialsrequired', handleVNCCredentials)
      rfb.addEventListener('desktopname', handleDesktopName)
      rfb.addEventListener('capabilities', handleCapabilities)

      toast.success('Connecting to desktop...')

    } catch (error) {
      console.error('VNC initialization error:', error)
      setConnectionState('disconnected')
      toast.error('Failed to connect to desktop')
    }
  }, [controlMode, vncUrl])

  // VNC event handlers
  const handleVNCConnect = useCallback(() => {
    console.log('VNC connected')
    setConnectionState('connected')
    toast.success('Connected to desktop')
  }, [])

  const handleVNCDisconnect = useCallback((e: any) => {
    console.log('VNC disconnected:', e.detail)
    setConnectionState('disconnected')
    
    if (e.detail.clean) {
      toast.success('Disconnected from desktop')
    } else {
      toast.error('Desktop connection lost')
    }

    // Cleanup
    if (rfbRef.current) {
      rfbRef.current = null
    }
  }, [])

  const handleVNCCredentials = useCallback((e: any) => {
    console.log('VNC credentials required')
    // Use default password from environment
    if (rfbRef.current) {
      rfbRef.current.sendCredentials({ password: 'ronai123' })
    }
  }, [])

  const handleDesktopName = useCallback((e: any) => {
    console.log('Desktop name:', e.detail.name)
  }, [])

  const handleCapabilities = useCallback((e: any) => {
    console.log('VNC capabilities:', e.detail)
  }, [])

  // Initialize WebSocket for computer use updates
  const initializeWebSocket = useCallback(() => {
    if (wsRef.current) return

    try {
      const wsUrl = `${computerUseApiUrl.replace('http', 'ws')}/api/computer-use/ws/${sessionId}`
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        console.log('Computer use WebSocket connected')
        
        // Request initial desktop state
        ws.send(JSON.stringify({
          type: 'desktop_request'
        }))
      }

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data)
        
        switch (data.type) {
          case 'desktop_update':
            setLastScreenshot(data.screenshot)
            break
          
          case 'control_update':
            setControlMode(data.mode)
            updateVNCControlMode(data.mode)
            break
          
          case 'pong':
            // Heartbeat response
            break
        }
      }

      ws.onclose = () => {
        console.log('Computer use WebSocket disconnected')
        wsRef.current = null
        
        // Reconnect after delay
        setTimeout(initializeWebSocket, 5000)
      }

      ws.onerror = (error) => {
        console.error('Computer use WebSocket error:', error)
      }

    } catch (error) {
      console.error('WebSocket initialization error:', error)
    }
  }, [sessionId, computerUseApiUrl])

  // Update VNC control mode
  const updateVNCControlMode = useCallback((mode: 'ai' | 'human') => {
    if (rfbRef.current) {
      rfbRef.current.viewOnly = mode === 'ai'
      
      if (mode === 'human') {
        rfbRef.current.focus()
      } else {
        rfbRef.current.blur()
      }
    }
  }, [])

  // Control mode handlers
  const handleTakeControl = useCallback(async () => {
    try {
      const response = await fetch(`${computerUseApiUrl}/api/computer-use/control`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          session_id: sessionId,
          control_mode: 'human'
        })
      })

      if (response.ok) {
        setControlMode('human')
        updateVNCControlMode('human')
        onControlChange?.('human')
        toast.success('You now have desktop control')
      } else {
        toast.error('Failed to take control')
      }
    } catch (error) {
      console.error('Take control error:', error)
      toast.error('Failed to take control')
    }
  }, [sessionId, computerUseApiUrl, onControlChange, updateVNCControlMode])

  const handleGiveControl = useCallback(async () => {
    try {
      const response = await fetch(`${computerUseApiUrl}/api/computer-use/control`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          session_id: sessionId,
          control_mode: 'ai'
        })
      })

      if (response.ok) {
        setControlMode('ai')
        updateVNCControlMode('ai')
        onControlChange?.('ai')
        toast.success('Control returned to AI')
      } else {
        toast.error('Failed to give control to AI')
      }
    } catch (error) {
      console.error('Give control error:', error)
      toast.error('Failed to give control to AI')
    }
  }, [sessionId, computerUseApiUrl, onControlChange, updateVNCControlMode])

  // Fullscreen handlers
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen)
  }, [isFullscreen])

  // Heartbeat
  useEffect(() => {
    const heartbeat = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping' }))
      }
    }, 30000) // 30 seconds

    return () => clearInterval(heartbeat)
  }, [])

  // Initialize connections
  useEffect(() => {
    initializeVNC()
    initializeWebSocket()

    return () => {
      // Cleanup VNC
      if (rfbRef.current) {
        rfbRef.current.disconnect()
        rfbRef.current = null
      }

      // Cleanup WebSocket
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [initializeVNC, initializeWebSocket])

  return (
    <div className={`ron-ai-computer-use-embedded ${isFullscreen ? 'fixed inset-0 z-50 bg-black' : 'relative'} ${className}`}>
      {/* Control Panel */}
      <div className="bg-gray-900 text-white p-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Monitor className="h-5 w-5" />
          <span className="font-medium">Ron AI Computer Use</span>
          
          {/* Connection Status */}
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              connectionState === 'connected' ? 'bg-green-400' : 
              connectionState === 'connecting' ? 'bg-yellow-400' : 'bg-red-400'
            }`} />
            <span className="text-sm capitalize">{connectionState}</span>
          </div>

          {/* Resolution */}
          <span className="text-sm text-gray-400">{desktopResolution}</span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Control Mode Indicator */}
          <div className={`flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium ${
            controlMode === 'ai' ? 'bg-blue-600' : 'bg-green-600'
          }`}>
            {controlMode === 'ai' ? <Bot className="h-3 w-3" /> : <User className="h-3 w-3" />}
            <span>{controlMode === 'ai' ? 'AI Control' : 'Human Control'}</span>
          </div>

          {/* Control Buttons */}
          {controlMode === 'ai' ? (
            <button
              onClick={handleTakeControl}
              disabled={connectionState !== 'connected'}
              className="px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded text-sm font-medium transition-colors"
            >
              Take Control
            </button>
          ) : (
            <button
              onClick={handleGiveControl}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors"
            >
              Give to AI
            </button>
          )}

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-1 text-gray-400 hover:text-white transition-colors"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Desktop Display */}
      <div className={`relative bg-gray-800 ${isFullscreen ? 'flex-1' : 'h-96'}`}>
        {connectionState === 'disconnected' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <Monitor className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Desktop disconnected</p>
              <button
                onClick={initializeVNC}
                className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
              >
                Reconnect
              </button>
            </div>
          </div>
        )}

        {connectionState === 'connecting' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2" />
              <p>Connecting to desktop...</p>
            </div>
          </div>
        )}

        {/* VNC Canvas Container */}
        <div 
          ref={canvasRef}
          className="w-full h-full"
          style={{ minHeight: isFullscreen ? '100%' : '384px' }}
        />
      </div>

      {/* Status Bar */}
      <div className="bg-gray-800 text-gray-400 px-3 py-2 text-xs flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span>Session: {sessionId.slice(0, 8)}...</span>
          {lastScreenshot && (
            <span>Last Update: {new Date().toLocaleTimeString()}</span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <span>Mode: {controlMode === 'ai' ? 'View Only' : 'Interactive'}</span>
        </div>
      </div>
    </div>
  )
}
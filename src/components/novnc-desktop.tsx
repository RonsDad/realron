"use client"

import { useEffect, useRef, useState } from "react"
import { Monitor, Loader2, AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface NoVNCDesktopProps {
  vncUrl?: string
  password?: string
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: string) => void
  className?: string
}

export function NoVNCDesktop({
  vncUrl = "ws://localhost:6080/websockify",
  password = "computer123",
  onConnect,
  onDisconnect,
  onError,
  className = ""
}: NoVNCDesktopProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected')
  const [errorMessage, setErrorMessage] = useState<string>("")
  const [rfb, setRfb] = useState<any>(null)

  useEffect(() => {
    let RFB: any = null

    // Dynamically load NoVNC
    const loadNoVNC = async () => {
      try {
        // Load NoVNC from CDN
        if (typeof window !== 'undefined' && !window.RFB) {
          const script = document.createElement('script')
          script.src = 'https://novnc.com/noVNC/core/rfb.js'
          script.onload = () => {
            RFB = window.RFB
            initializeVNC()
          }
          script.onerror = () => {
            setStatus('error')
            setErrorMessage('Failed to load NoVNC library')
            onError?.('Failed to load NoVNC library')
          }
          document.head.appendChild(script)
        } else if (window.RFB) {
          RFB = window.RFB
          initializeVNC()
        }
      } catch (error) {
        setStatus('error')
        setErrorMessage('Failed to initialize NoVNC')
        onError?.('Failed to initialize NoVNC')
      }
    }

    const initializeVNC = () => {
      if (!containerRef.current || !RFB) return

      try {
        setStatus('connecting')
        
        const rfbInstance = new RFB(containerRef.current, vncUrl, {
          credentials: { password }
        })

        // Event handlers
        rfbInstance.addEventListener('connect', () => {
          setStatus('connected')
          onConnect?.()
        })

        rfbInstance.addEventListener('disconnect', () => {
          setStatus('disconnected')
          onDisconnect?.()
        })

        rfbInstance.addEventListener('credentialsrequired', () => {
          rfbInstance.sendCredentials({ password })
        })

        rfbInstance.addEventListener('securityfailure', (e: any) => {
          setStatus('error')
          setErrorMessage('Authentication failed')
          onError?.('Authentication failed')
        })

        setRfb(rfbInstance)

      } catch (error) {
        setStatus('error')
        setErrorMessage('Connection failed')
        onError?.('Connection failed')
      }
    }

    loadNoVNC()

    return () => {
      if (rfb) {
        rfb.disconnect()
      }
    }
  }, [vncUrl, password, onConnect, onDisconnect, onError])

  const handleReconnect = () => {
    if (rfb) {
      rfb.disconnect()
    }
    setStatus('disconnected')
    setErrorMessage("")
    
    // Reinitialize after a short delay
    setTimeout(() => {
      window.location.reload() // Simple reconnect by reloading
    }, 1000)
  }

  const renderStatus = () => {
    switch (status) {
      case 'connecting':
        return (
          <div className="flex flex-col items-center justify-center h-full bg-gray-50 dark:bg-neutral-900">
            <Loader2 className="w-12 h-12 mb-4 text-blue-500 animate-spin" />
            <p className="text-sm text-gray-600 dark:text-gray-400">Connecting to desktop...</p>
            <p className="text-xs mt-1 text-gray-500">Establishing VNC connection</p>
          </div>
        )
      
      case 'error':
        return (
          <div className="flex flex-col items-center justify-center h-full bg-gray-50 dark:bg-neutral-900">
            <AlertCircle className="w-12 h-12 mb-4 text-red-500" />
            <p className="text-sm text-red-600 dark:text-red-400">Connection Failed</p>
            <p className="text-xs mt-1 text-gray-500">{errorMessage}</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-3"
              onClick={handleReconnect}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reconnect
            </Button>
          </div>
        )
      
      case 'disconnected':
        return (
          <div className="flex flex-col items-center justify-center h-full bg-gray-50 dark:bg-neutral-900">
            <Monitor className="w-12 h-12 mb-4 text-gray-400" />
            <p className="text-sm text-gray-600 dark:text-gray-400">Desktop Disconnected</p>
            <p className="text-xs mt-1 text-gray-500">Click reconnect to establish connection</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-3"
              onClick={handleReconnect}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Connect
            </Button>
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <div className={`relative w-full h-full ${className}`}>
      {status !== 'connected' && renderStatus()}
      <div 
        ref={containerRef} 
        className={`w-full h-full ${status !== 'connected' ? 'hidden' : ''}`}
        style={{ 
          background: '#000',
          minHeight: '400px'
        }}
      />
    </div>
  )
}

// Extend window type for NoVNC
declare global {
  interface Window {
    RFB: any
  }
}

"use client"

import { useState, useEffect } from "react"
import { Monitor, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface DesktopEmbedProps {
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: string) => void
  className?: string
}

export function DesktopEmbed({
  onConnect,
  onDisconnect,
  onError,
  className = ""
}: DesktopEmbedProps) {
  const [session, setSession] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>("")

  const createDesktopSession = async () => {
    setIsLoading(true)
    setError("")
    
    try {
      // Use existing Browserless infrastructure to create a session
      // that navigates to your EC2 VNC web interface
      const response = await fetch('/api/browser-use/session/create-with-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: `http://${process.env.NEXT_PUBLIC_EC2_IP || 'localhost'}:6080/vnc.html?autoconnect=true&password=computer123`,
          timeout_ms: 3600000 // 1 hour
        }),
      })

      const data = await response.json()
      if (data.success) {
        setSession(data)
        onConnect?.()
      } else {
        throw new Error(data.error || 'Failed to create desktop session')
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Connection failed'
      setError(errorMsg)
      onError?.(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  const closeSession = async () => {
    if (!session) return
    
    try {
      await fetch(`/api/browser-use/session/${session.session_id}/close`, {
        method: 'DELETE'
      })
      setSession(null)
      onDisconnect?.()
    } catch (err) {
      console.error('Error closing session:', err)
    }
  }

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-96 ${className}`}>
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 text-blue-500 animate-spin" />
          <p className="text-sm text-gray-600">Connecting to desktop...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center h-96 ${className}`}>
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <p className="text-sm text-red-600 mb-4">{error}</p>
          <Button onClick={createDesktopSession}>Retry</Button>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className={`flex items-center justify-center h-96 ${className}`}>
        <div className="text-center">
          <Monitor className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-sm text-gray-600 mb-4">Ready to connect to desktop</p>
          <Button onClick={createDesktopSession}>Connect Desktop</Button>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      <iframe
        src={session.iframe_embed.src}
        className="w-full h-full border-0 rounded-lg"
        title="Desktop Session"
        style={{ minHeight: '600px' }}
      />
      <Button
        onClick={closeSession}
        className="absolute top-2 right-2 z-10"
        size="sm"
        variant="destructive"
      >
        Disconnect
      </Button>
    </div>
  )
}

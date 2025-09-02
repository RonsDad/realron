"use client"

import { useState } from "react"
import { Monitor, Globe, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SessionConfig {
  type: 'browser' | 'desktop'
  url?: string
  timeout_ms?: number
}

interface Session {
  session_id: string
  live_url: string
  type: 'browser' | 'desktop'
  iframe_embed: {
    src: string
    width: string
    height: string
  }
}

interface SessionManagerProps {
  config: SessionConfig
  onSessionCreated?: (session: Session) => void
  onSessionClosed?: (sessionId: string) => void
  className?: string
}

export function SessionManager({
  config,
  onSessionCreated,
  onSessionClosed,
  className = ""
}: SessionManagerProps) {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>("")

  const createSession = async () => {
    setIsLoading(true)
    setError("")
    
    try {
      const url = config.type === 'desktop' 
        ? `http://${process.env.NEXT_PUBLIC_EC2_IP}:6080/vnc.html?autoconnect=true&password=computer123`
        : config.url || 'https://duckduckgo.com'

      const response = await fetch('/api/browser-use/session/create-with-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          timeout_ms: config.timeout_ms || 600000
        }),
      })

      const data = await response.json()
      if (data.success) {
        const sessionData = { ...data, type: config.type }
        setSession(sessionData)
        onSessionCreated?.(sessionData)
      } else {
        throw new Error(data.error || 'Failed to create session')
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Connection failed'
      setError(errorMsg)
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
      onSessionClosed?.(session.session_id)
      setSession(null)
    } catch (err) {
      console.error('Error closing session:', err)
    }
  }

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-96 ${className}`}>
        <div className="text-center">
          <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin" />
          <p className="text-sm">Connecting to {config.type}...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center h-96 ${className}`}>
        <div className="text-center">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-500" />
          <p className="text-sm text-red-600 mb-2">{error}</p>
          <Button size="sm" onClick={createSession}>Retry</Button>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className={`flex items-center justify-center h-96 ${className}`}>
        <div className="text-center">
          {config.type === 'desktop' ? (
            <Monitor className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          ) : (
            <Globe className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          )}
          <p className="text-sm text-gray-600 mb-2">Ready to connect</p>
          <Button size="sm" onClick={createSession}>
            Connect {config.type === 'desktop' ? 'Desktop' : 'Browser'}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      <iframe
        src={session.iframe_embed.src}
        className="w-full h-full border-0"
        title={`${config.type} session`}
        style={{ minHeight: '400px' }}
      />
    </div>
  )
}

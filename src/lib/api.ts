// API service for communicating with Claude agent backend
// In browser, go through Next.js API routes to avoid CORS/startup races
const API_BASE_URL =
  typeof window !== 'undefined'
    ? (process.env.NEXT_PUBLIC_API_URL ?? '/api')
    : (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000')

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatRequest {
  messages: ChatMessage[]
  system_prompt?: string
  temperature?: number
  max_tokens?: number
  tools?: string[]
  enable_caching?: boolean
  cache_ttl?: string
  enable_thinking?: boolean
  thinking_budget?: number
  enable_citations?: boolean
  stream?: boolean
}

export interface ChatResponse {
  success: boolean
  response: {
    content: Array<{
      type: string
      text?: string
      tool_use?: {
        id: string
        name: string
        input: any
      }
    }>
    usage?: {
      input_tokens: number
      output_tokens: number
      cache_creation_input_tokens?: number
      cache_read_input_tokens?: number
    }
  }
  error?: string
}

export class ClaudeAPI {
  private baseURL: string

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL
  }

  private async sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }

  private async fetchWithRetry(input: RequestInfo | URL, init: RequestInit, attempts = 5, baseDelayMs = 400): Promise<Response> {
    let lastErr: any
    for (let i = 0; i < attempts; i++) {
      try {
        const res = await fetch(input, init)
        if (res.ok) return res
        lastErr = new Error(`API error: ${res.status} ${res.statusText}`)
      } catch (e) {
        lastErr = e
      }
      await this.sleep(baseDelayMs * Math.pow(1.5, i))
    }
    throw lastErr
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const response = await this.fetchWithRetry(`${this.baseURL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    })
    return response.json()
  }

  async chatStream(request: ChatRequest): Promise<ReadableStream<Uint8Array>> {
    const response = await this.fetchWithRetry(`${this.baseURL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...request, stream: true }),
    })
    if (!response.body) throw new Error('No response body')
    return response.body
  }

  async healthcareAnalyze(task: string, context?: any) {
    const response = await fetch(`${this.baseURL}/healthcare/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ task, context }),
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  async createDeepResearchSession(userId: string) {
    const appName = 'deep_research_app'
    console.log('Creating deep research session for user:', userId)
    
    const response = await fetch(`${this.baseURL}/api/apps/${appName}/users/${userId}/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    })
    
    if (!response.ok) {
      throw new Error(`Failed to create session: ${response.status} ${response.statusText}`)
    }
    
    const session = await response.json()
    console.log('Session created:', session)
    return session.id
  }

  async deepResearch(userMessage: string, sessionId: string, userId: string) {
    console.log('=== DEEP RESEARCH API CALL ===')
    console.log('URL:', `${this.baseURL}/api/run_sse`)
    console.log('Payload:', {
      message: userMessage,
      sessionId,
      userId
    })
    
    const response = await fetch(`${this.baseURL}/api/run_sse`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: userMessage,
        sessionId,
        userId
      }),
    })

    console.log('Response status:', response.status)
    console.log('Response ok:', response.ok)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Deep research API error:', errorText)
      throw new Error(`API error: ${response.status} ${response.statusText} - ${errorText}`)
    }

    return response.body
  }
}

// Export singleton instance
export const claudeAPI = new ClaudeAPI()

// Helper function to parse SSE stream
export async function* parseSSEStream(stream: ReadableStream<Uint8Array>) {
  const reader = stream.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim()
          if (data && data !== '[DONE]') {
            try {
              yield JSON.parse(data)
            } catch (e) {
              console.error('Failed to parse SSE data:', e)
            }
          }
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
} 
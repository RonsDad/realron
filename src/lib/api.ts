// API service for communicating with Claude agent backend
// Direct connection to FastAPI for reduced latency (skip Next.js proxy)
const API_BASE_URL =
  typeof window !== 'undefined'
    ? (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8001')
    : (process.env.NEXT_PUBLIC_API_URL ?? (process.env.BACKEND_URL ?? 'http://localhost:8001'))

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
  private activeStreams: Map<string, AbortController> = new Map()

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL
  }

  private async sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }

  private async fetchWithRetry(input: RequestInfo | URL, init: RequestInit, attempts = 2, baseDelayMs = 100): Promise<Response> {
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

  // Check if error is recoverable for streaming
  private isRecoverableStreamError(error: any): boolean {
    if (error.code === 'ECONNRESET' || 
        error.code === 'ECONNABORTED' ||
        error.code === 'ETIMEDOUT') return true;
    
    if (error.name === 'AbortError') return true;
    
    if (error.message?.includes('net::ERR_INCOMPLETE_CHUNKED_ENCODING') ||
        error.message?.includes('Parse error') ||
        error.message?.includes('network error')) return true;
    
    return false;
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
    return this.chatStreamWithRetry(request, 3);
  }

  // Enhanced streaming with retry logic and proper error handling
  async chatStreamWithRetry(request: ChatRequest, maxRetries: number = 3, timeoutMs: number = 60000): Promise<ReadableStream<Uint8Array>> {
    const streamId = `stream-${Date.now()}-${Math.random()}`;
    let attempt = 0;
    
    while (attempt <= maxRetries) {
      try {
        // Create abort controller for this attempt
        const abortController = new AbortController();
        this.activeStreams.set(streamId, abortController);
        
        // Set up timeout
        const timeoutId = setTimeout(() => {
          console.warn(`Stream ${streamId} attempt ${attempt + 1} timed out`);
          abortController.abort();
        }, timeoutMs);

        const response = await fetch(`${this.baseURL}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...request, stream: true }),
          signal: abortController.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        if (!response.body) {
          throw new Error('No response body received');
        }

        // Wrap the stream with error handling
        return this.wrapStreamWithErrorHandling(response.body, streamId, abortController);

      } catch (error: any) {
        console.error(`Stream attempt ${attempt + 1} failed:`, error);
        
        // Clean up
        this.activeStreams.delete(streamId);
        
        // Check if we should retry
        if (attempt < maxRetries && this.isRecoverableStreamError(error)) {
          attempt++;
          const delay = Math.min(1000 * Math.pow(2, attempt), 5000); // Exponential backoff, max 5s
          console.log(`Retrying stream in ${delay}ms... (attempt ${attempt + 1}/${maxRetries + 1})`);
          await this.sleep(delay);
          continue;
        } else {
          // Final failure
          throw new Error(`Stream failed after ${attempt + 1} attempts: ${error.message}`);
        }
      }
    }
    
    throw new Error(`Stream failed after ${maxRetries + 1} attempts`);
  }

  // Wrap stream with enhanced error handling
  private wrapStreamWithErrorHandling(
    originalStream: ReadableStream<Uint8Array>, 
    streamId: string, 
    abortController: AbortController
  ): ReadableStream<Uint8Array> {
    const self = this;
    
    return new ReadableStream({
      start(controller) {
        const reader = originalStream.getReader();
        
        const pump = async () => {
          try {
            while (true) {
              const { done, value } = await reader.read();
              
              if (done) {
                self.activeStreams.delete(streamId);
                controller.close();
                return;
              }
              
              if (abortController.signal.aborted) {
                throw new Error('Stream was aborted');
              }
              
              controller.enqueue(value);
            }
          } catch (error: any) {
            console.error(`Stream ${streamId} error during reading:`, error);
            self.activeStreams.delete(streamId);
            
            if (error.name === 'AbortError') {
              controller.error(new Error('Stream was aborted or timed out'));
            } else if (error.message?.includes('net::ERR_INCOMPLETE_CHUNKED_ENCODING')) {
              controller.error(new Error('Network error: Incomplete chunked encoding. Please try again.'));
            } else {
              controller.error(error);
            }
          } finally {
            try {
              reader.releaseLock();
            } catch (e) {
              // Ignore lock release errors
            }
          }
        };
        
        pump();
      },
      
      cancel() {
        console.log(`Stream ${streamId} was cancelled`);
        self.activeStreams.delete(streamId);
        abortController.abort();
      }
    });
  }

  // Method to abort specific stream
  abortStream(streamId: string): void {
    const controller = this.activeStreams.get(streamId);
    if (controller) {
      controller.abort();
      this.activeStreams.delete(streamId);
    }
  }

  // Method to abort all active streams
  abortAllStreams(): void {
    console.log(`Aborting ${this.activeStreams.size} active streams`);
    this.activeStreams.forEach(controller => controller.abort());
    this.activeStreams.clear();
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
    
    // Use proxy route: base '/api' + '/apps/...'
    const response = await fetch(`${this.baseURL}/apps/${appName}/users/${userId}/sessions`, {
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
    console.log('URL:', `${this.baseURL}/run_sse`)
    console.log('Payload:', {
      message: userMessage,
      sessionId,
      userId
    })
    
    // Create abort controller for deep research stream
    const streamId = `deep-research-${Date.now()}`;
    const abortController = new AbortController();
    this.activeStreams.set(streamId, abortController);
    
    // Set timeout for deep research (longer timeout)
    const timeoutId = setTimeout(() => {
      console.warn(`Deep research stream timed out`);
      abortController.abort();
    }, 300000); // 5 minutes timeout for deep research
    
    try {
      // Proxy route: base '/api' + '/run_sse'
      const response = await fetch(`${this.baseURL}/run_sse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          sessionId,
          userId
        }),
        signal: abortController.signal
      })

      clearTimeout(timeoutId);

      console.log('Response status:', response.status)
      console.log('Response ok:', response.ok)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Deep research API error:', errorText)
        throw new Error(`API error: ${response.status} ${response.statusText} - ${errorText}`)
      }

      if (!response.body) {
        throw new Error('No response body received from deep research API')
      }

      // Wrap deep research stream with error handling
      return this.wrapStreamWithErrorHandling(response.body, streamId, abortController);

    } catch (error: any) {
      console.error('Deep research stream error:', error);
      this.activeStreams.delete(streamId);
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error('Deep research timed out or was aborted. Please try again.');
      } else if (error.message?.includes('net::ERR_INCOMPLETE_CHUNKED_ENCODING')) {
        throw new Error('Network error during deep research. Please try again.');
      } else {
        throw error;
      }
    }
  }

  // Computer Use VNC API methods
  async initializeComputerUse(): Promise<{
    success: boolean
    vnc_url?: string
    display?: { width: number; height: number }
    message?: string
    error?: string
  }> {
    try {
      const response = await this.fetchWithRetry(`${this.baseURL}/computer-use/initialize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      return await response.json()
    } catch (error) {
      console.error('Failed to initialize computer use:', error)
      return { success: false, error: `Failed to initialize computer use: ${error}` }
    }
  }

  async getVncUrl(): Promise<{
    success: boolean
    vnc_url?: string
    message?: string
    error?: string
  }> {
    try {
      const response = await this.fetchWithRetry(`${this.baseURL}/computer-use/vnc-url`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })
      return await response.json()
    } catch (error) {
      console.error('Failed to get VNC URL:', error)
      return { success: false, error: `Failed to get VNC URL: ${error}` }
    }
  }

  async closeComputerUse(): Promise<{
    success: boolean
    message?: string
    error?: string
  }> {
    try {
      const response = await this.fetchWithRetry(`${this.baseURL}/computer-use/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      return await response.json()
    } catch (error) {
      console.error('Failed to close computer use session:', error)
      return { success: false, error: `Failed to close computer use session: ${error}` }
    }
  }
}

// Export singleton instance
export const claudeAPI = new ClaudeAPI()

// Enhanced SSE stream parser with error handling and timeouts
export async function* parseSSEStream(stream: ReadableStream<Uint8Array>, timeoutMs: number = 30000) {
  const reader = stream.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let lastActivity = Date.now()

  try {
    while (true) {
      // Check for timeout
      if (Date.now() - lastActivity > timeoutMs) {
        throw new Error(`SSE stream timed out after ${timeoutMs}ms of inactivity`);
      }

      const { done, value } = await reader.read()
      if (done) break

      lastActivity = Date.now() // Reset timeout on activity
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim()
          if (data && data !== '[DONE]') {
            try {
              const parsed = JSON.parse(data)
              yield parsed
              lastActivity = Date.now() // Reset timeout on successful parse
            } catch (e) {
              console.error('Failed to parse SSE data:', e)
              console.error('Raw data:', data)
              // Don't throw here, just log and continue
              // This allows the stream to recover from individual parse errors
            }
          } else if (data === '[DONE]') {
            console.log('SSE stream completed with [DONE] signal')
            return
          }
        }
      }
    }
  } catch (error: any) {
    console.error('SSE stream error:', error)
    
    if (error.name === 'AbortError') {
      throw new Error('Stream was aborted')
    } else if (error.message?.includes('net::ERR_INCOMPLETE_CHUNKED_ENCODING')) {
      throw new Error('Network connection interrupted. Please try again.')
    } else {
      throw error
    }
  } finally {
    try {
      reader.releaseLock()
    } catch (e) {
      // Ignore lock release errors
      console.warn('Error releasing stream reader:', e)
    }
  }
} 
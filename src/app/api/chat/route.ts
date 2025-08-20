import { NextRequest, NextResponse } from 'next/server'

// Build an ordered list of backend bases to try
const BACKEND_BASE_CANDIDATES: string[] = [
  process.env.BACKEND_URL!,
  process.env.BACKEND_API_URL!,
  process.env.NEXT_PUBLIC_BACKEND_BASE_URL!,
  'http://localhost:8765', // FastAPI log default
  'http://localhost:8001', // legacy
  'http://localhost:8000', // earlier default
].filter(Boolean)

async function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }

async function fetchWithRetry(input: string, init: RequestInit, attempts = 2, baseDelayMs = 100) {
  let lastErr: any
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(input, init)
      if (res.ok) return res
      lastErr = new Error(`Backend responded with ${res.status}`)
    } catch (e) {
      lastErr = e
    }
    await sleep(baseDelayMs * Math.pow(1.5, i))
  }
  throw lastErr
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Try each backend base until one responds
    let response: Response | null = null
    let lastErr: any
    for (const base of BACKEND_BASE_CANDIDATES) {
      try {
        response = await fetchWithRetry(`${base}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (response?.ok || response?.status === 200) break
      } catch (e) {
        lastErr = e
      }
    }
    if (!response) throw lastErr || new Error('No backend available')
    
    if (!response.ok) {
      throw new Error(`Backend responded with ${response.status}`)
    }
    
    // Handle streaming response
    if (body.stream) {
      return new Response(response.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      })
    }
    
    // Handle regular response
    const data = await response.json()
    return NextResponse.json(data)
    
  } catch (error) {
    console.error('Error calling Claude API:', error)
    return NextResponse.json(
      { error: 'Failed to call Claude API' },
      { status: 500 }
    )
  }
}
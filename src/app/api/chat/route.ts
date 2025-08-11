import { NextRequest, NextResponse } from 'next/server'

// Prefer 127.0.0.1 over localhost to avoid resolver/proxy issues on some systems
const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://127.0.0.1:8001'

async function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }

async function fetchWithRetry(input: string, init: RequestInit, attempts = 6, baseDelayMs = 300) {
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
    
    // Proxy request to Python backend with retry (handles startup race)
    const response = await fetchWithRetry(`${BACKEND_API_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    
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
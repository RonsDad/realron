import { NextRequest, NextResponse } from "next/server";

interface BrowserbaseSessionRequest {
  url?: string;
  timeout_ms?: number;
  browserWidth?: number;
  browserHeight?: number;
}

interface BrowserbaseSessionResponse {
  success: boolean;
  session_id?: string;
  live_url?: string;
  iframe_embed?: {
    src: string;
    width: string;
    height: string;
    style: string;
    title: string;
    frameborder: string;
    allowfullscreen: boolean;
  };
  instructions?: {
    usage: string;
    example_html: string;
    note: string;
  };
  timestamp?: string;
  timeout_ms?: number;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: BrowserbaseSessionRequest = await request.json();

    // Forward request to Python backend for Browserbase MCP integration
    const response = await fetch(
      "http://localhost:8001/api/browserbase/session/create",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: body.url || "about:blank",
          timeout_ms: body.timeout_ms || 600000, // 10 minutes default
          browserWidth: body.browserWidth || 1280,
          browserHeight: body.browserHeight || 720,
        }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.error || `Backend responded with ${response.status}`,
      );
    }

    const data: BrowserbaseSessionResponse = await response.json();

    // Ensure response format matches BrowserUseIframe expectations
    if (data.success && data.session_id && data.live_url) {
      return NextResponse.json({
        success: true,
        session_id: data.session_id,
        live_url: data.live_url,
        timeout_ms: data.timeout_ms || body.timeout_ms || 600000,
        iframe_embed: data.iframe_embed || {
          src: data.live_url,
          width: "100%",
          height: "600px",
          style: "border: none; border-radius: 8px;",
          title: "Browserbase Live Session",
          frameborder: "0",
          allowfullscreen: true,
        },
        instructions: data.instructions || {
          usage:
            "This is a live browser session running on Browserbase. You can interact with it directly.",
          example_html: `<iframe src="${data.live_url}" width="100%" height="600px"></iframe>`,
          note: "Session will automatically timeout after the specified duration.",
        },
        timestamp: new Date().toISOString(),
      });
    } else {
      throw new Error(data.error || "Failed to create Browserbase session");
    }
  } catch (error) {
    console.error("Error creating Browserbase session:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to create Browserbase session",
      },
      { status: 500 },
    );
  }
}

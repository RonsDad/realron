import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Use browser-use Cloud API through backend tool system
    const toolRequest = {
      tool_name: "browser_use_cloud_automation",
      tool_input: {
        task:
          body.task || "Navigate to the web and prepare for user interaction",
        use_case: body.use_case || "ultra-fast",
        stealth_mode: body.stealth_mode !== false, // Default to true
      },
    };

    const response = await fetch(
      "http://localhost:8765/execute-agent-tool-stream",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(toolRequest),
      },
    );

    if (!response.ok) {
      throw new Error(`Backend responded with ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error creating browser-use Cloud session:", error);
    return NextResponse.json(
      { error: "Failed to create browser-use Cloud session" },
      { status: 500 },
    );
  }
}

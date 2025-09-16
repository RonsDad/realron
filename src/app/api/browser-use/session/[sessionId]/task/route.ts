import { NextResponse } from "next/server";

export async function POST(request: Request, context: any) {
  try {
    const { task, action } = await request.json();
    const sessionId = context.params.sessionId;

    if (!task && !action) {
      return NextResponse.json(
        { success: false, error: "Task or action is required" },
        { status: 400 },
      );
    }

    let toolRequest: any = {};

    // Handle different actions with browser-use Cloud API
    switch (action) {
      case "pause":
        toolRequest = {
          tool_name: "browser_use_cloud_pause",
          tool_input: {
            task_id: sessionId,
            reason: task || "Manual pause requested",
          },
        };
        break;
      case "resume":
        toolRequest = {
          tool_name: "browser_use_cloud_resume",
          tool_input: {
            task_id: sessionId,
            human_actions: task || "",
            additional_instructions: "",
          },
        };
        break;
      case "stop":
        toolRequest = {
          tool_name: "browser_use_cloud_stop",
          tool_input: {
            task_id: sessionId,
          },
        };
        break;
      case "status":
        toolRequest = {
          tool_name: "browser_use_cloud_status",
          tool_input: {
            task_id: sessionId,
          },
        };
        break;
      default:
        // Execute new task
        toolRequest = {
          tool_name: "browser_use_cloud_automation",
          tool_input: {
            task: task,
            use_case: "ultra-fast",
            stealth_mode: true,
          },
        };
    }

    const backendUrl = process.env.BACKEND_URL || "http://localhost:8001";
    const response = await fetch(`${backendUrl}/execute-agent-tool-stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(toolRequest),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        {
          success: false,
          error:
            errorData.detail ||
            `Backend request failed with status ${response.status}`,
        },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error executing browser task:", error);
    return new NextResponse(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      { status: 500 },
    );
  }
}

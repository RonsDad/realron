"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  ExternalLink,
  Globe,
  X,
  RefreshCw,
  Play,
  MessageSquare,
  Zap,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface BrowserbaseSession {
  success: boolean;
  session_id: string;
  live_url: string;
  timeout_ms: number;
  iframe_embed: {
    src: string;
    width: string;
    height: string;
    style: string;
    title: string;
    frameborder: string;
    allowfullscreen: boolean;
  };
  instructions: {
    usage: string;
    example_html: string;
    note: string;
  };
  timestamp: string;
  error?: string;
}

interface BrowserbaseIframeProps {
  defaultUrl?: string;
  onSessionCreated?: (session: BrowserbaseSession) => void;
  onSessionClosed?: (sessionId: string) => void;
}

export default function BrowserbaseIframe({
  defaultUrl = "https://google.com",
  onSessionCreated,
  onSessionClosed,
}: BrowserbaseIframeProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<BrowserbaseSession | null>(null);
  const [url, setUrl] = useState(defaultUrl);
  const [isNavigating, setIsNavigating] = useState(false);
  const [task, setTask] = useState("");
  const [isExecutingTask, setIsExecutingTask] = useState(false);
  const [taskResult, setTaskResult] = useState<string | null>(null);

  const createBrowserbaseSession = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/browserbase/session/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: url,
          timeout_ms: 600000, // 10 minutes
          browserWidth: 1280,
          browserHeight: 720,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error || "Failed to create Browserbase session",
        );
      }

      const data = await response.json();
      if (data.success) {
        setSession(data);
        onSessionCreated?.(data);
      } else {
        throw new Error(data.error || "Failed to create Browserbase session");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToUrl = async () => {
    if (!session || !url.trim()) {
      setError("Session not available or invalid URL");
      return;
    }

    setIsNavigating(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/browserbase/session/${session.session_id}/navigate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: url,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to navigate to URL");
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Navigation failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Navigation failed");
    } finally {
      setIsNavigating(false);
    }
  };

  const executeTask = async () => {
    if (!session || !task.trim()) {
      setError("Session not available or no task specified");
      return;
    }

    setIsExecutingTask(true);
    setError(null);
    setTaskResult(null);

    try {
      const response = await fetch(
        `/api/browserbase/session/${session.session_id}/task`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            task: task,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to execute Stagehand task");
      }

      const data = await response.json();
      if (data.success) {
        setTaskResult(
          JSON.stringify(data.result, null, 2) || "Task completed successfully",
        );
      } else {
        throw new Error(data.error || "Task execution failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Task execution failed");
    } finally {
      setIsExecutingTask(false);
    }
  };

  const closeSession = async () => {
    if (!session) return;

    try {
      const response = await fetch(
        `/api/browserbase/session/${session.session_id}`,
        {
          method: "DELETE",
        },
      );

      if (response.ok) {
        onSessionClosed?.(session.session_id);
        setSession(null);
      }
    } catch (err) {
      console.error("Error closing Browserbase session:", err);
    }
  };

  const openInNewTab = () => {
    if (session?.live_url) {
      window.open(session.live_url, "_blank");
    }
  };

  const formatTimeout = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    return `${minutes} minutes`;
  };

  return (
    <div className="w-full space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-500" />
            Browserbase + Stagehand AI
          </CardTitle>
          <CardDescription>
            Create intelligent browser sessions powered by Browserbase cloud
            infrastructure with Stagehand AI for natural language automation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* URL Input */}
          <div className="flex gap-2">
            <Input
              placeholder="Enter URL to navigate to..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isLoading || isNavigating}
            />
            {!session ? (
              <Button
                onClick={createBrowserbaseSession}
                disabled={isLoading}
                className="whitespace-nowrap bg-blue-600 hover:bg-blue-700"
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                <Zap className="h-4 w-4 mr-2" />
                Create Session
              </Button>
            ) : (
              <Button
                onClick={navigateToUrl}
                disabled={isNavigating}
                variant="outline"
                className="whitespace-nowrap"
              >
                {isNavigating && (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                )}
                <RefreshCw className="h-4 w-4 mr-2" />
                Navigate
              </Button>
            )}
          </div>

          {/* Stagehand AI Task Execution */}
          {session && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Tell Stagehand AI what to do (e.g., 'Search for diabetes treatment options and summarize the top 3 results')..."
                  value={task}
                  onChange={(e) => setTask(e.target.value)}
                  disabled={isExecutingTask}
                  className="flex-1"
                />
                <Button
                  onClick={executeTask}
                  disabled={isExecutingTask || !task.trim()}
                  className="whitespace-nowrap bg-green-600 hover:bg-green-700"
                >
                  {isExecutingTask && (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  )}
                  <Play className="h-4 w-4 mr-2" />
                  Execute with AI
                </Button>
              </div>

              {/* Task Result */}
              {taskResult && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <MessageSquare className="h-4 w-4 text-green-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-800">
                        Stagehand AI Result:
                      </p>
                      <pre className="text-sm text-green-700 mt-1 whitespace-pre-wrap bg-white/50 p-2 rounded border max-h-40 overflow-y-auto">
                        {taskResult}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Session Info */}
          {session && (
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className="bg-blue-100 text-blue-800"
                >
                  Browserbase Active
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Timeout: {formatTimeout(session.timeout_ms)}
                </span>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={openInNewTab}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Live URL
                </Button>
                <Button size="sm" variant="destructive" onClick={closeSession}>
                  <X className="h-4 w-4 mr-2" />
                  Close
                </Button>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Information Card */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <Globe className="h-4 w-4 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800">
                  How it works:
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  Browserbase provides cloud browser infrastructure while
                  Stagehand AI enables natural language control. The live
                  session URL lets you watch the automation in real-time.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Browser Iframe */}
      {session && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Live Browserbase Session
            </CardTitle>
            <CardDescription>
              Watch the browser automation in real-time. This session is powered
              by Browserbase cloud infrastructure.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <iframe
                src={session.iframe_embed.src}
                width={session.iframe_embed.width}
                height="600px"
                style={{
                  border: "none",
                  borderRadius: "8px",
                  backgroundColor: "#f8f9fa",
                }}
                title={session.iframe_embed.title}
                frameBorder="0"
                allowFullScreen={session.iframe_embed.allowfullscreen}
                className="w-full shadow-lg"
              />
            </div>

            {/* Session Instructions */}
            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Usage:</strong> {session.instructions.usage}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                <strong>Note:</strong> {session.instructions.note}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

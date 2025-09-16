"use client";

import { useState } from "react";
import { Bot, ExternalLink } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import BrowserbaseIframe from "@/components/browserbase-iframe";
import { RetractableSidebar } from "@/components/retractable-sidebar";

export default function BrowserbasePage() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <RetractableSidebar onOpenChange={setIsOpen} />

      <div
        className={`flex-1 flex flex-col transition-all duration-300 ease-out bg-background h-screen ${isOpen ? "ml-80" : "ml-0"}`}
      >
        <header className="sticky top-0 z-10 flex items-center justify-between py-4 px-6 pl-20 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <h1 className="text-lg font-bold tracking-tight">
              Ron AI - Browserbase Integration
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="https://browserbase.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              Browserbase.com
            </a>
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">
                Browserbase Live Sessions
              </h2>
              <p className="text-muted-foreground">
                Create browser sessions powered by Browserbase with Stagehand
                AI. These sessions run in the cloud with intelligent automation
                capabilities, perfect for complex web interactions that require
                natural language control.
              </p>
            </div>

            <div className="grid gap-6">
              <div className="bg-muted/20 border border-border/50 rounded-lg p-4">
                <h3 className="font-semibold mb-2">🚀 Browserbase Features</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>
                    • <strong>Stagehand AI Integration:</strong> Control
                    browsers using natural language
                  </li>
                  <li>
                    • <strong>Cloud Infrastructure:</strong> Reliable, scalable
                    browser automation
                  </li>
                  <li>
                    • <strong>Live Session URLs:</strong> Real-time visibility
                    into browser automation
                  </li>
                  <li>
                    • <strong>Advanced Stealth:</strong> Bypass bot detection
                    with sophisticated evasion
                  </li>
                  <li>
                    • <strong>Multi-Session Support:</strong> Manage multiple
                    browser instances simultaneously
                  </li>
                </ul>
              </div>

              <BrowserbaseIframe
                defaultUrl="https://google.com"
                onSessionCreated={(session) => {
                  console.log("Browserbase session created:", session);
                }}
                onSessionClosed={(sessionId) => {
                  console.log("Browserbase session closed:", sessionId);
                }}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

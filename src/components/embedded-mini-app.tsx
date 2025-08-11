"use client"

import { useState, useCallback } from "react"

interface EmbeddedMiniAppProps {
  liveUrl: string
  height?: number
}

export function EmbeddedMiniApp({ liveUrl, height = 600 }: EmbeddedMiniAppProps) {
  const [loaded, setLoaded] = useState(false)
  const onLoad = useCallback(() => setLoaded(true), [])

  return (
    <div className="miniapp-container">
      {!loaded && <div className="loader" aria-label="Loading app…" />}
      <iframe
        src={liveUrl}
        title="Mini App"
        className={`miniapp-iframe ${loaded ? "visible" : ""}`}
        loading="lazy"
        allow="clipboard-read; clipboard-write; fullscreen"
        referrerPolicy="no-referrer"
        onLoad={onLoad}
        style={{ height }}
      />
      <style jsx>{`
        .miniapp-container {
          position: relative;
          width: 100%;
          border-radius: 14px;
          overflow: hidden;
          background: #0d1b2a;
          border: 1px solid rgba(65,90,119,0.3);
          min-height: 420px;
        }
        .loader {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(1200px 600px at 10% 10%, rgba(65,90,119,0.35), transparent 40%),
            radial-gradient(1000px 500px at 90% 20%, rgba(39,64,96,0.35), transparent 45%),
            linear-gradient(120deg, #0d1b2a, #1b263b, #274060, #415a77, #778da9);
          background-size: 200% 200%;
          animation: gradientShift 6s ease-in-out infinite;
        }
        .miniapp-iframe {
          position: relative;
          width: 100%;
          border: 0;
          opacity: 0;
          transition: opacity 240ms ease;
        }
        .miniapp-iframe.visible { opacity: 1; }
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  )
}



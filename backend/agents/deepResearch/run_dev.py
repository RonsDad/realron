#!/usr/bin/env python3
"""
Development server with auto-reload for the backend API.
Watches for file changes and automatically restarts the server.
"""

import os
import sys
import subprocess
import time
from pathlib import Path
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

class ServerReloader(FileSystemEventHandler):
    def __init__(self):
        self.process = None
        self.start_server()
        
    def start_server(self):
        """Start the API server."""
        if self.process:
            print("🔄 Restarting server...")
            self.process.terminate()
            self.process.wait()
        else:
            print("🚀 Starting server...")
            
        self.process = subprocess.Popen(
            [sys.executable, "api.py"],
            cwd=Path(__file__).parent
        )
        
    def on_modified(self, event):
        """Restart server when Python files are modified."""
        if event.src_path.endswith('.py') and not event.is_directory:
            print(f"📝 Detected change in {event.src_path}")
            self.start_server()

def main():
    """Run the development server with auto-reload."""
    # Install watchdog if not present
    try:
        import watchdog
    except ImportError:
        print("📦 Installing watchdog for auto-reload...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "watchdog"])
        print("✅ Watchdog installed!")
        
    handler = ServerReloader()
    observer = Observer()
    
    # Watch the backend directory
    backend_dir = Path(__file__).parent
    observer.schedule(handler, str(backend_dir), recursive=True)
    observer.start()
    
    print(f"👀 Watching {backend_dir} for changes...")
    print("Press Ctrl+C to stop")
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
        if handler.process:
            handler.process.terminate()
    observer.join()

if __name__ == "__main__":
    main()
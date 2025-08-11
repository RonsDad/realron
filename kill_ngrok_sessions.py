#!/usr/bin/env python3
"""Kill all ngrok sessions and processes"""

import os
import subprocess
import time

def kill_ngrok_sessions():
    """Kill all ngrok processes and sessions"""
    
    print("Killing all ngrok processes...")
    
    # Kill by process name
    try:
        # Try killall first (Unix/Mac)
        subprocess.run(['killall', 'ngrok'], capture_output=True)
        print("✓ Killed ngrok processes via killall")
    except:
        pass
    
    # Kill any Python processes running telnyx-mcp-server with ngrok
    try:
        result = subprocess.run(['ps', 'aux'], capture_output=True, text=True)
        for line in result.stdout.split('\n'):
            if 'telnyx-mcp-server' in line and '--ngrok-enabled' in line:
                parts = line.split()
                if len(parts) > 1:
                    pid = parts[1]
                    subprocess.run(['kill', '-9', pid])
                    print(f"✓ Killed telnyx-mcp-server process {pid}")
    except Exception as e:
        print(f"Error killing processes: {e}")
    
    # Also try using ngrok SDK to disconnect
    try:
        import ngrok
        ngrok.disconnect()
        ngrok.kill()
        print("✓ Disconnected via ngrok SDK")
    except:
        pass
    
    time.sleep(2)
    print("All ngrok sessions should be cleared now.")
    print("You can verify at: https://dashboard.ngrok.com/tunnels/agents")

if __name__ == "__main__":
    kill_ngrok_sessions()
import { useState, useCallback, useRef, useEffect } from 'react';

interface ComputerUseResult {
  computer_results: any[];
  browser_results: any[];
  iframe_content: string[];
  needs_browser: boolean;
  success: boolean;
  message: string;
  error?: string;
}

interface ComputerUseRequest {
  message: string;
  enable_browser?: boolean;
  max_iterations?: number;
}

interface UseComputerUseOptions {
  baseUrl?: string;
  enableWebSocket?: boolean;
  onResult?: (result: ComputerUseResult) => void;
  onError?: (error: string) => void;
  onIframeContent?: (content: string) => void;
}

export const useComputerUse = (options: UseComputerUseOptions = {}) => {
  const {
    baseUrl = 'http://localhost:8001',
    enableWebSocket = false,
    onResult,
    onError,
    onIframeContent
  } = options;

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ComputerUseResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [iframeContent, setIframeContent] = useState<string[]>([]);
  
  const wsRef = useRef<WebSocket | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // WebSocket connection
  const connectWebSocket = useCallback(() => {
    if (!enableWebSocket) return;

    const wsUrl = baseUrl.replace('http', 'ws') + '/ws/computer-use';
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      console.log('WebSocket connected');
    };

    wsRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'status':
            // Handle status updates
            break;
          
          case 'result':
            if (data.success) {
              const newResult = data.data as ComputerUseResult;
              setResult(newResult);
              setError(null);
              onResult?.(newResult);
            } else {
              const errorMsg = data.message || 'Computer use failed';
              setError(errorMsg);
              onError?.(errorMsg);
            }
            setIsLoading(false);
            break;
          
          case 'iframe':
            const content = data.content;
            setIframeContent(prev => [...prev, content]);
            onIframeContent?.(content);
            break;
          
          case 'error':
            const errorMsg = data.message || 'Unknown error';
            setError(errorMsg);
            setIsLoading(false);
            onError?.(errorMsg);
            break;
        }
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };

    wsRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      setError('WebSocket connection error');
      setIsLoading(false);
    };

    wsRef.current.onclose = () => {
      console.log('WebSocket disconnected');
    };
  }, [baseUrl, enableWebSocket, onResult, onError, onIframeContent]);

  // Initialize WebSocket on mount
  useEffect(() => {
    if (enableWebSocket) {
      connectWebSocket();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connectWebSocket, enableWebSocket]);

  // Execute computer use request
  const executeComputerUse = useCallback(async (request: ComputerUseRequest) => {
    setIsLoading(true);
    setError(null);
    
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();

    try {
      if (enableWebSocket && wsRef.current?.readyState === WebSocket.OPEN) {
        // Use WebSocket for real-time updates
        wsRef.current.send(JSON.stringify(request));
      } else {
        // Use HTTP API
        const response = await fetch(`${baseUrl}/api/computer-use`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: ComputerUseResult = await response.json();
        
        setResult(data);
        setIframeContent(data.iframe_content || []);
        
        if (data.success) {
          onResult?.(data);
        } else {
          const errorMsg = data.error || 'Computer use failed';
          setError(errorMsg);
          onError?.(errorMsg);
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Request was cancelled
        return;
      }
      
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [baseUrl, enableWebSocket, onResult, onError]);

  // Execute healthcare-specific computer use
  const executeHealthcareComputerUse = useCallback(async (request: ComputerUseRequest) => {
    setIsLoading(true);
    setError(null);
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(`${baseUrl}/api/healthcare/computer-use`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ComputerUseResult = await response.json();
      
      setResult(data);
      setIframeContent(data.iframe_content || []);
      
      if (data.success) {
        onResult?.(data);
      } else {
        const errorMsg = data.error || 'Healthcare computer use failed';
        setError(errorMsg);
        onError?.(errorMsg);
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [baseUrl, onResult, onError]);

  // Take screenshot
  const takeScreenshot = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${baseUrl}/api/screenshot`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.iframe_content) {
        setIframeContent(prev => [...prev, data.iframe_content]);
        onIframeContent?.(data.iframe_content);
      }
      
      return data;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Screenshot failed';
      setError(errorMsg);
      onError?.(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [baseUrl, onError, onIframeContent]);

  // Execute browser action
  const executeBrowserAction = useCallback(async (action: string, params: Record<string, any> = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${baseUrl}/api/browser-action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, ...params }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.iframe_content) {
        setIframeContent(prev => [...prev, data.iframe_content]);
        onIframeContent?.(data.iframe_content);
      }
      
      return data;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Browser action failed';
      setError(errorMsg);
      onError?.(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [baseUrl, onError, onIframeContent]);

  // Clear iframe content
  const clearIframeContent = useCallback(async () => {
    try {
      await fetch(`${baseUrl}/api/iframe-content`, {
        method: 'DELETE',
      });
      
      setIframeContent([]);
    } catch (err) {
      console.error('Failed to clear iframe content:', err);
    }
  }, [baseUrl]);

  // Cancel current request
  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsLoading(false);
  }, []);

  // Refresh/retry last request
  const refresh = useCallback(() => {
    if (result) {
      // Re-execute the last successful request
      // This would need to store the last request parameters
      console.log('Refresh functionality would re-execute last request');
    }
  }, [result]);

  return {
    // State
    isLoading,
    result,
    error,
    iframeContent,
    
    // Actions
    executeComputerUse,
    executeHealthcareComputerUse,
    takeScreenshot,
    executeBrowserAction,
    clearIframeContent,
    cancelRequest,
    refresh,
    
    // WebSocket
    connectWebSocket,
    isWebSocketConnected: wsRef.current?.readyState === WebSocket.OPEN,
  };
};

export default useComputerUse;

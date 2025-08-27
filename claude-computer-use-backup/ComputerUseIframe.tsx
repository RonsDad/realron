import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Monitor, 
  Globe, 
  Code, 
  Image as ImageIcon, 
  Maximize2, 
  Minimize2,
  RefreshCw,
  Download,
  Eye,
  EyeOff
} from 'lucide-react';

interface ComputerUseResult {
  computer_results: any[];
  browser_results: any[];
  iframe_content: string[];
  needs_browser: boolean;
  success: boolean;
  message: string;
  error?: string;
  debuggerUrl?: string;
  debuggerFullscreenUrl?: string;
  sessionId?: string;
}

interface ComputerUseIframeProps {
  result?: ComputerUseResult;
  isLoading?: boolean;
  onRefresh?: () => void;
  className?: string;
  onDebuggerUrlReady?: (url: string) => void;
}

export const ComputerUseIframe: React.FC<ComputerUseIframeProps> = ({
  result,
  isLoading = false,
  onRefresh,
  className = "",
  onDebuggerUrlReady
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState("iframe");
  const [showRawData, setShowRawData] = useState(false);
  const iframeRefs = useRef<(HTMLIFrameElement | null)[]>([]);

  // Auto-expand when content is available
  useEffect(() => {
    if (result?.iframe_content && result.iframe_content.length > 0) {
      setIsExpanded(true);
    }
  }, [result?.iframe_content]);

  // Handle debugger URL when it becomes available
  useEffect(() => {
    if (result?.debuggerUrl && onDebuggerUrlReady) {
      console.log('[ComputerUseIframe] Debugger URL detected:', result.debuggerUrl);
      onDebuggerUrlReady(result.debuggerUrl);
    } else if (result?.debuggerFullscreenUrl && onDebuggerUrlReady) {
      console.log('[ComputerUseIframe] Fullscreen debugger URL detected:', result.debuggerFullscreenUrl);
      onDebuggerUrlReady(result.debuggerFullscreenUrl);
    }
  }, [result?.debuggerUrl, result?.debuggerFullscreenUrl, onDebuggerUrlReady]);

  const downloadIframeContent = (content: string, index: number) => {
    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `claude-computer-use-${index + 1}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'browser_navigation':
      case 'content_extracted':
        return <Globe className="w-4 h-4" />;
      case 'computer_screenshot':
        return <Monitor className="w-4 h-4" />;
      case 'javascript_executed':
        return <Code className="w-4 h-4" />;
      default:
        return <ImageIcon className="w-4 h-4" />;
    }
  };

  const getResultBadgeColor = (success: boolean, needsBrowser: boolean) => {
    if (!success) return "destructive";
    if (needsBrowser) return "default";
    return "secondary";
  };

  if (!result && !isLoading) {
    return (
      <Card className={`w-full ${className}`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Monitor className="w-4 h-4" />
            Claude Computer Use
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <Monitor className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No computer use results yet</p>
            <p className="text-sm">Claude will display desktop interactions and browser automation here</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`w-full transition-all duration-300 ${isExpanded ? 'min-h-[600px]' : ''} ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Monitor className="w-4 h-4" />
            Claude Computer Use Results
            {result && (
              <Badge variant={getResultBadgeColor(result.success, result.needs_browser)}>
                {result.success ? 'Success' : 'Error'}
              </Badge>
            )}
            {result?.needs_browser && (
              <Badge variant="outline" className="text-xs">
                <Globe className="w-3 h-3 mr-1" />
                Browser
              </Badge>
            )}
            {result?.debuggerUrl && (
              <Badge variant="secondary" className="text-xs">
                <Eye className="w-3 h-3 mr-1" />
                Live View Ready
              </Badge>
            )}
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {onRefresh && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRefresh}
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowRawData(!showRawData)}
            >
              {showRawData ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
          </div>
        </div>
        
        {result?.message && (
          <p className="text-sm text-muted-foreground mt-2">{result.message}</p>
        )}
        
        {result?.error && (
          <div className="mt-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-sm text-destructive">{result.error}</p>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Claude is working...</p>
              <p className="text-sm text-muted-foreground mt-1">
                Taking screenshots, clicking, typing, and browsing
              </p>
            </div>
          </div>
        ) : result ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="iframe" className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                Visual Results ({result.iframe_content?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="computer" className="flex items-center gap-2">
                <Monitor className="w-4 h-4" />
                Computer Actions ({result.computer_results?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="browser" className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Browser Actions ({result.browser_results?.length || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="iframe" className="mt-4">
              {result.iframe_content && result.iframe_content.length > 0 ? (
                <div className="space-y-4">
                  {result.iframe_content.map((content, index) => (
                    <Card key={index} className="overflow-hidden">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm flex items-center gap-2">
                            {getResultIcon('iframe')}
                            Result {index + 1}
                          </CardTitle>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => downloadIframeContent(content, index)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div 
                          className={`transition-all duration-300 ${
                            isExpanded ? 'h-96' : 'h-48'
                          }`}
                        >
                          <iframe
                            ref={(el) => (iframeRefs.current[index] = el)}
                            srcDoc={content}
                            className="w-full h-full border-0"
                            sandbox="allow-same-origin allow-scripts"
                            title={`Claude Computer Use Result ${index + 1}`}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No visual results available</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="computer" className="mt-4">
              <ScrollArea className="h-96">
                {result.computer_results && result.computer_results.length > 0 ? (
                  <div className="space-y-3">
                    {result.computer_results.map((action, index) => (
                      <Card key={index} className="p-3">
                        <div className="flex items-start gap-3">
                          <Monitor className="w-5 h-5 mt-0.5 text-muted-foreground" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="text-xs">
                                {action.role || 'Action'}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                Step {index + 1}
                              </span>
                            </div>
                            {showRawData ? (
                              <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                                {JSON.stringify(action, null, 2)}
                              </pre>
                            ) : (
                              <p className="text-sm">
                                {typeof action.content === 'string' 
                                  ? action.content 
                                  : JSON.stringify(action.content)
                                }
                              </p>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <Monitor className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No computer actions recorded</p>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="browser" className="mt-4">
              <ScrollArea className="h-96">
                {result.browser_results && result.browser_results.length > 0 ? (
                  <div className="space-y-3">
                    {result.browser_results.map((action, index) => (
                      <Card key={index} className="p-3">
                        <div className="flex items-start gap-3">
                          <Globe className="w-5 h-5 mt-0.5 text-muted-foreground" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="text-xs">
                                {action.type || 'Browser Action'}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                Action {index + 1}
                              </span>
                            </div>
                            {showRawData ? (
                              <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                                {JSON.stringify(action, null, 2)}
                              </pre>
                            ) : (
                              <div className="space-y-2">
                                {action.url && (
                                  <p className="text-sm">
                                    <strong>URL:</strong> {action.url}
                                  </p>
                                )}
                                {action.page_title && (
                                  <p className="text-sm">
                                    <strong>Title:</strong> {action.page_title}
                                  </p>
                                )}
                                {action.selector && (
                                  <p className="text-sm">
                                    <strong>Selector:</strong> {action.selector}
                                  </p>
                                )}
                                {action.error && (
                                  <p className="text-sm text-destructive">
                                    <strong>Error:</strong> {action.error}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <Globe className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No browser actions performed</p>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        ) : null}
      </CardContent>
    </Card>
  );
};

export default ComputerUseIframe;

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Brain, Search, FileText, Globe, Settings, X, User, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Mock messages for demonstration
const mockMessages = [
  {
    id: '1',
    role: 'user' as const,
    content: 'Hello! Can you help me understand the latest research on AI safety?',
    timestamp: new Date(),
  },
  {
    id: '2',
    role: 'assistant' as const,
    content: 'I\'d be happy to help you understand AI safety research! This is a rapidly evolving field with several key areas of focus:\n\n**Alignment Research**: Ensuring AI systems pursue intended goals without harmful side effects. Recent work includes Constitutional AI, RLHF (Reinforcement Learning from Human Feedback), and interpretability research.\n\n**Technical Safety**: Research on robustness, adversarial examples, and failure detection. Organizations like Anthropic, OpenAI, and DeepMind are making significant progress here.\n\n**Governance & Policy**: Developing frameworks for AI oversight, including recent initiatives like the EU AI Act and various national AI safety institutes.\n\nWould you like me to dive deeper into any of these areas?',
    timestamp: new Date(),
  },
];

const tools = [
  { icon: Brain, name: 'Deep Research', description: 'Advanced AI research analysis', color: 'bg-blue-500' },
  { icon: Search, name: 'Web Search', description: 'Search the internet', color: 'bg-green-500' },
  { icon: FileText, name: 'Document Analysis', description: 'Analyze PDFs and documents', color: 'bg-purple-500' },
  { icon: Globe, name: 'Web Scraping', description: 'Extract web data', color: 'bg-orange-500' },
  { icon: Sparkles, name: 'AI Agents', description: 'Deploy specialized agents', color: 'bg-pink-500' },
  { icon: Settings, name: 'Advanced Tools', description: 'More capabilities', color: 'bg-gray-500' },
];

export default function ModernChatPage() {
  const [messages, setMessages] = useState(mockMessages);
  const [input, setInput] = useState('');
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user' as const,
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = {
        id: (Date.now() + 1).toString(),
        role: 'assistant' as const,
        content: 'I understand you\'re asking about that topic. Let me provide you with a comprehensive analysis based on the latest research and data available...',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const MessageBubble = ({ message }: { message: typeof messages[0] }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-4 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
        message.role === 'user' 
          ? 'bg-gradient-to-br from-blue-500 to-blue-600' 
          : 'bg-gradient-to-br from-emerald-500 to-emerald-600'
      }`}>
        {message.role === 'user' ? <User size={18} /> : <Bot size={18} />}
      </div>

      {/* Message Content */}
      <div className={`flex-1 max-w-[85%] ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
        <div className={`inline-block p-4 rounded-3xl ${
          message.role === 'user'
            ? 'bg-blue-500 text-white ml-auto'
            : 'bg-gray-100 text-gray-900'
        } shadow-sm hover:shadow-md transition-shadow duration-300`}>
          <div className={`text-base leading-relaxed ${
            message.role === 'assistant' ? 'whitespace-pre-wrap' : ''
          }`}>
            {message.content}
          </div>
        </div>
        <div className={`text-xs text-gray-500 mt-2 ${
          message.role === 'user' ? 'text-right' : 'text-left'
        }`}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </motion.div>
  );

  const TypingIndicator = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-4"
    >
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center font-bold text-white">
        <Bot size={18} />
      </div>
      <div className="flex-1">
        <div className="inline-block p-4 rounded-3xl bg-gray-100 shadow-sm">
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-gray-400 rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );

  const hasMessages = messages.length > 0;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Ron AI</h1>
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-600">GPT-4 Enhanced</div>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={`pt-20 pb-32 ${hasMessages ? 'px-6' : ''}`}>
        {hasMessages ? (
          // Chat Messages View
          <div className="max-w-4xl mx-auto">
            <div className="space-y-8 py-8">
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
              {isTyping && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          </div>
        ) : (
          // Welcome Screen
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-20rem)] text-center px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-2xl"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-3xl flex items-center justify-center mb-8 mx-auto shadow-2xl">
                <Sparkles className="text-white" size={32} />
              </div>
              <h1 className="text-6xl font-bold text-gray-900 mb-6">
                Hello, Tim
              </h1>
              <p className="text-xl text-gray-600 mb-12 leading-relaxed">
                I'm Ron AI, your advanced healthcare research assistant. I can analyze medical literature, 
                provide clinical insights, and help with complex research queries. How can I assist you today?
              </p>
            </motion.div>
          </div>
        )}
      </main>

      {/* Input Area */}
      <div className={`fixed bottom-6 left-6 right-6 z-50 ${
        hasMessages ? '' : 'bottom-32'
      } transition-all duration-300`}>
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative"
          >
            {/* Input Box */}
            <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
              <div className="flex items-end p-4 gap-4">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything about healthcare, research, or medicine..."
                  className="flex-1 resize-none bg-transparent text-lg placeholder-gray-500 border-none outline-none min-h-[60px] max-h-32 py-2"
                  rows={1}
                  style={{ 
                    height: 'auto',
                    overflowY: input.split('\n').length > 2 ? 'scroll' : 'hidden'
                  }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = target.scrollHeight + 'px';
                  }}
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-blue-500 to-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl transition-all duration-300"
                >
                  <Send size={20} />
                </motion.button>
              </div>
            </div>

            {/* Suggestions (only show when no messages) */}
            {!hasMessages && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex flex-wrap gap-3 mt-6 justify-center"
              >
                {[
                  "Latest COVID-19 research updates",
                  "Drug interaction analysis",
                  "Clinical trial search",
                  "Medical literature review"
                ].map((suggestion, i) => (
                  <motion.button
                    key={i}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setInput(suggestion)}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-sm font-medium transition-colors duration-200"
                  >
                    {suggestion}
                  </motion.button>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Tools Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsToolsOpen(true)}
        className="fixed bottom-24 right-6 w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl shadow-2xl flex items-center justify-center z-50 hover:shadow-3xl transition-all duration-300"
      >
        <Sparkles size={24} />
      </motion.button>

      {/* Tools Modal */}
      <AnimatePresence>
        {isToolsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            onClick={() => setIsToolsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200 p-8 max-w-2xl w-full max-h-[80vh] overflow-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold text-gray-900">AI Tools</h2>
                <button
                  onClick={() => setIsToolsOpen(false)}
                  className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors duration-200"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Tools Grid */}
              <div className="grid grid-cols-2 gap-4">
                {tools.map((tool, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="p-6 bg-gray-50 hover:bg-gray-100 rounded-2xl border border-gray-200 text-left group transition-all duration-300 hover:shadow-lg"
                  >
                    <div className={`w-12 h-12 ${tool.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-200`}>
                      <tool.icon className="text-white" size={24} />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">{tool.name}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{tool.description}</p>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
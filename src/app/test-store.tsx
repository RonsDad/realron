'use client'

// Simple test component to verify Zustand store with provider pattern is working
import { useRonAIStore } from '@/providers/ron-ai-store-provider'

export default function TestStore() {
  // Test selecting specific values from store
  const messages = useRonAIStore((state) => state.messages)
  const isProcessing = useRonAIStore((state) => state.isProcessing)
  const setInputValue = useRonAIStore((state) => state.setInputValue)
  const inputValue = useRonAIStore((state) => state.inputValue)
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Zustand Store Test</h1>
      
      <div className="space-y-4">
        <div>
          <strong>Messages Count:</strong> {messages.length}
        </div>
        
        <div>
          <strong>Is Processing:</strong> {isProcessing ? 'Yes' : 'No'}
        </div>
        
        <div>
          <strong>Input Value:</strong> {inputValue || '(empty)'}
        </div>
        
        <div>
          <button 
            onClick={() => setInputValue('Test input from provider!')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Set Test Input
          </button>
        </div>
      </div>
    </div>
  )
}
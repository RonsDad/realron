import React, { useState } from 'react';

interface ComputerUseAgentProps {
  onTaskComplete?: (result: any) => void;
}

export const ComputerUseAgent: React.FC<ComputerUseAgentProps> = ({ onTaskComplete }) => {
  const [task, setTask] = useState('');
  const [status, setStatus] = useState('idle');
  const [isRunning, setIsRunning] = useState(false);

  const executeComputerTask = async () => {
    if (!task.trim()) return;
    
    setIsRunning(true);
    setStatus('running');
    
    try {
      const response = await fetch('/api/agents/computer-use', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool_name: 'official_computer_use',
          tool_input: {
            task: task,
            max_iterations: 10
          }
        })
      });
      
      const result = await response.json();
      setStatus(result.success ? 'completed' : 'error');
      setIsRunning(false);
      onTaskComplete?.(result);
      
    } catch (error) {
      setStatus('error');
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={task}
          onChange={(e) => setTask(e.target.value)}
          placeholder="Enter computer task"
          className="flex-1 p-2 border rounded"
          disabled={isRunning}
        />
        <button
          onClick={executeComputerTask}
          disabled={isRunning || !task.trim()}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          {isRunning ? 'Running...' : 'Execute'}
        </button>
      </div>
      
      <div className="text-sm text-gray-600">
        Status: {status}
      </div>

      <div className="border rounded">
        <div className="bg-gray-50 p-2 text-sm font-medium border-b">
          Desktop View
        </div>
        <iframe
          src="http://3.137.139.249:6080/vnc.html"
          width="100%"
          height="600"
          className="border-0"
        />
      </div>
    </div>
  );
};

import React from 'react';
import { ComputerUseAgent } from '../components/ComputerUseAgent';

export default function ComputerUsePage() {
  const handleTaskComplete = (result: any) => {
    console.log('Computer use task completed:', result);
    // Handle completion - show results, update UI, etc.
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Claude Computer Use</h1>
      <p className="text-gray-600 mb-6">
        Computer control interface. Enter a task and execute it on the remote desktop.
      </p>
      
      <ComputerUseAgent onTaskComplete={handleTaskComplete} />
      
      <div className="mt-6 text-sm text-gray-500">
        <h3 className="font-medium mb-2">Example desktop control tasks:</h3>
        <ul className="list-disc list-inside space-y-1">
          <li>"Take a screenshot and describe what you see on the desktop"</li>
          <li>"Open a text editor and create a new file"</li>
          <li>"Click on the Firefox icon and wait for it to load"</li>
          <li>"Use the file manager to create a new folder called 'test'"</li>
          <li>"Right-click on the desktop and open the context menu"</li>
        </ul>
      </div>
    </div>
  );
}

import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { task, max_iterations = 10 } = req.body;

  if (!task) {
    return res.status(400).json({ error: 'Task is required' });
  }

  try {
    // Call your backend computer use endpoint
    const response = await fetch(`${process.env.BACKEND_URL}/api/computer-use`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.API_TOKEN}`
      },
      body: JSON.stringify({
        task,
        max_iterations,
        tool_name: 'official_computer_use'
      })
    });

    const result = await response.json();
    res.status(200).json(result);

  } catch (error) {
    console.error('Computer use API error:', error);
    res.status(500).json({ 
      error: 'Computer use failed',
      details: error.message 
    });
  }
}

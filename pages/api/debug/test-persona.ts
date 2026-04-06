import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Test data for persona generation
    const testInput = `年龄范围：26-35岁
职业：互联网产品经理
兴趣：科技产品，职场成长，生活方式
内容偏好：专业干货，职场经验
表达风格：专业细致，亲切自然
内容长度：中等`;

    // Test the generate-persona API
    const response = await fetch('http://localhost:3000/api/generate-persona', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userInput: testInput
      })
    });

    const data = await response.json();

    res.status(200).json({
      success: true,
      message: 'Persona API test completed',
      result: data,
      timestamp: new Date().toISOString(),
      testInput
    });

  } catch (error) {
    console.error('Test error:', error);
    res.status(500).json({
      success: false,
      error: 'Test failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}
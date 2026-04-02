import { NextApiRequest, NextApiResponse } from 'next';
import { callLongCatAPI } from '../../../lib/api/longcat';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { prompt } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
      }
      
      // 调用大语言模型API生成总结
      const summary = await callLongCatAPI(prompt);
      
      res.status(200).json({ summary });
    } catch (error) {
      console.error('Error generating summary:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

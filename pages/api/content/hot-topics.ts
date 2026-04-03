import { NextApiRequest, NextApiResponse } from 'next';
import { TavilyService } from '../../../lib/services/tavilyService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const tavilyService = new TavilyService();
    const topics = await tavilyService.getHotTopics('小红书热门话题', '生活方式');

    res.status(200).json({
      success: true,
      data: topics
    });
  } catch (error) {
    console.error('Error fetching hot topics:', error);

    // Return default topics on error
    const defaultTopics = [
      {
        title: "2025春季穿搭趋势",
        tag: "时尚",
        heat: "95k",
        url: "https://www.xiaohongshu.com/search_result?keyword=2025春季穿搭"
      },
      {
        title: "办公室养生小妙招",
        tag: "职场",
        heat: "82k",
        url: "https://www.xiaohongshu.com/search_result?keyword=办公室养生"
      },
      {
        title: "周末短途旅行推荐",
        tag: "旅行",
        heat: "135k",
        url: "https://www.xiaohongshu.com/search_result?keyword=周末短途旅行"
      }
    ];

    res.status(200).json({
      success: true,
      data: defaultTopics
    });
  }
}
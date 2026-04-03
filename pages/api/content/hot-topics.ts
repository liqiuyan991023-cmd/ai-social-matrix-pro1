import { NextApiRequest, NextApiResponse } from 'next';
import { TavilyService } from '../../../lib/services/tavilyService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const tavilyService = new TavilyService();
    const hotTopics = await tavilyService.getHotTopics('小红书热门话题');
    
    res.status(200).json({
      success: true,
      data: hotTopics
    });
  } catch (error) {
    console.error('Error fetching hot topics:', error);
    
    // 返回默认热点话题
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

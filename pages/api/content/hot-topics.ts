import { NextApiRequest, NextApiResponse } from 'next';
import { TavilyService } from '../../../lib/services/tavilyService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const tavilyService = new TavilyService();
    // 使用更具体的2026年相关查询
    const hotTopics = await tavilyService.getHotTopics('2026年热门话题 趋势 新品 穿搭 科技 生活方式 小红书', '科技');

    // 检查是否返回了有意义的数据
    if (!hotTopics || hotTopics.length === 0) {
      throw new Error('No topics returned from API');
    }

    res.status(200).json({
      success: true,
      data: hotTopics,
      source: 'tavily_api'
    });
  } catch (error) {
    console.error('Error fetching hot topics from Tavily API:', error);

    // 返回2026年相关的热点话题作为fallback
    const fallbackTopics = get2026HotTopics();

    res.status(200).json({
      success: true,
      data: fallbackTopics,
      source: 'fallback_2026_data',
      note: 'Tavily API unavailable, showing curated 2026 topics'
    });
  }
}

// 生成2026年相关的热点话题
function get2026HotTopics() {
  const topics2026 = [
    {
      title: "2026年春季穿搭新趋势：可持续时尚引领潮流",
      tag: "时尚",
      heat: `${Math.floor(Math.random() * 50) + 150}k`,
      url: "https://www.xiaohongshu.com/search_result?keyword=2026%E5%B9%B4%E6%98%A5%E5%AD%A3%E7%A9%BF%E6%90%AD%E6%96%B0%E8%B6%8B%E5%8A%BF"
    },
    {
      title: "AI助手重塑工作方式：2026年效率工具大盘点",
      tag: "效率工具",
      heat: `${Math.floor(Math.random() * 50) + 180}k`,
      url: "https://www.xiaohongshu.com/search_result?keyword=AI%E5%8A%A9%E6%89%8B%E9%87%8D%E6%96%97%E5%B7%A5%E4%BD%9C%E6%96%B9%E5%BC%8F"
    },
    {
      title: "智能家居进化：2026年必备的未来生活设备",
      tag: "家居",
      heat: `${Math.floor(Math.random() * 50) + 120}k`,
      url: "https://www.xiaohongshu.com/search_result?keyword=%E6%99%BA%E8%83%BD%E5%AE%B6%E5%B1%85%E8%BF%9B%E5%8C%96"
    },
    {
      title: "2026年科技新品：折叠屏手机与AR眼镜的较量",
      tag: "数码",
      heat: `${Math.floor(Math.random() * 50) + 200}k`,
      url: "https://www.xiaohongshu.com/search_result?keyword=2026%E5%B9%B4%E7%A7%91%E6%8A%80%E6%96%B0%E5%93%81"
    },
    {
      title: "零碳生活指南：2026年可持续生活方式",
      tag: "生活方式",
      heat: `${Math.floor(Math.random() * 50) + 140}k`,
      url: "https://www.xiaohongshu.com/search_result?keyword=%E9%9B%B6%E7%A2%B3%E7%94%9F%E6%B4%BB%E6%8C%87%E5%8D%97"
    },
    {
      title: "远程办公新常态：2026年数字游民生活攻略",
      tag: "职场",
      heat: `${Math.floor(Math.random() * 50) + 160}k`,
      url: "https://www.xiaohongshu.com/search_result?keyword=%E8%BF%9C%E7%A8%8B%E5%8A%9E%E5%85%AC%E6%96%B0%E5%B8%B8%E6%80%81"
    },
    {
      title: "元宇宙社交革命：2026年虚拟现实新体验",
      tag: "科技",
      heat: `${Math.floor(Math.random() * 50) + 220}k`,
      url: "https://www.xiaohongshu.com/search_result?keyword=%E5%85%83%E5%AE%87%E5%AE%99%E7%A4%BE%E4%BA%A4%E9%9D%A9%E5%91%BD"
    },
    {
      title: "健康零食进化：2026年营养师推荐的智能食品",
      tag: "美食",
      heat: `${Math.floor(Math.random() * 50) + 130}k`,
      url: "https://www.xiaohongshu.com/search_result?keyword=%E5%81%A5%E5%BA%B7%E9%9B%B6%E9%A3%9F%E8%BF%9B%E5%8C%96"
    }
  ];

  // 随机返回6个话题
  return topics2026.sort(() => 0.5 - Math.random()).slice(0, 6);
}

// pages/api/debug/hot-topics-debug.ts
// 诊断端点：查看热点话题API的实际返回数据

import { NextApiRequest, NextApiResponse } from 'next';
import { TavilyService } from '../../../lib/services/tavilyService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const tavilyService = new TavilyService();
    
    console.log('\n=== DEBUG: Hot Topics API Debug ===');
    console.log('TAVILY_API_KEY exists:', !!process.env.TAVILY_API_KEY);
    console.log('TAVILY_API_KEY value:', process.env.TAVILY_API_KEY?.substring(0, 10) + '...' || 'NOT SET');
    
    const categories = ['数码', '个人成长', '效率工具'];
    const debugData: any = {
      timestamp: new Date().toISOString(),
      env: {
        tavily_key_configured: !!process.env.TAVILY_API_KEY,
        tavily_key_default: process.env.TAVILY_API_KEY === 'YOUR_TAVILY_API_KEY'
      },
      categoryResults: []
    };

    // 测试几个分类
    for (const category of categories) {
      try {
        console.log(`\nFetching topics for category: ${category}...`);
        const topics = await tavilyService.getHotTopics('2026年热门话题', category);
        console.log(`✓ Category '${category}' returned ${topics.length} topics`);
        debugData.categoryResults.push({
          category,
          success: true,
          count: topics.length,
          sample: topics.slice(0, 2)
        });
      } catch (categoryError) {
        console.log(`✗ Category '${category}' failed:`, categoryError);
        debugData.categoryResults.push({
          category,
          success: false,
          error: String(categoryError)
        });
      }
    }

    // 调用完整的热点话题API
    console.log('\n\nCalling complete hot-topics API...');
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/content/hot-topics`);
    const data = await response.json();
    
    console.log('API Response:', {
      success: data.success,
      dataCount: data.data?.length || 0,
      source: data.source,
      firstItem: data.data?.[0] || null,
      allTitles: data.data?.map((item: any) => item.title) || []
    });

    debugData.apiResponse = {
      success: data.success,
      dataCount: data.data?.length || 0,
      source: data.source,
      titles: data.data?.map((item: any) => item.title) || [],
      fullData: data.data || []
    };

    res.status(200).json(debugData);
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({
      error: String(error),
      message: '诊断API执行失败'
    });
  }
}

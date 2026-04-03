import { NextApiRequest, NextApiResponse } from 'next';
import { callLongCatAPI } from '../../../lib/api/longcat';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, creations, userProfile, feedbacks, userRequirements } = req.body;

    if (!prompt && !creations) {
      return res.status(400).json({ error: 'Prompt or creations required' });
    }

    // 构建完整的prompt
    const fullPrompt = prompt || `基于以下创作历史和反馈生成AI创作总结：

创作历史（${creations?.length || 0}条记录）：
${creations?.map((c: any) => `- ${c.title} (${c.topic?.category || '未分类'})`).join('\n') || '暂无创作记录'}

反馈信息：
${feedbacks?.map((f: any) => `- ${f.presetFeedback || f.customFeedback}`).join('\n') || '暂无反馈'}

用户要求：${userRequirements || '无特定要求'}

请从以下方面分析：
1. 创作主题偏好和趋势
2. 内容质量和用户反馈
3. 创作频率和活跃度
4. 改进建议和下一步计划

请用友好的语气输出总结，包含具体数据和建议。

如果创作历史为空，请直接输出："暂无创作记录，开始创作吧！"并给出一些创作建议。`;

    const summary = await callLongCatAPI(fullPrompt, { max_tokens: 1500 });

    res.status(200).json({
      success: true,
      summary,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Summary generation error:', error);
    res.status(500).json({
      error: '生成总结失败',
      details: error instanceof Error ? error.message : '未知错误'
    });
  }
}

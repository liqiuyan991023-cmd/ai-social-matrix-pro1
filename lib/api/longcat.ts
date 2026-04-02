import axios from 'axios';

// Real implementation that calls LongCat API
export async function callLongCatAPI(prompt: string, options: any = {}): Promise<string> {
  try {
    const response = await axios.post(
      `${process.env.LONGCAT_API_URL}/completions`,
      {
        prompt,
        max_tokens: options.max_tokens || 1000,
        temperature: options.temperature || 0.7,
        ...options
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.LONGCAT_API_KEY}`
        }
      }
    );

    return response.data.choices[0].text;
  } catch (error) {
    console.error('Error calling LongCat API:', error);
    // Fallback to mock response if API call fails
    return getMockResponse(prompt);
  }
}

// Mock response function for fallback
function getMockResponse(prompt: string): string {
  // Mock responses based on prompt content
  if (prompt.includes('生成3个吸引人的标题')) {
    return `✨ 10分钟快速早餐 recipes | 打工人必备\n🍎 健康早餐灵感 | 营养均衡一整天\n🌟 早餐不重样 | 一周7天早餐计划`;
  }

  if (prompt.includes('生成小红书笔记正文')) {
    return `大家好呀！今天想和大家分享一下我的早餐日常～\n\n作为一个上班族，每天早上时间都很紧张，所以我特别喜欢简单又营养的早餐。最近发现了几个超级方便的早餐组合，想分享给同样忙碌的你们！\n\n第一个是我的最爱：酸奶碗 + 水果 + 坚果。只需要5分钟，就能搞定一碗营养均衡的早餐。我通常会用希腊酸奶，加上蓝莓、香蕉和一把杏仁，简单又好吃！\n\n第二个是全麦吐司 + 牛油果 + 煎蛋。全麦吐司富含膳食纤维，牛油果提供健康脂肪，煎蛋则是优质蛋白质的来源。这个组合吃了特别扛饿，上午都不会觉得饿。\n\n第三个是燕麦粥 + 蜂蜜 + 肉桂粉。燕麦粥是冬季的绝佳选择，温暖又饱腹。我会在煮好的燕麦粥里加一勺蜂蜜，撒点肉桂粉，味道超级棒！\n\n这些早餐不仅做法简单，而且营养均衡，特别适合上班族。希望大家喜欢我的分享，也欢迎在评论区留言分享你们的早餐灵感哦！\n\n#早餐 #健康饮食 #上班族必备`;
  }

  if (prompt.includes('生成三类关键词')) {
    return `{
  "topic": ["早餐食谱", "健康饮食", "上班族早餐"],
  "search": ["简单早餐做法", "营养早餐搭配", "快速早餐食谱"],
  "tags": ["早餐", "健康饮食", "上班族必备", "营养均衡", "快手早餐"]
}`;
  }

  if (prompt.includes('生成创作人格画像')) {
    return `{
  "personality": "亲切友好，注重生活品质，喜欢分享实用的生活技巧",
  "tone": "温暖自然，口语化，像是和朋友聊天一样",
  "uniqueAngle": "从上班族的角度出发，分享简单实用的生活建议",
  "contentStrengths": ["实用性强", "内容具体", "情感共鸣", "易于执行"]
}`;
  }

  if (prompt.includes('生成10个适合在小红书创作的主题推荐')) {
    return `[
  {
    "id": "topic_1",
    "title": "5分钟快手早餐食谱",
    "contentAngle": "分享适合上班族的快速早餐做法",
    "category": "生活方式",
    "trendingScore": 85,
    "estimatedEngagement": 75,
    "matchScore": 90,
    "difficulty": "easy"
  },
  {
    "id": "topic_2",
    "title": "办公室解压小技巧",
    "contentAngle": "如何在工作中缓解压力",
    "category": "职场",
    "trendingScore": 78,
    "estimatedEngagement": 80,
    "matchScore": 85,
    "difficulty": "medium"
  },
  {
    "id": "topic_3",
    "title": "周末短途旅行推荐",
    "contentAngle": "城市周边2小时车程内的好去处",
    "category": "旅行",
    "trendingScore": 90,
    "estimatedEngagement": 85,
    "matchScore": 80,
    "difficulty": "medium"
  },
  {
    "id": "topic_4",
    "title": "职场新人必备技能",
    "contentAngle": "刚入职场需要掌握的软技能",
    "category": "职场",
    "trendingScore": 82,
    "estimatedEngagement": 78,
    "matchScore": 88,
    "difficulty": "medium"
  },
  {
    "id": "topic_5",
    "title": "平价好物分享",
    "contentAngle": "性价比高的日常生活用品",
    "category": "生活方式",
    "trendingScore": 88,
    "estimatedEngagement": 90,
    "matchScore": 75,
    "difficulty": "easy"
  },
  {
    "id": "topic_6",
    "title": "下班后的自我提升",
    "contentAngle": "利用业余时间学习新技能",
    "category": "学习",
    "trendingScore": 75,
    "estimatedEngagement": 70,
    "matchScore": 92,
    "difficulty": "hard"
  },
  {
    "id": "topic_7",
    "title": "健康生活小习惯",
    "contentAngle": "容易坚持的健康生活方式",
    "category": "生活方式",
    "trendingScore": 80,
    "estimatedEngagement": 75,
    "matchScore": 85,
    "difficulty": "easy"
  },
  {
    "id": "topic_8",
    "title": "职场穿搭指南",
    "contentAngle": "适合办公室的时尚穿搭",
    "category": "时尚",
    "trendingScore": 85,
    "estimatedEngagement": 88,
    "matchScore": 78,
    "difficulty": "medium"
  },
  {
    "id": "topic_9",
    "title": "家常菜菜谱分享",
    "contentAngle": "简单易做的家常菜谱",
    "category": "美食",
    "trendingScore": 82,
    "estimatedEngagement": 85,
    "matchScore": 80,
    "difficulty": "easy"
  },
  {
    "id": "topic_10",
    "title": "理财入门指南",
    "contentAngle": "新手如何开始理财",
    "category": "职场",
    "trendingScore": 78,
    "estimatedEngagement": 72,
    "matchScore": 88,
    "difficulty": "medium"
  }
]`;
  }

  if (prompt.includes('分析反馈并给出具体的优化建议')) {
    return `{
  "promptAdjustments": ["增加更多具体的例子和个人经历", "强调实用性和可操作性", "加入更多情感表达，增强共鸣"],
  "styleAdjustments": ["使用更亲切自然的口语化表达", "增加适当的emoji，提升阅读体验", "优化段落结构，使内容更易读"]
}`;
  }

  if (prompt.includes('基于反馈优化创作人格画像')) {
    return `{
  "personality": "亲切友好，注重生活品质，喜欢分享实用的生活技巧，更注重情感表达",
  "tone": "温暖自然，口语化，像是和朋友聊天一样，增加更多情感共鸣",
  "uniqueAngle": "从上班族的角度出发，分享简单实用的生活建议，加入更多个人经历和故事",
  "contentStrengths": ["实用性强", "内容具体", "情感共鸣", "易于执行", "故事性强"]
}`;
  }

  if (prompt.includes('基于以下用户的创作历史，生成一份AI创作总结')) {
    return `# 你的创作风格分析报告

## 创作风格特点

你的创作风格以实用主义为主，注重分享具体的生活技巧和经验。语言风格亲切自然，像是和朋友聊天一样，容易引起读者的共鸣。

## 创作优势

1. **实用性强**：你的内容都有很强的可操作性，读者可以直接应用到生活中。
2. **情感共鸣**：你善于从个人经历出发，分享真实的感受，容易引起读者的共鸣。
3. **结构清晰**：你的内容结构合理，逻辑清晰，易于阅读和理解。
4. **内容具体**：你喜欢分享具体的细节和例子，使内容更加生动可信。

## 改进建议

1. **增加多样性**：尝试在内容中加入更多不同类型的主题，丰富创作内容。
2. **提升互动性**：在内容中增加更多的互动元素，如提问、投票等，提高读者参与度。
3. **加强视觉效果**：注意内容的排版和视觉呈现，使用更多的表情符号和分割线，提升阅读体验。
4. **深化内容深度**：在分享实用技巧的同时，可以适当增加一些深度分析，提升内容的价值。

## 未来创作方向

基于你的创作历史，建议你可以尝试以下创作方向：

1. **系列化内容**：将相关主题的内容整理成系列，如「一周早餐系列」、「职场技能系列」等。
2. **专家访谈**：邀请相关领域的专家进行访谈，为读者提供更专业的建议。
3. **读者互动**：基于读者的问题和反馈，创作针对性的内容，提高读者粘性。

希望这份分析报告对你有所帮助，期待看到你更多精彩的创作！`;
  }

  // Default response
  return `This is a mock response for the prompt: ${prompt.substring(0, 100)}...`;
}

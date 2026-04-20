import { ContentGenerationService } from './lib/services/contentGenerationService';

// 测试 ContentGenerationService.generateContent 方法
async function testGenerateContent() {
  try {
    console.log('=== Testing ContentGenerationService.generateContent ===');
    
    const contentService = new ContentGenerationService();
    
    // 模拟用户画像
    const userProfile = {
      userId: 'test_user',
      ageRange: '26-35',
      profession: '创作者',
      interests: ['生活分享'],
      expertise: ['内容创作'],
      contentGoals: ['生活分享'],
      contentStyle: '亲切自然',
      preferredLength: 'medium'
    };
    
    // 模拟主题
    const topic = {
      id: 'default_topic',
      title: '生活分享',
      contentAngle: '分享生活中的美好瞬间',
      category: '生活方式'
    };
    
    // 测试用例：分享蒸鸡蛋做法
    const idea = '我想要分享一个美食做法，蒸鸡蛋';
    const title = '蒸鸡蛋做法分享';
    
    console.log('测试参数:');
    console.log('Idea:', idea);
    console.log('Title:', title);
    
    const content = await contentService.generateContent(userProfile, topic, title, undefined, idea);
    
    console.log('\n=== 生成结果 ===');
    console.log('Content length:', content.length);
    console.log('Content:', content);
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

testGenerateContent();
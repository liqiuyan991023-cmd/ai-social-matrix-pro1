import { UserProfileService } from '../lib/services/userProfileService.js';
import { ContentGenerationService } from '../lib/services/contentGenerationService.js';
import { StyleRagService } from '../lib/services/styleRagService.js';
import { StyleSummarizationService } from '../lib/services/styleSummarizationService.js';

// 测试完整的风格学习流程
async function testStyleLearningFlow() {
  console.log('=== 开始测试风格学习流程 ===\n');

  try {
    // 1. 初始化服务
    const userProfileService = new UserProfileService();
    const contentGenerationService = new ContentGenerationService();
    const styleRagService = new StyleRagService();
    const styleSummarizationService = new StyleSummarizationService();

    // 2. 测试用户配置文件创建
    console.log('1. 测试用户配置文件创建...');
    const testUser = {
      userId: 'test_user_123',
      ageRange: '25-35',
      profession: '软件工程师',
      interests: ['技术', '阅读', '旅行'],
      expertise: ['编程', 'AI', '前端开发'],
      contentGoals: ['分享技术知识', '记录生活感悟'],
      contentStyle: '专业而亲切',
      preferredLength: 'medium'
    };

    const profile = await userProfileService.createProfile(testUser);
    console.log('✓ 用户配置文件创建成功:', profile.userId);

    // 3. 测试内容生成
    console.log('\n2. 测试内容生成...');
    const testTopic = {
      id: 'test_topic_1',
      title: '如何提高编程效率',
      category: '技术',
      contentAngle: '分享实用的编程技巧',
      difficulty: 'medium',
      trendingScore: 80,
      matchScore: 90,
      estimatedEngagement: 75,
      similarAccounts: []
    };

    const titles = await contentGenerationService.generateTitle(profile, testTopic);
    console.log('✓ 标题生成成功:', titles[0]);

    const content = await contentGenerationService.generateContent(profile, testTopic, titles[0], undefined, '分享一些我平时提高编程效率的方法');
    console.log('✓ 内容生成成功，长度:', content.length);

    // 4. 测试创作保存
    console.log('\n3. 测试创作保存...');
    const creationId = await contentGenerationService.saveCreation(profile.userId, {
      title: titles[0],
      content: content,
      topic: testTopic
    });
    console.log('✓ 创作保存成功，ID:', creationId);

    // 5. 测试RAG检索
    console.log('\n4. 测试RAG检索...');
    const styleContext = await styleRagService.getStyleContext(profile.userId, '编程效率 技巧');
    console.log('✓ RAG检索成功，找到示例数:', styleContext.examples.length);

    // 6. 测试风格画像更新
    console.log('\n5. 测试风格画像更新...');
    await userProfileService.updateProfileFromCreations(profile.userId);
    const updatedProfile = await userProfileService.getProfile(profile.userId);
    console.log('✓ 风格画像更新成功，是否有创作人格:', !!updatedProfile.creativePersona);

    // 7. 测试反馈添加
    console.log('\n6. 测试反馈添加...');
    const feedback = {
      id: 'feedback_1',
      userId: profile.userId,
      creationId: creationId,
      feedbackType: 'custom',
      customFeedback: '内容很好，但是可以更具体一些',
      improvements: {
        promptAdjustments: [],
        styleAdjustments: ['增加具体的代码示例', '使用更口语化的表达']
      },
      applied: true,
      createdAt: Date.now()
    };

    const updatedCreation = await contentGenerationService.addFeedback(creationId, feedback);
    console.log('✓ 反馈添加成功，反馈数:', updatedCreation.feedback.length);

    // 8. 测试定期风格总结
    console.log('\n7. 测试定期风格总结...');
    await styleSummarizationService.updateUserStyleSummary(profile.userId);
    console.log('✓ 定期风格总结成功');

    // 9. 测试二次内容生成（验证风格学习效果）
    console.log('\n8. 测试二次内容生成（验证风格学习效果）...');
    const testTopic2 = {
      id: 'test_topic_2',
      title: 'AI技术的未来发展',
      category: '技术',
      contentAngle: '个人对AI未来的看法',
      difficulty: 'hard',
      trendingScore: 90,
      matchScore: 85,
      estimatedEngagement: 80,
      similarAccounts: []
    };

    const titles2 = await contentGenerationService.generateTitle(profile, testTopic2);
    const content2 = await contentGenerationService.generateContent(profile, testTopic2, titles2[0], undefined, '分享我对AI技术未来发展的看法');
    console.log('✓ 二次内容生成成功，长度:', content2.length);

    console.log('\n=== 风格学习流程测试完成 ===');
    console.log('所有测试步骤均已成功执行！');

  } catch (error) {
    console.error('测试过程中出现错误:', error);
  }
}

// 运行测试
testStyleLearningFlow();

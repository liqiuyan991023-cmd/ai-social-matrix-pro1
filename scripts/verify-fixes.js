/**
 * AI Social Matrix Pro1 - 修复验证测试脚本
 * 
 * 用于验证四个关键问题的修复效果
 * 执行方式: 在浏览器开发者工具Console中复制粘贴下面的测试代码
 * 
 * 或在 Next.js 应用中集成此脚本进行自动化测试
 */

// 测试1: 验证 Tavily API 热点话题加载
async function testHotTopicsAPI() {
  console.log('🧪 测试1: 验证热点话题API...');
  try {
    const response = await fetch('/api/content/hot-topics');
    const data = await response.json();
    
    if (data.success && data.data && data.data.length === 6) {
      console.log('✅ 热点话题API正常：返回6条热点话题');
      console.log('📊 数据来源:', data.source);
      console.log('📝 话题列表:', data.data.map(t => t.title));
      return true;
    } else {
      console.log('❌ 热点话题数据异常:', data);
      return false;
    }
  } catch (error) {
    console.log('❌ 热点话题API调用失败:', error);
    return false;
  }
}

// 测试2: 验证 localStorage 中的创作人格数据
function testCreativePersonaStorage() {
  console.log('\n🧪 测试2: 验证创作人格localStorage数据...');
  
  // 模拟用户ID
  const userId = localStorage.getItem('userId');
  if (!userId) {
    console.log('⚠️  未检测到userId，跳过测试');
    return false;
  }
  
  const personaKey = `creativePersona_${userId}`;
  const storedPersona = localStorage.getItem(personaKey);
  
  if (storedPersona) {
    try {
      const personaData = JSON.parse(storedPersona);
      if (personaData.personality) {
        console.log('✅ 创作人格数据结构正确');
        console.log('📝 人格描述:', personaData.personality.substring(0, 100) + '...');
        return true;
      }
    } catch (error) {
      console.log('❌ 创作人格数据解析失败:', error);
      return false;
    }
  } else {
    console.log('⚠️  localStorage中未找到创作人格数据');
    return false;
  }
}

// 测试3: 验证用户画像数据
function testUserProfileStorage() {
  console.log('\n🧪 测试3: 验证用户画像localStorage数据...');
  
  const userId = localStorage.getItem('userId');
  if (!userId) {
    console.log('⚠️  未检测到userId，跳过测试');
    return false;
  }
  
  const profileKey = `userProfile_${userId}`;
  const storedProfile = localStorage.getItem(profileKey);
  
  if (storedProfile) {
    try {
      const profileData = JSON.parse(storedProfile);
      const requiredFields = ['userId', 'ageRange', 'profession', 'interests', 'contentGoals', 'contentStyle'];
      const hasAllFields = requiredFields.every(field => field in profileData);
      
      if (hasAllFields) {
        console.log('✅ 用户画像数据结构完整');
        console.log('📝 用户信息:', {
          profession: profileData.profession,
          ageRange: profileData.ageRange,
          interests: profileData.interests.slice(0, 2).join(', ')
        });
        return true;
      } else {
        console.log('❌ 用户画像数据缺少字段');
        return false;
      }
    } catch (error) {
      console.log('❌ 用户画像数据解析失败:', error);
      return false;
    }
  } else {
    console.log('⚠️  localStorage中未找到用户画像数据');
    return false;
  }
}

// 测试4: 验证创作历史数据
function testCreationHistoryStorage() {
  console.log('\n🧪 测试4: 验证创作历史localStorage数据...');
  
  const storedCreations = localStorage.getItem('userCreations');
  
  if (storedCreations) {
    try {
      const creations = JSON.parse(storedCreations);
      if (Array.isArray(creations) && creations.length > 0) {
        console.log('✅ 创作历史数据正常');
        console.log(`📊 已保存 ${creations.length} 条创作记录`);
        console.log('📝 最新创作:', creations[0].title);
        return true;
      } else if (Array.isArray(creations)) {
        console.log('⚠️  创作历史为空（暂无创作记录）');
        return true;
      }
    } catch (error) {
      console.log('❌ 创作历史数据解析失败:', error);
      return false;
    }
  } else {
    console.log('⚠️  localStorage中未找到创作历史数据');
    return true; // 这不一定是错误，可能用户还没有创作过
  }
}

// 综合测试函数
async function runAllTests() {
  console.log('🚀 开始执行AI Social Matrix Pro1修复验证测试\n');
  console.log('=' .repeat(50));
  
  const results = {
    hotTopicsAPI: await testHotTopicsAPI(),
    creativePersona: testCreativePersonaStorage(),
    userProfile: testUserProfileStorage(),
    creationHistory: testCreationHistoryStorage()
  };
  
  console.log('\n' + '='.repeat(50));
  console.log('\n📋 测试总结:\n');
  
  let passCount = 0;
  for (const [test, passed] of Object.entries(results)) {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} - ${test}`);
    if (passed) passCount++;
  }
  
  console.log(`\n总计: ${passCount}/${Object.keys(results).length} 个测试通过`);
  
  if (passCount === Object.keys(results).length) {
    console.log('\n🎉 所有测试通过！修复验证成功！');
  } else {
    console.log('\n⚠️  部分测试未通过，请检查上面的详细日志');
  }
}

// 导出供外部调用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    testHotTopicsAPI,
    testCreativePersonaStorage,
    testUserProfileStorage,
    testCreationHistoryStorage,
    runAllTests
  };
}

// 自动执行
runAllTests();

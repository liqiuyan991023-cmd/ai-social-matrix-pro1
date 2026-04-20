import axios from 'axios';
import fs from 'fs';
import path from 'path';

const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = { };
envContent.split('\n').forEach(line => {
  if (line.trim() && !line.startsWith('#')) {
    const [key, value] = line.split('=').map(item => item.trim());
    envVars[key] = value;
  }
});

const apiUrl = envVars.LONGCAT_API_URL;
const apiKey = envVars.LONGCAT_API_KEY;
const model = envVars.LONGCAT_MODEL || 'LongCat-Flash-Thinking-2601';

const testPrompt = `# 内容创作任务

## 用户创作需求（这是最重要的）
我想要分享一个美食做法，蒸鸡蛋

请根据以上用户需求，生成一篇完整的原创内容。

## 风格指导
- 整体风格：亲切自然，像和朋友聊天
- 语气基调：轻松随性
- 长度偏好：中等长度

## 主题背景
- 主题：生活分享
- 角度：分享生活中的美好瞬间
- 分类：生活方式

## 重要指令
1. 严格围绕"我想要分享一个美食做法，蒸鸡蛋"这个具体需求来创作
2. 内容必须与用户需求高度相关，不能偏离主题
3. 风格要贴近用户的表达习惯
4. 语言口语化，有个人特色和真实情感
5. 结构清晰：开头吸引人，中间内容充实，结尾有互动性

## 输出要求
直接输出完整的原创内容，不需要解释说明。`;

async function testActualContentGeneration() {
  try {
    console.log('=== 测试实际内容生成 ===\n');

    const requestBody = {
      model: model,
      messages: [{ role: 'user', content: testPrompt }],
      max_tokens: 2000,
      temperature: 0.7
    };

    console.log('Sending request to LongCat API...');
    console.log('Model:', model);
    console.log('Max tokens: 2000\n');

    const response = await axios.post(apiUrl, requestBody, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      timeout: 120000
    });

    console.log('✅ API Call Successful!');
    console.log('Response status:', response.status);
    console.log('\n=== 完整响应 ===');
    console.log(JSON.stringify(response.data, null, 2));

    const content = response.data.choices?.[0]?.message?.content || '';
    const reasoning = response.data.choices?.[0]?.message?.reasoning_content || '';

    console.log('\n=== 分析 ===');
    console.log('content 字段长度:', content?.length || 0);
    console.log('reasoning_content 字段长度:', reasoning?.length || 0);

    if (content) {
      console.log('\n✅ 实际内容 (content):');
      console.log(content);
    } else if (reasoning) {
      console.log('\n⚠️ 没有 content，只有 reasoning_content:');
      console.log(reasoning.substring(0, 500) + '...');
    } else {
      console.log('\n❌ 没有任何内容');
    }

  } catch (error) {
    console.error('❌ API Call Failed:');
    console.error('Error message:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testActualContentGeneration();
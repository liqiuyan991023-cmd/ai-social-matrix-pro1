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

// 测试不同输入
const testCases = [
  '我想要分享一个美食做法，蒸鸡蛋',
  '分享我的小猫咪，它叫可乐',
  '今天发现一家超好吃的小吃店'
];

async function testContentGeneration() {
  for (const userInput of testCases) {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`测试输入: ${userInput}`);
    console.log('='.repeat(50));

    const prompt = `用户需求：${userInput}

请写一篇小红书风格的内容。

要求：
1. 只输出内容，不要输出思考过程
2. 内容要围绕用户需求
3. 口语化，亲切自然`;

    try {
      const requestBody = {
        model: model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1500,
        temperature: 0.7
      };

      const response = await axios.post(apiUrl, requestBody, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        timeout: 120000
      });

      const message = response.data.choices?.[0]?.message;
      const content = message?.content || '';
      const reasoning = message?.reasoning_content || '';

      console.log('\n【content 字段】');
      console.log('长度:', content.length);
      console.log('内容(前300字):', content.substring(0, 300));

      console.log('\n【reasoning_content 字段】');
      console.log('长度:', reasoning.length);
      console.log('内容(前300字):', reasoning.substring(0, 300));

      // 检查是否相关
      const isRelatedToInput = userInput.includes('蒸鸡蛋')
        ? (content.includes('蒸鸡蛋') || reasoning.includes('蒸鸡蛋'))
        : userInput.includes('猫咪')
        ? (content.includes('猫') || reasoning.includes('猫'))
        : userInput.includes('小吃店')
        ? (content.includes('小吃') || reasoning.includes('小吃'))
        : true;

      console.log('\n【验证】');
      console.log('是否与输入相关:', isRelatedToInput ? '✅' : '❌');

    } catch (error) {
      console.error('API 调用失败:', error.message);
    }
  }
}

testContentGeneration();
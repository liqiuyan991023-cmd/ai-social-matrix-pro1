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

// 修改后的 Prompt - 只输出内容，不要思考过程
const testPrompt = `我想要分享一个美食做法，蒸鸡蛋

请用口语化的方式写一篇小红书风格的内容，包含：
1. 开头吸引人
2. 中间详细步骤
3. 结尾有互动

风格：亲切自然，像和朋友聊天
长度：中等长度

直接输出内容，不要输出思考过程，不要输出解释。`;

async function testActualContentGeneration() {
  try {
    console.log('=== 测试简化版 Prompt ===\n');

    const requestBody = {
      model: model,
      messages: [{ role: 'user', content: testPrompt }],
      max_tokens: 3000,
      temperature: 0.7
    };

    console.log('Sending request to LongCat API...');

    const response = await axios.post(apiUrl, requestBody, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      timeout: 120000
    });

    console.log('✅ API Call Successful!');

    const message = response.data.choices?.[0]?.message;
    let actualContent = message?.reasoning_content || message?.content || '';

    // 尝试解码 UTF-8
    try {
      const buffer = Buffer.from(actualContent, 'utf-8');
      actualContent = buffer.toString('utf-8');
    } catch (e) {
      console.log('UTF-8 decode failed, using original');
    }

    console.log('\n=== reasoning_content (前500字) ===');
    console.log(actualContent.substring(0, 500));

    console.log('\n=== 分析 ===');
    if (actualContent.includes('蒸鸡蛋') || actualContent.includes('鸡蛋')) {
      console.log('✅ 内容与蒸鸡蛋相关');
    } else {
      console.log('⚠️ 内容可能不相关');
    }

    if (actualContent.includes('思考') || actualContent.includes('分析') || actualContent.includes('输出')) {
      console.log('⚠️ 内容包含思考过程');
    } else {
      console.log('✅ 内容不包含思考过程');
    }

  } catch (error) {
    console.error('❌ API Call Failed:');
    console.error('Error message:', error.message);
  }
}

testActualContentGeneration();
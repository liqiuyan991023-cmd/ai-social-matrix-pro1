import axios from 'axios';
import fs from 'fs';
import path from 'path';

const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  if (line.trim() && !line.startsWith('#')) {
    const [key, value] = line.split('=').map(item => item.trim());
    envVars[key] = value;
  }
});

const apiUrl = envVars.LONGCAT_API_URL;
const apiKey = envVars.LONGCAT_API_KEY;
const model = envVars.LONGCAT_MODEL || 'LongCat-Flash-Thinking-2601';

const prompt = `用户需求：我想要分享一个美食做法，蒸鸡蛋

请写一篇小红书风格的内容。要求：只输出内容，不要输出思考过程。`;

async function test() {
  try {
    console.log('测试输入: 蒸鸡蛋\n');

    const requestBody = {
      model: model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1000,
      temperature: 0.7
    };

    const response = await axios.post(apiUrl, requestBody, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      timeout: 60000
    });

    const message = response.data.choices?.[0]?.message;
    const content = message?.content || '';
    const reasoning = message?.reasoning_content || '';

    console.log('content 长度:', content.length);
    console.log('reasoning 长度:', reasoning.length);

    if (content && content.length > 10) {
      console.log('\n✅ content 内容:');
      console.log(content);
    }

    if (reasoning && reasoning.length > 10) {
      console.log('\n⚠️ reasoning 内容(前500字):');
      console.log(reasoning.substring(0, 500));
    }

  } catch (error) {
    console.error('失败:', error.message);
  }
}

test();
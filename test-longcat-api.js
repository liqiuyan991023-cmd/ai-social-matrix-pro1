import axios from 'axios';
import fs from 'fs';
import path from 'path';

// 读取 .env.local 文件
const envPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('Error: .env.local file not found');
  process.exit(1);
}

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

console.log('Testing LongCat API connection...');
console.log('API URL:', apiUrl);
console.log('API Key set:', !!apiKey);
console.log('Model:', model);

if (!apiUrl || !apiKey) {
  console.error('Missing API configuration');
  process.exit(1);
}

// 测试 API 调用
async function testLongCatAPI() {
  try {
    console.log('\n=== Testing LongCat API ===');
    
    const requestBody = {
      model: model,
      messages: [{ role: 'user', content: 'Hello, can you respond with a short test message?' }],
      max_tokens: 50,
      temperature: 0.7
    };

    const response = await axios.post(apiUrl, requestBody, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      timeout: 30000
    });

    console.log('✅ API Call Successful!');
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
    if (response.data.choices && response.data.choices[0] && response.data.choices[0].message) {
      const content = response.data.choices[0].message.content || response.data.choices[0].message.reasoning_content || '';
      console.log('\nGenerated content:', content);
    }
    
  } catch (error) {
    console.error('❌ API Call Failed:');
    console.error('Error message:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response status text:', error.response.statusText);
      console.error('Response data:', error.response.data);
    } else if (error.request) {
      console.error('No response received:', error.request);
    }
  }
}

testLongCatAPI();
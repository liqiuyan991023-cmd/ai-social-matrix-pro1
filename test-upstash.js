import { Redis } from '@upstash/redis';
import { Index } from '@upstash/vector';
import fs from 'fs';
import path from 'path';

// 加载环境变量
const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  if (line.trim() && !line.startsWith('#')) {
    const [key, value] = line.split('=').map(item => item.trim());
    envVars[key] = value;
  }
});

console.log('=== Upstash 服务检查 ===\n');

// 检查 Redis 配置
console.log('1. Upstash Redis 配置:');
console.log('   URL:', envVars.UPSTASH_REDIS_REST_URL ? '✅ 已配置' : '❌ 未配置');
console.log('   Token:', envVars.UPSTASH_REDIS_REST_TOKEN ? '✅ 已配置' : '❌ 未配置');

// 检查 Vector 配置
console.log('\n2. Upstash Vector 配置:');
console.log('   URL:', envVars.UPSTASH_VECTOR_REST_URL ? '✅ 已配置' : '❌ 未配置');
console.log('   Token:', envVars.UPSTASH_VECTOR_REST_TOKEN ? '✅ 已配置' : '❌ 未配置');

// 测试 Redis 连接
if (envVars.UPSTASH_REDIS_REST_URL && envVars.UPSTASH_REDIS_REST_TOKEN) {
  console.log('\n3. 测试 Redis 连接...');
  
  const redis = new Redis({
    url: envVars.UPSTASH_REDIS_REST_URL,
    token: envVars.UPSTASH_REDIS_REST_TOKEN,
  });
  
  redis.ping()
    .then(() => {
      console.log('   ✅ Redis 连接成功!');
    })
    .catch(error => {
      console.log('   ❌ Redis 连接失败:', error.message);
    })
    .finally(() => {
      // 测试 Vector 连接
      if (envVars.UPSTASH_VECTOR_REST_URL && envVars.UPSTASH_VECTOR_REST_TOKEN) {
        console.log('\n4. 测试 Vector 连接...');
        
        const vectorIndex = new Index({
          url: envVars.UPSTASH_VECTOR_REST_URL,
          token: envVars.UPSTASH_VECTOR_REST_TOKEN,
        });
        
        vectorIndex.info()
          .then(() => {
            console.log('   ✅ Vector 连接成功!');
          })
          .catch(error => {
            console.log('   ❌ Vector 连接失败:', error.message);
          })
          .finally(() => {
            console.log('\n=== 检查完成 ===');
          });
      } else {
        console.log('\n4. Vector 未配置，跳过测试');
        console.log('\n=== 检查完成 ===');
      }
    });
} else {
  console.log('\n3. Redis 未配置，跳过测试');
  console.log('\n4. Vector 未配置，跳过测试');
  console.log('\n=== 检查完成 ===');
}

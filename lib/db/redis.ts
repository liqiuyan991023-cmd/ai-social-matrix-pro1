import { Redis } from "@upstash/redis";

// 模拟Redis实现，用于本地开发环境
class MockRedis {
  private data: Map<string, string>;

  constructor() {
    this.data = new Map();
  }

  async get(key: string): Promise<string | null> {
    return this.data.get(key) || null;
  }

  async set(key: string, value: string): Promise<void> {
    this.data.set(key, value);
  }

  async del(key: string): Promise<void> {
    this.data.delete(key);
  }

  async lpush(key: string, ...values: string[]): Promise<void> {
    const existing = this.data.get(key) || "[]";
    const array = JSON.parse(existing);
    array.unshift(...values);
    this.data.set(key, JSON.stringify(array));
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    const existing = this.data.get(key) || "[]";
    const array = JSON.parse(existing);
    return array.slice(start, stop + 1);
  }

  async ltrim(key: string, start: number, stop: number): Promise<void> {
    const existing = this.data.get(key) || "[]";
    const array = JSON.parse(existing);
    const trimmed = array.slice(start, stop + 1);
    this.data.set(key, JSON.stringify(trimmed));
  }

  async keys(pattern: string): Promise<string[]> {
    const keys = Array.from(this.data.keys());
    // 简单的模式匹配实现
    const regex = new RegExp(pattern.replace(/\*/g, ".*"));
    return keys.filter(key => regex.test(key));
  }
}

// 检查环境变量是否配置
const isRedisConfigured = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;

// 尝试创建真实Redis客户端，如果失败则使用MockRedis
export let redis: any;

try {
  if (isRedisConfigured) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
    console.log('✅ Using real Upstash Redis');
  } else {
    throw new Error('Redis not configured');
  }
} catch (error) {
  console.warn('⚠️  Upstash Redis configuration error, falling back to MockRedis:', (error as Error).message);
  redis = new MockRedis();
}

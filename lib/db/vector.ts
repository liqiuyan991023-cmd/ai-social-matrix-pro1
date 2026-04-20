import { Index } from "@upstash/vector";

// 检查环境变量是否存在
const vectorUrl = process.env.UPSTASH_VECTOR_REST_URL;
const vectorToken = process.env.UPSTASH_VECTOR_REST_TOKEN;

export const vectorIndex = vectorUrl && vectorToken ? new Index({
  url: vectorUrl,
  token: vectorToken,
}) : null;

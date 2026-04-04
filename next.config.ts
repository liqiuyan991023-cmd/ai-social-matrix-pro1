import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // 环境变量配置
  env: {
    API_URL: process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
  },

  // 生产环境移除 console.log，减少包体积
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },

  // 隐藏 X-Powered-By 响应头，提升安全性
  poweredByHeader: false,

  // 配置构建目录
  distDir: ".next",

  // 配置静态文件服务
  staticPageGenerationTimeout: 60,
};

export default nextConfig;
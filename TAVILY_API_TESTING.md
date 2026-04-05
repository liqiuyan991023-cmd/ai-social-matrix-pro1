# Tavily API 测试和验证指南

## 环境变量配置

### 必需的环境变量
在 `.env.local` 文件中确保以下配置：

```bash
# Tavily API 配置
TAVILY_API_URL=https://api.tavily.com/v1
TAVILY_API_KEY=your_tavily_api_key_here

# Next.js 配置
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 获取Tavily API密钥
1. 访问 [Tavily官网](https://tavily.com)
2. 注册或登录账户
3. 在Dashboard中获取API密钥
4. 将密钥添加到 `.env.local` 文件

## API测试方法

### 1. 使用Postman测试

#### 直接测试Tavily API
```http
POST https://api.tavily.com/v1/search
Content-Type: application/json

{
  "api_key": "your_api_key",
  "query": "2026年趋势",
  "max_results": 3
}
```

#### 测试代理接口
```http
GET http://localhost:3000/api/tavily/hot-ideas
Content-Type: application/json
```

带参数测试：
```http
GET http://localhost:3000/api/tavily/hot-ideas?query=小红书热门话题&category=科技&maxResults=6
```

### 2. 使用cURL测试

#### 测试代理接口
```bash
curl -X GET "http://localhost:3000/api/tavily/hot-ideas" \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:3000"
```

#### 带参数测试
```bash
curl -X GET "http://localhost:3000/api/tavily/hot-ideas?query=2026%E5%B9%B4%E7%83%AD%E9%97%A8%E8%AF%9D%E9%A2%98&maxResults=6" \
  -H "Content-Type: application/json"
```

#### 测试跨域
```bash
curl -X OPTIONS "http://localhost:3000/api/tavily/hot-ideas" \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -i
```

### 3. 使用浏览器控制台测试

```javascript
// 在浏览器控制台运行
fetch('/api/tavily/hot-ideas')
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));
```

## 验证步骤

### 1. API连通性测试
```bash
# 使用API诊断接口
curl -X GET "http://localhost:3000/api/debug/api-diagnostics"
```

### 2. 测试各种场景

#### 正常场景
- ✅ 不带参数的请求
- ✅ 带查询参数的请求
- ✅ 带分类参数的请求
- ✅ 带数量参数的请求

#### 错误场景
- ✅ API密钥缺失或无效
- ✅ 网络超时
- ✅ 服务器错误
- ✅ 参数验证
- ✅ CORS预检请求

#### 缓存测试
- ✅ 相同参数的缓存返回
- ✅ 刷新参数跳过缓存
- ✅ 不同参数的独立缓存

## 关键注意点

### 1. 路由一致性
- 前端调用路径：`/api/tavily/hot-ideas`
- 后端API路径：`pages/api/tavily/hot-ideas.ts`
- 确保两者路径一致

### 2. 密钥安全
- ❌ 不要在前端代码中硬编码API密钥
- ✅ 使用环境变量存储密钥
- ✅ 通过后端代理转发请求
- ✅ 定期检查密钥有效性

### 3. 异常处理
- ✅ API调用超时（10秒）
- ✅ 网络错误处理
- ✅ 认证失败处理
- ✅ 速率限制处理
- ✅ 服务器错误降级

### 4. 跨域配置
- ✅ 允许的域名列表
- ✅ 预检请求处理
- ✅ 响应头设置
- ✅ 生产环境域名白名单

### 5. 性能优化
- ✅ 客户端缓存（5分钟）
- ✅ 服务端缓存机制
- ✅ 请求防抖
- ✅ 错误重试机制

## 监控和日志

### API调用日志格式
```json
{
  "timestamp": "2026-04-05T12:00:00.000Z",
  "level": "INFO",
  "message": "Tavily API call successful",
  "data": {
    "resultCount": 10,
    "topicsReturned": 6,
    "queryTime": 150
  }
}
```

### 错误日志
```json
{
  "timestamp": "2026-04-05T12:00:00.000Z",
  "level": "ERROR",
  "message": "Tavily API call failed",
  "data": {
    "error": "Network error",
    "code": "ECONNABORTED",
    "status": 408
  }
}
```

## 常见问题解决

### 1. 401 Unauthorized
- 检查TAVILY_API_KEY是否正确
- 确认密钥是否有访问权限
- 验证密钥格式

### 2. 403 Forbidden
- 检查域名是否在允许列表中
- 确认API密钥是否被限制
- 查看请求头是否正确

### 3. 429 Too Many Requests
- 客户端实现请求防抖
- 检查缓存是否正常工作
- 减少请求频率

### 4. 500 Internal Server Error
- 检查服务器日志
- 验证Tavily API状态
- 确认请求参数格式

### 5. CORS Error
- 检查Origin是否在允许列表
- 验证预检请求响应头
- 确认OPTIONS方法处理

## 部署检查清单

- [ ] 环境变量已配置
- [ ] API密钥已添加
- [ ] 跨域域名已设置
- [ ] 缓存机制已启用
- [ ] 错误处理已测试
- [ ] 日志记录已验证
- [ ] 性能测试已完成
- [ ] 安全设置已检查
- [ ] 文档已更新
- [ ] 监控已配置
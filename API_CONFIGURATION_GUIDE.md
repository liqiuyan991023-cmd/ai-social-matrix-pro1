# 🔧 环境配置调试指南

## 当前问题诊断

您遇到的所有4个问题都可以归结为 **API调用失败，系统回退到mock response**：

### 问题表现：
1. ❌ **人设生成页面显示mock response** - 应该是AI总结，实际是模拟数据
2. ❌ **内容生成显示"早餐日常"** - 内容不匹配用户要求  
3. ❌ **创作历史总结显示mock response** - 应该是真实总结，实际是模拟数据
4. ❌ **热点话题可能也回退到fallback** - 如果Tavily API未配置

### 根本原因：
```
callLongCatAPI() 调用失败 
  → 错误处理返回 getMockResponse()
    → 用户看到硬编码的mock数据（"早餐日常"等）
```

## 解决方案

### 1️⃣ 检查和配置必需的API

在项目根目录创建 `.env.local` 文件（如果不存在），内容如下：

```bash
# LongCat API Configuration (必需 - 用于AI内容生成)
LONGCAT_API_URL=https://api.longcat.io
LONGCAT_API_KEY=your_actual_api_key_must_be_set

# Tavily API Configuration (可选 - 用于热点话题)
TAVILY_API_URL=https://api.tavily.com/v1
TAVILY_API_KEY=your_actual_api_key_here

# Redis Configuration (可选 - 如果使用Upstash Redis)
REDIS_URL=your_redis_url_here
REDIS_TOKEN=your_redis_token_here
```

⚠️ **关键点：**
- `LONGCAT_API_KEY` 必须设置真实的API密钥（不能是示例值）
- `LONGCAT_API_URL` 通常是 `https://api.longcat.io`（但需确认您的LongCat服务商）
- 修改后需要重启Next.js开发服务器以加载新配置

### 2️⃣ 验证API配置是否正确

访问诊断页面：
```
http://localhost:3000/api/debug/api-diagnostics
```

这将显示：
- ✓ 所有环境变量是否已设置
- ✓ LongCat API是否可以成功调用
- ✓ Tavily API是否可以成功调用  
- ✓ 具体的错误信息（如配置不正确）

### 3️⃣ 常见错误及解决方案

#### 错误：`LONGCAT_API_KEY is NOT SET`
```
❌ [callLongCatAPI] CRITICAL: Missing API configuration!
   LONGCAT_API_URL: ✓ SET
   LONGCAT_API_KEY: ❌ NOT SET
```
**解决：** 在 `.env.local` 中设置 `LONGCAT_API_KEY`

#### 错误：`401 Unauthorized`
```
❌ [callLongCatAPI] FAILED: Error calling LongCat API
   status: 401
   🔐 Authentication Failed - Check LONGCAT_API_KEY validity
```
**解决：** 
- 检查API密钥是否正确（可能已过期或被撤销）
- 确保密钥完整无误（没有多余空格）
- 联系LongCat服务商获取新密钥

#### 错误：`404 Not Found`
```
❌ [callLongCatAPI] FAILED: Error calling LongCat API
   status: 404
   🌐 API Endpoint Not Found - Check LONGCAT_API_URL
```
**解决：** 
- 检查 `LONGCAT_API_URL` 是否正确
- 确保URL格式：`https://api.xxx.com`（不包含末尾的/）
- 如果使用自定义API服务，确保端点存在

#### 错误：`Connection Refused / Timeout`
```
❌ [callLongCatAPI] FAILED: Error calling LongCat API
   code: ECONNREFUSED
   📡 Connection Refused - API service may be down
```
**解决：**
- 检查网络连接
- 确认API服务是否在线
- 检查防火墙/代理设置是否阻止了连接
- 访问 `https://api.longcat.io` 确认服务可达

### 4️⃣ 调试步骤

#### 第1步：查看服务器日志
启动开发服务器并查看控制台：
```bash
npm run dev
```

重新调用相关功能（生成人设、生成内容等），在控制台应该能看到：
```
[callLongCatAPI] API Configuration Check: { urlSet: true, keySet: true }
[callLongCatAPI] 🔄 Calling LongCat API at: https://api.longcat.io
```

如果看到：
```
[callLongCatAPI] ❌ CRITICAL: Missing API configuration!
[callLongCatAPI] Using MOCK response due to missing API configuration
```
这说明API配置没有被正确加载。

#### 第2步：运行诊断工具
访问 `http://localhost:3000/api/debug/api-diagnostics` 查看详细报告

#### 第3步：测试具体功能
1. **测试人设生成：** 访问 `/onboarding` → 填表 → 点击"生成专属人设"
   - 应该看到AI生成的创作人格描述
   - 不应该看到"mock response"

2. **测试内容生成：** 访问 `/create` → 输入"分享秋季穿搭" → 点击"一键生成笔记"
   - 应该得到穿搭相关的内容
   - 不应该得到"早餐日常"等无关内容

3. **测试热点话题：** 访问 `/dashboard`
   - 应该看到6个话题（从Tavily API或fallback）
   - 检查浏览器的网络标签页验证API调用

## 验收标准

✅ **问题完全解决标志：**

1. **访问 `/api/debug/api-diagnostics` 显示：**
   ```json
   {
     "summary": {
       "longcatApiWorking": true,
       "tavilyApiWorking": true,
       "recommendations": ["✅ All APIs are properly configured and working!"]
     }
   }
   ```

2. **生成人设时：**
   - 页面显示真实的AI生成的创作人格描述
   - 不是"mock response"

3. **生成内容时：**
   - 内容与用户要求匹配（如要求穿搭，就生成穿搭内容）
   - 不是"早餐日常"等无关内容
   - 包含AI生成的标题、正文和关键词

4. **创作历史总结时：**
   - 显示基于真实创作记录的AI总结
   - 不是"mock response for the prompt"
   - 内容>600px时能够上下滑动查看

5. **热点话题：**
   - 显示6个话题（从Tavily API或supplemented fallback）
   - 能够点击打开链接

## 快速检查清单

- [ ] `.env.local` 文件已创建
- [ ] `LONGCAT_API_KEY` 已设置真实密钥
- [ ] `LONGCAT_API_URL` 已正确设置
- [ ] 访问 `/api/debug/api-diagnostics` 显示成功
- [ ] 服务器日志显示 ✅ SUCCESS（而不是❌ FAILED）
- [ ] 生成人设显示真实AI描述（而不是mock）
- [ ] 生成内容匹配用户要求（而不是"早餐日常"）
- [ ] 创作历史总结可以上下滑动

## 需要帮助？

如果问题仍未解决：
1. 访问 `/api/debug/api-diagnostics` 获取详细诊断报告
2. 检查浏览器开发者工具的 Network 标签页，查看具体的API请求和响应
3. 查看Next.js服务器的控制台输出，查找 `[callLongCatAPI]` 开头的日志


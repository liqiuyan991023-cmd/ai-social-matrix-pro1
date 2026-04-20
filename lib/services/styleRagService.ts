import { CreationRecord, UserProfile } from "../types";
import { vectorIndex } from "../db/vector";
import { callLongCatAPI } from "../api/longcat";

interface StyleEmbedding {
  id: string;
  userId: string;
  creationId: string;
  content: string;
  title: string;
  embedding: number[];
  createdAt: number;
}

export class StyleRagService {
  private readonly EMBEDDING_KEY = (creationId: string) => `style:embedding:${creationId}`;

  async generateEmbedding(text: string): Promise<number[]> {
    const prompt = `请为以下文本生成向量嵌入。只需输出纯数字数组，用逗号分隔，不要包含任何其他内容：

${text}`;
    
    try {
      const response = await callLongCatAPI(prompt);
      // 解析响应为数字数组
      const embedding = JSON.parse(response);
      if (Array.isArray(embedding) && embedding.every(item => typeof item === 'number')) {
        return embedding;
      }
      throw new Error('Invalid embedding format');
    } catch (error) {
      console.error('Error generating embedding:', error);
      // 返回默认嵌入（全零向量）
      return Array(768).fill(0);
    }
  }

  async storeCreationEmbedding(creation: CreationRecord): Promise<void> {
    try {
      // 生成嵌入
      const embedding = await this.generateEmbedding(`${creation.title}\n${creation.content}`);
      
      // 存储到向量数据库
      await vectorIndex.upsert({
        id: creation.id,
        vector: embedding,
        metadata: {
          userId: creation.userId,
          title: creation.title,
          content: creation.content,
          createdAt: creation.createdAt
        }
      });
    } catch (error) {
      console.error('Error storing creation embedding:', error);
      // 失败不影响主流程
    }
  }

  async retrieveStyleExamples(userId: string, query: string, limit: number = 3): Promise<CreationRecord[]> {
    try {
      // 生成查询嵌入
      const queryEmbedding = await this.generateEmbedding(query);
      
      // 检索相似内容
      const results = await vectorIndex.query({
        vector: queryEmbedding,
        topK: limit
      });
      
      // 过滤出指定用户的内容并转换为CreationRecord格式
      const creations: CreationRecord[] = [];
      
      for (const result of results) {
        if (result.metadata && typeof result.metadata.userId === 'string' && result.metadata.userId === userId) {
          creations.push({
            id: String(result.id),
            userId: result.metadata.userId,
            title: typeof result.metadata.title === 'string' ? result.metadata.title : '',
            content: typeof result.metadata.content === 'string' ? result.metadata.content : '',
            keywords: {
              topic: [],
              search: [],
              tags: []
            },
            topic: {
              id: "retrieved_topic",
              title: typeof result.metadata.title === 'string' ? result.metadata.title : '',
              category: "retrieved",
              difficulty: "easy",
              trendingScore: 0,
              matchScore: 0,
              estimatedEngagement: 0,
              contentAngle: "retrieved",
              similarAccounts: []
            },
            createdAt: typeof result.metadata.createdAt === 'number' ? result.metadata.createdAt : Date.now(),
            updatedAt: typeof result.metadata.createdAt === 'number' ? result.metadata.createdAt : Date.now()
          });
        }
      }
      
      return creations;
    } catch (error) {
      console.error('Error retrieving style examples:', error);
      return [];
    }
  }

  async getRecentCreations(userId: string, limit: number = 5): Promise<CreationRecord[]> {
    try {
      // 按时间戳检索最近的创作
      const results = await vectorIndex.query({
        vector: Array(768).fill(0), // 任意向量，主要通过过滤和排序
        topK: limit
      });
      
      // 过滤出指定用户的内容
      const userResults = results.filter(result => 
        result.metadata && 
        typeof result.metadata.userId === 'string' && 
        result.metadata.userId === userId
      );
      
      // 按创建时间降序排序
      userResults.sort((a, b) => {
        const aTime = typeof a.metadata?.createdAt === 'number' ? a.metadata.createdAt : 0;
        const bTime = typeof b.metadata?.createdAt === 'number' ? b.metadata.createdAt : 0;
        return bTime - aTime;
      });
      
      // 转换为CreationRecord格式
      const creations: CreationRecord[] = [];
      
      for (const result of userResults) {
        if (result.metadata) {
          creations.push({
            id: String(result.id),
            userId: typeof result.metadata.userId === 'string' ? result.metadata.userId : '',
            title: typeof result.metadata.title === 'string' ? result.metadata.title : '',
            content: typeof result.metadata.content === 'string' ? result.metadata.content : '',
            keywords: {
              topic: [],
              search: [],
              tags: []
            },
            topic: {
              id: "recent_topic",
              title: typeof result.metadata.title === 'string' ? result.metadata.title : '',
              category: "recent",
              difficulty: "easy",
              trendingScore: 0,
              matchScore: 0,
              estimatedEngagement: 0,
              contentAngle: "recent",
              similarAccounts: []
            },
            createdAt: typeof result.metadata.createdAt === 'number' ? result.metadata.createdAt : Date.now(),
            updatedAt: typeof result.metadata.createdAt === 'number' ? result.metadata.createdAt : Date.now()
          });
        }
      }
      
      return creations;
    } catch (error) {
      console.error('Error getting recent creations:', error);
      return [];
    }
  }

  async deleteCreationEmbedding(creationId: string): Promise<void> {
    try {
      await vectorIndex.delete(creationId);
    } catch (error) {
      console.error('Error deleting creation embedding:', error);
    }
  }

  async getStyleContext(userId: string, query: string, includeRecent: boolean = true): Promise<{
    examples: CreationRecord[];
    recentCreations: CreationRecord[];
  }> {
    const [examples, recentCreations] = await Promise.all([
      this.retrieveStyleExamples(userId, query),
      includeRecent ? this.getRecentCreations(userId) : Promise.resolve([])
    ]);
    
    return {
      examples,
      recentCreations
    };
  }
}

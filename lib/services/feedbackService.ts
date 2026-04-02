import { Feedback, CreationRecord } from "../types";
import { redis } from "../db/redis";

export class FeedbackService {
  private readonly FEEDBACK_KEY = (feedbackId: string) => `feedback:${feedbackId}`;
  private readonly CREATION_FEEDBACK_KEY = (creationId: string) => `creation:${creationId}:feedback`;

  async createFeedback(feedback: Omit<Feedback, "id" | "createdAt">): Promise<Feedback> {
    const feedbackId = `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fullFeedback: Feedback = {
      ...feedback,
      id: feedbackId,
      createdAt: Date.now()
    };

    try {
      await redis.set(this.FEEDBACK_KEY(feedbackId), JSON.stringify(fullFeedback));
      await redis.lpush(this.CREATION_FEEDBACK_KEY(feedback.creationId), feedbackId);
    } catch (error) {
      console.error('Error saving feedback to Redis:', error);
      // Redis 不可用时，继续执行，不影响用户体验
    }

    return fullFeedback;
  }

  async getFeedback(feedbackId: string): Promise<Feedback | null> {
    try {
      const data = await redis.get(this.FEEDBACK_KEY(feedbackId));
      return typeof data === 'string' ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting feedback from Redis:', error);
      return null;
    }
  }

  async getCreationFeedback(creationId: string): Promise<Feedback[]> {
    try {
      const feedbackIds = await redis.lrange(this.CREATION_FEEDBACK_KEY(creationId), 0, -1);
      const feedbacks: Feedback[] = [];

      for (const id of feedbackIds) {
        const feedback = await this.getFeedback(id);
        if (feedback) {
          feedbacks.push(feedback);
        }
      }

      return feedbacks;
    } catch (error) {
      console.error('Error getting creation feedback:', error);
      return [];
    }
  }

  async updateFeedback(feedbackId: string, updates: Partial<Feedback>): Promise<Feedback | null> {
    try {
      const feedback = await this.getFeedback(feedbackId);
      if (!feedback) return null;

      const updatedFeedback = {
        ...feedback,
        ...updates
      };

      await redis.set(this.FEEDBACK_KEY(feedbackId), JSON.stringify(updatedFeedback));
      return updatedFeedback;
    } catch (error) {
      console.error('Error updating feedback:', error);
      return null;
    }
  }

  async deleteFeedback(feedbackId: string): Promise<boolean> {
    try {
      const feedback = await this.getFeedback(feedbackId);
      if (!feedback) return false;

      await redis.del(this.FEEDBACK_KEY(feedbackId));
      await redis.lrem(this.CREATION_FEEDBACK_KEY(feedback.creationId), 1, feedbackId);
      return true;
    } catch (error) {
      console.error('Error deleting feedback:', error);
      return false;
    }
  }

  async markFeedbackAsApplied(feedbackId: string): Promise<Feedback | null> {
    return this.updateFeedback(feedbackId, { applied: true });
  }

  async getFeedbackStats(userId: string): Promise<{
    total: number;
    applied: number;
    pending: number;
  }> {
    try {
      // 这里简化处理，实际应该根据用户ID查询相关的反馈
      // 由于我们没有存储用户与反馈的直接关联，这里返回模拟数据
      return {
        total: 10,
        applied: 7,
        pending: 3
      };
    } catch (error) {
      console.error('Error getting feedback stats:', error);
      return {
        total: 0,
        applied: 0,
        pending: 0
      };
    }
  }
}

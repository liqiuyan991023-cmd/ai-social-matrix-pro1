import { UserProfile } from "@/lib/types";
import { callLongCatAPI } from "@/lib/api/longcat";
import { redis } from "@/lib/db/redis";

export class FeedbackService {
  private readonly FEEDBACK_KEY = (feedbackId: string) => \`feedback:\${feedbackId}\`;
  private readonly USER_SERVICE = new (require("@/lib/services/userProfileService").UserProfileService)();

  async processFeedback(feedbackData: {
    userId: string;
    creationId: string;
    feedbackType: "preset" | "custom";
    presetFeedback?: string[];
    customFeedback?: string;
  }): Promise<any> {
    const feedbackId = \`feedback_\${Date.now()}_\${Math.random().toString(36).substr(2, 9)}\`;

    const feedback = {
      id: feedbackId,
      ...feedbackData,
      createdAt: Date.now(),
      applied: false,
    };

    const improvements = await this.analyzeFeedback(feedback);
    feedback.improvements = improvements;

    await redis.set(this.FEEDBACK_KEY(feedbackId), JSON.stringify(feedback));

    await this.updateUserProfile(feedbackData.userId, improvements);

    return feedback;
  }

  private async analyzeFeedback(feedback: any): Promise<{
    promptAdjustments: string[];
    styleAdjustments: string[];
  }> {
    const feedbackText = feedback.customFeedback ||
                        feedback.presetFeedback?.join(", ") ||
                        "无具体反馈";

    const prompt = \`用户反馈：\${feedbackText}

请分析反馈并给出具体的优化建议：
1. Prompt调整建议（如何修改生成提示词）
2. 风格调整建议（如何调整创作风格）

输出JSON格式：
{
  "promptAdjustments": ["具体建议1", "具体建议2"],
  "styleAdjustments": ["具体建议1", "具体建议2"]
}

要求：
- 建议要具体可执行
- 针对小红书平台特点
- 考虑素人创作能力\`;

    const response = await callLongCatAPI(prompt, { temperature: 0.3 });
    return JSON.parse(response);
  }

  private async updateUserProfile(userId: string, improvements: any): Promise<void> {
    const profile = await this.USER_SERVICE.getProfile(userId);
    if (!profile || !profile.creativePersona) return;

    const updatePrompt = \`当前创作人格：
    \${JSON.stringify(profile.creativePersona, null, 2)}

用户反馈的优化建议：
\${JSON.stringify(improvements, null, 2)}

请基于反馈优化创作人格画像，输出更新后的JSON：
{
  "personality": "优化后的性格特点",
  "tone": "优化后的表达风格",
  "uniqueAngle": "优化后的独特角度",
  "contentStrengths": ["优化后的优势"]
}\`;

    try {
      const updatedPersonaJson = await callLongCatAPI(updatePrompt, { temperature: 0.4 });
      const updatedPersona = JSON.parse(updatedPersonaJson);

      await this.USER_SERVICE.updateProfile(userId, {
        creativePersona: updatedPersona,
      });
    } catch (error) {
      console.error("Failed to update user profile from feedback:", error);
    }
  }

  async getUserFeedback(userId: string, limit: number = 10): Promise<any[]> {
    const keys = await redis.keys("feedback:*");
    const feedbacks = [];

    for (const key of keys) {
      const feedback = await redis.get(key);
      if (feedback) {
        const parsed = JSON.parse(feedback);
        if (parsed.userId === userId) {
          feedbacks.push(parsed);
        }
      }
    }

    return feedbacks
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
  }
}

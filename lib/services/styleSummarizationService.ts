import { UserProfileService } from "./userProfileService";

// 定期风格总结服务
export class StyleSummarizationService {
  private userProfileService: UserProfileService;

  constructor() {
    this.userProfileService = new UserProfileService();
  }

  // 定期更新所有用户的表达风格画像
  async runPeriodicStyleSummary(): Promise<void> {
    try {
      console.log('Starting periodic style summarization task...');
      
      // 获取所有用户ID
      const userIds = await this.userProfileService.getAllUsers(100);
      
      console.log(`Found ${userIds.length} users to process`);
      
      // 逐个更新用户的表达风格画像
      for (const userId of userIds) {
        try {
          console.log(`Updating style profile for user: ${userId}`);
          await this.userProfileService.updateProfileFromCreations(userId);
          console.log(`Successfully updated style profile for user: ${userId}`);
        } catch (error) {
          console.error(`Error updating style profile for user ${userId}:`, error);
          // 继续处理下一个用户
          continue;
        }
      }
      
      console.log('Periodic style summarization task completed');
    } catch (error) {
      console.error('Error running periodic style summarization:', error);
    }
  }

  // 为特定用户更新表达风格画像
  async updateUserStyleSummary(userId: string): Promise<boolean> {
    try {
      console.log(`Updating style summary for user: ${userId}`);
      await this.userProfileService.updateProfileFromCreations(userId);
      console.log(`Successfully updated style summary for user: ${userId}`);
      return true;
    } catch (error) {
      console.error(`Error updating style summary for user ${userId}:`, error);
      return false;
    }
  }

  // 检查并更新长时间未更新的用户画像
  async checkAndUpdateStaleProfiles(daysThreshold: number = 7): Promise<void> {
    try {
      console.log('Checking for stale style profiles...');
      
      const userIds = await this.userProfileService.getAllUsers(100);
      const thresholdTime = Date.now() - (daysThreshold * 24 * 60 * 60 * 1000);
      
      for (const userId of userIds) {
        try {
          const profile = await this.userProfileService.getProfile(userId);
          
          if (profile && profile.creativePersona) {
            const personaGeneratedAt = new Date(profile.creativePersona.generatedAt).getTime();
            
            if (personaGeneratedAt < thresholdTime) {
              console.log(`Updating stale profile for user: ${userId}`);
              await this.userProfileService.updateProfileFromCreations(userId);
            }
          }
        } catch (error) {
          console.error(`Error checking profile for user ${userId}:`, error);
          continue;
        }
      }
      
      console.log('Stale profile check completed');
    } catch (error) {
      console.error('Error checking stale profiles:', error);
    }
  }
}

// 示例：如何使用这个服务
// const styleSummarizationService = new StyleSummarizationService();
// 
// // 手动触发所有用户的风格更新
// styleSummarizationService.runPeriodicStyleSummary().catch(console.error);
// 
// // 为特定用户更新风格
// styleSummarizationService.updateUserStyleSummary('user123').catch(console.error);
// 
// // 检查并更新 stale profiles
// styleSummarizationService.checkAndUpdateStaleProfiles(7).catch(console.error);

// 核心类型定义

export interface UserProfile {
  userId: string;
  ageRange: string;
  profession: string;
  interests: string[];
  expertise: string[];
  contentGoals: string[];
  contentStyle: string;
  preferredLength: "short" | "medium" | "long";
  creativePersona?: {
    personality: string;
    tone: string;
    uniqueAngle: string;
    contentStrengths: string[];
  };
  favoriteAccounts?: string[];
  createdAt: number;
  updatedAt: number;
}

export interface TopicRecommendation {
  id: string;
  title: string;
  category: string;
  difficulty: "easy" | "medium" | "hard";
  trendingScore: number;
  matchScore: number;
  estimatedEngagement: number;
  contentAngle: string;
  similarAccounts: string[];
}

export interface CreationRecord {
  id: string;
  title: string;
  content: string;
  keywords: {
    topic: string[];
    search: string[];
    tags: string[];
  };
  topic: TopicRecommendation;
  createdAt: number;
}

export interface Feedback {
  id: string;
  userId: string;
  creationId: string;
  feedbackType: "preset" | "custom";
  presetFeedback?: string[];
  customFeedback?: string;
  improvements?: {
    promptAdjustments: string[];
    styleAdjustments: string[];
  };
  applied: boolean;
  createdAt: number;
}

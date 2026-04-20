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
    personaSummary: string;
    ageRange: string;
    profession: string;
    interests: string[];
    contentStyle: string;
    contentGoals: string[];
    preferredLength: "short" | "medium" | "long";
    creativePurpose: string;
    targetAudience: string;
    personality: string;
    tone: string;
    uniqueAngle: string;
    contentStrengths: string[];
    languageFeatures: {
      sentenceStructure: string;
      vocabulary: string;
      rhetoric: string;
      emojiUsage: string;
      paragraphStructure: string;
    };
    recentTrends: string;
    feedbackIntegration: string;
    generatedAt: string;
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
  userId: string;
  title: string;
  content: string;
  keywords: {
    topic: string[];
    search: string[];
    tags: string[];
  };
  topic: TopicRecommendation;
  createdAt: number;
  updatedAt: number;
  feedback?: Feedback[];
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

export interface HotTopic {
  title: string;
  tag: string;
  heat: string;
  url: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

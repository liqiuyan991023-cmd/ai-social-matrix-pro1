export interface HotTopic {
  title: string;
  tag: string;
  heat: string;
  url: string;
}

export interface ApiResponse {
  success: boolean;
  data: HotTopic[];
  source: 'tavily_api' | 'fallback' | 'cache';
  cached?: boolean;
  timestamp?: string;
  error?: string;
  message?: string;
  meta?: {
    totalResults?: number;
    queryTime?: number;
    category?: string;
  };
  debug?: any;
}

export interface FetchOptions {
  query?: string;
  category?: string;
  maxResults?: number;
  refresh?: boolean;
}

export interface ErrorResponse {
  success: false;
  error: string;
  message: string;
  data: HotTopic[];
  source: 'fallback';
  timestamp: string;
}
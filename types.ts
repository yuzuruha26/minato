
export interface Cat {
  id: string;
  name: string;
  features: string;
  imageUrl: string;
  zoneId: string;
  pointId: string;
  subPointIds?: string[]; // 追加: 優先度の低いスポットID (最大3つ)
  lastFed?: string; // ISO Date string
  status: 'healthy' | 'injured' | 'sick' | 'unknown';
}

export interface Zone {
  id: string;
  name: string;
  description: string;
}

export interface FeedingPoint {
  id: string;
  name: string;
  zoneId: string;
  description?: string;
  lat?: number;
  lng?: number;
}

export interface Report {
  catId: string;
  fed: boolean;
  watered: boolean;
  condition: 'good' | 'bad' | 'injured';
  notes: string;
  urgentDetail?: string; // 要報告の詳細
  urgentPhoto?: string;  // 要報告の写真 (Base64)
  attentionDetail?: string; // 注意事項
  timestamp: number;
}

export interface AIAnalysisResult {
  isCat: boolean;
  quality: 'high' | 'low';
  features: string[];
  suggestedCatIds: string[];
  message: string;
}

export type UserRole = 'admin' | 'general';

export interface User {
  id: string;
  name: string;
  role: UserRole;
}

export interface Member {
  id: string;
  name: string;
  role: UserRole;
  phoneModel: string;      // スマホの機種
  availableHours: string;  // 活動可能時間
  membershipExpiry: string; // 餌やり活動員証【会員有効期限】 (YYYY-MM-DD)
  contactMethod: string;   // 管理者との現在連絡手段
}
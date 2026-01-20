
// Defined to match usage in Login, App, and components
export type UserRole = 'admin' | 'general';

export interface User {
  id: string;
  name: string;
  role: UserRole;
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
  lat?: number;
  lng?: number;
  lastWatered?: string;
}

export interface Cat {
  id: string;
  name: string;
  features: string;
  // Added imageUrl as it's heavily used in components (e.g., constants.ts, App.tsx, DailyReport.tsx)
  imageUrl: string;

  zoneId: string;
  pointId: string;
  subPointIds?: string[];

  status: 'healthy' | 'sick' | 'injured';
  // Added lastFed for tracking today's feeding status in App.tsx and CatStatus.tsx
  lastFed?: string;

  // 🔽 追加（重要）
  mainImagePath?: string;   // 表示用トップ画像
  aiImagePaths?: string[];  // AI類似判定用

  createdAt?: number;
  updatedAt?: number;
}

export interface Member {
  id: string;
  name: string;
  role: UserRole;
  phoneModel: string;
  availableHours: string;
  membershipExpiry: string;
  contactMethod: string;
}

export interface Report {
  catId: string;
  fed: boolean;
  watered: boolean;
  condition: string;
  notes: string;
  urgentDetail?: string;
  urgentPhoto?: string;
  attentionDetail?: string;
  timestamp: number;
}

export interface AIAnalysisResult {
  isCat: boolean;
  quality: 'high' | 'low';
  features: string[];
  suggestedCatIds: string[];
  message: string;
}

// Types for YugmiInspector React Native App

// Base types
export interface User {
  id: number;
  username: string;
  email: string;
  fullName?: string;
  role?: string;
  createdAt: string;
}

// Authentication types
export interface AuthCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  email: string;
  password: string;
  fullName: string;
  confirmPassword: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface MediaItem {
  id: number;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  type: 'image' | 'video';
  uri?: string;
  latitude?: number;
  isLocal?: boolean;
  longitude?: number;
  locationName?: string;
  locationAddress?: string;
  createdAt: string;
}

export interface AiAnalysis {
  id: number;
  mediaItemId: number;
  analysisText: string;
  detectedObjects?: string[];
  detectedIssues?: {
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    confidence: number;
  }[];
  confidence: number;
  createdAt: string;
}

export interface Report {
  id: number;
  title: string;
  type: string;
  status: 'draft' | 'pending' | 'completed';
  startDate?: string;
  endDate?: string;
  includeImages?: boolean;
  includeIssues?: boolean;
  includeLocation?: boolean;
  content?: {
    summary: string;
    mediaItems: number[];
    issues: number[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface MediaWithAnalysis extends MediaItem {
  analysis?: AiAnalysis;
}

// Stats interface
export interface Stats {
  imagesCount: number;
  videosCount: number;
  issuesCount: number;
}

// API Response interfaces
export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
}

export interface MediaListResponse {
  mediaItems: MediaWithAnalysis[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ReportsListResponse {
  reports: Report[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Location interfaces
export interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
  locationName?: string;
}

// Navigation types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  MediaDetail: { id: number };
  Profile: undefined;
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Camera: { mode?: 'photo' | 'video' } | undefined;
  Gallery: undefined;
  Reports: undefined;
  Profile: undefined;
  MediaDetail: { id: number };
};

// Media upload types
export interface MediaUploadData {
  file: Blob | File;
  latitude?: number;
  longitude?: number;
  locationName?: string;
  locationAddress?: string;
  userId?: number;
}

// Error types
export interface ApiError {
  message: string;
  code?: string;
  statusCode?: number;
}

// Local media types
export type LocalMedia = {
  id: string;
  type: 'image' | 'video';
  uri: string;
  isLocal: true;
  createdAt: string;
};
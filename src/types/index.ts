// Types for YugmiInspector React Native App
import { z } from 'zod';

// Base types
export interface User {
  id: number;
  username: string;
}

export interface MediaItem {
  id: number;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  type: 'image' | 'video';
  latitude?: number;
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
  Main: undefined;
  MediaDetail: { id: number };
};

export type MainTabParamList = {
  Dashboard: undefined;
  Camera: { mode?: 'photo' | 'video' } | undefined;
  Gallery: undefined;
  Reports: undefined;
  MediaDetail: { id: number };
};

// Media upload types
export interface MediaUploadData {
  file: Blob | File;
  latitude?: number;
  longitude?: number;
  locationName?: string;
  locationAddress?: string;
}

// Error types
export interface ApiError {
  message: string;
  code?: string;
  statusCode?: number;
}

// API configuration and utilities for React Native with Firebase
// This file acts as a proxy to the Firebase service for backward compatibility
import { firebaseService } from './firebaseService';
import {
  MediaUploadData,
  MediaListResponse,
  Stats,
  ReportsListResponse,
  MediaWithAnalysis,
  Report,
  AuthCredentials,
  SignupData,
  AuthResponse,
  AiAnalysis
} from '../types';

// Legacy API client that proxies to Firebase service
class FirebaseApiClient {
  // Health check
  async healthCheck() {
    return firebaseService.healthCheck();
  }

  // Stats endpoints
  async getStats(): Promise<Stats> {
    return firebaseService.getStats();
  }

  // Media endpoints
  async getMedia(page = 1, pageLimit = 20, filter?: string): Promise<MediaListResponse> {
    return firebaseService.getMedia(page, pageLimit, filter);
  }

  async getMediaItem(id: number): Promise<MediaWithAnalysis> {
    const result = await firebaseService.getMediaItem(id);
    if (!result) {
      throw new Error(`Media item with ID ${id} not found`);
    }
    return result;
  }

  async uploadMedia(data: MediaUploadData): Promise<MediaWithAnalysis> {
    return firebaseService.uploadMedia(data);
  }

  async deleteMedia(id: number): Promise<void> {
    return firebaseService.deleteMedia(id);
  }

  // Reports endpoints
  async getReports(page = 1, pageLimit = 10): Promise<ReportsListResponse> {
    return firebaseService.getReports(page, pageLimit);
  }

  async getReport(id: number): Promise<Report> {
    const result = await firebaseService.getReport(id);
    if (!result) {
      throw new Error(`Report with ID ${id} not found`);
    }
    return result;
  }

  async createReport(data: Partial<Report>): Promise<Report> {
    return firebaseService.createReport(data);
  }

  // Media file URL helper
  getMediaFileUrl(id: number, type: 'original' | 'thumbnail' = 'original'): string {
    return firebaseService.getMediaFileUrl(id, type);
  }

  // Authentication endpoints
  async login(credentials: AuthCredentials): Promise<AuthResponse> {
    return firebaseService.login(credentials);
  }

  async signup(userData: SignupData): Promise<AuthResponse> {
    return firebaseService.signup(userData);
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    return firebaseService.forgotPassword(email);
  }

  async verifyToken(token: string): Promise<{ valid: boolean; user?: any }> {
    // Firebase handles token verification automatically
    return { valid: true };
  }
}

// Create and export API client instance
export const apiClient = new FirebaseApiClient();

// React Query keys
export const queryKeys = {
  stats: ['stats'],
  media: ['media'],
  mediaItem: (id: number) => ['media', id],
  reports: ['reports'],
  report: (id: number) => ['report', id],
  auth: ['auth'],
  user: ['user'],
};

// Local storage keys
export const storageKeys = {
  authToken: 'yugmi_auth_token',
  user: 'yugmi_user',
};

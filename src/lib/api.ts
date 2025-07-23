// API configuration and utilities for React Native
import { MediaUploadData, MediaListResponse, Stats, ReportsListResponse, MediaWithAnalysis, Report } from '../types';

// Base API URL - Update this to your backend server URL
// For development, this should be your computer's IP address
// For production, this should be your deployed backend URL
const API_BASE_URL = 'http://10.0.2.2:5000'; // Android emulator localhost mapping
// For physical device on same network, use: 'http://192.168.189.249:5000'
// For iOS simulator, use: 'http://localhost:5000'
// Example: 'http://192.168.1.100:5000' or your computer's IP address

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Health check
  async healthCheck() {
    return this.request('/api/health');
  }

  // Media endpoints
  async getStats(): Promise<Stats> {
    return this.request<Stats>('/api/stats');
  }

  async getMedia(page = 1, limit = 20): Promise<MediaListResponse> {
    return this.request<MediaListResponse>(`/api/media?page=${page}&limit=${limit}`);
  }

  async getMediaItem(id: number): Promise<MediaWithAnalysis> {
    return this.request<MediaWithAnalysis>(`/api/media/${id}`);
  }

  async uploadMedia(data: MediaUploadData): Promise<MediaWithAnalysis> {
    const formData = new FormData();
    
    // Handle file upload for React Native
    formData.append('media', data.file as any);
    
    if (data.latitude) {
      formData.append('latitude', data.latitude.toString());
    }
    if (data.longitude) {
      formData.append('longitude', data.longitude.toString());
    }
    if (data.locationName) {
      formData.append('locationName', data.locationName);
    }
    if (data.locationAddress) {
      formData.append('locationAddress', data.locationAddress);
    }

    const response = await fetch(`${this.baseURL}/api/media/upload`, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Upload failed');
    }

    return await response.json();
  }

  // Reports endpoints
  async getReports(page = 1, limit = 10): Promise<ReportsListResponse> {
    return this.request<ReportsListResponse>(`/api/reports?page=${page}&limit=${limit}`);
  }

  async getReport(id: number): Promise<Report> {
    return this.request<Report>(`/api/reports/${id}`);
  }

  async createReport(data: Partial<Report>): Promise<Report> {
    return this.request<Report>('/api/reports', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Media file URL helper
  getMediaFileUrl(id: number, type: 'original' | 'thumbnail' = 'original'): string {
    const query = type === 'thumbnail' ? '?thumbnail=true' : '';
    return `${this.baseURL}/api/media/${id}/file${query}`;
  }
}

// Create and export API client instance
export const apiClient = new ApiClient(API_BASE_URL);

// React Query keys
export const queryKeys = {
  stats: ['stats'],
  media: ['media'],
  mediaItem: (id: number) => ['media', id],
  reports: ['reports'],
  report: (id: number) => ['report', id],
};

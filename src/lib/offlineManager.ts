// Offline Manager for YugmiInspector
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Network from 'expo-network';
import { MediaWithAnalysis, Report } from '../types';
import { apiClient } from './api';

interface OfflineData {
  pendingUploads: PendingUpload[];
  cachedMedia: MediaWithAnalysis[];
  cachedReports: Report[];
  lastSync: string;
}

interface PendingUpload {
  id: string;
  type: 'media' | 'report';
  data: any;
  timestamp: string;
  retryCount: number;
}

class OfflineManager {
  private readonly STORAGE_KEY = 'yugmi_offline_data';
  private readonly MAX_RETRY_COUNT = 3;
  private syncInterval: NodeJS.Timeout | null = null;

  async initialize() {
    // Start periodic sync when online
    this.startPeriodicSync();
    
    // Listen for network changes
    this.setupNetworkListener();
  }

  private setupNetworkListener() {
    // In a real implementation, you'd use NetInfo
    // import NetInfo from '@react-native-community/netinfo';
    setInterval(async () => {
      const networkState = await Network.getNetworkStateAsync();
      if (networkState.isConnected) {
        await this.syncPendingData();
      }
    }, 30000); // Check every 30 seconds
  }

  private startPeriodicSync() {
    this.syncInterval = setInterval(async () => {
      const networkState = await Network.getNetworkStateAsync();
      if (networkState.isConnected) {
        await this.syncPendingData();
      }
    }, 60000); // Sync every minute when online
  }

  async storeMediaOffline(mediaData: any): Promise<string> {
    const offlineData = await this.getOfflineData();
    const pendingUpload: PendingUpload = {
      id: `media_${Date.now()}`,
      type: 'media',
      data: mediaData,
      timestamp: new Date().toISOString(),
      retryCount: 0
    };

    offlineData.pendingUploads.push(pendingUpload);
    await this.saveOfflineData(offlineData);
    
    return pendingUpload.id;
  }

  async storeReportOffline(reportData: any): Promise<string> {
    const offlineData = await this.getOfflineData();
    const pendingUpload: PendingUpload = {
      id: `report_${Date.now()}`,
      type: 'report',
      data: reportData,
      timestamp: new Date().toISOString(),
      retryCount: 0
    };

    offlineData.pendingUploads.push(pendingUpload);
    await this.saveOfflineData(offlineData);
    
    return pendingUpload.id;
  }

  async getCachedMedia(): Promise<MediaWithAnalysis[]> {
    const offlineData = await this.getOfflineData();
    return offlineData.cachedMedia;
  }

  async getCachedReports(): Promise<Report[]> {
    const offlineData = await this.getOfflineData();
    return offlineData.cachedReports;
  }

  async syncPendingData(): Promise<void> {
    try {
      const offlineData = await this.getOfflineData();
      const successfulSyncs: string[] = [];

      for (const upload of offlineData.pendingUploads) {
        try {
          if (upload.type === 'media') {
            await apiClient.uploadMedia(upload.data);
          } else if (upload.type === 'report') {
            await apiClient.createReport(upload.data);
          }
          
          successfulSyncs.push(upload.id);
        } catch (error) {
          console.error(`Sync failed for ${upload.id}:`, error);
          upload.retryCount++;
          
          // Remove if max retries exceeded
          if (upload.retryCount >= this.MAX_RETRY_COUNT) {
            successfulSyncs.push(upload.id);
            console.warn(`Max retries exceeded for ${upload.id}, removing from queue`);
          }
        }
      }

      // Remove successfully synced items
      offlineData.pendingUploads = offlineData.pendingUploads.filter(
        upload => !successfulSyncs.includes(upload.id)
      );
      
      offlineData.lastSync = new Date().toISOString();
      await this.saveOfflineData(offlineData);

      console.log(`Synced ${successfulSyncs.length} items`);
    } catch (error) {
      console.error('Sync error:', error);
    }
  }

  async getPendingUploadCount(): Promise<number> {
    const offlineData = await this.getOfflineData();
    return offlineData.pendingUploads.length;
  }

  async clearCache(): Promise<void> {
    await AsyncStorage.removeItem(this.STORAGE_KEY);
  }

  private async getOfflineData(): Promise<OfflineData> {
    try {
      const data = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Error reading offline data:', error);
    }

    return {
      pendingUploads: [],
      cachedMedia: [],
      cachedReports: [],
      lastSync: new Date().toISOString()
    };
  }

  private async saveOfflineData(data: OfflineData): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving offline data:', error);
    }
  }

  cleanup() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
  }
}

export const offlineManager = new OfflineManager();

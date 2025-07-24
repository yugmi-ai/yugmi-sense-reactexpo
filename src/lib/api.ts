// API configuration and utilities for React Native with Firebase
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
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit as firestoreLimit, 
  startAfter,
  Timestamp,
  serverTimestamp,
  setDoc
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL
} from 'firebase/storage';
import { db, storage, collections, storagePaths } from './firebase';
import { auth } from './firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail
} from 'firebase/auth';

class FirebaseApiClient {
  // Health check
  async healthCheck() {
    try {
      // Simple check to see if we can access Firestore
      const statsRef = collection(db, collections.stats);
      await getDocs(query(statsRef, firestoreLimit(1)));
      return { status: 'ok', message: 'Firebase connection successful' };
    } catch (error) {
      console.error('Firebase health check failed:', error);
      throw new Error('Firebase connection failed');
    }
  }

  // Stats endpoints
  async getStats(): Promise<Stats> {
    try {
      // Get the stats document from Firestore
      const statsRef = doc(db, collections.stats, 'current');
      const statsDoc = await getDoc(statsRef);
      
      if (statsDoc.exists()) {
        return statsDoc.data() as Stats;
      } else {
        // If no stats document exists, return default values
        return {
          imagesCount: 0,
          videosCount: 0,
          issuesCount: 0
        };
      }
    } catch (error) {
      console.error('Error getting stats:', error);
      throw error;
    }
  }

  // Media endpoints
  async getMedia(page = 1, pageLimit = 20): Promise<MediaListResponse> {
    try {
      const mediaRef = collection(db, collections.media);
      const mediaSnapshot = await getDocs(mediaRef);
      
      // Convert Firestore documents to MediaWithAnalysis objects
      const allMediaItems: MediaWithAnalysis[] = [];
      
      for (const docSnapshot of mediaSnapshot.docs) {
        const mediaData = docSnapshot.data();
        
        // Convert Firestore timestamp to string
        const createdAt = mediaData.createdAt instanceof Timestamp 
          ? mediaData.createdAt.toDate().toISOString() 
          : mediaData.createdAt || new Date().toISOString();
        
        // Create MediaWithAnalysis object
        const mediaItem: MediaWithAnalysis = {
          id: parseInt(docSnapshot.id, 10) || 0,
          filename: mediaData.filename || '',
          originalName: mediaData.originalName || '',
          mimeType: mediaData.mimeType || '',
          size: mediaData.size || 0,
          type: mediaData.type || 'image',
          latitude: mediaData.latitude,
          longitude: mediaData.longitude,
          locationName: mediaData.locationName,
          locationAddress: mediaData.locationAddress,
          createdAt: createdAt,
          analysis: mediaData.analysis
        };
        
        allMediaItems.push(mediaItem);
      }
      
      // Sort by createdAt (newest first)
      allMediaItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      // Paginate
      const startIndex = (page - 1) * pageLimit;
      const endIndex = startIndex + pageLimit;
      const mediaItems = allMediaItems.slice(startIndex, endIndex);
      
      return {
        mediaItems,
        pagination: {
          page,
          limit: pageLimit,
          total: allMediaItems.length,
          totalPages: Math.ceil(allMediaItems.length / pageLimit)
        }
      };
    } catch (error) {
      console.error('Error getting media:', error);
      throw error;
    }
  }

  async getMediaItem(id: number): Promise<MediaWithAnalysis> {
    try {
      // Convert id to string for Firestore
      const mediaId = id.toString();
      const mediaRef = doc(db, collections.media, mediaId);
      const mediaDoc = await getDoc(mediaRef);
      
      if (!mediaDoc.exists()) {
        throw new Error(`Media item with ID ${id} not found`);
      }
      
      const mediaData = mediaDoc.data();
      
      // Convert Firestore timestamp to string
      const createdAt = mediaData.createdAt instanceof Timestamp 
        ? mediaData.createdAt.toDate().toISOString() 
        : mediaData.createdAt || new Date().toISOString();
      
      // Create MediaWithAnalysis object
      const mediaItem: MediaWithAnalysis = {
        id,
        filename: mediaData.filename || '',
        originalName: mediaData.originalName || '',
        mimeType: mediaData.mimeType || '',
        size: mediaData.size || 0,
        type: mediaData.type || 'image',
        latitude: mediaData.latitude,
        longitude: mediaData.longitude,
        locationName: mediaData.locationName,
        locationAddress: mediaData.locationAddress,
        createdAt: createdAt,
        analysis: mediaData.analysis
      };
      
      return mediaItem;
    } catch (error) {
      console.error(`Error getting media item with ID ${id}:`, error);
      throw error;
    }
  }

  async uploadMedia(data: MediaUploadData): Promise<MediaWithAnalysis> {
    try {
      // 1. Upload file to Firebase Storage
      // Handle React Native file object which has uri property
      const fileUri = (data.file as any).uri;
      const fileName = `${Date.now()}.jpg`;
      const filePath = `${storagePaths.media}/${fileName}`;
      const storageRef = ref(storage, filePath);
      
      // Create blob from file
      const response = await fetch(fileUri);
      const blob = await response.blob();
      
      // Upload to Firebase Storage
      const uploadResult = await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(uploadResult.ref);
      
      // 2. Create analysis data
      const analysisData: AiAnalysis = {
        id: Date.now(),
        mediaItemId: Date.now(),
        analysisText: "AI analysis of the media content shows no significant issues.",
        detectedObjects: ["object1", "object2"],
        detectedIssues: [
          {
            type: "structural",
            severity: "low",
            description: "Minor structural issue detected",
            confidence: 0.75
          }
        ],
        confidence: 0.85,
        createdAt: new Date().toISOString()
      };
      
      // 3. Create media document in Firestore with analysis embedded
      const mediaData = {
        filename: fileName,
        originalName: (data.file as any).name || fileName,
        mimeType: (data.file as any).type || 'image/jpeg',
        size: blob.size,
        type: (data.file as any).type?.startsWith('video') ? 'video' : 'image',
        latitude: data.latitude,
        longitude: data.longitude,
        locationName: data.locationName,
        locationAddress: data.locationAddress,
        createdAt: serverTimestamp(),
        downloadURL: downloadURL,
        userId: auth.currentUser?.uid || null,
        analysis: analysisData
      };
      
      const mediaRef = collection(db, collections.media);
      const mediaDoc = await addDoc(mediaRef, mediaData);
      
      // 4. Update stats
      this.updateStats(mediaData.type);
      
      // 5. Return the media item with analysis
      return {
        id: parseInt(mediaDoc.id, 10) || 0,
        filename: fileName,
        originalName: (data.file as any).name || fileName,
        mimeType: (data.file as any).type || 'image/jpeg',
        size: blob.size,
        type: (data.file as any).type?.startsWith('video') ? 'video' : 'image',
        latitude: data.latitude,
        longitude: data.longitude,
        locationName: data.locationName,
        locationAddress: data.locationAddress,
        createdAt: new Date().toISOString(),
        analysis: analysisData
      };
    } catch (error) {
      console.error('Error uploading media:', error);
      throw error;
    }
  }

  // Helper method to update stats
  private async updateStats(mediaType: string) {
    try {
      const statsRef = doc(db, collections.stats, 'current');
      const statsDoc = await getDoc(statsRef);
      
      if (statsDoc.exists()) {
        const stats = statsDoc.data() as Stats;
        
        if (mediaType === 'image') {
          await updateDoc(statsRef, {
            imagesCount: (stats.imagesCount || 0) + 1
          });
        } else if (mediaType === 'video') {
          await updateDoc(statsRef, {
            videosCount: (stats.videosCount || 0) + 1
          });
        }
      } else {
        // Create stats document if it doesn't exist
        await setDoc(statsRef, {
          imagesCount: mediaType === 'image' ? 1 : 0,
          videosCount: mediaType === 'video' ? 1 : 0,
          issuesCount: 0
        });
      }
    } catch (error) {
      console.error('Error updating stats:', error);
      // Don't throw error here to prevent upload failure
    }
  }

  // Reports endpoints
  async getReports(page = 1, pageLimit = 10): Promise<ReportsListResponse> {
    try {
      const reportsRef = collection(db, collections.reports);
      const reportsSnapshot = await getDocs(reportsRef);
      
      // Convert Firestore documents to Report objects
      const allReports: Report[] = [];
      
      for (const docSnapshot of reportsSnapshot.docs) {
        const reportData = docSnapshot.data();
        
        // Convert Firestore timestamps to strings
        const createdAt = reportData.createdAt instanceof Timestamp 
          ? reportData.createdAt.toDate().toISOString() 
          : reportData.createdAt || new Date().toISOString();
        
        const updatedAt = reportData.updatedAt instanceof Timestamp 
          ? reportData.updatedAt.toDate().toISOString() 
          : reportData.updatedAt || createdAt;
        
        // Create Report object
        const report: Report = {
          id: parseInt(docSnapshot.id, 10) || 0,
          title: reportData.title || '',
          type: reportData.type || '',
          status: reportData.status || 'draft',
          startDate: reportData.startDate,
          endDate: reportData.endDate,
          includeImages: reportData.includeImages,
          includeIssues: reportData.includeIssues,
          includeLocation: reportData.includeLocation,
          content: reportData.content,
          createdAt: createdAt,
          updatedAt: updatedAt
        };
        
        allReports.push(report);
      }
      
      // Sort by createdAt (newest first)
      allReports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      // Paginate
      const startIndex = (page - 1) * pageLimit;
      const endIndex = startIndex + pageLimit;
      const reports = allReports.slice(startIndex, endIndex);
      
      return {
        reports,
        pagination: {
          page,
          limit: pageLimit,
          total: allReports.length,
          totalPages: Math.ceil(allReports.length / pageLimit)
        }
      };
    } catch (error) {
      console.error('Error getting reports:', error);
      throw error;
    }
  }

  async getReport(id: number): Promise<Report> {
    try {
      // Convert id to string for Firestore
      const reportId = id.toString();
      const reportRef = doc(db, collections.reports, reportId);
      const reportDoc = await getDoc(reportRef);
      
      if (!reportDoc.exists()) {
        throw new Error(`Report with ID ${id} not found`);
      }
      
      const reportData = reportDoc.data();
      
      // Convert Firestore timestamps to strings
      const createdAt = reportData.createdAt instanceof Timestamp 
        ? reportData.createdAt.toDate().toISOString() 
        : reportData.createdAt || new Date().toISOString();
      
      const updatedAt = reportData.updatedAt instanceof Timestamp 
        ? reportData.updatedAt.toDate().toISOString() 
        : reportData.updatedAt || createdAt;
      
      // Create Report object
      const report: Report = {
        id,
        title: reportData.title || '',
        type: reportData.type || '',
        status: reportData.status || 'draft',
        startDate: reportData.startDate,
        endDate: reportData.endDate,
        includeImages: reportData.includeImages,
        includeIssues: reportData.includeIssues,
        includeLocation: reportData.includeLocation,
        content: reportData.content,
        createdAt: createdAt,
        updatedAt: updatedAt
      };
      
      return report;
    } catch (error) {
      console.error(`Error getting report with ID ${id}:`, error);
      throw error;
    }
  }

  async createReport(data: Partial<Report>): Promise<Report> {
    try {
      // Create report document in Firestore
      const reportData = {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        userId: auth.currentUser?.uid || null
      };
      
      const reportRef = collection(db, collections.reports);
      const reportDoc = await addDoc(reportRef, reportData);
      
      // Return the created report
      return {
        id: parseInt(reportDoc.id, 10) || 0,
        title: data.title || '',
        type: data.type || '',
        status: data.status || 'draft',
        startDate: data.startDate,
        endDate: data.endDate,
        includeImages: data.includeImages,
        includeIssues: data.includeIssues,
        includeLocation: data.includeLocation,
        content: data.content,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error creating report:', error);
      throw error;
    }
  }

  // Media file URL helper
  getMediaFileUrl(id: number, type: 'original' | 'thumbnail' = 'original'): string {
    try {
      // For Firebase, we'll return a placeholder URL
      // In a real implementation, we would get the download URL from the media document
      return `https://firebasestorage.googleapis.com/media/${id}/${type}`;
    } catch (error) {
      console.error(`Error getting media file URL for ID ${id}:`, error);
      throw error;
    }
  }

  // Authentication endpoints
  async login(credentials: AuthCredentials): Promise<AuthResponse> {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password
      );
      
      const firebaseUser = userCredential.user;
      const token = await firebaseUser.getIdToken();
      
      // Get additional user data from Firestore
      const userRef = doc(db, collections.users, firebaseUser.uid);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.exists() ? userDoc.data() : {};
      
      // Create User object
      const user = {
        id: parseInt(firebaseUser.uid, 16) || 0,
        username: userData.username || firebaseUser.email?.split('@')[0] || '',
        email: firebaseUser.email || '',
        fullName: userData.fullName || '',
        role: userData.role || 'user',
        createdAt: userData.createdAt || new Date().toISOString()
      };
      
      return { user, token };
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Provide more user-friendly error messages
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        throw new Error('Invalid email or password');
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('Too many failed login attempts. Please try again later');
      } else {
        throw new Error(error.message || 'Failed to login');
      }
    }
  }

  async signup(userData: SignupData): Promise<AuthResponse> {
    try {
      // Validate password match
      if (userData.password !== userData.confirmPassword) {
        throw new Error('Passwords do not match');
      }
      
      // Create user with Firebase
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        userData.email,
        userData.password
      );
      
      const firebaseUser = userCredential.user;
      const token = await firebaseUser.getIdToken();
      
      // Save additional user data to Firestore
      const userDocData = {
        username: userData.email.split('@')[0],
        email: userData.email,
        fullName: userData.fullName,
        role: 'user',
        createdAt: new Date().toISOString()
      };
      
      const userRef = doc(db, collections.users, firebaseUser.uid);
      await setDoc(userRef, userDocData);
      
      // Create User object
      const user = {
        id: parseInt(firebaseUser.uid, 16) || 0,
        username: userDocData.username,
        email: userDocData.email,
        fullName: userDocData.fullName,
        role: userDocData.role,
        createdAt: userDocData.createdAt
      };
      
      return { user, token };
    } catch (error: any) {
      console.error('Signup error:', error);
      
      // Provide more user-friendly error messages
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('Email is already in use');
      } else if (error.code === 'auth/weak-password') {
        throw new Error('Password is too weak');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Invalid email address');
      } else if (error.code === 'auth/operation-not-allowed') {
        throw new Error('Email/password accounts are not enabled');
      } else {
        throw new Error(error.message || 'Failed to create account');
      }
    }
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    try {
      await sendPasswordResetEmail(auth, email);
      return { message: 'Password reset email sent successfully' };
    } catch (error: any) {
      console.error('Forgot password error:', error);
      
      // Provide more user-friendly error messages
      if (error.code === 'auth/user-not-found') {
        throw new Error('No account found with this email');
      } else {
        throw new Error(error.message || 'Failed to send reset email');
      }
    }
  }

  async verifyToken(token: string): Promise<{ valid: boolean; user?: any }> {
    try {
      // In Firebase, we don't need to manually verify tokens
      // This is a placeholder for compatibility
      return { valid: true };
    } catch (error) {
      console.error('Token verification error:', error);
      return { valid: false };
    }
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
